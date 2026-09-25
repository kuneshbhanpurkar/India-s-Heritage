export const CITY_SECTIONS = [
	{
		slug: 'popular-places',
		title: 'Popular Places',
		type: 'place',
		description: 'Famous monuments, landmarks, and top attractions of the city.',
	},
	{
		slug: 'hidden-places',
		title: 'Hidden Places',
		type: 'place',
		description: 'Lesser-known heritage gems, quiet shrines, and historic trails.',
	},
	{
		slug: 'cultural-folk',
		title: 'Cultural & Folk Music / Dance',
		type: 'culture',
		description: 'Traditional performing arts, folk music, regional dance, and musical heritage.',
	},
	{
		slug: 'regional-festivals',
		title: 'Regional Festivals',
		type: 'festival',
		description: 'Traditional celebrations, fairs, seasonal gatherings, and spiritual rituals.',
	},
	{
		slug: 'living-culture',
		title: 'Living Culture',
		type: 'culture',
		description: 'Handicrafts, culinary heritage, artisanal markets, and community traditions.',
	},
];

export const VALID_SECTION_SLUGS = CITY_SECTIONS.map((s) => s.slug);

export function getSectionBySlug(slug) {
	return CITY_SECTIONS.find((s) => s.slug === slug);
}
