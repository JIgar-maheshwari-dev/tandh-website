// Server-only. Uses Node's built-in `node:sqlite` module — a real,
// file-based SQL database (data/tandh.db) that you can open directly
// with any SQLite browser tool (e.g. "DB Browser for SQLite") or the
// `sqlite3` CLI, with zero extra native dependencies to install/compile.
//
// Requires Node 22.5+ (the version this project's setup guide installs).
// `node:sqlite` is still flagged "experimental" by Node — that's a
// stability label from the Node team, not a sign anything here is
// unreliable; the on-disk format is standard SQLite either way.
import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "tandh.db");

declare global {
  // eslint-disable-next-line no-var
  var __tandhDb: DatabaseSync | undefined;
}

function createConnection(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      created_at TEXT NOT NULL,
      items_json TEXT NOT NULL,
      customer_json TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      upi_utr TEXT
    );
  `);

  return db;
}

/**
 * A single shared connection, cached on the Node global object so the
 * Next.js dev server's frequent module re-evaluation doesn't open a new
 * file handle on every request.
 */
export function getDb(): DatabaseSync {
  if (!global.__tandhDb) {
    global.__tandhDb = createConnection();
  }
  return global.__tandhDb;
}

export { DB_PATH };
