/* ============================================================
   从标题中提取真实元数据，替换「摘要=标题」的重复占位。
   原则：不编造剧情内容，只把标题里已存在的信息结构化。
   - 版本 PV  -> 归属版本 + 副题
   - 角色 PV  -> 角色名 + 副题 + 写入 characters
   - 先导/季度 PV -> 季度信息
   同时补 chapter（原本也是标题副本）为可读的分组名。
   用法：node scripts/enrich-mainline-meta.mjs [--write]
   ============================================================ */
import fs from 'node:fs';

const FILE = 'data.js';
const WRITE = process.argv.includes('--write');

const src = fs.readFileSync(FILE, 'utf8');
const m = src.match(/^\s*window\.archiveData\s*=\s*([\s\S]*?);\s*$/);
if (!m) { console.error('无法解析 data.js 结构'); process.exit(1); }
const data = JSON.parse(m[1]);

// 全角/半角竖线都要处理
const BAR = '[|｜丨]';

function parse(rawTitle) {
  // 先剥掉《绝区零》等作品名前缀，再判断类型，避免落入通用分支
  const title = String(rawTitle).replace(/^《[^》]*》\s*/, '').trim();
  let r;
  if ((r = title.match(new RegExp(`^([\\d.]+)版本PV\\s*${BAR}\\s*(.+)$`))))
    return { kind: '版本PV', version: r[1], subtitle: r[2].trim() };
  if ((r = title.match(new RegExp(`^第(.+?)季(?:先导|预告)PV\\s*${BAR}\\s*(.+)$`))))
    return { kind: '先导PV', season: r[1].trim(), subtitle: r[2].trim() };
  if ((r = title.match(new RegExp(`^(.+?)角色PV\\s*${BAR}\\s*(.+)$`))))
    return { kind: '角色PV', agent: r[1].trim(), subtitle: r[2].trim() };
  // 其余「XXPV | 副题」形式：保留 XX 作为影像类型
  if ((r = title.match(new RegExp(`^(.+?)PV\\s*${BAR}\\s*(.+)$`)))) {
    const kind = r[1].trim();
    if (kind && kind !== '绝区零') return { kind: kind + 'PV', subtitle: r[2].trim() };
  }
  return null;
}

// 「未标注」是占位值而非真实版本号，不能拼进句子
function realVersion(item) {
  const v = String(item.version || '').trim();
  return v && v !== '未标注' ? v : null;
}

function buildSummary(p, item) {
  const parts = [];
  if (p.bare) {
    parts.push(`官方${p.kind}`);
    if (realVersion(item)) parts.push(`${item.version} 版本期间发布`);
    if (item.chapter && item.chapter !== item.title) parts.push(item.chapter);
    return parts.join(' · ');
  }
  if (p.kind === '版本PV') {
    parts.push(`${p.version} 版本宣传影像`);
    parts.push(`副题「${p.subtitle}」`);
  } else if (p.kind === '角色PV') {
    parts.push(`${p.agent} 的角色宣传影像`);
    parts.push(`副题「${p.subtitle}」`);
    if (realVersion(item)) parts.push(`${item.version} 版本期间发布`);
  } else if (p.kind === '先导PV') {
    parts.push(`第${p.season}季先导影像`);
    parts.push(`副题「${p.subtitle}」`);
  } else {
    parts.push(`官方${p.kind}影像`);
    parts.push(`副题「${p.subtitle}」`);
    if (realVersion(item)) parts.push(`${item.version} 版本期间发布`);
  }
  return parts.join(' · ');
}

function buildChapter(p, item) {
  if (p.bare) return realVersion(item) ? `${item.version} 版本 · ${p.kind}` : `官方影像 · ${p.kind}`;
  if (p.kind === '版本PV') return `${p.version} 版本 · 宣传影像`;
  if (p.kind === '角色PV') return `代理人影像 · ${p.agent}`;
  if (p.kind === '先导PV') return `第${p.season}季 · 先导`;
  return `官方影像 · ${p.kind}`;
}

let changed = 0, skipped = 0, unparsed = [];
const report = [];

for (const item of data.mainline || []) {
  // 判定占位摘要：与标题相同，或是无信息量的短标签（如「绝区零PV」「安比角色PV」）
  const s = String(item.summary || '').trim();
  const isPlaceholder = s === item.title
    || (s.length <= 14 && /(PV|考据|演示|测试)$/.test(s))
    || s === '绝区零PV';
  const dupChapter = item.chapter === item.title;
  if (!isPlaceholder && !dupChapter) { skipped++; continue; }
  const dupSummary = isPlaceholder;

  let p = parse(item.title || '');
  // 标题无「| 副题」结构时，退化为按影像类型描述，仍不编造剧情
  if (!p) {
    const bare = String(item.title || '').replace(/^《[^》]*》\s*/, '').trim();
    const km = bare.match(/^(.+?)(PV|演示|考据)$/);
    if (km) p = { kind: km[1].trim() + km[2], bare: true };
    else { unparsed.push(item.title); continue; }
  }

  const before = { summary: item.summary, chapter: item.chapter, characters: item.characters };
  if (dupSummary) item.summary = buildSummary(p, item);
  if (dupChapter) item.chapter = buildChapter(p, item);
  // 角色 PV 可确定主角，写入 characters（原为空）
  if (p.kind === '角色PV' && (!item.characters || !item.characters.length))
    item.characters = [p.agent];

  changed++;
  report.push({ id: item.id, title: item.title, summary: item.summary, chapter: item.chapter, characters: item.characters });
}

console.log(`可修复并已处理：${changed}`);
console.log(`本身有真实内容、跳过：${skipped}`);
console.log(`标题无法解析、保持原样：${unparsed.length}`);
if (unparsed.length) console.log('  ' + unparsed.slice(0, 8).join(' / '));
console.log('\n样例：');
report.slice(0, 5).forEach(r => {
  console.log(`  ${r.title}`);
  console.log(`    摘要：${r.summary}`);
  console.log(`    章节：${r.chapter}`);
  if (r.characters?.length) console.log(`    角色：${r.characters.join('、')}`);
});

if (WRITE) {
  const out = `window.archiveData=${JSON.stringify(data, null, 2)};\n`;
  fs.copyFileSync(FILE, FILE + '.bak-before-meta-enrich');
  fs.writeFileSync(FILE, out, 'utf8');
  console.log(`\n已写入 ${FILE}（备份：${FILE}.bak-before-meta-enrich）`);
} else {
  console.log('\n预演模式，未写入。加 --write 生效。');
}
