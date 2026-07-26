/* 实测角色页首屏文字压在影画上的实际对比度。

   为什么不能只看 CSS：这些文字的背景是影画（一张彩色插画），
   getComputedStyle 拿到的 backgroundColor 多为 transparent，
   真实对比度取决于文字位置下面那块画面的像素。所以这里截图取样，
   逐元素算文字色与其背后实际像素均值的 WCAG 2.1 对比度。

   判定沿用 WCAG 2.1 AA：普通文字 >=4.5:1，大字（>=18.66px 粗体
   或 >=24px）>=3:1。APCA 是 WCAG 3 候选但尚未成为标准，不作合规依据。

   用法：node scripts/check-hero-contrast.mjs [角色id...]
   需本地静态服务在 127.0.0.1:8000 运行。

   本脚本只查文字对比度，不查触控目标尺寸，后者目前无门禁覆盖。
   若改动样式后需复核触控尺寸（WCAG 2.2 SC 2.5.8），方法是在移动视口下
   取所有 a/button/[role=button]/input/select/summary，凡宽或高小于 24px 者，
   再算它与最近同类目标的中心距，中心距 >=24px 可适用间距例外，否则不合规。
   实测曾据此发现轮播指示点 banner-dot 在三个页面共 23 个控件不合规
   （14x8、中心距 22px），已在 archive-tools.css 补水平外边距修正。 */
process.title = 'pw';
const { chromium } = await import('playwright');

const argv = process.argv.slice(2);
const ALL = argv.includes('--all');
const ids = argv.filter(a => !a.startsWith('--'));

/* --all 时遍历全部有影画的角色。4 个样本不足以覆盖 53 张影画的底色
   分布——安比那张亮黄底就把卡名压到 3.84:1，其他亮底角色可能同样超标。 */
let agents;
if (ALL) {
  const fsSync = await import('node:fs');
  const src = fsSync.readFileSync('agent-xray.js', 'utf8');
  const m = src.match(/window\.agentXray\s*=\s*([\s\S]*);\s*$/);
  agents = Object.keys(JSON.parse(m[1]));
} else {
  agents = ids.length ? ids : ['caesar', 'rina', 'anby', 'zhao'];
}

/* 要检查的首屏文字元素：选择器 + 人类可读名 */
const TARGETS = [
  ['.character-rail-action', '侧栏页签'],
  ['.character-back', '侧栏返回'],
  ['.character-rail-code', '侧栏编号'],
  ['.zzz-roster-head', '名录标题'],
  ['.zzz-card-name', '名录卡角色名'],
  ['.zzz-edge-badge', '右缘档案编号'],
  ['.zzz-wm-arc text', '弧形英文小字']
];

function srgb(c) { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function lum([r, g, b]) { return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b); }
function ratio(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const browser = await chromium.launch();
const problems = [];
const rows = [];

/* helper page 只用来解码截图取像素，全程复用一个即可。
   全量扫描 53 个角色时若每次重建，等于多开 53 个 context。 */
const helperCtx = await browser.newContext();
const helper = await helperCtx.newPage();
await helper.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'load' });

