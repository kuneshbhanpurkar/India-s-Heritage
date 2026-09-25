import State from '../models/State.js';
import City from '../models/City.js';
import Content from '../models/Content.js';
import { CITY_SECTIONS, getSectionBySlug, VALID_SECTION_SLUGS } from '../config/sections.js';
import { isValidId } from '../utils/auth.js';

// Format item to minimal lightweight card
function toCard(item) {
	const fields = item.fields || {};
	const img = item.media?.find((m) => m?.type === 'image')?.url || fields.imageUrl || '';
	const id = item._id.toString();

	return {
		id,
		_id: id,
		title: item.title,
		name: item.title,
		slug: item.slug,
		cityId: item.cityId?.toString(),
		section: item.section,
		image: img,
		subTitle: fields.subTitle || '',
		category: fields.category || item.category || 'Heritage',
		rating: Number(fields.rating || 0),
		reviewsCount: fields.reviewsCount || '0 reviews',
		builtYear: fields.builtYear || '',
		dynasty: fields.dynasty || '',
		openingHours: fields.openingHours || '',
		distanceKm: Number(fields.distanceKm || 0),
		distanceDisplay: fields.distanceDisplay || '',
		isFeatured: Boolean(item.isFeatured),
		latitude: item.latitude || item.location?.coordinates?.[1] || 0,
		longitude: item.longitude || item.location?.coordinates?.[0] || 0,
	};
}

// 1. List States
export async function listStates(req, res) {
	try {
		const states = await State.find({ active: true }).sort({ name: 1 }).lean();
		return res.json(states);
	} catch (error) {
		console.error('List states error:', error);
		return res.status(500).json({ error: 'Unable to load states' });
	}
}

// 2. List Cities by State ID
export async function listCities(req, res) {
	try {
		const { stateId } = req.params;
		if (!isValidId(stateId)) {
			return res.status(400).json({ error: 'Invalid state ID' });
		}

		const cities = await City.find({ stateId, active: true }).sort({ name: 1 }).lean();
		return res.json(cities);
	} catch (error) {
		console.error('List cities error:', error);
		return res.status(500).json({ error: 'Unable to load cities' });
	}
}

// 3. Get City Metadata
export async function getCity(req, res) {
	try {
		const { cityId } = req.params;
		let city = null;

		if (isValidId(cityId)) {
			city = await City.findOne({ _id: cityId, active: true }).populate('stateId', 'name code').lean();
		} else {
			city = await City.findOne({ slug: cityId, active: true }).populate('stateId', 'name code').lean();
		}

		if (!city) {
			return res.status(404).json({ error: 'City not found or inactive' });
		}

		return res.json(city);
	} catch (error) {
		console.error('Get city error:', error);
		return res.status(500).json({ error: 'Unable to retrieve city details' });
	}
}

// 4. Get City Section Summaries (City Overview for 5 Sections)
export async function getCitySections(req, res) {
	try {
		const { cityId } = req.params;
		let city = null;

		if (isValidId(cityId)) {
			city = await City.findOne({ _id: cityId, active: true }).lean();
		} else {
			city = await City.findOne({ slug: cityId, active: true }).lean();
		}

		if (!city) {
			return res.status(404).json({ error: 'City not found' });
		}

		const summaries = await Promise.all(
			CITY_SECTIONS.map(async (section) => {
				const [totalCount, topItems] = await Promise.all([
					Content.countDocuments({ cityId: city._id, section: section.slug, status: 'published' }),
					Content.find({ cityId: city._id, section: section.slug, status: 'published' })
						.sort({ isFeatured: -1, createdAt: -1 })
						.limit(4)
						.lean(),
				]);

				return {
					...section,
					totalCount,
					items: topItems.map(toCard),
				};
			}),
		);

		return res.json({
			city: {
				id: city._id.toString(),
				name: city.name,
				slug: city.slug,
				coordinates: city.coordinates,
				description: city.description,
			},
			sections: summaries,
		});
	} catch (error) {
		console.error('Get city sections error:', error);
		return res.status(500).json({ error: 'Unable to retrieve city sections' });
	}
}

// 5. Get City Section Content (Paginated cards for a single section)
export async function getCitySectionContent(req, res) {
	try {
		const { cityId, sectionSlug } = req.params;
		const page = Math.max(1, parseInt(req.query.page, 10) || 1);
		const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
		const skip = (page - 1) * limit;

		let city = null;
		if (isValidId(cityId)) {
			city = await City.findOne({ _id: cityId, active: true }).lean();
		} else {
			city = await City.findOne({ slug: cityId, active: true }).lean();
		}

		if (!city) {
			return res.status(404).json({ error: 'City not found' });
		}

		if (!VALID_SECTION_SLUGS.includes(sectionSlug)) {
			return res.status(400).json({ error: `Invalid section: ${sectionSlug}. Valid sections are: ${VALID_SECTION_SLUGS.join(', ')}` });
		}

		const sectionMeta = getSectionBySlug(sectionSlug);
		const filter = { cityId: city._id, section: sectionSlug, status: 'published' };

		const [total, items] = await Promise.all([
			Content.countDocuments(filter),
			Content.find(filter)
				.sort({ isFeatured: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
		]);

		return res.json({
			city: {
				id: city._id.toString(),
				name: city.name,
				slug: city.slug,
			},
			section: sectionMeta,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit) || 1,
			},
			items: items.map(toCard),
		});
	} catch (error) {
		console.error('Get city section content error:', error);
		return res.status(500).json({ error: 'Unable to load section items' });
	}
}

