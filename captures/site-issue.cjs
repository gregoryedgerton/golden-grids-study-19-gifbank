// When a study is first published, the marketing site has to hear of it: this opens the
// "add this study to the gallery" issue on the site's issue board, once.
//   node captures/site-issue.cjs [YYYY-MM-DD] [--dry]
// The date is the day of the study's first deploy (today, in local time, if left out). It reads
// src/study.json, the release from the README's first line, the icon's colours from public/favicon.svg and the face from index.html, so the
// issue carries what the site's `src/studies/NN-name.json` needs. Needs `gh`, signed in with
// access to the site's repository (SITE_REPO, default gregoryedgerton/golden-grids-site).
// It will not open a second issue for the same study. --dry prints the issue and opens nothing.
const { execFileSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'); const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const study = JSON.parse(read('src/study.json')); const SITE = process.env.SITE_REPO || 'gregoryedgerton/golden-grids-site';
const args = process.argv.slice(2); const dry = args.includes('--dry');
const now = new Date(); const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const day = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) || local;
const m = /github\.com\/([^/]+)\/([^/#?]+)/.exec(study.repo || ''); if (!m) { console.error('src/study.json has no GitHub repo'); process.exit(1); }
const [, owner, repo] = m; const url = `https://${owner}.github.io/${repo}/`; const brand = study.brand || study.name;
if (Number(study.number) === 0 || /[\[\]]/.test(`${brand} ${study.name}`)) { console.error('src/study.json is still the template\'s: fill it in before publishing'); process.exit(dry ? 0 : 1); }
const fills = [...new Set([...(fs.existsSync(path.join(root, 'public/favicon.svg')) ? read('public/favicon.svg') : '').matchAll(/fill="(#[0-9a-fA-F]{6})"/g)].map((x) => x[1].toLowerCase()))];
const face = (/fonts\.googleapis\.com\/css2\?family=([^:&"]+)/.exec(read('index.html')) || [])[1];
const pages = Object.values(study.pages || {}).join(', ');
// The study's number on GIFcommit's master list, from the README's first line (GIFcommit00019 is release 19).
const serial = (/^GIFcommit(\d{5})\s*$/m.exec(read('README.md').split('\n')[0]) || [])[1];
const title = `Gallery: add ${brand} (Study ${study.number})`;
const body = [
  `Study ${study.number}, ${brand} (after ${study.name}), was first published on ${day}. It is not in the gallery yet.`,
  '',
  `- Live: ${url}`,
  `- Source: ${study.repo}`,
  `- Pages: ${pages}`,
  `- What it is: ${study.summary}`,
  '',
  `For \`src/studies/${study.number}-<name>.json\`:`,
  '',
  '| Field | Value |',
  '| --- | --- |',
  `| number | ${Number(study.number)} |`,
  `| release | ${serial ? `${Number(serial)} (GIFcommit${serial} on GIFcommit's master list)` : 'its number on GIFcommit\'s master list, once it has one'} |`,
  `| published | ${day} |`,
  `| brand | ${brand} |`,
  `| reference | ${study.name} |`,
  `| subject | a few words on what was rebuilt (its pages: ${pages}) |`,
  `| url | ${url} |`,
  `| colors | from the study's icon: ${fills.join(', ') || 'see the study\'s stylesheet'}. Choose ground, ink and accent; ink and accent need 3:1 on the ground |`,
  `| font | ${face ? decodeURIComponent(face).replace(/\+/g, ' ') : 'see the study\'s stylesheet'}, at the weight and slant of the study's wordmark |`,
  '| icon | a name from the catalogue, or a path drawn for it |',
  '',
  `Opened by \`captures/site-issue.cjs\` from the study's repository.`,
].join('\n');
if (dry) { console.log(`${SITE}\n${title}\n\n${body}`); process.exit(0); }
const gh = (a, input) => execFileSync('gh', a, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'inherit'] });
// The list, not the search: search lags a new issue by some seconds, and a second run in that time would open a second issue.
const open = JSON.parse(gh(['issue', 'list', '--repo', SITE, '--state', 'all', '--limit', '500', '--json', 'number,title,url,state']));
const dup = open.find((i) => i.title === title && i.state === 'OPEN') || open.find((i) => i.title === title);
if (dup) { console.log(`already on the board: #${dup.number} ${dup.url}`); process.exit(0); }
console.log(gh(['issue', 'create', '--repo', SITE, '--title', title, '--body-file', '-'], body).trim());
