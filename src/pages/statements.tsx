import { StrictMode, useState, Fragment } from "react";
import { createRoot } from "react-dom/client";
import { BankPage } from "../lib/Page";
import { GridBand, type Cell } from "../bands/bands";
import { Figure, plain } from "../lib/bank";
import { Icon, Mark } from "../icons";
import { CUSTOMER, REFERENCE, accountHref } from "../content";
import { STATEMENT_MONTHS, addDays, dateLabel, mask, money, monthLabel, shortDate, statement, taxYear, type Account, type AccountId, type Statement } from "../bank/ledger";
import { settings, useAccounts, useBooks } from "../lib/store";
import "../styles.css";

/**
 * Statements & Documents. The reference keeps up to seven years of
 * statements online; GIFbank's books begin in January 2025, so there are
 * twenty-one months of them. A statement opens beneath the list: its
 * summary as a grid, the ending balance in the largest square, then the
 * statement itself as a document, with the arithmetic of the summary set
 * out line by line and every transaction under it. It prints on its own.
 */
const q = new URLSearchParams(location.search);
const TABS = [["statements", "Statements"], ["tax", "Tax documents"], ["delivery", "Delivery preferences"]] as const;
type Tab = (typeof TABS)[number][0];

function Summary({ s, a }: { s: Statement; a: Account }) {
  const set = settings.use();
  const h = set.hideBalances;
  const figs = a.group === "deposit"
    ? [["Ending balance", s.closing, `On ${dateLabel(s.end)}`], ["Beginning balance", s.opening, `On ${dateLabel(addDays(s.start, -1))}`], ["Deposits and credits", s.credits + s.interest, s.interest ? `Including ${money(s.interest)} interest` : undefined], ["Withdrawals and debits", -(s.debits + s.checks + s.fees), s.checks ? `Including ${money(-s.checks)} in checks` : undefined], ["Fees", -s.fees, s.fees ? "Non-GIFbank ATM" : "None this month"]]
    : a.group === "credit"
      ? [["New balance", s.closing, `Due ${dateLabel(s.dueDate!)}`], ["Previous balance", s.opening, undefined], ["Purchases", s.purchases, `${s.lines.filter((t) => t.kind === "purchase").length} purchases`], ["Payments and credits", -(s.payments + s.otherCredits), undefined], ["Minimum payment due", s.minimumDue!, `Cash back earned ${money(s.cashBack!)}`]]
      : [["Principal balance", s.closing, `On ${dateLabel(s.end)}`], ["Principal paid", s.principalPaid!, undefined], ["Interest paid", s.interestPaid!, undefined], ["Escrow paid in", s.escrowPaid!, undefined], ["Escrow balance", s.escrowClosing!, s.disbursed ? `After ${money(s.disbursed)} paid out` : undefined]];
  const cells: Cell[] = figs.map(([label, v, sub], i): Cell => () => <Figure label={label as string} value={plain(v as number, h)} sub={sub as string | undefined} tone={i === 0 ? "green" : "tile"} max={i === 0 ? 120 : 88} />);
  return <GridBand id="summary" title={`${monthLabel(s.month)} at a glance`} sub={`${a.nickname} ${mask(a)}`} lead variant={s.month.length + Number(s.month.slice(5))} cells={cells} />;
}

/** Rows of a summary as a sum: each line signed, the last the total. */
function Sum({ rows }: { rows: [string, number, ("+" | "−" | "=")?][] }) {
  return (
    <table className="sum">
      <tbody>{rows.map(([l, v, op], i) => <tr key={i} className={op === "=" ? "sum__total" : ""}><th scope="row">{l}</th><td className="sum__op" aria-hidden="true">{op ?? ""}</td><td className="num">{money(Math.abs(v))}</td></tr>)}</tbody>
    </table>
  );
}

