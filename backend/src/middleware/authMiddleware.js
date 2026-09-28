import jwt from 'jsonwebtoken';

function verifyToken(req) {
	const authorization = req.get('authorization') || req.headers.authorization;
	if (!authorization || !authorization.startsWith('Bearer ')) {
		return { error: 'Unauthorized', status: 401 };
	}
	if (!process.env.JWT_SECRET) {
		return { error: 'JWT_SECRET is not configured', status: 500 };
	}

	const token = authorization.slice('Bearer '.length).trim();
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		return { payload };
	} catch (err) {
		return { error: 'Invalid or expired token', status: 401 };
	}
}

export function requireUserToken(req, res, next) {
	const result = verifyToken(req);
	if (result.error) return res.status(result.status).json({ error: result.error });

	const userId = result.payload.sub || result.payload.id || result.payload._id;
	req.user = {
		...result.payload,
		id: userId,
		_id: userId,
	};
	return next();
}

export function requireAdminToken(req, res, next) {
	const result = verifyToken(req);
	if (result.error) return res.status(result.status).json({ error: result.error });

	const role = result.payload.role;
	const adminRoles = ['admin', 'super_admin', 'editor', 'reviewer', 'state_admin', 'district_admin'];
	if (!adminRoles.includes(role)) {
		return res.status(403).json({ error: 'Forbidden: Admin access required' });
	}

	const adminId = result.payload.sub || result.payload.id || result.payload._id;
	const adminData = {
		...result.payload,
		id: adminId,
		_id: adminId,
	};

	req.user = adminData;
	req.admin = adminData;
	return next();
}

