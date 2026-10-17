// The scans every study runs before it publishes, in Chrome AND WebKit:
//   NODE_PATH=<a node_modules with playwright> node captures/scan.cjs [base-url] [page ...]
//   - no text element overflows its box (labels, bodies, captions, feet, fitted lines)
//   - no fitted line sits under 12px
//   - axe-core (WCAG 2.0/2.1/2.2 A+AA, best practice), light and dark, with the first More open
// Pages default to the root; pass "index calculation ..." for a multi-page study.
// WebKit: `npx playwright install webkit` once. Chrome uses the installed channel.
const { chromium, webkit } = require('playwright');
(async () => {
  const [base = 'http://localhost:5173/', ...pages] = process.argv.slice(2);
  // A page may carry a query: "disability-calculator?example" scans the calculator with its result open.
  const targets = pages.length ? pages.map((p) => { const [n, q] = p.split('?'); return `${base}${n}.html${q ? `?${q}` : ''}`; }) : [base];
  let problems = 0;
  for (const [name, engine] of [['chrome', chromium], ['webkit', webkit]]) {
    let b; try { b = await engine.launch(name === 'chrome' ? { channel: 'chrome' } : {}); } catch (e) { console.log(`${name}: not available (${e.message.split('\n')[0]})`); continue; }
    for (const url of targets) for (const [w, h] of [[390, 844], [820, 1180], [1440, 900]]) for (const scheme of ['light', 'dark']) {
      const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' })).newPage();
      await p.goto(url, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(400);
      const over = await p.evaluate(() => [...document.querySelectorAll('.box, .card, .map')].flatMap((box) => { const br = box.getBoundingClientRect(); return [...box.querySelectorAll('.fit, .box__label, .box__body, .box__caption, .box__foot, .box__source, .card__text, .card__pill, .card__badge, p, dl, .map__credit')].filter((e) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && !e.closest('.visually-hidden') && getComputedStyle(e.closest('.card__text') || e).position !== 'absolute').filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > br.bottom + 1 || r.right > br.right + 1 || e.scrollWidth > e.clientWidth + 1; }).map((e) => `"${e.textContent.trim().slice(0, 24)}"`); }));
      const floor = await p.evaluate(() => [...document.querySelectorAll('.fit')].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => `"${e.textContent.trim().slice(0, 16)}"`));
      let axe = [];
      if (name === 'chrome' && w === 1440) {
        await p.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js' });
        const more = p.locator('button.media__open:visible').first(); if (await more.count()) await more.click();
        axe = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => `${v.id} ×${v.nodes.length}: ${v.nodes[0].target.join(' ')}`));
      }
      if (over.length || floor.length || axe.length) { problems++; console.log(`${name} ${w} ${scheme} ${url}\n  overflow: ${over.join(', ') || '-'}\n  under 12px: ${floor.join(', ') || '-'}\n  axe: ${axe.join(' | ') || '-'}`); }
      await p.context().close();
    }
    await b.close();
  }
  console.log(problems ? `${problems} runs with problems` : 'clean: nothing overflows, no fitted line under 12px, axe has no violations');
})();
