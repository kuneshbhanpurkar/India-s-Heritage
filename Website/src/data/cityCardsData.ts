export interface CityHeritageCard {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  region: 'North' | 'Central' | 'South' | 'East' | 'West';
  monumentCount: number;
  dynasty: string;
  architectureStyle: string;
  highlightMonuments: string[];
  description: string;
  architecturalHallmark: string;
  unescoStatus?: string;
  image: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  popularTag?: string;
  culturalTrade?: string;
}
