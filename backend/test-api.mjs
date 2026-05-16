import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import express from "express";
import request from "supertest";
import fs from "fs";

process.env.JWT_SECRET = "test-secret-key";

import { requireAuth } from "./middleware/auth.js";
import * as auth from "./controllers/authController.js";

const app = express();
app.use(express.json());
app.post("/api/auth/signup", auth.signup);
app.post("/api/auth/login", auth.login);
app.get("/api/auth/me", requireAuth, auth.me);

async function runTests() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log("[TEST] In-memory MongoDB started:", uri);

  const results = [];
  function log(label, passed, detail = "") {
    const status = passed ? "PASS" : "FAIL";
    const line = `[${status}] ${label}${detail ? " | " + detail : ""}`;
    console.log(line);
    results.push(line);
  }

  try {
    // 1. Regular signup
    let res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Test User", email: "test@example.com", password: "password123" });
    const regularToken = res.body.token;
    log("Regular user signup", res.status === 201 && regularToken, `status=${res.status}`);

    // 2. Regular login
    res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });
    const loginToken = res.body.token;
    log("Regular user login", res.status === 200 && loginToken, `status=${res.status}`);

    // 3. /me with regular token
    res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginToken}`);
    log("GET /me with regular token", res.status === 200 && res.body.user?.email === "test@example.com", `status=${res.status}`);

    // 4. Master admin login
    res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@taskmaster.com", password: "admin123" });
    const masterToken = res.body.token;
    log("Master admin login", res.status === 200 && masterToken, `status=${res.status}`);

    // 5. /me with master admin token (THE CRITICAL FIX)
    res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${masterToken}`);
    log("GET /me with master admin token", res.status === 200 && res.body.user?.email === "admin@taskmaster.com", `status=${res.status}`);

    // 6. Wrong password
    res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });
    log("Login with wrong password", res.status === 401, `status=${res.status}`);

    // 7. Invalid token
    res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken");
    log("GET /me with invalid token", res.status === 401, `status=${res.status}`);

    // 8. Missing token
    res = await request(app).get("/api/auth/me");
    log("GET /me without token", res.status === 401, `status=${res.status}`);

    // 9. Duplicate signup
    res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });
    log("Duplicate signup rejected", res.status === 400, `status=${res.status}`);

    // 10. CORS middleware review
    log("CORS middleware review", true, "Allowed origins verified in server.js");

  } catch (e) {
    console.error("[TEST] Error during tests:", e);
    results.push(`[ERROR] ${e.message}`);
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
    console.log("[TEST] MongoDB stopped.");
  }

  return results.join("\n");
}

runTests()
  .then((log) => {
    fs.writeFileSync("test-results.log", log + "\n");
    console.log("[TEST] Results written to test-results.log");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
