import bcrypt from 'bcryptjs';
import Content from '../models/Content.js';
import City from '../models/City.js';
import State from '../models/State.js';
import User from '../models/User.js';
import { CITY_SECTIONS, VALID_SECTION_SLUGS } from '../config/sections.js';
import { isValidId, slugify, userProfile } from '../utils/auth.js';

// 1. List Content (Admin Filterable)
export async function listContent(req, res) {
	try {
		const { stateId, cityId, districtId, section, status, search, page = 1, limit = 50 } = req.query;
		const query = {};

		const targetCityId = cityId || districtId;
		if (targetCityId && isValidId(targetCityId)) {
			query.cityId = targetCityId;
		}

		if (stateId && isValidId(stateId)) {
			query.stateId = stateId;
		}

		if (section && VALID_SECTION_SLUGS.includes(section)) {
			query.section = section;
		}

		if (status && ['draft', 'review', 'published', 'hidden'].includes(status)) {
			query.status = status;
		}

		if (search && search.trim()) {
			query.title = { $regex: search.trim(), $options: 'i' };
		}

		const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
		const [total, items] = await Promise.all([
			Content.countDocuments(query),
			Content.find(query)
				.populate('cityId', 'name')
				.populate('stateId', 'name code')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit, 10))
				.lean(),
		]);

		return res.json(
			items.map((item) => ({
				_id: item._id.toString(),
				id: item._id.toString(),
				title: item.title,
				slug: item.slug,
				section: item.section,
				status: item.status,
				featured: item.isFeatured,
				isFeatured: item.isFeatured,
				cityId: item.cityId?._id?.toString() || item.cityId?.toString() || '',
				districtId: item.cityId?._id?.toString() || item.cityId?.toString() || '',
				cityName: item.cityId?.name || '',
				stateId: item.stateId?._id?.toString() || '',
				stateName: item.stateId?.name || '',
				fields: item.fields || {},
				media: item.media || [],
				location: item.location,
				latitude: item.latitude,
				longitude: item.longitude,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			})),
		);
	} catch (error) {
		console.error('Admin list content error:', error);
		return res.status(500).json({ error: 'Unable to retrieve admin content' });
	}
}

// 2. Get Single Content Record
export async function getContent(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid content ID' });

		const item = await Content.findById(id).populate('cityId', 'name').populate('stateId', 'name code').lean();
		if (!item) return res.status(404).json({ error: 'Content record not found' });

		return res.json({
			...item,
			_id: item._id.toString(),
			id: item._id.toString(),
			cityName: item.cityId?.name || '',
			stateName: item.stateId?.name || '',
		});
	} catch (error) {
		console.error('Admin get content error:', error);
		return res.status(500).json({ error: 'Unable to retrieve content record' });
	}
}

// 3. Create Content (City + Section Safe)
export async function createContent(req, res) {
	try {
		const {
			cityId,
			districtId,
			stateId,
			section,
			title,
			status = 'draft',
			isFeatured = false,
			fields = {},
			media = [],
			latitude,
			longitude,
		} = req.body || {};

		const targetCityId = cityId || districtId;
		if (!targetCityId || !isValidId(targetCityId)) {
			return res.status(400).json({ error: 'A valid cityId is required' });
		}

		const city = await City.findById(targetCityId);
		if (!city) return res.status(404).json({ error: 'Selected city does not exist' });

		const resolvedStateId = stateId && isValidId(stateId) ? stateId : city.stateId;

		const targetSection = section || 'popular-places';
		if (!VALID_SECTION_SLUGS.includes(targetSection)) {
			return res.status(400).json({
				error: `Invalid section: ${targetSection}. Valid options are: ${VALID_SECTION_SLUGS.join(', ')}`,
			});
		}

		if (!title || title.trim().length < 2) {
			return res.status(400).json({ error: 'Title is required (minimum 2 characters)' });
		}

		const baseSlug = slugify(title);
		const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

		const latNum = latitude !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : city.coordinates?.lat || 0;
		const lngNum = longitude !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : city.coordinates?.lng || 0;

		const content = await Content.create({
			cityId: city._id,
			districtId: city._id,
			stateId: resolvedStateId,
			section: targetSection,
			category: targetSection,
			title: title.trim(),
			slug: uniqueSlug,
			status: ['draft', 'review', 'published', 'hidden'].includes(status) ? status : 'draft',
			isFeatured: Boolean(isFeatured),
			fields,
			media,
			latitude: latNum,
			longitude: lngNum,
			location: {
				type: 'Point',
				coordinates: [lngNum, latNum],
			},
			active: true,
		});

		return res.status(201).json(content);
	} catch (error) {
		console.error('Admin create content error:', error);
		return res.status(500).json({ error: 'Unable to create content record' });
	}
}

