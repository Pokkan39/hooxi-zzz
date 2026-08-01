/* 实测 Stories 舞台与 Character 首屏文字压在角色影画上的实际对比度。

   CSS 的 backgroundColor 无法代表彩色影画底色，因此本脚本先隐藏目标文字，
   再从同一位置截图取样并按 WCAG 2.1 AA 计算对比度。同时检查来源、版权、
   状态与空结果文字不会随 57 人角色主题色变化，并验证 Character 背景影画的桌面/移动铺满合同。 */
import { createReadStream, readFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

process.title = 'pw';
const { chromium } = await import('playwright');

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const contentTypes = {
  '.css':'text/css; charset=utf-8', '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.svg':'image/svg+xml', '.webp':'image/webp', '.woff2':'font/woff2',
};
const startServer = () => new Promise((resolveServer, reject) => {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
      const filePath = resolve(rootDir, pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
      if (!(filePath === rootDir || filePath.startsWith(`${rootDir}${sep}`))) throw new Error('Forbidden');
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error('Not a file');
      response.writeHead(200, {
        'cache-control':'no-store',
        'content-length':fileStat.size,
        'content-type':contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404, { 'content-type':'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    if (!address || typeof address === 'string') reject(new Error('Unable to determine static server port'));
    else resolveServer({ server, origin:`http://127.0.0.1:${address.port}` });
  });
});
const closeServer = server => new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));

const argv = process.argv.slice(2);
const explicitIds = argv.filter(argument => !argument.startsWith('--'));
const catalogRuntime = {};
new Function('window', readFileSync(resolve(rootDir, 'agent-catalog.js'), 'utf8'))(catalogRuntime);
const catalogIds = (catalogRuntime.agentCatalog?.characters || []).map(character => character?.id).filter(Boolean);
if (catalogIds.length !== 57) throw new Error(`角色目录数量变化：期望 57，实际 ${catalogIds.length}`);
const agents = explicitIds.length ? explicitIds : catalogIds;
const unknownIds = agents.filter(id => !catalogIds.includes(id));
if (unknownIds.length) throw new Error(`未知角色标识：${unknownIds.join(', ')}`);
const geometryAgentIds = new Set(explicitIds.length ? agents : ['anby', 'aria', 'remielle', 'sunna', 'norma']);
const PORTRAIT_ALPHA_OVERLAP_LIMITS = Object.freeze({ copy:.20, title:.18, identity:.18, back:.02, cta:.02 });
const PORTRAIT_ALPHA_REFERENCE = '用户批准的 Norma Hero 独立参考';
const characterKeyart = id => ({
  source:['norma','pyrois','velina'].includes(id) ? 'gallery' : 'default',
  path:{ norma:'assets/gallery/norma/05.png', pyrois:'assets/gallery/pyrois/05.png', velina:'assets/gallery/velina/06.png' }[id] || `assets/mindscape/default/${id}.webp`,
});
const CHARACTER_HERO_COVER_VIEWPORTS = Object.freeze([
  { key:'desktop', label:'桌面 1440×900', width:1440, height:900, mobile:false },
  { key:'mobile', label:'移动 390×844', width:390, height:844, mobile:true },
]);
const CHARACTER_HERO_RECT_TOLERANCE = 1;
const CHARACTER_HERO_MOBILE_RATIO_TOLERANCE = .02;
const measureCharacterHeroCover = (page, viewport) => page.evaluate(({ mobile, rectTolerance, ratioTolerance }) => {
  const art = document.querySelector('.d-keyart');
  const image = document.querySelector('.d-keyart-image');
  const portrait = document.querySelector('#characterHeroPortrait');
  const box = element => {
    const rect = element?.getBoundingClientRect();
    return rect ? { left:rect.left, right:rect.right, top:rect.top, bottom:rect.bottom, width:rect.width, height:rect.height } : null;
  };
  const artBox = box(art);
  const imageBox = box(image);
  const imageStyle = image ? getComputedStyle(image) : null;
  const portraitStyle = portrait ? getComputedStyle(portrait) : null;
  const loaded = image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
  const coverScale = loaded && artBox?.width > 0 && artBox?.height > 0
    ? Math.max(artBox.width / image.naturalWidth, artBox.height / image.naturalHeight) : 0;
  const renderedWidth = loaded ? image.naturalWidth * coverScale : 0;
  const renderedHeight = loaded ? image.naturalHeight * coverScale : 0;
  const rectDelta = artBox && imageBox ? {
    left:Math.abs(imageBox.left - artBox.left), right:Math.abs(imageBox.right - artBox.right),
    top:Math.abs(imageBox.top - artBox.top), bottom:Math.abs(imageBox.bottom - artBox.bottom),
  } : null;
  const ratio = artBox?.height > 0 ? artBox.width / artBox.height : 0;
  const expectedRatio = 16 / 9;
  const checks = {
    artExists:Boolean(art && artBox && artBox.width > 0 && artBox.height > 0),
    imageExists:Boolean(image && imageBox && imageBox.width > 0 && imageBox.height > 0),
    imageLoaded:loaded,
    objectFit:imageStyle?.objectFit === 'cover',
    transform:imageStyle?.transform === 'none',
    rectMatches:Boolean(rectDelta && Object.values(rectDelta).every(delta => delta <= rectTolerance)),
    coverWidth:renderedWidth + rectTolerance >= (artBox?.width || Infinity),
    coverHeight:renderedHeight + rectTolerance >= (artBox?.height || Infinity),
    noHorizontalOverflow:document.documentElement.scrollWidth <= innerWidth + rectTolerance
      && document.body.scrollWidth <= innerWidth + rectTolerance
      && (!artBox || (artBox.left >= -rectTolerance && artBox.right <= innerWidth + rectTolerance))
      && (!imageBox || (imageBox.left >= -rectTolerance && imageBox.right <= innerWidth + rectTolerance)),
    portraitContain:portraitStyle?.objectFit === 'contain',
    mobileRatio:!mobile || Math.abs(ratio - expectedRatio) <= ratioTolerance,
  };
  return {
    passed:Object.values(checks).every(Boolean),
    checks,
    artBox,
    imageBox,
    rectDelta,
    objectFit:imageStyle?.objectFit || '',
    transform:imageStyle?.transform || '',
    portraitObjectFit:portraitStyle?.objectFit || '',
    naturalWidth:image instanceof HTMLImageElement ? image.naturalWidth : 0,
    naturalHeight:image instanceof HTMLImageElement ? image.naturalHeight : 0,
    renderedWidth,
    renderedHeight,
    ratio,
    expectedRatio,
    scrollWidth:Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    innerWidth,
  };
}, { mobile:viewport.mobile, rectTolerance:CHARACTER_HERO_RECT_TOLERANCE, ratioTolerance:CHARACTER_HERO_MOBILE_RATIO_TOLERANCE });

const PAGE_CASES = [
  {
    key:'stories',
    route:id => `/stories.html?agent=${encodeURIComponent(id)}&contrast=1`,
    targets:[
      { selector:'.agent-file-kicker', label:'Stories 舞台元数据' },
      { selector:'#selectedAgentName', label:'Stories 舞台标题' },
      { selector:'.agent-selected-meta b, .agent-selected-meta a', label:'Stories 身份元数据', all:true },
      { selector:'#selectedAgentPrimaryLink', label:'Stories 主动作' },
    ],
  },
  {
    key:'character',
    route:id => `/character.html?id=${encodeURIComponent(id)}&contrast=1`,
    targets:[
      { selector:'#characterEnglishName:not([hidden])', label:'Character 英文名', optional:true },
      { selector:'#characterName', label:'Character 角色标题' },
      { selector:'.character-identity dd', label:'Character 身份元数据', all:true },
      { selector:'.character-identity a[href^="faction.html?id="]', label:'Character 身份锚点' },
      { selector:'.character-dossier-link[href="#dossier"]', label:'Character 档案锚点' },
    ],
  },
];

function srgb(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}
function luminance([red, green, blue]) {
  return 0.2126 * srgb(red) + 0.7152 * srgb(green) + 0.0722 * srgb(blue);
}
function contrastRatio(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function rgbKey(rgb) {
  return rgb?.length === 3 ? rgb.map(value => Math.round(value)).join(',') : '';
}

/* 代表角色 Hero 几何 helper：把同源前景图降采样到最长边 768px，以 alpha>=16
   估算可见包围盒，再映射回 object-fit 后的 CSS 坐标。它刻意不拿透明 <img>
   的整矩形判重叠；局限是包围盒无法识别人物四肢之间的透明孔洞，也不衡量视觉显著度。
   helper 独立于页面私有类名之外的布局实现，仅依赖公开 Hero 语义节点，后续可扩展样本。 */
async function openStoriesFilterDisclosure(page) {
  const disclosure = page.locator('#agentFilterDisclosure');
  if (!await disclosure.evaluate(element => element.open)) await page.locator('#agentFilterDisclosure > summary').click();
  await page.waitForFunction(() => document.querySelector('#agentFilterDisclosure')?.open && document.querySelector('#agentSearch')?.getClientRects().length);
}

const measureCharacterHeroGeometry = page => page.evaluate(() => {
  const visible = element => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && Number.parseFloat(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
  };
  const box = element => {
    const rect = element?.getBoundingClientRect();
    return rect ? { left:rect.left, right:rect.right, top:rect.top, bottom:rect.bottom, width:rect.width, height:rect.height } : null;
  };
  const overlapRatio = (first, second) => {
    if (!first || !second || second.width <= 0 || second.height <= 0) return 0;
    const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
    const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
    return (width * height) / (second.width * second.height);
  };
  const hitState = element => {
    if (!visible(element)) return { exists:Boolean(element), visible:false, passed:false, samples:[] };
    const rect = element.getBoundingClientRect();
    const samples = [[.5,.5],[.25,.5],[.75,.5],[.5,.25],[.5,.75]].map(([xRatio,yRatio]) => {
      const x = rect.left + rect.width * xRatio;
      const y = rect.top + rect.height * yRatio;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return { x, y, insideViewport:false, hit:'' };
      const hit = document.elementFromPoint(x, y);
      return {
        x, y, insideViewport:true,
        hit:hit ? `${hit.tagName.toLowerCase()}${hit.id ? `#${hit.id}` : ''}${hit.classList.length ? `.${[...hit.classList].join('.')}` : ''}` : '',
        owned:Boolean(hit && (hit === element || element.contains(hit))),
      };
    });
    const viewportSamples = samples.filter(sample => sample.insideViewport);
    return {
      exists:true,
      visible:true,
      centerOwned:Boolean(samples[0]?.insideViewport && samples[0]?.owned),
      ownedCount:viewportSamples.filter(sample => sample.owned).length,
      passed:viewportSamples.length > 0 && viewportSamples.some(sample => sample.owned),
      samples,
    };
  };
  const objectPositionFraction = value => {
    const token = String(value || '50%').trim().toLowerCase();
    if (token === 'left' || token === 'top') return 0;
    if (token === 'right' || token === 'bottom') return 1;
    if (token === 'center') return .5;
    const percentage = Number.parseFloat(token);
    return Number.isFinite(percentage) ? percentage / 100 : .5;
  };
  const hero = document.querySelector('#art, [data-character-hero]');
  const copy = document.querySelector('.character-hero-copy, [data-character-hero-copy]');
  const title = document.querySelector('#characterName');
  const identity = document.querySelector('.character-identity, [data-character-identity]');
  const back = document.querySelector('.character-back, [data-character-back]');
  const cta = document.querySelector('.character-dossier-link, [data-character-dossier-action]');
  const foreground = document.querySelector('#characterHeroPortrait, [data-character-foreground]');
  const heroBox = box(hero);
  const foregroundBox = box(foreground);
  const targets = { copy, title, identity, back, cta };
  const targetBoxes = Object.fromEntries(Object.entries(targets).map(([key, element]) => [key, box(element)]));
  const hits = Object.fromEntries(Object.entries(targets).map(([key, element]) => [key, hitState(element)]));
  const result = {
    heroVisible:visible(hero),
    foregroundVisible:visible(foreground),
    heroBox,
    foregroundBox,
    targetBoxes,
    hits,
    foregroundSource:foreground?.dataset.portraitSource || '',
    foregroundPath:foreground?.dataset.portraitPath || foreground?.getAttribute('src') || '',
    cardFallback:foreground?.dataset.portraitSource === 'card' || /角色卡图/.test(foreground?.getAttribute('alt') || ''),
    alphaAvailable:false,
    alphaRect:null,
    alphaPixelRatio:0,
    heroCoverage:0,
    overlap:{},
    limitation:'Alpha 可见包围盒是最长边 768px、阈值 16 的粗略上限；无法识别四肢间透明孔洞或视觉显著度，不表示允许文字被前景真实像素盖住。',
  };
  if (!(foreground instanceof HTMLImageElement) || !foreground.complete || foreground.naturalWidth <= 0 || !foregroundBox || !heroBox) return result;
  try {
    const scale = Math.min(1, 768 / foreground.naturalWidth, 768 / foreground.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(foreground.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(foreground.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently:true });
    context.drawImage(foreground, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1, alphaPixels = 0;
    for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) {
      if (pixels[(y * canvas.width + x) * 4 + 3] < 16) continue;
      alphaPixels += 1;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    if (maxX < minX || maxY < minY) return result;
    const style = getComputedStyle(foreground);
    const fit = style.objectFit || 'fill';
    const naturalRatio = foreground.naturalWidth / foreground.naturalHeight;
    const boxRatio = foregroundBox.width / foregroundBox.height;
    let renderedWidth = foregroundBox.width;
    let renderedHeight = foregroundBox.height;
    if (fit === 'contain' || fit === 'scale-down') {
      if (naturalRatio > boxRatio) renderedHeight = renderedWidth / naturalRatio;
      else renderedWidth = renderedHeight * naturalRatio;
    } else if (fit === 'cover') {
      if (naturalRatio > boxRatio) renderedWidth = renderedHeight * naturalRatio;
      else renderedHeight = renderedWidth / naturalRatio;
    }
    const [positionX = '50%', positionY = '50%'] = style.objectPosition.split(/\s+/);
    const renderLeft = foregroundBox.left + (foregroundBox.width - renderedWidth) * objectPositionFraction(positionX);
    const renderTop = foregroundBox.top + (foregroundBox.height - renderedHeight) * objectPositionFraction(positionY);
    const alphaRect = {
      left:renderLeft + (minX / canvas.width) * renderedWidth,
      right:renderLeft + ((maxX + 1) / canvas.width) * renderedWidth,
      top:renderTop + (minY / canvas.height) * renderedHeight,
      bottom:renderTop + ((maxY + 1) / canvas.height) * renderedHeight,
    };
    alphaRect.width = Math.max(0, alphaRect.right - alphaRect.left);
    alphaRect.height = Math.max(0, alphaRect.bottom - alphaRect.top);
    const alphaPixelRatio = alphaPixels / (canvas.width * canvas.height);
    result.alphaAvailable = true;
    result.alphaRect = alphaRect;
    result.alphaPixelRatio = alphaPixelRatio;
    result.heroCoverage = heroBox.width > 0 && heroBox.height > 0
      ? (renderedWidth * renderedHeight * alphaPixelRatio) / (heroBox.width * heroBox.height) : 0;
    result.overlap = Object.fromEntries(Object.entries(targetBoxes).map(([key, targetBox]) => [key, overlapRatio(alphaRect, targetBox)]));
    return result;
  } catch (error) {
    result.alphaError = error.message;
    return result;
  }
});

const serverHandle = await startServer();
const browser = await chromium.launch({ headless:true });
const helperContext = await browser.newContext();
const helper = await helperContext.newPage();
await helper.goto(`${serverHandle.origin}/index.html`, { waitUntil:'load' });

const rows = [];
const semanticRows = [];
const geometryRows = [];
const coverRows = [];
const problems = [];

try {
  for (const id of agents) {
    for (const pageCase of PAGE_CASES) {
      const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
      const page = await context.newPage();
      await page.goto(`${serverHandle.origin}${pageCase.route(id)}`, { waitUntil:'networkidle' });
      await page.evaluate(() => document.fonts?.ready);
      const expectedKeyart = pageCase.key === 'character' ? characterKeyart(id) : null;
      await page.waitForFunction(({ pageKey, expectedKeyart }) => {
        if (pageKey === 'stories') {
          const images = [...document.querySelectorAll('.agent-stage-art > img,.agent-stage-portrait > img')];
          return images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0);
        }
        const art = document.querySelector('.d-keyart');
        const image = art?.querySelector('.d-keyart-image');
        return art?.dataset.characterArtSource === expectedKeyart.source
          && art.dataset.characterArtPath === expectedKeyart.path
          && image instanceof HTMLImageElement
          && image.getAttribute('src') === expectedKeyart.path
          && image.complete && image.naturalWidth > 0;
      }, { pageKey:pageCase.key, expectedKeyart });

      if (pageCase.key === 'character') {
        for (const viewport of CHARACTER_HERO_COVER_VIEWPORTS) {
          await page.setViewportSize({ width:viewport.width, height:viewport.height });
          await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
          const cover = await measureCharacterHeroCover(page, viewport);
          coverRows.push({ id, viewport:viewport.key, label:viewport.label, ...cover });
          if (!cover.passed) {
            const failedChecks = Object.entries(cover.checks).filter(([, passed]) => !passed).map(([check]) => check);
            problems.push(`${id} Character Hero 背景铺满（${viewport.label}）：${failedChecks.join('/')}`
              + `；art=${cover.artBox ? `${cover.artBox.width.toFixed(1)}×${cover.artBox.height.toFixed(1)}` : 'missing'}`
              + ` image=${cover.imageBox ? `${cover.imageBox.width.toFixed(1)}×${cover.imageBox.height.toFixed(1)}` : 'missing'}`
              + ` natural=${cover.naturalWidth}×${cover.naturalHeight}`
              + ` cover=${cover.renderedWidth.toFixed(1)}×${cover.renderedHeight.toFixed(1)}`
              + ` ratio=${cover.ratio.toFixed(4)} scroll=${cover.scrollWidth}/${cover.innerWidth}`);
          }
        }
        await page.setViewportSize({ width:1440, height:900 });
        await page.waitForFunction(() => innerWidth === 1440 && innerHeight === 900);
        await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      }

      if (pageCase.key === 'character' && geometryAgentIds.has(id)) {
        const geometry = await measureCharacterHeroGeometry(page);
        const hitKeys = ['copy', 'title', 'identity', 'back', 'cta'];
        const overlapKeys = ['copy', 'title', 'identity', 'back', 'cta'];
        const hitPassed = hitKeys.every(key => geometry.hits[key]?.passed)
          && geometry.hits.back?.centerOwned && geometry.hits.cta?.centerOwned;
        const overlapPassed = geometry.alphaAvailable
          && overlapKeys.every(key => Number(geometry.overlap[key] || 0) <= PORTRAIT_ALPHA_OVERLAP_LIMITS[key]);
        const cardCoveragePassed = !geometry.cardFallback || geometry.heroCoverage <= .38;
        const passed = geometry.heroVisible && geometry.foregroundVisible && geometry.alphaAvailable
          && hitPassed && overlapPassed && cardCoveragePassed;
        geometryRows.push({ id, passed, hitPassed, overlapPassed, cardCoveragePassed, overlapLimits:PORTRAIT_ALPHA_OVERLAP_LIMITS, reference:PORTRAIT_ALPHA_REFERENCE, geometry });
        if (!passed) {
          const failedHits = hitKeys.filter(key => !geometry.hits[key]?.passed);
          const overlaps = Object.fromEntries(overlapKeys.map(key => [key, +(geometry.overlap[key] || 0).toFixed(3)]));
          problems.push(`${id} Character Hero 几何/命中：${!geometry.alphaAvailable ? `Alpha 可见范围不可测${geometry.alphaError ? `（${geometry.alphaError}）` : ''}` : ''}`
            + `${failedHits.length ? ` 命中失败 ${failedHits.join('/')}` : ''}`
            + `${!overlapPassed ? ` 前景可见包围盒粗略重叠 ${JSON.stringify(overlaps)}，上限 ${JSON.stringify(PORTRAIT_ALPHA_OVERLAP_LIMITS)}（${PORTRAIT_ALPHA_REFERENCE}；不表示允许真实像素盖字）` : ''}`
            + `${!cardCoveragePassed ? ` 卡图回退覆盖 Hero ${(geometry.heroCoverage * 100).toFixed(1)}%（上限 38%）` : ''}`);
        }
      }

      const capture = await page.evaluate(({ targets, pageKey }) => {
        const parseColor = value => {
          const channels = (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
          if (!/[a-z#(]/i.test(value.trim()) && channels.length === 3) return channels;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = '#000';
          context.fillStyle = value;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
        const visible = element => {
          if (!element) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden'
            && Number.parseFloat(style.opacity || '1') > 0
            && rect.width > 0 && rect.height > 0;
        };
        const inViewport = element => {
          const rect = element.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
        };
        const boxes = [];
        for (const target of targets) {
          const elements = target.all ? [...document.querySelectorAll(target.selector)] : [document.querySelector(target.selector)].filter(Boolean);
          if (!elements.length) {
            boxes.push({ label:target.label, selector:target.selector, missing:true, optional:Boolean(target.optional) });
            continue;
          }
          elements.forEach((element, index) => {
            const label = elements.length > 1 ? `${target.label} ${index + 1}` : target.label;
            if (!visible(element)) {
              boxes.push({ label, selector:target.selector, hidden:true });
              return;
            }
            if (!inViewport(element)) {
              boxes.push({ label, selector:target.selector, offscreen:true });
              return;
            }
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const background = (style.backgroundColor.match(/[\d.]+/g) || []).map(Number);
            const opaqueBackground = background.length >= 3 && (background.length < 4 || background[3] >= .99)
              ? background.slice(0, 3) : null;
            let translucentBackground = !opaqueBackground && background.length === 4 && background[3] > .02
              ? { rgb:background.slice(0, 3), alpha:background[3] } : null;
            if (!opaqueBackground && style.backgroundImage && style.backgroundImage !== 'none') {
              const stops = style.backgroundImage.match(/rgba?\([^)]+\)/g) || [];
              for (const stop of stops) {
                const parts = (stop.match(/[\d.]+/g) || []).map(Number);
                if (parts.length < 3) continue;
                const candidate = { rgb:parts.slice(0, 3), alpha:parts.length >= 4 ? parts[3] : 1 };
                if (!translucentBackground || candidate.alpha > translucentBackground.alpha) translucentBackground = candidate;
              }
            }
            const fontSize = Number.parseFloat(style.fontSize) || 0;
            const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
            boxes.push({
              label,
              selector:target.selector,
              rect:{ x:Math.round(rect.left), y:Math.round(rect.top), width:Math.round(rect.width), height:Math.round(rect.height) },
              color:parseColor(style.color),
              opaqueBackground,
              translucentBackground,
              fontSize,
              fontWeight,
              isLarge:fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700),
            });
          });
        }

        const themeElement = pageKey === 'stories' ? document.querySelector('.agent-workbench-shell') : document.body;
        const themeRaw = pageKey === 'stories'
          ? getComputedStyle(themeElement).getPropertyValue('--character-theme-rgb')
          : getComputedStyle(themeElement).getPropertyValue('--character-theme');
        const theme = parseColor(themeRaw);
        const semantic = [];
        const collect = (selector, label, required=true) => {
          const elements = [...document.querySelectorAll(selector)].filter(element => visible(element) && (element.innerText || '').trim());
          if (!elements.length && required) semantic.push({ label, selector, missing:true, theme });
          elements.forEach(element => semantic.push({
            label,
            selector,
            text:(element.textContent || '').replace(/\s+/g, ' ').trim(),
            color:parseColor(getComputedStyle(element).color),
            theme,
          }));
        };
        if (pageKey === 'stories') {
          collect('.archive-sources > p', 'Stories 来源文字');
          collect('.footer-disclaimer', 'Stories 版权/非官方文字');
        } else {
          collect('#artSource [data-character-art-credit]:not([hidden]) p', 'Character 来源文字');
          collect('#characterFooterSource', 'Character 版权文字');
        }
        return { boxes, semantic };
      }, { targets:pageCase.targets, pageKey:pageCase.key });

      await page.addStyleTag({
        content:`${pageCase.targets.map(target => target.selector).join(',')}{visibility:hidden!important}`,
      });
      await page.waitForTimeout(80);
      const screenshot = await page.screenshot({ type:'png' });

      if (pageCase.key === 'stories') {
        const alternate = await page.locator('#agentGrid [data-agent-id]').evaluateAll((cards, currentId) =>
          cards.find(card => card.dataset.agentId !== currentId)?.dataset.agentId || '', id);
        if (alternate) {
          await page.locator(`[data-agent-id="${alternate}"]`).click();
          await page.locator(`[data-agent-id="${id}"]`).click();
          await page.waitForFunction(agentId => document.querySelector('[data-agent-id][aria-current="true"]')?.dataset.agentId === agentId, id);
        }
        const statusSemantic = await page.evaluate(() => {
          const element = document.querySelector('.agent-selection-status');
          const parseColor = value => {
          const channels = (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
          if (!/[a-z#(]/i.test(value.trim()) && channels.length === 3) return channels;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = '#000';
          context.fillStyle = value;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
          const themeRaw = getComputedStyle(document.querySelector('.agent-workbench-shell')).getPropertyValue('--character-theme-rgb');
          return {
            label:'Stories 成功状态文字',
            selector:'.agent-selection-status',
            text:(element?.textContent || '').replace(/\s+/g, ' ').trim(),
            color:element ? parseColor(getComputedStyle(element).color) : [],
            theme:parseColor(themeRaw),
            missing:!element || !(element.textContent || '').trim(),
          };
        });
        capture.semantic.push(statusSemantic);
        await openStoriesFilterDisclosure(page);
        await page.locator('#agentSearch').fill('contrast-no-result');
        await page.waitForSelector('#agentGrid.agent-roster-empty');
        const emptySemantic = await page.evaluate(() => {
          const element = document.querySelector('#agentGrid.agent-roster-empty');
          const parseColor = value => {
          const channels = (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
          if (!/[a-z#(]/i.test(value.trim()) && channels.length === 3) return channels;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = '#000';
          context.fillStyle = value;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
          const themeRaw = getComputedStyle(document.querySelector('.agent-workbench-shell')).getPropertyValue('--character-theme-rgb');
          return {
            label:'Stories 错误/空结果文字',
            selector:'#agentGrid.agent-roster-empty',
            text:(element?.innerText || '').replace(/\s+/g, ' ').trim(),
            color:element ? parseColor(getComputedStyle(element).color) : [],
            theme:parseColor(themeRaw),
            missing:!element,
          };
        });
        capture.semantic.push(emptySemantic);
      } else {
        await page.locator('.character-module-nav a[href="#profile"]').click();
        const emptySemantic = await page.evaluate(() => {
          const parseColor = value => {
          const channels = (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
          if (!/[a-z#(]/i.test(value.trim()) && channels.length === 3) return channels;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = '#000';
          context.fillStyle = value;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
          const theme = parseColor(getComputedStyle(document.body).getPropertyValue('--character-theme'));
          const elements = [...document.querySelectorAll('#profile .character-empty')].filter(element => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden'
              && Number.parseFloat(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0
              && (element.textContent || '').trim();
          });
          if (!elements.length) return [{ label:'Character 空状态文字', selector:'#profile .character-empty', missing:true, theme }];
          return elements.map(element => ({
            label:'Character 空状态文字',
            selector:'#profile .character-empty',
            text:(element.textContent || '').replace(/\s+/g, ' ').trim(),
            color:parseColor(getComputedStyle(element).color),
            theme,
          }));
        });
        capture.semantic.push(...emptySemantic);
      }
      await context.close();

      const sampled = await helper.evaluate(async ({ screenshotBase64, boxes }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${screenshotBase64}`;
        await new Promise(resolveImage => { image.onload = resolveImage; image.onerror = resolveImage; });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return boxes.map(box => {
          if (!box.rect || box.opaqueBackground) return { ...box, background:box.opaqueBackground || null };
          const x = Math.max(0, box.rect.x);
          const y = Math.max(0, box.rect.y);
          const width = Math.min(box.rect.width, canvas.width - x);
          const height = Math.min(box.rect.height, canvas.height - y);
          if (width < 1 || height < 1) return { ...box, offscreen:true };
          const pixels = context.getImageData(x, y, width, height).data;
          let red = 0, green = 0, blue = 0, count = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            red += pixels[index]; green += pixels[index + 1]; blue += pixels[index + 2]; count += 1;
          }
          let background = [Math.round(red / count), Math.round(green / count), Math.round(blue / count)];
          if (box.translucentBackground) {
            const alpha = box.translucentBackground.alpha;
            background = background.map((channel, index) => Math.round(box.translucentBackground.rgb[index] * alpha + channel * (1 - alpha)));
          }
          return { ...box, background };
        });
      }, { screenshotBase64:screenshot.toString('base64'), boxes:capture.boxes });

      for (const sample of sampled) {
        if (sample.missing || sample.hidden || sample.offscreen || !sample.background || sample.color?.length !== 3) {
          const optionalMissing = sample.optional && sample.missing;
          const note = optionalMissing ? '可选字段缺失，节点合法隐藏' : sample.missing ? '元素不存在' : sample.hidden ? '元素已隐藏' : '元素不在真实首屏截图范围内';
          rows.push({ id, page:pageCase.key, label:sample.label, note, optionalMissing:Boolean(optionalMissing) });
          if (!optionalMissing) problems.push(`${id} ${sample.label}：${note}`);
          continue;
        }
        const measured = contrastRatio(sample.color, sample.background);
        const required = sample.isLarge ? 3 : 4.5;
        const passed = measured >= required;
        rows.push({ id, page:pageCase.key, label:sample.label, ratio:+measured.toFixed(2), required, passed });
        if (!passed) problems.push(`${id} ${sample.label}：对比度 ${measured.toFixed(2)}:1，未达 ${required}:1`);
      }

      for (const semantic of capture.semantic) {
        const color = rgbKey(semantic.color);
        const theme = rgbKey(semantic.theme);
        const passed = !semantic.missing && color && theme && color !== theme;
        semanticRows.push({ id, page:pageCase.key, label:semantic.label, color, theme, passed });
        if (!passed) problems.push(`${id} ${semantic.label}：${semantic.missing ? '真实文字元素不存在' : `文字色 rgb(${color}) 被角色主题色 rgb(${theme}) 污染`}`);
      }
    }
  }

  const expectedCoverRows = agents.length * CHARACTER_HERO_COVER_VIEWPORTS.length;
  if (coverRows.length !== expectedCoverRows) {
    problems.push(`Character Hero 背景铺满合同视口数量：期望 ${expectedCoverRows}，实际 ${coverRows.length}`);
  }

  if (agents.length === 57) {
    const semanticColors = new Map();
    for (const row of semanticRows) {
      if (!semanticColors.has(row.label)) semanticColors.set(row.label, new Set());
      if (row.color) semanticColors.get(row.label).add(row.color);
    }
    for (const [label, colors] of semanticColors) {
      if (colors.size !== 1) problems.push(`${label}：57 人主题下出现 ${colors.size} 种文字色（${[...colors].join(' / ')}），未保持语义色隔离`);
    }
  }
} catch (error) {
  problems.push(`检查运行中止：${error.message}`);
} finally {
  await helperContext.close();
  await browser.close();
  await closeServer(serverHandle.server);
}

console.log('--- Stories / Character 首屏文字对比度（WCAG 2.1 AA）---');
console.log(`已检查 ${agents.length} 个角色，${rows.length} 个真实可见对比度样本，${semanticRows.length} 个语义色样本`);
console.log(`Character Hero 背景铺满合同：${coverRows.filter(row => row.passed).length}/${coverRows.length} 通过（${agents.length}×2 视口：1440×900 + 390×844）`);
console.log(`Hero 几何/命中代表样本 ${geometryRows.length} 个：${geometryRows.map(row => `${row.id}:${row.passed ? 'PASS' : 'FAIL'}`).join('、') || '无'}`);
if (geometryRows.length) {
  console.log(`  Alpha 粗略重叠上限：${JSON.stringify(PORTRAIT_ALPHA_OVERLAP_LIMITS)}（${PORTRAIT_ALPHA_REFERENCE}）`);
  console.log(`  局限：${geometryRows[0].geometry.limitation}`);
}
const byLabel = {};
for (const row of rows) {
  if (row.note) continue;
  const summary = byLabel[row.label] || (byLabel[row.label] = { minimum:Infinity, minimumId:'', failed:0, total:0 });
  summary.total += 1;
  if (!row.passed) summary.failed += 1;
  if (row.ratio < summary.minimum) { summary.minimum = row.ratio; summary.minimumId = row.id; }
}
for (const [label, summary] of Object.entries(byLabel)) {
  console.log(`  ${label.padEnd(24)} 最低 ${String(summary.minimum).padStart(6)}:1（${summary.minimumId}）  未达标 ${summary.failed}/${summary.total}`);
}
if (problems.length) {
  console.log('\n未达标项：');
  problems.forEach(problem => console.log('  x', problem));
  console.log(`\nFAIL: ${problems.length} 项`);
  process.exitCode = 1;
} else {
  console.log(`\nPASS: ${agents.length} 人 Stories / Character 首屏文字均达 AA，语义色保持隔离`);
}
