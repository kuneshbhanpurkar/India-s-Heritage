import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { CONTENT_MODELS, getModelForSection } from '../models/content/contentRegistry.js';
import { resolveCategorySlug, sanitizeCategoryFields, CATEGORY_DEFINITIONS } from '../config/categoryDefinitions.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

export async function runSplitMigration({ dryRun = false } = {}) {
	console.log(`\n🚀 Starting Migration: Splitting 'places' into 5 Distinct Category Collections...`);
	if (dryRun) console.log(`🔍 [DRY-RUN MODE ACTIVATED: No database modifications will be persisted]\n`);

	const db = mongoose.connection.db;
	const collections = await db.listCollections().toArray();
	const collectionNames = collections.map((c) => c.name);

	if (!collectionNames.includes('places')) {
		console.log(`⚠️ 'places' collection not found in database. Checking category collections...`);
		for (const [slug, Model] of Object.entries(CONTENT_MODELS)) {
			const count = await Model.countDocuments();
			console.log(`   - ${Model.collection.name} (${slug}): ${count} documents`);
		}
		return;
	}

	const rawDocs = await db.collection('places').find({}).toArray();
	console.log(`📦 Found ${rawDocs.length} total documents in 'places' collection.`);

	const categoryBuckets = {
		'heritage-places': [],
		'hidden-places': [],
		'culture-traditions': [],
		'arts-folk': [],
		'food-markets': [],
	};
	const quarantinedDocs = [];

	for (const doc of rawDocs) {
		const canonicalSlug = resolveCategorySlug(doc.section);
		if (!canonicalSlug || !categoryBuckets[canonicalSlug]) {
			quarantinedDocs.push(doc);
			continue;
		}

		const Model = CONTENT_MODELS[canonicalSlug];
		const sanitizedFields = sanitizeCategoryFields(canonicalSlug, doc.fields || {});

		// Prepare document for strict schema
		const cleanDoc = {
			_id: doc._id,
			cityId: doc.cityId || doc.districtId,
			districtId: doc.districtId || doc.cityId,
			stateId: doc.stateId,
			section: canonicalSlug,
			category: CATEGORY_DEFINITIONS[canonicalSlug].title,
			title: doc.title || 'Untitled',
			subtitle: doc.subtitle || '',
			slug: doc.slug,
			shortDescription: doc.shortDescription || '',
			fullDescription: doc.fullDescription || '',
			status: ['draft', 'review', 'published', 'hidden', 'archived'].includes(doc.status) ? doc.status : 'published',
			isFeatured: Boolean(doc.isFeatured),
			mediaEnabled: doc.mediaEnabled !== false,
			documentsEnabled: doc.documentsEnabled !== false,
			version: doc.version || 1,
			publishedAt: doc.publishedAt || (doc.status === 'published' ? doc.createdAt || new Date() : undefined),
			publishedBy: doc.publishedBy,
			createdBy: doc.createdBy,
			updatedBy: doc.updatedBy,
			fields: sanitizedFields,
			media: Array.isArray(doc.media) ? doc.media : [],
			documents: Array.isArray(doc.documents) ? doc.documents : [],
			sources: Array.isArray(doc.sources) ? doc.sources : [],
			active: doc.active !== false,
			createdAt: doc.createdAt || new Date(),
			updatedAt: doc.updatedAt || new Date(),
		};

		if (doc.latitude !== undefined && doc.longitude !== undefined && doc.latitude !== null && doc.longitude !== null) {
			const lat = Number(doc.latitude);
			const lng = Number(doc.longitude);
			if (!isNaN(lat) && !isNaN(lng)) {
				cleanDoc.latitude = lat;
				cleanDoc.longitude = lng;
				cleanDoc.location = { type: 'Point', coordinates: [lng, lat] };
			}
		} else if (doc.location?.coordinates?.length === 2) {
			cleanDoc.longitude = doc.location.coordinates[0];
			cleanDoc.latitude = doc.location.coordinates[1];
			cleanDoc.location = doc.location;
		}

		categoryBuckets[canonicalSlug].push(cleanDoc);
	}

	console.log(`\n📊 Planned Distribution:`);
	for (const [slug, docs] of Object.entries(categoryBuckets)) {
		const targetCol = CATEGORY_DEFINITIONS[slug].collection;
		console.log(`   - ${targetCol.padEnd(20)} (${slug}): ${docs.length} records`);
	}
	console.log(`   - Quarantine (Invalid) : ${quarantinedDocs.length} records\n`);

	if (dryRun) {
		console.log(`✨ Dry-run finished. No data altered.`);
		return;
	}

	// Execute migration
	for (const [slug, docs] of Object.entries(categoryBuckets)) {
		const Model = CONTENT_MODELS[slug];
		const targetCol = CATEGORY_DEFINITIONS[slug].collection;

		if (docs.length === 0) continue;

		const bulkOps = docs.map((doc) => ({
			replaceOne: {
				filter: { _id: doc._id },
				replacement: doc,
				upsert: true,
			},
		}));

		const res = await db.collection(targetCol).bulkWrite(bulkOps);
		console.log(`  ✓ Inserted/Upserted ${docs.length} docs into '${targetCol}' (matched: ${res.matchedCount}, upserted: ${res.upsertedCount}, modified: ${res.modifiedCount})`);

		// Ensure proper indexes
		try {
			await Model.syncIndexes();
			console.log(`    ✓ Indexes synchronized for '${targetCol}'`);
		} catch (err) {
			console.warn(`    ⚠️ Index sync warning for '${targetCol}':`, err.message);
		}
	}

	// Backup and rename places collection
	const backupName = `places_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
	if (!collectionNames.includes(backupName)) {
		await db.collection('places').rename(backupName);
		console.log(`\n📦 Successfully renamed 'places' collection to '${backupName}' (Backup preserved).`);
	} else {
		console.log(`\n📦 Backup collection '${backupName}' already exists.`);
	}

	console.log(`\n🎉 MIGRATION COMPLETED SUCCESSFULLY! All 5 collections populated.`);
}

async function runStandalone() {
	try {
		await connectDatabase();
		const isDryRun = process.argv.includes('--dry-run');
		await runSplitMigration({ dryRun: isDryRun });
	} catch (error) {
		console.error('❌ Migration failed with error:', error);
		process.exitCode = 1;
	} finally {
		await disconnectDatabase();
	}
}

if (process.argv[1]?.endsWith('splitPlacesIntoCategoryCollections.js')) {
	runStandalone();
}
