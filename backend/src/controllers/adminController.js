import bcrypt from 'bcryptjs';
import Content from '../models/Content.js';
import City from '../models/City.js';
import State from '../models/State.js';
import User from '../models/User.js';
import DistrictCategory from '../models/DistrictCategory.js';
import AuditLog from '../models/AuditLog.js';
import {
	CATEGORY_DEFINITIONS,
	CITY_SECTIONS,
	VALID_CATEGORY_SLUGS,
	VALID_SECTION_SLUGS,
	resolveCategorySlug,
	getSectionBySlug,
	sanitizeCategoryFields,
} from '../config/categoryDefinitions.js';
import { isValidId, slugify } from '../utils/auth.js';

// Helper for audit logging
async function logAudit(req, action, entity, entityId, summary, details = {}) {
	try {
		await AuditLog.create({
			actor: req.admin?._id || req.admin?.id,
			actorEmail: req.admin?.email,
			actorRole: req.admin?.role,
			action,
			entity,
			entityId,
			summary,
			details,
			ip: req.ip || req.connection?.remoteAddress,
			userAgent: req.headers?.['user-agent'],
		});
	} catch (err) {
		console.warn('Audit logging non-blocking error:', err.message);
	}
}

// 1. List Content (Admin Filterable & Scoped)
export async function listContent(req, res) {
	try {
		const { stateId, cityId, districtId, section, status, search, page = 1, limit = 50 } = req.query;
		const query = { active: { $ne: false } };

		const targetCityId = districtId || cityId;
		if (targetCityId && isValidId(targetCityId)) {
			query.cityId = targetCityId;
		}

		if (stateId && isValidId(stateId)) {
			query.stateId = stateId;
		}

		if (section) {
			const canonicalSection = resolveCategorySlug(section);
			if (canonicalSection) {
				const definition = CATEGORY_DEFINITIONS[canonicalSection];
				query.section = { $in: [canonicalSection, ...(definition?.aliases || [])] };
			}
		}

		if (status && ['draft', 'review', 'published', 'hidden', 'archived'].includes(status)) {
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
			items.map((item) => {
				const canonicalSection = resolveCategorySlug(item.section) || item.section;
				return {
					_id: item._id.toString(),
					id: item._id.toString(),
					title: item.title,
					subtitle: item.subtitle || item.fields?.subTitle || '',
					slug: item.slug,
					section: canonicalSection,
					category: item.category || CATEGORY_DEFINITIONS[canonicalSection]?.title || 'Heritage',
					status: item.status,
					featured: Boolean(item.isFeatured),
					isFeatured: Boolean(item.isFeatured),
					mediaEnabled: item.mediaEnabled !== false,
					documentsEnabled: item.documentsEnabled !== false,
					shortDescription: item.shortDescription || item.fields?.description || '',
					fullDescription: item.fullDescription || item.fields?.fullDescription || '',
					cityId: item.cityId?._id?.toString() || item.cityId?.toString() || '',
					districtId: item.cityId?._id?.toString() || item.cityId?.toString() || '',
					cityName: item.cityId?.name || '',
					stateId: item.stateId?._id?.toString() || '',
					stateName: item.stateId?.name || '',
					fields: item.fields || {},
					media: item.media || [],
					documents: item.documents || [],
					sources: item.sources || [],
					location: item.location,
					latitude: item.latitude,
					longitude: item.longitude,
					publishedAt: item.publishedAt,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				};
			}),
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
		if (!item || item.active === false) return res.status(404).json({ error: 'Content record not found' });

		const canonicalSection = resolveCategorySlug(item.section) || item.section;

		return res.json({
			...item,
			_id: item._id.toString(),
			id: item._id.toString(),
			section: canonicalSection,
			category: item.category || CATEGORY_DEFINITIONS[canonicalSection]?.title || 'Heritage',
			subtitle: item.subtitle || item.fields?.subTitle || '',
			shortDescription: item.shortDescription || item.fields?.description || '',
			fullDescription: item.fullDescription || item.fields?.fullDescription || '',
			cityName: item.cityId?.name || '',
			stateName: item.stateId?.name || '',
			districtId: item.cityId?._id?.toString() || item.cityId?.toString() || '',
		});
	} catch (error) {
		console.error('Admin get content error:', error);
		return res.status(500).json({ error: 'Unable to retrieve content record' });
	}
}

// 3. Create Content
export async function createContent(req, res) {
	try {
		const {
			cityId,
			districtId,
			stateId,
			section,
			title,
			subtitle,
			shortDescription,
			fullDescription,
			status = 'published',
			isFeatured = false,
			mediaEnabled = true,
			documentsEnabled = true,
			fields = {},
			media = [],
			documents = [],
			sources = [],
			latitude,
			longitude,
		} = req.body || {};

		const targetCityId = districtId || cityId;
		if (!targetCityId || !isValidId(targetCityId)) {
			return res.status(400).json({ error: 'A valid districtId is required' });
		}

		const city = await City.findById(targetCityId);
		if (!city) return res.status(404).json({ error: 'Selected district does not exist' });

		const resolvedStateId = stateId && isValidId(stateId) ? stateId : city.stateId;

		const canonicalSection = resolveCategorySlug(section) || 'heritage-places';

		if (!title || title.trim().length < 2) {
			return res.status(400).json({ error: 'Title is required (minimum 2 characters)' });
		}

		// Validate coordinates if provided
		let latNum = undefined;
		let lngNum = undefined;
		let locationObj = undefined;

		if (latitude !== undefined && latitude !== null && latitude !== '' && longitude !== undefined && longitude !== null && longitude !== '') {
			const parsedLat = Number(latitude);
			const parsedLng = Number(longitude);
			if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
				return res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90' });
			}
			if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
				return res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180' });
			}
			latNum = parsedLat;
			lngNum = parsedLng;
			locationObj = {
				type: 'Point',
				coordinates: [lngNum, latNum],
			};
		}

		// Whitelist and sanitize fields for the category
		const sanitizedFields = sanitizeCategoryFields(canonicalSection, fields);

		const baseSlug = slugify(title);
		const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

		const contentStatus = ['draft', 'review', 'published', 'hidden', 'archived'].includes(status) ? status : 'published';
		const actorId = req.admin?._id || req.admin?.id;

		const content = await Content.create({
			cityId: city._id,
			districtId: city._id,
			stateId: resolvedStateId,
			section: canonicalSection,
			category: CATEGORY_DEFINITIONS[canonicalSection].title,
			title: title.trim(),
			subtitle: subtitle ? subtitle.trim() : sanitizedFields.subTitle || '',
			slug: uniqueSlug,
			shortDescription: shortDescription ? shortDescription.trim() : sanitizedFields.description || '',
			fullDescription: fullDescription ? fullDescription.trim() : sanitizedFields.fullDescription || '',
			status: contentStatus,
			isFeatured: Boolean(isFeatured),
			mediaEnabled: Boolean(mediaEnabled),
			documentsEnabled: Boolean(documentsEnabled),
			fields: sanitizedFields,
			media: Array.isArray(media) ? media : [],
			documents: Array.isArray(documents) ? documents : [],
			sources: Array.isArray(sources) ? sources : [],
			latitude: latNum,
			longitude: lngNum,
			location: locationObj,
			publishedAt: contentStatus === 'published' ? new Date() : undefined,
			publishedBy: contentStatus === 'published' ? actorId : undefined,
			createdBy: actorId,
			active: true,
		});

		logAudit(
			req,
			'CREATE',
			'Content',
			content._id,
			`Created content "${content.title}" in category "${canonicalSection}"`,
			{ title, section: canonicalSection },
		);

		return res.status(201).json(content);
	} catch (error) {
		console.error('Admin create content error:', error);
		return res.status(500).json({ error: 'Unable to create content record' });
	}
}

