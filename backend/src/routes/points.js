import express from 'express';
import PointTransaction from '../models/PointTransaction.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/** GET /api/points/transactions – current user's point transactions */
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const list = await PointTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({
      transactions: list.map((t) => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        points: t.points,
        date: t.createdAt,
      })),
    });
  } catch (err) {
    console.error('Points transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
