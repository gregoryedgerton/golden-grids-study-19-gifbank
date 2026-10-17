GIFcommit00020

# Layout study — TD Bank, as GIFbank

**Live:** [`https://gregoryedgerton.github.io/golden-grids-study-19-gifbank/`](https://gregoryedgerton.github.io/golden-grids-study-19-gifbank/)

An unaffiliated layout study. It rebuilds [TD Bank's](https://www.td.com/us/en/personal-banking)
personal banking home page and the signed-in Online Banking behind its log-in
as stacked golden grids, for a fictional bank under a parody name, GIFbank,
and a fictional customer. Where the reference has Log In, the header's corner
says Enter: it opens a notice that GIFbank is a parody and not a real bank,
then continues to a demo of the banking screens: the accounts, each account's
activity, and statements and tax documents. The money is a fictional
currency, Dollaz, written Ƶ. Every number is computed from one set of invented transactions,
so the arithmetic holds on every page. The demo shows transfers between the
accounts but has no form that moves money. None of the reference's sentences, photographs or marks
is reproduced. Built with [Golden Grids](https://github.com/gregoryedgerton/golden-grids)
from the [study template](https://github.com/gregoryedgerton/golden-grids-study-template).

## Reference

- **The public home page**, read and captured at 390, 820 and 1440 on
  2026-10-16: a green line of segments (Personal, Small Business, Commercial,
  Investing & Wealth, About Us); a white header with the square green mark,
  search, help, find us, the country and **Log In in the top right corner**,
  on a pale green tint; the products (Checking & Savings, Credit Cards,
  Lending, Learning, the premium tier); a hero of a photograph, a green panel
  with an offer and an Online Banking box with Login and Sign-Up; "What can
  we help you find?" as a row of circled icons; ways to manage an account;
  reasons to bank; questions; and the footer's link groups.
- **The Online Banking sign-in**: user name, password, Remember me, Log in,
  and the links for a forgotten password and signing up. The study does not
  rebuild it (see Notes for review).
- **The signed-in pages were not seen.** The study does not sign in to
  anyone's account. They are built from the reference's own descriptions of
  [Online Banking](https://www.td.com/us/en/personal-banking/online-banking),
  [My TD](https://www.td.com/us/en/personal-banking/my-td) and
  [online statements](https://www.tdbank.com/getmore/OnlineStatements.html):
  every account on one page; an available balance that drops at once for a
  card purchase, which shows as pending; statements online for seven years
  and paper statements that can be turned off; balance and deposit alerts;
  masked account numbers; single-use security codes; Account Home, Make a
  Transfer, Pay Bills, Send Money and Secure Messages as the quick links. The
  arrangement of those screens is the study's reading of how such pages work.

No capture of the reference is kept: its pages carry its photographs and
marks.

**Register:** white ground, the bright green `#008a00` of the segments bar,
the signed-in tabs and the buttons, the dark green `#1a5336` of headings,
links in `#038203`, a pale green tint `#f6faf0` behind the corner control, grey rules,
square corners and square buttons. The reference's face, TD Graphik, is
proprietary; Figtree stands in. The reference has one scheme; the dark scheme
is the study's own, the same greens turned over, and follows the device or the
device.

## Approach

The reference sets accounts as a list of rows, an account's balances as a line
above its activity, and the home page as a hero and rows of equal tiles. The
study sets them as golden grids:

- **The accounts are a grid**, checking in the largest square with its
  available balance as large type, savings next, the card and the mortgage in
  the smallest; each square opens the account.
- **An account's balances are a grid**: the headline balance (available for
  checking and savings, current for the card, principal for the mortgage) in
  the largest square, then the figures that explain it (current, pending,
  money in and out; or available credit, statement balance, minimum due, cash
  back; or next payment, rate, escrow, interest paid).
- **Spending this month is a grid** by category, the largest category in the
  largest square, from checking and the card.
- **A statement opens to a grid of its summary**, the ending balance largest,
  above the statement itself.
- **The home page** sets the hero (photograph, offer, Online Banking), the
  products, the ways to manage an account and the reasons to bank as grids.

Flat modules stay flat: the headers and tabs, the parody notice, the quick actions,
the list of transfers, the activity table, the statement document, the lists of
statements, documents and delivery preferences, the questions and the footer.

| Page | Band | Cells |
| --- | --- | --- |
| Home | Hero | the photograph, the offer, Online Banking |
| | Products | seven products dealt into four and three |
| | Manage | a photograph and three ways to manage an account |
| | Anywhere | three photographs with reasons to bank |
| Accounts | Your accounts | checking, savings, card, mortgage |
| | Spending this month | the five largest categories |
| Account | Balances | five figures for the kind of account |
| Statements | At a glance | five figures from the statement's summary |

**What answers back.** Enter in the corner, and the Demo accounts box (the reference's Online Banking box), open
the parody notice beneath the corner; Continue goes to the demo accounts, and
Exit (in the header, and Exit the demo in the name menu) leaves them. A demo page reached
from outside the demo shows the notice in its place. Hide balances turns every figure to dots.
Transfers (the quick action, the tab, and the button on an account) opens a
read-only list beneath the quick actions: the transfers between the accounts
scheduled for the next three weeks and the six most recent, from the books.
It moves no money. The activity table filters by period (since the
last statement, 30 or 90 days, the year, any statement month), by type and by
words, opens each row to its detail (a check opens to a drawing of the check),
shows more, and downloads what it shows as CSV. Statements choose an account
and a year, open a month in place, step to the previous or next, and print on
their own. Tax documents open their figures. Delivery preferences lists how
each account's statements arrive, read-only. Reset the demo, in the name menu,
clears everything the study keeps.

## Content and provenance

- **The arithmetic.** [`src/bank/ledger.ts`](src/bank/ledger.ts) holds the
  books: four accounts, opening balances on 1 January 2025, and a seeded
  program that writes every transaction from then to 16 October 2026 (771 of
  them): payroll twice a month (a business day early on weekends, with a raise
  in March 2026), the mortgage's automatic payment, a standing transfer to
  savings, the card's autopay of its statement balance in full, bills,
  groceries, coffee, fuel, checks to the lawn service, three foreign-ATM fees,
  tax refunds, a holiday month and a summer trip. Balances, running balances,
  statements, savings interest (accrued daily on the closing balance, paid
  monthly), the mortgage's split of each payment into principal, interest and
  escrow (the standard fixed-rate formula on an invented loan of Ƶ340,000 at
  6.125% for 30 years), escrow disbursements for property tax and insurance,
  the card's statement, minimum payment and cash back, the 2025 tax figures,
  spending by category and what is coming up are all computed from those
  transactions. Nothing is typed in as a total.
- **The check.** [`captures/ledger-check.mjs`](captures/ledger-check.mjs)
  (`npm run check:ledger`) confirms that
  every running balance follows from the one before; that each statement's
  beginning balance plus its activity is its ending balance, that its summary
  rows add up and that each ending balance is the next beginning; that no
  deposit account is overdrawn and escrow never goes below zero; that both
  sides of every transfer agree; that each card autopay equals the statement
  balance it pays; and that each mortgage payment splits exactly. It passes.
- **The customer and the bank are invented.** Every account is in the name of
  GIFcommit, at Greg's direction, with an address on an invented street and no
  email address or telephone number. Account numbers are Xs ending in four letters in
  sequence, ABCD, EFGH, IJKL and MNOP, so none can be mistaken for a real one.
  Every merchant, biller, employer and payee on a statement is a GIF name
  written as the study brands are, GIF and a lowercase tail with no space:
  GIFmarket, GIFcoffee, GIFfuel, GIFelectric, GIFdesign (the employer). Some
  are the other layout studies' brands: GIFflix and GIFify are the
  subscriptions, GIFbnb the summer cottage, GIFdepot the hardware, GIFea the
  gifts, GIFbell and GIFn'now dinners out, GIFmutual the home insurance and
  GIF;gov the tax refund. The bank's own products follow the same form
  (GIFcomplete Checking, GIFcash Credit Card, GIFpremier). GIFbank, N.A. is fictional; the footer says it is not
  a bank and not FDIC-insured.
- **There is no sign-in.** No page has a user name or password field. Enter
  shows a notice that GIFbank is a parody for a layout study and not a real
  bank, and that real banking details should never be entered into a page
  reached from a link, then continues to the demo. No page asks for
  personal details or consent, and no form moves money. Everything the
  reader does is kept in this browser's local storage (`gg19b-*`) and sent
  nowhere. `?demo` on a demo page enters the demo, for captures.
- **Photographs** are in [`src/photos.json`](src/photos.json), each with its
  author, licence, page and alt text, from Wikimedia Commons under CC BY 2.0,
  CC BY-SA 4.0 or CC0; none shows a person or a bank. A photograph of a laptop
  was dropped for its maker's name on the bezel.
- **Icons and the mark** are the study's own drawings. **Text** is the
  study's own.

## Notes for review

Observations for whoever reviews this study, recorded without a verdict.
Whether the layout suits the page is assessed separately, after every study
has been reviewed.

- **The rest of the bank-page signals were removed (2026-10-17).** With the
  whole github.io origin flagged, everything that could read as collecting
  details, signing in or moving money went: Make a Transfer (From, To,
  Amount, Memo, review and confirmation, with cancel) is now Transfers, a
  read-only list of the scheduled and recent transfers between the accounts
  from the books, in the same place beneath the quick actions, and the
  reader can no longer add to the books; the "Last log in" line under the
  greeting; the paperless form on Delivery preferences, with its consent
  box, now a read-only list of each account's delivery; the footer's
  Download the app and Report fraud (About the demo moved to the legal row
  beside About Us, and the Manage Your Account column went); Protect
  yourself against fraud in the Demo accounts box; Log Out, now Exit; and
  the customer's email address and telephone numbers, which no page showed.
  The account page's Transfer and Make a payment buttons are one Transfers
  link. The quick links Pay Bills, Send Money and Mobile Deposit stay as
  plain text, as before, and Download CSV stays: it saves the activity the
  table shows, made in the browser.
- **Further steps against the flag (2026-10-17, Greg).** The study moved from
  `golden-grids-study-19-tdbank` to `golden-grids-study-19-gifbank`, so the
  bank's name is no longer in its web address; the old address no longer
  serves anything. The pages name the reference but no longer link to it:
  the closing disclosure says why ("Why nothing here links to the bank"),
  and the addresses are kept in this README and nowhere in the build. The
  home page's Online Banking box is called Demo accounts, its Sign-Up link is
  gone, and the footer's Enroll in Online Banking reads About the demo.
- **The sign-in was removed after Google flagged the study.** The first
  version rebuilt the corner log-in with a user name and password filled in
  and read-only, and cited the reference's real sign-in page. Google Safe
  Browsing flagged the study as a deceptive site; a bank-styled page with
  credential fields reads as phishing however it is labelled. On 2026-10-16
  the form and the link were removed; Enter and the parody notice stand in
  their place. Nothing was ever collected.
- **The signed-in pages were not seen.** Their arrangement is inferred from
  the reference's public descriptions and from how online banking commonly
  works; details such as the order of the tabs and the columns of the activity
  table are the study's.
- **No FDIC sign.** The reference's top bar carries the FDIC's official
  sign; a fictional bank cannot, so the study has no such bar, and its footer
  says GIFbank is not insured.
- **The hero sits inside the page width.** The reference's hero runs edge to
  edge at a fixed height; a grid of three squares at the full width of a wide
  screen would be about 900px tall, so the study keeps it inside the page's
  column.
- **Pending items are fixed.** Three transactions on the last two days are
  pending; nothing settles over time, and there are no bank holidays in the
  books.
- **Card interest is zero throughout**, because autopay pays each statement in
  full; the statement shows the interest line at Ƶ0.00 and the minimum
  payment warning anyway.
- **Statements begin in January 2025** where the reference keeps seven years.
- **The money is Dollaz (Ƶ), a fictional currency**, so no figure reads as
  real money; the year-end documents are GIFbank's own statements rather than
  any government's tax forms, and the tax refund comes from an unnamed
  revenue office. Figtree has no Ƶ, so that one glyph is loaded from Inter.
- **Profile & Settings was removed** (Greg, 2026-10-16: it did not do anything
  "really golden griddy"). Its tab stays in the bar, for show; the name menu
  keeps Reset the demo. Removing it also removed the study's only fields for
  an address, an email and a phone number.
- **Accessibility.** `captures/scan.cjs` reports no overflow, no fitted line
  under 12px and no axe violations in Chrome and WebKit at 390, 820 and 1440,
  light and dark, on every page and its variants (signed in and out).
  `captures/cells.cjs` opens every expandable square at 390. No screen-reader
  user has tested it.

## Disclosure

Every page says it is a study in three places, all read from
[`src/study.json`](src/study.json): the page's metadata, a sticky notice at the
top, and "About this layout study", the last element on the page.

## Running it

```bash
npm install
npm run dev
npm run check:ledger
NODE_PATH=<a node_modules with playwright> node captures/scan.cjs http://localhost:5173/ index "accounts?demo" "account?a=card&demo" "statements?a=checking&m=2026-09&demo""
```

Pushing to `main` deploys to GitHub Pages.
