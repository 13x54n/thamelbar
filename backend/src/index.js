import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { checkEmailConfig } from './config/email.js';
import authRoutes from './routes/auth.js';
import karaokeRoutes from './routes/karaoke.js';
import adminRoutes from './routes/admin.js';
import pointsRoutes from './routes/points.js';
import contentRoutes from './routes/content.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  console.log(`[IN] ${method} ${originalUrl} ip=${ip}`);

  res.on('finish', () => {
    const ms = Date.now() - start;
    const length = res.getHeader('content-length') || 0;
    console.log(
      `[OUT] ${method} ${originalUrl} -> ${res.statusCode} ${ms}ms bytes=${length}`
    );
  });

  next();
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/karaoke', karaokeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api', contentRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await connectDB();
    await checkEmailConfig();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
