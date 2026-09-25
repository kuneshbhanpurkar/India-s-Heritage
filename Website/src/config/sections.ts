export interface CitySectionConfig {
  slug: string;
  title: string;
  type: 'place' | 'culture' | 'festival';
  description: string;
  icon?: string;
}

export const CITY_SECTIONS: CitySectionConfig[] = [
  {
    slug: 'popular-places',
    title: 'Popular Places',
    type: 'place',
    description: 'Famous monuments, landmarks, and top attractions of the city.',
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
    slug: 'cultural-folk',
    title: 'Cultural & Folk Music / Dance',
    type: 'culture',
    description: 'Traditional performing arts, folk music, regional dance, and musical heritage.',
    icon: 'music_note',
  },
  {
    slug: 'regional-festivals',
    title: 'Regional Festivals',
    type: 'festival',
    description: 'Traditional celebrations, fairs, seasonal gatherings, and spiritual rituals.',
    icon: 'celebration',
  },
  {
    slug: 'living-culture',
    title: 'Living Culture',
    type: 'culture',
    description: 'Handicrafts, culinary heritage, artisanal markets, and community traditions.',
    icon: 'theater_comedy',
  },
];

export const VALID_SECTION_SLUGS = CITY_SECTIONS.map((s) => s.slug);

export function getSectionBySlug(slug: string): CitySectionConfig | undefined {
  return CITY_SECTIONS.find((s) => s.slug === slug);
}

export function getSectionTitle(slug: string): string {
  return getSectionBySlug(slug)?.title || slug;
}