for (const id of agents) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:8000/character.html?id=${id}&cb=${Date.now()}`,
    { waitUntil: 'load' });
  await page.waitForTimeout(2200);

  /* 先隐藏所有目标文字，截一张"纯背景"图；再逐元素取其矩形内像素均值。
     这样得到的是文字真正压着的底色，而不是被文字自身像素污染的均值。 */
  const boxes = await page.evaluate((TARGETS) => {
    const out = [];
    for (const [sel, label] of TARGETS) {
      const el = document.querySelector(sel);
      if (!el) { out.push({ label, sel, missing: true }); continue; }
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) {
        out.push({ label, sel, hidden: true }); continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) { out.push({ label, sel, tiny: true }); continue; }
      const color = (cs.color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      /* 只有 SVG 图形元素才看 fill。普通 HTML 元素的 computed fill 默认是
         rgb(0,0,0)（并非 none），若不加判断会把所有文字色误算成纯黑。 */
      const isSvgText = el instanceof SVGElement;
      const fill = (isSvgText && cs.fill && cs.fill !== 'none')
        ? (cs.fill.match(/[\d.]+/g) || []).slice(0, 3).map(Number) : null;
      const fs = parseFloat(cs.fontSize) || 0;
      const fw = parseInt(cs.fontWeight, 10) || 400;
      /* 元素自带不透明背景时直接用声明值算，不走截图采样。
         截图法会先隐藏元素，连它的背景一起隐藏，量到的是更下层的影画。
         实测这曾把激活态页签误判为 1.01:1，其真实对比度是 7.47:1。 */
      const bgc = (cs.backgroundColor.match(/[\d.]+/g) || []).map(Number);
      /* 记下自身背景色与其 alpha。完全不透明时直接用；半透明时后面与
         截图取到的影画底色做 alpha 合成——此前阈值定在 0.95，导致
         rgba(8,10,13,.78) 这类半透明底被忽略，量出的对比度偏低。 */
      const opaqueBg = bgc.length >= 3 && (bgc.length < 4 || bgc[3] >= 0.99)
        ? bgc.slice(0, 3) : null;
      let semiBg = (!opaqueBg && bgc.length === 4 && bgc[3] > 0.02)
        ? { rgb: bgc.slice(0, 3), a: bgc[3] } : null;
      /* 渐变背景：backgroundColor 读不到它，会漏判成"没有底"。
         取渐变里最不透明的那一档作保守估计——文字可能落在任意位置，
         用最强档会偏乐观，但渐变通常朝文字起始侧最深，实践中够用。
         此前漏这一支曾把已达 14.44:1 的卡名误报为 3.84:1。 */
      if (!opaqueBg && cs.backgroundImage && cs.backgroundImage !== 'none') {
        const stops = cs.backgroundImage.match(/rgba?\([^)]+\)/g) || [];
        let best = null;
        for (const st of stops) {
          const p = (st.match(/[\d.]+/g) || []).map(Number);
          if (p.length < 3) continue;
          const a = p.length >= 4 ? p[3] : 1;
          if (!best || a > best.a) best = { rgb: p.slice(0, 3), a };
        }
        if (best && (!semiBg || best.a > semiBg.a)) semiBg = best;
      }
      out.push({
        label, sel,
        rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
        color: (fill && fill.length === 3) ? fill : color,
        ownBg: opaqueBg,
        semiBg,
        /* SVG 文本描边：有深色描边时它才是文字实际的贴底 */
        strokeRgb: (isSvgText && cs.stroke && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0)
          ? (cs.stroke.match(/[\d.]+/g) || []).slice(0, 3).map(Number) : null,
        strokeA: (isSvgText && cs.stroke)
          ? (((cs.stroke.match(/[\d.]+/g) || [])[3] !== undefined)
            ? Number((cs.stroke.match(/[\d.]+/g) || [])[3]) : 1) : 0,
        fontSize: fs, fontWeight: fw,
        isLarge: fs >= 24 || (fs >= 18.66 && fw >= 700)
      });
    }
    return out;
  }, TARGETS);

  /* 隐藏文字后截图，得到干净背景 */
  await page.addStyleTag({
    content: TARGETS.map(([s]) => s).join(',') + '{visibility:hidden!important}'
  });
  await page.waitForTimeout(260);
  const shot = await page.screenshot({ type: 'png' });
  await ctx.close();

  /* 用复用的 helper page 解码截图并取样，避免自己写 PNG 解析 */
  const samples = await helper.evaluate(async ({ b64, boxes }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + b64;
    await new Promise(r => { im.onload = r; im.onerror = r; });
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const cx = c.getContext('2d');
    cx.drawImage(im, 0, 0);
    return boxes.map(b => {
      if (!b.rect) return b;
      /* 自带不透明背景的元素跳过截图采样，直接用声明值 */
      if (b.ownBg) return Object.assign({}, b, { bg: b.ownBg });
      const x = Math.max(0, b.rect.x), y = Math.max(0, b.rect.y);
      const w = Math.min(b.rect.w, c.width - x), h = Math.min(b.rect.h, c.height - y);
      if (w < 1 || h < 1) return Object.assign({}, b, { offscreen: true });
      const d = cx.getImageData(x, y, w, h).data;
      let R = 0, G = 0, B = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; }
      let bg = [Math.round(R / n), Math.round(G / n), Math.round(B / n)];
      /* 元素自身有半透明背景时，把它按 alpha 合成到影画底色之上，
         得到文字实际压着的颜色。 */
      if (b.semiBg) {
        const a = b.semiBg.a;
        bg = bg.map((v, i) => Math.round(b.semiBg.rgb[i] * a + v * (1 - a)));
      }
      return Object.assign({}, b, { bg });
    });
  }, { b64: shot.toString('base64'), boxes });


  for (const s of samples) {
    if (s.missing || s.hidden || s.tiny || s.offscreen) {
      rows.push({ id, label: s.label, note: s.missing ? '元素不存在'
        : s.hidden ? '已隐藏' : s.tiny ? '尺寸过小' : '在视口外' });
      continue;
    }
    /* SVG 文本带深色描边时，描边等效于给每个字符加底，实际可读性由
       文字色与描边色的对比决定，而不是与更下层的影画。截图法量不到描边
       （元素被隐藏），所以这里改用描边色作底。 */
    const effBg = (s.strokeRgb && s.strokeA > 0.5) ? s.strokeRgb : s.bg;
    const cr = ratio(s.color, effBg);
    const need = s.isLarge ? 3 : 4.5;
    const pass = cr >= need;
    rows.push({
      id, label: s.label,
      fg: `rgb(${s.color.join(',')})`, bg: `rgb(${s.bg.join(',')})`,
      size: `${s.fontSize}px/${s.fontWeight}`,
      ratio: +cr.toFixed(2), need, pass
    });
    if (!pass) problems.push(
      `${id} ${s.label}：对比度 ${cr.toFixed(2)}:1，未达 AA 要求 ${need}:1`
      + `（文字 rgb(${s.color.join(',')}) 背景 rgb(${s.bg.join(',')})，${s.fontSize}px/${s.fontWeight}）`);
  }
}

await browser.close();

console.log('--- 首屏文字对比度实测（WCAG 2.1 AA）---');
console.log(`已检查 ${agents.length} 个角色 × ${TARGETS.length} 个元素`);

if (ALL) {
  /* 全量模式逐行输出会有几百行，改为按元素汇总最低值 */
  const byLabel = {};
  for (const r of rows) {
    if (r.note) continue;
    const b = byLabel[r.label] || (byLabel[r.label] = { min: Infinity, minId: '', fails: 0, n: 0 });
    b.n++;
    if (!r.pass) b.fails++;
    if (r.ratio < b.min) { b.min = r.ratio; b.minId = r.id; }
  }
  console.log('\n按元素汇总（最低对比度 / 未达标数）：');
  for (const [label, b] of Object.entries(byLabel)) {
    console.log(`  ${label.padEnd(12)} 最低 ${String(b.min).padStart(6)}:1（${b.minId}）`
      + `  未达标 ${b.fails}/${b.n}`);
  }
} else {
  for (const r of rows) {
    if (r.note) { console.log(`  ${r.id.padEnd(8)} ${r.label.padEnd(12)} ${r.note}`); continue; }
    console.log(`  ${r.id.padEnd(8)} ${r.label.padEnd(12)} ${String(r.ratio).padStart(6)}:1 `
      + `需 ${r.need}:1  ${r.pass ? 'PASS' : 'FAIL'}  ${r.size}  文字${r.fg} 底${r.bg}`);
  }
}
if (problems.length) {
  console.log('\n未达标项：');
  problems.forEach(p => console.log('  x', p));
  console.log(`\nFAIL: ${problems.length} 项`);
  process.exit(1);
}
console.log('\nPASS: 首屏全部文字达 WCAG 2.1 AA');
