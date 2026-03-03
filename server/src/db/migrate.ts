import { promises as fs } from "fs";
import path from "path";
import { db } from "../config/db";

const migrationsDir = path.join(__dirname, "migrations");
const migrationsTable = "public.schema_migrations";

const ensureMigrationsTable = async (): Promise<void> => {
  await db.query(
    `CREATE TABLE IF NOT EXISTS ${migrationsTable} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );
};

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const result = await db.query<{ name: string }>(
    `SELECT name FROM ${migrationsTable}`
  );
  return new Set(result.rows.map((row) => row.name));
};

const isDuplicateObjectError = (error: unknown): boolean => {
  const code = (error as { code?: string })?.code;
  return code === "42P07" || code === "42710" || code === "42723";
};

const runMigrations = async () => {
  await ensureMigrationsTable();

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migrations found.");
    return;
  }

  const applied = await getAppliedMigrations();
  let appliedCount = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping already applied migration: ${file}`);
      continue;
    }

    const fullPath = path.join(migrationsDir, file);
    const sql = await fs.readFile(fullPath, "utf8");
    console.log(`Running migration: ${file}`);

    try {
      await db.query("BEGIN");
      await db.query(sql);
      await db.query(
        `INSERT INTO ${migrationsTable} (name) VALUES ($1)`,
        [file]
      );
      await db.query("COMMIT");
      appliedCount += 1;
    } catch (error) {
      await db.query("ROLLBACK");

      if (isDuplicateObjectError(error)) {
        console.warn(
          `Migration ${file} appears to have been applied previously (duplicate object). Marking as applied.`
        );
        await db.query(
          `INSERT INTO ${migrationsTable} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
          [file]
        );
        continue;
      }

      throw error;
    }
  }

  console.log(`Completed ${appliedCount} new migration(s).`);
};

runMigrations()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
