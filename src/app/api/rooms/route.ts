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
  const minArea = searchParams.get('minArea');
  const maxArea = searchParams.get('maxArea');
  const ownerOnly = searchParams.get('ownerOnly') === 'true';
  const hasImages = searchParams.get('hasImages') === 'true';
  const sortParam = searchParams.get('sort') || 'price_asc';
  const limit = Math.max(1, Number(searchParams.get('limit') || 200));
  const page = Math.max(1, Number(searchParams.get('page') || 1));

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

  const area: Record<string, number> = {};
  if (minArea) area['$gte'] = Number(minArea);
  if (maxArea) area['$lte'] = Number(maxArea);
  if (Object.keys(area).length) match['area'] = area;

  if (ownerOnly) match['isOwner'] = true;
  if (hasImages) match['images.0'] = { $exists: true };

  let sort: Record<string, 1 | -1> = { price: 1 };
  switch (sortParam) {
    case 'price_desc':
      sort = { price: -1 };
      break;
    case 'recent':
      sort = { postedAt: -1 };
      break;
    case 'area_desc':
      sort = { area: -1 };
      break;
    case 'area_asc':
      sort = { area: 1 };
      break;
    case 'price_asc':
    default:
      sort = { price: 1 };
      break;
  }

  const rooms = await Room.find(match as FilterQuery<RoomDoc>)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return NextResponse.json(rooms);
}