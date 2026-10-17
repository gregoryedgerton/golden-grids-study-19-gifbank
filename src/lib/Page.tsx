import { useEffect, useRef, useState, type ReactNode } from "react";
import { Tools } from "./tools";
import { StudyBanner, StudyDisclosure } from "./study";
import { Credits } from "./modules";
import { useFontsReady } from "./fonts";
import { Icon, Mark } from "../icons";
import { BANK_TABS, CUSTOMER, FOOTER, LEGAL, PAGES, PRODUCT_NAV, SEGMENTS } from "../content";
import { logIn, logOut, resetAll, session } from "./store";

/**
 * GIFbank's two shells, after the reference's. The public site has three
 * bars: the line of segments, the header with the mark, the utilities and
 * Enter in the corner, and the products. Signed in, the header carries the
 * customer and Log Out, and a green bar of tabs runs under it. Nav items are
 * the reference's, for show; only those that lead to the study's own pages
 * are links. Nothing in either shell leaves for the reference: it is linked
 * only from the notice and the disclosure.
 */

/**
 * CASE-STUDY REMEDIATION (2026-10) — agent note.
 *
 * Google Safe Browsing flagged this study as a "deceptive site". The cause was
 * the demo Online Banking sign-in: a bank-styled page carrying "User name" and
 * "Password" fields and a "Log In" button matches a phishing pattern whatever
 * disclaimers surround it, and the public home page also linked out to the
 * reference bank's real sign-in portal. Nothing was ever collected here — the
 * fields were read-only and inert — but the *appearance* of a credential form
 * is what the heuristic reads, so it has been removed.
 *
 * In its place, an "Enter" control opens a notice that GIFbank is a parody for
 * the Golden Grids layout study and not a real bank, and only then continues
 * into the demo accounts (where the old Log In button went). The real-bank
 * sign-in link was dropped from the home page's sources (see content.ts).
 *
 * Do NOT reintroduce username/password inputs, a sign-in form, or a link to any
 * real bank's sign-in anywhere in this study. See CLAUDE.md › "Safe Browsing
 * remediation".
 */

/** Opens the parody notice in the header's corner: the only way into the demo session. */
export const openEnter = () => { window.dispatchEvent(new Event("gifbank:enter")); window.scrollTo({ top: 0 }); };

/**
 * The parody notice. It says plainly that GIFbank is not a real bank and that
 * there is no sign-in, then continues into the demo accounts, the destination
 * the removed Log In button had. It is not a dialog: it hangs from the
 * header's corner, as the reference's own corner panel does, and on a
 * signed-out page it stands in the page where the accounts would be.
 */
function ParodyNotice({ onBack, autoFocus, level = 2 }: { onBack?: () => void; autoFocus?: boolean; level?: 1 | 2 }) {
  const go = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (autoFocus) go.current?.focus(); }, [autoFocus]);
  const enter = () => { logIn(false); location.assign(PAGES.accounts); };
  const H = level === 1 ? "h1" : "h2";
  return (
    <section className="parody__box" aria-labelledby="parody-t">
      <H className="parody__title" id="parody-t"><Icon name="info" size={22} />This is a parody, not a real bank</H>
      <div className="parody__body">
        <p><strong>GIFbank is a fictional bank.</strong> This page is a layout study for the Golden Grids system, a rebuild of a bank page's design. It is not TD Bank and is not affiliated with it.</p>
        <p>There is no sign-in here and no real account. Nothing you do on these pages is sent anywhere or kept outside your own browser. Never enter real banking details into a page you reached from a link.</p>
      </div>
      <div className="parody__acts">
        <button ref={go} type="button" className="btn btn--green" onClick={enter}>Continue to the demo</button>
        {onBack && <button type="button" className="btn btn--outline" onClick={onBack}>Go back</button>}
      </div>
    </section>
  );
}

/** The header's corner: Enter, which opens the parody notice beneath it. */
function CornerEnter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("gifbank:enter", show);
    return () => window.removeEventListener("gifbank:enter", show);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = () => { setOpen(false); btn.current?.focus(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const click = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", key); window.addEventListener("mousedown", click);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("mousedown", click); };
  }, [open]);
  return (
    <div className={`corner${open ? " is-open" : ""}`} ref={ref}>
      <button ref={btn} type="button" className="corner__btn" aria-expanded={open} aria-controls="corner-enter" onClick={() => setOpen(!open)}>Enter <Icon name="chevron" size={16} /></button>
      {open && <div className="corner__panel" id="corner-enter"><ParodyNotice autoFocus onBack={() => { setOpen(false); btn.current?.focus(); }} /></div>}
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="pub">
      <div className="pub__segments"><div className="wrap"><ul>{SEGMENTS.map((s, i) => <li key={s}><span aria-current={i === 0 ? "true" : undefined}>{s}</span></li>)}</ul></div></div>
      <div className="wrap pub__row">
        <a className="markwrap" href={PAGES.home} aria-label="GIFbank home"><Mark /></a>
        <div className="pub__utils">
          <span className="util" title="Search"><Icon name="search" size={20} /><span className="visually-hidden">Search</span></span>
          <span className="util" title="Help"><Icon name="help" size={20} /><span className="visually-hidden">Help</span></span>
          <span className="util" title="Find Us"><Icon name="pin" size={20} /><span className="visually-hidden">Find Us</span></span>
          <span className="util util--country"><Icon name="globe" size={20} />United States<Icon name="chevron" size={14} /></span>
          <CornerEnter />
        </div>
      </div>
      <nav className="pub__nav" aria-label="Products"><div className="wrap"><ul>{PRODUCT_NAV.map((p) => <li key={p}><span>{p}{p !== "GIFpremier" && <Icon name="chevron" size={14} />}</span></li>)}</ul></div></nav>
    </header>
  );
}

