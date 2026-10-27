import { createApp } from "./app";
import { config } from "./config/env";
import { db } from "./db/index";
import { runMigrations } from "./db/migrate";

async function startServer() {
  console.log("================================================================================");
  console.log("                 KIROVA AI — BACKEND APPLICATION SERVER                         ");
  console.log("               Product Vision: 'From Voice to Verified Action'                  ");
  console.log("================================================================================\n");

  await db.init();
  await runMigrations();

  // Auto-seed if users table is empty (ensures demo credentials immediately work on Render)
  try {
    const userCountRes = await db.query("SELECT COUNT(*) AS count FROM users;");
    const count = parseInt(userCountRes.rows[0]?.count || "0", 10);
    if (count === 0) {
      console.log("🌱 [AUTO-SEED] Empty database detected. Running seedDatabase()...");
      const { seedDatabase } = await import("./scripts/seed.js");
      await seedDatabase();
      console.log("✅ [AUTO-SEED] Database seeded successfully on startup.");
    }
  } catch (err) {
    console.warn("⚠️ [AUTO-SEED] Could not verify/seed database on startup:", err);
  }

  const app = createApp();
  const server = app.listen(config.port, "0.0.0.0", () => {
    console.log(`🚀 [SERVER] Kirova AI API listening at http://localhost:${config.port}`);
    console.log(`📡 [HEALTH] Health check available at http://localhost:${config.port}/health\n`);
  });

  const shutdown = async () => {
    console.log("\nGracefully shutting down server...");
    server.close(async () => {
      await db.close();
      console.log("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
