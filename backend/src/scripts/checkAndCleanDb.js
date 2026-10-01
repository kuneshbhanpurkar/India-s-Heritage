import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import Content from '../models/Content.js';
import User from '../models/User.js';
import State from '../models/State.js';
import City from '../models/City.js';
import Category from '../models/Category.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function inspectDb() {
	try {
		console.log('Connecting to database:', process.env.MONGODB_URI);
		await connectDatabase();
		
		const collections = await mongoose.connection.db.listCollections().toArray();
		console.log('\n--- EXISTING COLLECTIONS ---');
		for (let c of collections) {
			const count = await mongoose.connection.db.collection(c.name).countDocuments();
			console.log(`Collection: ${c.name} (${count} documents)`);
		}

		console.log('\n--- CONTENT BREAKDOWN ---');
		const contents = await Content.find({}).lean();
		console.log(`Total contents: ${contents.length}`);
		contents.forEach((doc, idx) => {
			console.log(`[${idx + 1}] Title: "${doc.title}", Category: "${doc.category}", Status: "${doc.status}", Type: "${doc.contentType}", State: "${doc.state}", District: "${doc.district}", Deleted: ${doc.isDeleted}`);
		});

		console.log('\n--- USERS ---');
		const users = await User.find({}).lean();
		users.forEach(u => {
			console.log(`User: ${u.name} | ${u.email} | Role: ${u.role}`);
		});

	} catch (err) {
		console.error('Error inspecting DB:', err);
	} finally {
		await disconnectDatabase();
	}
}

inspectDb();
