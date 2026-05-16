import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Master admin bypass — this account does not exist in the DB
    if (payload.sub === "master-admin-id") {
      req.user = {
        _id: "master-admin-id",
        name: "System Admin",
        email: "admin@taskmaster.com",
        role: "admin",
      };
      return next();
    }

    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}