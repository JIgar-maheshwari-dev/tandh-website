// Server-only. All user accounts — whether created via Google sign-in
// or email/password — live in the `users` table in data/tandh.db, and
// are mirrored to data/users.csv on every write.
import { randomUUID } from "crypto";
import { getDb } from "./db";
import { exportUsersToCsv } from "./csvExport";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string | null;
  provider: "google" | "credentials";
  createdAt: string;
}

function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id),
    name: (row.name as string) ?? null,
    email: String(row.email),
    passwordHash: (row.password_hash as string) ?? null,
    provider: row.provider as "google" | "credentials",
    createdAt: String(row.created_at),
  };
}

export function findUserByEmail(email: string): UserRecord | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase().trim());
  return row ? rowToUser(row as Record<string, unknown>) : null;
}

export function findUserById(id: string): UserRecord | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  return row ? rowToUser(row as Record<string, unknown>) : null;
}

/** Used by the email/password signup flow. */
export function createCredentialsUser(params: {
  name: string;
  email: string;
  passwordHash: string;
}): UserRecord {
  const db = getDb();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, provider, created_at)
     VALUES (?, ?, ?, ?, 'credentials', ?)`
  ).run(id, params.name, params.email.toLowerCase().trim(), params.passwordHash, createdAt);
  exportUsersToCsv();
  return { id, name: params.name, email: params.email, passwordHash: params.passwordHash, provider: "credentials", createdAt };
}

/**
 * Called from the NextAuth `signIn` callback for the Google provider.
 * Creates a local user record the first time someone signs in with a
 * given Google account, and reuses it on every subsequent sign-in.
 */
export function upsertGoogleUser(params: { name: string | null; email: string }): UserRecord {
  const existing = findUserByEmail(params.email);
  if (existing) return existing;

  const db = getDb();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, provider, created_at)
     VALUES (?, ?, ?, NULL, 'google', ?)`
  ).run(id, params.name, params.email.toLowerCase().trim(), createdAt);
  exportUsersToCsv();
  return { id, name: params.name, email: params.email, passwordHash: null, provider: "google", createdAt };
}

export function listUsers(): UserRecord[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all();
  return (rows as Record<string, unknown>[]).map(rowToUser);
}
