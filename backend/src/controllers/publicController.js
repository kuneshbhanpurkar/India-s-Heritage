import State from '../models/State.js';
import City from '../models/City.js';
import Content from '../models/Content.js';
import DistrictCategory from '../models/DistrictCategory.js';
import { CITY_SECTIONS, getSectionBySlug, VALID_SECTION_SLUGS } from '../config/sections.js';
import { isValidId } from '../utils/auth.js';

// Format item to minimal lightweight card
function toCard(item) {
	const fields = item.fields || {};
	const img = item.media?.find((m) => m?.type === 'image' && m?.url)?.url || fields.imageUrl || '';
	const id = item._id.toString();

	return {
		id,
		_id: id,
		title: item.title,
		name: item.title,
		slug: item.slug,
		cityId: item.cityId?.toString(),
		districtId: item.cityId?.toString(),
		section: item.section,
		category: item.category || fields.category || 'Heritage',
		image: img,
		subTitle: item.subtitle || fields.subTitle || '',
		shortDescription: item.shortDescription || fields.description || '',
		rating: Number(fields.rating || 4.8),
		reviewsCount: fields.reviewsCount || '120 reviews',
		builtYear: fields.builtYear || '',
		dynasty: fields.dynasty || '',
		openingHours: fields.openingHours || '9:00 AM - 6:00 PM',
		distanceKm: Number(fields.distanceKm || 0),
		distanceDisplay: fields.distanceDisplay || '',
		isFeatured: Boolean(item.isFeatured),
		latitude: item.latitude !== undefined ? item.latitude : item.location?.coordinates?.[1] || 0,
		longitude: item.longitude !== undefined ? item.longitude : item.location?.coordinates?.[0] || 0,
	};
}

// 1. List Active States
export async function listStates(req, res) {
	try {
		const states = await State.find({ active: { $ne: false } }).sort({ name: 1 }).lean();
		return res.json(states);
	} catch (error) {
		console.error('List states error:', error);
		return res.status(500).json({ error: 'Unable to load states' });
	}
}

// 2. List Cities/Districts by State ID
export async function listCities(req, res) {
	try {
		const { stateId } = req.params;
		if (!isValidId(stateId)) {
			return res.status(400).json({ error: 'Invalid state ID' });
		}

		const cities = await City.find({ stateId, active: { $ne: false } }).sort({ name: 1 }).lean();
		return res.json(cities);
	} catch (error) {
		console.error('List cities error:', error);
		return res.status(500).json({ error: 'Unable to load cities' });
	}
}

// 3. Get City / District Metadata
export async function getCity(req, res) {
	try {
		const { cityId } = req.params;
		let city = null;

		if (isValidId(cityId)) {
			city = await City.findOne({ _id: cityId, active: { $ne: false } }).populate('stateId', 'name code').lean();
		} else {
			city = await City.findOne({ slug: cityId, active: { $ne: false } }).populate('stateId', 'name code').lean();
		}

		if (!city) {
			return res.status(404).json({ error: 'District not found or inactive' });
		}

		return res.json(city);
	} catch (error) {
		console.error('Get city error:', error);
		return res.status(500).json({ error: 'Unable to retrieve district details' });
	}
}

// 4. Get City Section Summaries (Only Enabled Sections)
export async function getCitySections(req, res) {
	try {
		const { cityId } = req.params;
		let city = null;

		if (isValidId(cityId)) {
			city = await City.findOne({ _id: cityId, active: { $ne: false } }).lean();
		} else {
			city = await City.findOne({ slug: cityId, active: { $ne: false } }).lean();
		}

		if (!city) {
			return res.status(404).json({ error: 'District not found' });
		}

		// Query district category overrides
		const customConfigs = await DistrictCategory.find({ districtId: city._id }).lean();
		const configMap = new Map();
		customConfigs.forEach((c) => {
			if (c.categorySlug) configMap.set(c.categorySlug.toLowerCase(), c.enabled);
		});

		// Filter active canonical sections
		const enabledSections = CITY_SECTIONS.filter((section) => {
			const slug = section.slug.toLowerCase();
			if (configMap.has(slug)) return configMap.get(slug);
			if (section.aliases && section.aliases.some((a) => configMap.has(a.toLowerCase()))) {
				const matchedAlias = section.aliases.find((a) => configMap.has(a.toLowerCase()));
				return configMap.get(matchedAlias.toLowerCase());
			}
			return true; // Default is enabled
		});

		// Get content counts for each enabled section
		const sectionCounts = await Content.aggregate([
			{
				$match: {
					cityId: city._id,
					status: 'published',
					active: { $ne: false },
				},
			},
			{
				$group: {
					_id: '$section',
					count: { $sum: 1 },
				},
			},
		]);

		const countMap = new Map();
		sectionCounts.forEach((s) => countMap.set(s._id, s.count));

		const response = enabledSections.map((sec) => ({
			...sec,
			count: countMap.get(sec.slug) || 0,
		}));

		return res.json(response);
	} catch (error) {
		console.error('Get city sections error:', error);
		return res.status(500).json({ error: 'Unable to load district sections' });
	}
}

