import User from '../models/User.js';
import City from '../models/City.js';
import { findContentById } from '../models/content/contentRegistry.js';
import { isValidId } from '../utils/auth.js';

export function requireSuperAdmin(req, res, next) {
	if (!req.admin) {
		return res.status(401).json({ error: 'Authentication required' });
	}
	if (req.admin.role !== 'super_admin') {
		return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
	}
	return next();
}

export function requireRole(allowedRoles = []) {
	return (req, res, next) => {
		if (!req.admin) {
			return res.status(401).json({ error: 'Authentication required' });
		}
		if (!allowedRoles.includes(req.admin.role)) {
			return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
		}
		return next();
	};
}

export async function checkJurisdictionScope(req, res, next) {
	try {
		const adminId = req.admin?._id || req.admin?.id;
		if (!adminId || !isValidId(adminId)) {
			return res.status(401).json({ error: 'Authentication required' });
		}

		const user = await User.findById(adminId).lean();
		if (!user) {
			return res.status(401).json({ error: 'User not found' });
		}
		req.adminUser = user;

		const role = user.role || req.admin.role;

		// super_admin has unlimited scope
		if (role === 'super_admin' || role === 'admin') {
			return next();
		}

		// Resolve target districtId from params/body/query
		let targetDistrictId = req.body?.districtId || req.body?.cityId || req.query?.districtId || req.query?.cityId;
		let targetStateId = req.body?.stateId || req.query?.stateId;

		if (req.params.id && isValidId(req.params.id)) {
			const match = await findContentById(req.params.id);
			if (match && match.doc) {
				req.targetContent = match.doc;
				req.targetContentModel = match.Model;
				targetDistrictId = targetDistrictId || match.doc.cityId?.toString() || match.doc.districtId?.toString();
				targetStateId = targetStateId || match.doc.stateId?.toString();
			}
		}

		if (role === 'district_admin') {
			const adminDistrictId = (user.cityId || user.districtId)?._id?.toString() || (user.cityId || user.districtId)?.toString();
			if (targetDistrictId && adminDistrictId && targetDistrictId.toString() !== adminDistrictId) {
				return res.status(403).json({ error: 'Forbidden: District Admin cannot manage outside assigned district' });
			}
			return next();
		}

		if (role === 'state_admin') {
			const adminStateId = user.stateId?._id?.toString() || user.stateId?.toString();
			if (targetStateId && adminStateId && targetStateId.toString() !== adminStateId) {
				return res.status(403).json({ error: 'Forbidden: State Admin cannot manage outside assigned state' });
			}
			if (targetDistrictId && isValidId(targetDistrictId)) {
				const city = await City.findById(targetDistrictId).lean();
				if (city && city.stateId && adminStateId && city.stateId.toString() !== adminStateId) {
					return res.status(403).json({ error: 'Forbidden: State Admin cannot manage district in another state' });
				}
			}
			return next();
		}

		return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
	} catch (error) {
		console.error('Scope verification error:', error);
		return res.status(500).json({ error: 'Authorization verification failed' });
	}
}
