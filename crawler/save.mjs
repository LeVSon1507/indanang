import { Room } from './db.mjs';

export async function upsertRooms(items) {
  if (!items?.length) return { upserted: 0 };
  const ops = items.map((r) => ({
    updateOne: {
      filter: { url: r.url },
      update: { $set: r },
      upsert: true,
    },
  }));
  const res = await Room.bulkWrite(ops, { ordered: false });
  const upserted = (res.upsertedCount || 0) + (res.modifiedCount || 0);
  return { upserted };
}