// 5. Get Content for a City + Section
export async function getCitySectionContent(req, res) {
	try {
		const { cityId, sectionSlug } = req.params;
		const { search, page = 1, limit = 50 } = req.query;

		let city = null;
		if (isValidId(cityId)) {
			city = await City.findOne({ _id: cityId, active: { $ne: false } }).lean();
		} else {
			city = await City.findOne({ slug: cityId, active: { $ne: false } }).lean();
		}

		if (!city) {
			return res.status(404).json({ error: 'District not found' });
		}

		const secMeta = getSectionBySlug(sectionSlug);
		if (!secMeta) {
			return res.status(400).json({ error: `Invalid category section: ${sectionSlug}` });
		}

		// Check if section is enabled for this district
		const customConfig = await DistrictCategory.findOne({
			districtId: city._id,
			$or: [{ categorySlug: secMeta.slug }, { categorySlug: { $in: secMeta.aliases || [] } }],
		}).lean();

		if (customConfig && customConfig.enabled === false) {
			return res.json([]); // Section disabled in this district
		}

		const query = {
			cityId: city._id,
			section: { $in: [secMeta.slug, ...(secMeta.aliases || [])] },
			status: 'published',
			active: { $ne: false },
		};

		if (search && search.trim()) {
			query.title = { $regex: search.trim(), $options: 'i' };
		}

		const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
		const items = await Content.find(query)
			.sort({ isFeatured: -1, createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit, 10))
			.lean();

		return res.json(items.map(toCard));
	} catch (error) {
		console.error('Get city section content error:', error);
		return res.status(500).json({ error: 'Unable to load heritage content' });
	}
}

// 6. Get Single Content Record by ID or Slug
export async function getContentByIdOrSlug(req, res) {
	try {
		const { idOrSlug } = req.params;
		let item = null;

		if (isValidId(idOrSlug)) {
			item = await Content.findOne({ _id: idOrSlug, status: 'published', active: { $ne: false } })
				.populate('cityId', 'name coordinates coverImage')
				.populate('stateId', 'name code')
				.lean();
		}

		if (!item) {
			item = await Content.findOne({ slug: idOrSlug, status: 'published', active: { $ne: false } })
				.populate('cityId', 'name coordinates coverImage')
				.populate('stateId', 'name code')
				.lean();
		}

		if (!item) {
			return res.status(404).json({ error: 'Heritage record not found' });
		}

		return res.json({
			...item,
			_id: item._id.toString(),
			id: item._id.toString(),
			cityName: item.cityId?.name || '',
			stateName: item.stateId?.name || '',
			districtName: item.cityId?.name || '',
			subtitle: item.subtitle || item.fields?.subTitle || '',
			shortDescription: item.shortDescription || item.fields?.description || '',
			fullDescription: item.fullDescription || item.fields?.fullDescription || '',
		});
	} catch (error) {
		console.error('Get content by slug error:', error);
		return res.status(500).json({ error: 'Unable to retrieve record details' });
	}
}

// 7. Find Nearby Heritage Records (GeoSpatial)
export async function findNearby(req, res) {
	try {
		const { lat, lng, radiusKm = 50, limit = 20 } = req.query;
		if (!lat || !lng) {
			return res.status(400).json({ error: 'Latitude and Longitude parameters are required' });
		}

		const latitude = parseFloat(lat);
		const longitude = parseFloat(lng);
		const maxDistanceMeters = parseFloat(radiusKm) * 1000;

		const items = await Content.find({
			status: 'published',
			active: { $ne: false },
			location: {
				$nearSphere: {
					$geometry: {
						type: 'Point',
						coordinates: [longitude, latitude],
					},
					$maxDistance: maxDistanceMeters,
				},
			},
		})
			.populate('cityId', 'name')
			.limit(parseInt(limit, 10))
			.lean();

		return res.json(items.map(toCard));
	} catch (error) {
		console.error('Find nearby error:', error);
		return res.status(500).json({ error: 'Unable to query nearby places' });
	}
}

// 8. List Content (Generic Public Query)
export async function listContent(req, res) {
	try {
		const { districtId, cityId, categoryId, section, isFeatured, limit = 50 } = req.query;
		const query = { status: 'published', active: { $ne: false } };

		const targetCityId = cityId || districtId;
		if (targetCityId && isValidId(targetCityId)) {
			query.cityId = targetCityId;
		}

		if (section && VALID_SECTION_SLUGS.includes(section)) {
			query.section = section;
		}

		if (isFeatured !== undefined) {
			query.isFeatured = isFeatured === 'true' || isFeatured === true;
		}

		const items = await Content.find(query).sort({ isFeatured: -1, createdAt: -1 }).limit(parseInt(limit, 10)).lean();
		return res.json(items.map(toCard));
	} catch (error) {
		console.error('Public list content error:', error);
		return res.status(500).json({ error: 'Unable to load content' });
	}
}

export async function listDistricts(req, res) {
	return listCities(req, res);
}

// 9. Public List District Categories (Respects Enabled Flags)
export async function listDistrictCategories(req, res) {
	try {
		const targetDistrictId = req.params.districtId || req.params.cityId || req.query.districtId || req.query.cityId;
		if (!targetDistrictId || !isValidId(targetDistrictId)) {
			return res.json(CITY_SECTIONS);
		}

		const customConfigs = await DistrictCategory.find({ districtId: targetDistrictId }).lean();
		const configMap = new Map();
		customConfigs.forEach((c) => {
			if (c.categorySlug) configMap.set(c.categorySlug.toLowerCase(), c.enabled);
		});

		const result = CITY_SECTIONS.filter((section) => {
			const slug = section.slug.toLowerCase();
			if (configMap.has(slug)) return configMap.get(slug) !== false;
			if (section.aliases && section.aliases.some((a) => configMap.has(a.toLowerCase()))) {
				const matchedAlias = section.aliases.find((a) => configMap.has(a.toLowerCase()));
				return configMap.get(matchedAlias.toLowerCase()) !== false;
			}
			return true;
		});

		return res.json(result);
	} catch (error) {
		console.error('Public list district categories error:', error);
		return res.status(500).json({ error: 'Unable to retrieve categories' });
	}
}

export async function getContentBySlug(req, res) {
	req.params.idOrSlug = req.params.slug;
	return getContentByIdOrSlug(req, res);
}
