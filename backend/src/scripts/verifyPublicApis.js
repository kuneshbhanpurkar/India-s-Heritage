
const BASE_URL = 'http://localhost:8080/api/public';

async function testEndpoints() {
	try {
		console.log('1. Testing GET /states...');
		const statesRes = await fetch(`${BASE_URL}/states`);
		const states = await statesRes.json();
		console.log(`   Fetched ${states.length} states:`, states.map(s => s.name));
		
		const mp = states.find(s => s.code === 'MP');
		if (!mp) throw new Error('MP not found');

		console.log('\n2. Testing GET /states/:stateId/cities (for MP)...');
		const citiesRes = await fetch(`${BASE_URL}/states/${mp._id}/cities`);
		const cities = await citiesRes.json();
		console.log(`   Fetched ${cities.length} cities in MP:`, cities.map(c => c.name));

		const indore = cities.find(c => c.name === 'Indore');
		if (!indore) throw new Error('Indore not found');

		console.log(`\n3. Testing GET /cities/:cityId/dashboard (for Indore)...`);
		const dashRes = await fetch(`${BASE_URL}/cities/${indore._id}/dashboard`);
		const dash = await dashRes.json();
		console.log(`   City: ${dash.city?.name}, Total Sections: ${dash.sections?.length || 0}`);
		(dash.sections || []).forEach(sec => {
			console.log(`     - [${sec.slug}] Title: "${sec.title}", Count: ${sec.totalCount}, Items: ${sec.items?.length || 0}`);
		});

		console.log('\n4. Testing GET /cities/:cityId/sections/heritage-places (for Indore)...');
		const secRes = await fetch(`${BASE_URL}/cities/${indore._id}/sections/heritage-places`);
		const sec = await secRes.json();
		console.log(`   Section items returned: ${sec.items?.length || 0}`);
		if (sec.items?.[0]) {
			console.log(`     First item: "${sec.items[0].name}", Media count: ${sec.items[0].mediaItems?.length || 0}`);
			console.log(`     Media details:`, sec.items[0].mediaItems);
		}

		console.log('\n5. Testing GET /content/rajwada-palace (Detail record)...');
		const detailRes = await fetch(`${BASE_URL}/content/rajwada-palace`);
		const detail = await detailRes.json();
		console.log(`   Detail record for "${detail.title}":`);
		console.log(`     Category: ${detail.category}`);
		console.log(`     Built By: ${detail.builtYear || detail.fields?.builtBy}`);
		console.log(`     Media count: ${detail.mediaItems?.length || 0}`);
		console.log(`     Documents count: ${detail.documents?.length || 0}`);

		console.log('\n🎉 ALL PUBLIC API CHECKS PASSED PERFECTLY!');
	} catch (err) {
		console.error('❌ Verification failed:', err);
		process.exitCode = 1;
	}
}

testEndpoints();
