import type { ReactNode, Ref } from "react";

/**
 * A band is one small-range grid with one editorial job. Bands stack; they
 * do not nest. This wrapper adds the section landmark, the heading as the
 * reference sets it (a 22px title, a grey line under it, a link at the
 * right) and the hidden props readout. A `quiet` band has no heading drawn:
 * its content is the heading, and the title is spoken.
 */
export function Band({
  id, title, sub, note, aside, quiet, wrapRef, before, after, children,
}: {
  id: string;
  title: string;
  sub?: string;
  note?: string;
  aside?: { href: string; label: string };
  quiet?: boolean;
  /** The element whose width the grid takes, for a band that must choose a grid by the room it has. */
  wrapRef?: Ref<HTMLDivElement>;
  /** Content between the heading and the grid, at full width. */
  before?: ReactNode;
  after?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`band${quiet ? " band--quiet" : ""}`} id={id} aria-labelledby={`${id}-title`}>
      <div className="wrap">
        {quiet ? <h2 id={`${id}-title`} className="visually-hidden">{title}</h2> : (
          <header className="band__head">
            <div>
              <h2 id={`${id}-title`} className="band__title">{title}</h2>
              {sub && <p className="band__sub">{sub}</p>}
            </div>
            {aside && <a className="btn btn--quiet band__aside" href={aside.href}>{aside.label}</a>}
          </header>
        )}
        {note && <p className="band__note">{note}</p>}
        {before}
        <div className="band__wrap" ref={wrapRef}>{children}</div>
        {after}
      </div>
    </section>
  );
}
