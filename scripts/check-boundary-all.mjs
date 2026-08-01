/* 全量核查 9 个正式公开路由、editor 内部工具，以及所有角色页与阵营页的非官方边界。
   常规门禁只抽验代表页；本脚本覆盖 57 角色、18 阵营、8 个档案族路由、
   1 个独立 PLAY 路由与 1 个 noindex 内部工具，并确认 3 个无 Default 影画角色走 gallery 首图回退。

   用法：npm run test:boundary:all
   需本地静态服务在 127.0.0.1:8000 运行。跑 85 个页面（9 公开 + 1 内部 + 57 角色 + 18 阵营），约数分钟，
   所以不串入 npm test，作为改版后或发布前的完整核查。 */
process.title = 'pw';
const { chromium } = await import('playwright');
const fs = await import('node:fs');

const catalogSrc = fs.readFileSync('agent-catalog.js', 'utf8');
const g = {};
new Function('window', catalogSrc)(g);
const agents = g.agentCatalog.characters.map(c => c.id);
const factions = g.agentCatalog.factions.map(f => f.id);
const PUBLIC_ARCHIVE_ROUTES = [
  'index.html', 'mainline.html', 'stories.html', 'character.html',
  'faction.html', 'events.html', 'behind-scenes.html', 'cultivate.html',
];
const PUBLIC_PLAY_ROUTES = ['tape-wall-sample.html'];
const INTERNAL_TOOL_ROUTES = ['editor.html'];
const PUBLIC_ROUTES = [...PUBLIC_ARCHIVE_ROUTES, ...PUBLIC_PLAY_ROUTES];
const EDITOR_AUTH_SESSION_URL = 'http://localhost:3001/api/auth/session';
const GALLERY_FALLBACK_IDS = new Set(['norma', 'pyrois', 'velina']);
if (PUBLIC_ARCHIVE_ROUTES.length !== 8 || PUBLIC_PLAY_ROUTES.length !== 1 || INTERNAL_TOOL_ROUTES.length !== 1 || PUBLIC_ROUTES.length !== 9) {
  throw new Error('路由族合同错误：必须为 8 个 archive、1 个 PLAY 与 1 个 editor 内部工具');
}
if (PUBLIC_ROUTES.some(route => INTERNAL_TOOL_ROUTES.includes(route))) throw new Error('editor 不得进入公开路由族');

