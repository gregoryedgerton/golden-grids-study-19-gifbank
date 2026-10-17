import { StrictMode, useId, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BankPage } from "../lib/Page";
import { GridBand, deal, type Cell } from "../bands/bands";
import { Fit } from "../lib/fit";
import { Icon, type IconName } from "../icons";
import { CUSTOMER, PAGES, REFERENCE, accountHref } from "../content";
import { ACCOUNTS, dateLabel, mask, money, type AccountId } from "../bank/ledger";
import { applyTheme, logOut, nicknames, resetAll, settings, transfers, useAccounts, type Settings } from "../lib/store";
import "../styles.css";

/**
 * Profile & Settings: the customer's details, the accounts' names, alerts,
 * security and preferences. Its home is a grid of the six sections; inside
 * one, each setting is a row that opens in place to change it. What is
 * saved stays in this browser.
 */
const q = new URLSearchParams(location.search);
const SECTIONS: { id: string; title: string; icon: IconName; blurb: (s: Settings) => string }[] = [
  { id: "personal", title: "Personal information", icon: "user", blurb: (s) => `${s.address.city}, ${s.address.state} · ${s.email}` },
  { id: "accounts", title: "Accounts", icon: "card", blurb: () => `${ACCOUNTS.length} accounts · names and numbers` },
  { id: "alerts", title: "Alerts", icon: "bell", blurb: (s) => `${[s.alerts.lowBalance, s.alerts.deposit, s.alerts.largePurchase, s.alerts.due].filter(Boolean).length + 1} alerts on · by ${s.alerts.channel === "both" ? "email and text" : s.alerts.channel}` },
  { id: "security", title: "Security", icon: "shield", blurb: (s) => `Two-step verification ${s.twoStep ? "on" : "off"}` },
  { id: "statements", title: "Statements & paperless", icon: "doc", blurb: (s) => `${Object.values(s.delivery).filter((d) => d === "online").length} of ${ACCOUNTS.length} accounts online only` },
  { id: "preferences", title: "Preferences", icon: "gear", blurb: (s) => `${s.language} · ${s.theme === "device" ? "display follows your device" : `${s.theme} display`}` },
];

/** A setting: its name, its value, and an editor that opens beneath it. */
function Row({ label, value, children, edit = "Edit" }: { label: string; value: ReactNode; children?: (close: () => void) => ReactNode; edit?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className={`setrow${open ? " is-open" : ""}`}>
      <div className="setrow__line">
        <div><p className="setrow__label">{label}</p><div className="setrow__value">{value}</div></div>
        {children && <button type="button" className="btn btn--outline btn--small" aria-expanded={open} aria-controls={id} aria-label={`${open ? "Close" : edit} ${label}`} onClick={() => setOpen(!open)}>{open ? "Close" : edit}</button>}
      </div>
      {open && children && <div className="setrow__edit" id={id}>{children(() => setOpen(false))}</div>}
    </li>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p className="field__error" id={`${id}-e`}>{error}</p> : hint ? <p className="note" id={`${id}-h`}>{hint}</p> : null}
    </div>
  );
}

function Saved({ text }: { text: string }) { return <p className="note" role="status">{text}</p>; }

