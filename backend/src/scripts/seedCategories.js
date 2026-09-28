import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import Category from '../models/Category.js';
import { CITY_SECTIONS } from '../config/sections.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

export async function seedCategories() {
	console.log('Seeding canonical categories into database...');
	let order = 1;
	for (const sec of CITY_SECTIONS) {
		await Category.findOneAndUpdate(
			{ slug: sec.slug },
			{
				name: sec.title,
				slug: sec.slug,
				type: sec.type || 'place',
				description: sec.description || '',
				icon: sec.icon || 'account_balance',
				aliases: sec.aliases || [],
				displayOrder: order++,
				globalActive: true,
				active: true,
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
	}
	console.log(`Successfully seeded ${CITY_SECTIONS.length} categories.`);
}

async function runStandalone() {
	try {
		await connectDatabase();
		await seedCategories();
	} catch (error) {
		console.error('Error seeding categories:', error);
	} finally {
		await disconnectDatabase();
	}
}

if (process.argv[1]?.endsWith('seedCategories.js')) {
	runStandalone();
}
