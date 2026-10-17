# Captures

No screenshot of the reference is kept: its pages carry its own photographs and product names.

- `pieces.json`, `hunt.py`: the search phrases for each design and the script that searches Wikimedia Commons for photographs under open licences (CC BY, CC BY-SA, CC0, public domain), at least 900 pixels on the short side; titles naming a poster, a drawing, a logo or a screenshot are skipped, and lays the candidates out on numbered sheets (`find/sheet-*.jpg`, not committed; the candidate lists `find/*.json` are).
- `picks.json`, `pick.py`: which candidate each photograph is, and its alt text; `pick.py` downloads them to `public/assets/` and writes `src/photos.json` (author, licence, page). A photograph of a person or a reproduction of another photograph is not picked.
- `ledger-check.mjs`: checks that the books add up (`npm run check:ledger`; `--own` adds reader transfers first).
- `scan.cjs`: overflow, fitted-line floor and axe, Chrome and WebKit, three widths, both schemes.
- `cells.cjs`: opens every expandable square at a phone width and checks that nothing widens the page and the opened head stays locked.
- `site-issue.cjs`: files the request to join the Golden Grids site's gallery.

```bash
npm run check:ledger
NODE_PATH=<a node_modules with playwright> node captures/scan.cjs http://localhost:5197/ index accounts "accounts?demo" "account?a=checking&demo" "account?a=card&demo" "account?a=mortgage&demo" "statements?a=checking&m=2026-09&demo" "statements?tab=tax&demo" "settings?demo" "settings?s=personal&demo"
NODE_PATH=<a node_modules with playwright> node captures/cells.cjs http://localhost:5197/ 390 webkit index "accounts?demo"
```
