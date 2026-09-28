export interface CitySectionConfig {
  slug: string;
  title: string;
  type: 'place' | 'culture' | 'festival';
  description: string;
  icon?: string;
  aliases?: string[];
  enabled?: boolean;
}

export const CITY_SECTIONS: CitySectionConfig[] = [
  {
    slug: 'popular-places',
    title: 'Popular Places',
    type: 'place',
    description: 'Famous monuments, landmarks, and top attractions of the district.',
    icon: 'account_balance',
  },
  {
    slug: 'hidden-places',
    title: 'Hidden Places',
    type: 'place',
    description: 'Lesser-known heritage gems, quiet shrines, and historic trails.',
    icon: 'explore',
  },
  {
    slug: 'dance-traditions',
    title: 'Dance Traditions',
    type: 'culture',
    description: 'Traditional performing arts, folk dance, and regional musical heritage.',
    icon: 'music_note',
    aliases: ['cultural-folk'],
  },
  {
    slug: 'culinary-heritage',
    title: 'Culinary Heritage',
    type: 'culture',
    description: 'Historic gastronomy, authentic traditional recipes, sweetmeats, and heirloom cuisine.',
    icon: 'restaurant',
  },
  {
    slug: 'arts-crafts',
    title: 'Arts & Craftwork',
    type: 'culture',
    description: 'Indigenous textile weaves, metal crafts, pottery, wood carvings, and artisanal guilds.',
    icon: 'palette',
  },
  {
    slug: 'living-traditions',
    title: 'Living Traditions',
    type: 'culture',
    description: 'Oral storytelling, community rituals, traditional knowledge systems, and folklore.',
    icon: 'auto_stories',
    aliases: ['living-culture'],
  },
  {
    slug: 'regional-festivals',
    title: 'Regional Festivals',
    type: 'festival',
    description: 'Traditional celebrations, seasonal fairs, temple gatherings, and annual rituals.',
    icon: 'celebration',
  },
];

export const VALID_SECTION_SLUGS = [
  'popular-places',
  'hidden-places',
  'dance-traditions',
  'cultural-folk',
  'culinary-heritage',
  'arts-crafts',
  'living-traditions',
  'living-culture',
  'regional-festivals',
];

export function getSectionBySlug(slug: string): CitySectionConfig | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  return CITY_SECTIONS.find(
    (s) => s.slug === normalized || (s.aliases && s.aliases.includes(normalized))
  );
}

export function getSectionTitle(slug: string): string {
  return getSectionBySlug(slug)?.title || slug;
}

