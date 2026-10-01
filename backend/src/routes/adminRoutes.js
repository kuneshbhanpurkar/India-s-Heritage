import { Router } from 'express';
import {
	createAdmin,
	createCity,
	createContent,
	createDistrict,
	createDistrictCategory,
	createState,
	deleteCity,
	deleteContent,
	deleteDistrict,
	deleteState,
	getContent,
	getSummary,
	listAdmins,
	listCities,
	listContent,
	listDistrictCategories,
	listStateDistricts,
	listStates,
	patchContentStatus,
	updateAdmin,
	updateCity,
	updateContent,
	updateDistrict,
	updateDistrictCategory,
	updateState,
} from '../controllers/adminController.js';
import { requireAdminToken } from '../middleware/authMiddleware.js';
import { requireSuperAdmin, requireRole, checkJurisdictionScope } from '../middleware/permissionMiddleware.js';

const router = Router();

// Protect all admin endpoints with requireAdminToken
router.use(requireAdminToken);

// Content CRUD
router.get('/content', listContent);
router.get('/content/:id', getContent);
router.post('/content', checkJurisdictionScope, createContent);
router.patch('/content/:id/status', checkJurisdictionScope, patchContentStatus);
router.put('/content/:id', checkJurisdictionScope, updateContent);
router.patch('/content/:id', checkJurisdictionScope, updateContent);
router.delete('/content/:id', checkJurisdictionScope, deleteContent);

// State Management
router.get('/states', listStates);
router.post('/states', requireSuperAdmin, createState);
router.put('/states/:id', requireSuperAdmin, updateState);
router.patch('/states/:id', requireSuperAdmin, updateState);
router.delete('/states/:id', requireSuperAdmin, deleteState);
router.get('/states/:stateId/districts', listStateDistricts);
router.get('/states/:stateId/cities', listStateDistricts);

// City / District Management
router.get('/cities', listCities);
router.post('/cities', requireRole(['super_admin', 'admin', 'state_admin']), createCity);
router.put('/cities/:id', requireRole(['super_admin', 'admin', 'state_admin']), updateCity);
router.patch('/cities/:id', requireRole(['super_admin', 'admin', 'state_admin']), updateCity);
router.delete('/cities/:id', requireSuperAdmin, deleteCity);

// District compatibility aliases
router.post('/districts', requireRole(['super_admin', 'admin', 'state_admin']), createDistrict);
router.put('/districts/:id', requireRole(['super_admin', 'admin', 'state_admin']), updateDistrict);
router.patch('/districts/:id', requireRole(['super_admin', 'admin', 'state_admin']), updateDistrict);
router.delete('/districts/:id', requireSuperAdmin, deleteDistrict);

// Admin Officers Management
router.get('/admins', listAdmins);
router.post('/admins', requireSuperAdmin, createAdmin);
router.put('/admins/:id', requireSuperAdmin, updateAdmin);
router.patch('/admins/:id', requireSuperAdmin, updateAdmin);

// Dashboard Summary & Section Configs
router.get('/summary', getSummary);
router.get('/district-categories', listDistrictCategories);
router.post('/district-categories', createDistrictCategory);
router.put('/district-categories/:districtId/:categoryId', updateDistrictCategory);
router.patch('/district-categories/:districtId/:categoryId', updateDistrictCategory);

export default router;
