// Server-only. Orders live in the `orders` table in your Postgres
// database (real SQL, queryable from any Postgres client) and are
// mirrored to data/orders.csv on every write — see csvExport.ts.
//
// Function signatures here are intentionally the only thing the rest of
// the app talks to (api routes, the order-confirmation page). That's
// what made swapping the underlying engine from SQLite to Postgres a
// contained change instead of a sprawling one.
import { query } from "./db";
import { exportOrdersToCsv } from "./csvExport";
import type { OrderRecord } from "@/types";

function rowToOrder(row: Record<string, unknown>): OrderRecord {
  return {
    orderId: String(row.order_id),
    userId: String(row.user_id ?? ""),
    userEmail: String(row.user_email ?? ""),
    createdAt: new Date(row.created_at as string).toISOString(),
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

export async function readOrders(): Promise<OrderRecord[]> {
  const rows = await query(`SELECT * FROM orders ORDER BY created_at DESC`);
  return rows.map(rowToOrder);
}

export async function saveOrder(order: OrderRecord): Promise<void> {
  await query(
    `INSERT INTO orders
       (order_id, user_id, user_email, created_at, items_json, customer_json,
        payment_method, amount, currency, status, razorpay_order_id, razorpay_payment_id, upi_utr)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
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
      order.upiUtr ?? null,
    ]
  );
  await exportOrdersToCsv();
}

export async function updateOrder(
  orderId: string,
  patch: Partial<OrderRecord>
): Promise<OrderRecord | null> {
  const existing = await getOrder(orderId);
  if (!existing) return null;
  const merged: OrderRecord = { ...existing, ...patch };

  await query(
    `UPDATE orders SET
       status = $1, razorpay_order_id = $2, razorpay_payment_id = $3, upi_utr = $4
     WHERE order_id = $5`,
    [merged.status, merged.razorpayOrderId ?? null, merged.razorpayPaymentId ?? null, merged.upiUtr ?? null, orderId]
  );
  await exportOrdersToCsv();
  return merged;
}

export async function getOrder(orderId: string): Promise<OrderRecord | null> {
  const rows = await query(`SELECT * FROM orders WHERE order_id = $1`, [orderId]);
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function listOrdersForUser(userId: string): Promise<OrderRecord[]> {
  const rows = await query(`SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  return rows.map(rowToOrder);
}