function Document({ s, a, onPrev, onNext }: { s: Statement; a: Account; onPrev?: () => void; onNext?: () => void }) {
  const set = settings.use();
  const credit = a.group === "credit", loan = a.group === "loan";
  const daily = (() => { const m = new Map<string, number>(); for (const t of s.lines) m.set(t.date, t.balance!); return [...m]; })();
  return (
    <article className="wrap statement" aria-labelledby="st-title">
      <div className="statement__tools no-print">
        <button type="button" className="btn btn--outline btn--small" onClick={onPrev} disabled={!onPrev}><Icon name="left" size={16} />Previous</button>
        <button type="button" className="btn btn--outline btn--small" onClick={onNext} disabled={!onNext}>Next<Icon name="right" size={16} /></button>
        <button type="button" className="btn btn--green btn--small" onClick={() => window.print()}><Icon name="print" size={16} />Print or save as PDF</button>
      </div>
      <header className="statement__head">
        <Mark />
        <div><h2 id="st-title" className="statement__title">{credit ? "Credit card statement" : loan ? "Mortgage statement" : "Statement of account"}</h2><p>{a.product}</p></div>
      </header>
      <div className="statement__parties">
        <address>{CUSTOMER.name}<br />{set.address.line1}<br />{set.address.city}, {set.address.state} {set.address.zip}</address>
        <dl className="facts facts--tight">
          <div><dt>Account</dt><dd>{mask(a)}</dd></div>
          <div><dt>Statement period</dt><dd>{dateLabel(s.start)} – {dateLabel(s.end)}</dd></div>
          {credit && <div><dt>Payment due</dt><dd>{dateLabel(s.dueDate!)}</dd></div>}
          {credit && <div><dt>Credit line</dt><dd>{money(a.limit!)}</dd></div>}
          {loan && <div><dt>Interest rate</dt><dd>{(a.rate! * 100).toFixed(3)}%, fixed</dd></div>}
        </dl>
      </div>
      <section className="statement__part" aria-labelledby="st-sum">
        <h3 id="st-sum">Account summary</h3>
        {a.group === "deposit" && <Sum rows={[["Beginning balance", s.opening], ["Deposits and credits", s.credits, "+"], ["Interest earned", s.interest, "+"], ["Electronic payments and debits", s.debits, "−"], ["Checks paid", s.checks, "−"], ["Fees", s.fees, "−"], ["Ending balance", s.closing, "="]]} />}
        {credit && <Sum rows={[["Previous balance", s.opening], ["Payments", s.payments, "−"], ["Other credits", s.otherCredits, "−"], ["Purchases", s.purchases, "+"], ["Fees charged", 0, "+"], ["Interest charged", 0, "+"], ["New balance", s.closing, "="]]} />}
        {loan && <Sum rows={[["Principal at the start", s.opening], ["Principal paid", s.principalPaid!, "−"], ["Principal at the end", s.closing, "="]]} />}
        {loan && <Sum rows={[["Escrow at the start", s.escrowOpening!], ["Paid into escrow", s.escrowPaid!, "+"], ["Paid out of escrow", s.disbursed!, "−"], ["Escrow at the end", s.escrowClosing!, "="]]} />}
        {credit && (
          <div className="statement__box">
            <p><strong>Minimum payment due {money(s.minimumDue!)}</strong> by {dateLabel(s.dueDate!)}. Autopay will pay the new balance of {money(s.closing)} in full on that schedule, so no interest is charged.</p>
            <p>Paying only the minimum each month makes a balance last much longer and cost more in interest. Purchase APR {(a.rate! * 100).toFixed(2)}%. Cash back earned this statement: {money(s.cashBack!)}.</p>
          </div>
        )}
      </section>
      <section className="statement__part" aria-labelledby="st-tx">
        <h3 id="st-tx">Transactions</h3>
        <div className="tablewrap">
          <table className="act act--doc">
            <thead><tr><th scope="col">Date</th><th scope="col">Description</th>{loan ? <><th scope="col" className="num">Principal</th><th scope="col" className="num">Interest</th><th scope="col" className="num">Escrow</th></> : <th scope="col" className="num">Amount</th>}<th scope="col" className="num">Balance</th></tr></thead>
            <tbody>
              <tr className="act__row act__row--open"><td>{shortDate(addDays(s.start, -1))}</td><td>Beginning balance</td>{loan ? <><td /><td /><td /></> : <td />}<td className="num">{money(s.opening)}</td></tr>
              {s.lines.map((t) => (
                <Fragment key={t.id}>
                  <tr className="act__row">
                    <td>{shortDate(t.date)}</td>
                    <td><strong>{t.desc}</strong>{t.detail && <span className="act__detail">{t.detail}</span>}</td>
                    {loan ? <><td className="num">{t.split ? money(t.split.principal) : t.own ? money(-t.amount) : ""}</td><td className="num">{t.split ? money(t.split.interest) : ""}</td><td className="num">{t.split ? money(t.split.escrow) : t.escrow ? `−${money(-t.escrow)}` : ""}</td></>
                      : <td className="num">{t.amount < 0 ? `−${money(-t.amount)}` : money(t.amount)}</td>}
                    <td className="num">{money(t.balance!)}</td>
                  </tr>
                </Fragment>
              ))}
              <tr className="act__row act__row--close"><td>{shortDate(s.end)}</td><td><strong>Ending balance</strong></td>{loan ? <><td /><td /><td /></> : <td />}<td className="num"><strong>{money(s.closing)}</strong></td></tr>
            </tbody>
          </table>
        </div>
        {credit && <p className="note">Amounts are signed as they change your balance: purchases add to what you owe and payments and credits, shown with a minus, take from it.</p>}
      </section>
      {a.group === "deposit" && daily.length > 0 && (
        <section className="statement__part" aria-labelledby="st-daily">
          <h3 id="st-daily">Daily balance summary</h3>
          <ul className="daily">{daily.map(([d, b]) => <li key={d}><span>{shortDate(d)}</span><span>{money(b)}</span></li>)}</ul>
        </section>
      )}
      <footer className="statement__foot">
        <p>Questions about this statement? Call GIFbank customer service, any hour. In case of errors about your electronic transfers, tell us within 60 days of the statement on which the error appeared.</p>
        <p>GIFbank, N.A. is fictional. This statement was produced by a layout study from invented transactions and is not a record of any real account.</p>
      </footer>
    </article>
  );
}

