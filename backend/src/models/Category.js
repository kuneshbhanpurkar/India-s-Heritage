import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		slug: { type: String, required: true, unique: true, trim: true },
		type: { type: String, enum: ['place', 'culture', 'festival', 'intangible', 'heritage'], default: 'place' },
		description: { type: String, default: '' },
		icon: { type: String, default: 'account_balance' },
		aliases: [{ type: String, trim: true }],
		displayOrder: { type: Number, default: 0 },
		globalActive: { type: Boolean, default: true },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

categorySchema.index({ displayOrder: 1 });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