const DIR_KEYWORD = [
  [/\/portraits\//, '立绘'],
  [/\/icons\//, '徽记'],
  [/\/gallery\//, '影画'],
  [/\/mindscape\//, '影画'],
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

async function audit(url, label, kind = 'public') {
  const errs = [];
  const ext = new Set();
  const onErr = e => errs.push(e.message);
  const onReq = r => {
    const u = r.url();
    if (kind === 'internal' && u === EDITOR_AUTH_SESSION_URL) return;
    if (!/^https?:\/\/127\.0\.0\.1|^data:|^blob:|^about:/.test(u)) {
      try { ext.add(new URL(u).href); } catch (e) { ext.add(u.slice(0, 80)); }
    }
  };
  page.on('pageerror', onErr);
  page.on('request', onReq);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const r = await page.evaluate(({ DIR, ALIAS, kind }) => {
    const t = document.body.innerText;
    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
    };
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
    const isCharacterPage = kind === 'character';
    const declNodes = isCharacterPage
      ? ['#characterFooterSource', '.character-art-credit', '.footer-disclaimer']
        .map(selector => document.querySelector(selector)).filter(visible)
      : [document.querySelector('[data-source-section]'), document.querySelector('.footer-disclaimer') || document.querySelector('.d-foot')]
        .filter(visible);
    const decl = declNodes.map(element => element.innerText).join(' ');
    const boundaryText = isCharacterPage ? decl : t;
    /* 角色来源区承担影画/角色美术署名；档案数据模块的 materials 图标
       沿用既有排除，不要求在角色影画署名区重复声明。其他页面仍照常核对材料。 */
    const declaredKinds = isCharacterPage ? used.filter(k => k !== '材料') : used;
    const uncovered = declaredKinds.filter(k => (ALIAS[k] || [k]).every(a => !decl.includes(a)));
    const kindWords = DIR.map(d => d[1]);
    const stale = kindWords.filter(k =>
      !declaredKinds.includes(k) && (ALIAS[k] || [k]).some(w => decl.includes(w)));
    const art = document.querySelector('[data-character-art-source]') || document.querySelector('.d-keyart');
    const characterModules = [...document.querySelectorAll('#characterContent .character-module')];
    const persistentCharacterBoundary = ['#artSource','#characterFooterSource','[data-unofficial-boundary]']
      .map(selector => document.querySelector(selector)).filter(Boolean);
    return {
      used: declaredKinds, uncovered, stale, urls,
      unofficial: /非官方/.test(boundaryText),
      noAff: /无隶属/.test(boundaryText),
      sourceDeclared: /来源|资料源|source/i.test(boundaryText),
      copyright: /版权归米哈游/.test(boundaryText),
      characterAuthorization: !isCharacterPage || /许可|授权|官方\s*(?:gallery|wiki|百科)/i.test(decl),
      selfOfficial: (() => {
        const root = document.body.cloneNode(true);
        root.querySelectorAll(
          'a[href^="https://zenless.hoyoverse.com/"],a[href^="https://baike.mihoyo.com/"]'
        ).forEach(link => link.remove());
        return (root.innerText.match(/.{0,10}官方(?:网站|站点)/g) || [])
          .filter(h => !/非官方|不是|否认/.test(h));
      })(),
      ogOK: /非官方/.test(meta('og:title')),
      robots:meta('robots'),
      sidebarEditorControls:[...document.querySelectorAll('.site-sidebar a[href],.site-sidebar button')]
        .filter(node => /editor/i.test(`${node.getAttribute('href') || ''} ${node.textContent || ''} ${node.getAttribute('aria-label') || ''}`))
        .map(node => node.outerHTML),
      remoteImgs: [...document.querySelectorAll('img')]
        .map(i => i.currentSrc || i.src)
        .filter(s => s && !/^https?:\/\/127\.0\.0\.1|^data:|^blob:/.test(s)).length,
      character: kind === 'character' ? {
        bodyClass: document.body.className,
        artVisible: visible(art),
        artSource: art?.getAttribute('data-character-art-source') || '',
        detailVisible: visible(document.querySelector('.character-detail-page')),
        moduleNavVisible: visible(document.querySelector('.character-module-nav')),
        moduleIds: characterModules.map(module => module.id),
        visibleModuleIds: characterModules.filter(visible).map(module => module.id),
        persistentBoundaryCount: persistentCharacterBoundary.length,
        persistentBoundaryVisible: persistentCharacterBoundary.length === 3 && persistentCharacterBoundary.every(visible),
        persistentBoundaryOutsideModules: persistentCharacterBoundary.every(node => !node.closest('#characterContent .character-module')),
        detailsCount: document.querySelectorAll('.character-detail-page details').length,
        legacyFirstFoldVisible: ['.zzz-roster','.zzz-watermark','.zzz-idcard','.zzz-edge']
          .filter(selector => visible(document.querySelector(selector))),
      } : null,
    };
  }, { DIR: DIR_KEYWORD.map(([re, kw]) => [re.source, kw]), ALIAS, kind });

  page.off('pageerror', onErr);
  page.off('request', onReq);

  const key = r.used.join('+') || '(无)';
  kindStats[key] = (kindStats[key] || 0) + 1;

  if (ext.size) problems.push(`${label} 外部请求：${[...ext].join('、')}`);
  if (kind === 'internal') {
    if (!/\bnoindex\b/i.test(r.robots)) problems.push(`${label} 内部工具缺 robots=noindex`);
  } else {
    if (!r.unofficial) problems.push(`${label} 缺「非官方」`);
    if (!r.noAff) problems.push(`${label} 缺「无隶属」`);
    if (!r.sourceDeclared) problems.push(`${label} 缺不可减负的来源声明`);
    if (!r.copyright) problems.push(`${label} 缺版权归属`);
    if (r.uncovered.length) problems.push(`${label} 声明未覆盖：${r.uncovered.join('、')}（实际 ${r.used.join('、')}）`);
    if (r.stale.length) problems.push(`${label} 声明过期多出：${r.stale.join('、')}（实际 ${r.used.join('、')}）`);
    for (const h of r.selfOfficial) problems.push(`${label} 自称官方：${h.trim()}`);
    if (!r.ogOK) problems.push(`${label} og:title 不含「非官方」`);
    if (r.remoteImgs) problems.push(`${label} 非本地图片 ${r.remoteImgs} 张`);
    if (r.sidebarEditorControls.length) problems.push(`${label} 公开侧栏不得出现 editor 控件：${r.sidebarEditorControls[0]}`);
  }
  if (kind === 'character') {
    if (!r.characterAuthorization) problems.push(`${label} 可见角色来源区缺授权或官方 gallery/Wiki 说明`);
    const id = new URL(url).searchParams.get('id') || '';
    const expected = GALLERY_FALLBACK_IDS.has(id)
      ? `/assets/gallery/${id}/`
      : `/assets/mindscape/default/${id}.webp`;
    const sourceResolved = r.character?.artSource.includes(expected)
      || r.urls.some(source => `/${source.replace(/^\/+/, '')}`.includes(expected));
    if (!sourceResolved) problems.push(`${label} 未解析目标影画：${expected}`);
    if (!r.character?.artVisible) problems.push(`${label} 默认首屏影画不可见`);
    if (!r.character?.detailVisible || !r.character?.moduleNavVisible
      || JSON.stringify(r.character?.moduleIds) !== JSON.stringify(['media','lore','profile','related'])) {
      problems.push(`${label} Hero 后未保留四个稳定档案 panel DOM`);
    }
    if (r.character?.visibleModuleIds.length !== 1) {
      problems.push(`${label} 必须仅有一个活动档案 panel 可见，实际：${r.character?.visibleModuleIds.join('、') || '无'}`);
    }
    if (!r.character?.persistentBoundaryVisible || !r.character?.persistentBoundaryOutsideModules) {
      problems.push(`${label} 来源/权利与非官方边界必须位于 Tab panel 外并持续可见`);
    }
    if (r.character?.detailsCount < 1) problems.push(`${label} 缺 details 渐进披露结构`);
    if (r.character?.bodyClass.split(/\s+/).includes('character-art-view')) {
      problems.push(`${label} 仍进入旧 character-art-view 独立隐藏模式`);
    }
    if (r.character?.legacyFirstFoldVisible.length) {
      problems.push(`${label} 首屏仍显示旧三栏/名录/HUD：${r.character.legacyFirstFoldVisible.join('、')}`);
    }
  }
  if (errs.length) problems.push(`${label} JS 报错：${errs[0].slice(0, 44)}`);
  checked++;
}

for (const route of PUBLIC_ROUTES) {
  const hash = route === 'tape-wall-sample.html' ? '#store-interior' : '';
  await audit(`http://127.0.0.1:8000/${route}?cb=${Date.now()}${hash}`, `公开/${route}`, 'public');
}
for (const id of agents) {
  await audit(`http://127.0.0.1:8000/character.html?id=${id}&cb=${Date.now()}`, `角色/${id}`, 'character');
}
for (const id of factions) {
  await audit(`http://127.0.0.1:8000/faction.html?id=${id}&cb=${Date.now()}`, `阵营/${id}`, 'faction');
}
for (const route of INTERNAL_TOOL_ROUTES) {
  await audit(`http://127.0.0.1:8000/${route}?cb=${Date.now()}`, `内部/${route}`, 'internal');
}

await browser.close();

console.log('--- 全量边界核查 ---');
console.log(`已核查 ${checked} 个页面（${PUBLIC_ROUTES.length} 正式公开路由 + ${agents.length} 角色 + ${factions.length} 阵营 + ${INTERNAL_TOOL_ROUTES.length} 内部工具）`);
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
