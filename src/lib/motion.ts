import { useEffect, useState } from "react";

/**
 * `prefers-reduced-motion`, as state, with the study tools able to force it.
 * Lives beside the viewport hook so a band never carries a media query of
 * its own. A band that animates must render a static layout when this is
 * true — not a slower animation.
 *
 * The tools panel sets `data-motion="reduced"` on the document element so the
 * fallback can be seen (and captured) without changing a system setting.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function read(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.motion === "reduced") return true;
  return window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(read);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setReduced(read());
    // The tools panel's own effect may have set data-motion before this one
    // registered, so read once here as well as on every later change.
    update();
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => { media.removeEventListener("change", update); observer.disconnect(); };
  }, []);
  return reduced;
}
