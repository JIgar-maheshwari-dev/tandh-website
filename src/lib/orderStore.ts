// Server-only. Orders live in the `orders` table in data/tandh.db (real
// SQL, queryable with any SQLite tool) and are mirrored to
// data/orders.csv on every write — see csvExport.ts.
//
// Function signatures here are intentionally the only thing the rest of
// the app talks to (api routes, the order-confirmation page). That keeps
// this the one file to touch if you ever migrate to Postgres/MySQL.
import { getDb } from "./db";
import { exportOrdersToCsv } from "./csvExport";
import type { OrderRecord } from "@/types";

function rowToOrder(row: Record<string, unknown>): OrderRecord {
  return {
    orderId: String(row.order_id),
    userId: String(row.user_id ?? ""),
    userEmail: String(row.user_email ?? ""),
    createdAt: String(row.created_at),
    items: JSON.parse(String(row.items_json)),
    customer: JSON.parse(String(row.customer_json)),
    paymentMethod: row.payment_method as OrderRecord["paymentMethod"],
    amount: Number(row.amount),
    currency: String(row.currency),
    status: row.status as OrderRecord["status"],
    razorpayOrderId: (row.razorpay_order_id as string) || undefined,
    razorpayPaymentId: (row.razorpay_payment_id as string) || undefined,
    upiUtr: (row.upi_utr as string) || undefined,
  };
}

export function readOrders(): OrderRecord[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
  return (rows as Record<string, unknown>[]).map(rowToOrder);
}

export function saveOrder(order: OrderRecord) {
  const db = getDb();
  db.prepare(
    `INSERT INTO orders
       (order_id, user_id, user_email, created_at, items_json, customer_json,
        payment_method, amount, currency, status, razorpay_order_id, razorpay_payment_id, upi_utr)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    order.orderId,
    order.userId,
    order.userEmail,
    order.createdAt,
    JSON.stringify(order.items),
    JSON.stringify(order.customer),
    order.paymentMethod,
    order.amount,
    order.currency,
    order.status,
    order.razorpayOrderId ?? null,
    order.razorpayPaymentId ?? null,
    order.upiUtr ?? null
  );
  exportOrdersToCsv();
}

export function updateOrder(orderId: string, patch: Partial<OrderRecord>): OrderRecord | null {
  const existing = getOrder(orderId);
  if (!existing) return null;
  const merged: OrderRecord = { ...existing, ...patch };

  const db = getDb();
  db.prepare(
    `UPDATE orders SET
       status = ?, razorpay_order_id = ?, razorpay_payment_id = ?, upi_utr = ?
     WHERE order_id = ?`
  ).run(
    merged.status,
    merged.razorpayOrderId ?? null,
    merged.razorpayPaymentId ?? null,
    merged.upiUtr ?? null,
    orderId
  );
  exportOrdersToCsv();
  return merged;
}

export function getOrder(orderId: string): OrderRecord | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM orders WHERE order_id = ?`).get(orderId);
  return row ? rowToOrder(row as Record<string, unknown>) : null;
}

export function listOrdersForUser(userId: string): OrderRecord[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId);
  return (rows as Record<string, unknown>[]).map(rowToOrder);
}
