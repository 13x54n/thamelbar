import mongoose from 'mongoose';

/** optionGroups shape: [{ label, choices: [{ name, price? }], modifier? }] */
const optionGroupSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    modifier: { type: Boolean, default: false },
    choices: [
      {
        name: { type: String, required: true },
        price: { type: Number },
      },
    ],
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: mongoose.Schema.Types.Mixed, default: null }, // number | null for items with only option prices
    image: { type: String, default: '', trim: true },
    category: { type: String, default: 'starters', trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    optionGroups: { type: [optionGroupSchema], default: undefined },
  },
  { timestamps: true }
);

export default mongoose.model('MenuItem', menuItemSchema);
