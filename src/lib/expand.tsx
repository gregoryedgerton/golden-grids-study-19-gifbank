import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import "./expand.css";

/**
 * Expand a cell. A slot that shows a summary becomes the whole band and
 * shows the rest; the same box, the same band, more content. This is the
 * study's answer to content a slot cannot hold — the reference reaches for
 * a modal; here the spiral's slot becomes the page.
 *
 * Mechanics: the GoldenBox that owns the summary gets `cell--expanded`, and
 * expand.css uses `:has()` to release the grid's fixed proportion, take the
 * sibling slots out of the flow, and return the expanded slot to normal
 * flow, where its content sets the height. The band grows and everything
 * below it moves down — nothing scrolls inside a box. The library is not
 * touched; its inline geometry is overridden only for the duration.
 *
 * A band may have several expandable slots (every photograph is one), so the
 * primitive is a GROUP keyed by slot: at most one is open, and the keys are
 * the band's own. `useExpand()` is the single-slot case.
 *
 * What the overlay implies, and therefore does:
 *   - Everything the panel covers is `inert` while it is open, so nothing
 *     underneath can be tabbed to or read.
 *   - Escape closes only the panel that contains focus.
 *   - One cell at a time, across the whole page.
 *   - The band grows to fit the panel and everything below moves down; the
 *     panel has no scroll container of its own.
 */

/** Every open cell's close function, so opening one can close the others. */
const openCells = new Set<() => void>();

export interface ExpandGroup {
  openKey: string | null;
  isOpen: (key: string) => boolean;
  close: () => void;
  panelId: (key: string) => string;
  /** Spread on the GoldenBox that owns the slot. */
  boxProps: (key: string) => { className?: string };
  /** Spread on whatever opens it: a button, or an image's hit area. */
  triggerProps: (key: string) => {
    ref: (el: HTMLButtonElement | null) => void;
    type: "button";
    "aria-expanded": boolean;
    "aria-controls": string | undefined;
    onClick: () => void;
  };
  closeRef: React.RefObject<HTMLButtonElement | null>;
}

export function useExpandGroup(): ExpandGroup {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement | null>());
  const closeRef = useRef<HTMLButtonElement>(null);
  const base = useId();
  const panelId = useCallback((key: string) => `${base}${key}`, [base]);

  const close = useCallback(() => {
    setOpenKey((k) => {
      if (k) requestAnimationFrame(() => triggers.current.get(k)?.focus());
      return null;
    });
  }, []);

  const open = useCallback((key: string) => {
    for (const other of openCells) other();
    setOpenKey(key);
  }, []);

  // Escape, scoped to the panel that has focus. Capture phase so this runs
  // before the tools panel's own window listener and can stop it.
  useEffect(() => {
    if (!openKey) return;
    openCells.add(close);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const panel = document.getElementById(panelId(openKey));
      if (!panel || !panel.contains(document.activeElement)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      openCells.delete(close);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [openKey, close, panelId]);

  return {
    openKey,
    isOpen: (key) => openKey === key,
    close,
    panelId,
    boxProps: (key) => ({ className: openKey === key ? "cell--expanded" : undefined }),
    triggerProps: (key) => ({
      ref: (el: HTMLButtonElement | null) => { triggers.current.set(key, el); },
      type: "button" as const,
      "aria-expanded": openKey === key,
      "aria-controls": openKey === key ? panelId(key) : undefined,
      onClick: () => (openKey === key ? close() : open(key)),
    }),
    closeRef,
  };
}

/** The single-slot case: one summary, one panel. */
export function useExpand() {
  const group = useExpandGroup();
  const KEY = "main";
  return {
    expanded: group.isOpen(KEY),
    open: () => group.triggerProps(KEY).onClick(),
    close: group.close,
    panelId: group.panelId(KEY),
    boxProps: group.boxProps(KEY),
    triggerProps: group.triggerProps(KEY),
    closeRef: group.closeRef,
  };
}

/**
 * The expanded view: a header with a close control and a body.
 * Focus lands on Close on every mount, so a breakpoint change that remounts
 * the panel in a different slot does not drop focus. Everything the panel
 * covers — its own summary, the trigger, the sibling slots — is made inert
 * for as long as it is open.
 */
export function ExpandedCell({
  id, title, onClose, closeRef, children,
}: {
  id: string;
  title: string;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, [closeRef]);

  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const grid = panel.closest(".golden-grid");
    if (!grid) return;
    const covered: HTMLElement[] = [];
    // Walk down from each slot until the panel's own branch is left; the
    // GoldenBox wrapper of the expanded slot holds both the summary and the
    // panel, so it is descended into rather than inerted whole.
    const mark = (node: Element) => {
      for (const child of Array.from(node.children)) {
        if (child === panel) continue;
        if (child.contains(panel)) { mark(child); continue; }
        const el = child as HTMLElement;
        if (el.inert) continue;
        el.inert = true;
        covered.push(el);
      }
    };
    mark(grid);
    return () => { for (const el of covered) el.inert = false; };
  }, []);

  return (
    <section className="cell" id={id} ref={ref} aria-label={title}>
      <header className="cell__head">
        <h3 className="cell__title">{title}</h3>
        {/* ONE way out, where a reader expects it: the top right of the open
            window, in a sticky head so it stays reachable down a long
            passage. Escape closes too. The study tools panel, which used to
            own that corner, is hidden (Greg, 2026-10-07) until it has a
            better trigger; nothing else may be drawn over this control. */}
        <button ref={closeRef} type="button" className="cell__close" onClick={onClose} aria-label="Close" aria-keyshortcuts="Escape"><span className="cell__x" aria-hidden="true">×</span><span className="cell__closeword">Close</span></button>
      </header>
      <div className="cell__body">{children}</div>
    </section>
  );
}

/**
 * An image that opens its own slot. Every photograph on the page is one, so
 * a reader who wants a closer look does not have to find a call to action —
 * the picture is the control. The button covers the figure rather than
 * wrapping the image, so the alt text stays on the image where it belongs.
 */
export function ExpandableMedia({
  group, slotKey, src, alt, objectPosition, caption, className, children,
}: {
  group: ExpandGroup;
  slotKey: string;
  src: string;
  alt: string;
  objectPosition?: string;
  caption?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <figure className={className ?? "media media--inset"}>
      <img src={src} alt={alt} style={objectPosition ? { objectPosition } : undefined} />
      <button className="media__open" {...group.triggerProps(slotKey)}>
        <span className="visually-hidden">Open {caption ?? alt}</span>
      </button>
      {caption && <figcaption className="media__caption">{caption}</figcaption>}
      {children}
    </figure>
  );
}

/** What an expanded photograph shows: the picture, big, and its caption. */
export function PhotoView({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="cell__photo">
      <img src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
