import type { ReactNode } from "react";
import { ExpandedCell, type ExpandGroup } from "./expand";
import { Fact as FactBox } from "./boxes";
import { Fit } from "./fit";
import { photo, seen } from "../photos";

/** Shared cells: a photograph that opens to itself, a figure as large type, the strip of a skipped range, a square of type. */

export function Pic({ k, sizes = "(min-width: 1100px) 50vw, 100vw", eager, pos }: { k: string; sizes?: string; eager?: boolean; pos?: string }) {
  const p = photo(k);
  seen.add(k);
  return <img src={p.src} srcSet={p.srcSet} sizes={sizes} alt={p.alt} loading={eager ? "eager" : "lazy"} decoding="async" style={pos ? { objectPosition: pos } : undefined} />;
}

export function Credit({ k }: { k: string }) {
  const p = photo(k);
  return <figcaption className="credit">Photograph: <a href={p.page}>{p.credit}</a>, {p.source}, {p.licence}.</figcaption>;
}

/** A photograph on its own, opening to itself. */
export function PhotoCard({ k, title, x, slotKey, children }: { k: string; title: string; x: ExpandGroup; slotKey: string; children?: ReactNode }) {
  return (
    <>
      <figure className="card card--photo">
        <div className="card__media">
          <Pic k={k} sizes="(min-width: 1100px) 50vw, 100vw" />
          <button className="media__open" {...x.triggerProps(slotKey)}><span className="visually-hidden">Open the photograph: {title}</span></button>
          {children}
        </div>
      </figure>
      {x.isOpen(slotKey) && (
        <ExpandedCell id={x.panelId(slotKey)} title={title} onClose={x.close} closeRef={x.closeRef}>
          <figure className="cell__photo cell__photo--full"><Pic k={k} sizes="100vw" /><Credit k={k} /></figure>
        </ExpandedCell>
      )}
    </>
  );
}

export interface Fact { line: string; label?: string; body?: string; tone?: "tile" | "blue" | "green" | "ink"; short?: string; spoken?: string }

/** A figure as large type on a flat tile. */
export function FactTile({ f }: { f: Fact }) {
  return (
    <FactBox label={f.label} fitClass="fit--display fit--num" max={120} tone={`${f.tone ?? "tile"}${(f.body?.length ?? 0) > 110 ? " box--wordy" : ""}`} body={f.body ? <p>{f.body}</p> : undefined} spoken={f.spoken}>
      {f.line}
    </FactBox>
  );
}

/** The collapsed strip of a skipped range: a figure and its label. */
export function FactStrip({ f }: { f: Fact }) {
  return (
    <div className={`box box--strip box--${f.tone ?? "tile"}`} role="group" aria-label={`${f.spoken ?? f.line}: ${f.label}`}>
      {f.label && <p className="box__label">{f.short ?? f.label}</p>}
      <div className="box__fit"><Fit as="span" className="fit--display fit--num" min={8} max={120}>{f.line}</Fit></div>
    </div>
  );
}

/** A square of type with an optional link. */
export function TextTile({ title, body, href, label, tone = "tile" }: { title: string; body?: string; href?: string; label?: string; tone?: "tile" | "blue" | "ink" }) {
  const inner = (
    <>
      <div className="box__fit box__fit--top"><Fit as="p" className="fit--title" min={12} max={44}>{title}</Fit></div>
      {body && <div className="box__body"><Fit as="div" className="fit--body" min={12} max={20}><p>{body}</p></Fit></div>}
      {href && <div className="box__foot"><span className="more more--link" aria-hidden="true">Open</span></div>}
    </>
  );
  return href ? <a className={`box box--${tone} textile`} href={href} aria-label={label}>{inner}</a> : <div className={`box box--${tone} textile`}>{inner}</div>;
}
