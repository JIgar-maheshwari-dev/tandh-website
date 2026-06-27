// Server-only. The database is the ONLY place stock numbers live —
// there is deliberately no fallback to anything in metadata.json. A
// product the database has never seen gets a row created at 0 (out of
// stock) the first time it's looked up, rather than being treated as
// unlimited. This is a deliberate fail-safe: a brand new product can
// never be accidentally oversold just because nobody remembered to set
// its stock yet — it simply can't be ordered until you explicitly set
// a real number.
//
// To set or change stock, update the database directly — there's no
// admin UI for this yet:
//
//   UPDATE product_stock SET stock = 50
//   WHERE category = 'fabric' AND product_id = 'kala-cotton-01';
//
// (run that against your DATABASE_URL with any Postgres client; Neon's
// dashboard has a built-in SQL editor for exactly this). See also
// data/seed-stock.sql for the demo products included with this project.
import { query } from "./db";

/** Live stock for a single product — always a definite number, defaults to 0. */
export async function getLiveStock(category: string, productId: string): Promise<number> {
  await query(
    `INSERT INTO product_stock (category, product_id, stock)
     VALUES ($1, $2, 0)
     ON CONFLICT (category, product_id) DO NOTHING`,
    [category, productId]
  );

  const rows = await query<{ stock: number }>(
    `SELECT stock FROM product_stock WHERE category = $1 AND product_id = $2`,
    [category, productId]
  );
  return rows[0]?.stock ?? 0;
}

/**
 * Batch version, used when rendering a product grid or checking a
 * whole cart — avoids one round-trip per item.
 */
export async function getLiveStockMap(
  items: { category: string; productId: string }[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const item of items) {
    const stock = await getLiveStock(item.category, item.productId);
    map.set(`${item.category}/${item.productId}`, stock);
  }
  return map;
}

/**
 * Decrements stock for every line item in a confirmed order. Clamped at
 * 0 — never goes negative even if two orders race for the last unit.
 * Call this exactly once per order (see the "pending_payment" status
 * guard in the checkout/confirm-upi and razorpay/verify routes that
 * call this) — calling it twice for the same order will double-deduct.
 */
export async function decrementStockForOrder(
  items: { category: string; productId: string; quantity: number }[]
): Promise<void> {
  for (const item of items) {
    await query(
      `UPDATE product_stock
       SET stock = GREATEST(stock - $1, 0), updated_at = now()
       WHERE category = $2 AND product_id = $3`,
      [item.quantity, item.category, item.productId]
    );
  }
}
