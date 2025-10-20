import mongoose from "mongoose";

declare global {
  var mongoose:
    | {
        conn: typeof import("mongoose") | null;
        promise: Promise<typeof import("mongoose")> | null;
      }
    | undefined;
}

const cached = global.mongoose ?? { conn: null, promise: null };

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB || "cheap_home",
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  global.mongoose = cached;
  return cached.conn;
}
