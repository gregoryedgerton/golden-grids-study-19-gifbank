/**
 * Everything on GIFbank's pages that is words rather than money: the
 * customer, the navigation, the public home page and the footer. The money
 * is in `bank/ledger.ts`. GIFbank, its products and its customer are
 * invented; the customer's details are the study's own and reach no one
 * (`.example` addresses, a 555-01 telephone number).
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
  email: "gifcommit@example.com",
  mobile: "(856) 555-0142",
  home: "(856) 555-0187",
  address: { line1: "46 Larkmoor Lane", city: "Haddonfield", state: "NJ", zip: "08033" },
  lastLogin: "Oct 15, 2026 at 8:42 PM",
};

/** The public site's three bars: the line of segments, the utilities with Enter in the corner, and the products. */
export const SEGMENTS = ["Personal", "Small Business", "Commercial", "Investing & Wealth", "About Us"];
export const PRODUCT_NAV = ["Checking & Savings", "Credit Cards", "Lending", "Learning", "GIFpremier"];

/** The signed-in tabs. Three are the study's pages; Transfers is a section of Accounts; the rest are for show. */
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
    { q: "How do I stop paper statements?", a: "In Online Banking, open Statements & Documents, then Delivery preferences, and choose online only for each account. You'll get an email when each new statement is ready." },
    { q: "How long are online statements kept?", a: "Up to seven years. Statements for an account appear from the month it was opened, or the month you enrolled in online statements." },
    { q: "Why is my available balance different from my current balance?", a: "Your current balance counts transactions that have posted. Your available balance also subtracts pending debits, such as a card purchase made today." },
  ],
};

export const FOOTER: { title: string; links: string[] }[] = [
  { title: "Checking & Savings", links: ["Checking", "Savings", "Student", "CDs", "IRAs", "GIFpremier"] },
  { title: "Credit Cards", links: ["Cash back cards", "Balance transfer cards", "No annual fee", "Build credit", "View all credit cards"] },
  { title: "Lending", links: ["Personal loans", "Mortgage", "Home equity"] },
  { title: "Manage Your Account", links: ["Enroll in Online Banking", "Download the app", "Report fraud"] },
];
export const LEGAL = ["Privacy", "Online Advertising", "Terms of Use", "Security", "About Us", "Accessibility", "Careers", "Site Map"];

export const REFERENCE = {
  home: { label: "TD Bank's personal banking home page", url: "https://www.td.com/us/en/personal-banking" },
  onlineBanking: { label: "its description of Online Banking", url: "https://www.td.com/us/en/personal-banking/online-banking" },
  myTd: { label: "My TD", url: "https://www.td.com/us/en/personal-banking/my-td" },
  statements: { label: "its page on online statements", url: "https://www.tdbank.com/getmore/OnlineStatements.html" },
};
