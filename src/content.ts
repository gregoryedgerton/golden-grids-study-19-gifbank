import type { AccountId } from "./bank/ledger";

/**
 * Everything on GIFbank's pages that is words rather than money: the
 * customer, the navigation, the public home page and the footer. The money
 * is in `bank/ledger.ts`. GIFbank, its products and its customer are
 * invented; the customer's only detail is an address on an invented street,
 * shown on statements and the drawn check. There is no email address or
 * telephone number, and no field that asks for one (CLAUDE.md, Safe
 * Browsing remediation).
 */
export const BASE = import.meta.env.BASE_URL;
export const PAGES = {
  home: `${BASE}`,
  accounts: `${BASE}accounts.html`,
  account: `${BASE}account.html`,
  statements: `${BASE}statements.html`,
};
export const accountHref = (id: string) => `${PAGES.account}?a=${id}`;
export const statementHref = (id: string, month?: string) => `${PAGES.statements}?a=${id}${month ? `&m=${month}` : ""}`;

/*
 * The demo sign-in constants (DEMO_USER / DEMO_PASSWORD_SHOWN) were removed in the
 * 2026-10 Safe Browsing remediation, along with the sign-in form that showed them.
 * The demo is now entered through a parody notice, not a credential form. Do not
 * reintroduce them. See CLAUDE.md > "Safe Browsing remediation".
 */

export const CUSTOMER = {
  /** The name on every account, at Greg's direction. */
  name: "GIFcommit",
  first: "GIFcommit",
  since: "2019",
  address: { line1: "46 Larkmoor Lane", city: "Haddonfield", state: "NJ", zip: "08033" },
};

/**
 * How each account's statements are delivered. Shown, never changed: the
 * form that changed it, with its consent box, was removed in the Safe
 * Browsing remediation (CLAUDE.md).
 */
export const DELIVERY: Record<AccountId, "online" | "paper"> = { checking: "online", savings: "online", card: "paper", mortgage: "paper" };
export const deliveryLabel = (id: AccountId) => (DELIVERY[id] === "online" ? "Online only" : "Online and paper");

/** The public site's three bars: the line of segments, the utilities with Enter in the corner, and the products. */
export const SEGMENTS = ["Personal", "Small Business", "Commercial", "Investing & Wealth", "About Us"];
export const PRODUCT_NAV = ["Checking & Savings", "Credit Cards", "Lending", "Learning", "GIFpremier"];

/** The signed-in tabs. Three are the study's pages; Transfers opens the read-only list of transfers on Accounts; the rest are for show. */
export const BANK_TABS: { label: string; href?: string; match?: string[] }[] = [
  { label: "Accounts", href: PAGES.accounts, match: ["accounts", "account"] },
  { label: "Transfers", href: `${PAGES.accounts}#transfer` },
  { label: "Pay Bills" },
  { label: "Send Money" },
  { label: "Statements & Documents", href: PAGES.statements, match: ["statements"] },
  { label: "Profile & Settings" },
];

export const HOME = {
  hero: {
    title: "Checking that keeps up with you.",
    body: "GIFcomplete Checking waives its monthly fee when you keep Ƶ500 in the account each day, and Bill Pay, alerts and mobile deposit come with it.",
    cta: "See checking accounts",
  },
  find: [
    { label: "Checking Accounts", icon: "check" },
    { label: "Savings Accounts", icon: "piggy" },
    { label: "CDs", icon: "certificate" },
    { label: "Credit Cards", icon: "card" },
    { label: "Personal Loans", icon: "loan" },
    { label: "Home Lending", icon: "house" },
    { label: "Special Offers", icon: "tag" },
  ],
  manage: [
    { title: "Talk to a person, any hour", body: "Our customer service line answers around the clock, every day of the year, and a store near you keeps longer hours than most." },
    { title: "Pay bills from one place", body: "Bill Pay sends payments to almost any company or person in the U.S., once or on a schedule, and keeps a record of each." },
    { title: "Deposit a check with your phone", body: "Photograph the front and back of a check in the GIFbank app and the deposit shows in your account's activity." },
  ],
  anywhere: [
    { k: "porch", title: "Borrow against your home", body: "A home equity line of credit draws on the value you have built in your house, for repairs, tuition or a new kitchen." },
    { k: "jar", title: "Save a little, automatically", body: "A recurring transfer moves the same amount into savings on the same day each month, before you have a chance to spend it." },
    { k: "kitchen", title: "Plan the month at the kitchen table", body: "Alerts tell you when a balance runs low, a deposit lands or a payment is due, so the plan holds between statements." },
  ],
  questions: [
    { q: "What's the difference between a pending and a posted transaction?", a: "A pending transaction has been authorized but not yet settled; it lowers your available balance at once. When it settles it posts, and your current balance changes." },
    { q: "How are statements delivered?", a: "Each account's statements come online only, or online and by mail. In the demo, Statements & Documents lists each account's delivery under Delivery preferences." },
    { q: "How long are online statements kept?", a: "Up to seven years. An account's statements begin with the month it was opened, or the month its online statements began." },
    { q: "Why is my available balance different from my current balance?", a: "Your current balance counts transactions that have posted. Your available balance also subtracts pending debits, such as a card purchase made today." },
  ],
};

export const FOOTER: { title: string; links: string[] }[] = [
  { title: "Checking & Savings", links: ["Checking", "Savings", "Student", "CDs", "IRAs", "GIFpremier"] },
  { title: "Credit Cards", links: ["Cash back cards", "Balance transfer cards", "No annual fee", "Build credit", "View all credit cards"] },
  { title: "Lending", links: ["Personal loans", "Mortgage", "Home equity"] },
];
/** About the demo, the last of the old Manage Your Account links, sits here beside About Us. */
export const LEGAL = ["Privacy", "Online Advertising", "Terms of Use", "Security", "About Us", "About the demo", "Accessibility", "Careers", "Site Map"];

/**
 * The pages this study follows, by name. They are not linked from the pages:
 * a bank lookalike that links to the real bank is what phishing scanners look
 * for (see CLAUDE.md, Safe Browsing remediation). The README links them.
 */
export const REFERENCE = {
  home: { label: "TD Bank's personal banking home page" },
  onlineBanking: { label: "its description of Online Banking" },
  myTd: { label: "My TD" },
  statements: { label: "its page on online statements" },
};
