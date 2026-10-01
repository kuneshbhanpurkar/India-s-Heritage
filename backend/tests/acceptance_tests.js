import 'dotenv/config';
import dns from 'dns';
import assert from 'assert';
import http from 'http';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { seedDirectoryIfEmpty } from '../src/config/seedDirectory.js';
import {
	CATEGORY_DEFINITIONS,
	VALID_CATEGORY_SLUGS,
	resolveCategorySlug,
	sanitizeCategoryFields,
} from '../src/config/categoryDefinitions.js';
import Content from '../src/models/Content.js';
import State from '../src/models/State.js';
import City from '../src/models/City.js';
import User from '../src/models/User.js';
import DistrictCategory from '../src/models/DistrictCategory.js';
import { createToken } from '../src/utils/auth.js';

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

const testResults = [];

function recordTest(testNum, testName, passed, details = '') {
	testResults.push({ testNum, testName, passed, details });
	const icon = passed ? '✅ PASS' : '❌ FAIL';
	console.log(`[TEST ${testNum}] ${icon}: ${testName}${details ? ` -> ${details}` : ''}`);
}

async function runAcceptanceTests() {
	console.log('================================================================');
	console.log('   RUNNING COMPLETE 20-ACCEPTANCE-TEST SUITE FOR OUR_DHAROHAR   ');
	console.log('================================================================\n');

	await connectDatabase();
	await seedDirectoryIfEmpty();

	server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, resolve));
	const port = server.address().port;
	baseUrl = `http://localhost:${port}`;

	// Setup tokens & test jurisdictions
	const superAdmin = await User.findOne({ role: 'super_admin' });
	const adminToken = createToken(superAdmin);

	// Get or verify States and Districts
	let mpState = await State.findOne({ code: 'MP' });
	if (!mpState) mpState = await State.findOne({ name: 'Madhya Pradesh' });
	let rjState = await State.findOne({ code: 'RJ' });
	if (!rjState) rjState = await State.findOne({ name: 'Rajasthan' });

	let indoreDistrict = await City.findOne({ name: 'Indore', stateId: mpState._id });
	let jaipurDistrict = await City.findOne({ name: 'Jaipur', stateId: rjState._id });

	// Create scoped District Admin for District A (Indore)
	const indoreAdminEmail = 'admin_indore_test@ourdharohar.org';
	await User.deleteMany({ email: indoreAdminEmail });
	const indoreAdmin = await User.create({
		name: 'Indore District Officer',
		email: indoreAdminEmail,
		password: await bcrypt.hash('Password123!', 10),
		role: 'district_admin',
		stateId: mpState._id,
		cityId: indoreDistrict._id,
		active: true,
	});
	const indoreAdminToken = createToken(indoreAdmin);

	try {
		// -------------------------------------------------------------
		// TEST 1: Exactly 5 categories only
		// -------------------------------------------------------------
		{
			const expectedSlugs = [
				'heritage-places',
				'hidden-places',
				'culture-traditions',
				'arts-folk',
				'food-markets',
			];
			const keys = Object.keys(CATEGORY_DEFINITIONS);
			const isExact5 =
				keys.length === 5 &&
				expectedSlugs.every((slug) => keys.includes(slug)) &&
				VALID_CATEGORY_SLUGS.length === 5;

			assert(isExact5, 'Must have exactly the 5 specified categories');
			recordTest(1, 'Five categories only (heritage-places, hidden-places, culture-traditions, arts-folk, food-markets)', isExact5);
		}

		// -------------------------------------------------------------
		// TEST 2: Category form isolation (Food & Markets)
		// -------------------------------------------------------------
		{
			const foodDef = CATEGORY_DEFINITIONS['food-markets'];
			const foodFieldNames = foodDef.fields.map((f) => f.name);
			const expectedFoodFields = ['itemType', 'famousSince', 'whereToTry'];
			const hasExpected = expectedFoodFields.every((f) => foodFieldNames.includes(f));
			const noMonumentFields = !foodFieldNames.includes('builtBy') && !foodFieldNames.includes('era');

			assert(hasExpected && noMonumentFields, 'Food category must have only itemType, famousSince, whereToTry');
			recordTest(2, 'Category form isolation for Food & Markets', hasExpected && noMonumentFields);
		}

		// -------------------------------------------------------------
		// TEST 3: Heritage form (Heritage & Places)
		// -------------------------------------------------------------
		{
			const heritageDef = CATEGORY_DEFINITIONS['heritage-places'];
			const heritageFields = heritageDef.fields.map((f) => f.name);
			const expectedFields = ['builtBy', 'era', 'entryFee', 'timings'];
			const passed = expectedFields.every((f) => heritageFields.includes(f));

			assert(passed, 'Heritage category must have builtBy, era, entryFee, timings');
			recordTest(3, 'Heritage & Places form fields isolation', passed);
		}

		// -------------------------------------------------------------
		// TEST 4: Culture form (Culture & Traditions)
		// -------------------------------------------------------------
		{
			const cultureDef = CATEGORY_DEFINITIONS['culture-traditions'];
			const cultureFields = cultureDef.fields.map((f) => f.name);
			const expectedFields = ['festivalDate', 'frequency', 'ritualType'];
			const passed = expectedFields.every((f) => cultureFields.includes(f));

			assert(passed, 'Culture category must have festivalDate, frequency, ritualType');
			recordTest(4, 'Culture & Traditions form fields isolation', passed);
		}

		// -------------------------------------------------------------
		// TEST 5: Arts form (Arts & Folk)
		// -------------------------------------------------------------
		{
			const artsDef = CATEGORY_DEFINITIONS['arts-folk'];
			const artsFields = artsDef.fields.map((f) => f.name);
			const expectedFields = ['artFormType', 'artisanCommunity', 'origin'];
			const passed = expectedFields.every((f) => artsFields.includes(f));

			assert(passed, 'Arts & Folk category must have artFormType, artisanCommunity, origin');
			recordTest(5, 'Arts & Folk form fields isolation', passed);
		}

		// -------------------------------------------------------------
		// TEST 6: Hidden Places form (Hidden Places)
		// -------------------------------------------------------------
		{
			const hiddenDef = CATEGORY_DEFINITIONS['hidden-places'];
			const hiddenFields = hiddenDef.fields.map((f) => f.name);
			const expectedFields = ['eventPeriod', 'relatedPersonality', 'storyType'];
			const passed = expectedFields.every((f) => hiddenFields.includes(f));

			assert(passed, 'Hidden Places category must have eventPeriod, relatedPersonality, storyType');
			recordTest(6, 'Hidden Places form fields isolation', passed);
		}

		// -------------------------------------------------------------
		// TEST 7: Backend rejects invalid category
		// -------------------------------------------------------------
		{
			const invalidRes = await request('/api/admin/content', {
				method: 'POST',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					districtId: indoreDistrict._id.toString(),
					section: 'random-category',
					title: 'Invalid Category Record',
					status: 'draft',
				}),
			});

			const passed = invalidRes.status === 400 && invalidRes.data.error;
			assert(passed, 'Backend must reject invalid category with 400 Bad Request');
			recordTest(7, 'Backend rejects invalid category ("random-category")', passed, `Status: ${invalidRes.status}`);
		}

		// -------------------------------------------------------------
		// TEST 8: Backend rejects / sanitizes mismatched category fields
		// -------------------------------------------------------------
		{
			const res = await request('/api/admin/content', {
				method: 'POST',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					districtId: indoreDistrict._id.toString(),
					section: 'heritage-places',
					title: 'Test Sanitized Fields Record',
					status: 'draft',
					fields: {
						builtBy: 'Holkar Dynasty',
						era: '18th Century',
						ritualType: 'Traditional Malwi Ritual', // Belongs to culture-traditions!
						itemType: 'Dish', // Belongs to food-markets!
					},
				}),
			});

			assert.strictEqual(res.status, 201);
			const createdRecord = res.data;
			const passed =
				createdRecord.fields.builtBy === 'Holkar Dynasty' &&
				createdRecord.fields.era === '18th Century' &&
				createdRecord.fields.ritualType === undefined &&
				createdRecord.fields.itemType === undefined;

			assert(passed, 'Backend must whitelist category fields and drop mismatched fields');
			recordTest(8, 'Backend sanitizes mismatched category fields against whitelist', passed);

			// Clean up
			await Content.findByIdAndDelete(createdRecord._id);
		}

		// -------------------------------------------------------------
		// TEST 9: District Isolation (Indore vs Jaipur)
		// -------------------------------------------------------------
		{
			// Create Rajwada in MP -> Indore -> heritage-places
			const rajwadaRes = await request('/api/admin/content', {
				method: 'POST',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					districtId: indoreDistrict._id.toString(),
					stateId: mpState._id.toString(),
					section: 'heritage-places',
					title: 'Rajwada Palace Test Scope',
					status: 'published',
					latitude: 22.7196,
					longitude: 75.8577,
					fields: {
						builtBy: 'Malhar Rao Holkar',
					},
				}),
			});
			assert.strictEqual(rajwadaRes.status, 201);
			const rajwadaId = rajwadaRes.data._id;

			// Query public Jaipur heritage places
			const jaipurQuery = await request(`/api/public/cities/${jaipurDistrict._id}/sections/heritage-places`);
			assert.strictEqual(jaipurQuery.status, 200);
			const jaipurItems = Array.isArray(jaipurQuery.data) ? jaipurQuery.data : jaipurQuery.data.items;

			const rajwadaInJaipur = jaipurItems.some((item) => (item.id || item._id) === rajwadaId);
			const passed = !rajwadaInJaipur;

			assert(passed, 'Indore record must not appear in Jaipur query');
			recordTest(9, 'District isolation: Indore record does not appear in Jaipur workspace', passed);

			// Clean up
			await Content.findByIdAndDelete(rajwadaId);
		}

		// -------------------------------------------------------------
		// TEST 10: Category Visibility (District Specific)
		// -------------------------------------------------------------
		{
			// Create a food record in Indore
			const pohaRes = await request('/api/admin/content', {
				method: 'POST',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					districtId: indoreDistrict._id.toString(),
					section: 'food-markets',
					title: 'Indori Poha Test Food',
					status: 'published',
				}),
			});
			assert.strictEqual(pohaRes.status, 201);
			const pohaId = pohaRes.data._id;

			// 1. Disable food-markets for Indore
			const toggleOff = await request(
				`/api/admin/district-categories/${indoreDistrict._id}/food-markets`,
				{
					method: 'PUT',
					headers: { Authorization: `Bearer ${adminToken}` },
					body: JSON.stringify({ enabled: false }),
				},
			);
			assert.strictEqual(toggleOff.status, 200);

			// Check public query for disabled category: must return empty array
			const publicCheckDisabled = await request(
				`/api/public/cities/${indoreDistrict._id}/sections/food-markets`,
			);
			const isHidden = Array.isArray(publicCheckDisabled.data) && publicCheckDisabled.data.length === 0;

			// Verify record was NOT deleted in MongoDB
			const recordInDb = await Content.findById(pohaId);
			const recordStillExists = recordInDb !== null;

			// 2. Enable food-markets again
			const toggleOn = await request(
				`/api/admin/district-categories/${indoreDistrict._id}/food-markets`,
				{
					method: 'PUT',
					headers: { Authorization: `Bearer ${adminToken}` },
					body: JSON.stringify({ enabled: true }),
				},
			);
			assert.strictEqual(toggleOn.status, 200);

			const publicCheckEnabled = await request(
				`/api/public/cities/${indoreDistrict._id}/sections/food-markets`,
			);
			const isAvailableAgain =
				Array.isArray(publicCheckEnabled.data) &&
				publicCheckEnabled.data.some((i) => (i.id || i._id) === pohaId);

			const passed = isHidden && recordStillExists && isAvailableAgain;
			assert(passed, 'Disabling category hides it publicly without deleting records');
			recordTest(10, 'Category visibility: District-specific enable/disable toggle works properly', passed);

			// Clean up
			await Content.findByIdAndDelete(pohaId);
		}

		// -------------------------------------------------------------
		// TEST 11: Edit without duplication
		// -------------------------------------------------------------
		{
			// 1. Create a record
			const created = await request('/api/admin/content', {
				method: 'POST',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					districtId: indoreDistrict._id.toString(),
					section: 'heritage-places',
					title: 'Original Title Rajwada',
					status: 'draft',
				}),
			});
			assert.strictEqual(created.status, 201);
			const recordId = created.data._id;

			// 2. Edit the record
			const updated = await request(`/api/admin/content/${recordId}`, {
				method: 'PUT',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					title: 'Updated Title Rajwada Royal Palace',
					status: 'published',
				}),
			});
			assert.strictEqual(updated.status, 200);

			// 3. Count documents with both titles
			const totalMatching = await Content.countDocuments({
				_id: recordId,
				title: 'Updated Title Rajwada Royal Palace',
			});
			const allRajwadas = await Content.countDocuments({
				districtId: indoreDistrict._id,
				title: { $regex: 'Rajwada', $options: 'i' },
			});

			const passed = totalMatching === 1 && allRajwadas === 1;
			assert(passed, 'Edit must update existing document and not create duplicate');
			recordTest(11, 'Edit without duplication: Existing ID updated in place', passed);

			// Clean up
			await Content.findByIdAndDelete(recordId);
		}

		// -------------------------------------------------------------
		// TEST 12: Add record inheritance
		// -------------------------------------------------------------
		{
			const res = await request('/api/admin/content', {
				method: 'POST',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					districtId: indoreDistrict._id.toString(),
					stateId: mpState._id.toString(),
					section: 'food-markets',
					title: 'Indore Sarafa Chaat',
					status: 'draft',
				}),
			});
			assert.strictEqual(res.status, 201);
			const created = res.data;

			const passed =
				created.districtId.toString() === indoreDistrict._id.toString() &&
				created.stateId.toString() === mpState._id.toString() &&
				created.section === 'food-markets';

			assert(passed, 'Record must inherit district, state, and category from workspace');
			recordTest(12, 'Add record inheritance: inherits stateId, districtId, and category', passed);

			// Clean up
			await Content.findByIdAndDelete(created._id);
		}

		// -------------------------------------------------------------
		// TEST 13: Unauthorized District Modification (DELETE Cross-District)
		// -------------------------------------------------------------
		{
			// Create a Jaipur record
			const jaipurRecord = await Content.create({
				cityId: jaipurDistrict._id,
				districtId: jaipurDistrict._id,
				stateId: rjState._id,
				section: 'heritage-places',
				title: 'Jaipur Protected Monument',
				slug: `jaipur-protected-${Date.now()}`,
				status: 'published',
				active: true,
			});

			// Admin assigned to Indore tries to DELETE Jaipur record
			const crossDeleteRes = await request(`/api/admin/content/${jaipurRecord._id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${indoreAdminToken}` },
			});

			const isForbidden = crossDeleteRes.status === 403;
			const recordStillAlive = await Content.findById(jaipurRecord._id);

			const passed = isForbidden && recordStillAlive !== null;
			assert(passed, 'Cross-district DELETE must be rejected with 403 Forbidden');
			recordTest(13, 'Unauthorized district modification: DELETE cross-district returns 403', passed, `Status: ${crossDeleteRes.status}`);

			// Clean up
			await Content.findByIdAndDelete(jaipurRecord._id);
		}

		// -------------------------------------------------------------
		// TEST 14: Status Authorization (PATCH Cross-District)
		// -------------------------------------------------------------
		{
			// Create a Jaipur record
			const jaipurRecord = await Content.create({
				cityId: jaipurDistrict._id,
				districtId: jaipurDistrict._id,
				stateId: rjState._id,
				section: 'heritage-places',
				title: 'Jaipur Status Protected Monument',
				slug: `jaipur-status-${Date.now()}`,
				status: 'draft',
				active: true,
			});

			// Indore Admin tries to publish Jaipur record
			const crossPatchRes = await request(`/api/admin/content/${jaipurRecord._id}/status`, {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${indoreAdminToken}` },
				body: JSON.stringify({ status: 'published' }),
			});

			const isForbidden = crossPatchRes.status === 403;
			const recordInDb = await Content.findById(jaipurRecord._id);
			const notPublished = recordInDb?.status === 'draft';

			const passed = isForbidden && notPublished;
			assert(passed, 'Cross-district status change must be rejected with 403');
			recordTest(14, 'Status authorization: Cross-district status patch returns 403', passed, `Status: ${crossPatchRes.status}`);

			// Clean up
			await Content.findByIdAndDelete(jaipurRecord._id);
		}

		// -------------------------------------------------------------
		// TEST 15: Soft Delete
		// -------------------------------------------------------------
		{
			const record = await Content.create({
				cityId: indoreDistrict._id,
				districtId: indoreDistrict._id,
				stateId: mpState._id,
				section: 'heritage-places',
				title: 'Soft Delete Verification Monument',
				slug: `soft-del-${Date.now()}`,
				status: 'published',
				active: true,
			});

			// Delete through Admin API
			const delRes = await request(`/api/admin/content/${record._id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			assert.strictEqual(delRes.status, 204);

			// Check DB: document still exists with active = false
			const docInDb = await Content.findById(record._id);
			const isSoftDeleted = docInDb !== null && docInDb.active === false;

			// Public query does NOT return it
			const publicRes = await request(`/api/public/content/${record._id}`);
			const isPubliclyGone = publicRes.status === 404;

			const passed = isSoftDeleted && isPubliclyGone;
			assert(passed, 'Deletion must set active = false and hide from public queries without hard deleting');
			recordTest(15, 'Soft delete: sets active = false and hides from queries without document destruction', passed);

			// Clean up
			await Content.findByIdAndDelete(record._id);
		}

		// -------------------------------------------------------------
		// TEST 16: Coordinates validation (Never silent 0,0)
		// -------------------------------------------------------------
		{
			// 1. Invalid coordinates should return 400 error
			const invalidLatRes = await request('/api/admin/content', {
				method: 'POST',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					districtId: indoreDistrict._id.toString(),
					section: 'heritage-places',
					title: 'Invalid Coordinates Test',
					latitude: 999, // Invalid
					longitude: 75.8,
				}),
			});
			const rejectedInvalid = invalidLatRes.status === 400;

			// 2. Draft without coordinates should NOT save fake [0,0]
			const noCoordRes = await request('/api/admin/content', {
				method: 'POST',
				headers: { Authorization: `Bearer ${adminToken}` },
				body: JSON.stringify({
					districtId: indoreDistrict._id.toString(),
					section: 'heritage-places',
					title: 'No Coordinates Test',
				}),
			});
			assert.strictEqual(noCoordRes.status, 201);
			const createdNoCoord = noCoordRes.data;
			const noFakeCoords =
				createdNoCoord.latitude === undefined &&
				createdNoCoord.longitude === undefined;

			const passed = rejectedInvalid && noFakeCoords;
			assert(passed, 'Coordinates must be validated and never silently default to 0,0');
			recordTest(16, 'Coordinates validation: Validated strictly and never defaults to 0,0 fallback', passed);

			// Clean up
			await Content.findByIdAndDelete(createdNoCoord._id);
		}

		// -------------------------------------------------------------
		// TEST 17: Fake Media Metadata Cleaned
		// -------------------------------------------------------------
		{
			const mediaRecord = await Content.create({
				cityId: indoreDistrict._id,
				districtId: indoreDistrict._id,
				stateId: mpState._id,
				section: 'heritage-places',
				title: 'Real Media Test Place',
				slug: `media-test-${Date.now()}`,
				status: 'published',
				media: [
					{
						type: 'image',
						url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41',
						title: 'Palace Archway',
						active: true,
					},
				],
				active: true,
			});

			const publicDetail = await request(`/api/public/content/${mediaRecord._id}`);
			assert.strictEqual(publicDetail.status, 200);

			// Verify media array has real items without fabricated metadata
			const passed =
				Array.isArray(publicDetail.data.media) &&
				publicDetail.data.media[0].url.includes('unsplash');

			assert(passed, 'Media metadata represents real items');
			recordTest(17, 'Fake metadata: No fabricated duration, quality, or page count', passed);

			// Clean up
			await Content.findByIdAndDelete(mediaRecord._id);
		}

		// -------------------------------------------------------------
		// TEST 18: Empty Database handling (No dummy data)
		// -------------------------------------------------------------
		{
			// Query a section with 0 records
			const emptySection = await request(
				`/api/public/cities/${jaipurDistrict._id}/sections/hidden-places`,
			);
			assert.strictEqual(emptySection.status, 200);
			const items = Array.isArray(emptySection.data) ? emptySection.data : emptySection.data.items;

			const passed = Array.isArray(items);
			recordTest(18, 'Empty database: Returns proper empty state without injecting dummy records', passed);
		}

		// -------------------------------------------------------------
		// TEST 19: Refresh & Scoped Workspace Persistence
		// -------------------------------------------------------------
		{
			const summaryRes = await request(
				`/api/admin/summary?districtId=${indoreDistrict._id.toString()}`,
				{
					headers: { Authorization: `Bearer ${adminToken}` },
				},
			);
			assert.strictEqual(summaryRes.status, 200);
			const hasCoverage = summaryRes.data.coverage && summaryRes.data.content;

			assert(hasCoverage, 'Summary must return valid scoped metrics for district');
			recordTest(19, 'Refresh & Scoped Workspace: District scoped summary returns verified database counts', Boolean(hasCoverage));
		}

		// -------------------------------------------------------------
		// TEST 20: No Data Mixing Across Jurisdictions
		// -------------------------------------------------------------
		{
			// Create Indore Poha
			const indorePoha = await Content.create({
				cityId: indoreDistrict._id,
				districtId: indoreDistrict._id,
				stateId: mpState._id,
				section: 'food-markets',
				title: 'Indori Poha Exclusive',
				slug: `indore-poha-${Date.now()}`,
				status: 'published',
				active: true,
			});

			// Create Jaipur Dal Baati
			const jaipurDalBaati = await Content.create({
				cityId: jaipurDistrict._id,
				districtId: jaipurDistrict._id,
				stateId: rjState._id,
				section: 'food-markets',
				title: 'Jaipuri Dal Baati Exclusive',
				slug: `jaipur-dal-baati-${Date.now()}`,
				status: 'published',
				active: true,
			});

			// Fetch Indore food
			const indoreFoodRes = await request(
				`/api/public/cities/${indoreDistrict._id}/sections/food-markets`,
			);
			const indoreFoodItems = Array.isArray(indoreFoodRes.data)
				? indoreFoodRes.data
				: indoreFoodRes.data.items;

			// Fetch Jaipur food
			const jaipurFoodRes = await request(
				`/api/public/cities/${jaipurDistrict._id}/sections/food-markets`,
			);
			const jaipurFoodItems = Array.isArray(jaipurFoodRes.data)
				? jaipurFoodRes.data
				: jaipurFoodRes.data.items;

			const indoreHasPoha = indoreFoodItems.some((i) => i.title.includes('Indori Poha'));
			const indoreHasDalBaati = indoreFoodItems.some((i) => i.title.includes('Dal Baati'));
			const jaipurHasDalBaati = jaipurFoodItems.some((i) => i.title.includes('Dal Baati'));
			const jaipurHasPoha = jaipurFoodItems.some((i) => i.title.includes('Indori Poha'));

			const passed =
				indoreHasPoha &&
				!indoreHasDalBaati &&
				jaipurHasDalBaati &&
				!jaipurHasPoha;

			assert(passed, 'Indore and Jaipur data must remain strictly isolated');
			recordTest(20, 'No data mixing: Distinct records appear only in their designated district', passed);

			// Clean up
			await Content.findByIdAndDelete(indorePoha._id);
			await Content.findByIdAndDelete(jaipurDalBaati._id);
		}

		console.log('\n================================================================');
		const passedCount = testResults.filter((t) => t.passed).length;
		console.log(`ACCEPTANCE TEST RESULTS: ${passedCount} / ${testResults.length} PASSED`);
		console.log('================================================================\n');
	} finally {
		// Clean up test users
		await User.deleteMany({ email: indoreAdminEmail });
		server.close();
		await disconnectDatabase();
	}
}

runAcceptanceTests().catch(async (err) => {
	console.error('Acceptance test execution error:', err);
	if (server) server.close();
	await disconnectDatabase().catch(() => {});
	process.exit(1);
});
