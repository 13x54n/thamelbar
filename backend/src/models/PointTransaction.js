import mongoose from 'mongoose';

const pointTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['earn', 'redeem'], default: 'earn' },
    amount: { type: Number, required: true }, // bill amount in dollars (for earn)
    points: { type: Number, required: true },
  },
  { timestamps: true }
);

pointTransactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('PointTransaction', pointTransactionSchema);
