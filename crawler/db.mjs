import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env from .env.local if present
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'cheap_home';

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI in environment');
}

let connPromise = null;
export async function connect() {
  if (connPromise) return connPromise;
  connPromise = mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB,
    autoIndex: true,
  });
  return connPromise;
}

const RoomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  address: { type: String },
  district: { type: String },
  area: { type: Number },
  images: [{ type: String }],
  url: { type: String, required: true, index: true, unique: true },
  postedAt: { type: Date },
  source: { type: String, index: true },
}, { timestamps: true });

RoomSchema.index({ price: 1 });
RoomSchema.index({ district: 1 });
RoomSchema.index({ source: 1 });
RoomSchema.index({ postedAt: -1 });

export const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);