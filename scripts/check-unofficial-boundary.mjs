/* ============================================================
   非官方边界门禁
   把「保持非官方发布边界，不冒充米哈游官方网站」变成可复运行的
   检查，而不是每次靠人工逐页翻。规则全部来自实际发现过的缺口。

   检查项：
   1. 9 个正式公开页必须有「非官方」「无隶属」与来源表述；editor 单独 noindex
   2. 使用官方美术的页面必须有版权归属，且措辞覆盖该页实际素材类型
   3. 不得自称官方网站 / 官方站点
   4. og:title 与 twitter:title 必须自带「非官方」
      （分享卡只显示标题与配图，描述会被截断）
   5. og:site_name 必须含「非官方」
   6. 装饰文案不得照抄官方界面原文标语
   7. 不得热链外部域名的图片 / 媒体

   用法：
     node scripts/check-unofficial-boundary.mjs

   注意：本脚本只做静态检查。页面内容多为 JS 渲染，素材类型表
   （ASSET_EXPECT）需要人工用浏览器统计后维护，见 DESIGN.md 6b 节。
   ============================================================ */
import fs from 'node:fs';

const problems = [];
const notes = [];

const PUBLIC_ARCHIVE_PAGES = [
  'index.html', 'character.html', 'faction.html', 'mainline.html',
  'events.html', 'behind-scenes.html', 'stories.html', 'cultivate.html'
];
const PUBLIC_PLAY_PAGES = ['tape-wall-sample.html'];
const INTERNAL_TOOL_PAGES = ['editor.html'];
const PAGES = [...PUBLIC_ARCHIVE_PAGES, ...PUBLIC_PLAY_PAGES];

if (PUBLIC_ARCHIVE_PAGES.length !== 8 || PUBLIC_PLAY_PAGES.length !== 1 || PAGES.length !== 9) {
  problems.push(`正式路由族数量错误：archive=${PUBLIC_ARCHIVE_PAGES.length} play=${PUBLIC_PLAY_PAGES.length} public=${PAGES.length}`);
}
if (PAGES.some((page) => INTERNAL_TOOL_PAGES.includes(page))) {
  problems.push('editor 内部工具不得进入正式公开页集合');
}

/* 各页实际使用的官方素材类型 -> 声明里必须出现的关键词。
   数据来自浏览器实测统计（DESIGN.md 6b 节有素材量对照表）。
   新增其他类型官方素材时要同步更新这里。 */
const ASSET_EXPECT = {
  /* 首页除 portraits 立绘、银幕轮播的 gallery 影画外，
     其他档案区块还会渲染 wiki 截图，因此三类声明都必须覆盖。 */
  'index.html': ['立绘', '影画', '截图'],
  'character.html': ['影画', '徽记'],
  /* faction.html 无 id 时是目录态，仅渲染阵营徽记；详情态由 runtime/all 逐阵营核对。 */
  'faction.html': ['徽记'],
  'mainline.html': ['截图', '封面'],
  'events.html': ['活动图'],
  'behind-scenes.html': ['截图'],
  /* Stories 新版是纯文字角色索引，不渲染官方美术素材。 */
  'stories.html': [],
  /* 45 个 channel=cultivate 候选页由指南 698 与 44 个素材页组成；
     指南内 23 条 FAQ 不另计为素材。44 个素材封面均在 wiki/cultivate/，
     未用 materials 目录，所以声明写「养成图」而不是「材料」。 */
  'cultivate.html': ['养成图'],
  /* PLAY 是独立页面族，但同样使用角色立绘，公开声明不能减负。 */
  'tape-wall-sample.html': ['立绘']
};

/* 曾经踩过的坑：装饰文案照抄了官方界面上的世界观标语，
   会让访客误认为这是官方界面。 */
const FORBIDDEN_COPY = [
  'HOLLOWS ARE AN APOCALYPTIC DISASTER'
];

function read(f) {
  try { return fs.readFileSync(f, 'utf8'); } catch (e) { return null; }
}

const STABLE_BOUNDARY_ATTR = /\bdata-(?:source-action|source-section|unofficial-boundary)\b|\bid\s*=\s*["'](?:sources?|characterFooterSource)["']|\bclass\s*=\s*["'][^"']*\b(?:footer-disclaimer|character-art-credit)\b[^"']*["']/i;
function stableBoundaryText(src) {
  const texts = [];
  for (const opening of src.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)) {
    if (!STABLE_BOUNDARY_ATTR.test(opening[2])) continue;
    const bodyStart = (opening.index ?? 0) + opening[0].length;
    const close = new RegExp(`</${opening[1]}\\s*>`, 'ig');
    close.lastIndex = bodyStart;
    const closing = close.exec(src);
    if (!closing) continue;
    texts.push(src.slice(bodyStart, closing.index).replace(/<[^>]+>/g, ' '));
  }
  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

