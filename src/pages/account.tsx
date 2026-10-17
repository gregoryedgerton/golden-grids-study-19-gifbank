import { StrictMode, useMemo, useState, Fragment } from "react";
import { createRoot } from "react-dom/client";
import { BankPage } from "../lib/Page";
import { GridBand, type Cell } from "../bands/bands";
import { Figure, HideToggle, Money, plain } from "../lib/bank";
import { Icon } from "../icons";
import { CUSTOMER, PAGES, REFERENCE, accountHref, statementHref } from "../content";
import { MORTGAGE_PAYMENT, STATEMENT_MONTHS, TODAY, addDays, balances, dateLabel, escrowOn, lastDay, lines, mask, money, monthLabel, shortDate, statement, type Account, type Line, type Txn } from "../bank/ledger";
import { settings, useAccounts, useBooks } from "../lib/store";
import "../styles.css";

/**
 * One account. The reference shows an account's balances above its
 * activity, pending items first and posted ones after with a running
 * balance. Here the balances are a grid, the headline balance in the largest
 * square, and the activity stays a table: filters, pending, posted, and each
 * row opening in place to its detail. Every figure is computed from the
 * same transactions the table lists.
 */
const q = new URLSearchParams(location.search);

function Figures({ a, all }: { a: Account; all: Txn[] }) {
  const s = settings.use();
  const h = s.hideBalances;
  const b = balances(all, a.id);
  const since = `${TODAY.slice(0, 7)}-01`;
  const period = lines(all, a.id).filter((t) => !t.pending && t.date >= since);
  const inn = period.filter((t) => t.amount > 0).reduce((n, t) => n + t.amount, 0);
  const out = period.filter((t) => t.amount < 0).reduce((n, t) => n - t.amount, 0);
  const last = statement(all, a.id, STATEMENT_MONTHS[STATEMENT_MONTHS.length - 1]);
  const ytd = (f: (t: Txn) => number) => all.filter((t) => t.account === a.id && !t.pending && t.date.startsWith(TODAY.slice(0, 4))).reduce((n, t) => n + f(t), 0);
  let figs: { label: string; value: string; sub?: string }[];
  if (a.group === "deposit" && a.id === "checking") figs = [
    { label: "Available balance", value: plain(b.available, h), sub: "What you can spend now, after pending debits" },
    { label: "Current balance", value: plain(b.current, h), sub: "Posted transactions only" },
    { label: "Pending", value: plain(b.pending, h), sub: `${all.filter((t) => t.account === a.id && t.pending).length} transactions` },
    { label: "In since Oct 1", value: plain(inn, h) },
    { label: "Out since Oct 1", value: plain(out, h) },
  ];
  else if (a.group === "deposit") figs = [
    { label: "Available balance", value: plain(b.available, h) },
    { label: "Interest paid in 2026", value: plain(ytd((t) => (t.kind === "interest" ? t.amount : 0)), h), sub: `Last paid ${shortDate(last.end)}: ${plain(last.interest, h)}` },
    { label: "Annual percentage yield", value: `${(a.apy! * 100).toFixed(2)}%`, sub: `Interest rate ${(a.rate! * 100).toFixed(2)}%` },
    { label: "Current balance", value: plain(b.current, h) },
    { label: "In since Oct 1", value: plain(inn, h) },
  ];
  else if (a.group === "credit") figs = [
    { label: "Current balance", value: plain(b.current, h), sub: `Plus ${plain(b.pending, h)} pending` },
    { label: "Available credit", value: plain(b.available, h), sub: `Credit line ${money(a.limit!)}` },
    { label: "Statement balance", value: plain(last.closing, h), sub: `Due ${dateLabel(last.dueDate!)} · paid by autopay` },
    { label: "Minimum payment", value: plain(last.minimumDue!, h) },
    { label: "Cash back this statement", value: plain(last.cashBack!, h) },
  ];
  else figs = [
    { label: "Principal balance", value: plain(b.current, h), sub: `Of ${money(a.loan!.original)} borrowed in 2022` },
    { label: "Next payment", value: plain(MORTGAGE_PAYMENT, h), sub: "Due Nov 1, 2026 · by autopay from Everyday Checking" },
    { label: "Interest rate", value: `${(a.rate! * 100).toFixed(3)}%`, sub: "Fixed, 30 years" },
    { label: "Escrow balance", value: plain(escrowOn(all, TODAY), h), sub: "For property tax and insurance" },
    { label: "Interest paid in 2026", value: plain(ytd((t) => t.split?.interest ?? 0), h) },
  ];
  const cells: Cell[] = figs.map((f, i): Cell => () => <Figure label={f.label} value={f.value} sub={f.sub} tone={i === 0 ? "green" : "tile"} max={i === 0 ? 96 : 56} />);
  return <GridBand id="balances" title="Balances" sub={`As of ${dateLabel(TODAY)}`} lead variant={a.id.length} cells={cells} before={<div className="band__tools"><HideToggle /></div>} />;
}

