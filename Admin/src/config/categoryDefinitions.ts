/**
 * Canonical Phase-1 Category Definitions - Single Source of Truth for Frontend
 * Exactly 5 categories.
 */

export interface DynamicFormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'group';
  required?: boolean;
  options?: string[];
  fields?: Array<{ name: string; label: string; type: string; required?: boolean }>;
}

export interface CategoryDefinition {
  slug: string;
  title: string;
  type: 'place' | 'culture' | 'festival';
  description: string;
  icon?: string;
  aliases?: string[];
  enabled?: boolean;
  fields: DynamicFormField[];
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryDefinition> = {
  'heritage-places': {
    slug: 'heritage-places',
    title: 'Heritage & Places',
    type: 'place',
    description: 'Famous monuments, landmarks, and top heritage attractions.',
    icon: 'account_balance',
    aliases: ['popular-places'],
    fields: [
      { name: 'builtBy', label: 'Built By', type: 'text', required: false },
      { name: 'era', label: 'Era / Century', type: 'text', required: false },
      {
        name: 'entryFee',
        label: 'Entry Fee',
        type: 'group',
        fields: [
          { name: 'domestic', label: 'Domestic (₹)', type: 'text' },
          { name: 'foreign', label: 'Foreign (₹)', type: 'text' },
          { name: 'student', label: 'Student (₹)', type: 'text' },
        ],
      },
      { name: 'timings', label: 'Timings', type: 'text', required: false },
    ],
  },
  'hidden-places': {
    slug: 'hidden-places',
    title: 'Hidden Places',
    type: 'place',
    description: 'Lesser-known heritage gems, quiet shrines, and historic trails.',
    icon: 'explore',
    aliases: [],
    fields: [
      { name: 'eventPeriod', label: 'Time Period / Event Date', type: 'text', required: false },
      { name: 'relatedPersonality', label: 'Related Personality', type: 'text', required: false },
      {
        name: 'storyType',
        label: 'Story Type',
        type: 'select',
        options: ['Folklore', 'Historical Event', 'Legend'],
        required: false,
      },
    ],
  },
  'culture-traditions': {
    slug: 'culture-traditions',
    title: 'Culture & Traditions',
    type: 'culture',
    description: 'Living traditions, regional festivals, rituals, and spiritual practices.',
    icon: 'auto_stories',
    aliases: ['living-traditions', 'living-culture', 'regional-festivals'],
    fields: [
      { name: 'festivalDate', label: 'Festival Date / Season', type: 'text', required: false },
      {
        name: 'frequency',
        label: 'Frequency',
        type: 'select',
        options: ['Annual', 'Seasonal', 'One-time'],
        required: false,
      },
      { name: 'ritualType', label: 'Ritual Type', type: 'text', required: false },
    ],
  },
  'arts-folk': {
    slug: 'arts-folk',
    title: 'Arts & Folk',
    type: 'culture',
    description: 'Traditional performing arts, indigenous crafts, folk music, dance, and artisanal guilds.',
    icon: 'palette',
    aliases: ['dance-traditions', 'cultural-folk', 'arts-crafts'],
    fields: [
      {
        name: 'artFormType',
        label: 'Art Form Type',
        type: 'select',
        options: ['Music', 'Dance', 'Craft', 'Painting'],
        required: false,
      },
      { name: 'artisanCommunity', label: 'Artisan Community', type: 'text', required: false },
      { name: 'origin', label: 'Origin Region', type: 'text', required: false },
    ],
  },
  'food-markets': {
    slug: 'food-markets',
    title: 'Food & Markets',
    type: 'culture',
    description: 'Historic gastronomy, iconic local delicacies, bazaars, and traditional food markets.',
    icon: 'restaurant',
    aliases: ['culinary-heritage'],
    fields: [
      {
        name: 'itemType',
        label: 'Type',
        type: 'select',
        options: ['Dish', 'Market'],
        required: false,
      },
      { name: 'famousSince', label: 'Famous Since', type: 'text', required: false },
      { name: 'whereToTry', label: 'Where to Try', type: 'text', required: false },
    ],
  },
};

export const VALID_CATEGORY_SLUGS = Object.keys(CATEGORY_DEFINITIONS);

export const CITY_SECTIONS: CategoryDefinition[] = Object.values(CATEGORY_DEFINITIONS);

export const VALID_SECTION_SLUGS = VALID_CATEGORY_SLUGS;

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
  if (CATEGORY_DEFINITIONS[normalized]) return normalized;
  if (LEGACY_SLUG_MAP[normalized]) return LEGACY_SLUG_MAP[normalized];
  for (const cat of Object.values(CATEGORY_DEFINITIONS)) {
    if (cat.aliases && cat.aliases.includes(normalized)) {
      return cat.slug;
    }
  }
  return undefined;
}

export function getSectionBySlug(rawSlug?: string): CategoryDefinition | undefined {
  const resolved = resolveCategorySlug(rawSlug);
  if (!resolved) return undefined;
  return CATEGORY_DEFINITIONS[resolved];
}

export function getSectionTitle(slug?: string): string {
  return getSectionBySlug(slug)?.title || slug || '';
}

export type CitySectionConfig = CategoryDefinition;
