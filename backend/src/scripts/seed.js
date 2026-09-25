import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { seedDirectoryIfEmpty } from '../config/seedDirectory.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function runManualSeed() {
	try {
		console.log('Connecting to canonical Dharohar database...');
		await connectDatabase();
		console.log('Running idempotent seed...');
		await seedDirectoryIfEmpty();
		console.log('Seed completed successfully.');
	} catch (error) {
		console.error('Seed execution error:', error);
		process.exitCode = 1;
	} finally {
		await disconnectDatabase();
		console.log('Database disconnected.');
	}
}

runManualSeed();
