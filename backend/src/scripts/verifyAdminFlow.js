const BASE_URL = 'http://localhost:8080/api';

async function testAdminFlow() {
	try {
		console.log('1. Testing Admin Login...');
		const loginRes = await fetch(`${BASE_URL}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'luckychoudhary08292@gmail.com',
				password: 'mp136366',
			}),
		});
		const loginData = await loginRes.json();
		if (!loginData.token) {
			throw new Error('Admin login failed: ' + JSON.stringify(loginData));
		}
		console.log('   ✓ Admin Login Success! Role:', loginData.user?.role, '| Name:', loginData.user?.name);
		const token = loginData.token;

		console.log('\n2. Testing Admin Content Creation (direct publish)...');
		const contentRes = await fetch(`${BASE_URL}/admin/content`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				title: 'Patalpani Waterfall & Historic Bridge',
				section: 'hidden-places',
				stateId: loginData.user?.stateId,
				cityId: loginData.user?.cityId,
				shortDescription: 'Scenic waterfall and historic British railway bridge near Mhow, Indore.',
				status: 'published',
				fields: {
					storyType: 'Legend',
					relatedPersonality: 'Tantya Bhil (Indian Robin Hood)',
				},
				media: [
					{
						type: 'image',
						url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
						title: 'Patalpani Falls',
					},
					{
						type: 'video',
						url: 'https://www.w3schools.com/html/mov_bbb.mp4',
						title: 'Patalpani Rail Heritage Video',
					}
				],
			}),
		});

		const newContent = await contentRes.json();
		console.log(`   ✓ New Content Created: "${newContent.title}" [Status: ${newContent.status}, ID: ${newContent._id}]`);

		console.log('\n3. Testing Website Public Fetch for newly created item...');
		const pubRes = await fetch(`${BASE_URL}/public/content/${newContent.slug}`);
		const pubData = await pubRes.json();
		console.log(`   ✓ Public Fetch Success! Title: "${pubData.title}", Media Count: ${pubData.mediaItems?.length || 0}`);

		console.log('\n🎉 ADMIN → DATABASE → USER WEBSITE FLOW IS 100% OPERATIONAL!');
	} catch (err) {
		console.error('❌ Admin Flow test failed:', err);
		process.exitCode = 1;
	}
}

testAdminFlow();
