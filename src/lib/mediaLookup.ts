// Server-only. Looks for hero/category-cover media by filename
// convention, so swapping in real photos/video never needs a code
// change — just drop a correctly-named file into the right folder.
import fs from "fs";
import path from "path";

const HERO_DIR = path.join(process.cwd(), "public", "hero");
const COVERS_DIR = path.join(process.cwd(), "public", "category-covers");

const VIDEO_EXTENSIONS = [".mp4", ".webm"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function findFile(dir: string, baseName: string, extensions: string[]): string | null {
  if (!fs.existsSync(dir)) return null;
  for (const ext of extensions) {
    if (fs.existsSync(path.join(dir, `${baseName}${ext}`))) {
      return `${baseName}${ext}`;
    }
  }
  return null;
}

export type HeroMedia = { type: "video"; src: string } | { type: "image"; src: string } | null;

/**
 * Priority: a video always wins over an image if both are present
 * (drop in `hero-video.mp4`/`.webm` for a video background, or
 * `hero-image.jpg`/`.jpeg`/`.png`/`.webp` for a still photo). If
 * neither file exists, the Hero component falls back to its built-in
 * generative pattern — so the homepage never breaks while you're
 * still sourcing real footage/photos.
 */
export function getHeroMedia(): HeroMedia {
  const video = findFile(HERO_DIR, "hero-video", VIDEO_EXTENSIONS);
  if (video) return { type: "video", src: `/hero/${video}` };

  const image = findFile(HERO_DIR, "hero-image", IMAGE_EXTENSIONS);
  if (image) return { type: "image", src: `/hero/${image}` };

  return null;
}

/**
 * Category teaser background photo, looked up by category slug (the
 * same slug used in your public/products/<slug>/ folder names, e.g.
 * "fabric" or "shirts"). Drop in `category-covers/fabric.jpg` and it's
 * used automatically; if it's missing, the existing woven-pattern
 * background is used instead.
 */
export function getCategoryCover(categorySlug: string): string | null {
  const image = findFile(COVERS_DIR, categorySlug, IMAGE_EXTENSIONS);
  return image ? `/category-covers/${image}` : null;
}
