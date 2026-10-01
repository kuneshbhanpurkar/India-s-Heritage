import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import State from '../models/State.js';
import City from '../models/City.js';
import Category from '../models/Category.js';
import Content from '../models/Content.js';
import User from '../models/User.js';
import { CITY_SECTIONS } from '../config/categoryDefinitions.js';
import { slugify } from '../utils/auth.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const initialStatesData = [
	{
		name: 'Madhya Pradesh',
		code: 'MP',
		country_code: 'IN',
		normalized_name: 'madhya pradesh',
		slug: 'madhya-pradesh',
		description: 'Heart of India, rich in Malwa heritage, sacred traditions, forests, and historic monuments.',
		location: { type: 'Point', coordinates: [78.6569, 22.9734] },
		districts: [
			{
				name: 'Indore',
				slug: 'indore',
				coordinates: { lat: 22.7196, lng: 75.8577 },
				description: 'Commercial and cultural capital of historic Malwa, famous for Rajwada, Lal Bagh Palace, and Sarafa night bazaar.',
			},
			{
				name: 'Ujjain',
				slug: 'ujjain',
				coordinates: { lat: 23.1765, lng: 75.7885 },
				description: 'Sacred city of Mahakaleshwar Jyotirlinga on the banks of Shipra river.',
			},
			{
				name: 'Bhopal',
				slug: 'bhopal',
				coordinates: { lat: 23.2599, lng: 77.4126 },
				description: 'City of Lakes, royal Begum architecture, and UNESCO Bhimbetka caves nearby.',
			},
			{
				name: 'Gwalior',
				slug: 'gwalior',
				coordinates: { lat: 26.2183, lng: 78.1828 },
				description: 'Hilltop fortress city renowned for music, palaces, and royal Tomar architecture.',
			},
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
			{
				name: 'Jaipur',
				slug: 'jaipur',
				coordinates: { lat: 26.9124, lng: 75.7873 },
				description: 'The Pink City, UNESCO World Heritage city, Hawa Mahal, and Amer Fort.',
			},
			{
				name: 'Jodhpur',
				slug: 'jodhpur',
				coordinates: { lat: 26.2389, lng: 73.0243 },
				description: 'The Sun City crowned by the colossal Mehrangarh Fort.',
			},
			{
				name: 'Udaipur',
				slug: 'udaipur',
				coordinates: { lat: 24.5854, lng: 73.7125 },
				description: 'City of Lakes and romantic Mewar palaces.',
			},
		],
	},
	{
		name: 'Uttar Pradesh',
		code: 'UP',
		country_code: 'IN',
		normalized_name: 'uttar pradesh',
		slug: 'uttar-pradesh',
		description: 'Cradle of ancient Indian civilizations, spiritual ghats, and Mughal architecture.',
		location: { type: 'Point', coordinates: [80.9462, 26.8467] },
		districts: [
			{
				name: 'Agra',
				slug: 'agra',
				coordinates: { lat: 27.1767, lng: 78.0081 },
				description: 'Home of the Taj Mahal and Agra Fort.',
			},
			{
				name: 'Varanasi',
				slug: 'varanasi',
				coordinates: { lat: 25.3176, lng: 82.9739 },
				description: 'Spiritual capital of India on the sacred Ganga ghats.',
			},
		],
	},
	{
		name: 'Maharashtra',
		code: 'MH',
		country_code: 'IN',
		normalized_name: 'maharashtra',
		slug: 'maharashtra',
		description: 'Land of Shivaji Maharaj, Western Ghats, and Ajanta-Ellora caves.',
		location: { type: 'Point', coordinates: [75.7139, 19.7515] },
		districts: [
			{
				name: 'Mumbai',
				slug: 'mumbai',
				coordinates: { lat: 19.076, lng: 72.8777 },
				description: 'Gateway of India, Victorian Gothic ensembles, and Elephanta caves.',
			},
			{
				name: 'Pune',
				slug: 'pune',
				coordinates: { lat: 18.5204, lng: 73.8567 },
				description: 'Cultural capital of Maharashtra, Shaniwar Wada, and Sinhagad Fort.',
			},
		],
	},
	{
		name: 'Delhi',
		code: 'DL',
		country_code: 'IN',
		normalized_name: 'delhi',
		slug: 'delhi',
		description: 'National Capital Territory spanning Red Fort, Qutub Minar, and Humayun Tomb.',
		location: { type: 'Point', coordinates: [77.1025, 28.7041] },
		districts: [
			{
				name: 'New Delhi',
				slug: 'new-delhi',
				coordinates: { lat: 28.6139, lng: 77.209 },
				description: 'Heart of India showcasing ASI protected monuments and national heritage.',
			},
		],
	},
];

