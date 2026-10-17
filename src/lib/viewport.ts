import { useEffect, useState } from "react";

/**
 * The one place breakpoints live.
 *
 * Golden Grids owns no breakpoints — which box matters at 390px is a content
 * decision, so the consumer owns it. This hook is that decision's home. Each
 * band reads the viewport and picks its own range and placement; no band
 * carries a media query of its own.
 *
 * Three states, not two. A narrow/wide boolean resolves tablet by picking one
 * of the other two badly, and tablet is where the series expects to win.
 * Thresholds bracket the three reference widths (390, 820, 1440) used for
 * every capture and every side-by-side.
 */
export type Viewport = "mobile" | "tablet" | "desktop";

const QUERIES: Record<Exclude<Viewport, "mobile">, string> = {
  tablet: "(min-width: 640px)",
  desktop: "(min-width: 1100px)",
};

function read(): Viewport {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia(QUERIES.desktop).matches) return "desktop";
  if (window.matchMedia(QUERIES.tablet).matches) return "tablet";
  return "mobile";
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(read);

  useEffect(() => {
    const lists = Object.values(QUERIES).map((q) => window.matchMedia(q));
    const update = () => setViewport(read());
    lists.forEach((l) => l.addEventListener("change", update));
    return () => lists.forEach((l) => l.removeEventListener("change", update));
  }, []);

  return viewport;
}

/** Pick a per-viewport value. Bands use this to choose range and placement. */
export function pick<T>(viewport: Viewport, values: Record<Viewport, T>): T {
  return values[viewport];
}
