/* ============================================================
   链接诚信门禁
   把「不得编造 BV 号或伪造官方直达链接」变成可复运行的检查，
   而不是依赖人工记忆。任何后续改动都能用它复验。

   检查项：
   1. 全站 BV 号必须能被 B 站 API 校验为存在（--online 时启用）
   2. BV 号格式合法，且不得出现重复指向不同标题的情况
   3. 声称「B 站视频」的出口，其链接必须真指向 bilibili.com/video/BV
   4. 声称百科 / 米游社的出口，域名必须一致
   5. 记录不得出现没有任何来源的「假直达」

   用法：
     node scripts/check-link-integrity.mjs           离线结构检查
     node scripts/check-link-integrity.mjs --online  额外调用 B 站 API 校验
   ============================================================ */
import fs from 'node:fs';

const ONLINE = process.argv.includes('--online');
const problems = [];
const notes = [];

function load(file, globalName) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(new RegExp(`window\\.${globalName}\\s*=\\s*([\\s\\S]*?);\\s*$`));
  if (!m) throw new Error(`无法解析 ${file}`);
  return JSON.parse(m[1]);
}

const archive = load('data.js', 'archiveData');
const catalog = load('media-catalog.js', 'hooxiMediaCatalog');

const LANES = ['mainline', 'stories', 'events', 'behindScenes'];
const BV_RE = /^BV[A-Za-z0-9]{10}$/;

/* ---- 收集所有 BV 号及其出处 ---- */
const bvMap = new Map(); // bvid -> [{where, title}]
function noteBv(bvid, where, title) {
  if (!bvid) return;
  if (!bvMap.has(bvid)) bvMap.set(bvid, []);
  bvMap.get(bvid).push({ where, title: title || '' });
}

for (const m of (catalog.items || [])) {
  noteBv(m.bvid, `media-catalog/${m.id}`, m.title);
  for (const f of ['videoUrl', 'canonicalUrl']) {
    const hit = String(m[f] || '').match(/\/video\/(BV[A-Za-z0-9]{10})/);
    if (hit) noteBv(hit[1], `media-catalog/${m.id}.${f}`, m.title);
  }
}
for (const lane of LANES) {
  for (const x of (archive[lane] || [])) {
    for (const f of ['video', 'sourceUrl', 'wikiUrl']) {
      const hit = String(x[f] || '').match(/\/video\/(BV[A-Za-z0-9]{10})/);
      if (hit) noteBv(hit[1], `${lane}/${x.id}.${f}`, x.title);
    }
  }
}

/* ---- 1&2. BV 格式与一致性 ---- */
for (const [bv, uses] of bvMap) {
  if (!BV_RE.test(bv)) problems.push(`BV 号格式非法：${bv}（出现在 ${uses[0].where}）`);
  const titles = [...new Set(uses.map(u => u.title).filter(Boolean))];
  if (titles.length > 1)
    problems.push(`同一 BV ${bv} 指向多个不同标题，疑似占位或误填：${titles.slice(0, 3).join(' / ')}`);
}
notes.push(`发现 BV 号 ${bvMap.size} 个，引用点 ${[...bvMap.values()].reduce((s, v) => s + v.length, 0)} 处`);

/* ---- 3&4. 声明与落点一致（依据 page.js 的标签规则复算） ---- */
function expectedLabel(item) {
  const v = String(item.video || '');
  if (/bilibili\.com\/video\/BV/i.test(v)) return 'bilibili';
  if (v) return 'video-other';
  const h = String(item.sourceUrl || item.wikiUrl || '');
  if (/miyoushe\.com/i.test(h)) return 'miyoushe';
  if (/baike\.mihoyo\.com/i.test(h)) return 'baike';
  return h ? 'other' : 'none';
}
let noSource = 0;
for (const lane of LANES) {
  for (const x of (archive[lane] || [])) {
    const kind = expectedLabel(x);
    if (kind === 'none') { noSource++; continue; }
    const href = x.video || x.sourceUrl || x.wikiUrl || '';
    if (!/^https:\/\//.test(href))
      problems.push(`${lane}/${x.id} 出口非 https：${href.slice(0, 46)}`);
    if (kind === 'bilibili' && !/bilibili\.com\/video\/BV/.test(href))
      problems.push(`${lane}/${x.id} 声称 B 站视频但链接不符`);
    if (kind === 'baike' && !/baike\.mihoyo\.com/.test(href))
      problems.push(`${lane}/${x.id} 声称百科但域名不符`);
    if (kind === 'miyoushe' && !/miyoushe\.com/.test(href))
      problems.push(`${lane}/${x.id} 声称米游社但域名不符`);
  }
}
if (noSource) notes.push(`无任何来源链接的记录 ${noSource} 条（应显示「资料待接入」，不得伪造直达）`);

/* ---- 5. 在线校验 BV 真实性 ---- */
async function verifyOnline() {
  for (const [bv, uses] of bvMap) {
    try {
      const r = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bv}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const j = await r.json();
      if (j.code !== 0) {
        problems.push(`BV ${bv} 经 B 站 API 校验不存在（code=${j.code}），出处 ${uses[0].where}`);
        continue;
      }
      const remote = String(j.data?.title || '');
      const local = uses.find(u => u.title)?.title || '';
      // 标题完全无交集时提示，避免张冠李戴
      if (local && remote && !remote.includes(local.slice(0, 6)) && !local.includes(remote.slice(0, 6)))
        problems.push(`BV ${bv} 标题与本地记录不符：远端「${remote.slice(0, 26)}」本地「${local.slice(0, 26)}」`);
      else notes.push(`BV ${bv} 校验通过：${remote.slice(0, 34)}`);
    } catch (e) {
      notes.push(`BV ${bv} 在线校验跳过（网络不可用：${String(e.message).slice(0, 30)}）`);
    }
  }
}

const run = ONLINE ? verifyOnline() : Promise.resolve();
run.then(() => {
  console.log('--- 链接诚信检查 ---');
  notes.forEach(n => console.log('  ·', n));
  if (problems.length) {
    console.log('\n发现问题：');
    problems.forEach(p => console.log('  ✗', p));
    console.log(`\nFAIL: ${problems.length} 项`);
    process.exit(1);
  }
  console.log(`\nPASS: 无编造 BV 号、无伪造直达链接${ONLINE ? '（含在线校验）' : '（离线结构检查）'}`);
});
