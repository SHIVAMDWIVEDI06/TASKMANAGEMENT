import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function signup(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    let finalRole = role === "admin" ? "admin" : "member";
    const hashed = await bcrypt.hash(password, 10);
    const emailStr = String(email).trim().toLowerCase();
    const userName = name ? name.trim() : emailStr.split("@")[0];
    const user = await User.create({
      name: userName,
      email: emailStr,
      password: hashed,
      role: finalRole,
    });
    const token = signToken(user._id);
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
console.log("System Ready - Version 1.0.2");
console.log("Using API Base URL:", baseURL);
    const safe = user.toJSON();
    res.status(201).json({ user: safe, token });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email is already registered" });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(user._id);
    const safe = user.toJSON();
    res.json({ user: safe, token });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}