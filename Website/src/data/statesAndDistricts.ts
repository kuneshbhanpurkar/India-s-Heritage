export interface DistrictInfo {
  id: string;
  name: string;
  state: string;
  isPublished: boolean;
  monumentCount: number;
  highlightMonuments: string[];
  asiCircle?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description?: string;
  coverImage?: string;
  popular?: boolean;
}

export interface StateInfo {
  id: string;
  name: string;
  code: string;
  region: 'North' | 'Central' | 'South' | 'East' | 'West';
  isPublished: boolean;
  monumentCount: number;
  districts: DistrictInfo[];
}

export const STATE_REGION_MAP: Record<string, 'North' | 'Central' | 'South' | 'East' | 'West'> = {
  MP: 'Central',
  CG: 'Central',
  RJ: 'North',
  UP: 'North',
  DL: 'North',
  PB: 'North',
  HR: 'North',
  HP: 'North',
  JK: 'North',
  LA: 'North',
  UK: 'North',
  MH: 'West',
  GJ: 'West',
  GA: 'West',
  KA: 'South',
  TN: 'South',
  KL: 'South',
  AP: 'South',
  TG: 'South',
  WB: 'East',
  OD: 'East',
  BR: 'East',
  JH: 'East',
  AS: 'East',
  TR: 'East',
  MN: 'East',
  ML: 'East',
  MZ: 'East',
  NL: 'East',
  AR: 'East',
  SK: 'East',
};

export const getStateRegion = (codeOrName: string): 'North' | 'Central' | 'South' | 'East' | 'West' => {
  const clean = (codeOrName || '').trim().toUpperCase();
  if (STATE_REGION_MAP[clean]) return STATE_REGION_MAP[clean];

  const nameMap: Record<string, 'North' | 'Central' | 'South' | 'East' | 'West'> = {
    'MADHYA PRADESH': 'Central',
    'CHHATTISGARH': 'Central',
    'RAJASTHAN': 'North',
    'UTTAR PRADESH': 'North',
    'DELHI': 'North',
    'DELHI (NCT)': 'North',
    'PUNJAB': 'North',
    'HARYANA': 'North',
    'HIMACHAL PRADESH': 'North',
    'JAMMU & KASHMIR': 'North',
    'JAMMU AND KASHMIR': 'North',
    'LADAKH': 'North',
    'UTTARAKHAND': 'North',
    'MAHARASHTRA': 'West',
    'GUJARAT': 'West',
    'GOA': 'West',
    'KARNATAKA': 'South',
    'TAMIL NADU': 'South',
    'KERALA': 'South',
    'ANDHRA PRADESH': 'South',
    'TELANGANA': 'South',
    'WEST BENGAL': 'East',
    'ODISHA': 'East',
    'BIHAR': 'East',
    'JHARKHAND': 'East',
    'ASSAM': 'East',
  };
  return nameMap[clean] || 'North';
};
