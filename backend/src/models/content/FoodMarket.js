import { buildContentModel } from './baseContentSchema.js';

/** Food & Markets — stored ONLY in the `food_markets` collection. */
const FoodMarket = buildContentModel('food-markets');

export default FoodMarket;
