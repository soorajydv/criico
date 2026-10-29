import mongoose from "mongoose";

type ConnectionCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Next.js dev hot-reloads modules and serverless functions stay warm between
// requests; caching on globalThis keeps us to one connection pool per process.
const globalForMongoose = globalThis as unknown as { criicoMongoose?: ConnectionCache };
const cache: ConnectionCache = (globalForMongoose.criicoMongoose ??= {
  connection: null,
  promise: null,
});

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.connection) return cache.connection;

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local.");
    }
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cache.connection = await cache.promise;
  } catch (error) {
    // Let the next request retry instead of caching a rejected promise forever.
    cache.promise = null;
    throw error;
  }
  return cache.connection;
}
