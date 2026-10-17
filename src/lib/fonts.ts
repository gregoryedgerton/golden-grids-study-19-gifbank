import { useEffect } from "react";

/**
 * Hold display type until the web fonts are in. Call it once in App; it sets
 * `data-fonts-pending` on <html> at once (the stylesheet hides `.fit` and the
 * masthead under it) and removes it when the faces load. Without this the
 * fallback face is painted at one size and the real face at another, a
 * flash of large type on every load. Ask for the faces themselves rather
 * than trusting `fonts.ready`, which iOS Safari can resolve early, and show
 * the type after two seconds whatever the network does. Pass the faces as
 * CSS font shorthands: ["700 1em Fraunces", "400 1em 'Archivo Narrow'"].
 * With no web fonts, do not call this and do not hide anything.
 */
export function useFontsReady(faces: string[]) {
  useEffect(() => {
    const root = document.documentElement;
    const show = () => { delete root.dataset.fontsPending; };
    if (!document.fonts) return;
    root.dataset.fontsPending = "";
    Promise.all(faces.map((f) => document.fonts.load(f).catch(() => []))).then(show, show);
    const timer = setTimeout(show, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
