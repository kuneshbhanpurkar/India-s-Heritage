import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		slug: { type: String, required: true, unique: true, trim: true },
		description: String,
		active: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
