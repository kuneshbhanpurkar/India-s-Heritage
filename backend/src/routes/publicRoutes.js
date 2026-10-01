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
	listDistricts,
	listStates,
} from '../controllers/publicController.js';

const router = Router();

// States
router.get('/states', listStates);
router.get('/states/:stateId/cities', listCities);
router.get('/states/:stateId/districts', listDistricts);

// Dynamic City / District & Section Routes
router.get('/cities/:cityId', getCity);
router.get('/districts/:cityId', getCity);
router.get('/cities/:cityId/sections', getCitySections);
router.get('/districts/:cityId/sections', getCitySections);
router.get('/cities/:cityId/dashboard', getCitySections);
router.get('/districts/:cityId/dashboard', getCitySections);
router.get('/cities/:cityId/categories', listDistrictCategories);
router.get('/districts/:districtId/categories', listDistrictCategories);

// Category Content for District
router.get('/cities/:cityId/sections/:sectionSlug', getCitySectionContent);
router.get('/districts/:cityId/sections/:sectionSlug', getCitySectionContent);
router.get('/cities/:cityId/:sectionSlug', getCitySectionContent);
router.get('/districts/:cityId/:sectionSlug', getCitySectionContent);

// Content Details
router.get('/content', listContent);
router.get('/content/:idOrSlug', getContentByIdOrSlug);
router.get('/content/:slug', getContentByIdOrSlug);

// Geospatial "Around Me"
router.get('/nearby', findNearby);

export default router;
