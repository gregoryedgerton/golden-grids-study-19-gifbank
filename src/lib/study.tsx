import { useLayoutEffect, useRef, type ReactNode } from "react";
import data from "../study.json";
import "./study.css";

/**
 * What every study says about itself, in two places and one voice.
 *
 *   StudyBanner      a sticky bar at the top of every page carrying the
 *                    notice: the same sentence as the page's meta description.
 *   StudyDisclosure  the last element on every page: what the study is, which
 *                    pages were reviewed and when, what is real and what is
 *                    invented, where every kind of asset came from, who it is
 *                    not affiliated with, and how to report a problem.
 *
 * Both read `src/study.json`; so does `study.meta.ts`, which writes the title
 * and description into each HTML entry. The styles are the module's own and
 * the same in every study, so the notice never looks like part of the site
 * being studied. A study's stylesheet does not style them.
 *
 * The banner publishes its height as `--study-banner-h` on <html>; anything
 * else that sticks to the top of the viewport offsets itself by it.
 */
export interface Study {
  number: string;
  /** The reference, as it is named in titles. */
  name: string;
  /** The study's parody name for the service on its pages (GIFbnb, GIFspn). Titles and the share card use it. */
  brand?: string;
  /** One sentence: this is a layout study and not the real thing. Banner and meta description. */
  notice: string;
  /** A label for each HTML entry, keyed by file name without the extension. */
  pages: Record<string, string>;
  /** A short paragraph on what the study is. */
  summary: string;
  reviewed: { date: string; method: string; pages: { label: string; url?: string }[] };
  real: string[];
  invented: string[];
  assets: { what: string; source: string; licence?: string; url?: string }[];
  /** Who the study is not affiliated with. */
  owner: string;
  /** Replaces the "not affiliated with {owner}" sentence, for a study whose author does have a tie to its subject. */
  affiliation?: string;
  repo: string;
  updated: string;
}
export const study = data as Study;

export function StudyBanner() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--study-banner-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set); ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty("--study-banner-h"); };
  }, []);
  // The notice opens with what the page is and is not ("A layout study, not X:"); that part is set in bold.
  const cut = study.notice.indexOf(":");
  const lead = cut > 0 ? study.notice.slice(0, cut + 1) : "";
  const rest = cut > 0 ? study.notice.slice(cut + 1) : study.notice;
  return (
    <aside ref={ref} className="gg-study-banner" aria-label="Layout study notice">
      <p><strong>{lead}</strong>{rest} <a href="#about-this-study">About this study</a></p>
    </aside>
  );
}

const Link = ({ url, children }: { url?: string; children: ReactNode }) => (url ? <a href={url}>{children}</a> : <>{children}</>);

/** `children` is the page's own credit list, where a study has one (photographers, video, per-page sources). */
export function StudyDisclosure({ children }: { children?: ReactNode }) {
  return (
    <section className="gg-study" id="about-this-study" aria-labelledby="gg-study-title">
      <div className="gg-study__wrap">
        <h2 id="gg-study-title">About this layout study</h2>
        <p className="gg-study__notice">{study.notice}</p>
        <p>{study.summary}</p>
        <p>
          A study shows a layout as it was built. It draws no conclusion about whether Golden Grids suits this kind of page; that is
          assessed separately, once every study has been reviewed.
        </p>
        <div className="gg-study__grid">
          <div>
            <h3>Pages reviewed</h3>
            <ul>{study.reviewed.pages.map((p) => <li key={p.label}><Link url={p.url}>{p.label}</Link></li>)}</ul>
            <p>Reviewed {study.reviewed.date}. {study.reviewed.method}</p>
          </div>
          <div>
            <h3>What is real</h3>
            <ul>{study.real.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div>
            <h3>What is invented or changed</h3>
            <ul>{study.invented.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div>
            <h3>Where the assets come from</h3>
            <ul>{study.assets.map((a) => <li key={a.what}><strong>{a.what}:</strong> <Link url={a.url}>{a.source}</Link>{a.licence ? ` (${a.licence})` : ""}</li>)}</ul>
          </div>
        </div>
        {children && <div className="gg-study__credits"><h3>Credits and notes for this page</h3>{children}</div>}
        <p>
          <strong>Affiliation.</strong> {study.affiliation ?? `This study is not affiliated with, sponsored by or endorsed by ${study.owner}.`} Names and
          trademarks belong to their owners and appear only to say what was studied. If something here is wrong, or is yours and
          should not be here, <a href={`${study.repo}/issues`}>open an issue</a> and it will be corrected or removed.
        </p>
        <p className="gg-study__foot">
          Golden Grids layout study {study.number} · <a href={study.repo}>source</a> · built with{" "}
          <a href="https://github.com/gregoryedgerton/golden-grids">Golden Grids</a> (<a href="https://www.npmjs.com/package/@gifcommit/golden-grids">npm</a>,{" "}
          <a href="https://gregoryedgerton.github.io/golden-grids/">generator</a>) · last updated {study.updated}
        </p>
      </div>
    </section>
  );
}