function BankHeader({ current }: { current: string }) {
  const [menu, setMenu] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!menu) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(false); btn.current?.focus(); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [menu]);
  const out = () => { logOut(); location.assign(PAGES.home); };
  return (
    <header className="bank">
      <div className="wrap bank__row">
        <a className="markwrap" href={PAGES.accounts} aria-label="GIFbank, your accounts"><Mark /></a>
        <div className="bank__utils">
          <span className="util util--label"><Icon name="mail" size={20} /><span className="util__text">Secure Messages</span><span className="badge" aria-label="1 unread">1</span></span>
          <span className="util util--label"><Icon name="help" size={20} /><span className="util__text">Help</span></span>
          <div className="usermenu">
            <button ref={btn} type="button" className="util util--label usermenu__btn" aria-expanded={menu} aria-controls="user-menu" onClick={() => setMenu(!menu)}><Icon name="user" size={20} /><span className="util__text">{CUSTOMER.first}</span><Icon name="chevron" size={14} /></button>
            {menu && (
              <ul className="usermenu__list" id="user-menu">
                <li><a href={PAGES.statements}>Statements &amp; Documents</a></li>
                <li><button type="button" onClick={() => { resetAll(); location.assign(PAGES.home); }}>Reset the demo</button></li>
                <li><button type="button" onClick={out}>Log Out</button></li>
              </ul>
            )}
          </div>
          <button type="button" className="btn btn--outline btn--small bank__out" onClick={out}><Icon name="logout" size={16} />Log Out</button>
        </div>
      </div>
      <nav className="tabs" aria-label="Online Banking">
        <div className="wrap"><ul>
          {BANK_TABS.map((t) => {
            const on = t.match?.includes(current);
            return <li key={t.label}>{t.href ? <a href={t.href} aria-current={on ? "page" : undefined}>{t.label}</a> : <span>{t.label}</span>}</li>;
          })}
        </ul></div>
      </nav>
    </header>
  );
}

function Footer({ bank }: { bank?: boolean }) {
  return (
    <footer className="foot">
      {!bank && (
        <div className="wrap foot__groups">
          {FOOTER.map((g) => <div key={g.title}><h2 className="foot__h">{g.title}</h2><ul>{g.links.map((l) => <li key={l}><span>{l}</span></li>)}</ul></div>)}
        </div>
      )}
      <div className="wrap foot__legal">
        <ul>{LEGAL.map((l) => <li key={l}><span>{l}</span></li>)}</ul>
        <p><Mark small /> GIFbank, N.A., a fictional bank. © 2026. Not a real bank, so not a member of the FDIC and not an Equal Housing Lender; its accounts and the money in them are invented.</p>
      </div>
    </footer>
  );
}

function Disclosure({ source }: { source: { label: string; url: string }[] }) {
  return (
    <StudyDisclosure>
      <p>This page follows {source.map((s, i) => <span key={s.url + s.label}>{i > 0 && (i === source.length - 1 ? " and " : ", ")}<a href={s.url}>{s.label}</a></span>)}, as they were read in October 2026. The signed-in pages were not seen: the study does not sign in to anyone's account, and they are built from the reference's public descriptions of Online Banking and from how such pages are known to behave.</p>
      <Credits />
    </StudyDisclosure>
  );
}

export function PublicPage({ source, children }: { source: { label: string; url: string }[]; children: ReactNode }) {
  useFontsReady(["400 1em Figtree", "600 1em Figtree"]);
  return (
    <>
      <a className="skip" href="#content">Skip to content</a>
      <StudyBanner />
      <Tools />
      <PublicHeader />
      <main id="content" className="main">{children}</main>
      <Footer />
      <Disclosure source={source} />
    </>
  );
}

/** A signed-in page. Signed out, it shows the sign-in where the page would be. */
export function BankPage({ current, title, source, children }: { current: string; title: string; source: { label: string; url: string }[]; children: ReactNode }) {
  useFontsReady(["400 1em Figtree", "600 1em Figtree"]);
  const s = session.use();
  return (
    <>
      <a className="skip" href="#content">Skip to content</a>
      <StudyBanner />
      <Tools />
      {s.in ? <BankHeader current={current} /> : <PublicHeader />}
      <main id="content" className="main main--bank">
        {s.in ? children : (
          <div className="wrap gate">
            <p className="gate__kicker">{title}</p>
            <ParodyNotice level={1} />
          </div>
        )}
      </main>
      <Footer bank={s.in} />
      <Disclosure source={source} />
    </>
  );
}
