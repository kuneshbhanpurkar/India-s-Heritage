import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import HeritagePlace from '../models/content/HeritagePlace.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function publishRajwada() {
	await connectDatabase();
	const res = await HeritagePlace.findByIdAndUpdate(
		'6ac50f22cee938b0d0ec34c7',
		{ $set: { status: 'published' } },
		{ new: true }
	);
	console.log('Updated status:', res?.title, '->', res?.status);
	await disconnectDatabase();
}

publishRajwada().catch(console.error);
