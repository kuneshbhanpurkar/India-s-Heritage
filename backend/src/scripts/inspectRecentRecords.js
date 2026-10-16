import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { ALL_CONTENT_MODELS } from '../models/content/contentRegistry.js';
import City from '../models/City.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function inspectRecent() {
	await connectDatabase();
	console.log('\n--- ALL RECENT RECORDS IN DATABASE ---');
	for (const { slug, Model } of ALL_CONTENT_MODELS) {
		const items = await Model.find({}).sort({ createdAt: -1 }).limit(10).populate('cityId', 'name slug').lean();
		console.log(`\nCategory: [${slug}] (Total in DB: ${await Model.countDocuments()})`);
		for (const item of items) {
			console.log(`  - Title: "${item.title}"`);
			console.log(`    Slug: "${item.slug}"`);
			console.log(`    Status: "${item.status}"`);
			console.log(`    Active: ${item.active}`);
			console.log(`    City/District: "${item.cityId?.name}" (ID: ${item.cityId?._id})`);
			console.log(`    Created: ${item.createdAt}`);
		}
	}
	await disconnectDatabase();
}

inspectRecent().catch(console.error);
