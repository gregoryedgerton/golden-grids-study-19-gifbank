import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BankPage } from "../lib/Page";
import { GridBand, type Cell } from "../bands/bands";
import { AccountSquare, Figure, HideToggle, Money, TransfersPanel, plain } from "../lib/bank";
import { Icon } from "../icons";
import { CUSTOMER, REFERENCE, accountHref, statementHref } from "../content";
import { STATEMENT_MONTHS, TODAY, dateLabel, mask, monthLabel, shortDate, spending, upcoming } from "../bank/ledger";
import { settings, useAccounts, useBooks } from "../lib/store";
import "../styles.css";

/**
 * Account Home. The reference's accounts view lists every account on one
 * page with its balance; here they are one grid, checking in the largest
 * square. Under it: the quick actions, the transfers between the accounts
 * opening in place (a list, not a form: the study moves no money), this
 * month's spending as a grid by category, what is scheduled next and the
 * latest activity across the accounts.
 */
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Accounts() {
  const all = useBooks();
  const accts = useAccounts();
  const cells: Cell[] = accts.map((a, i): Cell => () => <AccountSquare a={a} all={all} rank={i} />);
  return <GridBand id="accounts" title="Your accounts" sub={`Balances as of ${dateLabel(TODAY)}`} lead variant={1} cells={cells} before={<div className="band__tools"><HideToggle /></div>} />;
}

function Spending() {
  const all = useBooks();
  const s = settings.use();
  const from = `${TODAY.slice(0, 7)}-01`;
  const rows = spending(all, from, TODAY);
  const total = rows.reduce((n, [, v]) => n + v, 0);
  const shown = rows.slice(0, 5);
  const rest = rows.slice(5);
  const restSum = rest.reduce((n, [, v]) => n + v, 0);
  const cells: Cell[] = shown.map(([cat, v], i): Cell => () => (
    <Figure label={cat} value={plain(v, s.hideBalances)} sub={`${Math.round((v / total) * 100)}% of spending`} tone={i === 0 ? "green" : "tile"} max={i === 0 ? 120 : 88} />
  ));
  return <GridBand id="spending" title="Spending this month" sub={`From checking and your credit card, ${shortDate(from)} to ${shortDate(TODAY)}: ${s.hideBalances ? "hidden" : plain(total, false)} in all${rest.length ? `, including ${s.hideBalances ? "hidden amounts" : plain(restSum, false)} in ${rest.map(([c]) => c.toLowerCase()).join(", ")}` : ""}. Transfers between your accounts and card payments are left out.`} variant={2} cells={cells} />;
}

function Upcoming() {
  const all = useBooks();
  const items = upcoming(all);
  return (
    <section className="list-card" aria-labelledby="up-title">
      <h2 id="up-title" className="band__title">Coming up</h2>
      <ul className="rows">{items.map((u, i) => (
        <li key={i}><span className="rows__date">{shortDate(u.date)}</span><span className="rows__what"><strong>{u.label}</strong><span className="note">{u.detail}</span></span><span className="rows__amt"><Money cents={u.amount} sign /></span></li>
      ))}</ul>
    </section>
  );
}

function Recent() {
  const all = useBooks();
  const accts = useAccounts();
  const latest = [...all].filter((t) => t.account === "checking" || t.account === "card").sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 8);
  return (
    <section className="list-card" aria-labelledby="recent-title">
      <h2 id="recent-title" className="band__title">Recent activity</h2>
      <ul className="rows">{latest.map((t) => {
        const a = accts.find((x) => x.id === t.account)!;
        const inOut = t.account === "card" ? -t.amount : t.amount;
        return (
          <li key={t.id}><span className="rows__date">{shortDate(t.date)}</span><span className="rows__what"><strong>{t.desc}</strong><span className="note">{t.pending ? "Pending · " : ""}<a href={accountHref(a.id)}>{a.nickname} {mask(a)}</a></span></span><span className="rows__amt"><Money cents={inOut} sign /></span></li>
        );
      })}</ul>
    </section>
  );
}

function App() {
  const [open, setOpen] = useState(() => location.hash === "#transfer");
  useEffect(() => { const h = () => { if (location.hash === "#transfer") setOpen(true); }; window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, []);
  useEffect(() => { if (open && location.hash === "#transfer") document.getElementById("transfer")?.scrollIntoView(); }, [open]);
  const last = STATEMENT_MONTHS[STATEMENT_MONTHS.length - 1];
  return (
    <BankPage current="accounts" title="Accounts" source={[REFERENCE.myTd, REFERENCE.onlineBanking]}>
      <div className="wrap greet">
        <h1 className="greet__title">{greeting()}, {CUSTOMER.first}</h1>
      </div>
      <p className="wrap notice"><Icon name="doc" size={20} /><span>Your {monthLabel(last)} statements are ready. <a href={statementHref("checking", last)}>View statements</a></span></p>
      <Accounts />
      <div className="wrap actions">
        <button type="button" className={`action${open ? " is-on" : ""}`} aria-expanded={open} aria-controls="transfer" onClick={() => setOpen(!open)}><Icon name="transfer" size={26} />Transfers</button>
        <span className="action action--show"><Icon name="bill" size={26} />Pay Bills</span>
        <span className="action action--show"><Icon name="send" size={26} />Send Money</span>
        <span className="action action--show"><Icon name="phone" size={26} />Mobile Deposit</span>
        <span className="action action--show"><Icon name="chat" size={26} />Secure Messages</span>
      </div>
      {open && <div className="wrap"><TransfersPanel /></div>}
      <Spending />
      <div className="wrap twocol"><Upcoming /><Recent /></div>
    </BankPage>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
