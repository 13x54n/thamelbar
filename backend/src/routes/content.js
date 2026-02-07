import express from 'express';
import Promo from '../models/Promo.js';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

/** Menu section types matching frontend (frontend/app/page.tsx MENU.sections) */
export const MENU_CATEGORIES = [
  { id: 'starters', title: 'Starters' },
  { id: 'apetizers', title: 'Apetizers' },
  { id: 'mains', title: 'Mains' },
];

/** GET /api/menu-categories – public list of menu section types (for admin & mobile) */
router.get('/menu-categories', (req, res) => {
  res.json({ categories: MENU_CATEGORIES });
});

/** GET /api/promos – public list of active promos (for mobile app) */
router.get('/promos', async (req, res) => {
  try {
    const promos = await Promo.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({
      promos: promos.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        detail: p.detail,
        image: p.image,
        order: p.order,
      })),
    });
  } catch (err) {
    console.error('Promos list error:', err);
    res.status(500).json({ error: 'Failed to fetch promos' });
  }
});

/** GET /api/menu/sections – menu grouped by sections (for frontend Next.js site) */
router.get('/menu/sections', async (req, res) => {
  try {
    const items = await MenuItem.find({ active: true })
      .sort({ category: 1, order: 1, createdAt: 1 })
      .lean();
    const sectionMap = new Map();
    for (const cat of MENU_CATEGORIES) {
      sectionMap.set(cat.id, { id: cat.id, title: cat.title, items: [] });
    }
    for (const m of items) {
      const cat = m.category || 'starters';
      if (!sectionMap.has(cat)) sectionMap.set(cat, { id: cat, title: cat, items: [] });
      const item = {
        name: m.name,
        ...(m.description && { description: m.description }),
        ...(m.price != null && m.price !== '' && { price: Number(m.price) }),
        ...(m.optionGroups?.length > 0 && { optionGroups: m.optionGroups }),
      };
      sectionMap.get(cat).items.push(item);
    }
    const sections = MENU_CATEGORIES.map((c) => sectionMap.get(c.id) || { id: c.id, title: c.title, items: [] });
    res.json({ restaurant: 'Thamel Bar & Karaoke', sections });
  } catch (err) {
    console.error('Menu sections error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

/** GET /api/menu – public list of active menu items (for mobile app) */
router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({ active: true })
      .sort({ category: 1, order: 1, createdAt: 1 })
      .lean();
    res.json({
      menu: items.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        description: m.description,
        price: m.price != null && m.price !== '' ? String(m.price) : '',
        image: m.image,
        category: m.category,
        order: m.order,
        ...(m.optionGroups?.length > 0 && { optionGroups: m.optionGroups }),
      })),
    });
  } catch (err) {
    console.error('Menu list error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

export default router;
