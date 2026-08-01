/* ============================================================
   部署可达性门禁 — git 跟踪状态检查

   已有门禁的盲区：check-formal-site-gate.py 只比对文件内容指纹，
   文件在本机存在就能 PASS，完全不管它有没有入 git。
   .github/workflows/pages.yml 的部署链路是 checkout 之后直接
   upload-pages-artifact，未入 git 的文件不会出现在 checkout 结果里，
   于是「本机全绿、线上 404」。这个盲区曾让 18 个文件悄悄积累。

   检查项：
   1. 正式站门禁基线（artifacts/formal-site-gate-baseline.json）里的
      每个文件都必须已被 git 跟踪
   2. 8 个正式页 HTML 中引用的每个本地资源都必须已被 git 跟踪

   被 .gitignore 有意排除的文件单独报出，与「漏 add」区分开。

   用法：
     node scripts/check-deploy-tracking.mjs
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'artifacts/formal-site-gate-baseline.json';
const PAGES = [
  'index.html', 'character.html', 'stories.html', 'faction.html',
  'mainline.html', 'events.html', 'behind-scenes.html', 'cultivate.html',
];

/* 除上面 8 个正式页外，仓库里还有样板与工具页。判定规则：
   页面本身未入 git 的（各类 prototype/sample），部署时页面自己就不存在，
   它引用的资源缺不缺都不影响线上，不该报。
   页面已入 git 的（editor / tape-wall-sample 等），会真实部署，
   其引用资源同样必须入库，否则线上 404。
   故扫描范围取「8 个正式页 + 全部已跟踪的其他 HTML」。 */
const trackedHtmlPages = (tracked) =>
  [...tracked].filter((p) => p.endsWith('.html') && !p.includes('/'));

const git = (args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8', maxBuffer: 1 << 26 });

const tracked = new Set(git(['ls-files']).split('\n').filter(Boolean));

const isIgnored = (rel) => {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', rel], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/* 门禁基线纳管的文件 */
const fromBaseline = () => {
  const p = resolve(ROOT, BASELINE);
  if (!existsSync(p)) return [];
  const data = JSON.parse(readFileSync(p, 'utf-8'));
  return (data.files || []).map((f) => f.path);
};

/* 正式页 HTML 引用的本地资源 */
const fromPages = (pages) => {
  const out = new Map();
  const pat = /(?:src|href)="([^"#?][^"]*?)(?:\?[^"]*)?"/g;
  for (const page of pages) {
    const abs = resolve(ROOT, page);
    if (!existsSync(abs)) continue;
    const html = readFileSync(abs, 'utf-8');
    for (const m of html.matchAll(pat)) {
      const url = m[1];
      if (/^(?:https?:)?\/\//.test(url) || url.startsWith('mailto:')) continue;
      if (url.endsWith('.html')) continue;
      const rel = relative(ROOT, resolve(ROOT, url.replace(/^\.\//, ''))).replace(/\\/g, '/');
      if (!existsSync(resolve(ROOT, rel))) continue;
      if (!out.has(rel)) out.set(rel, new Set());
      out.get(rel).add(page);
    }
  }
  return out;
};

const scanPages = [...new Set([...PAGES, ...trackedHtmlPages(tracked)])];
const baselinePaths = fromBaseline();
const pageRefs = fromPages(scanPages);

const all = new Map();
for (const p of baselinePaths) {
  if (!all.has(p)) all.set(p, { baseline: true, pages: new Set() });
  else all.get(p).baseline = true;
}
for (const [p, pages] of pageRefs) {
  if (!all.has(p)) all.set(p, { baseline: false, pages });
  else pages.forEach((pg) => all.get(p).pages.add(pg));
}

const missing = [];
const ignored = [];
for (const [rel, info] of [...all].sort(([a], [b]) => a.localeCompare(b))) {
  if (tracked.has(rel)) continue;
  if (!existsSync(resolve(ROOT, rel))) continue;
  (isIgnored(rel) ? ignored : missing).push({ rel, ...info });
}

console.log('--- 部署可达性检查（git 跟踪状态）---');
console.log(`  · 门禁基线纳管 ${baselinePaths.length} 个文件`);
  console.log(`  · 扫描页面 ${scanPages.length} 个（8 正式页 + 已跟踪样板/工具页）`);
  console.log(`  · 页面引用本地资源 ${pageRefs.size} 个`);
console.log(`  · 合计去重后检查 ${all.size} 个`);

if (ignored.length) {
  console.log(`\n被 .gitignore 有意排除（${ignored.length} 个，需人工确认是否应部署）：`);
  for (const it of ignored) console.log(`  IGNORED  ${it.rel}`);
}

if (missing.length) {
  console.log(`\nFAIL: ${missing.length} 个文件未入 git，部署后线上将 404`);
  for (const it of missing) {
    const n = it.pages.size;
    const tag = n >= PAGES.length ? 'A 全站' : n > 0 ? `B 页面 x${n}` : 'C 基线';
    /* n 以 8 个正式页为全站基准；已跟踪样板页的引用计入 n 但不改变分级口径 */
    console.log(`  [${tag}] ${it.rel}`);
  }
  console.log('\n修复：git add 上述文件后重跑本门禁。');
  console.log('说明：本机存在这些文件，所以其他门禁全部 PASS，只有本检查能发现。');
  process.exit(1);
}

console.log('\nPASS: 门禁基线与正式页引用的资源全部已入 git，部署不会缺文件');
