// Server-only. All user accounts — whether created via Google sign-in
// or email/password — live in the `users` table in your Postgres
// database, and are mirrored to data/users.csv on every write.
import { randomUUID } from "crypto";
import { query } from "./db";
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
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const rows = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

/** Used by the email/password signup flow. */
export async function createCredentialsUser(params: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const id = randomUUID();
  const rows = await query(
    `INSERT INTO users (id, name, email, password_hash, provider)
     VALUES ($1, $2, $3, $4, 'credentials')
     RETURNING *`,
    [id, params.name, params.email.toLowerCase().trim(), params.passwordHash]
  );
  await exportUsersToCsv();
  return rowToUser(rows[0]);
}

/**
 * Called from the NextAuth `signIn` callback for the Google provider.
 * Creates a local user record the first time someone signs in with a
 * given Google account, and reuses it on every subsequent sign-in.
 */
export async function upsertGoogleUser(params: {
  name: string | null;
  email: string;
}): Promise<UserRecord> {
  const existing = await findUserByEmail(params.email);
  if (existing) return existing;

  const id = randomUUID();
  const rows = await query(
    `INSERT INTO users (id, name, email, password_hash, provider)
     VALUES ($1, $2, $3, NULL, 'google')
     RETURNING *`,
    [id, params.name, params.email.toLowerCase().trim()]
  );
  await exportUsersToCsv();
  return rowToUser(rows[0]);
}

export async function listUsers(): Promise<UserRecord[]> {
  const rows = await query(`SELECT * FROM users ORDER BY created_at DESC`);
  return rows.map(rowToUser);
}
