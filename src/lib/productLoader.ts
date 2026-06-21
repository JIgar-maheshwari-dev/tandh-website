// Server-only. Reads /public/products/[category]/[productId]/metadata.json
// from disk. This is what gives the site its "drop a folder in, it shows up
// on the site" modular product system — no database, no code changes.
import fs from "fs";
import path from "path";
import type { Product, ProductMetadata } from "@/types";

const PRODUCTS_DIR = path.join(process.cwd(), "public", "products");

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .filter((name) => isDir(path.join(dir, name)));
}

function loadProductFolder(category: string, productId: string): Product | null {
  const productDir = path.join(PRODUCTS_DIR, category, productId);
  const metaPath = path.join(productDir, "metadata.json");
  if (!fs.existsSync(metaPath)) return null;

  try {
    const raw = fs.readFileSync(metaPath, "utf-8");
    const meta = JSON.parse(raw) as ProductMetadata;

    if (!meta.id || !meta.title || meta.price === undefined) {
      console.warn(`[productLoader] Skipping ${category}/${productId}: missing required fields (id, title, price).`);
      return null;
    }

    const images = Array.isArray(meta.images) ? meta.images : [];
    const imagePaths = images
      .filter((img) => fs.existsSync(path.join(productDir, img)))
      .map((img) => `/products/${category}/${productId}/${img}`);

    if (images.length > 0 && imagePaths.length === 0) {
      console.warn(`[productLoader] ${category}/${productId}: none of its listed images exist on disk.`);
    }

    return {
      ...meta,
      category: meta.category || category,
      moq: meta.moq ?? 1,
      moqStep: meta.moqStep ?? 1,
      imagePaths,
    };
  } catch (err) {
    console.error(`[productLoader] Failed to parse metadata.json for ${category}/${productId}:`, err);
    return null;
  }
}

/** All products across all category folders. */
export function getAllProducts(): Product[] {
  const products: Product[] = [];
  for (const category of listDirs(PRODUCTS_DIR)) {
    for (const productId of listDirs(path.join(PRODUCTS_DIR, category))) {
      const product = loadProductFolder(category, productId);
      if (product) products.push(product);
    }
  }
  return products;
}

/** Single product by category + id (used on the product detail page). */
export function getProductById(category: string, productId: string): Product | null {
  return loadProductFolder(category, productId);
}

/** All category folder names currently present on disk. */
export function getCategories(): string[] {
  return listDirs(PRODUCTS_DIR);
}

/** Products filtered to one category. */
export function getProductsByCategory(category: string): Product[] {
  return listDirs(path.join(PRODUCTS_DIR, category))
    .map((productId) => loadProductFolder(category, productId))
    .filter((p): p is Product => p !== null);
}

export function getFeaturedProducts(limit = 8): Product[] {
  return getAllProducts()
    .filter((p) => p.featured)
    .slice(0, limit);
}
