import jwt from 'jsonwebtoken';

export function createToken(user) {
	if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
	return jwt.sign(
		{ sub: (user._id || user.id).toString(), role: user.role || 'user' },
		process.env.JWT_SECRET,
		{ expiresIn: '30d' },
	);
}

export function userProfile(user) {
	const id = (user._id || user.id).toString();
	return {
		id,
		_id: id,
		name: user.name,
		email: user.email,
		role: user.role || 'user',
		stateId: user.stateId ? user.stateId.toString() : undefined,
		cityId: user.cityId ? user.cityId.toString() : undefined,
		state: user.state || '',
		district: user.district || '',
	};
}

export function slugify(value) {
	if (!value) return '';
	return value
		.toString()
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

export function isValidId(value) {
	return Boolean(value && /^[a-f\d]{24}$/i.test(value.toString()));
}
