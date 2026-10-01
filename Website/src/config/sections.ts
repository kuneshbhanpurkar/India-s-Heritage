export interface CitySectionConfig {
  slug: string;
  title: string;
  type: 'place' | 'culture' | 'festival';
  description: string;
  icon?: string;
  aliases?: string[];
}

export const CITY_SECTIONS: CitySectionConfig[] = [
  {
    slug: 'heritage-places',
    title: 'Heritage & Places',
    type: 'place',
    description: 'Famous monuments, landmarks, and top heritage attractions.',
    icon: 'account_balance',
    aliases: ['popular-places'],
  },
  {
    slug: 'hidden-places',
    title: 'Hidden Places',
    type: 'place',
    description: 'Lesser-known heritage gems, quiet shrines, and historic trails.',
    icon: 'explore',
    aliases: [],
  },
  {
    slug: 'culture-traditions',
    title: 'Culture & Traditions',
    type: 'culture',
    description: 'Living traditions, regional festivals, rituals, and spiritual practices.',
    icon: 'auto_stories',
    aliases: ['living-traditions', 'living-culture', 'regional-festivals'],
  },
  {
    slug: 'arts-folk',
    title: 'Arts & Folk',
    type: 'culture',
    description: 'Traditional performing arts, indigenous crafts, folk music, dance, and artisanal guilds.',
    icon: 'palette',
    aliases: ['dance-traditions', 'cultural-folk', 'arts-crafts'],
  },
  {
    slug: 'food-markets',
    title: 'Food & Markets',
    type: 'culture',
    description: 'Historic gastronomy, iconic local delicacies, bazaars, and traditional food markets.',
    icon: 'restaurant',
    aliases: ['culinary-heritage'],
  },
];

export const VALID_SECTION_SLUGS = CITY_SECTIONS.map((s) => s.slug);

export const LEGACY_SLUG_MAP: Record<string, string> = {
  'popular-places': 'heritage-places',
  'hidden-places': 'hidden-places',
  'dance-traditions': 'arts-folk',
  'cultural-folk': 'arts-folk',
  'arts-crafts': 'arts-folk',
  'culinary-heritage': 'food-markets',
  'living-traditions': 'culture-traditions',
  'living-culture': 'culture-traditions',
  'regional-festivals': 'culture-traditions',
};

export function resolveCategorySlug(rawSlug?: string): string | undefined {
  if (!rawSlug) return undefined;
  const normalized = rawSlug.toLowerCase().trim();
  const direct = CITY_SECTIONS.find((s) => s.slug === normalized);
  if (direct) return direct.slug;
  if (LEGACY_SLUG_MAP[normalized]) return LEGACY_SLUG_MAP[normalized];
  const aliasMatch = CITY_SECTIONS.find((s) => s.aliases && s.aliases.includes(normalized));
  return aliasMatch?.slug;
}

export function getSectionBySlug(slug?: string): CitySectionConfig | undefined {
  if (!slug) return undefined;
  const resolved = resolveCategorySlug(slug);
  return CITY_SECTIONS.find((s) => s.slug === resolved);
}

export function getSectionTitle(slug?: string): string {
  return getSectionBySlug(slug)?.title || slug || '';
}
