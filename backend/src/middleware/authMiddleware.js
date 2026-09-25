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

	req.user = result.payload;
	return next();
}

export function requireAdminToken(req, res, next) {
	const result = verifyToken(req);
	if (result.error) return res.status(result.status).json({ error: result.error });

	const role = result.payload.role;
	const adminRoles = ['admin', 'super_admin', 'editor', 'reviewer'];
	if (!adminRoles.includes(role)) {
		return res.status(403).json({ error: 'Forbidden: Admin access required' });
	}

	req.user = result.payload;
	req.admin = result.payload;
	return next();
}
