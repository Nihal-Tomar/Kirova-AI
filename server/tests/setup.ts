import { db } from "../src/db/index";
import { seedDatabase } from "../src/scripts/seed";

let isSeeded = false;

export async function ensureDbSeeded() {
  await db.init();
  if (!isSeeded) {
    const userCount = await db.query("SELECT COUNT(*) as count FROM users");
    if (parseInt(userCount.rows[0].count, 10) === 0) {
      await seedDatabase();
    }
    isSeeded = true;
  }
}
