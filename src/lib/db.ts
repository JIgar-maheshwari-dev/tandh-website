// Server-only. A standard Postgres connection pool — works with Neon,
// Supabase, Render Postgres, a self-hosted instance, or literally any
// provider that hands you a normal `postgres://...` connection string,
// since this uses the plain `pg` driver rather than a provider-specific
// SDK. Swapping providers later is purely a DATABASE_URL change, not a
// code change.
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __tandhPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __tandhSchemaReady: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local — see .env.local.example " +
        "for how to get a free connection string from Neon."
    );
  }

  // Hosted Postgres providers (Neon, Supabase, Render, etc.) put
  // `sslmode=require` in the connection string they give you, and
  // require SSL to connect at all. A local/self-hosted Postgres
  // typically doesn't. `rejectUnauthorized: false` is the standard
  // pragmatic setting for these providers, which don't expect you to
  // pin a custom CA certificate.
  const needsSsl = connectionString.includes("sslmode=require") || connectionString.includes("neon.tech");

  return new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
}

export function getPool(): Pool {
  if (!global.__tandhPool) {
    global.__tandhPool = createPool();
  }
  return global.__tandhPool;
}

async function createSchema() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      items_json TEXT NOT NULL,
      customer_json TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      upi_utr TEXT
    );
  `);

  // Live stock per product. This is the ONLY place stock numbers live
  // — metadata.json has no stock field at all. A product never seen
  // before gets a row created at 0 the first time it's looked up (see
  // stockStore.ts), so a brand new product defaults to "out of stock"
  // rather than silently unlimited.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_stock (
      category TEXT NOT NULL,
      product_id TEXT NOT NULL,
      stock INTEGER NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (category, product_id)
    );
  `);
}

/**
 * Schema creation only needs to run once per process — this caches the
 * in-flight/completed promise on the Node global so concurrent requests
 * during cold start don't race to create the same tables.
 *
 * This is also the point where a missing/unreachable/wrong
 * DATABASE_URL surfaces — deliberately not swallowed or defaulted
 * anywhere. The app assumes from the very first request (and from the
 * very first `npm run build`) that a working Postgres connection
 * exists; if it doesn't, every page and API route that touches data
 * will fail loudly with the message below rather than silently
 * pretending there's no data.
 */
export function ensureSchema(): Promise<void> {
  if (!global.__tandhSchemaReady) {
    global.__tandhSchemaReady = createSchema().catch((err) => {
      global.__tandhSchemaReady = undefined; // allow retry on the next request
      console.error(
        "\n[tandh studio] Could not connect to the database.\n" +
          "Check that DATABASE_URL in .env.local is set and points to a real, " +
          "reachable Postgres instance (e.g. a Neon project) — see .env.local.example.\n" +
          `Underlying error: ${err instanceof Error ? err.message : String(err)}\n`
      );
      throw err;
    });
  }
  return global.__tandhSchemaReady;
}

/** Convenience wrapper: ensures schema exists, then runs a query. */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureSchema();
  const result = await getPool().query(text, params);
  return result.rows as T[];
}
