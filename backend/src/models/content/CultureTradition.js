import { buildContentModel } from './baseContentSchema.js';

/** Culture & Traditions — stored ONLY in the `culture_traditions` collection. */
const CultureTradition = buildContentModel('culture-traditions');

export default CultureTradition;
