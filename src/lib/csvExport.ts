// Server-only. Keeps a plain-text data/users.csv and data/orders.csv in
// sync with the Postgres database on every write, so you can open them
// directly in Excel/Google Sheets without needing any database tool —
// just the files in the project's /data folder. These are a generated
// export, not the source of truth — the database is authoritative, so
// it's fine if this local file doesn't survive a server restart on an
// ephemeral host; it's regenerated fresh from the database the moment
// anything writes again, or whenever the admin export endpoints below
// are hit.
import fs from "fs";
import path from "path";
import { query } from "./db";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_CSV = path.join(DATA_DIR, "users.csv");
const ORDERS_CSV = path.join(DATA_DIR, "orders.csv");

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((col) => csvEscape(row[col])).join(","));
  return [header, ...lines].join("\n") + "\n";
}

function safeWrite(filePath: string, content: string) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
  } catch (err) {
    // On some read-only deployment filesystems this write can fail —
    // that's fine, the admin export endpoints regenerate from the
    // database directly rather than relying on this file existing.
    console.warn(`[csvExport] Could not write ${filePath}:`, err);
  }
}

export async function getUsersCsv(): Promise<string> {
  const rows = await query(
    `SELECT id, name, email, provider, created_at FROM users ORDER BY created_at DESC`
  );
  return toCsv(rows, ["id", "name", "email", "provider", "created_at"]);
}

export async function exportUsersToCsv() {
  const csv = await getUsersCsv();
  safeWrite(USERS_CSV, csv);
}

export async function getOrdersCsv(): Promise<string> {
  const rows = await query(
    `SELECT order_id, user_email, created_at, payment_method, amount, currency, status,
            upi_utr, razorpay_payment_id, items_json, customer_json
     FROM orders ORDER BY created_at DESC`
  );

  // Flatten items + address into readable single-cell summaries rather
  // than raw JSON, so the sheet is actually legible at a glance.
  const flattened = rows.map((row) => {
    let itemsSummary = "";
    let addressSummary = "";
    try {
      const items = JSON.parse(String(row.items_json)) as Array<{
        title: string;
        quantity: number;
        moqUnit?: string;
      }>;
      itemsSummary = items.map((i) => `${i.title} x${i.quantity}${i.moqUnit ? " " + i.moqUnit : ""}`).join("; ");
    } catch {
      itemsSummary = "";
    }
    try {
      const c = JSON.parse(String(row.customer_json)) as {
        name: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
      };
      addressSummary = [c.name, c.phone, c.addressLine1, c.addressLine2, c.city, c.state, c.pincode]
        .filter(Boolean)
        .join(", ");
    } catch {
      addressSummary = "";
    }
    return {
      order_id: row.order_id,
      customer_email: row.user_email,
      created_at: row.created_at,
      items: itemsSummary,
      shipping_address: addressSummary,
      payment_method: row.payment_method,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      upi_utr: row.upi_utr,
      razorpay_payment_id: row.razorpay_payment_id,
    };
  });

  return toCsv(flattened, [
    "order_id",
    "customer_email",
    "created_at",
    "items",
    "shipping_address",
    "payment_method",
    "amount",
    "currency",
    "status",
    "upi_utr",
    "razorpay_payment_id",
  ]);
}

export async function exportOrdersToCsv() {
  const csv = await getOrdersCsv();
  safeWrite(ORDERS_CSV, csv);
}