function Statements({ accts }: { accts: Account[] }) {
  const all = useBooks();
  const set = settings.use();
  const [acct, setAcct] = useState<AccountId>((accts.find((x) => x.id === q.get("a"))?.id) ?? "checking");
  const months = [...STATEMENT_MONTHS].reverse();
  const [year, setYear] = useState(q.get("m")?.slice(0, 4) ?? months[0].slice(0, 4));
  const [month, setMonth] = useState<string | null>(q.get("m") && STATEMENT_MONTHS.includes(q.get("m")!) ? q.get("m") : null);
  const a = accts.find((x) => x.id === acct)!;
  const shown = months.filter((m) => m.startsWith(year));
  const pick = (m: string | null) => { setMonth(m); if (m) setYear(m.slice(0, 4)); const u = new URL(location.href); u.searchParams.set("a", acct); if (m) u.searchParams.set("m", m); else u.searchParams.delete("m"); history.replaceState(null, "", u); if (m) requestAnimationFrame(() => document.getElementById("summary")?.scrollIntoView({ block: "start" })); };
  const s = month ? statement(all, acct, month) : null;
  const i = month ? STATEMENT_MONTHS.indexOf(month) : -1;
  return (
    <>
      <div className="wrap stpick">
        <div className="field"><label htmlFor="st-acct">Account</label><select id="st-acct" value={acct} onChange={(e) => { setAcct(e.target.value as AccountId); setMonth(null); }}>{accts.map((x) => <option key={x.id} value={x.id}>{x.nickname} {mask(x)}</option>)}</select></div>
        <div className="field"><label htmlFor="st-year">Year</label><select id="st-year" value={year} onChange={(e) => setYear(e.target.value)}>{[...new Set(months.map((m) => m.slice(0, 4)))].map((y) => <option key={y}>{y}</option>)}</select></div>
        <p className="note stpick__note">Delivered {set.delivery[acct] === "online" ? "online only" : "online and by mail"}. Statements are kept online for seven years; these accounts' online statements begin in January 2025.</p>
      </div>
      <section className="wrap stlist" aria-labelledby="stl-title">
        <h2 id="stl-title" className="visually-hidden">{a.nickname} statements, {year}</h2>
        <ul className="rows">{shown.map((m) => {
          const st = statement(all, acct, m);
          return (
            <li key={m} className={month === m ? "is-on" : ""}>
              <span className="rows__icon"><Icon name="doc" size={22} /></span>
              <span className="rows__what"><strong>{monthLabel(m)}</strong><span className="note">{dateLabel(st.start)} – {dateLabel(st.end)}</span></span>
              <span className="rows__amt"><span className="note">{a.group === "credit" ? "New balance" : a.group === "loan" ? "Principal" : "Ending balance"}</span> {plain(st.closing, set.hideBalances)}</span>
              <button type="button" className={`btn btn--small ${month === m ? "btn--green" : "btn--outline"}`} aria-pressed={month === m} aria-label={`View the ${monthLabel(m)} statement`} onClick={() => pick(month === m ? null : m)}>{month === m ? "Viewing" : "View"}</button>
            </li>
          );
        })}</ul>
      </section>
      {s && <Summary s={s} a={a} />}
      {s && <Document s={s} a={a} onPrev={i > 0 ? () => pick(STATEMENT_MONTHS[i - 1]) : undefined} onNext={i < STATEMENT_MONTHS.length - 1 ? () => pick(STATEMENT_MONTHS[i + 1]) : undefined} />}
    </>
  );
}

