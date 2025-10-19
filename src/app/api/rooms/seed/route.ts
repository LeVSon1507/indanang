import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Room } from '@/models/Room';
import { rooms as sampleRooms } from '@/data/rooms';

export async function POST(_req: NextRequest) {
  await connectToDatabase();

  const ops = sampleRooms.map((r) => ({
    updateOne: {
      filter: { url: r.url, title: r.title },
      update: {
        $set: {
          title: r.title,
          price: r.price,
          address: r.address,
          district: r.district,
          area: r.area,
          images: r.images,
          url: r.url,
          postedAt: new Date(r.postedAt),
          source: r.source,
        },
      },
      upsert: true,
    },
  }));

  await Room.bulkWrite(ops);
  const count = await Room.countDocuments();
  return NextResponse.json({ ok: true, count });
}