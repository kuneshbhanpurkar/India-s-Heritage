import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { ALL_CONTENT_MODELS, findAcross } from '../models/content/contentRegistry.js';
import User from '../models/User.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function inspectDb() {
	try {
		console.log('Connecting to database...');
		await connectDatabase();

		const collections = await mongoose.connection.db.listCollections().toArray();
		console.log('\n--- EXISTING COLLECTIONS ---');
		for (const c of collections.sort((a, b) => a.name.localeCompare(b.name))) {
			const count = await mongoose.connection.db.collection(c.name).countDocuments();
			console.log(`Collection: ${c.name.padEnd(25)} (${count} documents)`);
		}

		console.log('\n--- CATEGORY COLLECTIONS BREAKDOWN ---');
		for (const { slug, Model } of ALL_CONTENT_MODELS) {
			const count = await Model.countDocuments();
			const activeCount = await Model.countDocuments({ active: { $ne: false } });
			console.log(`- ${Model.collection.name.padEnd(22)} [${slug}]: total=${count}, active=${activeCount}`);
		}

		console.log('\n--- USERS ---');
		const users = await User.find({}).lean();
		users.forEach((u) => {
			console.log(`User: ${u.name} | ${u.email} | Role: ${u.role}`);
		});
	} catch (err) {
		console.error('Error inspecting DB:', err);
	} finally {
		await disconnectDatabase();
	}
}

inspectDb();
