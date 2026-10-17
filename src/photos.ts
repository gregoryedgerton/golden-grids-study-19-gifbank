import meta from "./photos.json";

/**
 * Photographs are third parties': from Wikimedia Commons, under Creative
 * Commons licences, CC0 or in the public domain. Each shows the fruit or
 * vegetable it stands for, or a field, tree or market where it grows or is
 * sold. `photos.json` records each one's author, licence and page, and its alt
 * text, which is the only place a picture is described.
 */
export interface Photo { key: string; src: string; srcSet: string; alt: string; credit: string; licence: string; page: string; source: string; w: number; h: number }
type Meta = Record<string, { credit: string; licence: string; page: string; source: string; alt: string; w: number; h: number }>;

export function photo(key: string): Photo {
  const m = (meta as Meta)[key];
  if (!m) throw new Error(`photo "${key}" is not in photos.json`);
  const base = `${import.meta.env.BASE_URL}assets/s19-${key}`;
  const small = Math.round(m.w * Math.min(1, 800 / Math.max(m.w, m.h)));
  const large = Math.round(m.w * Math.min(1, 1600 / Math.max(m.w, m.h)));
  return { key, src: `${base}-800.jpg`, srcSet: `${base}-800.jpg ${small}w, ${base}-1600.jpg ${large}w`, alt: m.alt, credit: m.credit, licence: m.licence, page: m.page, source: m.source, w: m.w, h: m.h };
}

/** Photographs that have been drawn on this page, for the credits in the disclosure. */
export const seen = new Set<string>();
