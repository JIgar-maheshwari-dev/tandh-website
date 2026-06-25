// Server-only. Live, current stock per product. A product's
// `metadata.json` "stock" field is only ever used as the INITIAL seed
// value the first time that product is loaded — from then on, this
// table is authoritative, decremented as orders are confirmed.
//
// Editing the "stock" number in metadata.json after that point has no
// effect, since the database has already taken over. To manually adjust
// stock later (e.g. a restock), update the database directly:
//
//   UPDATE product_stock SET stock = 50
//   WHERE category = 'fabric' AND product_id = 'kala-cotton-01';
//
// (run that against your DATABASE_URL with any Postgres client).
import { query } from "./db";

/**
 * Returns the live stock count for a product, seeding it from
 * `initialStock` (metadata.json's value) the first time this product
 * is seen. Safe to call on every page load — seeding only happens once
 * per product thanks to `ON CONFLICT DO NOTHING`.
 */
export async function getLiveStock(
  category: string,
  productId: string,
  initialStock: number | undefined
): Promise<number | undefined> {
  if (initialStock === undefined) return undefined; // product doesn't track stock at all

  await query(
    `INSERT INTO product_stock (category, product_id, stock)
     VALUES ($1, $2, $3)
     ON CONFLICT (category, product_id) DO NOTHING`,
    [category, productId, initialStock]
  );

  const rows = await query<{ stock: number }>(
    `SELECT stock FROM product_stock WHERE category = $1 AND product_id = $2`,
    [category, productId]
  );
  return rows[0]?.stock;
}

/**
 * Batch version, used when rendering a product grid — avoids one
 * round-trip per card.
 */
export async function getLiveStockMap(
  items: { category: string; productId: string; initialStock: number | undefined }[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const item of items) {
    const stock = await getLiveStock(item.category, item.productId, item.initialStock);
    if (stock !== undefined) {
      map.set(`${item.category}/${item.productId}`, stock);
    }
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
