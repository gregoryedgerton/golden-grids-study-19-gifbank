import { useId } from "react";
import { Fit } from "./fit";
import { Icon } from "../icons";
import { accountHref } from "../content";
import { balances, mask, money, shortDate, upcoming, TODAY, dateLabel, type Account, type AccountId, type Txn } from "../bank/ledger";
import { settings, useAccounts, useBooks } from "./store";

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
      <div className="box__fit"><Fit as="p" className="fit--display fit--num" min={14} max={rank === 0 ? 120 : 96}>{shown}</Fit></div>
      <p className="acct__label">{h.label}</p>
      <p className="acct__sub">{s.hideBalances ? "" : h.sub}</p>
      <span className="box__foot"><span className="linkish">View activity <Icon name="right" size={14} /></span></span>
    </a>
  );
}

/** A figure as large type with its label, in the bank's own tile. */
export function Figure({ label, value, sub, tone = "tile", max = 120 }: { label: string; value: string; sub?: string; tone?: "tile" | "green" | "dark"; max?: number }) {
  return (
    <div className={`box box--${tone} box--figure`}>
      <p className="box__label">{label}</p>
      <div className="box__fit"><Fit as="p" className="fit--display fit--num" min={13} max={max}>{value}</Fit></div>
      {sub && <p className="figure__sub">{sub}</p>}
    </div>
  );
}

/**
 * Transfers between the customer's own accounts, read from the books: what
 * is scheduled over the next three weeks and what posted most recently (the
 * standing transfer to savings and the automatic payments to the card and
 * the mortgage). The reference's Make a Transfer is a form; the study shows
 * the transfers and makes none, since a bank-styled form that moves money
 * reads as phishing (CLAUDE.md, Safe Browsing remediation).
 */
export function TransfersPanel() {
  const all = useBooks();
  const accts = useAccounts();
  const id = useId();
  const acct = (x: AccountId) => accts.find((y) => y.id === x)!;
  const scheduled = upcoming(all).filter((u) => u.to).map((u) => ({ key: `${u.date}-${u.to}`, date: u.date, from: u.account, to: u.to!, amount: -u.amount, detail: u.detail }));
  const recent = all.filter((t) => t.mirror && t.kind === "transfer-out").slice(-6).reverse().map((t) => ({ key: t.id, date: t.date, from: t.account, to: t.mirror!, amount: -t.amount, detail: t.detail?.split(" · ")[0] ?? "" }));
  const rows = (items: typeof recent) => (
    <ul className="rows">{items.map((r) => (
      <li key={r.key}>
        <span className="rows__date">{shortDate(r.date)}</span>
        <span className="rows__what"><strong>To {acct(r.to).nickname}</strong><span className="note">From {acct(r.from).nickname} {mask(acct(r.from))} · {r.detail}</span></span>
        <span className="rows__amt"><Money cents={r.amount} /></span>
      </li>
    ))}</ul>
  );
  return (
    <section className="panel transfers" id="transfer" aria-labelledby={`${id}h`}>
      <h2 className="panel__title" id={`${id}h`}><Icon name="transfer" size={22} />Transfers between your accounts</h2>
      <p className="note">The standing transfer to savings and the automatic payments to the card and the mortgage, as the account records show them on {dateLabel(TODAY)}. The demo lists transfers; it does not make them.</p>
      <div className="twocol transfers__cols">
        <div className="transfers__col"><h3 className="panel__sub">Scheduled</h3>{rows(scheduled)}</div>
        <div className="transfers__col"><h3 className="panel__sub">Recent</h3>{rows(recent)}</div>
      </div>
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
