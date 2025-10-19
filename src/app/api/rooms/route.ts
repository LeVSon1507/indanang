import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Room, type RoomDoc } from '@/models/Room';
import type { FilterQuery } from 'mongoose';

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const district = searchParams.get('district') || '';
  const sources = (searchParams.get('sources') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const cheapOnly = searchParams.get('cheapOnly') === 'true';
  const cheapThreshold = Number(searchParams.get('cheapThreshold') || 2000000);

  const match: Record<string, unknown> = {};
  if (q) match['$or'] = [
    { title: { $regex: q, $options: 'i' } },
    { address: { $regex: q, $options: 'i' } },
  ];

  const price: Record<string, number> = {};
  if (minPrice) price['$gte'] = Number(minPrice);
  if (maxPrice) price['$lte'] = Number(maxPrice);
  if (cheapOnly) price['$lte'] = Math.min(price['$lte'] ?? cheapThreshold, cheapThreshold);
  if (Object.keys(price).length) match['price'] = price;

  if (district) match['district'] = district;
  if (sources.length) match['source'] = { $in: sources };

  const rooms = await Room.find(match as FilterQuery<RoomDoc>).sort({ price: 1 }).limit(200).lean();
  return NextResponse.json(rooms);
}