// 4. Update Content
export async function updateContent(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid content ID' });

		const {
			cityId,
			districtId,
			stateId,
			section,
			title,
			status,
			isFeatured,
			fields,
			media,
			latitude,
			longitude,
		} = req.body || {};

		const existing = await Content.findById(id);
		if (!existing) return res.status(404).json({ error: 'Content record not found' });

		const update = {};

		const targetCityId = cityId || districtId;
		if (targetCityId && isValidId(targetCityId)) {
			const city = await City.findById(targetCityId);
			if (city) {
				update.cityId = city._id;
				update.districtId = city._id;
				update.stateId = stateId && isValidId(stateId) ? stateId : city.stateId;
			}
		}

		if (section && VALID_SECTION_SLUGS.includes(section)) {
			update.section = section;
			update.category = section;
		}

		if (title && title.trim().length >= 2) {
			update.title = title.trim();
		}

		if (status && ['draft', 'review', 'published', 'hidden'].includes(status)) {
			update.status = status;
		}

		if (isFeatured !== undefined) {
			update.isFeatured = Boolean(isFeatured);
		}

		if (fields && typeof fields === 'object') {
			update.fields = { ...existing.fields, ...fields };
		}

		if (Array.isArray(media)) {
			update.media = media;
		}

		if (latitude !== undefined && longitude !== undefined) {
			const lat = Number(latitude);
			const lng = Number(longitude);
			if (!isNaN(lat) && !isNaN(lng)) {
				update.latitude = lat;
				update.longitude = lng;
				update.location = { type: 'Point', coordinates: [lng, lat] };
			}
		}

		const updated = await Content.findByIdAndUpdate(id, update, { new: true, runValidators: true });
		return res.json(updated);
	} catch (error) {
		console.error('Admin update content error:', error);
		return res.status(500).json({ error: 'Unable to update content record' });
	}
}

// 5. Delete Content
export async function deleteContent(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid content ID' });

		const deleted = await Content.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ error: 'Content record not found' });

		return res.status(204).end();
	} catch (error) {
		console.error('Admin delete content error:', error);
		return res.status(500).json({ error: 'Unable to delete content record' });
	}
}

// 6. States Management
export async function listStates(req, res) {
	try {
		const states = await State.find().sort({ name: 1 }).lean();
		return res.json(states);
	} catch (error) {
		console.error('Admin list states error:', error);
		return res.status(500).json({ error: 'Unable to retrieve states' });
	}
}

export async function createState(req, res) {
	try {
		const { name, code, active = true, description = '' } = req.body || {};
		if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

		const state = await State.create({
			name: name.trim(),
			code: code.trim().toUpperCase(),
			slug: slugify(name),
			description,
			active: Boolean(active),
		});

		return res.status(201).json(state);
	} catch (error) {
		console.error('Admin create state error:', error);
		return res.status(500).json({ error: 'Unable to create state' });
	}
}

// 7. Cities Management
export async function listCities(req, res) {
	try {
		const { stateId } = req.query;
		const query = {};
		if (stateId && isValidId(stateId)) query.stateId = stateId;

		const cities = await City.find(query).populate('stateId', 'name code').sort({ name: 1 }).lean();
		return res.json(cities);
	} catch (error) {
		console.error('Admin list cities error:', error);
		return res.status(500).json({ error: 'Unable to retrieve cities' });
	}
}

export async function listStateDistricts(req, res) {
	try {
		const { stateId } = req.params;
		if (!isValidId(stateId)) return res.status(400).json({ error: 'Invalid state ID' });

		const cities = await City.find({ stateId }).sort({ name: 1 }).lean();
		return res.json(cities);
	} catch (error) {
		console.error('Admin list state districts error:', error);
		return res.status(500).json({ error: 'Unable to load state cities' });
	}
}

export async function createCity(req, res) {
	try {
		const { stateId, name, active = true, coverImage = '', description = '', coordinates } = req.body || {};
		if (!stateId || !name) return res.status(400).json({ error: 'State ID and City Name are required' });

		const city = await City.create({
			stateId,
			name: name.trim(),
			slug: slugify(name),
			coverImage,
			description,
			coordinates: coordinates || { lat: 0, lng: 0 },
			active: Boolean(active),
		});

		return res.status(201).json(city);
	} catch (error) {
		console.error('Admin create city error:', error);
		return res.status(500).json({ error: 'Unable to create city' });
	}
}

export async function updateCity(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid city ID' });

		const city = await City.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
		if (!city) return res.status(404).json({ error: 'City not found' });

		return res.json(city);
	} catch (error) {
		console.error('Admin update city error:', error);
		return res.status(500).json({ error: 'Unable to update city' });
	}
}

export async function deleteCity(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid city ID' });

		const deleted = await City.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ error: 'City not found' });

		return res.status(204).end();
	} catch (error) {
		console.error('Admin delete city error:', error);
		return res.status(500).json({ error: 'Unable to delete city' });
	}
}

// 8. Admin Officers Management
export async function listAdmins(req, res) {
	try {
		const admins = await User.find({ role: { $in: ['admin', 'super_admin', 'editor', 'reviewer'] } })
			.select('-password')
			.sort({ name: 1 })
			.lean();

		return res.json(
			admins.map((a) => ({
				_id: a._id.toString(),
				id: a._id.toString(),
				name: a.name,
				email: a.email,
				role: a.role,
				active: a.active,
			})),
		);
	} catch (error) {
		console.error('Admin list admins error:', error);
		return res.status(500).json({ error: 'Unable to retrieve admin officers' });
	}
}

