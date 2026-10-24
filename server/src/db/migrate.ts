import fs from "fs";
import path from "path";
import { db } from "./index";

export async function runMigrations(): Promise<void> {
  const schemaPaths = [
    path.resolve(__dirname, "schema.sql"),
    path.resolve(__dirname, "../../src/db/schema.sql")
  ];
  const schemaPath = schemaPaths.find(candidate => fs.existsSync(candidate));
  if (!schemaPath) {
    throw new Error(`Migration schema not found. Checked: ${schemaPaths.join(", ")}`);
  }
  const sql = fs.readFileSync(schemaPath, "utf-8");
  console.log("🔄 [MIGRATIONS] Executing schema.sql...");
  await db.executeScript(sql);
  console.log("✅ [MIGRATIONS] Schema successfully initialized.");
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migrations complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
