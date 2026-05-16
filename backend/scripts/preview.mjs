/**
 * Local preview: starts MongoDB in-memory, loads the API, then seeds demo users.
 * Run from repo: cd backend && npm run dev:preview
 */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri();
process.env.JWT_SECRET ||= "dev_preview_change_me";
process.env.PORT ||= "5000";
process.env.FRONTEND_URL ||= "http://localhost:5173";

console.log("Using in-memory MongoDB for preview.");

await import("../server.js");

for (let i = 0; i < 150; i++) {
  if (mongoose.connection.readyState === 1) break;
  await new Promise((r) => setTimeout(r, 100));
}
if (mongoose.connection.readyState !== 1) {
  console.error("MongoDB did not connect in time.");
  process.exit(1);
}

process.env.SEED_USE_EXISTING_DB = "1";
await import("../scripts/seed.js");
