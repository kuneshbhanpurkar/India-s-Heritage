import mongoose from 'mongoose';

const geoPointSchema = new mongoose.Schema(
	{
		type: { type: String, enum: ['Point'], default: 'Point', required: true },
		coordinates: { type: [Number], required: true, default: [0, 0] }, // [longitude, latitude]
	},
	{ _id: false },
);

const contentSchema = new mongoose.Schema(
	{
		cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true, index: true },
		districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
		stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', index: true },
		section: {
			type: String,
			enum: ['popular-places', 'hidden-places', 'cultural-folk', 'regional-festivals', 'living-culture'],
			required: true,
			index: true,
		},
		category: { type: String, default: 'Heritage' },
		categoryId: { type: mongoose.Schema.Types.Mixed },
		title: { type: String, required: true, trim: true },
		slug: { type: String, required: true, trim: true },
		status: {
			type: String,
			enum: ['draft', 'review', 'published', 'hidden'],
			default: 'published',
			index: true,
		},
		isFeatured: { type: Boolean, default: false },
		fields: { type: mongoose.Schema.Types.Mixed, default: {} },
		media: [
			{
				type: { type: String, default: 'image' },
				url: { type: String, default: '' },
				alt: { type: String, default: '' },
			},
		],
		location: { type: geoPointSchema, default: () => ({ type: 'Point', coordinates: [0, 0] }) },
		latitude: { type: Number },
		longitude: { type: Number },
		active: { type: Boolean, default: true },
	},
	{ collection: 'places', timestamps: true },
);

contentSchema.index({ cityId: 1, section: 1, status: 1 });
contentSchema.index({ stateId: 1, status: 1 });
contentSchema.index({ location: '2dsphere' });
contentSchema.index({ slug: 1 });

// Pre-save hook to ensure districtId and lat/long stay synchronized
contentSchema.pre('save', function (next) {
	if (this.cityId && !this.districtId) {
		this.districtId = this.cityId;
	}
	if (this.districtId && !this.cityId) {
		this.cityId = this.districtId;
	}
	if (this.latitude !== undefined && this.longitude !== undefined) {
		this.location = {
			type: 'Point',
			coordinates: [Number(this.longitude), Number(this.latitude)],
		};
	} else if (this.location?.coordinates?.length === 2) {
		this.longitude = this.location.coordinates[0];
		this.latitude = this.location.coordinates[1];
	}
	next();
});

export default mongoose.models.Content || mongoose.model('Content', contentSchema);
