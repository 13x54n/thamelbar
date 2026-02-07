import mongoose from 'mongoose';

const { Schema } = mongoose;

const mobileAuthCodeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: MongoDB will automatically delete when expiresAt has passed
mobileAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('MobileAuthCode', mobileAuthCodeSchema);

