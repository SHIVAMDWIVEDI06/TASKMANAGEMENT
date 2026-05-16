import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";
const MEMBER_EMAIL = process.env.SEED_MEMBER_EMAIL || "member@example.com";
const MEMBER_PASSWORD = process.env.SEED_MEMBER_PASSWORD || "member123";

async function seed() {
  if (!process.env.SEED_USE_EXISTING_DB) {
    await connectDB();
  }
  const hashedAdmin = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const hashedMember = await bcrypt.hash(MEMBER_PASSWORD, 10);

  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      name: "Demo Admin",
      email: ADMIN_EMAIL,
      password: hashedAdmin,
      role: "admin",
    });
    console.log("Created admin:", ADMIN_EMAIL);
  } else {
    console.log("Admin already exists:", ADMIN_EMAIL);
  }

  let member = await User.findOne({ email: MEMBER_EMAIL });
  if (!member) {
    member = await User.create({
      name: "Demo Member",
      email: MEMBER_EMAIL,
      password: hashedMember,
      role: "member",
    });
    console.log("Created member:", MEMBER_EMAIL);
  } else {
    console.log("Member already exists:", MEMBER_EMAIL);
  }

  if (!process.env.SEED_USE_EXISTING_DB) {
    await mongoose.disconnect();
  }
  console.log("Seed complete.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});