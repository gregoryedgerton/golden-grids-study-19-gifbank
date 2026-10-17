import type { PlacementValue } from "@gifcommit/golden-grids";
import { SPIRAL } from "./spiral";

/**
 * Choosing a grid. The library lays a spiral of squares from F(from) to
 * F(to) and, when `from` is above 1, collapses the smaller squares it
 * skipped into one placeholder strip F(from) × F(from − 1) units, filled by
 * the LAST child. Whether the result is wider than tall depends on `from`,
 * `to`, the placement and the direction, and where the largest square sits
 * depends on the same; `spiral.ts` is that table, generated from the
 * library's render model, so a band can ask for what it wants (a landscape
 * grid, the lead on the left) and get a placement that delivers it.
 */
const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
const SHORT: Record<string, PlacementValue> = { r: "right", b: "bottom", l: "left", t: "top" };

export interface Plan { from: number; to: number; placement: PlacementValue; cw: boolean; landscape: boolean; hero: string; unit: number; widthUnits: number; heightUnits: number }

function candidates(from: number, to: number, landscape: boolean) {
  const out: Plan[] = [];
  for (const p of ["r", "b", "l", "t"]) for (const d of ["c", "a"]) {
    const e = SPIRAL[`${from}.${to}.${p}${d}`];
    if (!e || Boolean(e[0]) !== landscape) continue;
    out.push({ from, to, placement: SHORT[p], cw: d === "c", landscape, hero: e[1], unit: 0, widthUnits: e[2], heightUnits: e[3] });
  }
  return out;
}

/** The smallest a square may be, in px, for a plan to be worth drawing. */
export const MIN_SQUARE = 104;

/**
 * A plan for `count` visible squares starting at `from`, in a band `width`
 * px wide. `lead` asks for the largest square to be first in reading order
 * (left of a landscape grid, top of a portrait one). `variant` picks among
 * the placements that qualify, so neighbouring bands differ. Returns null if
 * the smallest visible square (or the strip's short side) would be too small.
 */
export function plan(width: number, from: number, count: number, landscape: boolean, variant: number, lead = false): Plan | null {
  const to = from + count - 1;
  let list = candidates(from, to, landscape);
  if (lead) list = list.filter((c) => c.hero === (landscape ? "l" : "t"));
  if (!list.length) return null;
  const pick = list[((variant % list.length) + list.length) % list.length];
  const unit = width / pick.widthUnits;
  const smallest = FIB[from - 1] * unit;
  // The strip is F(from) by F(from - 1) units; it must hold a figure and its label.
  const stripShort = from > 1 ? FIB[from - 2] * unit : Infinity;
  const stripLong = from > 1 ? FIB[from - 1] * unit : Infinity;
  if (from > 1 && (smallest < MIN_SQUARE || stripShort < 64 || stripLong < 100)) return null;
  return { ...pick, unit };
}
