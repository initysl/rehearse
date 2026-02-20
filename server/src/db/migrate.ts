import { promises as fs } from "fs";
import path from "path";
import { db } from "../config/db";

const migrationsDir = path.join(__dirname, "migrations");

const runMigrations = async () => {
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migrations found.");
    return;
  }

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = await fs.readFile(fullPath, "utf8");
    console.log(`Running migration: ${file}`);
    await db.query(sql);
  }

  console.log(`Completed ${files.length} migration(s).`);
};

runMigrations()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
