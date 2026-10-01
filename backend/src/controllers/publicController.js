import State from '../models/State.js';
import City from '../models/City.js';
import Content from '../models/Content.js';
import DistrictCategory from '../models/DistrictCategory.js';
import {
	CITY_SECTIONS,
	CATEGORY_DEFINITIONS,
	getSectionBySlug,
	resolveCategorySlug,
	VALID_CATEGORY_SLUGS,
} from '../config/categoryDefinitions.js';
import { isValidId } from '../utils/auth.js';

// Format item to minimal lightweight card — includes real media/video from DB
function toCard(item) {
	const fields = item.fields || {};
	const mediaArr = Array.isArray(item.media) ? item.media : [];
	const img = mediaArr.find((m) => m?.type === 'image' && m?.url)?.url || fields.imageUrl || '';
	const id = item._id.toString();
	const canonicalSection = resolveCategorySlug(item.section) || item.section;

	// Build dynamic visitor tariffs from fields.entryFee
	let visitorTariffs = [];
	if (fields.entryFee) {
		if (typeof fields.entryFee === 'object') {
			if (fields.entryFee.domestic) {
				visitorTariffs.push({ category: 'Indian Citizens', price: `₹${fields.entryFee.domestic}`, highlight: true });
			}
			if (fields.entryFee.student) {
				visitorTariffs.push({ category: 'Students', price: `₹${fields.entryFee.student}` });
			}
			if (fields.entryFee.foreign) {
				visitorTariffs.push({ category: 'Foreign Visitors', price: `₹${fields.entryFee.foreign}` });
			}
		} else if (typeof fields.entryFee === 'string' && fields.entryFee.trim()) {
			const fee = fields.entryFee.trim();
			visitorTariffs.push({ category: 'General Entry', price: fee.startsWith('₹') ? fee : `₹${fee}`, highlight: true });
		}
	}
	if (visitorTariffs.length === 0) {
		visitorTariffs = [{ category: 'General Entry', price: '₹25', highlight: true }];
	}

	// Map all DB media items to frontend MediaItem shape
	const mediaItems = mediaArr.map((m, idx) => ({
		id: `${id}-m${idx}`,
		title: m.title || item.title,
		category: m.type === 'video' ? 'Documentary Films' : m.type === 'audio' ? 'Sound & Light' : 'Archival Photography',
		badge: m.type === 'video' ? 'Video Record' : m.type === 'audio' ? 'Audio Archive' : 'Official Archive',
		duration: '',
		image: m.type === 'image' ? m.url : (img || ''),
		videoUrl: m.type === 'video' ? m.url : (m.url && (m.url.includes('youtu') || m.url.includes('vimeo') || m.url.endsWith('.mp4')) ? m.url : undefined),
		description: m.caption || m.alt || m.title || '',
		meta: m.source || 'Official Heritage Record',
	}));

	return {
		id,
		_id: id,
		title: item.title,
		name: item.title,
		slug: item.slug,
		cityId: item.cityId?.toString(),
		districtId: item.cityId?.toString(),
		section: canonicalSection,
		category: item.category || CATEGORY_DEFINITIONS[canonicalSection]?.title || 'Heritage',
		image: img,
		subTitle: item.subtitle || fields.subTitle || '',
		shortDescription: item.shortDescription || fields.description || '',
		fullDescription: item.fullDescription || fields.fullDescription || '',
		rating: Number(fields.rating || 4.8),
		reviewsCount: fields.reviewsCount || '120 reviews',
		builtYear: fields.builtYear || fields.era || '',
		dynasty: fields.dynasty || fields.builtBy || '',
		openingHours: fields.timings || fields.openingHours || '9:00 AM - 6:00 PM',
		visitorTariffs,
		distanceKm: Number(fields.distanceKm || 0),
		distanceDisplay: fields.distanceDisplay || '',
		isFeatured: Boolean(item.isFeatured),
		latitude: item.latitude !== undefined ? item.latitude : item.location?.coordinates?.[1] || 0,
		longitude: item.longitude !== undefined ? item.longitude : item.location?.coordinates?.[0] || 0,
		mediaItems,
		fields,
		documents: Array.isArray(item.documents) ? item.documents : [],
		sources: Array.isArray(item.sources) ? item.sources : [],
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
			const canonical = resolveCategorySlug(c.categorySlug);
			if (canonical) {
				configMap.set(canonical, c.enabled);
			}
		});

		// Filter active canonical sections
		const enabledSections = CITY_SECTIONS.filter((section) => {
			const slug = section.slug;
			if (configMap.has(slug)) return configMap.get(slug) !== false;
			return true; // Default is enabled
		});

		// Get content counts + preview items per enabled section
		const sectionResults = await Promise.all(
			enabledSections.map(async (sec) => {
				const sectionQuery = {
					cityId: city._id,
					section: { $in: [sec.slug, ...(sec.aliases || [])] },
					status: 'published',
					active: { $ne: false },
				};
				const [total, previewItems] = await Promise.all([
					Content.countDocuments(sectionQuery),
					Content.find(sectionQuery)
						.sort({ isFeatured: -1, createdAt: -1 })
						.limit(4)
						.lean(),
				]);
				return {
					...sec,
					totalCount: total,
					items: previewItems.map(toCard),
				};
			})
		);

		return res.json({ city: { id: city._id.toString(), name: city.name }, sections: sectionResults });
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
			categorySlug: secMeta.slug,
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

		const pageNum = Math.max(1, parseInt(page, 10));
		const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
		const skip = (pageNum - 1) * limitNum;
		const [total, items] = await Promise.all([
			Content.countDocuments(query),
			Content.find(query)
				.sort({ isFeatured: -1, createdAt: -1 })
				.skip(skip)
				.limit(limitNum)
				.lean(),
		]);

		return res.json({
			city: { id: city._id.toString(), name: city.name },
			section: { slug: secMeta.slug, title: secMeta.title, type: secMeta.type, description: secMeta.description },
			pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
			items: items.map(toCard),
		});
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

		const canonicalSection = resolveCategorySlug(item.section) || item.section;
		const card = toCard(item);

		return res.json({
			...card,
			...item,
			_id: item._id.toString(),
			id: item._id.toString(),
			name: item.title,
			section: canonicalSection,
			category: item.category || CATEGORY_DEFINITIONS[canonicalSection]?.title || 'Heritage',
			cityName: item.cityId?.name || '',
			stateName: item.stateId?.name || '',
			districtName: item.cityId?.name || '',
			subtitle: item.subtitle || item.fields?.subTitle || '',
			shortDescription: item.shortDescription || item.fields?.description || '',
			fullDescription: item.fullDescription || item.fields?.fullDescription || '',
			mediaItems: card.mediaItems,
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

		const targetSection = section || categoryId;
		if (targetSection) {
			const canonical = resolveCategorySlug(targetSection);
			if (canonical) {
				const definition = CATEGORY_DEFINITIONS[canonical];
				query.section = { $in: [canonical, ...(definition?.aliases || [])] };
			}
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
			const canonical = resolveCategorySlug(c.categorySlug);
			if (canonical) {
				configMap.set(canonical, c.enabled);
			}
		});

		const result = CITY_SECTIONS.filter((section) => {
			const slug = section.slug;
			if (configMap.has(slug)) return configMap.get(slug) !== false;
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
