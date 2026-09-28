import mongoose from 'mongoose';

const districtCategorySchema = new mongoose.Schema(
	{
		districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true, index: true },
		categorySlug: { type: String, required: true, trim: true },
		categoryId: { type: mongoose.Schema.Types.Mixed },
		enabled: { type: Boolean, default: true },
		featured: { type: Boolean, default: false },
		fields: { type: mongoose.Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true },
);

districtCategorySchema.index({ districtId: 1, categorySlug: 1 }, { unique: true });

export default mongoose.models.DistrictCategory || mongoose.model('DistrictCategory', districtCategorySchema);

