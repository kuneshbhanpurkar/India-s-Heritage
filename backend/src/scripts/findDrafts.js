import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { ALL_CONTENT_MODELS } from '../models/content/contentRegistry.js';
import City from '../models/City.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function checkNonPublished() {
	await connectDatabase();
	console.log('\n--- NON-PUBLISHED OR INACTIVE RECORDS ---');
	for (const { slug, Model } of ALL_CONTENT_MODELS) {
		const items = await Model.find({ $or: [{ status: { $ne: 'published' } }, { active: false }] })
			.populate('cityId', 'name')
			.lean();
		for (const i of items) {
			console.log(`[${slug}] "${i.title}" | Status: "${i.status}" | Active: ${i.active} | District: "${i.cityId?.name}" | ID: ${i._id}`);
		}
	}
	await disconnectDatabase();
}

checkNonPublished().catch(console.error);
