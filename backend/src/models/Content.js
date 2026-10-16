import {
	CONTENT_MODELS,
	ALL_CONTENT_MODELS,
	getModelForSection,
	findContentById,
	findOneAcross,
	findAcross,
	countAcross,
	isSlugTaken,
} from './content/contentRegistry.js';
import HeritagePlace from './content/HeritagePlace.js';

/**
 * Backward compatibility facade.
 * Supports constructor instantiation (`new Content(...)`) and multi-collection lookups.
 */
class ContentModelWrapper {
	constructor(data) {
		const Model = (data?.section && getModelForSection(data.section)) || HeritagePlace;
		return new Model(data);
	}
}

const Content = ContentModelWrapper;

Content.models = CONTENT_MODELS;
Content.allModels = ALL_CONTENT_MODELS;
Content.getModelForSection = getModelForSection;
Content.schema = HeritagePlace.schema;

Content.findById = async function (id, projection, options) {
	const match = await findContentById(id, { projection, ...options });
	return match?.doc || null;
};

Content.findOne = async function (filter, projection, options) {
	const match = await findOneAcross(filter, { projection, ...options });
	return match?.doc || null;
};

Content.find = async function (filter, projection, options) {
	return findAcross(filter, { projection, ...options });
};

Content.countDocuments = async function (filter) {
	return countAcross(filter);
};

Content.create = async function (doc) {
	const Model = (doc?.section && getModelForSection(doc.section)) || HeritagePlace;
	return Model.create(doc);
};

Content.findByIdAndDelete = async function (id) {
	const match = await findContentById(id);
	if (match) return match.Model.findByIdAndDelete(id);
	return null;
};

Content.findByIdAndUpdate = async function (id, update, options) {
	const match = await findContentById(id);
	if (match) return match.Model.findByIdAndUpdate(id, update, options);
	return null;
};

Content.findOneAndUpdate = async function (filter, update, options) {
	const match = await findOneAcross(filter);
	if (match) return match.Model.findOneAndUpdate(filter, update, options);
	return null;
};

Content.deleteMany = async function (filter = {}) {
	return Promise.all(ALL_CONTENT_MODELS.map(({ Model }) => Model.deleteMany(filter)));
};

Content.isSlugTaken = isSlugTaken;

export default Content;
