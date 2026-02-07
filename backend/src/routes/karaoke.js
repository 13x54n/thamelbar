import express from 'express';
import KaraokeBooking from '../models/KaraokeBooking.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All bookable slots (24h key -> display label)
const SLOTS = [
  { key: '18:00', label: '6:00 PM' },
  { key: '19:30', label: '7:30 PM' },
  { key: '21:00', label: '9:00 PM' },
  { key: '22:30', label: '10:30 PM' },
  { key: '00:00', label: '12:00 AM' },
];
const slotKeyToLabel = Object.fromEntries(SLOTS.map((s) => [s.key, s.label]));

/**
 * GET /api/karaoke/slots?room=K1&date=2025-02-15
 * Returns available slot labels for the given room and date (real-time from DB).
 */
router.get('/slots', async (req, res) => {
  try {
    const { room, date } = req.query;
    if (!room || !date) {
      return res.status(400).json({ error: 'room and date are required' });
    }
    if (!['K1', 'K2', 'K3'].includes(room)) {
      return res.status(400).json({ error: 'room must be K1, K2, or K3' });
    }
    const booked = await KaraokeBooking.find({
      room,
      date: String(date).trim(),
    }).select('slot');
    const bookedKeys = new Set(booked.map((b) => b.slot));
    const available = SLOTS.filter((s) => !bookedKeys.has(s.key)).map((s) => s.label);
    res.json({ slots: available });
  } catch (err) {
    console.error('Karaoke slots error:', err);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

/**
 * GET /api/karaoke/bookings
 * Returns the current user's karaoke bookings (upcoming first).
 */
router.get('/bookings', authenticate, async (req, res) => {
  try {
    const docs = await KaraokeBooking.find({ user: req.user._id })
      .sort({ date: 1, slot: 1 })
      .lean();
    const bookings = docs.map((b) => ({
      id: b._id.toString(),
      room: b.room,
      date: b.date,
      slot: slotKeyToLabel[b.slot] || b.slot,
    }));
    res.json({ bookings });
  } catch (err) {
    console.error('Karaoke bookings list error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * POST /api/karaoke/book
 * Body: { room, date, slot, contactNumber } — slot is display label e.g. "6:00 PM"
 * Requires auth.
 */
router.post('/book', authenticate, async (req, res) => {
  try {
    const { room, date, slot: slotLabel, contactNumber } = req.body;
    if (!room || !date || !slotLabel || !contactNumber) {
      return res.status(400).json({ error: 'room, date, slot, and contactNumber are required' });
    }
    if (!['K1', 'K2', 'K3'].includes(room)) {
      return res.status(400).json({ error: 'room must be K1, K2, or K3' });
    }
    const contactNumberTrimmed = String(contactNumber).trim();
    if (!contactNumberTrimmed || contactNumberTrimmed.length < 10) {
      return res.status(400).json({ error: 'Valid contact number is required (at least 10 digits)' });
    }
    const slot = SLOTS.find((s) => s.label === slotLabel);
    if (!slot) {
      return res.status(400).json({ error: 'Invalid slot' });
    }
    const dateStr = String(date).trim();
    const existing = await KaraokeBooking.findOne({
      room,
      date: dateStr,
      slot: slot.key,
    });
    if (existing) {
      return res.status(409).json({ error: 'This slot is no longer available' });
    }
    const booking = await KaraokeBooking.create({
      room,
      date: dateStr,
      slot: slot.key,
      contactNumber: contactNumberTrimmed,
      user: req.user._id,
    });
    res.status(201).json({
      success: true,
      booking: {
        id: booking._id,
        room: booking.room,
        date: booking.date,
        slot: slotLabel,
        contactNumber: booking.contactNumber,
      },
    });
  } catch (err) {
    console.error('Karaoke book error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router;
