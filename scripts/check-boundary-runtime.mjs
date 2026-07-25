/* ============================================================
   非官方边界门禁 — 运行时补充
   静态门禁 check-unofficial-boundary.mjs 读不到 JS 渲染的内容，
   这是它已知的失效面：运行时注入的热链、自称官方文案、
   缺失的版权声明都能绕过。本脚本在真实浏览器里复验。

   检查项（渲染完成后）：
   1. 零外部域名请求（热链官方服务器）
   2. 渲染后的正文含「非官方」「无隶属」「版权归米哈游」
   3. 渲染后不得出现自称官方网站 / 官方站点
   4. og:title 与 twitter:title 含「非官方」（含 JS 动态更新的）
   5. 官方美术类图片全部本地托管

   需要本地静态服务在 127.0.0.1:8000 运行。

   用法：
     node scripts/check-boundary-runtime.mjs
   ============================================================ */

/* Windows + MSYS2/Git Bash 下，playwright-core 加载时设置 process.title
   会触发 libuv 断言 `Assertion failed: process_title, src\win\util.c:412`，
   导致进程在 import 阶段就崩溃（还没启动浏览器）。
   先占位一个短 title 可绕过。必须在 import playwright 之前执行。 */
process.title = 'pw';

const { chromium } = await import('playwright');

const BASE = 'http://127.0.0.1:8000/';
const PAGES = [
  'index.html',
  'character.html?id=anby',
  'faction.html?id=cunning-hares',
  'mainline.html',
  'events.html',
  'behind-scenes.html',
  'stories.html?agent=anby',
  'cultivate.html'
];

const problems = [];
const notes = [];

const browser = await chromium.launch();
try {
  for (const path of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const external = new Set();
    const pageErrors = [];
    page.on('request', r => {
      const u = r.url();
      if (!/^https?:\/\/127\.0\.0\.1|^data:|^blob:|^about:/.test(u)) {
        try { external.add(new URL(u).host); } catch (e) { external.add(u.slice(0, 40)); }
      }
    });
    page.on('pageerror', e => pageErrors.push(e.message));

    const sep = path.includes('?') ? '&' : '?';
    await page.goto(BASE + path + sep + 'cb=' + Date.now(), { waitUntil: 'load' });
    await page.waitForTimeout(2400);

    const r = await page.evaluate(() => {
      const t = document.body.innerText;
      const meta = k => (document.querySelector(
        k.startsWith('og:') ? `meta[property="${k}"]` : `meta[name="${k}"]`) || {}).content || '';
      const selfOfficial = (t.match(/.{0,10}官方(?:网站|站点)/g) || [])
        .filter(h => !/非官方|不是|否认/.test(h));
      const remoteImgs = [...document.querySelectorAll('img')]
        .map(i => i.currentSrc || i.src)
        .filter(s => s && !/^https?:\/\/127\.0\.0\.1|^data:|^blob:/.test(s));

      /* 从真实渲染的图片路径反推该页用了哪几类官方素材，再比对页脚声明。
         静态门禁靠人工维护的 ASSET_EXPECT 表，新增素材类型时会漏判——
         实测给幕后页加一张官方立绘、声明仍只写「截图」，静态门禁放过。
         这里改为按实际渲染结果反查，不依赖人工维护。 */
      const DIR_KEYWORD = [
        [/\/portraits\//, '立绘'],
        [/\/icons\//, '徽记'],
        [/\/gallery\//, '影画'],
        [/\/covers\//, '封面'],
        [/\/materials\//, '材料'],
        [/\/wiki\//, '截图']
      ];
      const declEl = document.querySelector('.footer-disclaimer')
        || document.querySelector('.d-foot');
      const decl = declEl ? declEl.innerText : '';
      const usedKinds = [];
      for (const [re, kw] of DIR_KEYWORD) {
        const hit = [...document.querySelectorAll('img')]
          .some(i => re.test(i.getAttribute('src') || ''));
        if (hit) usedKinds.push(kw);
      }
      /* 活动页的 wiki 图在声明里写作「活动图」，培养页写「养成图」，
         都属于截图类的合法别名。 */
      const ALIAS = { '截图': ['截图', '活动图', '养成图', '封面'] };
      const uncovered = usedKinds.filter(k => {
        const accept = ALIAS[k] || [k];
        return !accept.some(a => decl.includes(a));
      });

      return {
        unofficial: /非官方/.test(t),
        noAffiliation: /无隶属/.test(t),
        copyright: /版权归米哈游/.test(t),
        selfOfficial,
        usedKinds,
        uncovered,
        declText: decl.slice(0, 90),
        ogTitle: meta('og:title'),
        twTitle: meta('twitter:title'),
        remoteImgs: remoteImgs.slice(0, 3),
        remoteImgCount: remoteImgs.length
      };
    });

    const name = path.split('?')[0];
    if (external.size) problems.push(`${name} 运行时请求了外部域名：${[...external].join('、')}`);
    if (!r.unofficial) problems.push(`${name} 渲染后缺「非官方」表述`);
    if (!r.noAffiliation) problems.push(`${name} 渲染后缺「无隶属」表述`);
    if (!r.copyright) problems.push(`${name} 渲染后缺版权归属声明`);
    for (const h of r.selfOfficial) problems.push(`${name} 渲染后自称官方：「${h.trim()}」`);
    if (r.uncovered.length)
      problems.push(`${name} 页面实际使用了 ${r.uncovered.join('、')} 类官方素材，`
        + `但页脚声明未覆盖（现声明：${r.declText.slice(0, 46)}…）`);
    if (!/非官方/.test(r.ogTitle)) problems.push(`${name} og:title 不含「非官方」：「${r.ogTitle}」`);
    if (!/非官方/.test(r.twTitle)) problems.push(`${name} twitter:title 不含「非官方」`);
    if (r.remoteImgCount) problems.push(`${name} 图片非本地托管 ${r.remoteImgCount} 张：${r.remoteImgs.join('、')}`);
    if (pageErrors.length) problems.push(`${name} JS 报错：${pageErrors[0].slice(0, 50)}`);

    if (!problems.some(p => p.startsWith(name)))
      notes.push(`${name} 通过（og：${r.ogTitle.slice(0, 30)}）`);

    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log('--- 非官方边界运行时检查 ---');
console.log(`  · 已渲染 ${PAGES.length} 页`);
notes.slice(0, 2).forEach(n => console.log('  ·', n));
if (notes.length > 2) console.log(`  · …其余 ${notes.length - 2} 页同样通过`);

if (problems.length) {
  console.log('\n发现问题：');
  problems.forEach(p => console.log('  x', p));
  console.log(`\nFAIL: ${problems.length} 项`);
  process.exit(1);
}
console.log('\nPASS: 渲染后身份、版权、分享卡标识、零热链均成立');
