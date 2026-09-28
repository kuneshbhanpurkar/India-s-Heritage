import mongoose from 'mongoose';
import { slugify } from '../utils/auth.js';

const citySchema = new mongoose.Schema(
	{
		stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true, index: true },
		name: { type: String, required: true, trim: true },
		normalizedName: { type: String, index: true },
		slug: { type: String, trim: true },
		active: { type: Boolean, default: true },
		coverImage: { type: String, default: '' },
		description: { type: String, default: '' },
		coordinates: {
			lat: { type: Number, default: 0 },
			lng: { type: Number, default: 0 },
		},
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ collection: 'districts', timestamps: true },
);

citySchema.index({ stateId: 1, name: 1 }, { unique: true });
citySchema.index({ slug: 1 });

citySchema.pre('save', function (next) {
	if (this.name) {
		this.normalizedName = this.name.toLowerCase().replace(/[^a-z0-9]/g, '');
		if (!this.slug) {
			this.slug = slugify(this.name);
		}
	}
	next();
});

export default mongoose.models.City || mongoose.model('City', citySchema);
