import bcrypt from 'bcryptjs';
import State from '../models/State.js';
import City from '../models/City.js';
import User from '../models/User.js';
import { slugify } from '../utils/auth.js';

const directory = [
	{
		name: 'Madhya Pradesh',
		code: 'MP',
		country_code: 'IN',
		normalized_name: 'madhya pradesh',
		slug: 'madhya-pradesh',
		description: 'Heart of India, rich in Malwa heritage, sacred traditions, forests, agriculture, and historic landscapes.',
		location: { type: 'Point', coordinates: [78.6569, 22.9734] },
		districts: [
			{ name: 'Indore', slug: 'indore', coordinates: { lat: 22.7196, lng: 75.8577 }, description: 'Commercial and cultural capital of historic Malwa, famous for Rajwada, Lal Bagh, and culinary traditions.' },
			{ name: 'Ujjain', slug: 'ujjain', coordinates: { lat: 23.1765, lng: 75.7885 }, description: 'Historic temple city on the sacred Shipra river, home to Mahakaleshwar Jyotirlinga.' },
			{ name: 'Bhopal', slug: 'bhopal', coordinates: { lat: 23.2599, lng: 77.4126 }, description: 'The City of Lakes, Begum architecture, and ancient pre-historic Bhimbetka caves nearby.' },
			{ name: 'Gwalior', slug: 'gwalior', coordinates: { lat: 26.2183, lng: 78.1828 }, description: 'Historic hilltop fortress city renowned for music, palaces, and royal Tomar architecture.' },
		],
	},
	{
		name: 'Rajasthan',
		code: 'RJ',
		country_code: 'IN',
		normalized_name: 'rajasthan',
		slug: 'rajasthan',
		description: 'Land of Maharajas, majestic forts, Thar desert caravans, and royal palaces.',
		location: { type: 'Point', coordinates: [74.2179, 27.0238] },
		districts: [
			{ name: 'Jaipur', slug: 'jaipur', coordinates: { lat: 26.9124, lng: 75.7873 }, description: 'The Pink City, world heritage UNESCO city, home to Hawa Mahal, Amer Fort, and Jantar Mantar.' },
			{ name: 'Jodhpur', slug: 'jodhpur', coordinates: { lat: 26.2389, lng: 73.0243 }, description: 'The Blue City and Sun City crowned by the massive Mehrangarh Fort.' },
			{ name: 'Udaipur', slug: 'udaipur', coordinates: { lat: 24.5854, lng: 73.7125 }, description: 'City of Lakes, royal palaces, and romantic heritage in the Aravalli hills.' },
			{ name: 'Jaisalmer', slug: 'jaisalmer', coordinates: { lat: 26.9157, lng: 70.9083 }, description: 'The Golden City with the living golden sandstone fort in the Thar desert.' },
		],
	},
	{
		name: 'Uttar Pradesh',
		code: 'UP',
		country_code: 'IN',
		normalized_name: 'uttar pradesh',
		slug: 'uttar-pradesh',
		description: 'Cradle of ancient Indian civilizations, spiritual ghats, Mughal architecture, and classical art.',
		location: { type: 'Point', coordinates: [80.9462, 26.8467] },
		districts: [
			{ name: 'Agra', slug: 'agra', coordinates: { lat: 27.1767, lng: 78.0081 }, description: 'Home to the iconic Taj Mahal, Agra Fort, and Mughal architectural masterworks.' },
			{ name: 'Varanasi', slug: 'varanasi', coordinates: { lat: 25.3176, lng: 82.9739 }, description: 'One of the oldest continuously inhabited cities on Earth, spiritual heart of the Ganga.' },
			{ name: 'Lucknow', slug: 'lucknow', coordinates: { lat: 26.8467, lng: 80.9462 }, description: 'City of Nawabs, tehzeeb, Awadhi culinary traditions, and Bara Imambara.' },
		],
	},
	{
		name: 'Maharashtra',
		code: 'MH',
		country_code: 'IN',
		normalized_name: 'maharashtra',
		slug: 'maharashtra',
		description: 'Land of Shivaji Maharaj, Western Ghats, rock-cut Ajanta-Ellora caves, and Konkan coastline.',
		location: { type: 'Point', coordinates: [75.7139, 19.7515] },
		districts: [
			{ name: 'Mumbai', slug: 'mumbai', coordinates: { lat: 19.076, lng: 72.8777 }, description: 'Gateway of India, Elephanta caves, and Victorian Gothic heritage ensembles.' },
			{ name: 'Pune', slug: 'pune', coordinates: { lat: 18.5204, lng: 73.8567 }, description: 'Cultural capital of Maharashtra, Shaniwar Wada, and Maratha history.' },
			{ name: 'Aurangabad', slug: 'aurangabad', coordinates: { lat: 19.8762, lng: 75.3433 }, description: 'Tourism capital featuring world-famous UNESCO Ajanta and Ellora rock caves.' },
		],
	},
	{
		name: 'Delhi',
		code: 'DL',
		country_code: 'IN',
		normalized_name: 'delhi',
		slug: 'delhi',
		description: 'National Capital Territory spanning seven historic cities, Red Fort, Qutub Minar, and Humayun Tomb.',
		location: { type: 'Point', coordinates: [77.1025, 28.7041] },
		districts: [
			{ name: 'New Delhi', slug: 'new-delhi', coordinates: { lat: 28.6139, lng: 77.209 }, description: 'Heart of India showcasing Lutyens architectural grandeur and ancient ASI monuments.' },
		],
	},
];

