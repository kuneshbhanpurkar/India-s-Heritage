import 'dotenv/config';
import dns from 'dns';
import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { seedDirectoryIfEmpty } from '../src/config/seedDirectory.js';
import State from '../src/models/State.js';
import City from '../src/models/City.js';
import HeritagePlace from '../src/models/content/HeritagePlace.js';
import HiddenPlace from '../src/models/content/HiddenPlace.js';
import CultureTradition from '../src/models/content/CultureTradition.js';
import ArtFolk from '../src/models/content/ArtFolk.js';
import FoodMarket from '../src/models/content/FoodMarket.js';
import DistrictCategory from '../src/models/DistrictCategory.js';

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

async function runVerification() {
  console.log('====================================================');
  console.log('🔍 RUNNING USER-REQUESTED ACCEPTANCE TESTS (1 to 7)');
  console.log('====================================================\n');

  await connectDatabase();
  await seedDirectoryIfEmpty();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  // 0. Login admin
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'mp136366',
    }),
  });
  assert.strictEqual(adminLogin.status, 200, 'Admin login must succeed');
  const token = adminLogin.data.token;

  // Find MP and Indore
  const states = await request('/api/public/states');
  const mp = states.data.find((s) => s.code === 'MP');
  assert(mp, 'Madhya Pradesh state must exist');

  const mpCities = await request(`/api/public/states/${mp._id}/cities`);
  const indore = mpCities.data.find((c) => c.name === 'Indore');
  assert(indore, 'Indore must exist');

  // Create Bhopal if not present
  let bhopal = mpCities.data.find((c) => c.name === 'Bhopal');
  if (!bhopal) {
    const createBhopal = await City.create({
      name: 'Bhopal',
      stateId: mp._id,
      slug: 'bhopal',
    });
    bhopal = createBhopal;
  }

  console.log('📍 State: Madhya Pradesh, Districts: Indore, Bhopal');

  // -------------------------------------------------------------
  // TEST 1: Admin adds a Popular Place for MP -> Indore -> "Test Heritage Place"
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Popular Place in Indore Created & Visible Everywhere ---');
  const testPlace1 = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      cityId: indore._id,
      districtId: indore._id,
      stateId: mp._id,
      section: 'popular-places', // Alias for heritage-places
      title: 'Test Heritage Place 101',
      status: 'published',
      fields: {
        builtBy: 'Holkar Dynasty',
        era: '18th Century',
        timings: '09:00 AM - 06:00 PM',
        entryFee: { domestic: '50', student: '25', foreign: '250' },
      },
    }),
  });
  assert.strictEqual(testPlace1.status, 201);
  const testPlace1Id = testPlace1.data._id;

  // Verify MongoDB: Saved in heritage_places collection ONLY
  const inHeritagePlaces = await HeritagePlace.findById(testPlace1Id).lean();
  assert(inHeritagePlaces, 'Must exist in heritage_places collection');
  const inHiddenPlacesCheck = await HiddenPlace.findById(testPlace1Id).lean();
  assert.strictEqual(inHiddenPlacesCheck, null, 'Must NOT exist in hidden_places collection');

  // Verify Admin API
  const adminCheck = await request(`/api/admin/content/${testPlace1Id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(adminCheck.status, 200);
  assert.strictEqual(adminCheck.data.title, 'Test Heritage Place 101');

  // Verify Public API
  const publicSecRes = await request(`/api/public/cities/${indore._id}/sections/heritage-places`);
  assert.strictEqual(publicSecRes.status, 200);
  const pubItems = Array.isArray(publicSecRes.data) ? publicSecRes.data : publicSecRes.data.items;
  const foundInPublic = pubItems.find((i) => (i.id || i._id) === testPlace1Id);
  assert(foundInPublic, 'Record must be returned in public API for Indore -> Heritage & Places');
  assert.strictEqual(foundInPublic.title, 'Test Heritage Place 101');
  assert.strictEqual(foundInPublic.visitorTariffs?.length, 3, 'Visitor tariffs must be mapped correctly');
  console.log('✅ TEST 1 PASSED: Created Popular Place exists in MongoDB collection, Admin panel, and Public Website API');

  // -------------------------------------------------------------
  // TEST 2: Create a Hidden Place for MP -> Indore
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Hidden Place appears ONLY in Hidden Places, NOT in Popular Places ---');
  const testHidden = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      cityId: indore._id,
      districtId: indore._id,
      stateId: mp._id,
      section: 'hidden-places',
      title: 'Secret Indore Underground Cave',
      status: 'published',
      fields: {
        storyType: 'Historical Event',
        eventPeriod: '17th Century',
      },
    }),
  });
  assert.strictEqual(testHidden.status, 201);
  const testHiddenId = testHidden.data._id;

  // Verify MongoDB: Exists in hidden_places ONLY
  const hiddenInDb = await HiddenPlace.findById(testHiddenId).lean();
  assert(hiddenInDb, 'Must exist in hidden_places collection');
  const hiddenInHeritage = await HeritagePlace.findById(testHiddenId).lean();
  assert.strictEqual(hiddenInHeritage, null, 'Must NOT exist in heritage_places collection');

  // Verify Public API: Appears in Hidden Places
  const publicHiddenRes = await request(`/api/public/cities/${indore._id}/sections/hidden-places`);
  const pubHiddenItems = Array.isArray(publicHiddenRes.data) ? publicHiddenRes.data : publicHiddenRes.data.items;
  assert(pubHiddenItems.some((i) => (i.id || i._id) === testHiddenId), 'Must appear in Hidden Places');

  // Verify Public API: Does NOT appear in Popular Places
  const publicPopularRes = await request(`/api/public/cities/${indore._id}/sections/heritage-places`);
  const pubPopularItems = Array.isArray(publicPopularRes.data) ? publicPopularRes.data : publicPopularRes.data.items;
  assert(!pubPopularItems.some((i) => (i.id || i._id) === testHiddenId), 'Must NOT appear in Popular Places');
  console.log('✅ TEST 2 PASSED: Hidden Place strictly isolated to hidden_places collection & section');

  // -------------------------------------------------------------
  // TEST 3: Create Popular Place for Bhopal -> Indore Popular Places must NOT show Bhopal record
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Bhopal Popular Place does NOT leak into Indore ---');
  const bhopalPlace = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      cityId: bhopal._id,
      districtId: bhopal._id,
      stateId: mp._id,
      section: 'heritage-places',
      title: 'Taj-ul-Masajid Bhopal Landmark',
      status: 'published',
    }),
  });
  assert.strictEqual(bhopalPlace.status, 201);
  const bhopalPlaceId = bhopalPlace.data._id;

  // Query Indore Popular Places
  const indorePopularAfter = await request(`/api/public/cities/${indore._id}/sections/heritage-places`);
  const indoreItemsAfter = Array.isArray(indorePopularAfter.data) ? indorePopularAfter.data : indorePopularAfter.data.items;
  assert(!indoreItemsAfter.some((i) => (i.id || i._id) === bhopalPlaceId), 'Indore must NOT show Bhopal record');

  // Query Bhopal Popular Places
  const bhopalPopular = await request(`/api/public/cities/${bhopal._id}/sections/heritage-places`);
  const bhopalItems = Array.isArray(bhopalPopular.data) ? bhopalPopular.data : bhopalPopular.data.items;
  assert(bhopalItems.some((i) => (i.id || i._id) === bhopalPlaceId), 'Bhopal must show its own record');
  console.log('✅ TEST 3 PASSED: District isolation verified between Indore and Bhopal');

  // -------------------------------------------------------------
  // TEST 4: Draft Record -> Admin can see it, Public website must NOT display it
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Draft Record visible to Admin, hidden from Public Website ---');
  const draftPlace = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      cityId: indore._id,
      districtId: indore._id,
      stateId: mp._id,
      section: 'heritage-places',
      title: 'Unpublished Draft Place',
      status: 'draft',
    }),
  });
  assert.strictEqual(draftPlace.status, 201);
  const draftId = draftPlace.data._id;

  // Admin sees it
  const adminList = await request(`/api/admin/content?districtId=${indore._id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(Array.isArray(adminList.data) && adminList.data.some((i) => i.id === draftId || i._id === draftId), 'Admin must see draft');

  // Public website does NOT see it
  const publicList = await request(`/api/public/cities/${indore._id}/sections/heritage-places`);
  const publicListItems = Array.isArray(publicList.data) ? publicList.data : publicList.data.items;
  assert(!publicListItems.some((i) => i.id === draftId || i._id === draftId), 'Public site must NOT see draft');
  console.log('✅ TEST 4 PASSED: Draft record visibility rules enforced');

  // -------------------------------------------------------------
  // TEST 5: Turn a category OFF for Indore
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Category Toggle for Indore ---');
  // Turn arts-folk OFF for Indore
  const toggleOff = await request(`/api/admin/district-categories/${indore._id}/arts-folk`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled: false }),
  });
  assert.strictEqual(toggleOff.status, 200);

  // Check Indore Overview
  const indoreOverview = await request(`/api/public/cities/${indore._id}/sections`);
  const indoreSections = Array.isArray(indoreOverview.data) ? indoreOverview.data : indoreOverview.data.sections;
  assert(!indoreSections.some((s) => s.slug === 'arts-folk'), 'Disabled category must be excluded from sections');
  assert(indoreSections.some((s) => s.slug === 'heritage-places'), 'Enabled categories remain active');

  // Turn arts-folk back ON
  await request(`/api/admin/district-categories/${indore._id}/arts-folk`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled: true }),
  });
  console.log('✅ TEST 5 PASSED: Category toggle hides category for that district while others remain active');

  // -------------------------------------------------------------
  // TEST 6: Change district -> fetches only selected district
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Switching districts fetches ONLY that district data ---');
  const dIndore = await request(`/api/public/cities/${indore._id}/sections/heritage-places`);
  const dIndoreItems = Array.isArray(dIndore.data) ? dIndore.data : dIndore.data.items;
  assert(dIndoreItems.every((i) => (i.cityId || i.districtId) === indore._id.toString()));

  const dBhopal = await request(`/api/public/cities/${bhopal._id}/sections/heritage-places`);
  const dBhopalItems = Array.isArray(dBhopal.data) ? dBhopal.data : dBhopal.data.items;
  assert(dBhopalItems.every((i) => (i.cityId || i.districtId) === bhopal._id.toString()));
  console.log('✅ TEST 6 PASSED: District switching is clean with zero cross-contamination');

  // -------------------------------------------------------------
  // TEST 7: Refresh simulation -> loads fresh data from DB
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Refresh Simulation loads from backend ---');
  const freshFetch = await request(`/api/public/cities/${indore._id}/sections/heritage-places`);
  const freshItems = Array.isArray(freshFetch.data) ? freshFetch.data : freshFetch.data.items;
  assert(freshItems.some((i) => (i.id || i._id) === testPlace1Id), 'Fresh fetch loads same persistent data from MongoDB');
  console.log('✅ TEST 7 PASSED: Persistent DB data loaded consistently across stateless calls');

  // Cleanup test records
  await HeritagePlace.findByIdAndDelete(testPlace1Id);
  await HiddenPlace.findByIdAndDelete(testHiddenId);
  await HeritagePlace.findByIdAndDelete(bhopalPlaceId);
  await HeritagePlace.findByIdAndDelete(draftId);

  console.log('\n====================================================');
  console.log('🎉 ALL 7 ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================\n');

  server.close();
  await disconnectDatabase();
  process.exit(0);
}

runVerification().catch(async (err) => {
  console.error('❌ Verification test failed:', err);
  if (server) server.close();
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
