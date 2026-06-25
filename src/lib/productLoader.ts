// Reads /public/products/[category]/[productId]/metadata.json from
// disk — this is what gives the site its "drop a folder in, it shows
// up on the site" modular product system. Current stock is overlaid
// from the database (see stockStore.ts) on top of whatever static
// metadata.json says, since stock changes as orders come in and
// metadata.json is otherwise static content.
import fs from "fs";
import path from "path";
import type { Product, ProductMetadata } from "@/types";
import { getLiveStock, getLiveStockMap } from "./stockStore";

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

function loadProductFolderRaw(category: string, productId: string): Product | null {
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

/** Single product by category + id, with live stock overlaid. */
export async function getProductById(category: string, productId: string): Promise<Product | null> {
  const product = loadProductFolderRaw(category, productId);
  if (!product) return null;
  const liveStock = await getLiveStock(category, productId, product.stock);
  return { ...product, stock: liveStock };
}

/** All products across all category folders, with live stock overlaid. */
export async function getAllProducts(): Promise<Product[]> {
  const raw: Product[] = [];
  for (const category of listDirs(PRODUCTS_DIR)) {
    for (const productId of listDirs(path.join(PRODUCTS_DIR, category))) {
      const product = loadProductFolderRaw(category, productId);
      if (product) raw.push(product);
    }
  }

  const stockMap = await getLiveStockMap(
    raw.map((p) => ({ category: p.category, productId: p.id, initialStock: p.stock }))
  );

  return raw.map((p) => ({
    ...p,
    stock: stockMap.get(`${p.category}/${p.id}`) ?? p.stock,
  }));
}

/** All category folder names currently present on disk. */
export function getCategories(): string[] {
  return listDirs(PRODUCTS_DIR);
}

/** Products filtered to one category, with live stock overlaid. */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.category === category);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.featured).slice(0, limit);
}
