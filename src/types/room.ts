export type Source = 'chotot' | 'batdongsan' | 'phongtro123' | 'facebook';

export interface Room {
  id: string;
  title: string;
  price: number; // VND
  address: string;
  district: string; // Quận/Huyện
  area: number; // m²
  images: string[];
  url: string;
  postedAt: string; // ISO date string
  source: Source;
  // optional enriched fields
  location?: { type: 'Point'; coordinates: [number, number] };
  amenities?: string[];
  roomType?: string;
  rawDescription?: string;
  isOwner?: boolean;
  spamScore?: number;
  sourceId?: string;
  crawledAt?: string; // ISO date string
  isActive?: boolean;
}