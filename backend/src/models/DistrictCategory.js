import mongoose from 'mongoose';

const districtCategorySchema = new mongoose.Schema(
	{
		districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
		categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
		enabled: { type: Boolean, default: false },
		featured: { type: Boolean, default: false },
		fields: { type: [mongoose.Schema.Types.Mixed], default: [] },
	},
	{ timestamps: true },
);

districtCategorySchema.index({ districtId: 1, categoryId: 1 }, { unique: true });

export default mongoose.models.DistrictCategory || mongoose.model('DistrictCategory', districtCategorySchema);