type Range = "period" | "30" | "90" | "year" | string;
const RANGES: { id: Range; label: string }[] = [
  { id: "period", label: "Since last statement" }, { id: "30", label: "Last 30 days" }, { id: "90", label: "Last 90 days" }, { id: "year", label: "This year" },
  ...STATEMENT_MONTHS.slice(-12).reverse().map((m) => ({ id: m, label: `${monthLabel(m)} statement` })),
];
function rangeOf(r: Range): [string, string] {
  if (r === "period") return [`${TODAY.slice(0, 7)}-01`, TODAY];
  if (r === "30") return [addDays(TODAY, -29), TODAY];
  if (r === "90") return [addDays(TODAY, -89), TODAY];
  if (r === "year") return [`${TODAY.slice(0, 4)}-01-01`, TODAY];
  return [`${r}-01`, lastDay(r)];
}

/** A drawn check, for a check's detail: the payee, the amount in figures and words, and the masked account on the line at the foot. */
function CheckImage({ t, a }: { t: Line; a: Account }) {
  const amt = -t.amount;
  const dollars = Math.floor(amt / 100), c = amt % 100;
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const under100 = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? `-${ones[n % 10]}` : ""}`);
  const under1000 = (n: number) => (n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${under100(n % 100)}` : ""}` : under100(n));
  const words = dollars >= 1000 ? `${under1000(Math.floor(dollars / 1000))} Thousand${dollars % 1000 ? ` ${under1000(dollars % 1000)}` : ""}` : under1000(dollars);
  return (
    <figure className="checkimg" role="img" aria-label={`Check ${t.check}, dated ${dateLabel(t.date)}, paid to ${t.detail?.replace("Paid to ", "")}, ${money(amt)}.`}>
      <div className="checkimg__top"><span>{CUSTOMER.first} {CUSTOMER.last}<br />{CUSTOMER.address.line1}</span><span>{t.check}</span></div>
      <div className="checkimg__date">Date <u>{dateLabel(t.date)}</u></div>
      <div className="checkimg__pay">Pay to the order of <u>{t.detail?.replace("Paid to ", "")}</u><span className="checkimg__box">{money(amt).replace("$", "$ ")}</span></div>
      <div className="checkimg__words"><u>{words} and {String(c).padStart(2, "0")}/100</u> Dollars</div>
      <div className="checkimg__foot"><span className="checkimg__bank">GIFbank</span><span className="checkimg__sig">{CUSTOMER.first} {CUSTOMER.last}</span></div>
      <div className="checkimg__micr">⑈{mask(a)}⑈ {t.check}</div>
    </figure>
  );
}

function Activity({ a, all }: { a: Account; all: Txn[] }) {
  const s = settings.use();
  const [range, setRange] = useState<Range>(q.get("r") ?? "period");
  const [type, setType] = useState("all");
  const [text, setText] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(25);
  const [from, to] = rangeOf(range);
  const ls = useMemo(() => lines(all, a.id), [all, a.id]);
  const t0 = text.trim().toLowerCase();
  const credit = a.group === "credit", loan = a.group === "loan";
  const moneyIn = (t: Line) => (credit || loan ? t.amount < 0 : t.amount > 0);
  const match = (t: Line) => t.date >= from && t.date <= to
    && (type === "all" || (type === "in" && moneyIn(t)) || (type === "out" && !moneyIn(t) && t.amount !== 0) || (type === "check" && t.kind === "check") || (type === "pending" && t.pending))
    && (!t0 || `${t.desc} ${t.detail ?? ""} ${t.category} ${money(Math.abs(t.amount))}`.toLowerCase().includes(t0));
  const pend = ls.filter((t) => t.pending && match(t)).reverse();
  const post = ls.filter((t) => !t.pending && match(t)).reverse();
  const totIn = post.filter(moneyIn).reduce((n, t) => n + Math.abs(t.amount), 0);
  const totOut = post.filter((t) => !moneyIn(t)).reduce((n, t) => n + Math.abs(t.amount), 0);
  const cols = loan ? ["Principal", "Interest", "Escrow"] : credit ? ["Charges", "Payments and credits"] : ["Withdrawals", "Deposits"];
  const csv = () => {
    const rows = [["Date", "Description", "Detail", "Category", "Amount", "Balance"], ...post.map((t) => [t.date, t.desc, t.detail ?? "", t.category, (t.amount / 100).toFixed(2), t.balance !== undefined ? (t.balance / 100).toFixed(2) : ""])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const u = URL.createObjectURL(blob); const el = document.createElement("a"); el.href = u; el.download = `gifbank-${a.id}-${from}-to-${to}.csv`; el.click(); URL.revokeObjectURL(u);
  };
  const row = (t: Line) => {
    const isOpen = open === t.id;
    const amounts = loan
      ? [t.split ? <Money cents={t.split.principal} /> : t.own ? <Money cents={-t.amount} /> : "", t.split ? <Money cents={t.split.interest} /> : "", t.split ? <Money cents={t.split.escrow} /> : t.escrow ? <Money cents={t.escrow} /> : ""]
      : [moneyIn(t) ? "" : <Money cents={Math.abs(t.amount)} />, moneyIn(t) ? <Money cents={Math.abs(t.amount)} /> : ""];
    return (
      <Fragment key={t.id}>
        <tr className={`act__row${t.pending ? " is-pending" : ""}${isOpen ? " is-open" : ""}`}>
          <td className="act__date">{shortDate(t.date)}</td>
          <td className="act__desc"><button type="button" className="act__toggle" aria-expanded={isOpen} aria-controls={`d-${t.id}`} onClick={() => setOpen(isOpen ? null : t.id)}><Icon name={isOpen ? "chevron" : "right"} size={16} /><span><strong>{t.desc}</strong><span className="act__detail">{t.pending ? "Pending · " : ""}{t.detail}</span></span></button></td>
          {amounts.map((x, i) => <td key={i} className="act__amt" data-label={cols[i]}>{x}</td>)}
          <td className="act__bal" data-label="Balance">{t.balance !== undefined ? <Money cents={t.balance} /> : <span className="note">Pending</span>}</td>
        </tr>
        {isOpen && (
          <tr className="act__more" id={`d-${t.id}`}><td colSpan={3 + cols.length}>
            <dl className="facts facts--inline">
              <div><dt>{t.pending ? "Authorized" : "Posted"}</dt><dd>{dateLabel(t.date)}</dd></div>
              <div><dt>Category</dt><dd>{t.category}</dd></div>
              <div><dt>Type</dt><dd>{t.detail?.split(" · ")[0]}</dd></div>
              <div><dt>Amount</dt><dd><Money cents={Math.abs(t.amount || t.escrow || 0)} /></dd></div>
              {t.split && <div><dt>Applied</dt><dd>{money(t.split.principal)} principal, {money(t.split.interest)} interest, {money(t.split.escrow)} escrow</dd></div>}
              <div><dt>Reference</dt><dd>{t.id.toUpperCase()}</dd></div>
            </dl>
            {t.kind === "check" && <CheckImage t={t} a={a} />}
            {t.mirror && <p className="note">The other side of this is in <a href={accountHref(t.mirror)}>{t.mirror === "checking" ? "Everyday Checking" : t.mirror === "savings" ? "Rainy Day Fund" : t.mirror === "card" ? "Cash Back Card" : "Home Mortgage"}</a>.</p>}
          </td></tr>
        )}
      </Fragment>
    );
  };
  return (
    <section className="wrap activity" aria-labelledby="act-title">
      <div className="activity__head"><h2 id="act-title" className="band__title">Account activity</h2><button type="button" className="btn btn--outline btn--small" onClick={csv}><Icon name="arrowDown" size={16} />Download CSV</button></div>
      <div className="filters">
        <div className="field"><label htmlFor="f-range">Show</label><select id="f-range" value={range} onChange={(e) => { setRange(e.target.value); setShown(25); }}>{RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
        <div className="field"><label htmlFor="f-type">Type</label><select id="f-type" value={type} onChange={(e) => { setType(e.target.value); setShown(25); }}><option value="all">All transactions</option><option value="in">{credit ? "Payments and credits" : loan ? "Payments" : "Deposits"}</option><option value="out">{credit ? "Charges" : loan ? "Escrow disbursements" : "Withdrawals"}</option>{a.id === "checking" && <option value="check">Checks</option>}<option value="pending">Pending</option></select></div>
        <div className="field field--grow"><label htmlFor="f-text">Search</label><input id="f-text" type="search" value={text} placeholder="Description, category or amount" onChange={(e) => { setText(e.target.value); setShown(25); }} /></div>
      </div>
      <p className="activity__sum" role="status">{dateLabel(from)} to {dateLabel(to)}: {post.length} posted{pend.length ? `, ${pend.length} pending` : ""}{!loan && !s.hideBalances ? ` · ${credit ? "payments and credits" : "deposits"} ${money(totIn)} · ${credit ? "charges" : "withdrawals"} ${money(totOut)}` : ""}</p>
      <div className="tablewrap">
        <table className="act">
          <caption className="visually-hidden">Activity for {a.nickname} {mask(a)}</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Description</th>{cols.map((c) => <th key={c} scope="col" className="num">{c}</th>)}<th scope="col" className="num">{loan ? "Principal balance" : "Balance"}</th></tr></thead>
          {pend.length > 0 && <tbody className="act__pending"><tr><th colSpan={3 + cols.length} scope="rowgroup" className="act__group">Pending</th></tr>{pend.map(row)}</tbody>}
          <tbody>{post.length > 0 && <tr><th colSpan={3 + cols.length} scope="rowgroup" className="act__group">Posted</th></tr>}{post.slice(0, shown).map(row)}</tbody>
        </table>
      </div>
      {post.length === 0 && pend.length === 0 && <p className="note">No transactions match.</p>}
      {post.length > shown && <p className="row"><button type="button" className="btn btn--outline" onClick={() => setShown(shown + 25)}>Show more ({post.length - shown} more)</button></p>}
    </section>
  );
}

function Details({ a }: { a: Account }) {
  const s = settings.use();
  return (
    <details className="wrap acctdetails">
      <summary>Account details</summary>
      <dl className="facts">
        <div><dt>Product</dt><dd>{a.product}</dd></div>
        <div><dt>Nickname</dt><dd>{a.nickname} · <a href={`${PAGES.settings}?s=accounts`}>Change</a></dd></div>
        <div><dt>Account number</dt><dd>{mask(a)}</dd></div>
        <div><dt>Opened</dt><dd>{dateLabel(a.opened)}</dd></div>
        <div><dt>Owner</dt><dd>{CUSTOMER.first} {CUSTOMER.last}</dd></div>
        <div><dt>Statements</dt><dd>{s.delivery[a.id] === "online" ? "Online only" : "Online and paper"} · <a href={`${PAGES.statements}?a=${a.id}&tab=delivery`}>Change</a></dd></div>
        {a.group === "deposit" && a.id === "checking" && <div><dt>Monthly fee</dt><dd>$0.00, waived with a $500 daily balance</dd></div>}
        {a.limit && <div><dt>Credit line</dt><dd>{money(a.limit)} · Purchase APR {(a.rate! * 100).toFixed(2)}%</dd></div>}
        {a.loan && <div><dt>Loan</dt><dd>{money(a.loan.original)}, {a.loan.termMonths / 12} years, first payment {dateLabel(a.loan.firstPayment)}</dd></div>}
      </dl>
    </details>
  );
}

function App() {
  const all = useBooks();
  const accts = useAccounts();
  const a = accts.find((x) => x.id === q.get("a")) ?? accts[0];
  return (
    <BankPage current="account" title={a.nickname} source={[REFERENCE.myTd, REFERENCE.onlineBanking]}>
      <nav className="wrap crumbs" aria-label="Breadcrumb"><ol><li><a href={PAGES.accounts}>Accounts</a></li><li aria-current="page">{a.nickname}</li></ol></nav>
      <div className="wrap accthead">
        <div>
          <h1 className="accthead__title">{a.nickname}</h1>
          <p className="note">{a.product} · {mask(a)}</p>
        </div>
        <div className="accthead__acts">
          <div className="field"><label htmlFor="switch">Switch account</label><select id="switch" value={a.id} onChange={(e) => location.assign(accountHref(e.target.value))}>{accts.map((x) => <option key={x.id} value={x.id}>{x.nickname} {mask(x)}</option>)}</select></div>
          {a.group === "deposit" && <a className="btn btn--green" href={`${PAGES.accounts}#transfer`}><Icon name="transfer" size={18} />Transfer</a>}
          {a.group !== "deposit" && <a className="btn btn--green" href={`${PAGES.accounts}?to=${a.id}#transfer`}><Icon name="transfer" size={18} />Make a payment</a>}
          <a className="btn btn--outline" href={statementHref(a.id)}><Icon name="doc" size={18} />Statements</a>
        </div>
      </div>
      <Figures a={a} all={all} />
      <Details a={a} />
      <Activity a={a} all={all} />
    </BankPage>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
