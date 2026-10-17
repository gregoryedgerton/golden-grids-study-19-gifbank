/**
 * GIFbank's books for one fictional customer, from 1 January 2025 to the
 * study's present, 16 October 2026. Every charge is invented; every number
 * is computed. Nothing on a page is typed in as a total: balances, running
 * balances, statements, interest, the mortgage's split and the card's
 * statement balance all come from the transactions below, so they add up by
 * construction, and `captures/ledger-check.mjs` checks that they do.
 *
 * Money is held in whole cents. The sign of an amount is its effect on the
 * account's balance as the account counts it: for checking and savings the
 * balance is money held, so a deposit is positive; for the credit card and
 * the mortgage the balance is money owed, so a purchase is positive and a
 * payment negative. The mortgage's escrow is tracked beside its principal.
 *
 * The generator is seeded, so the books are the same on every load. This
 * file imports nothing and touches no browser API, so Node can run it too.
 */

export type AccountId = "checking" | "savings" | "card" | "mortgage";
export type Kind =
  | "deposit" | "withdrawal" | "debit" | "check" | "bill" | "atm" | "fee" | "interest" | "transfer-in" | "transfer-out"
  | "purchase" | "payment" | "credit" | "escrow-out";
export type Category =
  | "Income" | "Home" | "Utilities" | "Groceries" | "Dining" | "Transportation" | "Shopping" | "Health" | "Entertainment"
  | "Travel" | "Fitness" | "Cash" | "Fees" | "Gifts" | "Transfers" | "Interest";

export interface Account {
  id: AccountId;
  product: string;
  /** What the customer calls it, which Settings can change. */
  nickname: string;
  /** Only the last four digits are ever shown. */
  last4: string;
  /** How many digits the full number has, for the mask. */
  digits: number;
  group: "deposit" | "credit" | "loan";
  opened: string;
  /** Annual interest rate, as a fraction. */
  rate?: number;
  apy?: number;
  /** Credit line, in cents. */
  limit?: number;
  /** Cash back, as a fraction, by category; anything else earns `other`. */
  cashBack?: { Groceries: number; Dining: number; other: number };
  /** Loan terms. */
  loan?: { original: number; termMonths: number; firstPayment: string; escrow: number };
}

export interface Txn {
  id: string;
  account: AccountId;
  date: string;
  desc: string;
  detail?: string;
  kind: Kind;
  amount: number;
  category: Category;
  pending?: boolean;
  check?: number;
  /** For a mortgage payment: how the payment was applied. */
  split?: { principal: number; interest: number; escrow: number };
  /** Effect on the mortgage's escrow balance. */
  escrow?: number;
  /** A reader's own transfer, kept in the browser. */
  own?: boolean;
  /** The other side of a transfer between the customer's own accounts. */
  mirror?: AccountId;
}

/** The study's present. Activity on or after `PENDING_FROM` is still pending. */
export const TODAY = "2026-10-16";
export const PENDING_FROM = "2026-10-15";
export const START = "2025-01-01";

export const ACCOUNTS: Account[] = [
  { id: "checking", product: "GIF Complete Checking", nickname: "Everyday Checking", last4: "4821", digits: 10, group: "deposit", opened: "2019-06-03" },
  { id: "savings", product: "GIF Signature Savings", nickname: "Rainy Day Fund", last4: "7735", digits: 10, group: "deposit", opened: "2019-06-03", rate: 0.0149, apy: 0.015 },
  { id: "card", product: "GIF Cash Credit Card", nickname: "Cash Back Card", last4: "3096", digits: 16, group: "credit", opened: "2021-02-11", limit: 1200000, rate: 0.2499, cashBack: { Groceries: 0.02, Dining: 0.02, other: 0.01 } },
  { id: "mortgage", product: "GIF Home Mortgage", nickname: "Home Mortgage", last4: "0938", digits: 10, group: "loan", opened: "2022-06-24", rate: 0.06125, loan: { original: 34000000, termMonths: 360, firstPayment: "2022-08-01", escrow: 71500 } },
];
export const account = (id: string) => ACCOUNTS.find((a) => a.id === id);