// 4. Update Content (Updates in place, preserving ID and category scope)
export async function updateContent(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid content ID' });

		const existing = await Content.findById(id);
		if (!existing || existing.active === false) return res.status(404).json({ error: 'Content record not found' });

		const {
			cityId,
			districtId,
			stateId,
			title,
			subtitle,
			shortDescription,
			fullDescription,
			status,
			isFeatured,
			mediaEnabled,
			documentsEnabled,
			fields,
			media,
			documents,
			sources,
			latitude,
			longitude,
		} = req.body || {};

		const update = {};
		const actorId = req.admin?._id || req.admin?.id;
		update.updatedBy = actorId;

		const targetCityId = districtId || cityId;
		if (targetCityId && isValidId(targetCityId)) {
			const city = await City.findById(targetCityId);
			if (city) {
				update.cityId = city._id;
				update.districtId = city._id;
				update.stateId = stateId && isValidId(stateId) ? stateId : city.stateId;
			}
		}

		// Keep canonical category
		const currentCategorySlug = resolveCategorySlug(existing.section) || existing.section;
		update.section = currentCategorySlug;
		if (CATEGORY_DEFINITIONS[currentCategorySlug]) {
			update.category = CATEGORY_DEFINITIONS[currentCategorySlug].title;
		}

		if (title && title.trim().length >= 2) {
			update.title = title.trim();
		}

		if (subtitle !== undefined) {
			update.subtitle = subtitle.trim();
		}

		if (shortDescription !== undefined) {
			update.shortDescription = shortDescription.trim();
		}

		if (fullDescription !== undefined) {
			update.fullDescription = fullDescription.trim();
		}

		if (status && ['draft', 'review', 'published', 'hidden', 'archived'].includes(status)) {
			update.status = status;
			if (status === 'published' && existing.status !== 'published') {
				update.publishedAt = new Date();
				update.publishedBy = actorId;
			}
		}

		if (isFeatured !== undefined) {
			update.isFeatured = Boolean(isFeatured);
		}

		if (mediaEnabled !== undefined) {
			update.mediaEnabled = Boolean(mediaEnabled);
		}

		if (documentsEnabled !== undefined) {
			update.documentsEnabled = Boolean(documentsEnabled);
		}

		// Sanitize updated fields against the record's category definition
		if (fields && typeof fields === 'object') {
			const sanitizedFields = sanitizeCategoryFields(currentCategorySlug, fields);
			update.fields = { ...sanitizedFields };
		}

		if (Array.isArray(media)) {
			update.media = media;
		}

		if (Array.isArray(documents)) {
			update.documents = documents;
		}

		if (Array.isArray(sources)) {
			update.sources = sources;
		}

		if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null && latitude !== '' && longitude !== '') {
			const lat = Number(latitude);
			const lng = Number(longitude);
			if (isNaN(lat) || lat < -90 || lat > 90) {
				return res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90' });
			}
			if (isNaN(lng) || lng < -180 || lng > 180) {
				return res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180' });
			}
			update.latitude = lat;
			update.longitude = lng;
			update.location = { type: 'Point', coordinates: [lng, lat] };
		}

		const updated = await Content.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });

		logAudit(req, 'UPDATE', 'Content', id, `Updated content "${updated.title}"`, { changes: Object.keys(update) });

		return res.json(updated);
	} catch (error) {
		console.error('Admin update content error:', error);
		return res.status(500).json({ error: 'Unable to update content record' });
	}
}

