/* ============================================================
   非官方边界门禁
   把「保持非官方发布边界，不冒充米哈游官方网站」变成可复运行的
   检查，而不是每次靠人工逐页翻。规则全部来自实际发现过的缺口。

   检查项：
   1. 每页必须有「非官方」与「无隶属」表述
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

const PAGES = [
  'index.html', 'character.html', 'faction.html', 'mainline.html',
  'events.html', 'behind-scenes.html', 'stories.html', 'cultivate.html'
];

/* 各页实际使用的官方素材类型 -> 声明里必须出现的关键词。
   数据来自浏览器实测统计（DESIGN.md 6b 节有素材量对照表）。
   新增其他类型官方素材时要同步更新这里。 */
const ASSET_EXPECT = {
  'index.html': ['立绘', '影画'],
  'character.html': ['立绘', '影画', '徽记'],
  'faction.html': ['立绘', '徽记'],
  'mainline.html': ['截图', '封面'],
  'events.html': ['活动图'],
  'behind-scenes.html': ['截图'],
  'stories.html': ['立绘'],
  'cultivate.html': ['材料']
};

/* 曾经踩过的坑：装饰文案照抄了官方界面上的世界观标语，
   会让访客误认为这是官方界面。 */
const FORBIDDEN_COPY = [
  'HOLLOWS ARE AN APOCALYPTIC DISASTER'
];

function read(f) {
  try { return fs.readFileSync(f, 'utf8'); } catch (e) { return null; }
}

for (const page of PAGES) {
  const src = read(page);
  if (!src) { problems.push(`${page} 读取失败`); continue; }

  // 1. 基础身份表述
  if (!src.includes('非官方')) problems.push(`${page} 缺「非官方」表述`);
  if (!src.includes('无隶属')) problems.push(`${page} 缺「无隶属」表述`);

  // 2. 版权归属与素材类型覆盖
  const expect = ASSET_EXPECT[page] || [];
  if (expect.length) {
    if (!src.includes('版权归米哈游')) {
      problems.push(`${page} 使用官方素材但缺版权归属声明`);
    } else {
      // 只检查页脚声明那一句，避免被正文其他文字误判通过
      const m = src.match(/footer-disclaimer">([^<]*)/);
      const decl = m ? m[1] : src;
      const missing = expect.filter(k => !decl.includes(k));
      if (missing.length)
        problems.push(`${page} 版权声明未覆盖素材类型：${missing.join('、')}`);
    }
  }

  // 3. 不得自称官方
  for (const hit of src.match(/.{0,8}官方(?:网站|站点)/g) || []) {
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