function hasRobotsNoindex(src) {
  return (src.match(/<meta\b[^>]*>/gi) || []).some(tag =>
    /\bname\s*=\s*["']robots["']/i.test(tag)
      && /\bcontent\s*=\s*["'][^"']*\bnoindex\b[^"']*["']/i.test(tag));
}

for (const page of PAGES) {
  const src = read(page);
  if (!src) { problems.push(`${page} 读取失败`); continue; }

  // 1. 基础身份表述只在稳定来源/边界节点内核对，避免正文或脚本字样假绿
  const boundaryText = stableBoundaryText(src);
  if (!boundaryText.includes('非官方')) problems.push(`${page} 稳定边界节点缺「非官方」表述`);
  if (!boundaryText.includes('无隶属')) problems.push(`${page} 稳定边界节点缺「无隶属」表述`);
  if (!/来源|资料源|source/i.test(boundaryText)) problems.push(`${page} 稳定来源节点缺不可减负的来源声明`);
  if (page === 'character.html') {
    if (!/许可|授权/.test(boundaryText)) problems.push(`${page} Default 影画稳定来源节点缺授权声明`);
    if (!/官方\s*gallery/i.test(boundaryText)) problems.push(`${page} gallery 回退稳定来源节点缺官方素材说明`);
  }
  if (/data-layout-editor-host|href=["'][^"']*editor\.html/i.test(src)) {
    problems.push(`${page} 公开页不得嵌入或导航到 editor 内部工具`);
  }

  // 2. 版权归属与素材类型覆盖
  const expect = ASSET_EXPECT[page] || [];
  if (expect.length) {
    if (!boundaryText.includes('版权归米哈游')) {
      problems.push(`${page} 稳定边界节点缺版权归属声明`);
    } else {
      const missing = expect.filter(k => !boundaryText.includes(k));
      if (missing.length)
        problems.push(`${page} 版权声明未覆盖素材类型：${missing.join('、')}`);
    }
  }

  // 3. 不得自称官方；指向已核验官方域名的来源链接可准确标注「官方网站」
  const selfClaimSurface = src.replace(
    /<a\b[^>]*\bhref=["']https:\/\/(?:zenless\.hoyoverse\.com|baike\.mihoyo\.com)\/[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
    ' '
  );
  for (const hit of selfClaimSurface.match(/.{0,8}官方(?:网站|站点)/g) || []) {
    if (/非官方|不是|否认/.test(hit)) continue;
    problems.push(`${page} 疑似自称官方：「${hit.trim()}」`);
  }

  // 4/5. 分享卡身份
  const ogTitle = (src.match(/property="og:title" content="([^"]*)"/) || [])[1];
  const twTitle = (src.match(/name="twitter:title" content="([^"]*)"/) || [])[1];
  const ogSite = (src.match(/property="og:site_name" content="([^"]*)"/) || [])[1];
  if (!ogTitle) problems.push(`${page} 缺 og:title（分享卡会由平台自行抓取，可能不含身份）`);
  else if (!ogTitle.includes('非官方')) problems.push(`${page} og:title 不含「非官方」：「${ogTitle}」`);
  if (!twTitle) problems.push(`${page} 缺 twitter:title`);
  else if (!twTitle.includes('非官方')) problems.push(`${page} twitter:title 不含「非官方」`);
  if (!ogSite) problems.push(`${page} 缺 og:site_name`);
  else if (!ogSite.includes('非官方')) problems.push(`${page} og:site_name 不含「非官方」`);

  notes.push(`${page} 检查完成`);
}

for (const page of INTERNAL_TOOL_PAGES) {
  const src = read(page);
  if (!src) {
    problems.push(`${page} 内部工具读取失败`);
    continue;
  }
  if (!hasRobotsNoindex(src)) {
    problems.push(`${page} 作为内部工具必须声明 noindex`);
  }
}

const sidebarSource = read('site-sidebar.js');
if (!sidebarSource) {
  problems.push('site-sidebar.js 读取失败');
} else if (/editor\.html|data-editor|编辑入口|编辑工具/i.test(sidebarSource)) {
  problems.push('site-sidebar.js 公开侧栏不得包含 editor 按钮、链接或编辑入口文案');
}

/* 6. 装饰文案不抄官方原文 */
for (const f of fs.readdirSync('.').filter(f => f.endsWith('.js'))) {
  const src = read(f);
  if (!src) continue;
  for (const bad of FORBIDDEN_COPY)
    if (src.includes(bad))
      problems.push(`${f} 含官方界面原文标语「${bad.slice(0, 30)}」，装饰文案应用本站自己的标识`);
}

/* 7. 不得热链外部图片 / 媒体 */
const MEDIA_EXT = /\.(png|jpe?g|webp|gif|mp4|webm|avif)(\?|$)/i;
for (const page of PAGES) {
  const src = read(page);
  if (!src) continue;
  for (const m of src.match(/(?:src|href)="https?:\/\/[^"]+/g) || []) {
    const url = m.replace(/^[^"]*"/, '');
    if (MEDIA_EXT.test(url)) {
      let host = '';
      try { host = new URL(url).host; } catch (e) { host = url.slice(0, 30); }
      problems.push(`${page} 热链外部媒体：${host}`);
    }
  }
}

console.log('--- 非官方边界检查 ---');
console.log(`  · 已检查 ${PAGES.length} 页`);
notes.slice(0, 3).forEach(n => console.log('  ·', n));
if (notes.length > 3) console.log(`  · …其余 ${notes.length - 3} 页同样完成`);

if (problems.length) {
  console.log('\n发现问题：');
  problems.forEach(p => console.log('  ✗', p));
  console.log(`\nFAIL: ${problems.length} 项`);
  process.exit(1);
}
console.log('\nPASS: 非官方身份、版权归属、分享卡标识、零热链均成立');
