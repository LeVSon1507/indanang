import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Room } from '@/models/Room';

export async function GET() {
  await connectToDatabase();

  const [districts, sources] = await Promise.all([
    Room.distinct('district'),
    Room.distinct('source'),
  ]);

  const priceStats = await Room.aggregate([
    { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
  ]);
  const areaStats = await Room.aggregate([
    { $group: { _id: null, min: { $min: '$area' }, max: { $max: '$area' } } },
  ]);
  const count = await Room.countDocuments();

  const priceRange = priceStats[0] ? { min: priceStats[0].min || 0, max: priceStats[0].max || 0 } : { min: 0, max: 0 };
  const areaRange = areaStats[0] ? { min: areaStats[0].min || 0, max: areaStats[0].max || 0 } : { min: 0, max: 0 };

  return NextResponse.json({
    districts: districts.filter(Boolean).sort((a: string, b: string) => a.localeCompare(b)),
    sources: sources.filter(Boolean).sort((a: string, b: string) => a.localeCompare(b)),
    priceRange,
    areaRange,
    count,
  });
}