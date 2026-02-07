import mongoose from 'mongoose';

/**
 * Slot format in DB: "18:00", "19:30", "21:00", "22:30", "00:00" (24h)
 * Display: "6:00 PM", "7:30 PM", etc.
 */
const karaokeBookingSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, enum: ['K1', 'K2', 'K3'] },
    date: { type: String, required: true }, // YYYY-MM-DD
    slot: { type: String, required: true }, // e.g. "18:00"
    contactNumber: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

karaokeBookingSchema.index({ room: 1, date: 1, slot: 1 }, { unique: true });

export default mongoose.model('KaraokeBooking', karaokeBookingSchema);