/** Opening balances on 1 January 2025: what the books carried in. */
export const OPENING: Record<AccountId, number> = { checking: 421255, savings: 1180000, card: 128436, mortgage: 0 };
export const ESCROW_OPENING = 214000;

// --- Dates, in UTC, as YYYY-MM-DD -------------------------------------------------------
const toDate = (s: string) => new Date(`${s}T12:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const dow = (s: string) => toDate(s).getUTCDay();
const weekend = (s: string) => dow(s) === 0 || dow(s) === 6;
/** A date moved to the next business day. */
const next = (s: string) => { let d = s; while (weekend(d)) d = addDays(d, 1); return d; };
/** A date moved to the previous business day: payroll lands early, not late. */
const prev = (s: string) => { let d = s; while (weekend(d)) d = addDays(d, -1); return d; };
const ym = (s: string) => s.slice(0, 7);
const day = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export const lastDay = (month: string) => { const [y, m] = month.split("-").map(Number); return iso(new Date(Date.UTC(y, m, 0, 12))); };
export const monthsBetween = (from: string, to: string) => { const out: string[] = []; let [y, m] = from.split("-").map(Number); const [ty, tm] = to.split("-").map(Number); while (y < ty || (y === ty && m <= tm)) { out.push(`${y}-${String(m).padStart(2, "0")}`); m++; if (m > 12) { m = 1; y++; } } return out; };

// --- A seeded generator ---------------------------------------------------------------------
function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// --- The mortgage: a fixed-rate loan, its monthly payment and where the loan stood in January 2025 ---
const MORTGAGE = ACCOUNTS[3];
const monthlyRate = MORTGAGE.rate! / 12;
/** Principal and interest, rounded to the cent. */
export const MORTGAGE_PI = Math.round(MORTGAGE.loan!.original * monthlyRate / (1 - Math.pow(1 + monthlyRate, -MORTGAGE.loan!.termMonths)));
export const MORTGAGE_PAYMENT = MORTGAGE_PI + MORTGAGE.loan!.escrow;
function principalBefore(firstPayment: string, before: string) {
  let bal = MORTGAGE.loan!.original;
  for (const m of monthsBetween(ym(firstPayment), ym(addDays(`${ym(before)}-01`, -1)))) {
    void m;
    const interest = Math.round(bal * monthlyRate);
    bal -= MORTGAGE_PI - interest;
  }
  return bal;
}
OPENING.mortgage = principalBefore(MORTGAGE.loan!.firstPayment, START);

// --- The merchants and payees, all invented ------------------------------------------------
const ELECTRIC = [16800, 15200, 12100, 9600, 8800, 12400, 17100, 17600, 13300, 9400, 10900, 14900];
const DINING = ["Larkin & Lime Kitchen", "Osteria Ventisei", "Nori Corner", "Copper Kettle Diner", "Saffron Lane", "Hearth & Hops"];
const SHOPS = [["Parcelwise Online", 1400, 9600], ["Tidewater Books", 1200, 3800], ["Gilded Thimble Gifts", 1800, 6400], ["Ferrous Hardware", 900, 5200]] as const;

export interface Transfer { id: string; from: AccountId; to: AccountId; amount: number; date: string; memo?: string }

/**
 * Builds every transaction from January 2025 to today, in date order, with
 * the reader's own transfers (dated today) added. Card autopay pays each
 * statement's balance in full, so the books keep the card's month-end
 * balance as they go.
 */
export function build(own: Transfer[] = []): Txn[] {
  const r = mulberry32(19_2026);
  const between = (lo: number, hi: number) => Math.round(lo + r() * (hi - lo));
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const out: Txn[] = [];
  let n = 0;
  const add = (t: Omit<Txn, "id">) => { out.push({ ...t, id: `t${(++n).toString(36)}` }); };
  const xfer = (date: string, from: AccountId, to: AccountId, amount: number, descFrom: string, descTo: string, detail?: string, category: Category = "Transfers", ownT = false) => {
    add({ account: from, date, desc: descFrom, detail, kind: from === "card" ? "credit" : "transfer-out", amount: from === "card" || from === "mortgage" ? amount : -amount, category, mirror: to, own: ownT || undefined });
    add({ account: to, date, desc: descTo, detail, kind: to === "card" ? "payment" : "transfer-in", amount: to === "card" || to === "mortgage" ? -amount : amount, category, mirror: from, own: ownT || undefined });
  };

  let cardBal = OPENING.card;
  let cardStatement = OPENING.card;
  let principal = OPENING.mortgage;
  let check = 1101;
  let saveBal = OPENING.savings;
  let accrued = 0;

  for (let d = START; d <= TODAY; d = addDays(d, 1)) {
    const [y, m, dd] = d.split("-").map(Number);
    const month = ym(d);
    const pending = d >= PENDING_FROM;

    // Payroll on the 1st and the 15th, a business day early when they fall on a weekend; a raise in March 2026.
    for (const pay of [day(y, m, 1), day(y, m, 15)]) if (prev(pay) === d) add({ account: "checking", date: d, desc: "Fernwood Design Co.", detail: "Direct deposit · Payroll", kind: "deposit", amount: d >= "2026-03-01" ? 281215 : 271240, category: "Income" });
    // A payroll that falls early can land in the month before; catch the 1st of next month landing today.
    if (dd >= 27) { const n1 = (m === 12 ? day(y + 1, 1, 1) : day(y, m + 1, 1)); if (prev(n1) === d && ym(n1) !== month) add({ account: "checking", date: d, desc: "Fernwood Design Co.", detail: "Direct deposit · Payroll", kind: "deposit", amount: n1 >= "2026-03-01" ? 281215 : 271240, category: "Income" }); }

    // The mortgage: automatic payment on the 1st, or the next business day.
    if (next(day(y, m, 1)) === d) {
      const interest = Math.round(principal * monthlyRate);
      const toPrincipal = MORTGAGE_PI - interest;
      principal -= toPrincipal;
      add({ account: "checking", date: d, desc: "GIFbank Home Mortgage", detail: `Automatic payment · Mortgage XXXXXX${MORTGAGE.last4}`, kind: "transfer-out", amount: -MORTGAGE_PAYMENT, category: "Home", mirror: "mortgage" });
      add({ account: "mortgage", date: d, desc: "Payment received", detail: "Automatic payment from Everyday Checking", kind: "payment", amount: -toPrincipal, category: "Home", split: { principal: toPrincipal, interest, escrow: MORTGAGE.loan!.escrow }, escrow: MORTGAGE.loan!.escrow, mirror: "checking" });
    }
    // Escrow pays the property tax each quarter and the homeowners insurance each March.
    if (dd === 1 && [2, 5, 8, 11].includes(m)) add({ account: "mortgage", date: d, desc: "County tax collector", detail: "Escrow disbursement · Property tax, quarterly", kind: "escrow-out", amount: 0, escrow: -182050, category: "Home" });
    if (dd === 15 && m === 3) add({ account: "mortgage", date: d, desc: "Larkfield Mutual Insurance", detail: "Escrow disbursement · Homeowners insurance, annual", kind: "escrow-out", amount: 0, escrow: -126800, category: "Home" });

    // Savings: a standing transfer on the 2nd.
    if (next(day(y, m, 2)) === d) xfer(d, "checking", "savings", 75000, "Transfer to Rainy Day Fund", "Transfer from Everyday Checking", "Recurring transfer");
    if (d === "2025-08-04") xfer(d, "savings", "checking", 200000, "Transfer to Everyday Checking", "Transfer from Rainy Day Fund", "One-time transfer");

    // The card's autopay on the 20th pays the last statement's balance in full.
    if (next(day(y, m, 20)) === d && cardStatement > 0) {
      add({ account: "checking", date: d, desc: "GIF Cash Credit Card", detail: `Automatic payment · Card XXXXXXXXXXXX${ACCOUNTS[2].last4}`, kind: "transfer-out", amount: -cardStatement, category: "Transfers", mirror: "card" });
      add({ account: "card", date: d, desc: "Payment — thank you", detail: "Automatic payment from Everyday Checking", kind: "payment", amount: -cardStatement, category: "Transfers", mirror: "checking" });
      cardBal -= cardStatement;
    }

    // Bills.
    if (dd === 12) add({ account: "checking", date: d, desc: "Brightwater Electric", detail: "Bill Pay", kind: "bill", amount: -(ELECTRIC[m - 1] + between(-900, 900)), category: "Utilities" });
    if (dd === 18) add({ account: "checking", date: d, desc: "Halyard Wireless", detail: "Automatic payment", kind: "bill", amount: -6500, category: "Utilities" });
    if (dd === 22) add({ account: "checking", date: d, desc: "Kestrel Fiber", detail: "Automatic payment · Internet", kind: "bill", amount: -5999, category: "Utilities" });
    if (dd === 8 && [1, 4, 7, 10].includes(m)) add({ account: "checking", date: d, desc: "Millbrook Water Utility", detail: "Bill Pay · Quarterly", kind: "bill", amount: -between(9800, 12600), category: "Utilities" });

    // Cards and cash day to day.
    const wd = dow(d);
    if (wd === 6) {
      const week = Math.floor((toDate(d).getTime() - toDate(START).getTime()) / 6048e5);
      const amt = between(6800, 16500);
      if (week % 2) { add({ account: "card", date: d, desc: "Corner Fig Market", detail: "Purchase", kind: "purchase", amount: amt, category: "Groceries", pending }); if (!pending) cardBal += amt; }
      else add({ account: "checking", date: d, desc: "Corner Fig Market", detail: `Debit card purchase · Card XXXX${ACCOUNTS[0].last4}`, kind: "debit", amount: -amt, category: "Groceries", pending });
    }
    if (r() < 0.2) add({ account: "checking", date: d, desc: "Bean & Bramble Coffee", detail: `Debit card purchase · Card XXXX${ACCOUNTS[0].last4}`, kind: "debit", amount: -between(425, 1180), category: "Dining", pending });
    if (r() < 0.072) add({ account: "checking", date: d, desc: "Pinecrest Fuel", detail: `Debit card purchase · Card XXXX${ACCOUNTS[0].last4}`, kind: "debit", amount: -between(3400, 5800), category: "Transportation", pending });
    if (r() < 0.035) add({ account: "checking", date: d, desc: "Maple Row Pharmacy", detail: `Debit card purchase · Card XXXX${ACCOUNTS[0].last4}`, kind: "debit", amount: -between(899, 4620), category: "Health", pending });
    if (r() < 0.1) { const amt = between(2400, 9800); add({ account: "card", date: d, desc: pick(DINING), detail: "Purchase", kind: "purchase", amount: amt, category: "Dining", pending }); if (!pending) cardBal += amt; }
    if (r() < (m === 12 && y === 2025 ? 0.32 : 0.07)) { const [name, lo, hi] = pick(SHOPS); const amt = between(lo, hi); add({ account: "card", date: d, desc: name, detail: "Online purchase", kind: "purchase", amount: amt, category: "Shopping", pending }); if (!pending) cardBal += amt; }
    // Subscriptions on the card.
    const subs: [number, string, number, Category][] = [[3, "Larkspur Fitness", 3900, "Fitness"], [7, "Reelbox", 1549, "Entertainment"], [14, "Songbird Music", d >= "2026-01-01" ? 1199 : 1099, "Entertainment"]];
    for (const [on, name, amt, cat] of subs) if (dd === on) { add({ account: "card", date: d, desc: name, detail: "Recurring purchase", kind: "purchase", amount: amt, category: cat, pending }); if (!pending) cardBal += amt; }
    // ATM cash, about monthly; three times at another bank's machine, which costs a fee.
    if (dd === 9 || (dd === 10 && wd === 0)) {
      const foreign = ["2025-03", "2025-11", "2026-06"].includes(month);
      add({ account: "checking", date: d, desc: foreign ? "ATM withdrawal" : "GIFbank ATM withdrawal", detail: foreign ? "Non-GIFbank ATM · Atlantic City, NJ" : "GIFbank ATM · Haddonfield, NJ", kind: "atm", amount: foreign ? -6000 : -10000, category: "Cash", pending });
      if (foreign && !pending) add({ account: "checking", date: d, desc: "Non-GIFbank ATM fee", detail: "Fee", kind: "fee", amount: -300, category: "Fees" });
    }
    // Checks: the lawn service, April to October, and one large repair.
    if (dd === 5 && m >= 4 && m <= 10) add({ account: "checking", date: d, desc: `Check ${check}`, detail: "Paid to Hollis Lawn Care", kind: "check", amount: -8500, category: "Home", check: check++ });
    if (d === "2025-05-21") add({ account: "checking", date: d, desc: `Check ${check}`, detail: "Paid to Ridgeview Auto Service", kind: "check", amount: -118420, category: "Transportation", check: check++ });

    // Once-only events.
    const once: Record<string, () => void> = {
      "2025-03-14": () => add({ account: "checking", date: d, desc: "U.S. Treasury", detail: "Direct deposit · Tax refund", kind: "deposit", amount: 118200, category: "Income" }),
      "2026-03-20": () => add({ account: "checking", date: d, desc: "U.S. Treasury", detail: "Direct deposit · Tax refund", kind: "deposit", amount: 96400, category: "Income" }),
      "2025-03-08": () => add({ account: "checking", date: d, desc: "Send Money from Priya S.", detail: "Dinner, split", kind: "deposit", amount: 4500, category: "Gifts" }),
      "2025-06-14": () => add({ account: "checking", date: d, desc: "Send Money to Sam K.", detail: "Concert tickets", kind: "withdrawal", amount: -6000, category: "Gifts" }),
      "2025-09-27": () => add({ account: "checking", date: d, desc: "Send Money from Priya S.", detail: "Groceries", kind: "deposit", amount: 3200, category: "Gifts" }),
      "2026-01-17": () => add({ account: "checking", date: d, desc: "Send Money to Dana L.", detail: "Birthday", kind: "withdrawal", amount: -12500, category: "Gifts" }),
      "2026-05-02": () => add({ account: "checking", date: d, desc: "Send Money from Priya S.", detail: "Cabin weekend, split", kind: "deposit", amount: 27500, category: "Gifts" }),
      "2026-08-22": () => add({ account: "checking", date: d, desc: "Send Money to Sam K.", detail: "Ballgame", kind: "withdrawal", amount: -4000, category: "Gifts" }),
      "2025-07-03": () => { add({ account: "card", date: d, desc: "Northbound Rail", detail: "Purchase · Tickets", kind: "purchase", amount: 18600, category: "Travel" }); cardBal += 18600; },
      "2025-07-12": () => { add({ account: "card", date: d, desc: "Sandpiper Cottages, Cape May", detail: "Purchase · Lodging", kind: "purchase", amount: 64218, category: "Travel" }); cardBal += 64218; },
      "2025-10-09": () => { add({ account: "card", date: d, desc: "Parcelwise Online", detail: "Return · Credit", kind: "credit", amount: -3899, category: "Shopping" }); cardBal -= 3899; },
      // Still pending today: a coffee and a dinner from yesterday, and this morning's fuel.
      "2026-10-15": () => { add({ account: "card", date: d, desc: "Hearth & Hops", detail: "Purchase", kind: "purchase", amount: 6412, category: "Dining", pending: true }); add({ account: "checking", date: d, desc: "Bean & Bramble Coffee", detail: `Debit card purchase · Card XXXX${ACCOUNTS[0].last4}`, kind: "debit", amount: -785, category: "Dining", pending: true }); },
      "2026-10-16": () => add({ account: "checking", date: d, desc: "Pinecrest Fuel", detail: `Debit card purchase · Card XXXX${ACCOUNTS[0].last4}`, kind: "debit", amount: -4718, category: "Transportation", pending: true }),
      "2026-04-11": () => { add({ account: "card", date: d, desc: "Ferrous Hardware", detail: "Purchase · Garden", kind: "purchase", amount: 21744, category: "Home" }); cardBal += 21744; },
    };
    once[d]?.();

    // Savings interest accrues on each day's closing balance and is paid on the last day of the month.
    saveBal = OPENING.savings + out.filter((t) => t.account === "savings").reduce((s, t) => s + t.amount, 0);
    accrued += saveBal * (ACCOUNTS[1].rate! / 365);
    if (d === lastDay(month) && d < TODAY) {
      const interest = Math.round(accrued);
      add({ account: "savings", date: d, desc: "Interest paid", detail: `Rate ${(ACCOUNTS[1].rate! * 100).toFixed(2)}% · APY ${(ACCOUNTS[1].apy! * 100).toFixed(2)}%`, kind: "interest", amount: interest, category: "Interest" });
      accrued = 0;
    }
    // The card's statement closes on the last day of the month.
    if (d === lastDay(month)) cardStatement = cardBal;
  }

  // The reader's own transfers, posted today after everything else.
  for (const t of own) {
    const a = account(t.from)!, b = account(t.to)!;
    const memo = t.memo ? ` · ${t.memo}` : "";
    if (t.to === "card") xfer(TODAY, t.from, "card", t.amount, `Payment to ${b.nickname}`, "Payment — thank you", `Online transfer${memo}`, "Transfers", true);
    else if (t.to === "mortgage") xfer(TODAY, t.from, "mortgage", t.amount, `Extra principal to ${b.nickname}`, "Additional principal received", `Online transfer${memo}`, "Transfers", true);
    else xfer(TODAY, t.from, t.to, t.amount, `Transfer to ${b.nickname}`, `Transfer from ${a.nickname}`, `Online transfer${memo}`, "Transfers", true);
  }
  for (const t of out) if (t.own) t.id = `o-${t.id}`;
  return out;
}

// --- Reading the books ------------------------------------------------------------------------
export interface Line extends Txn { balance?: number }
/** Posted transactions of one account with the balance after each, oldest first. Pending ones carry no balance. */
export function lines(all: Txn[], id: AccountId): Line[] {
  let bal = OPENING[id];
  return all.filter((t) => t.account === id).map((t) => {
    if (t.pending) return { ...t };
    bal += t.amount;
    return { ...t, balance: bal };
  });
}
export const posted = (all: Txn[], id: AccountId) => all.filter((t) => t.account === id && !t.pending);
export const pendingOf = (all: Txn[], id: AccountId) => all.filter((t) => t.account === id && t.pending);
export const balanceOn = (all: Txn[], id: AccountId, date: string) => OPENING[id] + posted(all, id).filter((t) => t.date <= date).reduce((s, t) => s + t.amount, 0);
export const escrowOn = (all: Txn[], date: string) => ESCROW_OPENING + posted(all, "mortgage").filter((t) => t.date <= date).reduce((s, t) => s + (t.escrow ?? 0), 0);

export interface Balances { current: number; available: number; pending: number }
/**
 * Current balance counts posted activity; the available balance also takes
 * off pending debits at once (and, for the card, adds pending charges to
 * what is owed). A deposit account's available balance never counts a
 * pending credit.
 */
export function balances(all: Txn[], id: AccountId): Balances {
  const current = balanceOn(all, id, TODAY);
  const p = pendingOf(all, id).reduce((s, t) => s + t.amount, 0);
  const a = account(id)!;
  if (a.group === "credit") return { current, pending: p, available: a.limit! - current - p };
  if (a.group === "loan") return { current, pending: 0, available: 0 };
  const pendingDebits = pendingOf(all, id).filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  return { current, pending: p, available: current + pendingDebits };
}

// --- Statements -------------------------------------------------------------------------------
export interface Statement {
  account: AccountId;
  month: string;
  start: string;
  end: string;
  opening: number;
  closing: number;
  lines: Line[];
  /** Deposit accounts. */
  credits: number;
  debits: number;
  checks: number;
  fees: number;
  interest: number;
  /** The card. */
  payments: number;
  otherCredits: number;
  purchases: number;
  cashBack?: number;
  minimumDue?: number;
  dueDate?: string;
  /** The mortgage. */
  principalPaid?: number;
  interestPaid?: number;
  escrowPaid?: number;
  escrowOpening?: number;
  escrowClosing?: number;
  disbursed?: number;
}

/** Statements close on the last day of each month; the first is January 2025 and the last is the month before today's. */
export const STATEMENT_MONTHS = monthsBetween("2025-01", "2026-09");

export function statement(all: Txn[], id: AccountId, month: string): Statement {
  const start = `${month}-01`, end = lastDay(month);
  const before = addDays(start, -1);
  const opening = balanceOn(all, id, before);
  const ls = lines(all, id).filter((t) => !t.pending && t.date >= start && t.date <= end);
  const sum = (f: (t: Line) => boolean) => ls.filter(f).reduce((s, t) => s + t.amount, 0);
  const closing = opening + ls.reduce((s, t) => s + t.amount, 0);
  const st: Statement = {
    account: id, month, start, end, opening, closing, lines: ls,
    credits: sum((t) => t.amount > 0 && t.kind !== "interest"),
    checks: sum((t) => t.kind === "check"),
    fees: sum((t) => t.kind === "fee"),
    interest: sum((t) => t.kind === "interest"),
    debits: sum((t) => t.amount < 0 && t.kind !== "check" && t.kind !== "fee"),
    payments: sum((t) => t.kind === "payment"),
    otherCredits: sum((t) => t.kind === "credit"),
    purchases: sum((t) => t.kind === "purchase"),
  };
  const a = account(id)!;
  if (a.group === "credit") {
    const cb = a.cashBack!;
    st.cashBack = Math.round(ls.filter((t) => t.kind === "purchase").reduce((s, t) => s + t.amount * (t.category === "Groceries" ? cb.Groceries : t.category === "Dining" ? cb.Dining : cb.other), 0));
    st.minimumDue = closing <= 0 ? 0 : Math.min(closing, Math.max(3500, Math.round(closing * 0.01)));
    st.dueDate = next(addDays(end, 25));
  }
  if (a.group === "loan") {
    const pays = ls.filter((t) => t.split);
    st.principalPaid = pays.reduce((s, t) => s + t.split!.principal, 0) + ls.filter((t) => t.own).reduce((s, t) => s - t.amount, 0);
    st.interestPaid = pays.reduce((s, t) => s + t.split!.interest, 0);
    st.escrowPaid = pays.reduce((s, t) => s + t.split!.escrow, 0);
    st.escrowOpening = escrowOn(all, before);
    st.escrowClosing = escrowOn(all, end);
    st.disbursed = ls.filter((t) => t.kind === "escrow-out").reduce((s, t) => s - (t.escrow ?? 0), 0);
  }
  return st;
}

/** Year-end tax figures for 2025: savings interest paid, and mortgage interest and property tax paid. */
export function taxYear(all: Txn[], year: number) {
  const inYear = (t: Txn) => t.date.startsWith(`${year}-`) && !t.pending;
  return {
    interest: all.filter((t) => t.account === "savings" && t.kind === "interest" && inYear(t)).reduce((s, t) => s + t.amount, 0),
    mortgageInterest: all.filter((t) => t.account === "mortgage" && t.split && inYear(t)).reduce((s, t) => s + t.split!.interest, 0),
    propertyTax: all.filter((t) => t.account === "mortgage" && t.desc === "County tax collector" && inYear(t)).reduce((s, t) => s - (t.escrow ?? 0), 0),
    principalJan1: balanceOn(all, "mortgage", `${year - 1}-12-31`),
  };
}

// --- Spending -----------------------------------------------------------------------------------
/** What went out, by category, from checking and the card: transfers between the customer's own accounts, payments and income are not spending. */
export function spending(all: Txn[], from: string, to: string) {
  const out = new Map<Category, number>();
  for (const t of all) {
    if (t.date < from || t.date > to || t.mirror || t.category === "Transfers" || t.category === "Income" || t.category === "Interest") continue;
    const spent = t.account === "checking" ? -t.amount : t.account === "card" ? t.amount : 0;
    if (!spent) continue;
    out.set(t.category, (out.get(t.category) ?? 0) + spent);
  }
  return [...out].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
}

// --- Showing money ------------------------------------------------------------------------------
const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const money = (cents: number) => fmt.format(cents / 100);
/** Account numbers are masked, natively: Xs for every digit but the last four. */
export const mask = (a: Pick<Account, "last4" | "digits">) => `${"X".repeat(a.digits - 4)}${a.last4}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const dateLabel = (s: string) => { const [y, m, d] = s.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
export const shortDate = (s: string) => { const [, m, d] = s.split("-").map(Number); return `${MONTHS[m - 1]} ${d}`; };
export const monthLabel = (month: string) => { const [y, m] = month.split("-").map(Number); return `${MONTHS_LONG[m - 1]} ${y}`; };

// --- What comes next ----------------------------------------------------------------------------
/** The scheduled activity of the next three weeks, by the same rules the books follow. */
export function upcoming(all: Txn[]) {
  const out: { date: string; label: string; detail: string; amount: number; account: AccountId }[] = [];
  const cardDue = statement(all, "card", STATEMENT_MONTHS[STATEMENT_MONTHS.length - 1]);
  for (let d = addDays(TODAY, 1); d <= addDays(TODAY, 21); d = addDays(d, 1)) {
    const [y, m] = d.split("-").map(Number);
    for (const pay of [day(y, m, 1), day(y, m, 15)]) if (prev(pay) === d) out.push({ date: d, label: "Fernwood Design Co.", detail: "Direct deposit · Payroll", amount: d >= "2026-03-01" ? 281215 : 271240, account: "checking" });
    const n1 = m === 12 ? day(y + 1, 1, 1) : day(y, m + 1, 1);
    if (prev(n1) === d && ym(n1) !== ym(d)) out.push({ date: d, label: "Fernwood Design Co.", detail: "Direct deposit · Payroll", amount: 281215, account: "checking" });
    if (next(day(y, m, 1)) === d) out.push({ date: d, label: "GIFbank Home Mortgage", detail: "Automatic payment", amount: -MORTGAGE_PAYMENT, account: "checking" });
    if (next(day(y, m, 2)) === d) out.push({ date: d, label: "Transfer to Rainy Day Fund", detail: "Recurring transfer", amount: -75000, account: "checking" });
    if (next(day(y, m, 20)) === d && ym(d) === ym(TODAY) && cardDue.closing > 0) out.push({ date: d, label: "GIF Cash Credit Card", detail: "Automatic payment of the statement balance", amount: -cardDue.closing, account: "checking" });
  }
  return out;
}
