import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Type that fits its container. The reference sets every heading at one size
 * and lets the column decide how many lines it takes; a golden grid hands
 * each fact a box of a different size, so the type has to meet the box.
 *
 * Binary search on font-size, in CSS pixels, until the element's scroll box
 * no longer exceeds its parent's content box on either axis. Re-run when
 * the parent resizes (ResizeObserver) and on fonts loading, since a fallback
 * face measures differently from the one it stands in for. Same idea as
 * fitty, written here so the study owns the whole page.
 *
 * The fitted line stays invisible until the fonts have loaded and it has
 * been fitted once (styles.css keys off `data-fit` and `html[data-fonts]`),
 * which is what stops the large type from flashing: without it the fallback
 * face is painted at one size and the real face at another.
 *
 * The element must not have a CSS transition on font-size, however short:
 * the measurement after each write is synchronous and would read the
 * pre-transition size. styles.css pins `.fit { transition: none }`.
 */
export function Fit({
  as: Tag = "span",
  min = 12,
  max = 320,
  className,
  ariaLabel,
  children,
}: {
  as?: ElementType;
  min?: number;
  max?: number;
  className?: string;
  /** Spoken form, when the visible line is a formula broken across lines. */
  ariaLabel?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;

    const fits = (px: number) => {
      el.style.fontSize = `${px}px`;
      return el.scrollWidth <= box.clientWidth && el.scrollHeight <= box.clientHeight;
    };
    const run = () => {
      let lo = min;
      let hi = max;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid; else hi = mid;
      }
      el.style.fontSize = `${Math.floor(lo * 2) / 2}px`;
    };

    // Hidden until the first fit and until the web fonts are in, so the
    // reader never sees the fallback face at a size chosen for it, or a
    // large line re-sizing itself. Each run is a burst of synchronous
    // layouts inside one frame; nothing between them is painted.
    run();
    el.dataset.fit = "ready";
    // Observe the line as well as its box: when the web font arrives the
    // line's own size changes (the fallback face has other metrics), and on
    // iOS Safari `fonts.ready` can resolve before that happens. A re-run that
    // lands on the same size changes nothing, so the observer settles.
    const observer = new ResizeObserver(run);
    observer.observe(box);
    observer.observe(el);
    if (document.fonts) {
      document.fonts.ready.then(run);
      // Ask for this element's own face explicitly; the promise resolves
      // when that face is usable, which is the moment the metrics change.
      const { fontStyle, fontWeight, fontFamily } = getComputedStyle(el);
      document.fonts.load(`${fontStyle} ${fontWeight} 1em ${fontFamily}`).then(run, run);
      document.fonts.addEventListener("loadingdone", run);
    }
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", run);
    };
  }, [min, max, children]);

  return (
    <>
      <Tag ref={ref} className={["fit", className].filter(Boolean).join(" ")} aria-hidden={ariaLabel ? true : undefined}>
        {children}
      </Tag>
      {/* aria-label is unreliable on a paragraph, so the spoken form is real
          text, visually hidden, beside the line it stands for. */}
      {ariaLabel && <span className="visually-hidden">{ariaLabel}</span>}
    </>
  );
}
