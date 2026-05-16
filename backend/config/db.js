import mongoose from "mongoose";

export async function connectDB() {
  // Fallback through common environment variable names (Railway uses MONGO_URL or DATABASE_URL by default)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("No MongoDB connection string found! Please ensure MONGO_URL or MONGODB_URI is set in Railway Variables.");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}