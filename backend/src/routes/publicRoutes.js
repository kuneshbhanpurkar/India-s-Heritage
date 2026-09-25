import { Router } from 'express';
import {
	findNearby,
	getCity,
	getCitySectionContent,
	getCitySections,
	getContentByIdOrSlug,
	listCities,
	listContent,
	listDistrictCategories,
	listStates,
} from '../controllers/publicController.js';

const router = Router();

// States
router.get('/states', listStates);
router.get('/states/:stateId/cities', listCities);
router.get('/states/:stateId/districts', listCities);

// Dynamic City & 5-Section Routes
router.get('/cities/:cityId', getCity);
router.get('/cities/:cityId/sections', getCitySections);
router.get('/cities/:cityId/sections/:sectionSlug', getCitySectionContent);
router.get('/cities/:cityId/:sectionSlug', getCitySectionContent);

// Content Details
router.get('/content', listContent);
router.get('/content/:idOrSlug', getContentByIdOrSlug);
router.get('/content/:slug', getContentByIdOrSlug);

// Geospatial "Around Me"
router.get('/nearby', findNearby);

// Legacy compatibility
router.get('/districts/:districtId/categories', listDistrictCategories);

export default router;
