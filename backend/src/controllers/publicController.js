import State from '../models/State.js';
import City from '../models/City.js';
import DistrictCategory from '../models/DistrictCategory.js';
import {
	CITY_SECTIONS,
	CATEGORY_DEFINITIONS,
	getSectionBySlug,
	resolveCategorySlug,
	VALID_CATEGORY_SLUGS,
} from '../config/categoryDefinitions.js';
import {
	getModelForSection,
	findContentById,
	findOneAcross,
	findAcross,
	ALL_CONTENT_MODELS,
} from '../models/content/contentRegistry.js';
import { isValidId } from '../utils/auth.js';

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

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
		rating: Number(fields.rating) || 0,
		reviewsCount: fields.reviewsCount || '',
		builtYear: fields.builtYear || fields.era || '',
		dynasty: fields.dynasty || fields.builtBy || '',
		openingHours: fields.timings || fields.openingHours || '',
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

// 4. Get City Section Summaries (Only Enabled Sections, querying distinct category collections)
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
			return true;
		});

		// Get content counts + preview items per enabled section from its isolated collection
		const sectionResults = await Promise.all(
			enabledSections.map(async (sec) => {
				const Model = getModelForSection(sec.slug);
				if (!Model) {
					return { ...sec, totalCount: 0, items: [] };
				}
				const sectionQuery = {
					cityId: city._id,
					status: 'published',
					active: { $ne: false },
				};
				const [total, previewItems] = await Promise.all([
					Model.countDocuments(sectionQuery),
					Model.find(sectionQuery)
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

		return res.json({
			city: {
				id: city._id.toString(),
				name: city.name,
				slug: city.slug,
				coverImage: city.coverImage || '',
				description: city.description || '',
				coordinates: city.coordinates || { lat: 0, lng: 0 },
			},
			sections: sectionResults,
		});
	} catch (error) {
		console.error('Get city sections error:', error);
		return res.status(500).json({ error: 'Unable to load district sections' });
	}
}

// 5. Get Content for a City + Section (Isolated Collection Query)
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

		const Model = getModelForSection(secMeta.slug);
		if (!Model) {
			return res.status(400).json({ error: `No model mapped for category: ${secMeta.slug}` });
		}

		// Check if section is enabled for this district
		const customConfig = await DistrictCategory.findOne({
			districtId: city._id,
			categorySlug: secMeta.slug,
		}).lean();

		const pageNum = Math.max(1, parseInt(page, 10));
		const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

		if (customConfig && customConfig.enabled === false) {
			return res.json({
				city: { id: city._id.toString(), name: city.name },
				section: { slug: secMeta.slug, title: secMeta.title, type: secMeta.type, description: secMeta.description },
				pagination: { page: 1, limit: limitNum, total: 0, totalPages: 0 },
				items: [],
			});
		}

		const query = {
			cityId: city._id,
			status: 'published',
			active: { $ne: false },
		};

		if (search && search.trim()) {
			query.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
		}

		const skip = (pageNum - 1) * limitNum;
		const [total, items] = await Promise.all([
			Model.countDocuments(query),
			Model.find(query)
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

// 6. Get Single Content Record by ID or Slug across collections
export async function getContentByIdOrSlug(req, res) {
	try {
		const { idOrSlug } = req.params;
		let match = null;

		if (isValidId(idOrSlug)) {
			match = await findContentById(idOrSlug, {
				populate: [
					{ path: 'cityId', select: 'name coordinates coverImage' },
					{ path: 'stateId', select: 'name code' },
				],
			});
		}

		if (!match) {
			match = await findOneAcross(
				{ slug: idOrSlug, status: 'published', active: { $ne: false } },
				{
					populate: [
						{ path: 'cityId', select: 'name coordinates coverImage' },
						{ path: 'stateId', select: 'name code' },
					],
				}
			);
		}

		if (!match || !match.doc) {
			return res.status(404).json({ error: 'Heritage record not found' });
		}

		const item = match.doc;
		const canonicalSection = resolveCategorySlug(item.section) || item.section;
		const card = toCard(item);

		return res.json({
			...item,
			...card,
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

// 7. Find Nearby Heritage Records (GeoSpatial across collections, fixes km param)
export async function findNearby(req, res) {
	try {
		const { lat, lng, km, radiusKm = 50, limit = 20 } = req.query;
		if (!lat || !lng) {
			return res.status(400).json({ error: 'Latitude and Longitude parameters are required' });
		}

		const effectiveRadiusKm = parseFloat(km || radiusKm || 50);
		const latitude = parseFloat(lat);
		const longitude = parseFloat(lng);
		const maxDistanceMeters = effectiveRadiusKm * 1000;

		const geoQuery = {
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
		};

		// Query nearby across all category collections in parallel
		const resultsPerModel = await Promise.all(
			ALL_CONTENT_MODELS.map(({ Model }) =>
				Model.find(geoQuery)
					.populate('cityId', 'name')
					.limit(parseInt(limit, 10))
					.lean()
			)
		);

		const allNearby = resultsPerModel.flat().slice(0, parseInt(limit, 10));
		return res.json(allNearby.map(toCard));
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

		if (isFeatured !== undefined) {
			query.isFeatured = isFeatured === 'true' || isFeatured === true;
		}

		const targetSection = section || categoryId;
		const items = await findAcross(query, {
			section: targetSection,
			sort: { isFeatured: -1, createdAt: -1 },
			limit: parseInt(limit, 10),
		});

		return res.json(items.map(toCard));
	} catch (error) {
		console.error('Public list content error:', error);
		return res.status(500).json({ error: 'Unable to load content' });
	}
}

export async function listDistricts(req, res) {
	return listCities(req, res);
}

// 9. Public List District Categories
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
