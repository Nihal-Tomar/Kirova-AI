import { createApp } from "./app";
import { config } from "./config/env";
import { db } from "./db/index";
import { runMigrations } from "./db/migrate";

async function startServer() {
  console.log("================================================================================");
  console.log("               KAARYASETU AI — BACKEND APPLICATION SERVER                      ");
  console.log("               Product Vision: 'From Voice to Verified Action'                  ");
  console.log("================================================================================\n");

  await db.init();
  await runMigrations();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`🚀 [SERVER] KaaryaSetu API listening at http://localhost:${config.port}`);
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
