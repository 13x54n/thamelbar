import nodemailer from 'nodemailer';

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('SMTP not configured. Emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendVerificationEmail(to, code) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[DEV] Verification code for ${to}: ${code}`);
    return { success: true, devMode: true };
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || 'noreply@thamel.com',
    to,
    subject: 'Your Thamel Toronto verification code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${code}</p>
        <p>This code expires in ${process.env.VERIFICATION_CODE_EXPIRY || 10} minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">Thamel Toronto</p>
      </div>
    `,
    text: `Your Thamel Toronto verification code is: ${code}. It expires in ${process.env.VERIFICATION_CODE_EXPIRY || 10} minutes.`,
  };

  await transport.sendMail(mailOptions);
  return { success: true };
}

export async function sendNotificationEmail(to, subject, body) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[DEV] Notification email to ${to}: ${subject} - ${body}`);
    return { success: true, devMode: true };
  }
  const mailOptions = {
    from: process.env.MAIL_FROM || 'noreply@thamel.com',
    to,
    subject: subject || 'Thamel Toronto',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${subject || 'Update from Thamel'}</h2>
        <div style="white-space: pre-wrap;">${String(body || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">Thamel Bar & Karaoke</p>
      </div>
    `,
    text: String(body || ''),
  };
  await transport.sendMail(mailOptions);
  return { success: true };
}

export async function checkEmailConfig() {
  const transport = getTransporter();
  if (!transport) {
    return { configured: false };
  }
  try {
    await transport.verify();
    console.log('SMTP transporter verified and ready.');
    return { configured: true, verified: true };
  } catch (err) {
    console.warn('SMTP transporter verification failed:', err);
    return { configured: true, verified: false };
  }
}