function Personal() {
  const s = settings.use();
  const id = useId();
  const [said, setSaid] = useState("");
  const [addr, setAddr] = useState(s.address);
  const [email, setEmail] = useState(s.email);
  const [mobile, setMobile] = useState(s.mobile);
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <>
      <ul className="setrows">
        <Row label="Name" value={<>{CUSTOMER.first} {CUSTOMER.last}<p className="note">To change your legal name, visit a store with your documents.</p></>} />
        <Row label="Mailing address" value={<>{s.address.line1}<br />{s.address.city}, {s.address.state} {s.address.zip}</>}>{(close) => (
          <form onSubmit={(e) => { e.preventDefault(); const e2: Record<string, string> = {}; if (!addr.line1.trim()) e2.line1 = "Enter a street address."; if (!addr.city.trim()) e2.city = "Enter a city."; if (!/^[A-Z]{2}$/.test(addr.state)) e2.state = "Use the two-letter state code."; if (!/^\d{5}$/.test(addr.zip)) e2.zip = "Enter a five-digit ZIP code."; setErr(e2); if (Object.keys(e2).length) return; settings.set((v) => ({ ...v, address: addr })); setSaid("Address saved to this browser. Statements will show it."); close(); }} noValidate>
            <Field id={`${id}l`} label="Street address" error={err.line1}><input id={`${id}l`} value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} aria-invalid={err.line1 ? true : undefined} aria-describedby={err.line1 ? `${id}l-e` : undefined} autoComplete="off" /></Field>
            <div className="fields3">
              <Field id={`${id}c`} label="City" error={err.city}><input id={`${id}c`} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} aria-invalid={err.city ? true : undefined} aria-describedby={err.city ? `${id}c-e` : undefined} autoComplete="off" /></Field>
              <Field id={`${id}s`} label="State" error={err.state}><input id={`${id}s`} value={addr.state} maxLength={2} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase() })} aria-invalid={err.state ? true : undefined} aria-describedby={err.state ? `${id}s-e` : undefined} autoComplete="off" /></Field>
              <Field id={`${id}z`} label="ZIP code" error={err.zip}><input id={`${id}z`} inputMode="numeric" value={addr.zip} maxLength={5} onChange={(e) => setAddr({ ...addr, zip: e.target.value.replace(/\D/g, "") })} aria-invalid={err.zip ? true : undefined} aria-describedby={err.zip ? `${id}z-e` : undefined} autoComplete="off" /></Field>
            </div>
            <p className="row"><button type="submit" className="btn btn--green">Save</button><button type="button" className="btn btn--outline" onClick={() => { setAddr(s.address); setErr({}); close(); }}>Cancel</button></p>
          </form>
        )}</Row>
        <Row label="Email" value={s.email}>{(close) => (
          <form onSubmit={(e) => { e.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.example$/i.test(email)) { setErr({ email: "In this study, use an address ending in .example, such as you@mail.example: it reaches no one." }); return; } setErr({}); settings.set((v) => ({ ...v, email })); setSaid("Email saved to this browser."); close(); }} noValidate>
            <Field id={`${id}e`} label="Email address" error={err.email} hint="Statement notices and alerts go here."><input id={`${id}e`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={err.email ? true : undefined} aria-describedby={err.email ? `${id}e-e` : `${id}e-h`} autoComplete="off" /></Field>
            <p className="row"><button type="submit" className="btn btn--green">Save</button><button type="button" className="btn btn--outline" onClick={() => { setEmail(s.email); setErr({}); close(); }}>Cancel</button></p>
          </form>
        )}</Row>
        <Row label="Mobile phone" value={s.mobile}>{(close) => (
          <form onSubmit={(e) => { e.preventDefault(); const d = mobile.replace(/\D/g, ""); if (!/^\d{3}55501\d{2}$/.test(d)) { setErr({ mobile: "In this study, use a number in the 555-0100 to 555-0199 range, such as (856) 555-0142: they are set aside for fiction." }); return; } setErr({}); const f = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`; settings.set((v) => ({ ...v, mobile: f })); setMobile(f); setSaid("Mobile number saved to this browser."); close(); }} noValidate>
            <Field id={`${id}m`} label="Mobile number" error={err.mobile}><input id={`${id}m`} inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} aria-invalid={err.mobile ? true : undefined} aria-describedby={err.mobile ? `${id}m-e` : undefined} autoComplete="off" /></Field>
            <p className="row"><button type="submit" className="btn btn--green">Save</button><button type="button" className="btn btn--outline" onClick={() => { setMobile(s.mobile); setErr({}); close(); }}>Cancel</button></p>
          </form>
        )}</Row>
        <Row label="Home phone" value={CUSTOMER.home} />
        <Row label="Customer since" value={CUSTOMER.since} />
      </ul>
      <Saved text={said} />
    </>
  );
}

function Accounts() {
  const accts = useAccounts();
  const names = nicknames.use();
  const [said, setSaid] = useState("");
  return (
    <>
      <ul className="setrows">{accts.map((a) => (
        <Row key={a.id} label={a.product} edit="Rename" value={<><strong>{a.nickname}</strong> · {mask(a)}<p className="note">Opened {dateLabel(a.opened)}{a.limit ? ` · credit line ${money(a.limit)}` : ""} · <a href={accountHref(a.id)}>View activity</a></p></>}>{(close) => <Rename id={a.id} current={names[a.id] ?? a.nickname} onDone={(t) => { setSaid(t); close(); }} />}</Row>
      ))}</ul>
      <Saved text={said} />
    </>
  );
}

function Rename({ id, current, onDone }: { id: AccountId; current: string; onDone: (t: string) => void }) {
  const [v, setV] = useState(current);
  const [err, setErr] = useState("");
  const fid = useId();
  const original = ACCOUNTS.find((a) => a.id === id)!.nickname;
  return (
    <form onSubmit={(e) => { e.preventDefault(); const t = v.trim(); if (!t) { setErr("Enter a nickname, or restore the original."); return; } if (t.length > 30) { setErr("Keep the nickname to 30 characters."); return; } nicknames.set((n) => ({ ...n, [id]: t })); onDone(`Renamed to ${t}. The new name shows on every page.`); }} noValidate>
      <Field id={fid} label="Nickname" error={err} hint={`${v.trim().length} / 30`}><input id={fid} value={v} maxLength={40} onChange={(e) => setV(e.target.value)} aria-invalid={err ? true : undefined} aria-describedby={err ? `${fid}-e` : `${fid}-h`} autoComplete="off" /></Field>
      <p className="row"><button type="submit" className="btn btn--green">Save</button><button type="button" className="btn btn--outline" onClick={() => { nicknames.set((n) => { const x = { ...n }; delete x[id]; return x; }); onDone(`Restored the original name, ${original}.`); }}>Restore original</button></p>
    </form>
  );
}

function Switch({ on, label, onChange, note, disabled }: { on: boolean; label: string; onChange: (v: boolean) => void; note?: string; disabled?: boolean }) {
  return <label className="switch"><input type="checkbox" role="switch" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /><span><strong>{label}</strong>{note && <span className="note">{note}</span>}</span></label>;
}

function Alerts() {
  const s = settings.use();
  const a = s.alerts;
  const id = useId();
  const set = (p: Partial<Settings["alerts"]>) => settings.set((v) => ({ ...v, alerts: { ...v.alerts, ...p } }));
  const dollars = (c: number) => String(c / 100);
  return (
    <div className="panel">
      <ul className="switches">
        <li><Switch on={a.lowBalance} label="Low balance" note="When Everyday Checking's available balance falls below:" onChange={(v) => set({ lowBalance: v })} />
          {a.lowBalance && <div className="field field--inline"><label htmlFor={`${id}lo`}>Amount</label><div className="money-input"><span aria-hidden="true">$</span><input id={`${id}lo`} inputMode="numeric" value={dollars(a.lowAmount)} onChange={(e) => set({ lowAmount: Math.min(1000000, Number(e.target.value.replace(/\D/g, "") || 0) * 100) })} /></div></div>}</li>
        <li><Switch on={a.deposit} label="Deposit received" note="When a direct deposit or transfer reaches checking or savings." onChange={(v) => set({ deposit: v })} /></li>
        <li><Switch on={a.largePurchase} label="Large card purchase" note="When one purchase on the Cash Back Card is more than:" onChange={(v) => set({ largePurchase: v })} />
          {a.largePurchase && <div className="field field--inline"><label htmlFor={`${id}lg`}>Amount</label><div className="money-input"><span aria-hidden="true">$</span><input id={`${id}lg`} inputMode="numeric" value={dollars(a.largeAmount)} onChange={(e) => set({ largeAmount: Math.min(1000000, Number(e.target.value.replace(/\D/g, "") || 0) * 100) })} /></div></div>}</li>
        <li><Switch on={a.due} label="Payment due" note="Five days before the card's and the mortgage's due dates." onChange={(v) => set({ due: v })} /></li>
        <li><Switch on disabled label="Security alerts" note="New sign-ins, password and contact changes. Always on." onChange={() => undefined} /></li>
      </ul>
      <fieldset className="radios"><legend>Send alerts by</legend>
        {(["email", "text", "both"] as const).map((c) => <label key={c}><input type="radio" name={`${id}ch`} checked={a.channel === c} onChange={() => set({ channel: c })} />{c === "email" ? `Email (${s.email})` : c === "text" ? `Text (${s.mobile})` : "Email and text"}</label>)}
      </fieldset>
      <p className="note">Alerts in this study are settings only; none is sent.</p>
    </div>
  );
}

function Security() {
  const s = settings.use();
  const last4 = s.mobile.replace(/\D/g, "").slice(-4);
  return (
    <>
      <ul className="setrows">
        {/* Safe Browsing remediation (2026-10): the User name / Password rows were removed with the demo sign-in. See CLAUDE.md. */}
        <Row label="Sign-in" value={<>None<p className="note">GIFbank is a parody for a layout study. There is no user name or password, and this study never asks for one.</p></>} />
        <Row label="Single-use security codes" value={`Texted to (XXX) XXX-${last4} when you sign in from a new device`} />
      </ul>
      <div className="panel">
        <ul className="switches"><li><Switch on={s.twoStep} label="Two-step verification" note="Ask for a code as well as the password at every sign-in." onChange={(v) => settings.set((x) => ({ ...x, twoStep: v }))} /></li></ul>
      </div>
      <section className="list-card" aria-labelledby="hist">
        <h2 id="hist" className="panel__sub">Recent sign-ins</h2>
        <ul className="rows">
          <li><span className="rows__what"><strong>Today</strong><span className="note">This browser · demo sign-in</span></span></li>
          <li><span className="rows__what"><strong>{CUSTOMER.lastLogin}</strong><span className="note">Chrome on macOS · Haddonfield, NJ</span></span></li>
          <li><span className="rows__what"><strong>Oct 12, 2026 at 9:15 AM</strong><span className="note">GIFbank app on iPhone · Haddonfield, NJ</span></span></li>
        </ul>
      </section>
    </>
  );
}

function StatementsPrefs() {
  const s = settings.use();
  const accts = useAccounts();
  return (
    <>
      <ul className="setrows">{accts.map((a) => <Row key={a.id} label={`${a.nickname} ${mask(a)}`} value={s.delivery[a.id] === "online" ? "Online only" : "Online and paper"} />)}</ul>
      <p className="row"><a className="btn btn--green" href={`${PAGES.statements}?tab=delivery`}>Change delivery preferences</a></p>
    </>
  );
}

function Preferences() {
  const s = settings.use();
  const id = useId();
  const [sure, setSure] = useState(false);
  const [said, setSaid] = useState("");
  return (
    <div className="panel">
      <fieldset className="radios"><legend>Display</legend>
        {(["device", "light", "dark"] as const).map((t) => <label key={t}><input type="radio" name={`${id}t`} checked={s.theme === t} onChange={() => { settings.set((v) => ({ ...v, theme: t })); applyTheme(t); }} />{t === "device" ? "Use device settings" : t === "light" ? "Light" : "Dark"}</label>)}
      </fieldset>
      <fieldset className="radios"><legend>Language</legend>
        {(["English", "Español"] as const).map((l) => <label key={l} lang={l === "Español" ? "es" : undefined}><input type="radio" name={`${id}l`} checked={s.language === l} onChange={() => { settings.set((v) => ({ ...v, language: l })); setSaid(l === "Español" ? "Saved. The Spanish pages aren't part of this study, so the pages stay in English." : "Saved."); }} />{l}</label>)}
      </fieldset>
      <ul className="switches"><li><Switch on={s.hideBalances} label="Hide balances" note="Show dots in place of every balance until you choose to show them." onChange={(v) => settings.set((x) => ({ ...x, hideBalances: v }))} /></li></ul>
      <div className="danger">
        <h2 className="panel__sub">Reset this study</h2>
        <p className="note">Clears what this browser keeps for GIFbank: your transfers ({transfers.get().length}), account names, settings and sign-in.</p>
        {!sure ? <button type="button" className="btn btn--outline" onClick={() => setSure(true)}>Reset…</button>
          : <p className="row"><button type="button" className="btn btn--green" onClick={() => { resetAll(); logOut(); location.assign(PAGES.home); }}>Yes, clear everything</button><button type="button" className="btn btn--outline" onClick={() => setSure(false)}>Keep it</button></p>}
      </div>
      <Saved text={said} />
    </div>
  );
}

function Home() {
  const s = settings.use();
  const cells: Cell[] = SECTIONS.map((sec, i): Cell => () => (
    <a className={`box box--setting${i === 0 ? " box--lead" : ""}`} href={`${PAGES.settings}?s=${sec.id}`}>
      <span className="setting__icon" aria-hidden="true"><Icon name={sec.icon} size={i === 0 ? 40 : 30} stroke={1.5} /></span>
      <span className="box__fit"><Fit as="span" className="fit--title" min={14} max={i === 0 ? 72 : 52}>{sec.title}</Fit></span>
      <span className="setting__blurb">{sec.blurb(s)}</span>
      <span className="box__foot"><span className="linkish">Manage <Icon name="right" size={14} /></span></span>
    </a>
  ));
  return <>{deal(cells, 3).map((c, i) => <GridBand key={i} id={`sections-${i}`} title={i === 0 ? "Your profile and accounts" : "Statements, preferences and security"} quiet lead={i === 0} variant={i + 2} cells={c} />)}</>;
}

function App() {
  const sec = SECTIONS.find((x) => x.id === q.get("s"));
  const body = sec?.id === "personal" ? <Personal /> : sec?.id === "accounts" ? <Accounts /> : sec?.id === "alerts" ? <Alerts /> : sec?.id === "security" ? <Security /> : sec?.id === "statements" ? <StatementsPrefs /> : sec?.id === "preferences" ? <Preferences /> : null;
  return (
    <BankPage current="settings" title="Profile & Settings" source={[REFERENCE.onlineBanking, REFERENCE.myTd]}>
      {sec && <nav className="wrap crumbs" aria-label="Breadcrumb"><ol><li><a href={PAGES.settings}>Profile &amp; Settings</a></li><li aria-current="page">{sec.title}</li></ol></nav>}
      <div className="wrap greet"><h1 className="greet__title">{sec ? sec.title : "Profile & Settings"}</h1><p className="note">{sec ? sec.blurb(settings.get()) : `Signed in as ${CUSTOMER.first} ${CUSTOMER.last}.`}</p></div>
      {sec ? (
        <div className="wrap setlayout">
          <nav className="setnav" aria-label="Settings sections"><ul>{SECTIONS.map((x) => <li key={x.id}><a href={`${PAGES.settings}?s=${x.id}`} aria-current={x.id === sec.id ? "page" : undefined}><Icon name={x.icon} size={20} />{x.title}</a></li>)}</ul></nav>
          <div className="setbody">{body}</div>
        </div>
      ) : <Home />}
    </BankPage>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