// 5. Patch Content Status Only
export async function patchContentStatus(req, res) {
	try {
		const { id } = req.params;
		const { status } = req.body || {};

		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid content ID' });
		if (!status || !['draft', 'review', 'published', 'hidden', 'archived'].includes(status)) {
			return res.status(400).json({ error: 'Invalid status. Allowed: draft, review, published, hidden, archived' });
		}

		const update = { status, updatedBy: req.admin?._id || req.admin?.id };
		if (status === 'published') {
			update.publishedAt = new Date();
			update.publishedBy = req.admin?._id || req.admin?.id;
		}

		const updated = await Content.findOneAndUpdate(
			{ _id: id, active: { $ne: false } },
			{ $set: update },
			{ new: true },
		);
		if (!updated) return res.status(404).json({ error: 'Content record not found' });

		logAudit(req, 'STATUS_CHANGE', 'Content', id, `Changed status of "${updated.title}" to ${status}`);

		return res.json({ success: true, id, status: updated.status, publishedAt: updated.publishedAt });
	} catch (error) {
		console.error('Admin patch content status error:', error);
		return res.status(500).json({ error: 'Unable to change content status' });
	}
}

// 6. Soft Delete Content
export async function deleteContent(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid content ID' });

		const deleted = await Content.findOneAndUpdate(
			{ _id: id, active: { $ne: false } },
			{ $set: { active: false, updatedBy: req.admin?._id || req.admin?.id } },
			{ new: true },
		);
		if (!deleted) return res.status(404).json({ error: 'Content record not found' });

		logAudit(req, 'DELETE', 'Content', id, `Soft-deleted content "${deleted.title}"`);

		return res.status(204).end();
	} catch (error) {
		console.error('Admin delete content error:', error);
		return res.status(500).json({ error: 'Unable to delete content record' });
	}
}

