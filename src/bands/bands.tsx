import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { GoldenGrid, GoldenBox } from "@gifcommit/golden-grids";
import type { PlacementValue } from "@gifcommit/golden-grids";
import { useViewport, type Viewport } from "../lib/viewport";
import { useExpandGroup, type ExpandGroup } from "../lib/expand";
import { plan } from "../lib/plan";
import { Band } from "./Band";

/**
 * The band every page is made of. The reference sets each module as a row or
 * a column of cards at one size; here a module is one grid, the first cell
 * in the largest square and the rest in descending squares.
 *
 * A band may skip the smallest squares (`from` above 1): the library then
 * collapses them into one strip, filled by the band's last child, so the
 * grid is irregular, a run of larger squares with a wide short strip at its
 * corner. That needs room (the smallest visible square must be at least
 * 104px), so below the width where it fits the same children fall back into
 * a plain grid in which the strip's content is simply the smallest square.
 * Landscape or portrait, and which side the largest square takes, are looked
 * up in `lib/spiral.ts`; `variant` turns through the qualifying placements so
 * neighbouring bands differ. Below the desktop width a band of five or six
 * is dealt into two grids, so no square falls under about 114px.
 *
 * A cell is a function of the band's expand group and its own key, so any
 * cell can open in place; `strip` receives `flat` when it really is drawn as
 * the strip, and can lay itself on its side.
 */
export type Cell = (x: ExpandGroup, key: string, flat: boolean) => ReactNode;

/** Deal a long list into bands of at most `max`, as evenly as possible, so no band is left with a single square: 11 becomes 4, 4, 3. */
export function deal<T>(list: T[], max = 5): T[][] {
  const n = Math.ceil(list.length / max);
  const out: T[][] = [];
  let at = 0;
  for (let i = 0; i < n; i++) { const size = Math.ceil((list.length - at) / (n - i)); out.push(list.slice(at, at + size)); at += size; }
  return out;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const read = () => setW(Math.round(el.getBoundingClientRect().width));
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function Grids({ boxes, placement, cw, split }: { boxes: ReactNode[]; placement: PlacementValue; cw: boolean; split: boolean }) {
  if (!split || boxes.length < 5) return <GoldenGrid from={1} to={boxes.length} placement={placement} clockwise={cw}>{boxes}</GoldenGrid>;
  const first = 3, rest = boxes.length - first;
  return (
    <div className="stack">
      <GoldenGrid from={1} to={first} placement="top" clockwise={cw}>{boxes.slice(0, first)}</GoldenGrid>
      <GoldenGrid from={1} to={rest} placement={rest % 2 ? "bottom" : "right"} clockwise={!cw}>{boxes.slice(first)}</GoldenGrid>
    </div>
  );
}
const noteFor = (v: Viewport, n: number, placement: PlacementValue, cw: boolean) => v !== "desktop" && n >= 5 ? `two grids: from=1 to=3 · placement="top" / from=1 to=${n - 3}` : `from=1 to=${n} · placement="${placement}" · clockwise=${cw}`;

export function GridBand({ id, title, sub, aside, quiet, cells, strip, from = 1, variant = 0, lead, before, after }: {
  id: string; title: string; sub?: string; aside?: { href: string; label: string }; quiet?: boolean;
  cells: Cell[]; strip?: Cell; from?: number; variant?: number; lead?: boolean; before?: ReactNode; after?: ReactNode;
}) {
  const v = useViewport();
  const x = useExpandGroup();
  const [ref, width] = useWidth();
  const all = strip ? [...cells, strip] : cells;
  const landscape = v !== "mobile";
  const skipPlan = strip && from > 1 && width > 0 ? plan(width, from, cells.length, landscape, variant, lead) : null;
  const regular = skipPlan ? null : plan(width || 1000, 1, all.length, landscape, variant, lead);
  const p = skipPlan ?? regular ?? { from: 1, to: all.length, placement: (landscape === (all.length % 2 === 0) ? "right" : "bottom") as PlacementValue, cw: true };
  const boxes = all.map((c, i) => {
    const key = `${id}-${i}`;
    const open = x.boxProps(key).className;
    return <GoldenBox key={key} className={`sq${open ? ` ${open}` : ""}`}>{c(x, key, Boolean(skipPlan) && p.from >= 3 && strip === c)}</GoldenBox>;
  });
  const note = skipPlan ? `from=${p.from} to=${p.to} · placement="${p.placement}" · clockwise=${p.cw} · strip = last child` : noteFor(v, all.length, p.placement, p.cw);
  return (
    <Band id={id} title={title} sub={sub} aside={aside} quiet={quiet} note={note} wrapRef={ref} before={before} after={after}>
      {all.length === 1
        ? <div className="solo">{all[0](x, `${id}-0`, false)}</div>
        : skipPlan
          ? <GoldenGrid from={p.from} to={p.to} placement={p.placement} clockwise={p.cw}>{boxes}</GoldenGrid>
          : <Grids placement={p.placement} cw={p.cw} split={v !== "desktop"} boxes={boxes} />}
    </Band>
  );
}
