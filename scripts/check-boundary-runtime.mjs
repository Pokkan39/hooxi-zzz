/* ============================================================
   非官方边界门禁 — 运行时补充
   静态门禁 check-unofficial-boundary.mjs 读不到 JS 渲染的内容，
   这是它已知的失效面：运行时注入的热链、自称官方文案、
   缺失的版权声明都能绕过。本脚本在真实浏览器里复验。

   检查项（渲染完成后）：
   1. 9 个正式公开路由与 editor 内部工具分族，PLAY 保持独立页面族
   2. 零外部域名请求（热链官方服务器）
   3. 公开页正文含「非官方」「无隶属」、来源与「版权归米哈游」
   4. 渲染后不得出现自称官方网站 / 官方站点
   5. og:title 与 twitter:title 含「非官方」（含 JS 动态更新的）
   6. 官方美术类图片全部本地托管
   7. 角色页默认/#art 均保留 Hero、四个 DOM panel、单活动 panel 与 Tab 外持续可见边界；首页仅保留页码和暂停

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
const PUBLIC_TARGETS = [
  { path:'index.html', family:'archive', route:'index.html' },
  { path:'mainline.html', family:'archive', route:'mainline.html' },
  { path:'stories.html?agent=anby', family:'archive', route:'stories.html' },
  { path:'character.html?id=anby', family:'archive', route:'character.html', character:'anby' },
  { path:'faction.html?id=cunning-hares', family:'archive', route:'faction.html' },
  { path:'events.html', family:'archive', route:'events.html' },
  { path:'behind-scenes.html', family:'archive', route:'behind-scenes.html' },
  { path:'cultivate.html', family:'archive', route:'cultivate.html' },
  { path:'tape-wall-sample.html#store-interior', family:'play', route:'tape-wall-sample.html' },
];
const COMPATIBILITY_TARGETS = [
  { path:'character.html?id=anby#art', family:'archive', route:'character.html', character:'anby', artAnchor:true },
  { path:'character.html?id=norma', family:'archive', route:'character.html', character:'norma', galleryFallback:true },
];
const INTERNAL_TARGETS = [
  { path:'editor.html', family:'internal', route:'editor.html' },
];
const TARGETS = [...PUBLIC_TARGETS, ...COMPATIBILITY_TARGETS, ...INTERNAL_TARGETS];
const EDITOR_AUTH_SESSION_URL = 'http://localhost:3001/api/auth/session';

const problems = [];
const notes = [];

const browser = await chromium.launch();
try {
  for (const targetSpec of TARGETS) {
    const { path, family } = targetSpec;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const external = new Set();
    const pageErrors = [];
    page.on('request', r => {
      const u = r.url();
      if (family === 'internal' && targetSpec.route === 'editor.html' && u === EDITOR_AUTH_SESSION_URL) return;
      if (!/^https?:\/\/127\.0\.0\.1|^data:|^blob:|^about:/.test(u)) {
        try { external.add(new URL(u).href); } catch (e) { external.add(u.slice(0, 80)); }
      }
    });
    page.on('pageerror', e => pageErrors.push(e.message));

    const target = new URL(path, BASE);
    target.searchParams.set('cb', String(Date.now()));
    await page.goto(target.href, { waitUntil: 'load' });
    await page.waitForTimeout(2400);

    const r = await page.evaluate(({ family }) => {
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
      const selfClaimRoot = document.body.cloneNode(true);
      selfClaimRoot.querySelectorAll(
        'a[href^="https://zenless.hoyoverse.com/"],a[href^="https://baike.mihoyo.com/"]'
      ).forEach(link => link.remove());
      const selfOfficial = (selfClaimRoot.innerText.match(/.{0,10}官方(?:网站|站点)/g) || [])
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
        [/\/mindscape\//, '影画'],
        [/\/covers\//, '封面'],
        [/\/materials\//, '材料'],
        [/\/wiki\//, '截图']
      ];
      const isCharacterPage = document.body.classList.contains('archive-character');
      const declNodes = isCharacterPage
        ? ['#characterFooterSource', '.character-art-credit', '.footer-disclaimer']
          .map(selector => document.querySelector(selector)).filter(visible)
        : [document.querySelector('[data-source-section]'), document.querySelector('.footer-disclaimer') || document.querySelector('.d-foot')]
          .filter(visible);
      const decl = declNodes.map(element => element.innerText).join(' ');
      const boundaryText = isCharacterPage ? decl : t;
      /* 同时统计 img 与 CSS 背景图：角色页的影画是背景层而不是 img，
         只扫 img 会漏掉它。 */
      const bgUrls = [];
      document.querySelectorAll('*').forEach(el => {
        const b = getComputedStyle(el).backgroundImage;
        if (b && b !== 'none' && b.includes('assets/')) {
          const m = b.match(/assets\/[^"')]+/g);
          if (m) bgUrls.push(...m);
        }
      });
      const imgUrls = [...document.querySelectorAll('img')]
        .map(i => i.getAttribute('src') || '');
      const allUrls = imgUrls.concat(bgUrls);

      const usedKinds = [];
      for (const [re, kw] of DIR_KEYWORD) {
        if (allUrls.some(u => re.test('/' + u.replace(/^\/+/, '')))) usedKinds.push(kw);
      }
      /* 活动页的 wiki 图在声明里写作「活动图」，培养页写「养成图」，
         都属于截图类的合法别名。 */
      const ALIAS = { '截图': ['截图', '活动图', '养成图', '封面'] };
      /* 角色来源区承担影画/角色美术署名；档案数据模块的 materials 图标
         沿用既有排除，不要求在角色影画署名区重复声明。其他页面仍照常核对材料。 */
      const declaredKinds = isCharacterPage ? usedKinds.filter(k => k !== '材料') : usedKinds;
      const uncovered = declaredKinds.filter(k => {
        const accept = ALIAS[k] || [k];
        return !accept.some(a => decl.includes(a));
      });

      /* 反向检查：声明里提到但页面上实际没有的素材类型。
         版权声明写着页面上不存在的官方素材，属于不准确陈述，也说明
         改版后忘了更新声明。两个门禁此前都只查「缺少」查不出「多余」。
         别名词只在其父类型缺席时才算过期，避免把「活动图」误判。 */
      const KIND_WORDS = DIR_KEYWORD.map(([, kw]) => kw);
      const stale = KIND_WORDS.filter(k => {
        if (declaredKinds.includes(k)) return false;
        const words = ALIAS[k] || [k];
        return words.some(w => decl.includes(w));
      });

      const art = document.querySelector('[data-character-art-source]') || document.querySelector('.d-keyart');
      const characterModules = [...document.querySelectorAll('#characterContent .character-module')];
      const persistentCharacterBoundary = ['#artSource','#characterFooterSource','[data-unofficial-boundary]']
        .map(selector => document.querySelector(selector)).filter(Boolean);
      const pause = document.querySelector('#heroCarouselPause');
      const pauseBox = pause?.getBoundingClientRect();
      return {
        family,
        unofficial: /非官方/.test(boundaryText),
        noAffiliation: /无隶属/.test(boundaryText),
        sourceDeclared: /来源|资料源|source/i.test(boundaryText),
        copyright: /版权归米哈游/.test(boundaryText),
        characterAuthorization: !isCharacterPage || /许可|授权|官方\s*gallery/i.test(decl),
        selfOfficial,
        usedKinds: declaredKinds,
        allUrls,
        uncovered,
        stale,
        declText: decl.slice(0, 90),
        ogTitle: meta('og:title'),
        twTitle: meta('twitter:title'),
        robots: meta('robots'),
        remoteImgs: remoteImgs.slice(0, 3),
        remoteImgCount: remoteImgs.length,
        playFamily: document.body.classList.contains('tape-wall-page') && /hooxi play/i.test(t),
        sidebarEditorControls:[...document.querySelectorAll('.site-sidebar a[href],.site-sidebar button')]
          .filter(node => /editor/i.test(`${node.getAttribute('href') || ''} ${node.textContent || ''} ${node.getAttribute('aria-label') || ''}`))
          .map(node => node.outerHTML),
        character: art ? {
          hash: location.hash,
          bodyClass: document.body.className,
          artVisible: visible(art),
          artSource: art.getAttribute('data-character-art-source') || '',
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
        home: location.pathname.endsWith('/index.html') ? {
          slideCount: document.querySelectorAll('#heroCarouselTrack [data-hero-slide]').length,
          indexCount: document.querySelectorAll('#heroCarouselIndex').length,
          pauseCount: document.querySelectorAll('#heroCarouselPause').length,
          pauseTarget: pauseBox ? { width:pauseBox.width, height:pauseBox.height } : null,
          legacyControlCount: document.querySelectorAll('#heroCarouselPrev,#heroCarouselNext,#heroCarouselDots,.hero-carousel-dot').length,
          laneJumpCount: document.querySelectorAll('.home-lane-jump').length,
          laneMoreCount: document.querySelectorAll('.home-lane-card.more').length,
        } : null,
      };
    }, { family });

    const name = `${targetSpec.route}${targetSpec.character ? `[${targetSpec.character}]` : ''}${targetSpec.artAnchor ? '#art' : ''}`;
    if (external.size) problems.push(`${name} 运行时请求了外部域名：${[...external].join('、')}`);
    if (family === 'internal') {
      if (!/\bnoindex\b/i.test(r.robots)) problems.push(`${name} 内部工具缺 robots=noindex`);
    } else {
      if (!r.unofficial) problems.push(`${name} 渲染后缺「非官方」表述`);
      if (!r.noAffiliation) problems.push(`${name} 渲染后缺「无隶属」表述`);
      if (!r.sourceDeclared) problems.push(`${name} 渲染后缺不可减负的来源声明`);
      if (!r.copyright) problems.push(`${name} 渲染后缺版权归属声明`);
      for (const h of r.selfOfficial) problems.push(`${name} 渲染后自称官方：「${h.trim()}」`);
      if (r.uncovered.length)
        problems.push(`${name} 页面实际使用了 ${r.uncovered.join('、')} 类官方素材，`
          + `但页脚声明未覆盖（现声明：${r.declText.slice(0, 46)}…）`);
      if (r.stale.length)
        problems.push(`${name} 页脚声明提到 ${r.stale.join('、')}，但页面上已无此类素材，`
          + `声明过期需更新（实际使用：${r.usedKinds.join('、') || '无'}）`);
      if (!/非官方/.test(r.ogTitle)) problems.push(`${name} og:title 不含「非官方」：「${r.ogTitle}」`);
      if (!/非官方/.test(r.twTitle)) problems.push(`${name} twitter:title 不含「非官方」`);
      if (family === 'play' && !r.playFamily) problems.push(`${name} 未保持独立 HOOXI PLAY 页面族`);
      if (r.sidebarEditorControls.length) problems.push(`${name} 公开侧栏不得出现 editor 控件：${r.sidebarEditorControls[0]}`);
    }
    if (r.remoteImgCount) problems.push(`${name} 图片非本地托管 ${r.remoteImgCount} 张：${r.remoteImgs.join('、')}`);

    if (targetSpec.character) {
      if (!r.characterAuthorization) problems.push(`${name} 可见角色来源区缺授权或官方 gallery 说明`);
      const expected = targetSpec.galleryFallback
        ? `/assets/gallery/${targetSpec.character}/`
        : `/assets/mindscape/default/${targetSpec.character}.webp`;
      const sourceResolved = r.character?.artSource.includes(expected)
        || r.allUrls.some(source => `/${source.replace(/^\/+/, '')}`.includes(expected));
      if (!sourceResolved) problems.push(`${name} 未解析目标影画：${expected}`);
      if (!r.character?.artVisible) problems.push(`${name} 默认首屏影画不可见`);
      if (!r.character?.detailVisible || !r.character?.moduleNavVisible
        || JSON.stringify(r.character?.moduleIds) !== JSON.stringify(['media','lore','profile','related'])) {
        problems.push(`${name} Hero 后未保留四个稳定档案 panel DOM`);
      }
      if (r.character?.visibleModuleIds.length !== 1) {
        problems.push(`${name} 必须仅有一个活动档案 panel 可见，实际：${r.character?.visibleModuleIds.join('、') || '无'}`);
      }
      if (!r.character?.persistentBoundaryVisible || !r.character?.persistentBoundaryOutsideModules) {
        problems.push(`${name} 来源/权利与非官方边界必须位于 Tab panel 外并持续可见`);
      }
      if (r.character?.detailsCount < 1) problems.push(`${name} 缺 details 渐进披露结构`);
      if (r.character?.bodyClass.split(/\s+/).includes('character-art-view')) {
        problems.push(`${name} 仍进入旧 character-art-view 独立隐藏模式`);
      }
      if (r.character?.legacyFirstFoldVisible.length) {
        problems.push(`${name} 首屏仍显示旧三栏/名录/HUD：${r.character.legacyFirstFoldVisible.join('、')}`);
      }
      if (targetSpec.artAnchor && r.character?.hash !== '#art') problems.push(`${name} 未保留 #art 兼容锚点`);
    }

    if (r.home) {
      const homePassed = r.home.slideCount === 4
        && r.home.indexCount === 1
        && r.home.pauseCount === 1
        && r.home.pauseTarget?.width >= 44
        && r.home.pauseTarget?.height >= 44
        && r.home.legacyControlCount === 0
        && r.home.laneJumpCount === 0
        && r.home.laneMoreCount === 0;
      if (!homePassed) problems.push(`${name} 首页未满足 4 片源、仅页码+暂停、无旧控件/旧 lane 结构合同`);
    }

    if (pageErrors.length) problems.push(`${name} JS 报错：${pageErrors[0].slice(0, 50)}`);

    if (!problems.some(p => p.startsWith(name)))
      notes.push(`${name} 通过（族：${family}）`);

    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log('--- 非官方边界运行时检查 ---');
console.log(`  · 已渲染 ${TARGETS.length} 个目标（9 个正式公开路由 + 2 个角色兼容样本 + 1 个内部工具）`);
notes.slice(0, 2).forEach(n => console.log('  ·', n));
if (notes.length > 2) console.log(`  · …其余 ${notes.length - 2} 页同样通过`);

if (problems.length) {
  console.log('\n发现问题：');
  problems.forEach(p => console.log('  x', p));
  console.log(`\nFAIL: ${problems.length} 项`);
  process.exit(1);
}
console.log('\nPASS: 渲染后身份、版权、分享卡标识、零热链均成立');
