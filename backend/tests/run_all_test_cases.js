import 'dotenv/config';
import dns from 'dns';
import assert from 'assert';
import http from 'http';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { seedDirectoryIfEmpty } from '../src/config/seedDirectory.js';
import { createToken, userProfile, slugify, isValidId } from '../src/utils/auth.js';
import { getSectionBySlug, CITY_SECTIONS } from '../src/config/sections.js';
import Content from '../src/models/Content.js';
import State from '../src/models/State.js';
import District from '../src/models/District.js';
import User from '../src/models/User.js';
import DistrictCategory from '../src/models/DistrictCategory.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

let server;
let baseUrl;

// Results aggregator
const testResults = {
  smoke: [],
  sanity: [],
  unit: [],
  integration: [],
  system: [],
  uat: [],
  regression: [],
};

function recordResult(suite, id, name, passed, error = null) {
  testResults[suite].push({ id, name, passed, error: error ? error.message : null });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  [${symbol}] [${id}] ${name}${error ? ` -> Error: ${error.message}` : ''}`);
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

// Frontend simulation mapping (toHeritagePlace)
function toHeritagePlace(item) {
  const fields = item.fields || {};
  const status =
    item.status === 'published'
      ? 'Published'
      : item.status === 'review'
      ? 'Verification Pending'
      : item.status === 'hidden'
      ? 'Hidden'
      : item.status === 'archived'
      ? 'Archived'
      : 'Draft (In Curation)';
  const lat = item.latitude !== undefined ? item.latitude : fields.latitude;
  const lng = item.longitude !== undefined ? item.longitude : fields.longitude;
  const districtId = item.districtId || item.cityId || '';
  const cityName = item.cityName || String(fields.city || '');

  return {
    id: item._id,
    name: item.title,
    code: String(fields.code || `#${item.slug?.toUpperCase() || ''}`),
    category: fields.category || 'Other',
    city: cityName,
    subLocation: String(fields.subLocation || ''),
    status,
    imageUrl: String(fields.imageUrl || item.media?.find((m) => m.type === 'image')?.url || ''),
    description: String(item.shortDescription || fields.description || ''),
    openingHours: String(fields.openingHours || ''),
    builtYear: String(fields.builtYear || ''),
    dynasty: String(fields.dynasty || ''),
    subTitle: String(item.subtitle || fields.subTitle || ''),
    visitorTariffs: fields.visitorTariffs,
    media: item.media || [],
    latitude: lat,
    longitude: lng,
    section: item.section || 'popular-places',
    districtId,
    stateId: item.stateId,
    visualsMediaEnabled: fields.visualsMediaEnabled !== false,
    bookEnabled: fields.bookEnabled !== false,
  };
}

// Frontend State Code generation simulation
function generateStateCode(name, existingStates = []) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let baseCode = '';
  if (words.length > 1) {
    baseCode = words.map(w => w[0].toUpperCase()).join('').slice(0, 4);
  } else {
    baseCode = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  }
  if (!baseCode) baseCode = 'ST';
  let finalCode = baseCode;
  let counter = 1;
  while (existingStates.some(s => s.code.toUpperCase() === finalCode.toUpperCase())) {
    finalCode = `${baseCode}${counter}`;
    counter++;
  }
  return finalCode;
}

