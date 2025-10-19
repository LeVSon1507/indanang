import mongoose, { Schema, models, model } from 'mongoose';

export type Source = 'chotot' | 'batdongsan' | 'phongtro123' | 'facebook';

export interface RoomDoc extends mongoose.Document {
  title: string;
  price: number;
  address: string;
  district: string;
  area: number;
  images: string[];
  url: string;
  postedAt: Date;
  source: Source;
  createdAt: Date;
  updatedAt: Date;
  // extended fields
  location?: { type: 'Point'; coordinates: [number, number] };
  amenities?: string[];
  roomType?: string;
  rawDescription?: string;
  isOwner?: boolean;
  spamScore?: number;
  sourceId?: string;
  crawledAt?: Date;
  isActive?: boolean;
}

const RoomSchema = new Schema<RoomDoc>(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true, index: true },
    address: { type: String, required: true },
    district: { type: String, required: true, index: true },
    area: { type: Number, required: true },
    images: { type: [String], default: [] },
    url: { type: String, required: true },
    postedAt: { type: Date, required: true, index: true },
    source: { type: String, required: true, enum: ['chotot','batdongsan','phongtro123','facebook'], index: true },
    // extended fields
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    amenities: { type: [String], default: [] },
    roomType: { type: String },
    rawDescription: { type: String },
    isOwner: { type: Boolean },
    spamScore: { type: Number },
    sourceId: { type: String },
    crawledAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RoomSchema.index({ price: 1 });
RoomSchema.index({ district: 1 });
RoomSchema.index({ source: 1 });
RoomSchema.index({ postedAt: -1 });
RoomSchema.index({ location: '2dsphere' });

export const Room = models.Room || model<RoomDoc>('Room', RoomSchema);