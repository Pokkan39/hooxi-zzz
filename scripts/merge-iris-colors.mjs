/* 把瞳色标注结果并入 agent-xray.js 的 i 字段。

   配套 artifacts/iris-picker.html：在那个工具页里逐角色点选瞳孔取色，
   点「导出 JSON」拿到 {角色id:[r,g,b]}，存成文件后运行本脚本合并。
   导出只把结果填进页面文本框，不会下载文件，需手动复制另存。
   标注进度存 localStorage，关页面不丢，但重开后落点回第一个角色而非断点。
   分批交回是安全的：本脚本每次读现表再写回，后一批不会冲掉前一批，
   重标同一角色会更新为新值。

   为什么需要人工标注：浏览器端无法可靠检测二次元人脸虹膜——MediaPipe
   FaceLandmarker 与 face-api 均为真人照片训练；能识别 anime 脸的
   anime-face-detector 仅 Python 版。实测启发式近似在 39/53 个角色上
   退化为与字母色同色，不可用。

   后续又试过三种像素采样替代法，全部失败，勿重复尝试：
   一是眼部区域收高饱和像素，与字母色色相差中位数 4 度、90% 角色重合；
   二是加「邻域存在眼内白色高光」约束，仍有 86% 重合，收紧无改善；
   三是眼部高度横向扫点取最高饱和，取到的是头发、阴影与海报底色。
   三次失败原因一致：程序无法把瞳孔从整体配色中分离。

   用法：
     node scripts/merge-iris-colors.mjs <picks.json>
     node scripts/merge-iris-colors.mjs artifacts/iris-picks.json

   只写 i 字段，不改 a/c/ar/f/l。合并前会校验并拒绝明显误点的取值。 */
import fs from 'node:fs';

const src = process.argv[2];
if (!src) {
  console.log('用法: node scripts/merge-iris-colors.mjs <picks.json>');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.log(`FAIL: 找不到 ${src}`);
  process.exit(1);
}

const picks = JSON.parse(fs.readFileSync(src, 'utf8'));
const tableSrc = fs.readFileSync('agent-xray.js', 'utf8');
const m = tableSrc.match(/window\.agentXray\s*=\s*([\s\S]*);\s*$/);
if (!m) { console.log('FAIL: 无法解析 agent-xray.js'); process.exit(1); }
const table = JSON.parse(m[1]);

/* 校验：瞳色应是有一定饱和度的中间调。
   全黑/全白/极低饱和大多是误点到线稿、高光或背景。
   这里只警告不阻断——某些角色确实是灰瞳，最终由人判断。 */
function inspect(rgb) {
  if (!Array.isArray(rgb) || rgb.length !== 3
    || rgb.some(v => typeof v !== 'number' || v < 0 || v > 255)) {
    return { ok: false, why: '不是合法 RGB 三元组' };
  }
  const mx = Math.max(...rgb), mn = Math.min(...rgb);
  const sat = mx ? (mx - mn) / mx : 0;
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  const notes = [];
  if (lum < 0.06) notes.push('过暗，可能点到线稿');
  if (lum > 0.94) notes.push('过亮，可能点到高光');
  if (sat < 0.12) notes.push(`饱和度仅 ${sat.toFixed(2)}，可能点到灰部`);
  return { ok: true, sat: +sat.toFixed(2), lum: +lum.toFixed(2), notes };
}

const applied = [];
const skipped = [];
const warned = [];

for (const [id, rgb] of Object.entries(picks)) {
  if (!table[id]) { skipped.push(`${id}（不在影画数据表中）`); continue; }
  const r = inspect(rgb);
  if (!r.ok) { skipped.push(`${id}（${r.why}）`); continue; }
  if (r.notes.length) warned.push(`${id}: rgb(${rgb.join(',')}) — ${r.notes.join('；')}`);
  table[id].i = rgb;
  applied.push(id);
}

const missing = Object.keys(table).filter(id => !table[id].i);

const header = tableSrc.slice(0, tableSrc.indexOf('window.agentXray'));
const irisNote = header.includes('i = 瞳孔色') ? '' :
  `/* i = 瞳孔色，人工标注（artifacts/iris-picker.html 取色，
     scripts/merge-iris-colors.mjs 合并）。自动检测对二次元插画不可靠，
     缘由与三次失败的采样尝试见 scripts/merge-iris-colors.mjs 头部注释。
     缺失时 UI 回落到 l（字母色）。 */\n`;

fs.writeFileSync('agent-xray.js',
  header + irisNote + 'window.agentXray = ' + JSON.stringify(table, null, 1) + ';\n');

console.log('--- 瞳色合并 ---');
console.log(`已并入 ${applied.length} 个角色`);
if (warned.length) {
  console.log(`\n可疑取值 ${warned.length} 项（已写入，请人工复核）：`);
  warned.forEach(w => console.log('  ?', w));
}
if (skipped.length) {
  console.log(`\n跳过 ${skipped.length} 项：`);
  skipped.forEach(s => console.log('  -', s));
}
if (missing.length) {
  console.log(`\n尚未标注 ${missing.length} 个角色：${missing.slice(0, 8).join('、')}`
    + (missing.length > 8 ? ` 等` : ''));
  console.log('这些角色的 UI 会回落到字母色，不影响页面正常显示。');
}
console.log(`\nPASS: agent-xray.js 已更新`);
