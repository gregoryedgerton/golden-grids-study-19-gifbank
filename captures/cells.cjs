// Opened cells, on a phone: every expandable square is opened in turn and the page is checked for
//   - horizontal overflow (the document, or the cell, wider than the viewport), and
//   - the cell's head staying locked under the notice (and under a bar that really sticks) while the cell scrolls.
//   NODE_PATH=<a node_modules with playwright> node captures/cells.cjs <base-url> <width> <chrome|webkit> <page> [page ...]
// A page may carry a query: "product?p=barcelona".
// Exits non-zero when anything overflows or a head drifts from where it should lock.
const { chromium, webkit } = require('playwright');
(async () => { let total = 0; const [base, w, engine, ...pages] = process.argv.slice(2); const b = await (engine === 'webkit' ? webkit : chromium).launch(engine === 'webkit' ? {} : { channel: 'chrome' });
  for (const pg of pages) { const p = await (await b.newContext({ viewport: { width: +w, height: 800 }, isMobile: +w < 700, hasTouch: +w < 700 })).newPage();
    const [pn, pq] = pg.split('?'); await p.goto(`${base}${pn}.html${pq ? `?${pq}` : ''}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const n = await p.locator('.media__open, button.more').count(); const seen = new Set(); let bad = 0;
    for (let i = 0; i < n; i++) {
      const el = p.locator('.media__open, button.more').nth(i); const label = (await el.innerText()).slice(0, 30) || (await el.locator('.visually-hidden').innerText().catch(() => '')).slice(0, 40);
      await el.scrollIntoViewIfNeeded().catch(() => {}); await el.click({ force: true }).catch(() => {}); await p.waitForTimeout(250);
      const r = await p.evaluate(() => { const bannerHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--study-banner-h')) || 0; const c = document.querySelector('.cell'); if (!c) return null; const cr = c.getBoundingClientRect(); const doc = document.scrollingElement; const wide = [...c.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).map((e) => e.tagName + '.' + String(e.className).slice(0, 24)).slice(0, 3);
        const head = c.querySelector('.cell__head'); const want0 = bannerHeight() + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 0); scrollTo(0, c.getBoundingClientRect().top + scrollY - want0 + 30); const h1 = head.getBoundingClientRect().top; const want = bannerHeight() + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 0);  return { docW: doc.scrollWidth, vw: innerWidth, cellL: Math.round(cr.left), cellR: Math.round(cr.right), cellH: Math.round(cr.height), wide, headTop: Math.round(h1), want: Math.round(want), sticky: getComputedStyle(head).position }; });
      if (r) { const key = `${r.docW}|${r.cellR}|${r.wide.join()}`; const flag = r.docW > r.vw || r.cellR > r.vw + 1 || r.cellL < -1 || Math.abs(r.headTop - r.want) > 2; if (flag) bad++; if (flag || !seen.has('ok')) { console.log(pg, i, JSON.stringify(label), JSON.stringify(r), flag ? 'OVERFLOW' : ''); seen.add('ok'); } }
      await p.keyboard.press('Escape'); await p.waitForTimeout(150); await p.evaluate(() => scrollTo(0, 0));
    }
    console.log(pg, 'cells', n, 'problems', bad); total += bad; await p.context().close(); }
  await b.close(); process.exit(total ? 1 : 0); })();
