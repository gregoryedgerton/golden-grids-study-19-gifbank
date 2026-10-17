import { useId, useState, type FormEvent } from "react";
import { Fit } from "./fit";
import { Icon } from "../icons";
import { accountHref } from "../content";
import { balances, mask, money, account as accountOf, TODAY, dateLabel, type Account, type AccountId, type Txn, type Transfer } from "../bank/ledger";
import { settings, transfers, useAccounts, useBooks } from "./store";

/** Money as the page shows it, or hidden when the reader has hidden balances. */
export function Money({ cents, sign, hide }: { cents: number; sign?: boolean; hide?: boolean }) {
  const s = settings.use();
  if (hide ?? s.hideBalances) return <span className="money money--hidden"><span aria-hidden="true">•••••</span><span className="visually-hidden">hidden</span></span>;
  const txt = money(Math.abs(cents));
  return <span className={`money${sign && cents > 0 ? " money--in" : ""}`}>{cents < 0 ? `−${txt}` : sign && cents > 0 ? `+${txt}` : txt}</span>;
}
export const plain = (cents: number, hidden: boolean) => (hidden ? "•••••" : cents < 0 ? `−${money(-cents)}` : money(cents));

/** What each kind of account calls its headline balance. */
export function headline(a: Account, all: Txn[]) {
  const b = balances(all, a.id);
  if (a.group === "deposit") return { label: "Available balance", value: b.available, sub: `Current balance ${money(b.current)}` };
  if (a.group === "credit") return { label: "Current balance", value: b.current, sub: `Available credit ${money(b.available)}` };
  return { label: "Principal balance", value: b.current, sub: "Next payment due Nov 1, 2026" };
}

/** One account as a square: its name, its masked number and its headline balance, opening its activity. */
export function AccountSquare({ a, all, rank }: { a: Account; all: Txn[]; rank: number }) {
  const s = settings.use();
  const h = headline(a, all);
  const shown = plain(h.value, s.hideBalances);
  return (
    <a className={`box box--account box--${a.group}${rank === 0 ? " box--lead" : ""}`} href={accountHref(a.id)} aria-label={`${a.nickname}, ${a.product}, account ${mask(a)}. ${h.label} ${s.hideBalances ? "hidden" : money(h.value)}. View activity.`}>
      <p className="acct__product">{a.product}</p>
      <p className="acct__name">{a.nickname}</p>
      <p className="acct__num">{mask(a)}</p>
      <div className="box__fit"><Fit as="p" className="fit--display fit--num" min={14} max={rank === 0 ? 96 : 64}>{shown}</Fit></div>
      <p className="acct__label">{h.label}</p>
      <p className="acct__sub">{s.hideBalances ? "" : h.sub}</p>
      <span className="box__foot"><span className="linkish">View activity <Icon name="right" size={14} /></span></span>
    </a>
  );
}

/** A figure as large type with its label, in the bank's own tile. */
export function Figure({ label, value, sub, tone = "tile", max = 96 }: { label: string; value: string; sub?: string; tone?: "tile" | "green" | "dark"; max?: number }) {
  return (
    <div className={`box box--${tone} box--figure`}>
      <p className="box__label">{label}</p>
      <div className="box__fit"><Fit as="p" className="fit--display fit--num" min={13} max={max}>{value}</Fit></div>
      {sub && <p className="figure__sub">{sub}</p>}
    </div>
  );
}

const cents = (s: string) => { const t = s.replace(/[$,\s]/g, ""); if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN; return Math.round(Number(t) * 100); };

/**
 * Make a Transfer, in the reference's three steps: the form, a review, and a
 * confirmation with a number. A transfer between the customer's own accounts
 * posts today, so the balances on every page change at once; it can be
 * cancelled the same day. Nothing leaves the browser.
 */