async function resetAndRebuildDatabase() {
	try {
		console.log('🔄 Connecting to MongoDB database...');
		await connectDatabase();
		const db = mongoose.connection.db;

		console.log('\n🧹 Step 1: Cleaning legacy / dirty collections...');
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map((c) => c.name);

		// Drop old / unused collections completely
		const collectionsToDrop = ['admins', 'districts', 'districtcategories', 'auditlogs', 'contents'];
		for (const col of collectionsToDrop) {
			if (collectionNames.includes(col)) {
				await db.dropCollection(col);
				console.log(`  ✓ Dropped legacy collection: ${col}`);
			}
		}

		// Clear canonical collections
		await State.deleteMany({});
		await City.deleteMany({});
		await Category.deleteMany({});
		await Content.deleteMany({});
		await User.deleteMany({});
		console.log('  ✓ Cleared States, Cities, Categories, Contents (places), and Users');

		console.log('\n🏛️ Step 2: Seeding States and Cities/Districts...');
		const stateMap = {};
		const cityMap = {};

		for (const stateData of initialStatesData) {
			const state = await State.create({
				name: stateData.name,
				code: stateData.code,
				country_code: stateData.country_code || 'IN',
				normalized_name: stateData.normalized_name,
				slug: stateData.slug,
				description: stateData.description,
				location: stateData.location,
				active: true,
			});
			stateMap[state.code] = state;
			console.log(`  ✓ State created: ${state.name} (${state.code})`);

			for (const dist of stateData.districts) {
				const city = await City.create({
					name: dist.name,
					slug: dist.slug,
					stateId: state._id,
					coordinates: dist.coordinates,
					description: dist.description,
					location: {
						type: 'Point',
						coordinates: [dist.coordinates.lng, dist.coordinates.lat],
					},
					active: true,
				});
				cityMap[dist.name] = city;
				console.log(`     - City/District created: ${city.name} [${dist.coordinates.lat}, ${dist.coordinates.lng}]`);
			}
		}

		console.log('\n📁 Step 3: Seeding 5 Canonical Categories...');
		let order = 1;
		for (const sec of CITY_SECTIONS) {
			await Category.create({
				name: sec.title,
				slug: sec.slug,
				type: sec.type || 'place',
				description: sec.description || '',
				icon: sec.icon || 'account_balance',
				aliases: sec.aliases || [],
				displayOrder: order++,
				globalActive: true,
				active: true,
			});
			console.log(`  ✓ Category created: ${sec.title} (slug: ${sec.slug})`);
		}

		console.log('\n👤 Step 4: Seeding Administrative & Super Admin Users...');
		const defaultPassword = process.env.ADMIN_PASSWORD || 'mp136366';
		const passwordHash = await bcrypt.hash(defaultPassword, 12);
		const indoreCity = cityMap['Indore'];
		const mpState = stateMap['MP'];

		const adminUsers = [
			{
				name: 'Lucky Choudhary',
				email: 'luckypc082922@gmail.com',
				password: passwordHash,
				role: 'super_admin',
				state: 'Madhya Pradesh',
				district: 'Indore',
				stateId: mpState._id,
				cityId: indoreCity._id,
				active: true,
			},
			{
				name: 'Lucky Choudhary',
				email: 'luckychoudhary08292@gmail.com',
				password: passwordHash,
				role: 'super_admin',
				state: 'Madhya Pradesh',
				district: 'Indore',
				stateId: mpState._id,
				cityId: indoreCity._id,
				active: true,
			},
			{
				name: 'Citizen Demo',
				email: 'citizen@dharohar.gov.in',
				password: passwordHash,
				role: 'user',
				state: 'Madhya Pradesh',
				district: 'Indore',
				stateId: mpState._id,
				cityId: indoreCity._id,
				active: true,
			},
		];

		for (const u of adminUsers) {
			await User.create(u);
			console.log(`  ✓ User created: ${u.name} <${u.email}> (${u.role})`);
		}

		const creatorUser = await User.findOne({ email: 'luckypc082922@gmail.com' });

		console.log('\n🏰 Step 5: Seeding Rich Verified Prototype Content...');

		const prototypeContents = [
			{
				title: 'Rajwada Palace',
				slug: 'rajwada-palace',
				subtitle: 'Seven-story Holkar Dynasty Grandeur & Royal Gateway',
				section: 'heritage-places',
				category: 'Heritage & Places',
				stateId: mpState._id,
				cityId: indoreCity._id,
				status: 'published',
				isFeatured: true,
				latitude: 22.7186,
				longitude: 75.8577,
				location: { type: 'Point', coordinates: [75.8577, 22.7186] },
				shortDescription: 'Historic seven-story palace of the Holkar dynasty built in 1766 CE, blending Maratha, Mughal, and French architectural grandeur.',
				fullDescription: 'Rajwada is an iconic seven-storied historic palace built in 1766 CE by Malhar Rao Holkar, the founder of the Holkar dynasty. Located in the bustling heart of Indore, the structure is an extraordinary architectural synthesis of Maratha woodcraft, Mughal stone facades, and French arched balconies. The lower three storeys are constructed from stone while the upper four storeys are crafted from timber. It stands as the quintessential monument of Indore heritage.',
				fields: {
					builtBy: 'Malhar Rao Holkar II',
					era: '1766 CE (18th Century)',
					timings: '10:00 AM - 05:00 PM (Closed Mondays)',
					rating: '4.9',
					reviewsCount: '3,450+ verified reviews',
					entryFee: {
						domestic: '20',
						foreign: '250',
						student: '10',
					},
					distanceKm: 0.5,
					distanceDisplay: '0.5 km from City Center',
				},
				media: [
					{
						type: 'image',
						url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
						title: 'Rajwada Palace Illuminated Facade',
						caption: 'Rajwada Palace during evening sound and light presentation',
						source: 'Madhya Pradesh Tourism Official',
						displayOrder: 1,
						active: true,
					},
					{
						type: 'video',
						url: 'https://www.w3schools.com/html/mov_bbb.mp4',
						title: 'Rajwada Palace Architectural Documentary Film',
						caption: '4K Ultra-HD walkthrough and historical analysis of Holkar Royal Palace',
						source: 'National Heritage Documentary Archive',
						displayOrder: 2,
						active: true,
					},
					{
						type: 'image',
						url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
						title: 'Holkar Wooden Courtyard Intricate Carvings',
						caption: 'Inner courtyard showing wooden pillars and traditional balconies',
						source: 'Archaeological Survey of India',
						displayOrder: 3,
						active: true,
					},
				],
				documents: [
					{
						title: 'ASI Gazette Notification - Centrally Protected Monument #MP-042',
						type: 'pdf',
						url: 'https://asi.nic.in/gazette/rajwada-palace.pdf',
						author: 'Archaeological Survey of India',
						publisher: 'Government of India',
						active: true,
					},
				],
				sources: [
					{
						sourceTitle: 'Holkar State Architectural Records (1766-1947)',
						sourceUrl: 'https://mptourism.com/destination-indore.php',
						attribution: 'Madhya Pradesh Tourism Board',
						verificationNotes: 'Verified against official state monument directory.',
					},
				],
				createdBy: creatorUser._id,
				publishedBy: creatorUser._id,
				publishedAt: new Date(),
				active: true,
			},
			{
				title: 'Lal Bagh Palace',
				slug: 'lal-bagh-palace',
				subtitle: 'Versailles of Central India with European Baroque Interiors',
				section: 'heritage-places',
				category: 'Heritage & Places',
				stateId: mpState._id,
				cityId: indoreCity._id,
				status: 'published',
				isFeatured: true,
				latitude: 22.7001,
				longitude: 75.8369,
				location: { type: 'Point', coordinates: [75.8369, 22.7001] },
				shortDescription: 'One of India’s most opulent European-style palaces featuring Versailles-inspired wrought-iron entrance gates and Italian marble halls.',
				fullDescription: 'Constructed between 1886 and 1921 under Maharaja Tukoji Rao Holkar II and Shivaji Rao Holkar, Lal Bagh Palace spreads over 28 acres on the banks of river Khan. The majestic entrance gates were cast in England, identical to those at Buckingham Palace. The interiors boast Belgian stained glass, Italian marble floors, Persian carpets, and grand ballroom chandeliers.',
				fields: {
					builtBy: 'Maharaja Tukoji Rao Holkar II',
					era: '1886 - 1921 CE',
					timings: '10:15 AM - 05:00 PM (Closed Mondays)',
					rating: '4.8',
					reviewsCount: '2,890 reviews',
					entryFee: {
						domestic: '25',
						foreign: '300',
						student: '15',
					},
					distanceKm: 3.8,
					distanceDisplay: '3.8 km from Rajwada',
				},
				media: [
					{
						type: 'image',
						url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
						title: 'Lal Bagh Palace Grand Estate',
						caption: 'Front facade and landscaped gardens of Lal Bagh Palace',
						source: 'State Directorate of Archaeology',
						displayOrder: 1,
						active: true,
					},
					{
						type: 'video',
						url: 'https://www.w3schools.com/html/mov_bbb.mp4',
						title: 'Lal Bagh Palace Royal Heritage Tour',
						caption: 'Holkar Dynasty Royal Court and European Art Collection Tour',
						source: 'Dharohar Digital Heritage Archive',
						displayOrder: 2,
						active: true,
					},
				],
				createdBy: creatorUser._id,
				publishedBy: creatorUser._id,
				publishedAt: new Date(),
				active: true,
			},
			{
				title: 'Sarafa Night Bazaar',
				slug: 'sarafa-night-bazaar',
				subtitle: 'Century-old Jewelry Street Transforming into Midnight Street Food Paradise',
				section: 'food-markets',
				category: 'Food & Markets',
				stateId: mpState._id,
				cityId: indoreCity._id,
				status: 'published',
				isFeatured: true,
				latitude: 22.719,
				longitude: 75.855,
				location: { type: 'Point', coordinates: [75.855, 22.719] },
				shortDescription: 'Traditional jewelry market by day that converts into India’s most celebrated midnight culinary street after 8:00 PM.',
				fullDescription: 'Sarafa Bazaar is the legendary culinary epicenter of Indore. Operating as a bustling bullion and jewelry hub during daylight hours, it undergoes a magical metamorphosis after 8:00 PM when artisanal sweetmakers and chaat vendors roll out their carts. Famous dishes include creamy Bhutte ka Kees, spicy Garadu, crispy Khopra Patties, and multi-layered Dahi Vada tossed with theatrics.',
				fields: {
					itemType: 'Market',
					famousSince: 'Early 19th Century',
					whereToTry: 'Main Sarafa Chowk, near Rajwada, Indore',
					timings: '08:30 PM - 02:00 AM (Daily)',
					rating: '4.9',
					reviewsCount: '8,120 reviews',
					distanceKm: 0.2,
					distanceDisplay: '200m from Rajwada',
				},
				media: [
					{
						type: 'image',
						url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
						title: 'Sarafa Night Market Bustling Lanes',
						caption: 'Indori street food masters at work in Sarafa Bazaar',
						source: 'Indore Heritage Food Guild',
						displayOrder: 1,
						active: true,
					},
				],
				createdBy: creatorUser._id,
				publishedBy: creatorUser._id,
				publishedAt: new Date(),
				active: true,
			},
			{
				title: 'Holkar Royal Chhatris',
				slug: 'holkar-royal-chhatris',
				subtitle: 'Sacred Stone Cenotaphs with Ornate Canopies along the Kahn River',
				section: 'hidden-places',
				category: 'Hidden Places',
				stateId: mpState._id,
				cityId: indoreCity._id,
				status: 'published',
				isFeatured: false,
				latitude: 22.716,
				longitude: 75.858,
				location: { type: 'Point', coordinates: [75.858, 22.716] },
				shortDescription: 'Exquisitely carved cenotaphs commemorating the rulers of the Holkar dynasty, featuring Maratha dome architecture.',
				fullDescription: 'The Chhatris are royal cenotaph monuments built over the cremation spots of the Holkar rulers on the banks of river Kahn. Featuring soaring shikharas, fluted columns, and stone equestrian statues, they offer serene reflections of Malwa craftsmanship and royal funerary traditions.',
				fields: {
					storyType: 'Historical Event',
					relatedPersonality: 'Rani Ahilyabai Holkar & Malhar Rao Holkar',
					timings: '09:00 AM - 06:30 PM',
					rating: '4.7',
					reviewsCount: '920 reviews',
					distanceKm: 0.8,
					distanceDisplay: '0.8 km from Rajwada',
				},
				media: [
					{
						type: 'image',
						url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
						title: 'Krishnapura Chhatris at Dusk',
						caption: 'Stone carved domes reflected in river waters',
						source: 'State Archaeological Registry',
						displayOrder: 1,
						active: true,
					},
				],
				createdBy: creatorUser._id,
				publishedBy: creatorUser._id,
				publishedAt: new Date(),
				active: true,
			},
			{
				title: 'Malwi Lok Nritya & Bhagoria Traditions',
				slug: 'malwi-lok-nritya-bhagoria',
				subtitle: 'Vibrant Indigenous Folk Music, Matki Dance & Spring Festival Guilds',
				section: 'arts-folk',
				category: 'Arts & Folk',
				stateId: mpState._id,
				cityId: indoreCity._id,
				status: 'published',
				isFeatured: false,
				latitude: 22.72,
				longitude: 75.86,
				location: { type: 'Point', coordinates: [75.86, 22.72] },
				shortDescription: 'Celebrated folk music and Matki dance of Malwa region, performed during harvest festivities with traditional Dhol and Thali rhythms.',
				fullDescription: 'The Matki dance and Malwi folk songs are ancestral performance traditions deeply rooted in the rural fabric around Indore and Malwa. Dancers balance earthen pots (matkis) with remarkable poise while stepping to the hypnotic beats of the Dholak, celebrating seasons, harvest gratitude, and community bonding.',
				fields: {
					artFormType: 'Dance',
					artisanCommunity: 'Malwi & Nimar Folk Guilds',
					origin: 'Malwa Plateau, Madhya Pradesh',
					rating: '4.9',
					reviewsCount: '410 reviews',
				},
				media: [
					{
						type: 'image',
						url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
						title: 'Malwi Folk Performers in Traditional Attire',
						caption: 'Folk dancers performing Matki dance during regional festival',
						source: 'Tribal & Folk Art Academy of Madhya Pradesh',
						displayOrder: 1,
						active: true,
					},
				],
				createdBy: creatorUser._id,
				publishedBy: creatorUser._id,
				publishedAt: new Date(),
				active: true,
			},
		];

		for (const doc of prototypeContents) {
			const created = await Content.create(doc);
			console.log(`  ✓ Content created: "${created.title}" [Section: ${created.section}, Status: ${created.status}]`);
		}

		console.log('\n======================================================');
		console.log('🎉 DATABASE RESET AND REBUILD COMPLETED SUCCESSFULLY!');
		console.log('======================================================\n');
	} catch (error) {
		console.error('❌ Error during database reset and rebuild:', error);
		process.exitCode = 1;
	} finally {
		await disconnectDatabase();
		console.log('🔌 Database disconnected.');
	}
}

resetAndRebuildDatabase();
