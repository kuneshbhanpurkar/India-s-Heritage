import { buildContentModel } from './baseContentSchema.js';

/** Hidden Places — stored ONLY in the `hidden_places` collection. */
const HiddenPlace = buildContentModel('hidden-places');

export default HiddenPlace;
