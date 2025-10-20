import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Place } from '@/models/Place';

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const category = (searchParams.get('category') || '').trim();
  const limit = Math.max(1, Number(searchParams.get('limit') || 200));

  // near query
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = Number(searchParams.get('radius') || 5000); // meters

  // bbox: minLng,minLat,maxLng,maxLat
  const bbox = (searchParams.get('bbox') || '').split(',').map((v) => Number(v));

  const match: Record<string, unknown> = { isActive: true };
  if (q) match['title'] = { $regex: q, $options: 'i' };
  if (category) match['category'] = category;

  let geoFilter: Record<string, unknown> | null = null;
  if (lat && lng) {
    geoFilter = {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: radius,
        },
      },
    };
  } else if (bbox.length === 4 && bbox.every((n) => !Number.isNaN(n))) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    geoFilter = {
      location: {
        $geoWithin: {
          $box: [ [minLng, minLat], [maxLng, maxLat] ],
        },
      },
    };
  }

  const query = geoFilter ? { ...match, ...geoFilter } : match;

  const places = await Place.find(query).limit(limit).lean();
  return NextResponse.json(places);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = await req.json();
  const {
    title,
    description,
    address,
    category,
    lat,
    lng,
    rating,
    priceLevel,
    url,
    images,
    source = 'manual',
  } = body || {};

  if (!title || !category) {
    return NextResponse.json({ error: 'Missing title or category' }, { status: 400 });
  }
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  if (!hasCoords) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
  }

  const doc = await Place.create({
    title,
    description,
    address,
    category,
    location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
    rating,
    priceLevel,
    url,
    images: Array.isArray(images) ? images : [],
    source,
  });

  return NextResponse.json(doc.toObject());
}