// 6. Get Content Details by ID or Slug
export async function getContentByIdOrSlug(req, res) {
	try {
		const { idOrSlug } = req.params;
		let item = null;

		if (isValidId(idOrSlug)) {
			item = await Content.findOne({ _id: idOrSlug, status: 'published' })
				.populate('cityId', 'name slug coordinates')
				.populate('stateId', 'name code')
				.lean();
		} else {
			item = await Content.findOne({ slug: idOrSlug, status: 'published' })
				.populate('cityId', 'name slug coordinates')
				.populate('stateId', 'name code')
				.lean();
		}

		if (!item) {
			return res.status(404).json({ error: 'Heritage place not found or not published' });
		}

		const fields = item.fields || {};
		const image = item.media?.find((m) => m?.type === 'image')?.url || fields.imageUrl || '';
		const city = item.cityId || {};
		const coordinates = item.location?.coordinates?.length === 2
			? { lng: item.location.coordinates[0], lat: item.location.coordinates[1] }
			: city.coordinates || { lat: 0, lng: 0 };

		return res.json({
			id: item._id.toString(),
			_id: item._id.toString(),
			title: item.title,
			name: item.title,
			slug: item.slug,
			section: item.section,
			cityId: city._id?.toString() || '',
			cityName: city.name || '',
			stateName: item.stateId?.name || '',
			image,
			subTitle: fields.subTitle || '',
			description: fields.description || '',
			builtYear: fields.builtYear || '',
			dynasty: fields.dynasty || '',
			openingHours: fields.openingHours || '10:00 AM - 05:00 PM',
			rating: Number(fields.rating || 0),
			reviewsCount: fields.reviewsCount || '0 reviews',
			distanceKm: Number(fields.distanceKm || 0),
			distanceDisplay: fields.distanceDisplay || city.name || '',
			visitorTariffs: Array.isArray(fields.visitorTariffs) ? fields.visitorTariffs : [],
			transitOptions: Array.isArray(fields.transitOptions) ? fields.transitOptions : [],
			media: item.media || [],
			coordinates,
			isFeatured: Boolean(item.isFeatured),
			status: item.status,
		});
	} catch (error) {
		console.error('Get content details error:', error);
		return res.status(500).json({ error: 'Unable to retrieve content details' });
	}
}

// 7. Geospatial "Around Me" Nearby Search
export async function findNearby(req, res) {
	try {
		const lat = parseFloat(req.query.lat);
		const lng = parseFloat(req.query.lng);
		const km = Math.min(100, Math.max(1, parseFloat(req.query.km) || 25));

		if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			return res.status(400).json({ error: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required' });
		}

		const items = await Content.find({
			status: 'published',
			location: {
				$near: {
					$geometry: { type: 'Point', coordinates: [lng, lat] },
					$maxDistance: km * 1000,
				},
			},
		})
			.limit(20)
			.populate('cityId', 'name')
			.lean();

		return res.json(
			items.map((item) => {
				const card = toCard(item);
				// Calculate approximate distance if needed
				return {
					...card,
					cityName: item.cityId?.name || '',
				};
			}),
		);
	} catch (error) {
		console.error('Nearby search error:', error);
		return res.status(500).json({ error: 'Unable to perform nearby geospatial search' });
	}
}

// 8. Backward-compatible content endpoint for legacy frontend calls
export async function listContent(req, res) {
	try {
		const { districtId, cityId, categoryId, section } = req.query;
		const query = { status: 'published' };

		const targetCityId = cityId || districtId;
		if (targetCityId && isValidId(targetCityId)) {
			query.cityId = targetCityId;
		}
		if (section && VALID_SECTION_SLUGS.includes(section)) {
			query.section = section;
		}

		const items = await Content.find(query).sort({ isFeatured: -1, createdAt: -1 }).limit(50).lean();
		return res.json(items.map(toCard));
	} catch (error) {
		console.error('List content error:', error);
		return res.status(500).json({ error: 'Unable to load content' });
	}
}

export async function listDistricts(req, res) {
	return listCities(req, res);
}

export async function listDistrictCategories(req, res) {
	return res.json(CITY_SECTIONS);
}

export async function getContentBySlug(req, res) {
	req.params.idOrSlug = req.params.slug;
	return getContentByIdOrSlug(req, res);
}
