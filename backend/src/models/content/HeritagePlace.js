import { buildContentModel } from './baseContentSchema.js';

/** Heritage & Places — stored ONLY in the `heritage_places` collection. */
const HeritagePlace = buildContentModel('heritage-places');

export default HeritagePlace;
