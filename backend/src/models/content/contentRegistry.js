import HeritagePlace from './HeritagePlace.js';
import HiddenPlace from './HiddenPlace.js';
import CultureTradition from './CultureTradition.js';
import ArtFolk from './ArtFolk.js';
import FoodMarket from './FoodMarket.js';
import { resolveCategorySlug } from '../../config/categoryDefinitions.js';

/**
 * Content Registry — the ONLY place controllers/scripts should use to reach heritage content.
 *
 *   category slug          → Model             → MongoDB collection
 *   heritage-places        → HeritagePlace     → heritage_places
 *   hidden-places          → HiddenPlace       → hidden_places
 *   culture-traditions     → CultureTradition  → culture_traditions
 *   arts-folk              → ArtFolk           → arts_folk
 *   food-markets           → FoodMarket        → food_markets
 */
export const CONTENT_MODELS = Object.freeze({
	'heritage-places': HeritagePlace,
	'hidden-places': HiddenPlace,
	'culture-traditions': CultureTradition,
	'arts-folk': ArtFolk,
	'food-markets': FoodMarket,
});

export const ALL_CONTENT_MODELS = Object.entries(CONTENT_MODELS).map(([slug, Model]) => ({ slug, Model }));

/** Resolve a (possibly legacy/alias) section slug to its Model. Returns null if unknown. */
export function getModelForSection(rawSection) {
	const slug = resolveCategorySlug(rawSection);
	return slug ? CONTENT_MODELS[slug] : null;
}

/** Restrict the list of models to one section if a valid hint is given, otherwise all. */
function targetModels(section) {
	if (section) {
		const slug = resolveCategorySlug(section);
		if (slug) return [{ slug, Model: CONTENT_MODELS[slug] }];
	}
	return ALL_CONTENT_MODELS;
}

function applyQueryOptions(query, { populate = [], projection, lean = true } = {}) {
	if (projection) query.select(projection);
	for (const p of populate) query.populate(p);
	if (lean) query.lean();
	return query;
}

/**
 * Find the first document matching `filter` across category collections (parallel lookups).
 * @returns {Promise<{ doc: any, Model: import('mongoose').Model<any>, slug: string } | null>}
 */
export async function findOneAcross(filter, options = {}) {
	const models = targetModels(options.section);
	const results = await Promise.all(
		models.map(({ Model }) => applyQueryOptions(Model.findOne(filter), options).exec()),
	);
	const idx = results.findIndex(Boolean);
	if (idx === -1) return null;
	return { doc: results[idx], Model: models[idx].Model, slug: models[idx].slug };
}

/** Locate a content record by _id in whichever category collection holds it. */
export function findContentById(id, options = {}) {
	return findOneAcross({ _id: id }, options);
}

/** Count documents matching `filter` across category collections. */
export async function countAcross(filter = {}, { section } = {}) {
	const counts = await Promise.all(targetModels(section).map(({ Model }) => Model.countDocuments(filter)));
	return counts.reduce((a, b) => a + b, 0);
}

function buildComparator(sort = {}) {
	const entries = Object.entries(sort);
	return (a, b) => {
		for (const [key, dir] of entries) {
			const av = a[key] instanceof Date ? a[key].getTime() : a[key] ?? 0;
			const bv = b[key] instanceof Date ? b[key].getTime() : b[key] ?? 0;
			const av2 = typeof av === 'boolean' ? Number(av) : av;
			const bv2 = typeof bv === 'boolean' ? Number(bv) : bv;
			if (av2 < bv2) return dir < 0 ? 1 : -1;
			if (av2 > bv2) return dir < 0 ? -1 : 1;
		}
		return 0;
	};
}

/**
 * Paginated find across category collections. Each collection returns its top (skip+limit)
 * docs, results are merged with the same sort, then the requested page is sliced.
 */
export async function findAcross(filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 50, section, ...rest } = {}) {
	const models = targetModels(section);
	const window = skip + limit;
	const perModel = await Promise.all(
		models.map(({ Model }) => applyQueryOptions(Model.find(filter).sort(sort).limit(window), rest).exec()),
	);
	return perModel.flat().sort(buildComparator(sort)).slice(skip, skip + limit);
}

/** True if any category collection already uses this slug (optionally ignoring one _id). */
export async function isSlugTaken(slug, excludeId) {
	const filter = excludeId ? { slug, _id: { $ne: excludeId } } : { slug };
	const found = await Promise.all(ALL_CONTENT_MODELS.map(({ Model }) => Model.exists(filter)));
	return found.some(Boolean);
}
