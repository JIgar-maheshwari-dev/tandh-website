-- Run this once against your DATABASE_URL to give the three demo
-- products some starting stock, since stock no longer lives in
-- metadata.json — see src/lib/stockStore.ts.
--
--   psql "$DATABASE_URL" -f data/seed-stock.sql
--
-- (or paste it into Neon's dashboard SQL editor)
--
-- Any product the app hasn't seen a stock row for yet defaults to 0
-- (out of stock) automatically — this script is just convenient
-- starting numbers for the bundled demo products so they're orderable
-- right away. For your own real products, use the same INSERT pattern
-- with your own category/product-id/quantity.

INSERT INTO product_stock (category, product_id, stock)
VALUES
  ('fabric', 'kala-cotton-01', 24),
  ('shirts', 'bhujodi-shirt-01', 14),
  ('kurtis', 'indigo-kurti-01', 9)
ON CONFLICT (category, product_id)
DO UPDATE SET stock = EXCLUDED.stock, updated_at = now();