export async function createAdmin(req, res) {
	try {
		const { name, email, password, role = 'editor' } = req.body || {};
		if (!name || !email || !password) {
			return res.status(400).json({ error: 'Name, email, and password are required' });
		}

		const cleanEmail = email.toLowerCase().trim();
		const existing = await User.findOne({ email: cleanEmail });
		if (existing) {
			return res.status(400).json({ error: 'An account with this email already exists' });
		}

		const hashedPassword = await bcrypt.hash(password, 12);
		const admin = await User.create({
			name: name.trim(),
			email: cleanEmail,
			password: hashedPassword,
			role: ['super_admin', 'editor', 'reviewer', 'admin'].includes(role) ? role : 'editor',
			active: true,
		});

		return res.status(201).json({
			id: admin._id.toString(),
			_id: admin._id.toString(),
			name: admin.name,
			email: admin.email,
			role: admin.role,
			active: admin.active,
		});
	} catch (error) {
		console.error('Admin create admin error:', error);
		return res.status(500).json({ error: 'Unable to create admin officer' });
	}
}

export async function updateAdmin(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid admin ID' });

		const { name, role, active, password } = req.body || {};
		const update = {};

		if (name) update.name = name.trim();
		if (role && ['super_admin', 'editor', 'reviewer', 'admin'].includes(role)) update.role = role;
		if (active !== undefined) update.active = Boolean(active);
		if (password && password.length >= 8) update.password = await bcrypt.hash(password, 12);

		const admin = await User.findByIdAndUpdate(id, update, { new: true });
		if (!admin) return res.status(404).json({ error: 'Admin officer not found' });

		return res.json({
			id: admin._id.toString(),
			_id: admin._id.toString(),
			name: admin.name,
			email: admin.email,
			role: admin.role,
			active: admin.active,
		});
	} catch (error) {
		console.error('Admin update admin error:', error);
		return res.status(500).json({ error: 'Unable to update admin officer' });
	}
}

// 9. Admin Dashboard Summary Metrics
export async function getSummary(req, res) {
	try {
		const { districtId, cityId } = req.query;
		const targetCityId = cityId || districtId;
		const query = {};
		if (targetCityId && isValidId(targetCityId)) query.cityId = targetCityId;

		const [content, admins, users, states, cities] = await Promise.all([
			Content.find(query, 'status section cityId stateId').lean(),
			User.find({ role: { $in: ['admin', 'super_admin', 'editor', 'reviewer'] } }, 'role active').lean(),
			User.countDocuments({ role: 'user', active: true }),
			State.find({ active: true }, 'name code').lean(),
			City.find({ active: true }, 'name stateId').populate('stateId', 'name code').lean(),
		]);

		const contentCounts = content.reduce(
			(acc, item) => {
				acc.total += 1;
				const st = item.status || 'draft';
				acc[st] = (acc[st] || 0) + 1;
				return acc;
			},
			{ total: 0, published: 0, draft: 0, review: 0, hidden: 0 },
		);

		const adminCounts = admins.reduce(
			(acc, a) => {
				acc.total += 1;
				if (a.active) acc.active += 1;
				if (a.role === 'super_admin' || a.role === 'admin') acc.superAdmins += 1;
				if (a.role === 'editor') acc.editors += 1;
				if (a.role === 'reviewer') acc.reviewers += 1;
				return acc;
			},
			{ total: 0, active: 0, superAdmins: 0, editors: 0, reviewers: 0 },
		);

		const ledger = cities.map((c) => {
			const cityContent = content.filter((item) => item.cityId?.toString() === c._id.toString());
			return {
				code: c.stateId?.code || 'IN',
				state: c.stateId?.name || 'National',
				district: c.name,
				activeCategories: '5 Canonical Sections',
				published: cityContent.filter((i) => i.status === 'published').length,
				draft: cityContent.filter((i) => i.status === 'draft').length,
			};
		});

		return res.json({
			content: contentCounts,
			admins: adminCounts,
			users: { active: users },
			coverage: {
				activeStates: states.length,
				activeDistricts: cities.length,
			},
			categories: CITY_SECTIONS.length,
			ledger,
		});
	} catch (error) {
		console.error('Admin summary error:', error);
		return res.status(500).json({ error: 'Unable to generate summary statistics' });
	}
}

// Backward-compatible aliases for legacy admin routes
export const createDistrict = createCity;
export const updateDistrict = updateCity;
export const deleteDistrict = deleteCity;
export const listDistrictCategories = (req, res) => res.json(CITY_SECTIONS);
export const createDistrictCategory = (req, res) => res.json({ success: true });
export const updateDistrictCategory = (req, res) => res.json({ success: true });
export const createCategory = (req, res) => res.json({ success: true });
