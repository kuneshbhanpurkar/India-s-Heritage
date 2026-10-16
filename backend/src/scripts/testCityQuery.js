import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import City from '../models/City.js';
import HeritagePlace from '../models/content/HeritagePlace.js';
import HiddenPlace from '../models/content/HiddenPlace.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function checkIds() {
	await connectDatabase();
	const indore = await City.findOne({ name: 'Indore' }).lean();
	console.log('City Indore _id:', indore._id);

	const hp = await HeritagePlace.find({ cityId: indore._id }).lean();
	console.log(`HP items with cityId=${indore._id}: count=${hp.length}`);
	for (const h of hp.slice(0, 5)) {
		console.log(`  - "${h.title}" | status="${h.status}" | active=${h.active}`);
	}

	const hidden = await HiddenPlace.find({ cityId: indore._id }).lean();
	console.log(`Hidden items with cityId=${indore._id}: count=${hidden.length}`);
	for (const h of hidden.slice(0, 5)) {
		console.log(`  - "${h.title}" | status="${h.status}" | active=${h.active}`);
	}

	// Now test the actual API endpoint fetch!
	console.log('\n--- FETCHING FROM http://localhost:8080/api/public/cities/' + indore._id + '/sections ---');
	const res = await fetch(`http://localhost:8080/api/public/cities/${indore._id}/sections`);
	const json = await res.json();
	console.log('API returned city name:', json.city?.name);
	console.log('Sections returned:');
	for (const s of json.sections || []) {
		console.log(`  - [${s.slug}] ${s.title}: totalCount=${s.totalCount}, items=${s.items?.length}`);
	}

	await disconnectDatabase();
}

checkIds().catch(console.error);