export function TransferPanel({ initialFrom = "checking" as AccountId, initialTo = "savings" as AccountId }: { initialFrom?: AccountId; initialTo?: AccountId }) {
  const all = useBooks();
  const accts = useAccounts();
  const own = transfers.use();
  const id = useId();
  const [from, setFrom] = useState<AccountId>(initialFrom);
  const [to, setTo] = useState<AccountId>(initialTo);
  const [amt, setAmt] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Transfer | null>(null);
  const name = (x: AccountId) => { const a = accts.find((y) => y.id === x)!; return `${a.nickname} ${mask(a)}`; };
  const fromOptions = accts.filter((a) => a.group === "deposit");
  const toOptions = accts.filter((a) => a.id !== from);
  const value = cents(amt);
  const review = (e: FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    const avail = balances(all, from).available;
    const target = accountOf(to)!;
    if (from === to) e2.to = "Choose a different account to transfer to.";
    if (!amt.trim()) e2.amount = "Enter an amount.";
    else if (Number.isNaN(value) || value <= 0) e2.amount = "Enter an amount in dollars and cents, such as 250.00.";
    else if (value > avail) e2.amount = `That's more than the ${money(avail)} available in ${name(from)}.`;
    else if (target.group !== "deposit" && value > balances(all, to).current) e2.amount = `That's more than the ${money(balances(all, to).current)} owed on ${name(to)}.`;
    setErr(e2);
    if (Object.keys(e2).length) { requestAnimationFrame(() => document.getElementById(`${id}${Object.keys(e2)[0]}`)?.focus()); return; }
    setStep("review");
  };
  const confirm = () => {
    const t: Transfer = { id: `T${Date.now().toString(36).toUpperCase()}`, from, to, amount: value, date: TODAY, memo: memo.trim() || undefined };
    transfers.set((l) => [...l, t]);
    setDone(t); setStep("done"); setAmt(""); setMemo("");
  };
  const kind = accountOf(to)!.group === "credit" ? "Card payment" : accountOf(to)!.group === "loan" ? "Additional principal payment" : "Transfer";
  return (
    <section className="panel transfer" id="transfer" aria-labelledby={`${id}h`}>
      <h2 className="panel__title" id={`${id}h`}><Icon name="transfer" size={22} />Make a Transfer</h2>
      <ol className="steps" aria-label="Steps">{["Details", "Review", "Confirmation"].map((s, i) => <li key={s} className={(["form", "review", "done"].indexOf(step) >= i) ? "is-on" : ""} aria-current={["form", "review", "done"].indexOf(step) === i ? "step" : undefined}>{s}</li>)}</ol>
      {step === "form" && (
        <form className="transfer__form" onSubmit={review} noValidate>
          <div className="field"><label htmlFor={`${id}from`}>From</label><select id={`${id}from`} value={from} onChange={(e) => { const f = e.target.value as AccountId; setFrom(f); if (f === to) setTo(f === "checking" ? "savings" : "checking"); }}>{fromOptions.map((a) => <option key={a.id} value={a.id}>{a.nickname} {mask(a)} · {money(balances(all, a.id).available)} available</option>)}</select></div>
          <div className="field"><label htmlFor={`${id}to`}>To</label><select id={`${id}to`} value={to} onChange={(e) => setTo(e.target.value as AccountId)} aria-invalid={err.to ? true : undefined} aria-describedby={err.to ? `${id}to-e` : undefined}>{toOptions.map((a) => <option key={a.id} value={a.id}>{a.nickname} {mask(a)}{a.group === "credit" ? " · payment" : a.group === "loan" ? " · extra principal" : ""}</option>)}</select>{err.to && <p className="field__error" id={`${id}to-e`}>{err.to}</p>}</div>
          <div className="field"><label htmlFor={`${id}amount`}>Amount</label><div className="money-input"><span aria-hidden="true">$</span><input id={`${id}amount`} inputMode="decimal" autoComplete="off" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" aria-invalid={err.amount ? true : undefined} aria-describedby={err.amount ? `${id}amount-e` : undefined} /></div>{err.amount && <p className="field__error" id={`${id}amount-e`}>{err.amount}</p>}</div>
          <div className="field"><label htmlFor={`${id}memo`}>Memo (optional)</label><input id={`${id}memo`} value={memo} maxLength={40} onChange={(e) => setMemo(e.target.value)} /></div>
          <div className="field"><span className="field__label">Date</span><p className="field__static"><Icon name="calendar" size={18} />Today, {dateLabel(TODAY)}</p></div>
          <p className="row"><button type="submit" className="btn btn--green">Review transfer</button></p>
        </form>
      )}
      {step === "review" && (
        <div className="transfer__review">
          <dl className="facts">
            <div><dt>Type</dt><dd>{kind}</dd></div>
            <div><dt>From</dt><dd>{name(from)}</dd></div>
            <div><dt>To</dt><dd>{name(to)}</dd></div>
            <div><dt>Amount</dt><dd>{money(value)}</dd></div>
            <div><dt>Date</dt><dd>{dateLabel(TODAY)}</dd></div>
            {memo.trim() && <div><dt>Memo</dt><dd>{memo.trim()}</dd></div>}
          </dl>
          <p className="note">Transfers between your GIFbank accounts made today post today. This one stays in this browser.</p>
          <p className="row"><button type="button" className="btn btn--green" onClick={confirm}>Confirm transfer</button><button type="button" className="btn btn--outline" onClick={() => setStep("form")}>Edit</button></p>
        </div>
      )}
      {step === "done" && done && (
        <div className="transfer__done" role="status">
          <p className="transfer__ok"><Icon name="tick" size={22} />{kind} of {money(done.amount)} from {name(done.from)} to {name(done.to)} is complete.</p>
          <p className="note">Confirmation number {done.id}. Your balances have been updated.</p>
          <p className="row"><button type="button" className="btn btn--outline" onClick={() => setStep("form")}>Make another transfer</button><a className="btn btn--outline" href={accountHref(done.from)}>View {accountOf(done.from)!.group === "deposit" ? "activity" : "account"}</a></p>
        </div>
      )}
      {own.length > 0 && (
        <div className="transfer__today">
          <h3 className="panel__sub">Today's transfers</h3>
          <ul className="list">{own.map((t) => (
            <li key={t.id}><span><strong>{money(t.amount)}</strong> {name(t.from)} to {name(t.to)}<span className="note"> · {t.id}{t.memo ? ` · ${t.memo}` : ""}</span></span>
              <button type="button" className="btn btn--outline btn--small" aria-label={`Cancel transfer ${t.id}`} onClick={() => transfers.set((l) => l.filter((x) => x.id !== t.id))}>Cancel</button></li>
          ))}</ul>
        </div>
      )}
    </section>
  );
}

/** Hide or show balances everywhere. */
export function HideToggle() {
  const s = settings.use();
  return (
    <button type="button" className="btn btn--outline btn--small" aria-pressed={s.hideBalances} onClick={() => settings.set((v) => ({ ...v, hideBalances: !v.hideBalances }))}>
      <Icon name={s.hideBalances ? "eye" : "eyeOff"} size={18} />{s.hideBalances ? "Show balances" : "Hide balances"}
    </button>
  );
}
