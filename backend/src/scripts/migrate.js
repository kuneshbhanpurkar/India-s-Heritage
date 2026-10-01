import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import Content from '../models/Content.js';
import State from '../models/State.js';
import City from '../models/City.js';
import DistrictCategory from '../models/DistrictCategory.js';
import { slugify } from '../utils/auth.js';
import {
	resolveCategorySlug,
	sanitizeCategoryFields,
	CATEGORY_DEFINITIONS,
	VALID_CATEGORY_SLUGS,
} from '../config/categoryDefinitions.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

export async function runMigration() {
	console.log('Starting migration script for Our_Dharohar 5-category architecture...');

	// 1. Normalize States
	const states = await State.find();
	for (const state of states) {
		let modified = false;
		if (!state.normalized_name && state.name) {
			state.normalized_name = state.name.toLowerCase().replace(/[^a-z0-9]/g, '');
			modified = true;
		}
		if (!state.slug && state.name) {
			state.slug = slugify(state.name);
			modified = true;
		}
		if (modified) {
			await state.save();
		}
	}
	console.log(`Checked ${states.length} states.`);

	// 2. Normalize Cities / Districts
	const cities = await City.find();
	for (const city of cities) {
		let modified = false;
		if (!city.normalizedName && city.name) {
			city.normalizedName = city.name.toLowerCase().replace(/[^a-z0-9]/g, '');
			modified = true;
		}
		if (!city.slug && city.name) {
			city.slug = slugify(city.name);
			modified = true;
		}
		if (modified) {
			await city.save();
		}
	}
	console.log(`Checked ${cities.length} cities.`);

	// 3. Migrate and backfill Content documents to 5 Canonical Categories
	const contents = await Content.find();
	let migratedCount = 0;

	for (const item of contents) {
		let modified = false;
		const fields = item.fields || {};

		// Ensure districtId
		if (item.cityId && !item.districtId) {
			item.districtId = item.cityId;
			modified = true;
		}

		// Ensure stateId if missing
		if (!item.stateId && item.cityId) {
			const c = await City.findById(item.cityId);
			if (c?.stateId) {
				item.stateId = c.stateId;
				modified = true;
			}
		}

		// Resolve category section slug to canonical 5 slugs
		const canonicalSlug = resolveCategorySlug(item.section) || 'heritage-places';
		if (item.section !== canonicalSlug) {
			item.section = canonicalSlug;
			modified = true;
		}
		if (CATEGORY_DEFINITIONS[canonicalSlug]) {
			item.category = CATEGORY_DEFINITIONS[canonicalSlug].title;
		}

		// Backfill subtitle from fields if present
		if (!item.subtitle && fields.subTitle) {
			item.subtitle = String(fields.subTitle).trim();
			modified = true;
		}

		// Backfill descriptions from fields
		if (!item.shortDescription && fields.description) {
			item.shortDescription = String(fields.description).trim();
			modified = true;
		}
		if (!item.fullDescription && (fields.fullDescription || fields.longDescription || fields.history)) {
			item.fullDescription = String(fields.fullDescription || fields.longDescription || fields.history).trim();
			modified = true;
		}

		// Ensure publishedAt
		if (item.status === 'published' && !item.publishedAt) {
			item.publishedAt = item.createdAt || new Date();
			modified = true;
		}

		// Sanitize fields against category whitelist
		const sanitized = sanitizeCategoryFields(canonicalSlug, item.fields);
		item.fields = sanitized;

		// Location normalization
		if (
			item.latitude !== undefined &&
			item.latitude !== null &&
			item.longitude !== undefined &&
			item.longitude !== null &&
			!isNaN(Number(item.latitude)) &&
			!isNaN(Number(item.longitude))
		) {
			const lat = Number(item.latitude);
			const lng = Number(item.longitude);
			if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
				item.location = {
					type: 'Point',
					coordinates: [lng, lat],
				};
				item.latitude = lat;
				item.longitude = lng;
			}
		}

		if (item.active === undefined) {
			item.active = true;
			modified = true;
		}

		await item.save();
		migratedCount++;
	}

	console.log(`Content migration finished. Updated ${migratedCount} of ${contents.length} records.`);

	// 4. Migrate DistrictCategory records to canonical slugs
	const districtCats = await DistrictCategory.find();
	for (const dc of districtCats) {
		const canonicalSlug = resolveCategorySlug(dc.categorySlug);
		if (canonicalSlug && canonicalSlug !== dc.categorySlug) {
			// Check if canonical already exists for this district
			const existingCanonical = await DistrictCategory.findOne({
				districtId: dc.districtId,
				categorySlug: canonicalSlug,
			});
			if (existingCanonical) {
				await DistrictCategory.findByIdAndDelete(dc._id);
			} else {
				dc.categorySlug = canonicalSlug;
				dc.categoryId = canonicalSlug;
				await dc.save();
			}
		}
	}
	console.log(`DistrictCategory configuration migration finished.`);
}

async function runStandalone() {
	try {
		await connectDatabase();
		await runMigration();
	} catch (error) {
		console.error('Migration failed:', error);
	} finally {
		await disconnectDatabase();
	}
}

if (process.argv[1]?.endsWith('migrate.js')) {
	runStandalone();
}
