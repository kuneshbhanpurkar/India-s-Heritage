import mongoose from 'mongoose';
import { slugify } from '../utils/auth.js';

const stateSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		country_code: { type: String, default: 'IN', uppercase: true, trim: true },
		normalized_name: { type: String, index: true },
		code: { type: String, required: true, uppercase: true, trim: true },
		slug: { type: String, trim: true },
		description: { type: String, default: '' },
		location: {
			type: { type: String, enum: ['Point'], default: 'Point' },
			coordinates: { type: [Number], default: [0, 0] },
		},
		active: { type: Boolean, default: true },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

stateSchema.index({ name: 1 }, { unique: true });
stateSchema.index({ code: 1 }, { unique: true });
stateSchema.index({ slug: 1 });

stateSchema.pre('save', function (next) {
	if (this.name) {
		this.normalized_name = this.name.toLowerCase().replace(/[^a-z0-9]/g, '');
		if (!this.slug) {
			this.slug = slugify(this.name);
		}
	}
	next();
});

export default mongoose.models.State || mongoose.model('State', stateSchema);
