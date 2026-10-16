// READ-ONLY: lists collections + per-section counts in `places`. Makes no changes.
import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const PLANNED = ['heritage_places', 'hidden_places', 'culture_traditions', 'arts_folk', 'food_markets'];

const db = (await connectDatabase(), mongoose.connection.db);
const cols = (await db.listCollections().toArray()).map((c) => c.name).sort();

console.log('\n--- EXISTING COLLECTIONS ---');
for (const name of cols) console.log(`${name}: ${await db.collection(name).countDocuments()}`);

console.log('\n--- PLANNED CATEGORY COLLECTIONS ---');
for (const name of PLANNED) console.log(`${name}: ${cols.includes(name) ? 'EXISTS' : 'NOT CREATED'}`);

if (cols.includes('places')) {
	console.log('\n--- places grouped by section ---');
	const groups = await db.collection('places').aggregate([{ $group: { _id: '$section', count: { $sum: 1 } } }]).toArray();
	groups.forEach((g) => console.log(`${g._id}: ${g.count}`));
}

await disconnectDatabase();
