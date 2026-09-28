import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import Content from '../models/Content.js';
import State from '../models/State.js';
import City from '../models/City.js';
import { slugify } from '../utils/auth.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

export async function runMigration() {
	console.log('Starting migration script...');

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

	// 3. Migrate and backfill Content documents
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

		// Backfill subtitle from fields
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

		// Location normalization
		if (item.latitude !== undefined && item.longitude !== undefined) {
			if (!item.location || !item.location.coordinates || item.location.coordinates[0] === 0) {
				item.location = {
					type: 'Point',
					coordinates: [Number(item.longitude), Number(item.latitude)],
				};
				modified = true;
			}
		}

		if (modified) {
			await item.save();
			migratedCount++;
		}
	}

	console.log(`Content migration finished. Updated ${migratedCount} of ${contents.length} records.`);
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
