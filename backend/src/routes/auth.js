import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import VerificationCode from '../models/VerificationCode.js';
import MobileAuthCode from '../models/MobileAuthCode.js';
import { sendVerificationEmail } from '../config/email.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const CODE_EXPIRY_MIN = parseInt(process.env.VERIFICATION_CODE_EXPIRY || '10', 10);

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function isAllowedRedirectUri(uri) {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  // Allow custom app schemes (mobile://, exp://, sherpamomo://, etc.); disallow http(s) for security
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
  return /^[a-zA-Z0-9+.-]+:\/\//.test(trimmed);
}

/** Request verification code - sends email */
router.post('/request-code', async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim()?.toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MIN * 60 * 1000);

    await VerificationCode.deleteMany({ email: normalizedEmail });
    await VerificationCode.create({ email: normalizedEmail, code, expiresAt });

    await sendVerificationEmail(normalizedEmail, code);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (err) {
    console.error('Request code error:', err);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/** Verify code and sign up / log in - returns JWT */
router.post('/verify', async (req, res) => {
  try {
    const { email, code, name, password, flow } = req.body;
    const normalizedEmail = email?.trim()?.toLowerCase();
    if (!normalizedEmail || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const record = await VerificationCode.findOne({
      email: normalizedEmail,
      code: String(code).trim(),
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    record.used = true;
    await record.save();

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.verified = true;
      await user.save({ validateBeforeSave: false });
    } else {
      if (flow === 'login') {
        return res.status(404).json({
          error: 'No account found for this email. Please sign up first.',
        });
      }
      if (!name || !password) {
        return res.status(400).json({
          error: 'New user: name and password are required for sign up',
        });
      }
      user = await User.create({
        email: normalizedEmail,
        name: name.trim(),
        password: password.trim(),
        verified: true,
        authProvider: 'local',
      });
    }

    const token = createToken(user._id);
    const userResponse = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      token,
      user: {
        _id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        verified: userResponse.verified,
        points: userResponse.points ?? 0,
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/** Login/Signup with Firebase user info */
router.post('/firebase', async (req, res) => {
  try {
    const { firebaseUid, email, name } = req.body;
    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'firebaseUid and email are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ firebaseUid }, { email: normalizedEmail }],
    });

    if (user) {
      user.firebaseUid = firebaseUid;
      user.email = normalizedEmail;
      if (name) user.name = name.trim();
      user.verified = true;
      user.authProvider = 'firebase';
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        firebaseUid,
        email: normalizedEmail,
        name: name?.trim() || normalizedEmail.split('@')[0],
        verified: true,
        authProvider: 'firebase',
      });
    }

    const token = createToken(user._id);
    const userResponse = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      token,
      user: {
        _id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        verified: userResponse.verified,
        points: userResponse.points ?? 0,
      },
    });
  } catch (err) {
    console.error('Firebase auth error:', err);
    res.status(500).json({ error: 'Firebase login failed' });
  }
});

// POST /api/auth/mobile-code - Create one-time code for mobile app (called by web after Google sign-in)
// Body: { firebaseUid, email?, name?, redirect_uri }. redirect_uri must be a custom scheme (e.g. mobile://, sherpamomo://)
router.post('/mobile-code', async (req, res) => {
  try {
    const { firebaseUid, email, name, redirect_uri: redirectUri } = req.body;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }
    if (!isAllowedRedirectUri(redirectUri)) {
      return res.status(400).json({
        error: 'redirect_uri is required and must be a custom app scheme (e.g. mobile:// or yourapp://)',
      });
    }

    let user = await User.findOne({ firebaseUid });
    if (!user) {
      const normalizedEmail =
        typeof email === 'string' && email.trim()
          ? email.trim().toLowerCase()
          : `${firebaseUid}@firebase.local`;
      user = await User.create({
        firebaseUid,
        email: normalizedEmail,
        name: typeof name === 'string' && name.trim() ? name.trim() : normalizedEmail.split('@')[0],
        verified: true,
        authProvider: 'firebase',
      });
      console.log('New mobile Google user created:', user._id.toString());
    }

    const code = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await MobileAuthCode.create({ code, userId: user._id, expiresAt });

    res.json({ code, redirect_uri: redirectUri.trim() });
  } catch (err) {
    console.error('Mobile code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/mobile/callback - Exchange one-time code for JWT (called by mobile app)
router.post('/mobile/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code is required' });
    }

    const record = await MobileAuthCode.findOne({ code }).exec();
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    if (record.expiresAt < new Date()) {
      await MobileAuthCode.deleteOne({ _id: record._id });
      return res.status(400).json({ error: 'Code expired' });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      await MobileAuthCode.deleteOne({ _id: record._id });
      return res.status(400).json({ error: 'User not found' });
    }

    await MobileAuthCode.deleteOne({ _id: record._id });

    const token = createToken(user._id);
    const userResponse = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        _id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        verified: userResponse.verified,
        points: userResponse.points ?? 0,
      },
    });
  } catch (err) {
    console.error('Mobile callback error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/** Login with email + password */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim()?.toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(user._id);
    const userResponse = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      token,
      user: {
        _id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        verified: userResponse.verified,
        points: userResponse.points ?? 0,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/** Reset password (forgot flow) - verifies code and updates password */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = email?.trim()?.toLowerCase();
    if (!normalizedEmail || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const record = await VerificationCode.findOne({
      email: normalizedEmail,
      code: String(code).trim(),
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    record.used = true;
    await record.save();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/** Get current user (protected) */
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').lean();
  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      points: user.points ?? 0,
    },
  });
});

/** Register Expo push token for the current user */
router.post('/push-token', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token is required' });
    }
    await User.findByIdAndUpdate(req.user._id, { expoPushToken: token.trim() });
    res.json({ success: true });
  } catch (err) {
    console.error('Push token error:', err);
    res.status(500).json({ error: 'Failed to save push token' });
  }
});

export default router;
