import mongoose from 'mongoose';
import { CATEGORY_DEFINITIONS, COMMON_DISPLAY_FIELDS } from '../../config/categoryDefinitions.js';

/**
 * Shared base schema for all 5 category collections.
 *
 * Every category (heritage_places, hidden_places, culture_traditions, arts_folk, food_markets)
 * gets its OWN collection built from this factory. Isolation guarantees:
 *   1. `section` is locked to the collection's own slug (enum + immutable).
 *   2. `fields` is a typed sub-schema generated from categoryDefinitions.js with strict:'throw',
 *      so fields belonging to another category are rejected.
 *   3. The root schema is strict:'throw', so unknown top-level keys are rejected.
 */

const { Schema } = mongoose;

const geoPointSchema = new Schema(
	{
		type: { type: String, enum: ['Point'], default: 'Point' },
		coordinates: { type: [Number] }, // [longitude, latitude]
	},
	{ _id: false },
);

const mediaItemSchema = new Schema(
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

const documentItemSchema = new Schema(
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

const sourceItemSchema = new Schema(
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

/** Convert one field definition from categoryDefinitions.js into a Mongoose schema type. */
function fieldDefToSchemaType(def) {
	switch (def.type) {
		case 'group': {
			const shape = {};
			for (const sub of def.fields || []) shape[sub.name] = fieldDefToSchemaType(sub);
			return { type: new Schema(shape, { _id: false, strict: 'throw' }), default: undefined };
		}
		case 'select':
			// Empty string allowed so admins can clear an optional select
			return { type: String, trim: true, enum: [...(def.options || []), ''] };
		case 'number':
			return { type: Number };
		default:
			return { type: String, trim: true };
	}
}

/** Build the typed, strict `fields` sub-schema for one category. */
export function buildFieldsSchema(slug) {
	const definition = CATEGORY_DEFINITIONS[slug];
	if (!definition) throw new Error(`Unknown category slug: ${slug}`);

	const shape = {};
	for (const def of [...definition.fields, ...COMMON_DISPLAY_FIELDS]) {
		shape[def.name] = fieldDefToSchemaType(def);
	}
	return new Schema(shape, { _id: false, strict: 'throw', minimize: false });
}

/** Factory: returns a full content schema bound to a single category slug + collection. */
export function buildContentSchema(slug) {
	const definition = CATEGORY_DEFINITIONS[slug];
	if (!definition) throw new Error(`Unknown category slug: ${slug}`);

	const schema = new Schema(
		{
			cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
			districtId: { type: Schema.Types.ObjectId, ref: 'City' },
			stateId: { type: Schema.Types.ObjectId, ref: 'State', index: true },
			section: {
				type: String,
				required: true,
				enum: [slug],
				default: slug,
				immutable: true,
			},
			category: { type: String, default: definition.title },
			title: { type: String, required: true, trim: true },
			subtitle: { type: String, default: '', trim: true },
			slug: { type: String, required: true, trim: true },
			shortDescription: { type: String, default: '', trim: true },
			fullDescription: { type: String, default: '', trim: true },
			status: {
				type: String,
				enum: ['draft', 'review', 'published', 'hidden', 'archived'],
				default: 'draft',
				index: true,
			},
			isFeatured: { type: Boolean, default: false },
			mediaEnabled: { type: Boolean, default: true },
			documentsEnabled: { type: Boolean, default: true },
			version: { type: Number, default: 1 },
			publishedAt: { type: Date },
			publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
			createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
			updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
			fields: { type: buildFieldsSchema(slug), default: () => ({}) },
			media: [mediaItemSchema],
			documents: [documentItemSchema],
			sources: [sourceItemSchema],
			location: { type: geoPointSchema, default: undefined },
			latitude: { type: Number },
			longitude: { type: Number },
			active: { type: Boolean, default: true },
		},
		{ collection: definition.collection, timestamps: true, strict: 'throw' },
	);

	schema.index({ cityId: 1, status: 1, active: 1 });
	schema.index({ stateId: 1, status: 1 });
	schema.index({ location: '2dsphere' });
	schema.index({ slug: 1 }, { unique: true });

	// Keep districtId/cityId, category title, geo point and publishedAt in sync on save
	schema.pre('save', function (next) {
		if (this.cityId && !this.districtId) this.districtId = this.cityId;
		if (this.districtId && !this.cityId) this.cityId = this.districtId;
		this.category = definition.title;

		const lat = Number(this.latitude);
		const lng = Number(this.longitude);
		const hasLatLng =
			this.latitude !== undefined && this.latitude !== null && this.longitude !== undefined && this.longitude !== null;

		if (hasLatLng && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
			this.latitude = lat;
			this.longitude = lng;
			this.location = { type: 'Point', coordinates: [lng, lat] };
		} else if (this.location?.coordinates?.length === 2) {
			this.longitude = this.location.coordinates[0];
			this.latitude = this.location.coordinates[1];
		} else {
			this.location = undefined;
		}

		if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
			this.publishedAt = new Date();
		}
		next();
	});

	// Safety net for findOneAndUpdate / findByIdAndUpdate (pre-save does not run there)
	schema.pre('findOneAndUpdate', function (next) {
		const update = this.getUpdate() || {};
		const set = update.$set || update;
		if (set.latitude !== undefined && set.longitude !== undefined) {
			const lat = Number(set.latitude);
			const lng = Number(set.longitude);
			if (!isNaN(lat) && !isNaN(lng)) {
				set.location = { type: 'Point', coordinates: [lng, lat] };
			}
		}
		if (set.cityId && !set.districtId) set.districtId = set.cityId;
		if ('section' in set) delete set.section; // category of a record is locked to its collection
		set.category = definition.title;
		next();
	});

	return schema;
}

/** Create (or reuse, on hot reload) the Mongoose model for a category slug. */
export function buildContentModel(slug) {
	const { modelName } = CATEGORY_DEFINITIONS[slug];
	return mongoose.models[modelName] || mongoose.model(modelName, buildContentSchema(slug));
}
