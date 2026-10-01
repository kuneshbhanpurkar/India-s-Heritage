import User from '../models/User.js';
import Content from '../models/Content.js';
import City from '../models/City.js';
import { isValidId } from '../utils/auth.js';

export function requireSuperAdmin(req, res, next) {
	// Relaxed for development: allow all authenticated admin users
	if (req.admin) {
		return next();
	}
	return res.status(401).json({ error: 'Authentication required' });
}

export function requireRole(allowedRoles = []) {
	return (req, res, next) => {
		// Relaxed for development: allow all authenticated admin users
		if (req.admin) {
			return next();
		}
		return res.status(401).json({ error: 'Authentication required' });
	};
}

export async function checkJurisdictionScope(req, res, next) {
	try {
		const adminId = req.admin?._id || req.admin?.id;
		if (!adminId || !isValidId(adminId)) {
			return res.status(401).json({ error: 'Authentication required' });
		}

		const user = await User.findById(adminId).lean();
		if (user) {
			req.adminUser = user;
		}

		if (req.params.id && isValidId(req.params.id)) {
			const targetContent = await Content.findById(req.params.id).lean();
			if (targetContent) {
				req.targetContent = targetContent;
			}
		}

		// Relaxed jurisdiction filter: allow any admin to create and update records everywhere
		return next();
	} catch (error) {
		console.error('Scope verification error:', error);
		return next();
	}
}
