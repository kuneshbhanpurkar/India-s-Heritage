import User from '../models/User.js';

export function requireSuperAdmin(req, res, next) {
	const role = req.admin?.role;
	if (role === 'super_admin' || role === 'admin') {
		return next();
	}
	return res.status(403).json({ error: 'Access denied: Super Admin privileges required' });
}

export function requireRole(allowedRoles = []) {
	return (req, res, next) => {
		const role = req.admin?.role;
		if (!role) {
			return res.status(401).json({ error: 'Authentication required' });
		}
		if (role === 'super_admin' || allowedRoles.includes(role)) {
			return next();
		}
		return res.status(403).json({ error: `Access denied: Requires one of [${allowedRoles.join(', ')}]` });
	};
}

export async function checkJurisdictionScope(req, res, next) {
	try {
		const user = await User.findById(req.admin?._id || req.admin?.id).lean();
		if (!user) {
			return res.status(401).json({ error: 'Admin officer account not found' });
		}

		req.adminUser = user;

		// super_admin has national access
		if (user.role === 'super_admin' || user.role === 'admin') {
			return next();
		}

		// State Admin scope check
		if (user.role === 'state_admin' && req.body?.stateId) {
			const allowedStates = [user.stateId?.toString(), ...(user.allowedStateIds || []).map((s) => s.toString())];
			if (!allowedStates.includes(req.body.stateId.toString())) {
				return res.status(403).json({ error: 'Access denied: You are not authorized for this state' });
			}
		}

		// District Admin scope check
		if (user.role === 'district_admin' && (req.body?.cityId || req.body?.districtId)) {
			const targetCityId = (req.body.cityId || req.body.districtId).toString();
			const allowedDistricts = [user.cityId?.toString(), ...(user.allowedDistrictIds || []).map((d) => d.toString())];
			if (!allowedDistricts.includes(targetCityId)) {
				return res.status(403).json({ error: 'Access denied: You are not authorized for this district' });
			}
		}

		next();
	} catch (error) {
		console.error('Scope verification error:', error);
		return res.status(500).json({ error: 'Failed to verify administrative jurisdiction' });
	}
}
