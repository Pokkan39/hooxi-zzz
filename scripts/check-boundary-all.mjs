/* 全量核查所有角色页与阵营页的非官方边界。
   常规门禁只抽验 1 个角色 + 1 个阵营，但实际有 56 角色、17 阵营，
   其中 3 个角色无影画素材、走不同代码路径，从未被门禁覆盖。
   本脚本一次过完全部对象，用于确认没有个别页面声明不准。

   用法：npm run test:boundary:all
   需本地静态服务在 127.0.0.1:8000 运行。跑 73 个页面，约数分钟，
   所以不串入 npm test，作为改版后或发布前的完整核查。 */
process.title = 'pw';
const { chromium } = await import('playwright');
const fs = await import('node:fs');

const catalogSrc = fs.readFileSync('agent-catalog.js', 'utf8');
const g = {};
new Function('window', catalogSrc)(g);
const agents = g.agentCatalog.characters.map(c => c.id);
const factions = g.agentCatalog.factions.map(f => f.id);

const DIR_KEYWORD = [
  [/\/portraits\//, '立绘'],
  [/\/icons\//, '徽记'],
  [/\/gallery\//, '影画'],
  [/\/covers\//, '封面'],
  [/\/materials\//, '材料'],
  [/\/wiki\//, '截图']
];
const ALIAS = { '截图': ['截图', '活动图', '养成图', '封面'] };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const problems = [];
const kindStats = {};
let checked = 0;

async function audit(url, label) {
  const errs = [];
  const ext = new Set();
  const onErr = e => errs.push(e.message);
  const onReq = r => {
    const u = r.url();
    if (!/^https?:\/\/127\.0\.0\.1|^data:|^blob:|^about:/.test(u)) {
      try { ext.add(new URL(u).host); } catch (e) { ext.add(u.slice(0, 30)); }
    }
  };
  page.on('pageerror', onErr);
  page.on('request', onReq);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const r = await page.evaluate(({ DIR, ALIAS }) => {
    const t = document.body.innerText;
    const meta = k => (document.querySelector(
      k.startsWith('og:') ? `meta[property="${k}"]` : `meta[name="${k}"]`) || {}).content || '';
    const urls = [...document.querySelectorAll('img')].map(i => i.getAttribute('src') || '');
    document.querySelectorAll('*').forEach(el => {
      const b = getComputedStyle(el).backgroundImage;
      if (b && b !== 'none' && b.includes('assets/')) {
        const m = b.match(/assets\/[^"')]+/g);
        if (m) urls.push(...m);
      }
    });
    const used = [];
    for (const [src, kw] of DIR) {
      if (urls.some(u => new RegExp(src).test('/' + u.replace(/^\/+/, '')))) used.push(kw);
    }
    const declEl = document.querySelector('.footer-disclaimer') || document.querySelector('.d-foot');
    const decl = declEl ? declEl.innerText : '';
    const uncovered = used.filter(k => (ALIAS[k] || [k]).every(a => !decl.includes(a)));
    const kindWords = DIR.map(d => d[1]);
    const stale = kindWords.filter(k =>
      !used.includes(k) && (ALIAS[k] || [k]).some(w => decl.includes(w)));
    return {
      used, uncovered, stale,
      unofficial: /非官方/.test(t),
      noAff: /无隶属/.test(t),
      copyright: /版权归米哈游/.test(t),
      selfOfficial: (t.match(/.{0,10}官方(?:网站|站点)/g) || [])
        .filter(h => !/非官方|不是|否认/.test(h)),
      ogOK: /非官方/.test(meta('og:title')),
      remoteImgs: [...document.querySelectorAll('img')]
        .map(i => i.currentSrc || i.src)
        .filter(s => s && !/^https?:\/\/127\.0\.0\.1|^data:|^blob:/.test(s)).length
    };
  }, { DIR: DIR_KEYWORD.map(([re, kw]) => [re.source, kw]), ALIAS });

  page.off('pageerror', onErr);
  page.off('request', onReq);

  const key = r.used.join('+') || '(无)';
  kindStats[key] = (kindStats[key] || 0) + 1;

  if (ext.size) problems.push(`${label} 外部请求：${[...ext].join('、')}`);
  if (!r.unofficial) problems.push(`${label} 缺「非官方」`);
  if (!r.noAff) problems.push(`${label} 缺「无隶属」`);
  if (!r.copyright) problems.push(`${label} 缺版权归属`);
  if (r.uncovered.length) problems.push(`${label} 声明未覆盖：${r.uncovered.join('、')}（实际 ${r.used.join('、')}）`);
  if (r.stale.length) problems.push(`${label} 声明过期多出：${r.stale.join('、')}（实际 ${r.used.join('、')}）`);
  for (const h of r.selfOfficial) problems.push(`${label} 自称官方：${h.trim()}`);
  if (!r.ogOK) problems.push(`${label} og:title 不含「非官方」`);
  if (r.remoteImgs) problems.push(`${label} 非本地图片 ${r.remoteImgs} 张`);
  if (errs.length) problems.push(`${label} JS 报错：${errs[0].slice(0, 44)}`);
  checked++;
}

for (const id of agents) {
  await audit(`http://127.0.0.1:8000/character.html?id=${id}&cb=${Date.now()}`, `角色/${id}`);
}
for (const id of factions) {
  await audit(`http://127.0.0.1:8000/faction.html?id=${id}&cb=${Date.now()}`, `阵营/${id}`);
}

await browser.close();

console.log('--- 全量边界核查 ---');
console.log(`已核查 ${checked} 个页面（${agents.length} 角色 + ${factions.length} 阵营）`);
console.log('素材类型组合分布：');
for (const [k, n] of Object.entries(kindStats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${n} 页`);
}
if (problems.length) {
  console.log('\n发现问题：');
  problems.slice(0, 30).forEach(p => console.log('  x', p));
  if (problems.length > 30) console.log(`  …另有 ${problems.length - 30} 项`);
  console.log(`\nFAIL: ${problems.length} 项`);
  process.exit(1);
}
console.log('\nPASS: 全部角色页与阵营页边界成立');