// 7. States Management
export async function listStates(req, res) {
	try {
		const states = await State.find({ active: { $ne: false } }).sort({ name: 1 }).lean();
		return res.json(states);
	} catch (error) {
		console.error('Admin list states error:', error);
		return res.status(500).json({ error: 'Unable to retrieve states' });
	}
}

export async function createState(req, res) {
	try {
		const { name, code, active = true, description = '' } = req.body || {};
		if (!name || !code) return res.status(400).json({ error: 'State name and code are required' });

		const cleanName = name.trim();
		const cleanCode = code.trim().toUpperCase();

		const state = await State.create({
			name: cleanName,
			code: cleanCode,
			slug: slugify(cleanName),
			normalized_name: cleanName.toLowerCase().replace(/[^a-z0-9]/g, ''),
			description,
			active: Boolean(active),
			createdBy: req.admin?._id || req.admin?.id,
		});

		logAudit(req, 'CREATE', 'State', state._id, `Created state "${state.name}" (${state.code})`);

		return res.status(201).json(state);
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ error: 'A state with this name or code already exists in the system.' });
		}
		console.error('Admin create state error:', error);
		return res.status(500).json({ error: 'Unable to create state' });
	}
}

export async function updateState(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid state ID' });

		const { name, code, description, active } = req.body || {};
		const update = { updatedBy: req.admin?._id || req.admin?.id };

		if (name) {
			update.name = name.trim();
			update.slug = slugify(name.trim());
			update.normalized_name = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
		}
		if (code) update.code = code.trim().toUpperCase();
		if (description !== undefined) update.description = description;
		if (active !== undefined) update.active = Boolean(active);

		const updated = await State.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
		if (!updated) return res.status(404).json({ error: 'State not found' });

		logAudit(req, 'UPDATE', 'State', id, `Updated state "${updated.name}"`);

		return res.json(updated);
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ error: 'A state with this name or code already exists' });
		}
		console.error('Admin update state error:', error);
		return res.status(500).json({ error: 'Unable to update state' });
	}
}

