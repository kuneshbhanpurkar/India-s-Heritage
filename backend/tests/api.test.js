import 'dotenv/config';
import dns from 'dns';
import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { seedDirectoryIfEmpty } from '../src/config/seedDirectory.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

let server;
let baseUrl;

async function request(path, options = {}) {
	const res = await fetch(`${baseUrl}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
	});
	const data = await res.json().catch(() => ({}));
	return { status: res.status, ok: res.ok, data };
}

async function runTests() {
	console.log('=== DHAROHAR BACKEND INTEGRATION TEST SUITE ===\n');

	await connectDatabase();
	await seedDirectoryIfEmpty();

	server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, resolve));
	const port = server.address().port;
	baseUrl = `http://localhost:${port}`;
	console.log(`Test server running at ${baseUrl}\n`);

	let adminToken = '';
	let userToken = '';
	let indoreCityId = '';
	let jaipurCityId = '';

	// 1. Health check
	console.log('1. Testing GET /health ...');
	const health = await request('/health');
	assert.strictEqual(health.status, 200);
	assert.strictEqual(health.data.ok, true);
	console.log('   ✓ Health check passed');

	// 2. Admin Authentication with correct credentials
	console.log('2. Testing Admin Login with correct credentials ...');
	const adminLogin = await request('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({
			email: process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com',
			password: process.env.ADMIN_PASSWORD || 'mp136366',
		}),
	});
	assert.strictEqual(adminLogin.status, 200);
	assert(adminLogin.data.token, 'Token must be present in login response');
	assert(adminLogin.data.admin, 'Admin object must be present in response');
	assert.strictEqual(adminLogin.data.admin.email.toLowerCase(), (process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com').toLowerCase());
	adminToken = adminLogin.data.token;
	console.log('   ✓ Admin login succeeded with valid JWT');

	// 3. Admin Authentication with wrong credentials
	console.log('3. Testing Admin Login with invalid credentials ...');
	const invalidLogin = await request('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({
			email: process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com',
			password: 'WrongPassword123!',
		}),
	});
	assert.strictEqual(invalidLogin.status, 401);
	console.log('   ✓ Invalid credentials correctly rejected with 401');

	// 4. User Login and Role Enforcement
	console.log('4. Testing User Login and RBAC against Admin endpoints ...');
	const userLogin = await request('/api/users/login', {
		method: 'POST',
		body: JSON.stringify({
			email: 'citizen_test@dharohar.gov.in',
			password: 'TestPassword123!',
		}),
	});
	if (userLogin.status === 200) {
		userToken = userLogin.data.token;
	} else {
		const userReg = await request('/api/users/register', {
			method: 'POST',
			body: JSON.stringify({
				name: 'Test Citizen',
				email: 'citizen_test@dharohar.gov.in',
				password: 'TestPassword123!',
				state: 'Madhya Pradesh',
				district: 'Indore',
			}),
		});
		assert.strictEqual(userReg.status, 201);
		userToken = userReg.data.token;
	}

	// User token sent to Admin endpoint must be 403 Forbidden
	const userForbidden = await request('/api/admin/summary', {
		headers: { Authorization: `Bearer ${userToken}` },
	});
	assert.strictEqual(userForbidden.status, 403, 'User token must receive 403 on admin endpoint');
	console.log('   ✓ User role strictly forbidden (403) on admin endpoints');

	// 5. Unauthenticated request to Admin endpoint must be 401
	console.log('5. Testing Unauthenticated Request to Admin endpoints ...');
	const unauth = await request('/api/admin/summary');
	assert.strictEqual(unauth.status, 401);
	console.log('   ✓ Unauthenticated request rejected with 401');

	// 6. Public States and Cities
	console.log('6. Testing Public States and City Lookup ...');
	const states = await request('/api/public/states');
	assert.strictEqual(states.status, 200);
	assert(states.data.length > 0, 'States must not be empty');

	const mp = states.data.find((s) => s.code === 'MP');
	assert(mp, 'Madhya Pradesh must exist');

	const mpCities = await request(`/api/public/states/${mp._id}/cities`);
	assert.strictEqual(mpCities.status, 200);
	const indore = mpCities.data.find((c) => c.name === 'Indore');
	assert(indore, 'Indore city must exist in MP');
	indoreCityId = indore._id;

	const rj = states.data.find((s) => s.code === 'RJ');
	const rjCities = await request(`/api/public/states/${rj._id}/cities`);
	const jaipur = rjCities.data.find((c) => c.name === 'Jaipur');
	assert(jaipur, 'Jaipur city must exist in RJ');
	jaipurCityId = jaipur._id;
	console.log('   ✓ States and dynamic cities loaded');

	// 7. Dynamic 5-Section Overview
	console.log('7. Testing Dynamic 5-Section Overview for Indore ...');
	// Create an Indore test item first
	const indoreCreateRes = await request('/api/admin/content', {
		method: 'POST',
		headers: { Authorization: `Bearer ${adminToken}` },
		body: JSON.stringify({
			cityId: indoreCityId,
			section: 'popular-places',
			title: 'Indore Test Heritage Monument',
			status: 'published',
			latitude: 22.7196,
			longitude: 75.8577,
			fields: {
				subTitle: 'Historic monument in central Indore',
				description: 'A monument tested for dynamic section API loading.',
			},
		}),
	});
	assert.strictEqual(indoreCreateRes.status, 201);
	const indoreCreatedId = indoreCreateRes.data._id;

	const indoreSections = await request(`/api/public/cities/${indoreCityId}/sections`);
	assert.strictEqual(indoreSections.status, 200);
	assert.strictEqual(indoreSections.data.sections.length, 5, 'Must have exactly 5 canonical sections');
	const popularSection = indoreSections.data.sections.find((s) => s.slug === 'popular-places');
	assert(popularSection.totalCount >= 1, 'Indore must have at least 1 popular place');
	console.log('   ✓ 5 Canonical sections returned with city-scoped items');

	// 8. Dynamic Section Content Loading
	console.log('8. Testing Single Section Content (Popular Places for Indore) ...');
	const indorePop = await request(`/api/public/cities/${indoreCityId}/sections/popular-places`);
	assert.strictEqual(indorePop.status, 200);
	assert(indorePop.data.items.length >= 1, 'Indore popular places items must be present');
	assert(indorePop.data.items.every((item) => item.cityId === indoreCityId), 'All items must strictly belong to Indore');
	console.log('   ✓ Section items are strictly city-isolated');

	// 9. Cross-City Isolation Verification (Indore vs Jaipur)
	console.log('9. Testing Cross-City Isolation (Jaipur must not show Indore content) ...');
	const jaipurPop = await request(`/api/public/cities/${jaipurCityId}/sections/popular-places`);
	assert.strictEqual(jaipurPop.status, 200);
	assert(jaipurPop.data.items.every((item) => item.cityId === jaipurCityId), 'No Indore items can leak into Jaipur');
	console.log('   ✓ Zero cross-city data leakage verified');

	// 10. Admin CRUD Lifecycle
	console.log('10. Testing Admin CRUD Lifecycle ...');
	const newPlace = await request('/api/admin/content', {
		method: 'POST',
		headers: { Authorization: `Bearer ${adminToken}` },
		body: JSON.stringify({
			cityId: jaipurCityId,
			section: 'popular-places',
			title: 'Hawa Mahal Palace of Winds',
			status: 'published',
			latitude: 26.9239,
			longitude: 75.8267,
			fields: {
				subTitle: 'Iconic five-story pink sandstone palace with 953 jharokhas',
				description: 'Built in 1799 by Maharaja Sawai Pratap Singh, designed by Lal Chand Ustad.',
			},
		}),
	});
	assert.strictEqual(newPlace.status, 201, 'Place must be created');
	const createdId = newPlace.data._id;

	// Verify it now appears in Jaipur public query
	const jaipurUpdated = await request(`/api/public/cities/${jaipurCityId}/sections/popular-places`);
	assert(jaipurUpdated.data.items.some((i) => i.title.includes('Hawa Mahal')), 'Created place must appear in Jaipur');

	// Update the place
	const updatedPlace = await request(`/api/admin/content/${createdId}`, {
		method: 'PUT',
		headers: { Authorization: `Bearer ${adminToken}` },
		body: JSON.stringify({
			title: 'Hawa Mahal (Palace of Winds)',
			status: 'draft', // Change to draft
		}),
	});
	assert.strictEqual(updatedPlace.status, 200);

	// Verify draft is now HIDDEN from public website query
	const jaipurDraftCheck = await request(`/api/public/cities/${jaipurCityId}/sections/popular-places`);
	assert(!jaipurDraftCheck.data.items.some((i) => i.id === createdId), 'Draft place must NOT appear publicly');
	console.log('   ✓ Draft status correctly hidden from public queries');

	// Delete test places
	const deleteJaipurPlace = await request(`/api/admin/content/${createdId}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${adminToken}` },
	});
	assert.strictEqual(deleteJaipurPlace.status, 204);

	// 11. Geospatial Nearby Search
	console.log('11. Testing Geospatial "Around Me" API ...');
	const nearby = await request('/api/public/nearby?lat=22.7196&lng=75.8577&km=20');
	assert.strictEqual(nearby.status, 200);
	assert(nearby.data.length > 0, 'Nearby places around Indore coordinates must be found');
	console.log(`   ✓ Found ${nearby.data.length} nearby places within 20km of Indore`);

	// Clean up indore test place
	await request(`/api/admin/content/${indoreCreatedId}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${adminToken}` },
	});

	console.log('\n===========================================');
	console.log('ALL 11 INTEGRATION TESTS PASSED SUCCESSFULLY!');
	console.log('===========================================\n');

	server.close();
	await disconnectDatabase();
	process.exit(0);
}

runTests().catch(async (err) => {
	console.error('TEST FAILURE:', err);
	if (server) server.close();
	await disconnectDatabase().catch(() => {});
	process.exit(1);
});
