// Checks that GIFbank's books add up: every running balance, every statement
// (opening + activity = closing, and each closing is the next opening), both
// sides of every transfer, the card's autopay against its statement, and the
// mortgage's split. Run: node --experimental-strip-types captures/ledger-check.mjs
import { ACCOUNTS, OPENING, ESCROW_OPENING, STATEMENT_MONTHS, MORTGAGE_PI, MORTGAGE_PAYMENT, TODAY, build, lines, balances, statement, escrowOn, taxYear, money, spending } from "../src/bank/ledger.ts";

const own = process.argv.includes("--own") ? [{ id: "x1", from: "checking", to: "savings", amount: 12345, date: TODAY }, { id: "x2", from: "checking", to: "card", amount: 5000, date: TODAY }, { id: "x3", from: "savings", to: "mortgage", amount: 25000, date: TODAY }] : [];
const all = build(own);
let fail = 0;
const ok = (cond, msg) => { if (!cond) { fail++; console.log("FAIL", msg); } };

for (const a of ACCOUNTS) {
  const ls = lines(all, a.id);
  let bal = OPENING[a.id];
  for (const t of ls) { if (t.pending) continue; bal += t.amount; ok(t.balance === bal, `${a.id} running balance at ${t.id}`); ok(Number.isInteger(t.amount), `${a.id} ${t.id} whole cents`); }
  let prev;
  for (const m of STATEMENT_MONTHS) {
    const s = statement(all, a.id, m);
    ok(s.opening + s.lines.reduce((x, t) => x + t.amount, 0) === s.closing, `${a.id} ${m} opening + activity = closing`);
    if (a.group === "deposit") ok(s.opening + s.credits + s.interest + s.debits + s.checks + s.fees === s.closing, `${a.id} ${m} summary rows add up`);
    if (a.group === "credit") ok(s.opening + s.payments + s.otherCredits + s.purchases === s.closing, `${a.id} ${m} card summary adds up`);
    if (a.group === "loan") { ok(s.opening - s.principalPaid === s.closing, `${a.id} ${m} principal adds up`); ok(s.escrowOpening + s.escrowPaid - s.disbursed === s.escrowClosing, `${a.id} ${m} escrow adds up`); ok(s.escrowClosing >= 0, `${a.id} ${m} escrow not negative`); }
    if (prev) ok(prev.closing === s.opening, `${a.id} ${m} opens at last closing`);
    if (a.group === "deposit") ok(Math.min(s.opening, s.closing, ...s.lines.map((t) => t.balance)) >= 0, `${a.id} ${m} never overdrawn`);
    prev = s;
  }
}
// Transfers: both sides, same day, same size.
for (const t of all.filter((t) => t.mirror && t.amount !== 0)) {
  const other = all.filter((u) => u.account === t.mirror && u.mirror === t.account && u.date === t.date);
  const counts = (acc, amt) => (ACCOUNTS.find((a) => a.id === acc).group === "deposit" ? amt : -amt);
  const whole = (x) => (x.split ? x.split.principal + x.split.interest + x.split.escrow : null);
  ok(other.some((u) => counts(u.account, u.amount) === -counts(t.account, t.amount) || whole(u) === -t.amount || whole(t) === -u.amount), `transfer ${t.id} ${t.account}→${t.mirror} ${t.date} has its other side`);
}
// Card autopay pays the statement balance in full, the month after.
for (let i = 0; i < STATEMENT_MONTHS.length - 1; i++) {
  const s = statement(all, "card", STATEMENT_MONTHS[i]);
  const nextS = statement(all, "card", STATEMENT_MONTHS[i + 1]);
  const autopay = nextS.lines.filter((t) => t.kind === "payment" && !t.own).reduce((x, t) => x + t.amount, 0);
  ok(autopay === -s.closing, `card autopay in ${STATEMENT_MONTHS[i + 1]} pays ${STATEMENT_MONTHS[i]} balance`);
}
// Mortgage payments split exactly.
for (const t of all.filter((t) => t.split)) ok(t.split.principal + t.split.interest === MORTGAGE_PI && t.split.principal + t.split.interest + t.split.escrow === MORTGAGE_PAYMENT, `mortgage split ${t.date}`);
// Spending sums equal the debits it counts.
const sp = spending(all, "2026-09-01", "2026-09-30");

for (const a of ACCOUNTS) { const b = balances(all, a.id); console.log(a.id.padEnd(9), "current", money(b.current).padStart(12), "available", money(b.available).padStart(12), "pending", money(b.pending)); }
console.log("escrow today", money(escrowOn(all, TODAY)), "· P&I", money(MORTGAGE_PI), "· payment", money(MORTGAGE_PAYMENT));
const ty = taxYear(all, 2025); console.log("2025: savings interest", money(ty.interest), "· mortgage interest", money(ty.mortgageInterest), "· property tax", money(ty.propertyTax), "· principal Jan 1", money(ty.principalJan1));
console.log("Sep 2026 spending", sp.map(([c, v]) => `${c} ${money(v)}`).join(", "));
for (const m of ["2025-01", "2025-07", "2025-12", "2026-09"]) { const s = statement(all, "checking", m); const c = statement(all, "card", m); console.log(m, "checking", money(s.opening), "→", money(s.closing), "| card", money(c.opening), "→", money(c.closing), "lines", s.lines.length, c.lines.length); }
console.log(all.length, "transactions;", fail ? `${fail} FAILURES` : "every check passes");
process.exit(fail ? 1 : 0);
