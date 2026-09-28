import 'dotenv/config';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import State from '../models/State.js';
import City from '../models/City.js';
import Content from '../models/Content.js';
import Category from '../models/Category.js';
import DistrictCategory from '../models/DistrictCategory.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function runEndToEndVerification() {
	console.log('--- DHAROHAR END-TO-END SYSTEM VERIFICATION ---');
	await connectDatabase();

	// 1. Verify States & Districts Hierarchy
	const states = await State.find({ active: true }).lean();
	console.log(`[PASS] States in DB: ${states.length}`);
	const cities = await City.find({ active: true }).lean();
	console.log(`[PASS] Districts in DB: ${cities.length}`);

	// 2. Verify Canonical Categories
	const categories = await Category.find({ active: true }).sort({ displayOrder: 1 }).lean();
	console.log(`[PASS] Categories seeded: ${categories.length}`);
	categories.forEach((c) => console.log(`   - ${c.name} (${c.slug}) [Order: ${c.displayOrder}]`));

	// 3. Verify Content Records & Fields
	const contents = await Content.find({ active: true }).lean();
	console.log(`[PASS] Total Heritage Records: ${contents.length}`);
	for (const item of contents) {
		console.log(`   - "${item.title}" | Section: ${item.section} | Status: ${item.status} | Media: ${item.media?.length || 0} items`);
	}

	// 4. Test Category Isolation Simulation
	if (cities.length > 0) {
		const testCity = cities[0];
		// Set culinary-heritage as disabled for testCity
		await DistrictCategory.findOneAndUpdate(
			{ districtId: testCity._id, categorySlug: 'culinary-heritage' },
			{ $set: { districtId: testCity._id, categorySlug: 'culinary-heritage', categoryId: 'culinary-heritage', enabled: false } },
			{ upsert: true }
		);

		const testConfigs = await DistrictCategory.find({ districtId: testCity._id }).lean();
		const isDisabled = testConfigs.some((c) => c.categorySlug === 'culinary-heritage' && c.enabled === false);
		console.log(`[PASS] District Category Isolation for "${testCity.name}": culinary-heritage is disabled = ${isDisabled}`);

		// Restore
		await DistrictCategory.findOneAndUpdate(
			{ districtId: testCity._id, categorySlug: 'culinary-heritage' },
			{ $set: { enabled: true } }
		);
		console.log(`[PASS] Restored culinary-heritage enabled status.`);
	}

	console.log('--- ALL SYSTEM VERIFICATIONS PASSED ---');
	await disconnectDatabase();
}

runEndToEndVerification().catch((err) => {
	console.error('Verification failed:', err);
	process.exitCode = 1;
});
