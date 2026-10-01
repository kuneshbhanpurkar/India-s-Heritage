import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createToken, userProfile } from '../utils/auth.js';

export async function loginAdmin(req, res) {
	try {
		const { email, password } = req.body || {};
		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		const cleanEmail = email.toLowerCase().trim();
		const user = await User.findOne({
			email: cleanEmail,
			active: true,
		}).select('+password');

		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ error: 'Invalid admin credentials' });
		}

		const userObj = user.toObject ? user.toObject() : user;
		// Ensure role has full admin access
		const effectiveRole = user.role === 'user' ? 'admin' : (user.role || 'admin');
		const userForToken = { ...userObj, role: effectiveRole };

		const token = createToken(userForToken);
		const profile = userProfile(userForToken);

		return res.json({
			token,
			admin: {
				id: profile.id,
				_id: profile.id,
				name: profile.name,
				email: profile.email,
				role: user.role || 'editor',
			},
			user: profile,
		});
	} catch (error) {
		console.error('Admin login error:', error);
		return res.status(500).json({ error: 'Internal server error during authentication' });
	}
}
