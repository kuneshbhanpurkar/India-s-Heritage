import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { ALL_CONTENT_MODELS } from '../models/content/contentRegistry.js';
import City from '../models/City.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function checkAll() {
	await connectDatabase();
	for (const { slug, Model } of ALL_CONTENT_MODELS) {
		const items = await Model.find({}).sort({ updatedAt: -1, createdAt: -1 }).populate('cityId', 'name').lean();
		console.log(`\n=== Collection: ${Model.collection.name} (${slug}) - Total: ${items.length} ===`);
		for (const i of items.slice(0, 15)) {
			console.log(`- "${i.title}" | Status: "${i.status}" | Active: ${i.active} | District: "${i.cityId?.name}" | ID: ${i._id} | Updated: ${i.updatedAt || i.createdAt}`);
		}
	}
	await disconnectDatabase();
}

checkAll().catch(console.error);