export async function deleteState(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid state ID' });

		const districtCount = await City.countDocuments({ stateId: id, active: { $ne: false } });
		if (districtCount > 0) {
			return res.status(409).json({
				error: `Cannot delete state: it contains ${districtCount} active district(s). Delete or reassign districts first.`,
			});
		}

		const deleted = await State.findByIdAndUpdate(id, { $set: { active: false } });
		if (!deleted) return res.status(404).json({ error: 'State not found' });

		logAudit(req, 'DELETE', 'State', id, `Deleted state "${deleted.name}"`);

		return res.status(204).end();
	} catch (error) {
		console.error('Admin delete state error:', error);
		return res.status(500).json({ error: 'Unable to delete state' });
	}
}

// 8. Cities / Districts Management
export async function listCities(req, res) {
	try {
		const { stateId } = req.query;
		const query = { active: { $ne: false } };
		if (stateId && isValidId(stateId)) query.stateId = stateId;

		const cities = await City.find(query).populate('stateId', 'name code').sort({ name: 1 }).lean();
		return res.json(cities);
	} catch (error) {
		console.error('Admin list cities error:', error);
		return res.status(500).json({ error: 'Unable to retrieve districts' });
	}
}

export async function listStateDistricts(req, res) {
	try {
		const { stateId } = req.params;
		if (!isValidId(stateId)) return res.status(400).json({ error: 'Invalid state ID' });

		const cities = await City.find({ stateId, active: { $ne: false } }).sort({ name: 1 }).lean();
		return res.json(cities);
	} catch (error) {
		console.error('Admin list state districts error:', error);
		return res.status(500).json({ error: 'Unable to load state districts' });
	}
}

export async function createCity(req, res) {
	try {
		const { stateId, name, active = true, coverImage = '', description = '', coordinates } = req.body || {};
		if (!stateId || !name) return res.status(400).json({ error: 'State ID and District Name are required' });

		const cleanName = name.trim();
		const city = await City.create({
			stateId,
			name: cleanName,
			normalizedName: cleanName.toLowerCase().replace(/[^a-z0-9]/g, ''),
			slug: slugify(cleanName),
			coverImage,
			description,
			coordinates: coordinates || { lat: 0, lng: 0 },
			active: Boolean(active),
			createdBy: req.admin?._id || req.admin?.id,
		});

		logAudit(req, 'CREATE', 'City', city._id, `Created district "${city.name}" in state ${stateId}`);

		return res.status(201).json(city);
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ error: 'A district with this name already exists in this state.' });
		}
		console.error('Admin create city error:', error);
		return res.status(500).json({ error: 'Unable to create district' });
	}
}

export async function updateCity(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid district ID' });

		const { name, coverImage, description, coordinates, active } = req.body || {};
		const update = { updatedBy: req.admin?._id || req.admin?.id };

		if (name) {
			update.name = name.trim();
			update.slug = slugify(name.trim());
			update.normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
		}
		if (coverImage !== undefined) update.coverImage = coverImage;
		if (description !== undefined) update.description = description;
		if (coordinates && typeof coordinates === 'object') update.coordinates = coordinates;
		if (active !== undefined) update.active = Boolean(active);

		const city = await City.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
		if (!city) return res.status(404).json({ error: 'District not found' });

		logAudit(req, 'UPDATE', 'City', id, `Updated district "${city.name}"`);

		return res.json(city);
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ error: 'A district with this name already exists in this state' });
		}
		console.error('Admin update city error:', error);
		return res.status(500).json({ error: 'Unable to update district' });
	}
}

export async function deleteCity(req, res) {
	try {
		const { id } = req.params;
		if (!isValidId(id)) return res.status(400).json({ error: 'Invalid district ID' });

		const recordCount = await Content.countDocuments({ cityId: id, active: { $ne: false } });
		if (recordCount > 0) {
			return res.status(409).json({
				error: `Cannot delete district: it contains ${recordCount} active heritage record(s). Delete or reassign the records first.`,
			});
		}

		const deleted = await City.findByIdAndUpdate(id, { $set: { active: false } });
		if (!deleted) return res.status(404).json({ error: 'District not found' });

		logAudit(req, 'DELETE', 'City', id, `Deleted district "${deleted.name}"`);

		return res.status(204).end();
	} catch (error) {
		console.error('Admin delete city error:', error);
		return res.status(500).json({ error: 'Unable to delete district' });
	}
}