export async function seedDirectoryIfEmpty() {
	// 1. Seed States and Cities (Districts)
	for (const stateData of directory) {
		let state = await State.findOne({ $or: [{ code: stateData.code }, { name: stateData.name }] });
		if (state) {
			state.name = stateData.name;
			state.code = stateData.code;
			state.country_code = stateData.country_code || 'IN';
			state.normalized_name = stateData.normalized_name || stateData.name.toLowerCase();
			state.slug = stateData.slug || slugify(stateData.name);
			state.description = stateData.description || state.description;
			state.location = stateData.location || state.location;
			state.active = true;
			await state.save();
		} else {
			state = await State.create({
				name: stateData.name,
				code: stateData.code,
				country_code: stateData.country_code || 'IN',
				normalized_name: stateData.normalized_name || stateData.name.toLowerCase(),
				slug: stateData.slug || slugify(stateData.name),
				description: stateData.description,
				location: stateData.location,
				active: true,
			});
		}

		for (const dist of stateData.districts) {
			await City.findOneAndUpdate(
				{ stateId: state._id, name: dist.name },
				{
					...dist,
					slug: dist.slug || slugify(dist.name),
					stateId: state._id,
					active: true,
				},
				{ upsert: true, setDefaultsOnInsert: true },
			);
		}
	}

	// 2. Seed Admin User Idempotently
	const adminEmails = [
		process.env.ADMIN_EMAIL,
		process.env.USER_EMAIL,
		'luckypc082922@gmail.com',
		'luckychoudhary08292@gmail.com',
	]
		.filter(Boolean)
		.map((e) => e.toLowerCase().trim());

	const adminPassword = process.env.ADMIN_PASSWORD || 'mp136366';
	const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
	const indoreCity = await City.findOne({ name: 'Indore' });
	const mpState = await State.findOne({ code: 'MP' });

	for (const email of [...new Set(adminEmails)]) {
		const existingAdmin = await User.findOne({ email });
		if (existingAdmin) {
			existingAdmin.name = 'Lucky Choudhary';
			existingAdmin.role = 'super_admin';
			existingAdmin.password = adminPasswordHash;
			existingAdmin.stateId = mpState?._id;
			existingAdmin.cityId = indoreCity?._id;
			existingAdmin.state = 'Madhya Pradesh';
			existingAdmin.district = 'Indore';
			existingAdmin.active = true;
			await existingAdmin.save();
		} else {
			await User.create({
				name: 'Lucky Choudhary',
				email,
				password: adminPasswordHash,
				role: 'super_admin',
				stateId: mpState?._id,
				cityId: indoreCity?._id,
				state: 'Madhya Pradesh',
				district: 'Indore',
				active: true,
			});
		}
	}

	console.log('Database directory and administrative user synchronization complete.');
}

