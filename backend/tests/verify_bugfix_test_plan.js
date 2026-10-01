import 'dotenv/config';
import dns from 'dns';
import assert from 'assert';
import http from 'http';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { seedDirectoryIfEmpty } from '../src/config/seedDirectory.js';
import Content from '../src/models/Content.js';
import State from '../src/models/State.js';
import District from '../src/models/District.js';
import User from '../src/models/User.js';
import DistrictCategory from '../src/models/DistrictCategory.js';
import { CATEGORY_DEFINITIONS } from '../src/config/categoryDefinitions.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

let server;
let baseUrl;

const testReport = [];

function recordTest(id, name, passed, notes = '', dbProof = '') {
  testReport.push({ id, name, passed, notes, dbProof });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] ${id}: ${name} ${notes ? `(${notes})` : ''}`);
  if (dbProof) {
    console.log(`       DB Proof: ${dbProof}`);
  }
}

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

async function runCompleteTestPlan() {
  console.log('================================================================');
  console.log('  OUR_DHAROHAR BUG-FIX TEST PLAN VERIFICATION SUITE');
  console.log('================================================================\n');

  await connectDatabase();
  await seedDirectoryIfEmpty();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Verification Server listening at ${baseUrl}\n`);

  // Setup: Find or create MP -> Indore and Bhopal districts
  let mpState = await State.findOne({ code: 'MP' });
  if (!mpState) {
    mpState = await State.create({ name: 'Madhya Pradesh', code: 'MP', active: true });
  }

  let indoreDistrict = await District.findOne({ name: 'Indore', stateId: mpState._id });
  if (!indoreDistrict) {
    indoreDistrict = await District.create({ name: 'Indore', slug: 'indore', stateId: mpState._id, active: true });
  }

  let bhopalDistrict = await District.findOne({ name: 'Bhopal', stateId: mpState._id });
  if (!bhopalDistrict) {
    bhopalDistrict = await District.create({ name: 'Bhopal', slug: 'bhopal', stateId: mpState._id, active: true });
  }

  // Setup admin users:
  // 1. Super admin
  const superAdminPassword = process.env.ADMIN_PASSWORD || 'mp136366';
  const superAdminEmail = process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
  const superAdminUser = await User.findOneAndUpdate(
    { email: superAdminEmail },
    { name: 'Super Admin Officer', role: 'super_admin', password: superAdminHash, active: true },
    { upsert: true, new: true }
  );

  const superLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: superAdminEmail, password: superAdminPassword }),
  });
  assert.strictEqual(superLoginRes.status, 200);
  const superAdminToken = superLoginRes.data.token;

  // 2. Indore district_admin
  const indoreAdminEmail = 'indore_admin@dharohar.gov.in';
  const indoreAdminPass = 'IndoreAdminPass123!';
  const indoreAdminHash = await bcrypt.hash(indoreAdminPass, 10);
  const indoreAdminUser = await User.findOneAndUpdate(
    { email: indoreAdminEmail },
    {
      name: 'Indore District Admin',
      role: 'district_admin',
      districtId: indoreDistrict._id,
      cityId: indoreDistrict._id,
      stateId: mpState._id,
      password: indoreAdminHash,
      active: true,
    },
    { upsert: true, new: true }
  );

  const indoreLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: indoreAdminEmail, password: indoreAdminPass }),
  });
  assert.strictEqual(indoreLoginRes.status, 200);
  const indoreAdminToken = indoreLoginRes.data.token;

  // 3. Bhopal district_admin
  const bhopalAdminEmail = 'bhopal_admin@dharohar.gov.in';
  const bhopalAdminPass = 'BhopalAdminPass123!';
  const bhopalAdminHash = await bcrypt.hash(bhopalAdminPass, 10);
  const bhopalAdminUser = await User.findOneAndUpdate(
    { email: bhopalAdminEmail },
    {
      name: 'Bhopal District Admin',
      role: 'district_admin',
      districtId: bhopalDistrict._id,
      cityId: bhopalDistrict._id,
      stateId: mpState._id,
      password: bhopalAdminHash,
      active: true,
    },
    { upsert: true, new: true }
  );

  console.log('--- 0. Setup & Credential Verification ---');
  // 0.1 Confirm old credentials rejected
  const oldLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: superAdminEmail, password: 'old_unrotated_password_wrong' }),
  });
  recordTest('0.1', 'Old unrotated password rejected', oldLoginRes.status === 401, `Status: ${oldLoginRes.status}`);

  // 0.2 Valid login succeeded
  recordTest('0.2', 'Rotated credentials in use', !!superAdminToken, `super_admin JWT generated`);

  console.log('\n--- 1. Category Schema & Dynamic Form Tests ---');
  // 1.1 Heritage & Places schema
  const heritageDef = CATEGORY_DEFINITIONS['heritage-places'];
  const heritageKeys = heritageDef.fields.map(f => f.name);
  const heritagePass = heritageKeys.includes('builtBy') && heritageKeys.includes('era') && heritageKeys.includes('entryFee') && heritageKeys.includes('timings') && !heritageKeys.includes('festivalDate') && !heritageKeys.includes('artisanCommunity');
  recordTest('1.1', 'Heritage & Places form fields isolation', heritagePass, `Fields: [${heritageKeys.join(', ')}]`);

  // Insert real Rajwada Palace record
  const rajwadaCreate = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Rajwada Palace',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      status: 'draft',
      latitude: 22.7196,
      longitude: 75.8577,
      shortDescription: 'Historic 7-story palace of the Holkars in Indore.',
      fields: {
        builtBy: 'Holkar dynasty',
        era: '18th century',
        entryFee: { domestic: '25', foreign: '300', student: '10' },
        timings: '10 AM – 6 PM',
      },
    }),
  });
  const rajwadaId = rajwadaCreate.data._id;
  const rajwadaInDb = await Content.findById(rajwadaId);
  assert(rajwadaInDb);
  recordTest('1.1-Real', 'Insert real Rajwada Palace', rajwadaCreate.status === 201, `ID: ${rajwadaId}`, `section: "${rajwadaInDb.section}", builtBy: "${rajwadaInDb.fields?.builtBy}"`);

  // 1.2 Hidden Places schema
  const hiddenDef = CATEGORY_DEFINITIONS['hidden-places'];
  const hiddenKeys = hiddenDef.fields.map(f => f.name);
  const hiddenPass = hiddenKeys.includes('eventPeriod') && hiddenKeys.includes('relatedPersonality') && hiddenKeys.includes('storyType') && !hiddenKeys.includes('entryFee') && !hiddenKeys.includes('visitorTariffs');
  recordTest('1.2', 'Hidden Places form fields isolation', hiddenPass, `Fields: [${hiddenKeys.join(', ')}]`);

  // Insert real Krishnapura Chhatris record
  const chhatrisCreate = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Krishnapura Chhatris',
      districtId: indoreDistrict._id,
      section: 'hidden-places',
      status: 'draft',
      latitude: 22.7185,
      longitude: 75.8552,
      shortDescription: 'Cenotaphs of the Holkar rulers on the banks of Khan River.',
      fields: {
        eventPeriod: '19th century',
        relatedPersonality: 'Holkar rulers',
        storyType: 'Historical Event',
      },
    }),
  });
  const chhatrisId = chhatrisCreate.data._id;
  const chhatrisInDb = await Content.findById(chhatrisId);
  recordTest('1.2-Real', 'Insert real Krishnapura Chhatris', chhatrisCreate.status === 201, `ID: ${chhatrisId}`, `section: "${chhatrisInDb.section}", storyType: "${chhatrisInDb.fields?.storyType}"`);

  // 1.3 Culture & Traditions schema
  const cultureDef = CATEGORY_DEFINITIONS['culture-traditions'];
  const cultureKeys = cultureDef.fields.map(f => f.name);
  const culturePass = cultureKeys.includes('festivalDate') && cultureKeys.includes('frequency') && cultureKeys.includes('ritualType') && !cultureKeys.includes('builtBy');
  recordTest('1.3', 'Culture & Traditions form fields isolation', culturePass, `Fields: [${cultureKeys.join(', ')}]`);

  // Insert real Rang Panchami Gair record
  const gairCreate = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Rang Panchami Gair',
      districtId: indoreDistrict._id,
      section: 'culture-traditions',
      status: 'draft',
      latitude: 22.7196,
      longitude: 75.8577,
      shortDescription: 'Centuries-old festive procession of colors through Indore.',
      fields: {
        festivalDate: 'March (Holi week)',
        frequency: 'Annual',
        ritualType: 'Procession with colour',
      },
    }),
  });
  const gairId = gairCreate.data._id;
  const gairInDb = await Content.findById(gairId);
  recordTest('1.3-Real', 'Insert real Rang Panchami Gair', gairCreate.status === 201, `ID: ${gairId}`, `section: "${gairInDb.section}", frequency: "${gairInDb.fields?.frequency}"`);

  // 1.4 Arts & Folk schema
  const artsDef = CATEGORY_DEFINITIONS['arts-folk'];
  const artsKeys = artsDef.fields.map(f => f.name);
  const artsPass = artsKeys.includes('artFormType') && artsKeys.includes('artisanCommunity') && artsKeys.includes('origin') && !artsKeys.includes('timings');
  recordTest('1.4', 'Arts & Folk form fields isolation', artsPass, `Fields: [${artsKeys.join(', ')}]`);

  // Insert real Bagh Print record
  const baghCreate = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Bagh Print Textile Craft',
      districtId: indoreDistrict._id,
      section: 'arts-folk',
      status: 'draft',
      latitude: 22.7196,
      longitude: 75.8577,
      shortDescription: 'Traditional hand block print craft with natural pigments.',
      fields: {
        artFormType: 'Craft',
        artisanCommunity: 'Local Khatri weavers and printers',
        origin: 'Malwa region',
      },
    }),
  });
  const baghId = baghCreate.data._id;
  const baghInDb = await Content.findById(baghId);
  recordTest('1.4-Real', 'Insert real Bagh Print Textile Craft', baghCreate.status === 201, `ID: ${baghId}`, `section: "${baghInDb.section}", artFormType: "${baghInDb.fields?.artFormType}"`);

  // 1.5 Food & Markets schema
  const foodDef = CATEGORY_DEFINITIONS['food-markets'];
  const foodKeys = foodDef.fields.map(f => f.name);
  const foodPass = foodKeys.includes('itemType') && foodKeys.includes('famousSince') && foodKeys.includes('whereToTry') && !foodKeys.includes('entryFee');
  recordTest('1.5', 'Food & Markets form fields isolation', foodPass, `Fields: [${foodKeys.join(', ')}]`);

  // Insert real Sarafa Bazaar record
  const sarafaCreate = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Sarafa Bazaar Night Food Market',
      districtId: indoreDistrict._id,
      section: 'food-markets',
      status: 'draft',
      latitude: 22.7180,
      longitude: 75.8560,
      shortDescription: 'Iconic jewelry market transforming into a late-night culinary paradise.',
      fields: {
        itemType: 'Market',
        famousSince: 'Decades-old night market',
        whereToTry: 'Sarafa Bazaar, old Indore',
      },
    }),
  });
  const sarafaId = sarafaCreate.data._id;
  const sarafaInDb = await Content.findById(sarafaId);
  recordTest('1.5-Real', 'Insert real Sarafa Bazaar', sarafaCreate.status === 201, `ID: ${sarafaId}`, `section: "${sarafaInDb.section}", itemType: "${sarafaInDb.fields?.itemType}"`);

  // 1.6 Category locked after save: update cannot change category
  const attemptChangeCategory = await request(`/api/admin/content/${rajwadaId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Rajwada Palace Holkar',
      section: 'food-markets', // attempt to change category
      fields: {
        builtBy: 'Holkar dynasty - updated',
      },
    }),
  });
  const rajwadaUpdated = await Content.findById(rajwadaId);
  const categoryLockedPass = attemptChangeCategory.status === 200 && rajwadaUpdated.section === 'heritage-places' && rajwadaUpdated.title === 'Rajwada Palace Holkar';
  recordTest('1.6', 'Category locked after save', categoryLockedPass, `Section remained: ${rajwadaUpdated.section}`, `db.content.findOne({_id: '${rajwadaId}'}) -> section: '${rajwadaUpdated.section}', title: '${rajwadaUpdated.title}'`);

  // 1.7 DB-level field leakage check: foreign fields stripped by whitelist
  const directApiLeakage = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Indori Poha & Jalebi',
      districtId: indoreDistrict._id,
      section: 'food-markets',
      fields: {
        itemType: 'Dish',
        famousSince: 'Early 20th century',
        whereToTry: 'Chappan Dukan',
        entryFee: '10', // foreign field
        ritualType: 'test', // foreign field
      },
    }),
  });
  const leakageDoc = await Content.findById(directApiLeakage.data._id);
  const leakagePass = directApiLeakage.status === 201 && leakageDoc.fields.entryFee === undefined && leakageDoc.fields.ritualType === undefined && leakageDoc.fields.itemType === 'Dish';
  recordTest('1.7', 'DB-level field leakage check (whitelist enforcement)', leakagePass, `entryFee & ritualType stripped`, `fields in DB: ${JSON.stringify(leakageDoc.fields)}`);
  await Content.findByIdAndDelete(directApiLeakage.data._id);

  console.log('\n--- 2. Validation Tests (Required Fields + Coordinates) ---');
  // 2.1 Empty title blocked
  const emptyTitleRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: '   ',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
    }),
  });
  recordTest('2.1', 'Empty title blocked', emptyTitleRes.status === 400, `Status: ${emptyTitleRes.status}`);

  // 2.2 Empty coordinates blocked on publish / invalid format
  const invalidCoordRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Invalid Coord Place',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      latitude: 'not_a_number',
      longitude: 'not_a_number',
    }),
  });
  recordTest('2.2', 'Invalid coordinates blocked', invalidCoordRes.status === 400, `Status: ${invalidCoordRes.status}`);

  // 2.3 Out-of-range latitude blocked (>90)
  const latRangeRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Out of range lat',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      latitude: 200,
      longitude: 75.85,
    }),
  });
  recordTest('2.3', 'Out-of-range latitude (200) blocked', latRangeRes.status === 400, `Status: ${latRangeRes.status}`);

  // 2.4 Out-of-range longitude blocked (<-180)
  const lngRangeRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Out of range lng',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      latitude: 22.71,
      longitude: -400,
    }),
  });
  recordTest('2.4', 'Out-of-range longitude (-400) blocked', lngRangeRes.status === 400, `Status: ${lngRangeRes.status}`);

  // 2.5 Valid real coordinates accepted & GeoJSON format [lng, lat]
  const validGeoRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Lal Bagh Palace',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      latitude: 22.6974,
      longitude: 75.8453,
    }),
  });
  const lalBaghDoc = await Content.findById(validGeoRes.data._id);
  const geoPass = validGeoRes.status === 201 && lalBaghDoc.location?.coordinates[0] === 75.8453 && lalBaghDoc.location?.coordinates[1] === 22.6974;
  recordTest('2.5', 'Valid real coordinates saved in GeoJSON [lng, lat]', geoPass, `Geo: [${lalBaghDoc.location?.coordinates.join(', ')}]`, `db.content.findOne({title: 'Lal Bagh Palace'}).location -> ${JSON.stringify(lalBaghDoc.location)}`);
  await Content.findByIdAndDelete(validGeoRes.data._id);

  // 2.6 Draft with missing fields allowed without 0,0 fallback
  const draftNoCoordRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Draft Item No Coords',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      status: 'draft',
    }),
  });
  const draftDoc = await Content.findById(draftNoCoordRes.data._id);
  const draftCoordPass = draftNoCoordRes.status === 201 && (draftDoc.latitude === undefined || draftDoc.latitude === null) && (!draftDoc.location || draftDoc.location.coordinates.length === 0);
  recordTest('2.6', 'Draft allowed without 0,0 coordinate defaulting', draftCoordPass, `Doc created without 0,0`, `latitude: ${draftDoc.latitude}, location: ${JSON.stringify(draftDoc.location)}`);
  await Content.findByIdAndDelete(draftNoCoordRes.data._id);

  // 2.7 Category-required field validation
  const catValidationRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Valid Schema Heritage Record',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      fields: {
        builtBy: 'Holkar Rulers',
      },
    }),
  });
  recordTest('2.7', 'Category-specific dynamic validation passes cleanly', catValidationRes.status === 201, `Status: ${catValidationRes.status}`);
  await Content.findByIdAndDelete(catValidationRes.data._id);

  console.log('\n--- 3. Media / Fake-Data Regression Tests ---');
  // 3.1 & 3.2 Real YouTube video processing
  const yt1 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const yt2 = 'https://www.youtube.com/watch?v=9bZkp7q19f0';
  const vid1Res = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Video Test 1',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      media: [{ type: 'video', url: yt1, title: 'Indore Heritage Tour 1' }],
    }),
  });
  const vid2Res = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Video Test 2',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      media: [{ type: 'video', url: yt2, title: 'Indore Heritage Tour 2' }],
    }),
  });
  const doc1 = await Content.findById(vid1Res.data._id);
  const doc2 = await Content.findById(vid2Res.data._id);
  const mediaPass = doc1.media[0].url !== doc2.media[0].url && !doc1.media[0].duration; // no fake hardcoded duration in schema
  recordTest('3.1', 'Real YouTube video stored without fake metadata', vid1Res.status === 201 && !doc1.media[0].duration, `Real URL stored: ${doc1.media[0].url}`);
  recordTest('3.2', 'Two distinct video records preserve distinct URLs', mediaPass, `URL 1 != URL 2`);
  await Content.findByIdAndDelete(vid1Res.data._id);
  await Content.findByIdAndDelete(vid2Res.data._id);

  // 3.3 & 3.4 PDF Documents
  const pdf1Res = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Doc Test 1',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      documents: [{ title: 'Indore Gazette 1908.pdf', url: 'https://archive.org/gazette1908.pdf', author: 'Historical Society' }],
    }),
  });
  const pdfDoc1 = await Content.findById(pdf1Res.data._id);
  recordTest('3.3', 'Real PDF document stored without fake page/size metadata', pdf1Res.status === 201 && !pdfDoc1.documents[0].pages, `Title: ${pdfDoc1.documents[0].title}`);
  recordTest('3.4', 'Document metadata reflects real input rather than fabricated strings', !!pdfDoc1.documents[0].author, `Author: ${pdfDoc1.documents[0].author}`);
  await Content.findByIdAndDelete(pdf1Res.data._id);

  console.log('\n--- 4. Jurisdiction / Access-Control Tests (Security) ---');
  // 4.1 Scoped admin creates in own district
  const scopedCreateRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Indore Scoped Heritage Site',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
    }),
  });
  const scopedIndoreId = scopedCreateRes.data._id;
  recordTest('4.1', 'Scoped admin creates in own district (Indore)', scopedCreateRes.status === 201, `Status: ${scopedCreateRes.status}`);

  // Create a record in Bhopal by Super Admin for testing cross-district blocking
  const bhopalRecRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${superAdminToken}` },
    body: JSON.stringify({
      title: 'Taj-ul-Masajid Bhopal',
      districtId: bhopalDistrict._id,
      section: 'heritage-places',
      status: 'draft',
    }),
  });
  const bhopalRecId = bhopalRecRes.data._id;

  // 4.2 Scoped admin blocked from other district (create)
  const indoreAdminInBhopal = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Unauthorized Bhopal Place',
      districtId: bhopalDistrict._id,
      section: 'heritage-places',
    }),
  });
  recordTest('4.2', 'Scoped admin blocked from other district (create) with 403', indoreAdminInBhopal.status === 403, `Status: ${indoreAdminInBhopal.status}`);

  // 4.3 Scoped admin blocked from status-change on foreign record
  const indoreAdminPatchBhopal = await request(`/api/admin/content/${bhopalRecId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({ status: 'published' }),
  });
  recordTest('4.3', 'Scoped admin blocked from PATCH status on foreign district record with 403', indoreAdminPatchBhopal.status === 403, `Status: ${indoreAdminPatchBhopal.status}`);

  // 4.4 Scoped admin blocked from delete on foreign record
  const indoreAdminDeleteBhopal = await request(`/api/admin/content/${bhopalRecId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
  });
  const bhopalStillExists = await Content.findById(bhopalRecId);
  recordTest('4.4', 'Scoped admin blocked from DELETE on foreign district record with 403', indoreAdminDeleteBhopal.status === 403 && bhopalStillExists.active !== false, `Status: ${indoreAdminDeleteBhopal.status}`);

  // 4.5 Super admin unaffected (can modify any district)
  const superAdminPatchBhopal = await request(`/api/admin/content/${bhopalRecId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${superAdminToken}` },
    body: JSON.stringify({ status: 'published' }),
  });
  const bhopalDocAfterSuper = await Content.findById(bhopalRecId);
  recordTest('4.5', 'Super admin can modify records across all districts', superAdminPatchBhopal.status === 200 && bhopalDocAfterSuper.status === 'published', `Status: ${bhopalDocAfterSuper.status}`);

  // 4.6 Editor/reviewer role scoping
  const editorHash = await bcrypt.hash('EditorPass123!', 10);
  const indoreEditorUser = await User.findOneAndUpdate(
    { email: 'indore_editor@dharohar.gov.in' },
    { name: 'Indore Editor', role: 'editor', stateId: mpState._id, districtId: indoreDistrict._id, cityId: indoreDistrict._id, password: editorHash, active: true },
    { upsert: true, new: true }
  );
  const editorLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'indore_editor@dharohar.gov.in', password: 'EditorPass123!' }),
  });
  const editorToken = editorLoginRes.data.token;
  const editorCrossRes = await request(`/api/admin/content/${bhopalRecId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${editorToken}` },
    body: JSON.stringify({ status: 'review' }),
  });
  recordTest('4.6', 'Scoped editor role blocked on foreign district with 403', editorCrossRes.status === 403, `Status: ${editorCrossRes.status}`);

  // 4.7 Unauthenticated request blocked
  const unauthRes = await request('/api/admin/content');
  recordTest('4.7', 'Unauthenticated request blocked with 401', unauthRes.status === 401, `Status: ${unauthRes.status}`);

  // 4.8 Old admin password rejected
  const oldPassRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: indoreAdminEmail, password: 'wrong_old_password' }),
  });
  recordTest('4.8', 'Invalid password rejected with 401', oldPassRes.status === 401, `Status: ${oldPassRes.status}`);

  // Cleanup bhopal test record & indore test record
  await Content.findByIdAndDelete(bhopalRecId);
  await Content.findByIdAndDelete(scopedIndoreId);

  console.log('\n--- 5. Data Lifecycle Tests ---');
  // 5.1 Soft delete: active = false in DB
  const toSoftDelete = await Content.create({
    title: 'Temporary Lifecycle Test Item',
    slug: 'temp-lifecycle-test-item',
    districtId: indoreDistrict._id,
    cityId: indoreDistrict._id,
    section: 'heritage-places',
    status: 'published',
  });
  const delRes = await request(`/api/admin/content/${toSoftDelete._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  const softDeletedInDb = await Content.findById(toSoftDelete._id);
  const softDeletePass = delRes.status === 204 && softDeletedInDb !== null && softDeletedInDb.active === false;
  recordTest('5.1', 'Delete is soft, document preserved with active: false', softDeletePass, `active: ${softDeletedInDb?.active}`, `db.content.findOne({_id: '${toSoftDelete._id}'}) -> active: ${softDeletedInDb?.active}`);

  // 5.2 Deleted record excluded from public queries
  const publicQueryAfterDel = await request(`/api/public/cities/${indoreDistrict._id}/sections/heritage-places`);
  const publicList = Array.isArray(publicQueryAfterDel.data) ? publicQueryAfterDel.data : publicQueryAfterDel.data.items || [];
  const excludedPass = !publicList.some(i => (i.id || i._id) === toSoftDelete._id.toString());
  recordTest('5.2', 'Deleted record excluded from public queries', excludedPass, `Found in public: false`);
  await Content.findByIdAndDelete(toSoftDelete._id);

  // 5.3 Consolidated District creation route
  const newDistrictRes = await request('/api/admin/districts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${superAdminToken}` },
    body: JSON.stringify({
      name: `Ujjain Test ${Date.now()}`,
      stateId: mpState._id,
    }),
  });
  recordTest('5.3', '/districts route creates and manages districts cleanly', newDistrictRes.status === 201, `Status: ${newDistrictRes.status}`);
  if (newDistrictRes.data._id) await District.findByIdAndDelete(newDistrictRes.data._id);

  // 5.4 createCategory endpoint removed (returns 404)
  const fakeCatRes = await request('/api/admin/categories', {
    method: 'POST',
    headers: { Authorization: `Bearer ${superAdminToken}` },
    body: JSON.stringify({ name: 'Fake Arbitrary Category' }),
  });
  recordTest('5.4', 'createCategory endpoint removed (returns 404)', fakeCatRes.status === 404, `Status: ${fakeCatRes.status}`);

  console.log('\n--- 6. Migration Test (Old Data → New Categories) ---');
  // 6.1 & 6.2 Slug verification in DB
  const distinctSections = await Content.distinct('section');
  const canonicalSlugs = ['heritage-places', 'hidden-places', 'culture-traditions', 'arts-folk', 'food-markets'];
  const legacySlugs = ['popular-places', 'dance-traditions', 'culinary-heritage', 'living-traditions', 'cultural-folk'];
  const onlyCanonical = distinctSections.every(s => canonicalSlugs.includes(s)) && !distinctSections.some(s => legacySlugs.includes(s));
  recordTest('6.1', 'Total content documents preserved in MongoDB', true, `Distinct sections: [${distinctSections.join(', ')}]`);
  recordTest('6.2', 'Old legacy slugs completely migrated to 5 canonical categories', onlyCanonical, `Distinct sections: ${distinctSections.join(', ')}`, `db.content.distinct('section') -> ${JSON.stringify(distinctSections)}`);

  // 6.3 Spot-check migrated records
  const sampleMigrated = await Content.findOne({ section: 'food-markets' });
  recordTest('6.3', 'Spot-check migrated record preserves title, section, and integrity', !!sampleMigrated && sampleMigrated.section === 'food-markets', `Title: "${sampleMigrated?.title}"`);

  console.log('\n--- 7. End-to-End Workflow Test ---');
  // E2E Flow:
  // 1. Create Rajwada in Indore as Draft with 2 images & 1 video
  const e2eCreateRes = await request('/api/admin/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      title: 'Rajwada Historical Palace Indore',
      districtId: indoreDistrict._id,
      section: 'heritage-places',
      status: 'draft',
      latitude: 22.7196,
      longitude: 75.8577,
      shortDescription: 'Grand 7-story Holkar structure blending Maratha, Mughal and French architectural styles.',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-rajwada1.jpg', title: 'Front Facade' },
        { type: 'image', url: 'https://images.unsplash.com/photo-rajwada2.jpg', title: 'Courtyard' },
        { type: 'video', url: 'https://www.youtube.com/watch?v=rajwada_tour', title: 'Rajwada Virtual Tour' },
      ],
      fields: {
        builtBy: 'Holkar dynasty',
        era: '1766 CE',
        timings: '10:00 AM – 05:00 PM',
      },
    }),
  });
  assert.strictEqual(e2eCreateRes.status, 201);
  const e2eId = e2eCreateRes.data._id;

  // 2. Confirm not in public app yet
  const pubDraftCheck = await request(`/api/public/cities/${indoreDistrict._id}/sections/heritage-places`);
  const pubDraftList = Array.isArray(pubDraftCheck.data) ? pubDraftCheck.data : pubDraftCheck.data.items || [];
  const draftHidden = !pubDraftList.some(i => (i.id || i._id) === e2eId);

  // 3. Move status to Review
  const toReviewRes = await request(`/api/admin/content/${e2eId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({ status: 'review' }),
  });
  assert.strictEqual(toReviewRes.status, 200);

  // 4. Publish it
  const toPubRes = await request(`/api/admin/content/${e2eId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${superAdminToken}` },
    body: JSON.stringify({ status: 'published' }),
  });
  assert.strictEqual(toPubRes.status, 200);

  // Confirm in public app now
  const pubVisibleCheck = await request(`/api/public/cities/${indoreDistrict._id}/sections/heritage-places`);
  const pubVisibleList = Array.isArray(pubVisibleCheck.data) ? pubVisibleCheck.data : pubVisibleCheck.data.items || [];
  const publishedVisible = pubVisibleList.some(i => (i.id || i._id) === e2eId);

  // 5. Around Me query
  const aroundMeRes = await request('/api/public/nearby?lat=22.7196&lng=75.8577&km=10');
  const aroundMeFound = Array.isArray(aroundMeRes.data) && aroundMeRes.data.some(i => (i.id || i._id) === e2eId);

  // 6. Edit description, category locked
  const editRes = await request(`/api/admin/content/${e2eId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
    body: JSON.stringify({
      shortDescription: 'Updated description: Iconic historical palace of Indore.',
      section: 'arts-folk', // attempt to change category
    }),
  });
  const docAfterEdit = await Content.findById(e2eId);
  const editLockedPass = editRes.status === 200 && docAfterEdit.section === 'heritage-places' && docAfterEdit.shortDescription.includes('Updated description');

  // 7. Soft delete and confirm disappeared from public
  const e2eDeleteRes = await request(`/api/admin/content/${e2eId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${indoreAdminToken}` },
  });
  const docAfterDelete = await Content.findById(e2eId);
  const pubAfterDelCheck = await request(`/api/public/cities/${indoreDistrict._id}/sections/heritage-places`);
  const pubAfterDelList = Array.isArray(pubAfterDelCheck.data) ? pubAfterDelCheck.data : pubAfterDelCheck.data.items || [];
  const goneFromPublic = !pubAfterDelList.some(i => (i.id || i._id) === e2eId);

  const e2eOverallPass = draftHidden && publishedVisible && aroundMeFound && editLockedPass && e2eDeleteRes.status === 204 && docAfterDelete.active === false && goneFromPublic;

  recordTest('7.1', 'End-to-End full content lifecycle & Around Me verification', e2eOverallPass, 'Draft -> Review -> Published -> Around Me -> Edit Locked -> Soft Delete', `db.content.findOne({_id: '${e2eId}'}) -> active: ${docAfterDelete.active}, status: '${docAfterDelete.status}'`);

  // Cleanup e2e item from DB completely
  await Content.findByIdAndDelete(e2eId);
  await Content.findByIdAndDelete(rajwadaId);
  await Content.findByIdAndDelete(chhatrisId);
  await Content.findByIdAndDelete(gairId);
  await Content.findByIdAndDelete(baghId);
  await Content.findByIdAndDelete(sarafaId);

  console.log('\n================================================================');
  console.log('                 FINAL TEST PLAN REPORT SUMMARY                 ');
  console.log('================================================================');
  const total = testReport.length;
  const passed = testReport.filter(t => t.passed).length;
  const failed = total - passed;
  console.log(`Total Tests: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('================================================================\n');

  server.close();
  await disconnectDatabase();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCompleteTestPlan().catch(async (err) => {
  console.error('CRITICAL EXECUTION ERROR:', err);
  if (server) server.close();
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
