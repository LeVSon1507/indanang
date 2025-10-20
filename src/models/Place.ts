import mongoose, { Schema, models, model } from 'mongoose';

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

export interface PlaceDoc extends mongoose.Document {
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
  addedBy?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema = new Schema<PlaceDoc>(
  {
    title: { type: String, required: true },
    description: { type: String },
    address: { type: String },
    category: {
      type: String,
      required: true,
      enum: [
        'date',
        'cafe',
        'restaurant',
        'bar',
        'entertainment',
        'scenic',
        'activity',
        'cinema',
        'park',
        'museum',
        'beach',
      ],
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    rating: { type: Number, min: 0, max: 5 },
    priceLevel: { type: Number, min: 1, max: 4 },
    url: { type: String },
    images: { type: [String], default: [] },
    source: { type: String, enum: ['manual', 'ai', 'google'], default: 'manual' },
    addedBy: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PlaceSchema.index({ location: '2dsphere' });
PlaceSchema.index({ title: 1 });
PlaceSchema.index({ category: 1 });

export const Place = models.Place || model<PlaceDoc>('Place', PlaceSchema);