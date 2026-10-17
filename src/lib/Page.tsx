import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Tools } from "./tools";
import { StudyBanner, StudyDisclosure } from "./study";
import { Credits } from "./modules";
import { useFontsReady } from "./fonts";
import { Icon, Mark } from "../icons";
import { BANK_TABS, CUSTOMER, DEMO_PASSWORD_SHOWN, DEMO_USER, FOOTER, LEGAL, PAGES, PRODUCT_NAV, SEGMENTS } from "../content";
import { logIn, logOut, session } from "./store";

/**
 * GIFbank's two shells, after the reference's. The public site has three
 * bars: the line of segments, the header with the mark, the utilities and
 * the corner log-in, and the products. Signed in, the header carries the
 * customer and Log Out, and a green bar of tabs runs under it. Nav items are
 * the reference's, for show; only those that lead to the study's own pages
 * are links. Nothing in either shell leaves for the reference: it is linked
 * only from the notice and the disclosure.
 */

/**
 * The demo sign-in. The fields are filled for the reader and cannot be
 * changed: there is one customer and one way in, nothing is typed, and
 * nothing leaves the browser. The password is shown as dots in an ordinary
 * text field, so no browser offers to save it.
 */
export function LoginForm({ title = "Log in to Online Banking", headingLevel = 2, autoFocus }: { title?: string; headingLevel?: 2 | 3; autoFocus?: boolean }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(session.get().remember);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (autoFocus) btn.current?.focus(); }, [autoFocus]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => { logIn(remember); location.assign(PAGES.accounts); }, 650);
  };
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <form className="login" onSubmit={submit} aria-labelledby={`${id}t`} autoComplete="off">
      <H className="login__title" id={`${id}t`}>{title}</H>
      <label className="login__label" htmlFor={`${id}u`}>User name</label>
      <input className="login__field" id={`${id}u`} type="text" value={DEMO_USER} readOnly aria-describedby={`${id}n`} />
      <label className="login__label" htmlFor={`${id}p`}>Password</label>
      <input className="login__field" id={`${id}p`} type="text" value={DEMO_PASSWORD_SHOWN} readOnly aria-describedby={`${id}n`} />
      <p className="login__note" id={`${id}n`}><Icon name="info" size={16} />Demo sign-in: these fields are filled for you and can't be changed. Never type real bank details into a page you reached from a link.</p>
      <label className="login__remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember me</label>
      <button ref={btn} type="submit" className="btn btn--green btn--block" disabled={busy}><Icon name="lock" size={18} />{busy ? "Logging in…" : "Log In"}</button>
      <ul className="login__links">
        <li><span>Forgot user name or password?</span></li>
        <li><span>Sign up for Online Banking</span></li>
      </ul>
      <p role="status" className="visually-hidden">{busy ? "Logging in to the demo accounts." : ""}</p>
    </form>
  );
}

function CornerLogin() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("gifbank:login", show);
    return () => window.removeEventListener("gifbank:login", show);
  }, []);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const click = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", key); window.addEventListener("mousedown", click);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("mousedown", click); };
  }, [open]);
  return (
    <div className={`corner${open ? " is-open" : ""}`} ref={ref}>
      <button ref={btn} type="button" className="corner__btn" aria-expanded={open} aria-controls="corner-login" onClick={() => setOpen(!open)}>Log In <Icon name="chevron" size={16} /></button>
      {open && <div className="corner__panel" id="corner-login"><LoginForm autoFocus /></div>}
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
          <CornerLogin />
        </div>
      </div>
      <nav className="pub__nav" aria-label="Products"><div className="wrap"><ul>{PRODUCT_NAV.map((p) => <li key={p}><span>{p}{p !== "GIF Premier" && <Icon name="chevron" size={14} />}</span></li>)}</ul></div></nav>
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
                <li><a href={PAGES.settings}>Profile &amp; Settings</a></li>
                <li><a href={PAGES.statements}>Statements &amp; Documents</a></li>
                <li><a href={`${PAGES.settings}?s=security`}>Security</a></li>
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
            <h1 className="gate__title">{title}</h1>
            <p className="gate__note"><Icon name="lock" size={18} />You're logged out. For your security, log in to see your accounts.</p>
            <div className="gate__form"><LoginForm headingLevel={2} /></div>
          </div>
        )}
      </main>
      <Footer bank={s.in} />
      <Disclosure source={source} />
    </>
  );
}
