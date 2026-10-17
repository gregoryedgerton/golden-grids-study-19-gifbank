import { useEffect, useState, type ReactNode } from "react";
import { useViewport } from "./viewport";
import "./tools.css";

/**
 * Study tools — a floating panel on its own stacking layer, styled
 * independently of the study so every study carries the same controls
 * without the design knowing they exist.
 *
 * Controls write attributes on <html>; the CSS in tools.css keys off them:
 *   data-inspect="on"  marching-ants outlines on every grid, dotted outlines
 *                      and DOM-order labels on every slot (P = placeholder).
 *   data-notes="on"    the per-band from/to/placement readouts.\n *   data-motion="reduced"  forces the reduced-motion fallback, so it can be\n *                          seen and captured without a system setting.
 * Both are OFF by default. Toggles made in the panel or by key persist in
 * localStorage; the URL (?inspect=1&notes=1) sets them for that load only, so
 * captures can be taken with them on without changing a visitor's setting.
 * Keyboard: `g` toggles inspect, `n` toggles notes, Esc closes the panel.
 */
type Key = "inspect" | "notes" | "motion";
const STORAGE = "gg-tools";

function readInitial(): Record<Key, boolean> {
  const state: Record<Key, boolean> = { inspect: false, notes: false, motion: false };
  if (typeof window === "undefined") return state;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    for (const k of ["inspect", "notes", "motion"] as Key[]) if (typeof saved[k] === "boolean") state[k] = saved[k];
  } catch {}
  const q = new URLSearchParams(window.location.search);
  for (const k of ["inspect", "notes", "motion"] as Key[]) {
    if (q.has(k)) state[k] = q.get(k) !== "0";
  }
  return state;
}

/** The panel is hidden until it has a better trigger (Greg, 2026-10-07): it
 *  used to own the viewport's top-right corner, which is where a drill-down's
 *  Close belongs. `?tools=1` shows it in the meantime; the g/n/m keys still
 *  work without it. */
const TOOLS_SHOWN = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tools") === "1";

export function Tools({ children }: { children?: ReactNode }) {
  const [state, setState] = useState(readInitial);
  const [open, setOpen] = useState(false);
  const viewport = useViewport();
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 0 : window.innerWidth));

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.inspect = state.inspect ? "on" : "off";
    root.dataset.notes = state.notes ? "on" : "off";
    if (state.motion) root.dataset.motion = "reduced"; else delete root.dataset.motion;
  }, [state]);

  const persist = (next: Record<Key, boolean>) => {
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch {}
    return next;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "g") setState((s) => persist({ ...s, inspect: !s.inspect }));
      if (e.key === "n") setState((s) => persist({ ...s, notes: !s.notes }));
      if (e.key === "m") setState((s) => persist({ ...s, motion: !s.motion }));
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
  }, []);

  const toggle = (k: Key) => setState((s) => persist({ ...s, [k]: !s[k] }));

  if (!TOOLS_SHOWN) return null;
  return (
    <div className="gg-tools" data-open={open ? "true" : "false"}>
      <button type="button" className="gg-tools__tab" aria-expanded={open} aria-controls="gg-tools-panel" onClick={() => setOpen((o) => !o)}>
        Tools
      </button>
      <div id="gg-tools-panel" className="gg-tools__panel" hidden={!open}>
        <p className="gg-tools__meta">
          <span>{viewport}</span> · {width}px
        </p>
        <label className="gg-tools__row">
          <input type="checkbox" checked={state.inspect} onChange={() => toggle("inspect")} />
          <span>Show grids <kbd>g</kbd></span>
        </label>
        <label className="gg-tools__row">
          <input type="checkbox" checked={state.notes} onChange={() => toggle("notes")} />
          <span>Band notes <kbd>n</kbd></span>
        </label>
        <label className="gg-tools__row">
          <input type="checkbox" checked={state.motion} onChange={() => toggle("motion")} />
          <span>Reduced motion <kbd>m</kbd></span>
        </label>
        {children}
        <p className="gg-tools__hint">Slot labels are DOM order: placeholder first, then smallest to largest. The hero is last.</p>
      </div>
    </div>
  );
}
