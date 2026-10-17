import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { seen, photo } from "../photos";

/** Flat modules: tabs, prose, read more and the page's credits. */

/** A bar that sticks under the notice tells the page its height, so an opened square's head and in-page links clear it. It reports 0 when it is not sticking. */
export function useBarHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const set = () => document.documentElement.style.setProperty("--bar-h", getComputedStyle(el).position === "sticky" ? `${Math.round(el.getBoundingClientRect().height)}px` : "0px");
    set();
    const ro = new ResizeObserver(set); ro.observe(el);
    window.addEventListener("resize", set);
    return () => { ro.disconnect(); window.removeEventListener("resize", set); document.documentElement.style.removeProperty("--bar-h"); };
  }, []);
  return ref;
}

/** Tabs: a tablist with arrow keys, one panel at a time. */
export function Tabs({ label, tabs }: { label: string; tabs: { id: string; label: string; body: ReactNode }[] }) {
  const [on, setOn] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const key = (e: KeyboardEvent) => {
    const n = tabs.length; let i = on;
    if (e.key === "ArrowRight") i = (on + 1) % n; else if (e.key === "ArrowLeft") i = (on - 1 + n) % n; else if (e.key === "Home") i = 0; else if (e.key === "End") i = n - 1; else return;
    e.preventDefault(); setOn(i); refs.current[i]?.focus();
  };
  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label} onKeyDown={key}>
        {tabs.map((t, i) => <button key={t.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${base}${t.id}`} aria-selected={on === i} aria-controls={`${base}${t.id}p`} tabIndex={on === i ? 0 : -1} onClick={() => setOn(i)}>{t.label}</button>)}
      </div>
      {tabs.map((t, i) => <div key={t.id} role="tabpanel" id={`${base}${t.id}p`} aria-labelledby={`${base}${t.id}`} hidden={on !== i} tabIndex={0} className="tabs__panel">{t.body}</div>)}
    </div>
  );
}

/** Text that shows its first lines and a "see more", as the reference's About does. */
export function SeeMore({ text, lines = 3 }: { text: string; lines?: number }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="seemore">
      <p id={id} className={open ? "" : "seemore__clamp"} style={{ ["--lines" as string]: lines }}>{text}</p>
      <button type="button" className="textbtn" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? "…see less" : "…see more"}</button>
    </div>
  );
}

/** Every photograph on the page, for the disclosure. Rendered after the page has drawn. */
export function Credits() {
  const [keys, setKeys] = useState<string[]>([]);
  useEffect(() => {
    const read = () => { const k = [...seen]; setKeys((old) => (old.join() === k.join() ? old : k)); };
    read();
    const t = setInterval(read, 1500);
    return () => clearInterval(t);
  }, []);
  if (!keys.length) return null;
  return (
    <details>
      <summary>Photographs on this page ({keys.length})</summary>
      <ul>{keys.map((k) => { const p = photo(k); return <li key={k}>{p.alt} <a href={p.page}>{p.credit}</a>, {p.source}, {p.licence}.</li>; })}</ul>
    </details>
  );
}