function Tax({ accts }: { accts: Account[] }) {
  const all = useBooks();
  const [open, setOpen] = useState<string | null>(null);
  const t = taxYear(all, 2025);
  const sav = accts.find((x) => x.id === "savings")!, mort = accts.find((x) => x.id === "mortgage")!;
  const docs = [
    { id: "interest", name: "Interest statement, 2025", acct: sav, lines: [["Interest paid", t.interest]] as [string, number][] },
    { id: "mortgage", name: "Mortgage interest statement, 2025", acct: mort, lines: [["Mortgage interest received", t.mortgageInterest], ["Outstanding principal on January 1, 2025", t.principalJan1], ["Property tax paid from escrow", t.propertyTax]] as [string, number][] },
  ];
  return (
    <section className="wrap stlist" aria-labelledby="tax-title">
      <h2 id="tax-title" className="band__title">Tax documents for 2025</h2>
      <ul className="rows">{docs.map((d) => (
        <li key={d.id} className={open === d.id ? "is-on" : ""}>
          <span className="rows__icon"><Icon name="doc" size={22} /></span>
          <span className="rows__what"><strong>{d.name}</strong><span className="note">{d.acct.nickname} {mask(d.acct)} · issued Jan 31, 2026</span></span>
          <button type="button" className="btn btn--outline btn--small" aria-expanded={open === d.id} aria-controls={`tax-${d.id}`} onClick={() => setOpen(open === d.id ? null : d.id)}>{open === d.id ? "Close" : "View"}</button>
          {open === d.id && (
            <div className="taxdoc" id={`tax-${d.id}`}>
              <table className="sum"><tbody>{d.lines.map(([l, v]) => <tr key={l}><th scope="row">{l}</th><td className="num">{money(v)}</td></tr>)}</tbody></table>
              <p className="note">Totals of the year's {d.id === "interest" ? "interest payments in this account's statements" : "mortgage statements: the interest part of each payment, and the property tax paid from escrow"}, in Dollaz.</p>
            </div>
          )}
        </li>
      ))}</ul>
    </section>
  );
}

function Delivery({ accts }: { accts: Account[] }) {
  const set = settings.use();
  const [draft, setDraft] = useState(set.delivery);
  const [agree, setAgree] = useState(false);
  const [said, setSaid] = useState("");
  const toOnline = accts.some((a) => draft[a.id] === "online" && set.delivery[a.id] !== "online");
  const changed = accts.some((a) => draft[a.id] !== set.delivery[a.id]);
  return (
    <form className="wrap panel delivery" onSubmit={(e) => { e.preventDefault(); if (toOnline && !agree) { setSaid("To switch to online only, agree to receive your documents electronically."); return; } settings.set((v) => ({ ...v, delivery: draft })); setAgree(false); setSaid("Delivery preferences saved to this browser."); }}>
      <h2 className="panel__title">Delivery preferences</h2>
      <p className="note">Online statements arrive sooner, and we'll email {set.email} when each is ready. Paper statements also come by mail.</p>
      {accts.map((a) => (
        <fieldset key={a.id} className="delivery__row">
          <legend><strong>{a.nickname}</strong> <span className="note">{mask(a)}</span></legend>
          <label><input type="radio" name={`d-${a.id}`} checked={draft[a.id] === "online"} onChange={() => setDraft({ ...draft, [a.id]: "online" })} />Online only</label>
          <label><input type="radio" name={`d-${a.id}`} checked={draft[a.id] === "paper"} onChange={() => setDraft({ ...draft, [a.id]: "paper" })} />Online and paper</label>
        </fieldset>
      ))}
      {toOnline && <label className="consent"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I agree to receive statements, notices and other documents for these accounts electronically, and I can view and save PDF files.</label>}
      <p className="row"><button type="submit" className="btn btn--green" disabled={!changed}>Save changes</button><button type="button" className="btn btn--outline" disabled={!changed} onClick={() => { setDraft(set.delivery); setAgree(false); setSaid(""); }}>Cancel</button></p>
      <p className="note" role="status">{said}</p>
    </form>
  );
}

function App() {
  const accts = useAccounts();
  const [tab, setTab] = useState<Tab>((TABS.find(([id]) => id === q.get("tab"))?.[0]) ?? "statements");
  return (
    <BankPage current="statements" title="Statements & Documents" source={[REFERENCE.statements, REFERENCE.onlineBanking]}>
      <div className="wrap greet"><h1 className="greet__title">Statements &amp; Documents</h1><p className="note">View, print and save your statements and tax documents, and choose how they're delivered. <a href={accountHref("checking")}>Back to activity</a></p></div>
      <div className="wrap seg" role="tablist" aria-label="Statements and documents">
        {TABS.map(([id, label]) => <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={(e) => { const i = TABS.findIndex(([x]) => x === tab); const n = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : -1; if (n >= 0) { setTab(TABS[n][0]); document.getElementById(`tab-${TABS[n][0]}`)?.focus(); } }}>{label}</button>)}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "statements" && <Statements accts={accts} />}
        {tab === "tax" && <Tax accts={accts} />}
        {tab === "delivery" && <Delivery accts={accts} />}
      </div>
    </BankPage>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
