export function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (process.env.ADMIN_SECRET && secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
