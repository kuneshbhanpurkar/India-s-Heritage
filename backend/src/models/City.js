import mongoose from 'mongoose';

const citySchema = new mongoose.Schema(
	{
		stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true, index: true },
		name: { type: String, required: true, trim: true },
		slug: { type: String, trim: true },
		active: { type: Boolean, default: true },
		coverImage: { type: String, default: '' },
		description: { type: String, default: '' },
		coordinates: {
			lat: { type: Number, default: 0 },
			lng: { type: Number, default: 0 },
		},
	},
	{ collection: 'districts', timestamps: true },
);

citySchema.index({ stateId: 1, name: 1 }, { unique: true });
citySchema.index({ slug: 1 });

export default mongoose.models.City || mongoose.model('City', citySchema);
