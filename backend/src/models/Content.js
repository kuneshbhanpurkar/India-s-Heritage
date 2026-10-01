import mongoose from 'mongoose';
import { VALID_CATEGORY_SLUGS, CATEGORY_DEFINITIONS } from '../config/categoryDefinitions.js';

const geoPointSchema = new mongoose.Schema(
	{
		type: { type: String, enum: ['Point'], default: 'Point' },
		coordinates: { type: [Number] }, // [longitude, latitude]
	},
	{ _id: false },
);

const mediaItemSchema = new mongoose.Schema(
	{
		type: { type: String, enum: ['image', 'video', 'pdf', 'audio'], default: 'image' },
		url: { type: String, default: '', trim: true },
		alt: { type: String, default: '', trim: true },
		title: { type: String, default: '', trim: true },
		caption: { type: String, default: '', trim: true },
		source: { type: String, default: '', trim: true },
		license: { type: String, default: '', trim: true },
		displayOrder: { type: Number, default: 0 },
		active: { type: Boolean, default: true },
		storageKey: { type: String, default: '' },
	},
	{ _id: true },
);

const documentItemSchema = new mongoose.Schema(
	{
		title: { type: String, default: '', trim: true },
		type: { type: String, default: 'pdf', trim: true },
		url: { type: String, default: '', trim: true },
		author: { type: String, default: '', trim: true },
		publisher: { type: String, default: '', trim: true },
		source: { type: String, default: '', trim: true },
		license: { type: String, default: '', trim: true },
		displayOrder: { type: Number, default: 0 },
		active: { type: Boolean, default: true },
	},
	{ _id: true },
);

const sourceItemSchema = new mongoose.Schema(
	{
		sourceTitle: { type: String, default: '', trim: true },
		sourceUrl: { type: String, default: '', trim: true },
		publisher: { type: String, default: '', trim: true },
		attribution: { type: String, default: '', trim: true },
		license: { type: String, default: '', trim: true },
		verificationNotes: { type: String, default: '', trim: true },
	},
	{ _id: true },
);

const contentSchema = new mongoose.Schema(
	{
		cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true, index: true },
		districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
		stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', index: true },
		section: {
			type: String,
			required: true,
			index: true,
		},
		category: { type: String, default: 'Heritage' },
		categoryId: { type: mongoose.Schema.Types.Mixed },
		title: { type: String, required: true, trim: true },
		subtitle: { type: String, default: '', trim: true },
		slug: { type: String, required: true, trim: true },
		shortDescription: { type: String, default: '', trim: true },
		fullDescription: { type: String, default: '', trim: true },
		status: {
			type: String,
			enum: ['draft', 'review', 'published', 'hidden', 'archived'],
			default: 'published',
			index: true,
		},
		isFeatured: { type: Boolean, default: false },
		mediaEnabled: { type: Boolean, default: true },
		documentsEnabled: { type: Boolean, default: true },
		version: { type: Number, default: 1 },
		publishedAt: { type: Date },
		publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		fields: { type: mongoose.Schema.Types.Mixed, default: {} },
		media: [mediaItemSchema],
		documents: [documentItemSchema],
		sources: [sourceItemSchema],
		location: { type: geoPointSchema },
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

// Pre-save hook to ensure districtId and lat/long stay synchronized and publishedAt is tracked
contentSchema.pre('save', function (next) {
	if (this.cityId && !this.districtId) {
		this.districtId = this.cityId;
	}
	if (this.districtId && !this.cityId) {
		this.cityId = this.districtId;
	}

	if (this.section && CATEGORY_DEFINITIONS[this.section]) {
		this.category = CATEGORY_DEFINITIONS[this.section].title;
	}

	if (
		this.latitude !== undefined &&
		this.latitude !== null &&
		this.longitude !== undefined &&
		this.longitude !== null &&
		!isNaN(Number(this.latitude)) &&
		!isNaN(Number(this.longitude))
	) {
		const lat = Number(this.latitude);
		const lng = Number(this.longitude);
		if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
			this.latitude = lat;
			this.longitude = lng;
			this.location = {
				type: 'Point',
				coordinates: [lng, lat],
			};
		}
	} else if (this.location?.coordinates?.length === 2) {
		this.longitude = this.location.coordinates[0];
		this.latitude = this.location.coordinates[1];
	}

	if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
		this.publishedAt = new Date();
	}

	next();
});

export default mongoose.models.Content || mongoose.model('Content', contentSchema);
