import { Router } from 'express';
import {
	createAdmin,
	createCategory,
	createCity,
	createContent,
	createDistrict,
	createDistrictCategory,
	createState,
	deleteCity,
	deleteContent,
	deleteDistrict,
	getContent,
	getSummary,
	listAdmins,
	listCities,
	listContent,
	listDistrictCategories,
	listStateDistricts,
	listStates,
	updateAdmin,
	updateCity,
	updateContent,
	updateDistrict,
	updateDistrictCategory,
} from '../controllers/adminController.js';
import { requireAdminToken } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all admin endpoints with requireAdminToken
router.use(requireAdminToken);

// Content CRUD
router.get('/content', listContent);
router.get('/content/:id', getContent);
router.post('/content', createContent);
router.put('/content/:id', updateContent);
router.delete('/content/:id', deleteContent);

// State Management
router.get('/states', listStates);
router.post('/states', createState);
router.get('/states/:stateId/districts', listStateDistricts);
router.get('/states/:stateId/cities', listStateDistricts);

// City Management
router.get('/cities', listCities);
router.post('/cities', createCity);
router.put('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);

// District compatibility aliases
router.post('/districts', createDistrict);
router.put('/districts/:id', updateDistrict);
router.delete('/districts/:id', deleteDistrict);

// Admin Officers Management
router.get('/admins', listAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);

// Dashboard Summary & Section Configs
router.get('/summary', getSummary);
router.get('/district-categories', listDistrictCategories);
router.post('/district-categories', createDistrictCategory);
router.put('/district-categories/:districtId/:categoryId', updateDistrictCategory);
router.post('/categories', createCategory);

export default router;
