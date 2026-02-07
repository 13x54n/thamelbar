/**
 * Seed menu from frontend MENU (frontend/app/page.tsx).
 * Run from backend: node scripts/seedMenu.js
 * Requires MONGODB_URI in env (e.g. from .env via dotenv).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import MenuItem from '../src/models/MenuItem.js';

const MENU_SECTIONS = [
  {
    id: 'starters',
    title: 'Starters',
    items: [
      { name: 'Alu Chop', description: 'Premium spiced potato patties, expertly coated in crisp chickpea flour batter for a perfect crunch.', price: 8 },
      { name: 'French Fries', description: 'Thin-cut, golden potato fries with a light, crisp bite and soft, fluffy centre.', price: 8 },
      { name: 'Fried Sausage', description: 'Juicy sausages lightly battered and fried to a golden crisp, bursting with savoury flavour.', price: 8 },
      { name: 'Edamame', description: 'Tender, steamed soybean pods lightly salted, offering a fresh, nutty bite.', price: 7 },
      {
        name: 'Wai Wai Chatpatey',
        description: 'A tangy, spicy snack made with crunchy Wai Wai noodles, puffed rice, and fresh veggies.',
        price: 10,
        optionGroups: [
          { label: 'Spice Level', choices: [{ name: 'Mild (no spice)' }, { name: 'Medium' }, { name: 'Spicy' }] },
        ],
      },
      {
        name: 'Peanut Sadeko',
        description: 'A savoury, nutty snack made with roasted peanuts, fresh herbs, and spices, served with a tangy, spicy chutney.',
        price: 10,
        optionGroups: [
          { label: 'Spice Level', choices: [{ name: 'Mild (no spice)' }, { name: 'Medium' }, { name: 'Spicy' }] },
        ],
      },
      {
        name: 'Bhatmas Sadeko',
        description: 'A savoury, spicy snack made with roasted soya beans, and a blend of aromatic spices, served with a tangy, spicy chutney.',
        price: 10,
        optionGroups: [
          { label: 'Spice Level', choices: [{ name: 'Mild (no spice)' }, { name: 'Medium' }, { name: 'Spicy' }] },
        ],
      },
      {
        name: 'Mustang Alu',
        description: "Spicy, crunchy potato wedges from Nepal's Mustang region, fried and tossed with fiery Himalayan spices like Timur pepper, chillies, and fenugreek.",
        price: 10,
      },
    ],
  },
  {
    id: 'apetizers',
    title: 'Apetizers',
    items: [
      {
        name: 'Sukuti',
        description: 'A dried meat product of Nepalese origin, also consumed in the Himalayan regions of India and Tibet.',
        price: 15,
        optionGroups: [
          { label: 'Protein options', choices: [{ name: 'Beef' }, { name: 'Buff' }] },
        ],
      },
      {
        name: 'Mutton Bhuttan',
        description: 'A stir-fried dish prepared with goat tripe and other digestive parts.',
        price: 15,
      },
      {
        name: 'Chicken Wings',
        description: 'Tender, crispy-fried wings coated in a rich, flavour-packed sauce.',
        price: 14,
        optionGroups: [
          { label: 'Sauce', choices: [{ name: 'Hot Buffalo' }, { name: 'Honey Garlic' }, { name: 'Salt & Chilli' }] },
        ],
      },
      { name: 'Chicken Lollipop', description: 'Crispy, deep-fried drumettes marinated in spicy Indo-Chinese flavours, served with a spicy-tangy dipping sauce.', price: 14 },
      {
        name: 'Choyela',
        description: 'A typical newari dish made with grilled meat, freshly cooked with spices and vegetables.',
        price: 15,
        optionGroups: [
          { label: 'Protein options', choices: [{ name: 'Chicken' }, { name: 'Beef' }, { name: 'Buff' }] },
        ],
      },
      {
        name: 'Chilli',
        description: 'Spicy, tangy, and flavourful chilli sauce made with fresh chillies, tomatoes, and a blend of spices with choice of protein.',
        price: 13,
        optionGroups: [
          { label: 'Protein options', choices: [{ name: 'Chicken' }, { name: 'Buff' }, { name: 'Beef' }] },
        ],
      },
    ],
  },
  {
    id: 'mains',
    title: 'Mains',
    items: [
      {
        name: 'Momo (Dumplings)',
        description: 'Choice of protein, steamed, jhol, or fried, with house chutney on the side.',
        optionGroups: [
          { label: 'Protein options', choices: [{ name: 'Beef' }, { name: 'Chicken' }, { name: 'Buff' }] },
          {
            label: 'Cook options',
            choices: [
              { name: 'Steamed', price: 14 },
              { name: 'Jhol', price: 15 },
              { name: 'Fried', price: 15 },
              { name: 'Chilli', price: 15 },
            ],
          },
        ],
      },
      {
        name: 'Chow Mein',
        description: 'Stir-fried noodles with vegetables and your choice of protein.',
        price: 14,
        optionGroups: [
          {
            label: 'Protein options',
            modifier: true,
            choices: [{ name: 'Veg' }, { name: 'Chicken' }, { name: 'Beef' }, { name: 'Buff' }],
          },
        ],
      },
      {
        name: 'Fried Rice',
        description: 'Stir-fried rice with vegetables and your choice of protein made in Thai style.',
        price: 14,
        optionGroups: [
          {
            label: 'Protein options',
            modifier: true,
            choices: [{ name: 'Veg' }, { name: 'Chicken' }, { name: 'Beef' }, { name: 'Buff' }],
          },
        ],
      },
      {
        name: 'Pork Sekuwa',
        description: 'A traditional Nepalese dish made with pork marinated in spices and grilled to perfection.',
        price: 16,
      },
      {
        name: 'Newari Khaja Set',
        description: 'A traditional Newari dish made with a mix of achars (pickles), puffed rice, and your choice of protein.',
        price: 17,
        optionGroups: [
          {
            label: 'Protein options',
            modifier: true,
            choices: [{ name: 'Chicken' }, { name: 'Beef' }, { name: 'Buff' }, { name: 'Mutton' }],
          },
        ],
      },
    ],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const existing = await MenuItem.countDocuments();
  if (existing > 0) {
    console.log(`Menu already has ${existing} items. Delete existing items first to re-seed, or skip.`);
    await mongoose.disconnect();
    process.exit(0);
  }
  let order = 0;
  for (const section of MENU_SECTIONS) {
    for (const item of section.items) {
      await MenuItem.create({
        name: item.name,
        description: item.description || '',
        price: item.price ?? null,
        category: section.id,
        order: order++,
        active: true,
        optionGroups: item.optionGroups || undefined,
      });
    }
  }
  const count = await MenuItem.countDocuments();
  console.log(`Seeded ${count} menu items.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
