import type { ReactNode } from "react";
import { Fit } from "./fit";
import { ExpandedCell, type ExpandGroup } from "./expand";

/**
 * What goes inside a copy slot. Three kinds, each a flex column that fills
 * its GoldenBox: a label at the top, something fitted in the middle, a foot
 * at the bottom. One fact per square, set as large as the square allows,
 * is what makes a text-driven study readable as squares at all.
 *
 *   Fact    — label, a fitted line, optional body copy, source, and a More
 *             control that expands the slot to a fuller passage, with links
 *             to where the fact continues.
 *   Figure  — a diagram or chart filling the box, with a caption.
 *   LinkBox — a box that is a link to another page of the study.
 *
 * `tone` adds `box--<tone>` for the study's own ground colours. `spoken` is
 * the screen-reader form of a fitted line that does not read as written (a
 * fraction broken across lines, a formula); the visible line is then hidden
 * from assistive technology and the spoken form is real hidden text.
 */
export interface Related { href: string; label: string }

export function Fact({
  label, labelClass, children, fitClass, min, max, body, source, tone, align, spoken, expand, link, imprint, btn,
}: {
  labelClass?: string;
  /** A real button-styled link in the foot: the square's call to action. */
  btn?: { label: string; href: string; variant?: "blue" | "outline" | "dark" };
  /** A decorative drawing behind the text, clipped by the box. */
  imprint?: ReactNode;
  label?: string;
  children: ReactNode;
  fitClass?: string;
  min?: number;
  max?: number;
  body?: ReactNode;
  source?: string;
  tone?: string;
  align?: "top" | "end";
  spoken?: string;
  expand?: { group: ExpandGroup; slotKey: string; title: string; full: ReactNode; source?: string; related?: Related[] };
  link?: { href: string; label: string; aria?: string };
}) {
  return (
    <>
      <div className={`box${tone ? ` box--${tone}` : ""}`}>
        {imprint}
        {label && <p className={`box__label${labelClass ? ` ${labelClass}` : ""}`}>{label}</p>}
        <div className={`box__fit${align ? ` box__fit--${align}` : ""}`}>
          <Fit as="p" className={fitClass} min={min ?? 8} max={max} ariaLabel={spoken}>{children}</Fit>
        </div>
        {body && <div className="box__body"><Fit as="div" className="fit--body" min={12} max={26}>{body}</Fit></div>}
        {(source || expand || link || btn) && (
          <div className="box__foot">
            {source && <span className="box__source">{source}</span>}
            {btn && <a className={`btn btn--${btn.variant ?? "blue"}`} href={btn.href}>{btn.label}</a>}
            {link && <a className="more more--link" href={link.href} aria-label={link.aria}>{link.label}</a>}
            {expand && <button className="more" aria-label={`More: ${expand.title}`} {...expand.group.triggerProps(expand.slotKey)}>More</button>}
          </div>
        )}
      </div>
      {expand && expand.group.isOpen(expand.slotKey) && (
        <ExpandedCell id={expand.group.panelId(expand.slotKey)} title={expand.title} onClose={expand.group.close} closeRef={expand.group.closeRef}>
          {expand.full}
          {expand.source && <p className="cell__source">{expand.source}</p>}
          {expand.related && expand.related.length > 0 && (
            <nav className="cell__related" aria-label="Related">
              <p className="label">Continues</p>
              <ul>{expand.related.map((r) => <li key={r.href}><a href={r.href}>{r.label}</a></li>)}</ul>
            </nav>
          )}
        </ExpandedCell>
      )}
    </>
  );
}

export function Figure({ label, caption, tone, children }: { label?: string; caption?: string; tone?: string; children: ReactNode }) {
  return (
    <figure className={`box box--figure${tone ? ` box--${tone}` : ""}`}>
      {label && <p className="box__label">{label}</p>}
      {children}
      {caption && <figcaption className="box__caption">{caption}</figcaption>}
    </figure>
  );
}

export function LinkBox({ label, href, tone, children }: { label: string; href: string; tone?: string; children: ReactNode }) {
  return (
    <a className={`box${tone ? ` box--${tone}` : ""}`} href={href}>
      <p className="box__label">{label}</p>
      <div className="box__fit"><Fit as="span" min={8}>{children}</Fit></div>
      <div className="box__foot"><span className="box__arrow">Read the section</span></div>
    </a>
  );
}
