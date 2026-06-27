// Runs automatically before `npm run dev`, `npm run build`, and
// `npm start` (via the pre* npm script hooks in package.json). This app
// assumes a working Postgres connection from the very first moment —
// there's no "works locally with no setup" fallback anymore, since
// stock and order data are never allowed to live anywhere else. This
// script makes that assumption explicit and fails loudly with an
// actionable message instead of letting a misconfigured deploy go
// live and silently misbehave.
import fs from "fs";
import path from "path";
import pg from "pg";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function fail(message) {
  console.error("\n❌ Database check failed — refusing to continue.\n");
  console.error(message);
  console.error(
    "\nSet DATABASE_URL in .env.local to a real, reachable Postgres connection " +
      "string (see .env.local.example for how to get a free one from Neon), " +
      "then try again.\n"
  );
  process.exit(1);
}

async function main() {
  loadEnvLocal();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    fail("DATABASE_URL is not set.");
    return;
  }

  const needsSsl = connectionString.includes("sslmode=require") || connectionString.includes("neon.tech");
  const pool = new pg.Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    await pool.query("SELECT 1");
    console.log("✓ Database connection verified.");
    await pool.end();
  } catch (err) {
    await pool.end().catch(() => {});
    fail(`Could not connect using DATABASE_URL.\nUnderlying error: ${err.message}`);
  }
}

main();
