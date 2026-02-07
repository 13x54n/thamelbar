import express from 'express';
import User from '../models/User.js';
import KaraokeBooking from '../models/KaraokeBooking.js';
import PointTransaction from '../models/PointTransaction.js';
import Promo from '../models/Promo.js';
import MenuItem from '../models/MenuItem.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { sendNotificationEmail } from '../config/email.js';

const router = express.Router();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const SLOT_LABELS = { '18:00': '6:00 PM', '19:30': '7:30 PM', '21:00': '9:00 PM', '22:30': '10:30 PM', '00:00': '12:00 AM' };
const POINTS_PER_100 = 10;

async function sendPushToUser(expoPushToken, title, body) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ to: expoPushToken, title, body, sound: 'default' }]),
    });
  } catch (err) {
    console.error('Push send error:', err);
  }
}

router.use(requireAdmin);

/** GET /api/admin/stats – dashboard summary numbers */
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, activePromos, earnTransactions, totalBookings] = await Promise.all([
      User.countDocuments(),
      Promo.countDocuments({ active: true }),
      PointTransaction.aggregate([
        { $match: { type: 'earn' } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]),
      KaraokeBooking.countDocuments(),
    ]);
    const totalAmountTransacted = earnTransactions[0]?.totalAmount ?? 0;
    res.json({
      totalUsers,
      activePromos,
      totalAmountTransacted: Math.round(totalAmountTransacted * 100) / 100,
      totalKaraokeBookings: totalBookings,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/** GET /api/admin/users – list all users */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('name email points verified createdAt').sort({ createdAt: -1 }).lean();
    res.json({ users: users.map((u) => ({ ...u, id: u._id.toString() })) });
  } catch (err) {
    console.error('Admin users list error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/** GET /api/admin/karaoke-bookings – list all karaoke bookings */
router.get('/karaoke-bookings', async (req, res) => {
  try {
    const bookings = await KaraokeBooking.find({})
      .populate('user', 'name email')
      .sort({ date: 1, slot: 1 })
      .lean();
    res.json({
      bookings: bookings.map((b) => ({
        id: b._id.toString(),
        room: b.room,
        date: b.date,
        slot: SLOT_LABELS[b.slot] || b.slot,
        contactNumber: b.contactNumber,
        user: b.user ? { name: b.user.name, email: b.user.email } : null,
      })),
    });
  } catch (err) {
    console.error('Admin karaoke bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/** POST /api/admin/reward – add points by bill amount (from QR scan). 10 pts per $100. */
router.post('/reward', async (req, res) => {
  try {
    const { email, amount, offerId } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const billAmount = Number(amount);
    if (!(billAmount > 0)) {
      return res.status(400).json({ error: 'Valid bill amount is required' });
    }
    const points = Math.floor((billAmount / 100) * POINTS_PER_100);
    if (points > 0) {
      user.points = (user.points || 0) + points;
      await user.save();
      await PointTransaction.create({
        user: user._id,
        type: 'earn',
        amount: billAmount,
        points,
      });
      if (user.expoPushToken) {
        await sendPushToUser(
          user.expoPushToken,
          'Points earned',
          `You earned ${points} pts from your $${billAmount.toFixed(2)} purchase!`
        );
      }
    }
    res.json({
      success: true,
      user: { name: user.name, email: user.email, points: user.points ?? 0 },
      amount: billAmount,
      pointsAdded: points,
      offerApplied: !!offerId,
    });
  } catch (err) {
    console.error('Admin reward error:', err);
    res.status(500).json({ error: 'Failed to apply reward' });
  }
});

/** POST /api/admin/notify – send notification to users (email and/or push) */
router.post('/notify', async (req, res) => {
  try {
    const { target, emails, title, body, sendEmail, sendPush } = req.body;
    const titleStr = String(title || 'Thamel').trim();
    const bodyStr = String(body || '').trim();
    if (!titleStr && !bodyStr) {
      return res.status(400).json({ error: 'title or body is required' });
    }
    if (!sendEmail && !sendPush) {
      return res.status(400).json({ error: 'At least one of sendEmail or sendPush is required' });
    }

    let users;
    if (target === 'emails' && Array.isArray(emails) && emails.length > 0) {
      const normalized = emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean);
      users = await User.find({ email: { $in: normalized } }).select('email expoPushToken').lean();
    } else {
      users = await User.find({}).select('email expoPushToken').lean();
    }

    let emailCount = 0;
    let pushCount = 0;

    if (sendEmail) {
      for (const u of users) {
        if (u.email) {
          await sendNotificationEmail(u.email, titleStr || 'Thamel', bodyStr);
          emailCount++;
        }
      }
    }

    if (sendPush) {
      const pushMessages = users
        .filter((u) => u.expoPushToken && u.expoPushToken.startsWith('ExponentPushToken'))
        .map((u) => ({
          to: u.expoPushToken,
          title: titleStr,
          body: bodyStr,
          sound: 'default',
        }));
      if (pushMessages.length > 0) {
        const pushRes = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pushMessages),
        });
        if (!pushRes.ok) {
          console.error('Expo push error:', await pushRes.text());
        } else {
          pushCount = pushMessages.length;
        }
      }
    }

    res.json({
      success: true,
      emailCount,
      pushCount,
      userCount: users.length,
    });
  } catch (err) {
    console.error('Admin notify error:', err);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// —— Promos CRUD ——
function toPromoDto(p) {
  return {
    id: p._id.toString(),
    title: p.title,
    detail: p.detail,
    image: p.image,
    order: p.order ?? 0,
    active: p.active !== false,
    createdAt: p.createdAt,
  };
}

router.get('/promos', async (req, res) => {
  try {
    const promos = await Promo.find({}).sort({ order: 1, createdAt: 1 }).lean();
    res.json({ promos: promos.map(toPromoDto) });
  } catch (err) {
    console.error('Admin promos list error:', err);
    res.status(500).json({ error: 'Failed to fetch promos' });
  }
});

router.post('/promos', async (req, res) => {
  try {
    const { title, detail, image, order, active } = req.body;
    if (!title || !image) {
      return res.status(400).json({ error: 'title and image are required' });
    }
    const promo = await Promo.create({
      title: String(title).trim(),
      detail: detail != null ? String(detail).trim() : '',
      image: String(image).trim(),
      order: order != null ? Number(order) : 0,
      active: active !== false,
    });
    res.status(201).json({ promo: toPromoDto(promo) });
  } catch (err) {
    console.error('Admin promo create error:', err);
    res.status(500).json({ error: 'Failed to create promo' });
  }
});

router.put('/promos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, detail, image, order, active } = req.body;
    const promo = await Promo.findByIdAndUpdate(
      id,
      {
        ...(title != null && { title: String(title).trim() }),
        ...(detail != null && { detail: String(detail).trim() }),
        ...(image != null && { image: String(image).trim() }),
        ...(order != null && { order: Number(order) }),
        ...(typeof active === 'boolean' && { active }),
      },
      { new: true }
    );
    if (!promo) return res.status(404).json({ error: 'Promo not found' });
    res.json({ promo: toPromoDto(promo) });
  } catch (err) {
    console.error('Admin promo update error:', err);
    res.status(500).json({ error: 'Failed to update promo' });
  }
});

router.delete('/promos/:id', async (req, res) => {
  try {
    const promo = await Promo.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ error: 'Promo not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Admin promo delete error:', err);
    res.status(500).json({ error: 'Failed to delete promo' });
  }
});

// —— Food menu CRUD ——
function toMenuItemDto(m) {
  return {
    id: m._id.toString(),
    name: m.name,
    description: m.description ?? '',
    price: m.price != null ? m.price : '',
    image: m.image ?? '',
    category: m.category ?? 'starters',
    order: m.order ?? 0,
    active: m.active !== false,
    optionGroups: m.optionGroups ?? [],
    createdAt: m.createdAt,
  };
}

router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({}).sort({ category: 1, order: 1, createdAt: 1 }).lean();
    res.json({ menu: items.map(toMenuItemDto) });
  } catch (err) {
    console.error('Admin menu list error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

router.post('/menu', async (req, res) => {
  try {
    const { name, description, price, image, category, order, active, optionGroups } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const normalizedPrice = price != null ? (typeof price === 'number' ? price : (String(price).trim() || null)) : null;
    const item = await MenuItem.create({
      name: String(name).trim(),
      description: description != null ? String(description).trim() : '',
      price: normalizedPrice,
      image: image != null ? String(image).trim() : '',
      category: category != null ? String(category).trim() : 'starters',
      order: order != null ? Number(order) : 0,
      active: active !== false,
      ...(Array.isArray(optionGroups) && { optionGroups }),
    });
    res.status(201).json({ menuItem: toMenuItemDto(item) });
  } catch (err) {
    console.error('Admin menu create error:', err);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

router.put('/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, order, active, optionGroups } = req.body;
    const updates = {};
    if (name != null) updates.name = String(name).trim();
    if (description != null) updates.description = String(description).trim();
    if (price != null) updates.price = typeof price === 'number' ? price : (String(price).trim() || null);
    if (image != null) updates.image = String(image).trim();
    if (category != null) updates.category = String(category).trim();
    if (order != null) updates.order = Number(order);
    if (typeof active === 'boolean') updates.active = active;
    if (Array.isArray(optionGroups)) updates.optionGroups = optionGroups;
    const item = await MenuItem.findByIdAndUpdate(id, updates, { new: true });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ menuItem: toMenuItemDto(item) });
  } catch (err) {
    console.error('Admin menu update error:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Admin menu delete error:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
