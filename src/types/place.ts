export type PlaceSource = 'manual' | 'ai' | 'google';
export type PlaceCategory =
  | 'date'
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'entertainment'
  | 'scenic'
  | 'activity'
  | 'cinema'
  | 'park'
  | 'museum'
  | 'beach';

export interface Place {
  id: string;
  title: string;
  description?: string;
  address?: string;
  category: PlaceCategory;
  location: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  rating?: number; // 0-5
  priceLevel?: 1 | 2 | 3 | 4; // like Google
  url?: string;
  images?: string[];
  source?: PlaceSource;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}