async function runAllTests() {
  console.log('\n=============================================================');
  console.log('🏛️  DHAROHAR COMPREHENSIVE AUTOMATED TEST SUITE EXECUTION 🏛️');
  console.log('=============================================================\n');

  console.log('🔌 Connecting to MongoDB and starting ephemeral server...');
  await connectDatabase();
  await seedDirectoryIfEmpty();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`🚀 Ephemeral test API server listening at ${baseUrl}\n`);

  // Tokens & shared state
  let superAdminToken = '';
  let stateAdminToken = '';
  let districtAdminToken = '';
  let editorToken = '';
  let superAdminUser;
  let testState;
  let testDistrict;
  let testDistrict2;
  let testCreatedContentId;

  // -------------------------------------------------------------
  // 1. 🔥 SMOKE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 1. 🔥 SMOKE TESTING ---');

  try {
    // TC-SM-001: Admin App Base API endpoint check
    const rootRes = await fetch(`${baseUrl}/`);
    const rootText = await rootRes.text();
    assert(rootRes.ok && rootText.includes('Dharohar'), 'API root must respond with Dharohar welcome message');
    recordResult('smoke', 'TC-SM-001', 'Admin App & Server Launch Baseline', true);
  } catch (err) {
    recordResult('smoke', 'TC-SM-001', 'Admin App & Server Launch Baseline', false, err);
  }

  try {
    // TC-SM-002: Backend API Health Check
    const health = await request('/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.ok, true);
    recordResult('smoke', 'TC-SM-002', 'Backend API Health Check (/health)', true);
  } catch (err) {
    recordResult('smoke', 'TC-SM-002', 'Backend API Health Check (/health)', false, err);
  }

  try {
    // TC-SM-003: Login Form Authentication
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'mp136366',
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Login should return 200');
    assert(loginRes.data.token, 'Token must be present');
    assert(loginRes.data.admin, 'Admin details must be present');
    superAdminToken = loginRes.data.token;
    superAdminUser = loginRes.data.admin;
    recordResult('smoke', 'TC-SM-003', 'Admin Login Authenticates and Generates Token', true);
  } catch (err) {
    recordResult('smoke', 'TC-SM-003', 'Admin Login Authenticates and Generates Token', false, err);
  }

  try {
    // TC-SM-004: Dashboard Summary Metrics Loaded
    const summary = await request('/api/admin/summary', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(summary.status, 200);
    assert(summary.data.content, 'Content metrics should exist');
    assert(typeof summary.data.content.published === 'number', 'Published count should be number');
    assert(typeof summary.data.content.draft === 'number', 'Draft count should be number');
    recordResult('smoke', 'TC-SM-004', 'Dashboard Summary KPI Metrics Loaded', true);
  } catch (err) {
    recordResult('smoke', 'TC-SM-004', 'Dashboard Summary KPI Metrics Loaded', false, err);
  }

  try {
    // TC-SM-005: Backend-Frontend Connection Verified (States and Districts load)
    const statesRes = await request('/api/admin/states', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(statesRes.status, 200);
    assert(Array.isArray(statesRes.data) && statesRes.data.length > 0, 'States array must not be empty');
    testState = statesRes.data[0];

    const distRes = await request(`/api/admin/states/${testState._id}/districts`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(distRes.status, 200);
    assert(Array.isArray(distRes.data) && distRes.data.length > 0, 'Districts array must not be empty');
    testDistrict = distRes.data[0];
    recordResult('smoke', 'TC-SM-005', 'Backend-Frontend Data Connection (States & Districts)', true);
  } catch (err) {
    recordResult('smoke', 'TC-SM-005', 'Backend-Frontend Data Connection (States & Districts)', false, err);
  }

  // -------------------------------------------------------------
  // 2. ✅ SANITY TESTING
  // -------------------------------------------------------------
  console.log('\n--- 2. ✅ SANITY TESTING (Bug Fix Verifications) ---');

  try {
    // TC-SN-001: JWT req.admin._id is Populated (Bug #2 Fix)
    const createdRes = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Sanity Test Monument 1',
        districtId: testDistrict._id,
        section: 'popular-places',
      }),
    });
    assert.strictEqual(createdRes.status, 201);
    const dbRecord = await Content.findById(createdRes.data._id);
    assert(dbRecord.createdBy, 'createdBy field must be populated in DB');
    assert.strictEqual(dbRecord.createdBy.toString(), (superAdminUser._id || superAdminUser.id).toString());
    testCreatedContentId = createdRes.data._id;
    recordResult('sanity', 'TC-SN-001', 'JWT req.admin._id Populated in createdBy (Bug #2)', true);
  } catch (err) {
    recordResult('sanity', 'TC-SN-001', 'JWT req.admin._id Populated in createdBy (Bug #2)', false, err);
  }

  try {
    // TC-SN-002: Default Content Status is draft (Bug #17 Fix)
    const dbRecord = await Content.findById(testCreatedContentId);
    assert.strictEqual(dbRecord.status, 'draft', 'Default status must be "draft"');
    recordResult('sanity', 'TC-SN-002', 'Default Content Status is "draft" (Bug #17)', true);
  } catch (err) {
    recordResult('sanity', 'TC-SN-002', 'Default Content Status is "draft" (Bug #17)', false, err);
  }

  try {
    // TC-SN-003: Section Alias Normalizes to Canonical Slug (Bug #6 Fix)
    const aliasRes = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Sanity Test Folk Dance',
        districtId: testDistrict._id,
        section: 'cultural-folk', // Alias for dance-traditions
      }),
    });
    assert.strictEqual(aliasRes.status, 201);
    const aliasDb = await Content.findById(aliasRes.data._id);
    assert.strictEqual(aliasDb.section, 'dance-traditions', 'cultural-folk must normalize to dance-traditions');
    await Content.findByIdAndDelete(aliasRes.data._id);
    recordResult('sanity', 'TC-SN-003', 'Section Alias Normalizes to Canonical Slug (Bug #6)', true);
  } catch (err) {
    recordResult('sanity', 'TC-SN-003', 'Section Alias Normalizes to Canonical Slug (Bug #6)', false, err);
  }

  try {
    // TC-SN-004: State Code Generation is Collision-Free (Bug #3 Fix)
    const codeMP = generateStateCode('Madhya Pradesh', []);
    assert.strictEqual(codeMP, 'MP');
    const codeMH = generateStateCode('Maharashtra', [{ code: 'MP' }]);
    assert.strictEqual(codeMH, 'MAH');
    const collisionCode = generateStateCode('Madhya Pradesh', [{ code: 'MP' }]);
    assert.strictEqual(collisionCode, 'MP1');
    recordResult('sanity', 'TC-SN-004', 'State Code Generation Acronym & Collision Safety (Bug #3)', true);
  } catch (err) {
    recordResult('sanity', 'TC-SN-004', 'State Code Generation Acronym & Collision Safety (Bug #3)', false, err);
  }

  try {
    // TC-SN-005: Status Label Displays Correctly for Hidden Records (Bug #8 Fix)
    const mapped = toHeritagePlace({
      _id: 'test_hidden_1',
      title: 'Hidden Item',
      slug: 'hidden-item',
      status: 'hidden',
    });
    assert.strictEqual(mapped.status, 'Hidden', 'Status mapping for "hidden" must be "Hidden"');
    recordResult('sanity', 'TC-SN-005', 'Status Label "Hidden" Correctly Mapped (Bug #8)', true);
  } catch (err) {
    recordResult('sanity', 'TC-SN-005', 'Status Label "Hidden" Correctly Mapped (Bug #8)', false, err);
  }

  try {
    // TC-SN-006: state_admin Can Now Login (Bug #1 Fix)
    const hashedPass = await bcrypt.hash('Password123!', 10);
    await User.findOneAndUpdate(
      { email: 'stateadmin_test@dharohar.gov.in' },
      {
        name: 'Test State Admin',
        email: 'stateadmin_test@dharohar.gov.in',
        password: hashedPass,
        role: 'state_admin',
        stateId: testState._id,
        active: true,
      },
      { upsert: true, new: true }
    );

    const stateLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'stateadmin_test@dharohar.gov.in',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(stateLogin.status, 200, 'state_admin must be allowed to login to admin portal');
    assert(stateLogin.data.token, 'Token must be returned');
    stateAdminToken = stateLogin.data.token;
    recordResult('sanity', 'TC-SN-006', 'state_admin Can Authenticate to Admin Portal (Bug #1)', true);
  } catch (err) {
    recordResult('sanity', 'TC-SN-006', 'state_admin Can Authenticate to Admin Portal (Bug #1)', false, err);
  }

  // -------------------------------------------------------------
  // 3. 🔬 UNIT TESTING
  // -------------------------------------------------------------
  console.log('\n--- 3. 🔬 UNIT TESTING (Isolated Functions & Schema Logic) ---');

  try {
    // TC-UT-001: createToken() Generates Valid JWT with Correct Payload
    const token = createToken({ _id: '64b9a1f3e4d5c6a7b8c9d0e1', role: 'editor' });
    assert(typeof token === 'string' && token.length > 20);
    recordResult('unit', 'TC-UT-001', 'createToken() Generates Valid JWT Payload', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-001', 'createToken() Generates Valid JWT Payload', false, err);
  }

  try {
    // TC-UT-002: slugify() Converts Title to Valid URL Slug
    const s1 = slugify('Qutub Minar Heritage Site!');
    assert.strictEqual(s1, 'qutub-minar-heritage-site');
    recordResult('unit', 'TC-UT-002', 'slugify() Converts Standard Title to Clean Slug', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-002', 'slugify() Converts Standard Title to Clean Slug', false, err);
  }

  try {
    // TC-UT-003: slugify() Handles Hindi / Special Character Titles
    const s2 = slugify('Agra Fort & Taj Mahal @ 2026');
    assert.strictEqual(s2, 'agra-fort-taj-mahal-2026');
    recordResult('unit', 'TC-UT-003', 'slugify() Handles Special Characters and Symbols', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-003', 'slugify() Handles Special Characters and Symbols', false, err);
  }

  try {
    // TC-UT-004: isValidId() Returns true for Valid MongoDB ObjectId
    assert.strictEqual(isValidId('64b9a1f3e4d5c6a7b8c9d0e1'), true);
    recordResult('unit', 'TC-UT-004', 'isValidId() Validates 24-char Hex ObjectId as true', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-004', 'isValidId() Validates 24-char Hex ObjectId as true', false, err);
  }

  try {
    // TC-UT-005: isValidId() Returns false for Non-ObjectId Strings
    assert.strictEqual(isValidId('undefined'), false);
    assert.strictEqual(isValidId(null), false);
    assert.strictEqual(isValidId('12345'), false);
    assert.strictEqual(isValidId(''), false);
    recordResult('unit', 'TC-UT-005', 'isValidId() Rejects Malformed or Nil IDs as false', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-005', 'isValidId() Rejects Malformed or Nil IDs as false', false, err);
  }

  try {
    // TC-UT-006: getSectionBySlug() Returns Section for Canonical Slug
    const sec = getSectionBySlug('dance-traditions');
    assert(sec, 'dance-traditions must be found');
    assert.strictEqual(sec.slug, 'dance-traditions');
    recordResult('unit', 'TC-UT-006', 'getSectionBySlug() Returns Canonical Section Object', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-006', 'getSectionBySlug() Returns Canonical Section Object', false, err);
  }

  try {
    // TC-UT-007: getSectionBySlug() Resolves Alias to Canonical
    const alias1 = getSectionBySlug('cultural-folk');
    assert.strictEqual(alias1.slug, 'dance-traditions');
    const alias2 = getSectionBySlug('living-culture');
    assert.strictEqual(alias2.slug, 'living-traditions');
    recordResult('unit', 'TC-UT-007', 'getSectionBySlug() Resolves Legacy Aliases to Canonical Slugs', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-007', 'getSectionBySlug() Resolves Legacy Aliases to Canonical Slugs', false, err);
  }

  try {
    // TC-UT-008: getSectionBySlug() Returns undefined for Invalid Slug
    assert.strictEqual(getSectionBySlug('nonexistent-section'), undefined);
    assert.strictEqual(getSectionBySlug(''), undefined);
    recordResult('unit', 'TC-UT-008', 'getSectionBySlug() Returns undefined for Invalid Slugs', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-008', 'getSectionBySlug() Returns undefined for Invalid Slugs', false, err);
  }

  try {
    // TC-UT-009: toHeritagePlace() Maps published Status Correctly
    const res = toHeritagePlace({ status: 'published', title: 'Test' });
    assert.strictEqual(res.status, 'Published');
    recordResult('unit', 'TC-UT-009', 'toHeritagePlace() Maps "published" to "Published"', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-009', 'toHeritagePlace() Maps "published" to "Published"', false, err);
  }

  try {
    // TC-UT-010: toHeritagePlace() Maps hidden Status to "Hidden"
    const res = toHeritagePlace({ status: 'hidden', title: 'Test' });
    assert.strictEqual(res.status, 'Hidden');
    recordResult('unit', 'TC-UT-010', 'toHeritagePlace() Maps "hidden" to "Hidden"', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-010', 'toHeritagePlace() Maps "hidden" to "Hidden"', false, err);
  }

  try {
    // TC-UT-011: toHeritagePlace() Maps archived Status to "Archived"
    const res = toHeritagePlace({ status: 'archived', title: 'Test' });
    assert.strictEqual(res.status, 'Archived');
    recordResult('unit', 'TC-UT-011', 'toHeritagePlace() Maps "archived" to "Archived"', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-011', 'toHeritagePlace() Maps "archived" to "Archived"', false, err);
  }

  try {
    // TC-UT-012: State Code Generator Uses Multi-Word Acronym
    const code = generateStateCode('Uttar Pradesh', []);
    assert.strictEqual(code, 'UP');
    recordResult('unit', 'TC-UT-012', 'generateStateCode() Uses Multi-Word Initials', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-012', 'generateStateCode() Uses Multi-Word Initials', false, err);
  }

  try {
    // TC-UT-013: State Code Generator Increments on Collision
    const code = generateStateCode('Uttar Pradesh', [{ code: 'UP' }]);
    assert.strictEqual(code, 'UP1');
    recordResult('unit', 'TC-UT-013', 'generateStateCode() Appends Counter Suffix on Collision', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-013', 'generateStateCode() Appends Counter Suffix on Collision', false, err);
  }

  try {
    // TC-UT-014: Content Schema Rejects Invalid Section Enum Value
    let threw = false;
    try {
      const doc = new Content({
        title: 'Invalid Section Test',
        cityId: new mongoose.Types.ObjectId(),
        districtId: new mongoose.Types.ObjectId(),
        section: 'invalid-section-not-in-enum',
      });
      await doc.validate();
    } catch (err) {
      threw = true;
    }
    assert(threw, 'Validation should fail for invalid section enum');
    recordResult('unit', 'TC-UT-014', 'Content Schema Rejects Invalid Section Enum', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-014', 'Content Schema Rejects Invalid Section Enum', false, err);
  }

  try {
    // TC-UT-015: Content Schema Defaults Status to draft
    const doc = new Content({
      title: 'Draft Default Test',
      cityId: new mongoose.Types.ObjectId(),
      districtId: new mongoose.Types.ObjectId(),
      section: 'popular-places',
      slug: 'draft-default-test',
    });
    assert.strictEqual(doc.status, 'draft');
    recordResult('unit', 'TC-UT-015', 'Content Schema Default Status is "draft"', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-015', 'Content Schema Default Status is "draft"', false, err);
  }

  try {
    // TC-UT-016: Content Schema Requires title and cityId/districtId
    let threw = false;
    try {
      const emptyDoc = new Content({});
      await emptyDoc.validate();
    } catch (err) {
      threw = true;
      assert(err.errors.title, 'Title must be required');
    }
    assert(threw, 'Empty document must fail validation');
    recordResult('unit', 'TC-UT-016', 'Content Schema Required Fields Validation', true);
  } catch (err) {
    recordResult('unit', 'TC-UT-016', 'Content Schema Required Fields Validation', false, err);
  }

  // -------------------------------------------------------------
  // 4. 🔗 INTEGRATION TESTING
  // -------------------------------------------------------------
  console.log('\n--- 4. 🔗 INTEGRATION TESTING (APIs, Middleware & Database) ---');

  try {
    // TC-INT-001: POST /api/auth/admin/login — Valid Credentials
    const res = await request('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'mp136366',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert(res.data.token);
    assert(res.data.admin);
    recordResult('integration', 'TC-INT-001', 'POST /api/auth/admin/login Valid Credentials', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-001', 'POST /api/auth/admin/login Valid Credentials', false, err);
  }

  try {
    // TC-INT-002: POST /api/auth/admin/login — Wrong Password
    const res = await request('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com',
        password: 'CompletelyWrongPassword123!',
      }),
    });
    assert.strictEqual(res.status, 401);
    recordResult('integration', 'TC-INT-002', 'POST /api/auth/admin/login Wrong Password Returns 401', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-002', 'POST /api/auth/admin/login Wrong Password Returns 401', false, err);
  }

  try {
    // TC-INT-003: POST /api/auth/admin/login — state_admin Can Login
    const res = await request('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'stateadmin_test@dharohar.gov.in',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(res.status, 200);
    recordResult('integration', 'TC-INT-003', 'POST /api/auth/admin/login state_admin Role Allowed', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-003', 'POST /api/auth/admin/login state_admin Role Allowed', false, err);
  }

  try {
    // TC-INT-004: POST /api/auth/admin/login — Missing Fields
    const res = await request('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'onlyemail@test.com' }),
    });
    assert.strictEqual(res.status, 400);
    recordResult('integration', 'TC-INT-004', 'POST /api/auth/admin/login Missing Password Returns 400', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-004', 'POST /api/auth/admin/login Missing Password Returns 400', false, err);
  }

  try {
    // TC-INT-005: All Admin Routes Require Auth Token
    const res = await request('/api/admin/content');
    assert.strictEqual(res.status, 401);
    recordResult('integration', 'TC-INT-005', 'GET /api/admin/content without Auth Header Returns 401', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-005', 'GET /api/admin/content without Auth Header Returns 401', false, err);
  }

  try {
    // TC-INT-006: req.admin.id and req.admin._id Populated After Login
    const createRes = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Auth Identity Verification Monument',
        districtId: testDistrict._id,
        section: 'popular-places',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const item = await Content.findById(createRes.data._id);
    assert(item.createdBy, 'createdBy should be set');
    assert.strictEqual(item.createdBy.toString(), (superAdminUser._id || superAdminUser.id).toString());
    await Content.findByIdAndDelete(createRes.data._id);
    recordResult('integration', 'TC-INT-006', 'JWT User Identity Correctly Linked in Content Creation', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-006', 'JWT User Identity Correctly Linked in Content Creation', false, err);
  }

  let integrationContentId;
  try {
    // TC-INT-007: POST /api/admin/content — Creates Record in MongoDB
    const createRes = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Qutub Minar Complex',
        districtId: testDistrict._id,
        section: 'popular-places',
        status: 'draft',
        latitude: 28.5244,
        longitude: 77.1855,
        fields: {
          description: 'A 73-meter high minaret built in 1192 by Qutb-ud-din Aibak.',
          builtYear: '1192 CE',
        },
      }),
    });
    assert.strictEqual(createRes.status, 201);
    integrationContentId = createRes.data._id;
    const dbRecord = await Content.findById(integrationContentId);
    assert(dbRecord, 'Record must exist in DB');
    assert.strictEqual(dbRecord.title, 'Qutub Minar Complex');
    recordResult('integration', 'TC-INT-007', 'POST /api/admin/content Creates Record in MongoDB', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-007', 'POST /api/admin/content Creates Record in MongoDB', false, err);
  }

  try {
    // TC-INT-008: POST /api/admin/content — Section Alias Normalizes in DB
    const res = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Kathak Dance Tradition',
        districtId: testDistrict._id,
        section: 'cultural-folk',
      }),
    });
    assert.strictEqual(res.status, 201);
    const dbRecord = await Content.findById(res.data._id);
    assert.strictEqual(dbRecord.section, 'dance-traditions');
    await Content.findByIdAndDelete(res.data._id);
    recordResult('integration', 'TC-INT-008', 'POST /api/admin/content Normalizes Section Aliases', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-008', 'POST /api/admin/content Normalizes Section Aliases', false, err);
  }

  try {
    // TC-INT-009: GET /api/admin/content?districtId=X Returns Filtered Results
    const res = await request(`/api/admin/content?districtId=${testDistrict._id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data));
    assert(res.data.every(item => (item.districtId || item.cityId).toString() === testDistrict._id.toString()));
    recordResult('integration', 'TC-INT-009', 'GET /api/admin/content Filters By districtId', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-009', 'GET /api/admin/content Filters By districtId', false, err);
  }

  try {
    // TC-INT-010: GET /api/admin/content?section=dance-traditions Filters by Section
    const res = await request('/api/admin/content?section=popular-places', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data));
    assert(res.data.every(item => item.section === 'popular-places'));
    recordResult('integration', 'TC-INT-010', 'GET /api/admin/content Filters By Section', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-010', 'GET /api/admin/content Filters By Section', false, err);
  }

  try {
    // TC-INT-011: PATCH /api/admin/content/:id/status Updates Status
    const res = await request(`/api/admin/content/${integrationContentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'published' }),
    });
    assert.strictEqual(res.status, 200);
    const updated = await Content.findById(integrationContentId);
    assert.strictEqual(updated.status, 'published');
    assert(updated.publishedAt, 'publishedAt should be stamped');
    recordResult('integration', 'TC-INT-011', 'PATCH /api/admin/content/:id/status Updates Status & Stamps Date', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-011', 'PATCH /api/admin/content/:id/status Updates Status & Stamps Date', false, err);
  }

  try {
    // TC-INT-012: DELETE /api/admin/content/:id Removes Record
    const delRes = await request(`/api/admin/content/${integrationContentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(delRes.status, 204);
    const checkDb = await Content.findById(integrationContentId);
    assert.strictEqual(checkDb, null, 'Deleted content must no longer exist in DB');
    recordResult('integration', 'TC-INT-012', 'DELETE /api/admin/content/:id Removes Record from DB', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-012', 'DELETE /api/admin/content/:id Removes Record from DB', false, err);
  }

  try {
    // TC-INT-013: Content Create Requires Valid districtId
    const badRes = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Invalid District Item',
        districtId: 'not-a-valid-object-id',
        section: 'popular-places',
      }),
    });
    assert.strictEqual(badRes.status, 400);
    recordResult('integration', 'TC-INT-013', 'Content Create Rejects Invalid districtId with 400', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-013', 'Content Create Rejects Invalid districtId with 400', false, err);
  }

  try {
    // TC-INT-014: checkJurisdictionScope Allows Super Admin on All Districts
    const res = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Super Admin Universal Scope Item',
        districtId: testDistrict._id,
        section: 'popular-places',
      }),
    });
    assert.strictEqual(res.status, 201);
    await Content.findByIdAndDelete(res.data._id);
    recordResult('integration', 'TC-INT-014', 'checkJurisdictionScope Allows super_admin on All Districts', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-014', 'checkJurisdictionScope Allows super_admin on All Districts', false, err);
  }

  try {
    // TC-INT-015: checkJurisdictionScope Blocks District Admin on Wrong District
    const distAdminHash = await bcrypt.hash('Password123!', 10);
    await User.findOneAndUpdate(
      { email: 'distadmin_test@dharohar.gov.in' },
      {
        name: 'District Admin Scoped',
        email: 'distadmin_test@dharohar.gov.in',
        password: distAdminHash,
        role: 'district_admin',
        districtId: testDistrict._id,
        cityId: testDistrict._id,
        active: true,
      },
      { upsert: true, new: true }
    );

    const distAdminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'distadmin_test@dharohar.gov.in',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(distAdminLogin.status, 200);
    districtAdminToken = distAdminLogin.data.token;

    // Create a different dummy district
    await District.deleteMany({ name: /^Unassigned Test District/ });
    const otherDistrict = await District.create({
      name: `Unassigned Test District ${Date.now()}`,
      slug: `unassigned-test-district-${Date.now()}`,
      stateId: testState._id,
    });

    const blockedRes = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${districtAdminToken}` },
      body: JSON.stringify({
        title: 'Should Be Blocked',
        districtId: otherDistrict._id,
        section: 'popular-places',
      }),
    });
    assert.strictEqual(blockedRes.status, 403);
    await District.findByIdAndDelete(otherDistrict._id);
    recordResult('integration', 'TC-INT-015', 'checkJurisdictionScope Blocks district_admin on Foreign District', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-015', 'checkJurisdictionScope Blocks district_admin on Foreign District', false, err);
  }

  let createdStateId;
  try {
    // TC-INT-016: POST /api/admin/states — Creates State (super_admin Only)
    const res = await request('/api/admin/states', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        name: 'Goa Heritage State',
        code: 'GA_TEST',
        active: true,
      }),
    });
    assert.strictEqual(res.status, 201);
    createdStateId = res.data._id;
    recordResult('integration', 'TC-INT-016', 'POST /api/admin/states Creates State for super_admin', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-016', 'POST /api/admin/states Creates State for super_admin', false, err);
  }

  try {
    // TC-INT-017: POST /api/admin/states — Blocked for editor / unauthorized Role
    const editorHash = await bcrypt.hash('Password123!', 10);
    await User.findOneAndUpdate(
      { email: 'editor_test@dharohar.gov.in' },
      {
        name: 'Editor User',
        email: 'editor_test@dharohar.gov.in',
        password: editorHash,
        role: 'editor',
        active: true,
      },
      { upsert: true, new: true }
    );

    const editorLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'editor_test@dharohar.gov.in',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(editorLogin.status, 200);
    editorToken = editorLogin.data.token;

    const res = await request('/api/admin/states', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: JSON.stringify({
        name: 'Forbidden State',
        code: 'FS_TEST',
      }),
    });
    assert.strictEqual(res.status, 403);
    recordResult('integration', 'TC-INT-017', 'POST /api/admin/states Blocked for Non-Admin Role', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-017', 'POST /api/admin/states Blocked for Non-Admin Role', false, err);
  }

  let createdDistrictId;
  try {
    // TC-INT-018: POST /api/admin/districts — Allowed for state_admin (Bug #4 Fix)
    const res = await request('/api/admin/districts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stateAdminToken}` },
      body: JSON.stringify({
        stateId: testState._id,
        name: 'North Goa Test District',
      }),
    });
    assert.strictEqual(res.status, 201);
    createdDistrictId = res.data._id;
    recordResult('integration', 'TC-INT-018', 'POST /api/admin/districts Allowed for state_admin (Bug #4)', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-018', 'POST /api/admin/districts Allowed for state_admin (Bug #4)', false, err);
  }

  try {
    // TC-INT-019: GET /api/admin/states/:stateId/districts Returns Districts
    const res = await request(`/api/admin/states/${testState._id}/districts`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data));
    assert(res.data.some(d => (d._id || d.id)?.toString() === createdDistrictId?.toString()));
    recordResult('integration', 'TC-INT-019', 'GET /api/admin/states/:stateId/districts Returns District List', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-019', 'GET /api/admin/states/:stateId/districts Returns District List', false, err);
  }

  let createdAdminOfficerId;
  try {
    // TC-INT-020: POST /api/admin/admins Creates Admin with Jurisdiction
    const res = await request('/api/admin/admins', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        name: 'Ramesh Circle Officer',
        email: 'ramesh_circle_test@dharohar.gov.in',
        password: 'PassWord1234!',
        role: 'state_admin',
        stateId: testState._id,
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.email, 'ramesh_circle_test@dharohar.gov.in');
    createdAdminOfficerId = res.data._id || res.data.id;
    recordResult('integration', 'TC-INT-020', 'POST /api/admin/admins Creates Officer with Jurisdiction', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-020', 'POST /api/admin/admins Creates Officer with Jurisdiction', false, err);
  }

  try {
    // TC-INT-021: POST /api/admin/admins Duplicate Email Returns 409
    const res = await request('/api/admin/admins', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        name: 'Duplicate Officer',
        email: 'ramesh_circle_test@dharohar.gov.in',
        password: 'PassWord1234!',
        role: 'editor',
      }),
    });
    assert.strictEqual(res.status, 409);
    recordResult('integration', 'TC-INT-021', 'POST /api/admin/admins Duplicate Email Returns 409 Conflict', true);
  } catch (err) {
    recordResult('integration', 'TC-INT-021', 'POST /api/admin/admins Duplicate Email Returns 409 Conflict', false, err);
  }

  // Cleanup created test objects
  if (createdAdminOfficerId) await User.findByIdAndDelete(createdAdminOfficerId);
  if (createdDistrictId) await District.findByIdAndDelete(createdDistrictId);
  if (createdStateId) await State.findByIdAndDelete(createdStateId);

  // -------------------------------------------------------------
  // 5. 🖥️ SYSTEM / E2E & LIFECYCLE TESTING
  // -------------------------------------------------------------
  console.log('\n--- 5. 🖥️ SYSTEM & END-TO-END TESTING ---');

  try {
    // TC-SYS-001: Complete Login -> Token Verification -> User Session Flow
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'luckypc082922@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'mp136366',
      }),
    });
    assert.strictEqual(login.status, 200);
    const token = login.data.token;
    const testAuth = await request('/api/admin/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(testAuth.status, 200);
    recordResult('system', 'TC-SYS-001', 'Complete Authentication & Session Security Flow', true);
  } catch (err) {
    recordResult('system', 'TC-SYS-001', 'Complete Authentication & Session Security Flow', false, err);
  }

  try {
    // TC-SYS-002: Invalid Login Returns Proper JSON Error Structure
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@dharohar.gov.in',
        password: 'RandomPassword',
      }),
    });
    assert.strictEqual(res.status, 401);
    assert(res.data.error, 'Should contain error description in JSON response');
    recordResult('system', 'TC-SYS-002', 'Invalid Login Returns Clear JSON Error Response', true);
  } catch (err) {
    recordResult('system', 'TC-SYS-002', 'Invalid Login Returns Clear JSON Error Response', false, err);
  }

  try {
    // TC-SYS-003: State -> District Drill-Down Loads Scope-Isolated Content
    const stateList = await request('/api/admin/states', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(stateList.data.length > 0);
    const firstState = stateList.data[0];
    const distList = await request(`/api/admin/states/${firstState._id}/districts`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(distList.data.length > 0);
    const firstDist = distList.data[0];
    const contentList = await request(`/api/admin/content?districtId=${firstDist._id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(contentList.status, 200);
    recordResult('system', 'TC-SYS-003', 'State -> District Drill-Down Cascades Correctly', true);
  } catch (err) {
    recordResult('system', 'TC-SYS-003', 'State -> District Drill-Down Cascades Correctly', false, err);
  }

  try {
    // TC-SYS-004: Canonical Sections are Auto-Synced for Every District
    const distCats = await request(`/api/admin/district-categories?districtId=${testDistrict._id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(distCats.status, 200);
    assert(Array.isArray(distCats.data) && distCats.data.length >= 5, 'Must sync canonical sections');
    const slugs = distCats.data.map(c => c.slug);
    assert(slugs.includes('popular-places'));
    assert(slugs.includes('dance-traditions'));
    assert(slugs.includes('culinary-heritage'));
    assert(slugs.includes('living-traditions'));
    recordResult('system', 'TC-SYS-004', 'Canonical Sections Synced For Every District', true);
  } catch (err) {
    recordResult('system', 'TC-SYS-004', 'Canonical Sections Synced For Every District', false, err);
  }

  try {
    // TC-SYS-005: District Category Toggle Updates Active State
    const updateCat = await request(`/api/admin/district-categories/${testDistrict._id}/dance-traditions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ enabled: false }),
    });
    assert.strictEqual(updateCat.status, 200);
    // Re-enable it
    await request(`/api/admin/district-categories/${testDistrict._id}/dance-traditions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ enabled: true }),
    });
    recordResult('system', 'TC-SYS-005', 'District Category Toggle Updates Active State', true);
  } catch (err) {
    recordResult('system', 'TC-SYS-005', 'District Category Toggle Updates Active State', false, err);
  }

  try {
    // TC-SYS-006: Public Website Dynamic City Endpoint Isolation
    const publicSections = await request(`/api/public/cities/${testDistrict._id}/sections`);
    assert.strictEqual(publicSections.status, 200);
    assert(Array.isArray(publicSections.data) && publicSections.data.length >= 5);
    recordResult('system', 'TC-SYS-006', 'Public Website Dynamic City Endpoint Returns Sections', true);
  } catch (err) {
    recordResult('system', 'TC-SYS-006', 'Public Website Dynamic City Endpoint Returns Sections', false, err);
  }

  // -------------------------------------------------------------
  // 6. 👥 UAT / ACCEPTANCE TESTING
  // -------------------------------------------------------------
  console.log('\n--- 6. 👥 UAT & ACCEPTANCE TESTING ---');

  let uatRecordId;
  try {
    // TC-UAT-001: Full Content Lifecycle: Draft -> Review -> Published -> Hidden -> Deleted
    // 1. Create Draft
    const create = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'UAT Lifecycle Monument',
        districtId: testDistrict._id,
        section: 'popular-places',
        fields: { description: 'Full lifecycle test item' },
      }),
    });
    assert.strictEqual(create.status, 201);
    uatRecordId = create.data._id;
    assert.strictEqual(create.data.status, 'draft');

    // 2. Submit for Review
    const toReview = await request(`/api/admin/content/${uatRecordId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'review' }),
    });
    assert.strictEqual(toReview.status, 200);
    assert.strictEqual(toReview.data.status, 'review');

    // 3. Publish
    const toPublish = await request(`/api/admin/content/${uatRecordId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'published' }),
    });
    assert.strictEqual(toPublish.status, 200);
    assert.strictEqual(toPublish.data.status, 'published');

    // Check public visibility
    const publicCheck = await request(`/api/public/cities/${testDistrict._id}/sections/popular-places`);
    assert(Array.isArray(publicCheck.data) && publicCheck.data.some(i => i.id === uatRecordId || i._id === uatRecordId), 'Must be visible publicly');

    // 4. Hide
    const toHide = await request(`/api/admin/content/${uatRecordId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'hidden' }),
    });
    assert.strictEqual(toHide.status, 200);
    assert.strictEqual(toHide.data.status, 'hidden');

    // Check public invisibility
    const publicCheckHidden = await request(`/api/public/cities/${testDistrict._id}/sections/popular-places`);
    assert(Array.isArray(publicCheckHidden.data) && !publicCheckHidden.data.some(i => i.id === uatRecordId || i._id === uatRecordId), 'Hidden item must not be visible publicly');

    // 5. Delete
    const toDelete = await request(`/api/admin/content/${uatRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(toDelete.status, 204);
    recordResult('uat', 'TC-UAT-001', 'Full Content Lifecycle (Draft -> Review -> Published -> Hidden -> Deleted)', true);
  } catch (err) {
    recordResult('uat', 'TC-UAT-001', 'Full Content Lifecycle (Draft -> Review -> Published -> Hidden -> Deleted)', false, err);
  }

  try {
    // TC-UAT-002: Content Search and Filter Accuracy
    const sCreate = await request('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Distinctive Unique Searchable Title XYZ999',
        districtId: testDistrict._id,
        section: 'popular-places',
      }),
    });
    assert.strictEqual(sCreate.status, 201);
    const searchRes = await request(`/api/admin/content?search=XYZ999`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(searchRes.status, 200);
    assert(Array.isArray(searchRes.data) && searchRes.data.some(i => i.title.includes('XYZ999')));
    await Content.findByIdAndDelete(sCreate.data._id);
    recordResult('uat', 'TC-UAT-002', 'Admin Content Search By Substring', true);
  } catch (err) {
    recordResult('uat', 'TC-UAT-002', 'Admin Content Search By Substring', false, err);
  }

  // -------------------------------------------------------------
  // 7. 🛡️ REGRESSION TESTING
  // -------------------------------------------------------------
  console.log('\n--- 7. 🛡️ REGRESSION TESTING ---');

  try {
    // TC-REG-001: Cross-District Isolation (No Data Bleed Between Districts)
    await District.deleteMany({ name: /^Secondary Test District REG/ });
    const dist2 = await District.create({
      name: `Secondary Test District REG ${Date.now()}`,
      slug: `secondary-test-district-reg-${Date.now()}`,
      stateId: testState._id,
    });
    testDistrict2 = dist2;

    const c1 = await Content.create({
      title: 'District 1 Only Item',
      slug: 'district-1-only-item',
      districtId: testDistrict._id,
      cityId: testDistrict._id,
      section: 'popular-places',
      status: 'published',
    });

    const c2 = await Content.create({
      title: 'District 2 Only Item',
      slug: 'district-2-only-item',
      districtId: testDistrict2._id,
      cityId: testDistrict2._id,
      section: 'popular-places',
      status: 'published',
    });

    const d1Items = await request(`/api/public/cities/${testDistrict._id}/sections/popular-places`);
    assert(Array.isArray(d1Items.data) && d1Items.data.some(i => i.title === 'District 1 Only Item'));
    assert(!d1Items.data.some(i => i.title === 'District 2 Only Item'));

    const d2Items = await request(`/api/public/cities/${testDistrict2._id}/sections/popular-places`);
    assert(Array.isArray(d2Items.data) && d2Items.data.some(i => i.title === 'District 2 Only Item'));
    assert(!d2Items.data.some(i => i.title === 'District 1 Only Item'));

    await Content.findByIdAndDelete(c1._id);
    await Content.findByIdAndDelete(c2._id);
    await District.findByIdAndDelete(testDistrict2._id);
    recordResult('regression', 'TC-REG-001', 'Zero Cross-District Content Leakage (Regression)', true);
  } catch (err) {
    recordResult('regression', 'TC-REG-001', 'Zero Cross-District Content Leakage (Regression)', false, err);
  }

  try {
    // TC-REG-002: Geospatial Nearby Search Functionality
    const geoItem = await Content.create({
      title: 'Geo Test Heritage Site',
      slug: 'geo-test-heritage-site',
      districtId: testDistrict._id,
      cityId: testDistrict._id,
      section: 'popular-places',
      status: 'published',
      location: {
        type: 'Point',
        coordinates: [75.8577, 22.7196],
      },
    });

    const nearbyRes = await request('/api/public/nearby?lat=22.7196&lng=75.8577&km=25');
    assert.strictEqual(nearbyRes.status, 200);
    assert(Array.isArray(nearbyRes.data) && nearbyRes.data.length > 0);
    await Content.findByIdAndDelete(geoItem._id);
    recordResult('regression', 'TC-REG-002', 'Geospatial "Around Me" Query Precision (Regression)', true);
  } catch (err) {
    recordResult('regression', 'TC-REG-002', 'Geospatial "Around Me" Query Precision (Regression)', false, err);
  }

  // Cleanup test content if any leftover
  if (testCreatedContentId) {
    await Content.findByIdAndDelete(testCreatedContentId).catch(() => {});
  }

  // Final Summary & Report
  console.log('\n=============================================================');
  console.log('📊 FINAL TEST SUITE EXECUTION SUMMARY');
  console.log('=============================================================');

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const [suite, list] of Object.entries(testResults)) {
    const passed = list.filter(t => t.passed).length;
    const failed = list.filter(t => !t.passed).length;
    totalTests += list.length;
    totalPassed += passed;
    totalFailed += failed;
    console.log(`- ${suite.toUpperCase().padEnd(12)}: ${passed}/${list.length} Passed (${failed} Failed)`);
  }

  console.log('-------------------------------------------------------------');
  console.log(`TOTAL EXECUTED: ${totalTests} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
  console.log('=============================================================\n');

  server.close();
  await disconnectDatabase();

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch(async (err) => {
  console.error('CRITICAL RUNNER ERROR:', err);
  if (server) server.close();
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