// 9. Admin Officers Management
export async function listAdmins(req, res) {
	try {
		const admins = await User.find({
			role: { $in: ['admin', 'super_admin', 'editor', 'reviewer', 'state_admin', 'district_admin'] },
		})
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
				state: a.state,
				district: a.district,
				stateId: a.stateId?.toString(),
				cityId: a.cityId?.toString(),
			})),
		);
	} catch (error) {
		console.error('Admin list admins error:', error);
		return res.status(500).json({ error: 'Unable to retrieve admin officers' });
	}
}

export async function createAdmin(req, res) {
	try {
		const { name, email, password, role = 'editor', stateId, cityId } = req.body || {};
		if (!name || !email || !password) {
			return res.status(400).json({ error: 'Name, email, and password are required' });
		}

		const cleanEmail = email.toLowerCase().trim();
		const existing = await User.findOne({ email: cleanEmail });
		if (existing) {
			return res.status(409).json({ error: 'An account with this email already exists' });
		}

		const hashedPassword = await bcrypt.hash(password, 12);
		const allowedRoles = ['super_admin', 'editor', 'reviewer', 'admin', 'state_admin', 'district_admin'];
		const adminRole = allowedRoles.includes(role) ? role : 'editor';

		let stateDoc = null;
		let cityDoc = null;
		if (stateId && isValidId(stateId)) stateDoc = await State.findById(stateId);
		if (cityId && isValidId(cityId)) cityDoc = await City.findById(cityId);

		const admin = await User.create({
			name: name.trim(),
			email: cleanEmail,
			password: hashedPassword,
			role: adminRole,
			stateId: stateDoc?._id,
			cityId: cityDoc?._id,
			state: stateDoc?.name || '',
			district: cityDoc?.name || '',
			active: true,
		});

		logAudit(
			req,
			'CREATE',
			'User',
			admin._id,
			`Created admin officer ${admin.name} (${admin.email}) with role ${adminRole}`,
		);

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

		const { name, role, active, password, stateId, cityId } = req.body || {};
		const update = {};

		if (name) update.name = name.trim();
		if (role && ['super_admin', 'editor', 'reviewer', 'admin', 'state_admin', 'district_admin'].includes(role)) {
			update.role = role;
		}
		if (active !== undefined) update.active = Boolean(active);
		if (password && password.length >= 6) update.password = await bcrypt.hash(password, 12);

		if (stateId && isValidId(stateId)) {
			const s = await State.findById(stateId);
			update.stateId = s?._id;
			update.state = s?.name || '';
		}

		if (cityId && isValidId(cityId)) {
			const c = await City.findById(cityId);
			update.cityId = c?._id;
			update.district = c?.name || '';
		}

		const admin = await User.findByIdAndUpdate(id, { $set: update }, { new: true });
		if (!admin) return res.status(404).json({ error: 'Admin officer not found' });

		logAudit(req, 'UPDATE', 'User', id, `Updated admin officer ${admin.name}`);

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

// 10. Dashboard Summary & Comprehensive Metrics
export async function getSummary(req, res) {
	try {
		const { districtId, cityId } = req.query;
		const targetDistrictId = districtId || cityId;
		const query = { active: { $ne: false } };
		if (targetDistrictId && isValidId(targetDistrictId)) {
			query.cityId = targetDistrictId;
		}

		const [content, admins, users, states, cities, customCategoryConfigs] = await Promise.all([
			Content.find(query, 'status section cityId stateId isFeatured').lean(),
			User.find(
				{ role: { $in: ['admin', 'super_admin', 'editor', 'reviewer', 'state_admin', 'district_admin'] } },
				'role active',
			).lean(),
			User.countDocuments({ role: 'user', active: true }),
			State.find({ active: { $ne: false } }, 'name code').lean(),
			City.find({ active: { $ne: false } }, 'name stateId').populate('stateId', 'name code').lean(),
			targetDistrictId && isValidId(targetDistrictId)
				? DistrictCategory.find({ districtId: targetDistrictId }).lean()
				: Promise.resolve([]),
		]);

		const contentCounts = content.reduce(
			(acc, item) => {
				acc.total += 1;
				const st = item.status || 'draft';
				acc[st] = (acc[st] || 0) + 1;
				if (item.isFeatured) acc.featured = (acc.featured || 0) + 1;
				return acc;
			},
			{ total: 0, published: 0, draft: 0, review: 0, hidden: 0, archived: 0, featured: 0 },
		);

		const adminCounts = admins.reduce(
			(acc, a) => {
				acc.total += 1;
				if (a.active) acc.active += 1;
				if (a.role === 'super_admin' || a.role === 'admin') acc.superAdmins += 1;
				if (a.role === 'editor') acc.editors += 1;
				if (a.role === 'reviewer') acc.reviewers += 1;
				if (a.role === 'state_admin') acc.stateAdmins = (acc.stateAdmins || 0) + 1;
				if (a.role === 'district_admin') acc.districtAdmins = (acc.districtAdmins || 0) + 1;
				return acc;
			},
			{ total: 0, active: 0, superAdmins: 0, editors: 0, reviewers: 0, stateAdmins: 0, districtAdmins: 0 },
		);

		// Calculate active categories count for target district
		let activeCategoriesCount = CITY_SECTIONS.length;
		if (targetDistrictId && customCategoryConfigs.length > 0) {
			const disabledCount = customCategoryConfigs.filter((c) => c.enabled === false).length;
			activeCategoriesCount = Math.max(0, CITY_SECTIONS.length - disabledCount);
		}

		// Also fetch all content counts per district for the national ledger
		const allContent = targetDistrictId ? await Content.find({ active: { $ne: false } }, 'cityId status').lean() : content;

		const ledger = cities.map((c) => {
			const cityContent = allContent.filter(
				(item) => (item.cityId?._id || item.cityId)?.toString() === c._id.toString(),
			);
			const isCurrent = targetDistrictId && c._id.toString() === targetDistrictId.toString();
			return {
				id: c._id.toString(),
				code: c.stateId?.code || 'IN',
				state: c.stateId?.name || 'National',
				district: c.name,
				activeCategories: `${CITY_SECTIONS.length} Canonical Categories`,
				published: cityContent.filter((i) => i.status === 'published').length,
				draft: cityContent.filter((i) => i.status === 'draft').length,
				review: cityContent.filter((i) => i.status === 'review').length,
				total: cityContent.length,
				isHighlighted: Boolean(isCurrent),
			};
		});

		// Deduplicate states
		const uniqueStateNames = new Set();
		states.forEach((st) => {
			if (st.name) uniqueStateNames.add(st.name.trim().toLowerCase());
		});
		const uniqueStatesCount = uniqueStateNames.size || states.length;
		const uniqueDistrictsCount = cities.length;

		return res.json({
			content: contentCounts,
			admins: adminCounts,
			users: { active: users },
			coverage: {
				activeStates: uniqueStatesCount,
				activeDistricts: uniqueDistrictsCount,
				totalStates: uniqueStatesCount,
				totalDistricts: uniqueDistrictsCount,
			},
			categories: activeCategoriesCount,
			ledger,
		});
	} catch (error) {
		console.error('Admin summary error:', error);
		return res.status(500).json({ error: 'Unable to generate summary statistics' });
	}
}

// 11. District Category Configuration Management
export async function listDistrictCategories(req, res) {
	try {
		const { districtId, cityId } = req.query;
		const targetDistrictId = districtId || cityId;
		if (!targetDistrictId || !isValidId(targetDistrictId)) {
			return res.json(CITY_SECTIONS.map((s) => ({ ...s, enabled: true })));
		}

		const customConfigs = await DistrictCategory.find({ districtId: targetDistrictId }).lean();
		const configMap = new Map();
		customConfigs.forEach((c) => {
			const canonical = resolveCategorySlug(c.categorySlug || c.categoryId);
			if (canonical) {
				configMap.set(canonical, c.enabled);
			}
		});

		const result = CITY_SECTIONS.map((section) => {
			let isEnabled = true;
			const slug = section.slug;
			if (configMap.has(slug)) {
				isEnabled = configMap.get(slug);
			}

			return {
				...section,
				enabled: isEnabled,
			};
		});

		return res.json(result);
	} catch (error) {
		console.error('List district categories error:', error);
		return res.status(500).json({ error: 'Unable to retrieve district categories' });
	}
}

export async function createDistrictCategory(req, res) {
	try {
		const { districtId, categorySlug, categoryId, enabled = true } = req.body || {};
		if (!districtId || !isValidId(districtId)) {
			return res.status(400).json({ error: 'Valid districtId is required' });
		}
		const rawSlug = categorySlug || categoryId || '';
		const canonicalSlug = resolveCategorySlug(rawSlug);
		if (!canonicalSlug) {
			return res.status(400).json({
				error: `Invalid category: "${rawSlug}". Must be one of: ${VALID_CATEGORY_SLUGS.join(', ')}`,
			});
		}

		const record = await DistrictCategory.findOneAndUpdate(
			{ districtId, categorySlug: canonicalSlug },
			{
				$set: {
					districtId,
					categorySlug: canonicalSlug,
					categoryId: canonicalSlug,
					enabled: Boolean(enabled),
				},
			},
			{ upsert: true, new: true },
		);

		logAudit(
			req,
			'CATEGORY_TOGGLE',
			'DistrictCategory',
			record._id,
			`Toggled category ${canonicalSlug} in district ${districtId} to ${enabled}`,
		);

		return res.status(201).json(record);
	} catch (error) {
		console.error('Create district category error:', error);
		return res.status(500).json({ error: 'Unable to save district category configuration' });
	}
}

export async function updateDistrictCategory(req, res) {
	try {
		const { districtId, categoryId } = req.params;
		const { enabled } = req.body;
		const targetDistrictId = districtId;

		if (!targetDistrictId || !isValidId(targetDistrictId)) {
			return res.status(400).json({ error: 'Valid districtId is required' });
		}

		const canonicalSlug = resolveCategorySlug(categoryId);
		if (!canonicalSlug) {
			return res.status(400).json({
				error: `Invalid category: "${categoryId}". Must be one of: ${VALID_CATEGORY_SLUGS.join(', ')}`,
			});
		}

		const isEnabled = enabled === true || enabled === 'true' || enabled === 1;

		const updated = await DistrictCategory.findOneAndUpdate(
			{ districtId: targetDistrictId, categorySlug: canonicalSlug },
			{
				$set: {
					districtId: targetDistrictId,
					categorySlug: canonicalSlug,
					categoryId: canonicalSlug,
					enabled: isEnabled,
				},
			},
			{ upsert: true, new: true, runValidators: true },
		);

		logAudit(
			req,
			'CATEGORY_TOGGLE',
			'DistrictCategory',
			updated._id,
			`Updated category ${canonicalSlug} in district ${targetDistrictId} to ${isEnabled}`,
		);

		return res.json({
			success: true,
			districtId: targetDistrictId,
			categorySlug: canonicalSlug,
			enabled: updated.enabled,
		});
	} catch (error) {
		console.error('Update district category error:', error);
		return res.status(500).json({ error: 'Unable to update district category configuration' });
	}
}

// Aliases for backward-compatible routes
export const createDistrict = createCity;
export const updateDistrict = updateCity;
export const deleteDistrict = deleteCity;
