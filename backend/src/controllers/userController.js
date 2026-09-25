import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import City from '../models/City.js';
import State from '../models/State.js';
import { createToken, isValidId, userProfile } from '../utils/auth.js';

export async function loginUser(req, res) {
	try {
		const { email, password } = req.body || {};
		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		const cleanEmail = email.toLowerCase().trim();
		const user = await User.findOne({ email: cleanEmail, active: true }).select('+password');

		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = createToken(user);
		return res.json({ token, user: userProfile(user) });
	} catch (error) {
		console.error('User login error:', error);
		return res.status(500).json({ error: 'Unable to sign in' });
	}
}

export async function registerUser(req, res) {
	try {
		const { name, email, password, state, district, stateId, cityId } = req.body || {};

		if (!name || name.trim().length < 2) {
			return res.status(400).json({ error: 'Name must be at least 2 characters' });
		}
		if (!email || !email.includes('@')) {
			return res.status(400).json({ error: 'A valid email address is required' });
		}
		if (!password || password.length < 8) {
			return res.status(400).json({ error: 'Password must be at least 8 characters' });
		}

		const cleanEmail = email.toLowerCase().trim();
		const existing = await User.findOne({ email: cleanEmail });
		if (existing) {
			return res.status(400).json({ error: 'An account with this email already exists' });
		}

		// Resolve State and City
		let resolvedState = null;
		let resolvedCity = null;

		if (stateId && isValidId(stateId)) {
			resolvedState = await State.findById(stateId);
		} else if (state) {
			resolvedState = await State.findOne({
				$or: [{ name: state.trim() }, { code: state.trim().toUpperCase() }],
			});
		}

		if (cityId && isValidId(cityId)) {
			resolvedCity = await City.findById(cityId);
		} else if (district) {
			resolvedCity = await City.findOne({
				name: district.trim(),
				...(resolvedState ? { stateId: resolvedState._id } : {}),
			});
		}

		const hashedPassword = await bcrypt.hash(password, 12);
		const user = await User.create({
			name: name.trim(),
			email: cleanEmail,
			password: hashedPassword,
			role: 'user',
			stateId: resolvedState?._id,
			cityId: resolvedCity?._id,
			state: resolvedState?.name || state || '',
			district: resolvedCity?.name || district || '',
			active: true,
		});

		const token = createToken(user);
		return res.status(201).json({ token, user: userProfile(user) });
	} catch (error) {
		console.error('Registration error:', error);
		return res.status(500).json({ error: 'Unable to create account' });
	}
}

export async function getCurrentUser(req, res) {
	try {
		const user = await User.findById(req.user.sub);
		if (!user || !user.active) {
			return res.status(404).json({ error: 'User account not found' });
		}
		return res.json(userProfile(user));
	} catch (error) {
		console.error('Get user profile error:', error);
		return res.status(500).json({ error: 'Unable to retrieve user profile' });
	}
}

export async function updateCurrentUser(req, res) {
	try {
		const { name, stateId, cityId } = req.body || {};
		const update = {};

		if (name && name.trim().length >= 2) update.name = name.trim();

		if (stateId && isValidId(stateId)) {
			const st = await State.findById(stateId);
			if (st) {
				update.stateId = st._id;
				update.state = st.name;
			}
		}

		if (cityId && isValidId(cityId)) {
			const ct = await City.findById(cityId);
			if (ct) {
				update.cityId = ct._id;
				update.district = ct.name;
			}
		}

		const user = await User.findByIdAndUpdate(req.user.sub, update, { new: true });
		if (!user) return res.status(404).json({ error: 'User not found' });

		return res.json(userProfile(user));
	} catch (error) {
		console.error('Update user profile error:', error);
		return res.status(500).json({ error: 'Unable to update profile' });
	}
}
