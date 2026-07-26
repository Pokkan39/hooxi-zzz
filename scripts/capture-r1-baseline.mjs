import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/* 同 regression.mjs：Windows + MSYS2 下 playwright-core 加载时设置
   process.title 会触发 libuv 断言而崩溃，需先占位短 title。
   静态 import 会被提升，必须用动态 import。 */
process.title = 'pw';
const { chromium } = await import('playwright');

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
const outputDir = resolve(rootDir, process.env.HOOXI_UI_OUTPUT_DIR || `artifacts/r1-baseline-${stamp}`);

const routes = [
  { name: 'index', path: '/index.html' },
  { name: 'mainline', path: '/mainline.html' },
  { name: 'stories-anby', path: '/stories.html?agent=anby' },
  { name: 'character-anby', path: '/character.html?id=anby' },
  { name: 'faction-cunning-hares', path: '/faction.html?id=cunning-hares' },
  { name: 'events', path: '/events.html' },
  { name: 'behind-scenes', path: '/behind-scenes.html' },
  { name: 'editor', path: '/editor.html' },
];

const publicRouteNames = new Set(routes.filter((route) => route.name !== 'editor').map((route) => route.name));

const variants = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' },
  { name: 'reduced-motion-desktop', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
];

const homeReleaseVariants = [
  { name: 'home-320', viewport: { width: 320, height: 720 }, reducedMotion: 'no-preference' },
  { name: 'home-375', viewport: { width: 375, height: 812 }, reducedMotion: 'no-preference' },
  { name: 'home-390', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' },
  { name: 'home-414', viewport: { width: 414, height: 896 }, reducedMotion: 'no-preference' },
  { name: 'home-768', viewport: { width: 768, height: 900 }, reducedMotion: 'no-preference' },
  { name: 'home-1280x800', viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' },
  { name: 'home-1440x900', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
  { name: 'home-390-reduced-motion', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
  { name: 'home-desktop-reduced-motion', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
];

const homeScreeningVariants = [
  { name: '1440x900', fullName: 'home-wide', viewport: { width: 1440, height: 900 } },
  { name: '768x1024', fullName: 'home-tablet', viewport: { width: 768, height: 1024 } },
  { name: '390x844', fullName: 'home-mobile', viewport: { width: 390, height: 844 } },
];

const homeReducedVariants = [
  { name: 'home-reduced-wide', viewport: { width: 1440, height: 900 } },
  { name: 'home-reduced-mobile', viewport: { width: 390, height: 844 } },
];

const homeActs = [
  { value: '00', file: '00-prologue', label: '序幕·今晚放映' },
  { value: '01', file: '01-select', label: '第一幕·选片' },
  { value: '02', file: '02-cast', label: '第二幕·演员表' },
  { value: '03', file: '03-mainline', label: '第三幕·正片' },
  { value: '04', file: '04-events', label: '第四幕·加映' },
  { value: '05', file: '05-behind', label: '第五幕·片后谈' },
  { value: '06', file: '06-credits', label: '片尾·关于档案' },
];

const mainlineOfficialMedia = [
  { cover: 'assets/covers/official/bilibili/zzz-launch-pv.webp', video: 'https://www.bilibili.com/video/BV1vy411B7cd' },
  { cover: 'assets/covers/official/bilibili/zzz-worldview-pv.webp', video: 'https://www.bilibili.com/video/BV1GE4m1R7k5' },
];

const imageReadinessTimeoutMs = 4_000;

const deepLinkChecks = [
  {
    name: 'mainline-lane-stories',
    path: '/mainline.html?lane=stories',
    verify: () => ({
      passed: document.querySelector('.hero-copy-panel h1')?.textContent.includes('角色剧情')
        && Number(document.querySelector('#pageCount')?.textContent) === window.archiveData.stories.length,
      detail: {
        heading: document.querySelector('.hero-copy-panel h1')?.textContent.trim() ?? '',
        pageCount: document.querySelector('#pageCount')?.textContent ?? '',
      },
    }),
  },
  {
    name: 'stories-agent-anby',
    path: '/stories.html?agent=anby',
    verify: () => ({
      passed: document.querySelector('[data-agent-id="anby"]')?.classList.contains('is-selected')
        && document.querySelector('#selectedAgentName')?.textContent.includes('安比'),
      detail: {
        selectedId: document.querySelector('.is-selected[data-agent-id]')?.dataset.agentId ?? '',
        selectedName: document.querySelector('#selectedAgentName')?.textContent.trim() ?? '',
      },
    }),
  },
  {
    name: 'stories-query-anby',
    path: '/stories.html?q=%E5%AE%89%E6%AF%94',
    verify: () => {
      const visibleIds = [...document.querySelectorAll('[data-agent-id]')].map((node) => node.dataset.agentId);
      return {
        passed: document.querySelector('#agentSearch')?.value === '安比'
          && visibleIds.length > 0
          && visibleIds.length < window.archiveData.characters.length,
        detail: { query: document.querySelector('#agentSearch')?.value ?? '', visibleIds },
      };
    },
  },
  {
    name: 'stories-faction-cunning-hares',
    path: '/stories.html?faction=cunning-hares',
    verify: () => {
      const actual = [...document.querySelectorAll('[data-agent-id]')].map((node) => node.dataset.agentId).sort();
      const expected = window.archiveData.characters
        .filter((character) => character.factionId === 'cunning-hares')
        .map((character) => character.id)
        .sort();
      return {
        passed: document.querySelector('#factionFilter')?.value === 'cunning-hares'
          && JSON.stringify(actual) === JSON.stringify(expected),
        detail: { faction: document.querySelector('#factionFilter')?.value ?? '', actual, expected },
      };
    },
  },
  {
    name: 'stories-agent-search-hash',
    path: '/stories.html#agentSearch',
    verify: () => ({
      passed: location.hash === '#agentSearch' && document.querySelector('#agentSearch') instanceof HTMLInputElement,
      detail: { hash: location.hash, targetExists: Boolean(document.querySelector('#agentSearch')) },
    }),
  },
  {
    name: 'character-id-anby-profile',
    path: '/character.html?id=anby#profile',
    verify: () => {
      const dataCell = document.querySelector('.character-data-grid > div');
      const dataValue = dataCell?.querySelector('b');
      const prose = document.querySelector('.character-wiki-block p');
      const rgb = (value) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = (value) => {
        const [red = 0, green = 0, blue = 0] = rgb(value).map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return red * 0.2126 + green * 0.7152 + blue * 0.0722;
      };
      const cellStyle = dataCell ? getComputedStyle(dataCell) : null;
      const valueStyle = dataValue ? getComputedStyle(dataValue) : null;
      const proseStyle = prose ? getComputedStyle(prose) : null;
      const proseRect = prose?.getBoundingClientRect();
      const proseVisible = Boolean(prose && proseRect?.width && proseRect?.height
        && proseStyle?.visibility !== 'hidden' && Number(proseStyle?.opacity ?? 0) > 0);
      const surfaceReadable = Boolean(cellStyle && valueStyle
        && luminance(cellStyle.backgroundColor) < 0.35
        && luminance(valueStyle.color) > 0.55);
      return {
        passed: document.querySelector('#characterName')?.textContent.includes('安比')
          && document.querySelector('#characterStageStatus')?.textContent === 'PROFILE'
          && surfaceReadable
          && proseVisible,
        detail: {
          characterName: document.querySelector('#characterName')?.textContent.trim() ?? '',
          stage: document.querySelector('#characterStageStatus')?.textContent ?? '',
          dataCellBackground: cellStyle?.backgroundColor ?? '',
          dataValueColor: valueStyle?.color ?? '',
          surfaceReadable,
          proseVisible,
          proseFontSize: proseStyle?.fontSize ?? '',
        },
      };
    },
  },
  {
    name: 'character-anby-growth-content',
    path: '/character.html?id=anby#story',
    verify: async () => {
      const tabs = [...document.querySelectorAll('[data-growth-stage]')];
      const initialMaterials = document.querySelectorAll('[data-growth-panel="0"] .character-growth-material').length;
      tabs[0]?.focus();
      tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const afterArrow = document.activeElement;
      afterArrow?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      const active = document.querySelector('[data-growth-stage].is-active');
      const visiblePanel = document.querySelector('[data-growth-panel]:not([hidden])');
      const idsUnique = new Set(tabs.flatMap(tab => [tab.id, tab.getAttribute('aria-controls')])).size === tabs.length * 2;
      const ariaLinked = tabs.every(tab => {
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        return panel?.getAttribute('aria-labelledby') === tab.id;
      });
      return {
        passed: tabs.length === 8
          && initialMaterials > 0
          && afterArrow === tabs[1]
          && tabs.filter(tab => tab.tabIndex === 0).length === 1
          && active?.textContent.trim() === '满级'
          && document.activeElement === tabs.at(-1)
          && active?.getAttribute('aria-selected') === 'true'
          && idsUnique
          && ariaLinked
          && visiblePanel?.dataset.growthPanel === '7'
          && visiblePanel.querySelectorAll('.character-growth-material').length > 0,
        detail: { tabs: tabs.map(tab => ({ text: tab.textContent.trim(), id: tab.id, controls: tab.getAttribute('aria-controls'), tabindex: tab.tabIndex })), initialMaterials, afterArrow: afterArrow?.textContent.trim() ?? '', active: active?.textContent.trim() ?? '', focused: document.activeElement?.textContent.trim() ?? '', idsUnique, ariaLinked, visiblePanel: visiblePanel?.dataset.growthPanel ?? '' },
      };
    },
  },
  {
    name: 'character-growth-alias',
    path: '/character.html?id=anby#growth',
    verify: () => ({
      passed: document.querySelector('#characterStageStatus')?.textContent === 'STORY'
        && location.hash === '#story',
      detail: { finalHash: location.hash, stage: document.querySelector('#characterStageStatus')?.textContent ?? '' },
    }),
  },
  {
    name: 'faction-id-cunning-hares',
    path: '/faction.html?id=cunning-hares',
    verify: () => ({
      passed: document.querySelector('#factionName')?.textContent.includes('狡兔屋')
        && Number(document.querySelector('#memberCount')?.textContent) > 0,
      detail: {
        factionName: document.querySelector('#factionName')?.textContent.trim() ?? '',
        memberCount: document.querySelector('#memberCount')?.textContent ?? '',
      },
    }),
  },
];

const contentTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(requestUrl.pathname);
      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const filePath = resolve(rootDir, relativePath);
      const insideRoot = filePath === rootDir || filePath.startsWith(`${rootDir}${sep}`);

      if (!insideRoot) {
        response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Forbidden');
        return;
      }

      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        throw new Error('Not a file');
      }

      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-length': fileStat.size,
        'content-type': contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine static server port'));
        return;
      }
      resolveServer({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

function closeServer(server) {
  return new Promise((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
}

function serializeError(error) {
  return error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { name: 'Error', message: String(error) };
}

function sameGeometryMatrix(first, second, tolerance = 1e-6) {
  return Boolean(first?.matrix && second?.matrix)
    && first.matrix.length === second.matrix.length
    && first.matrix.every((value, index) => Math.abs(value - second.matrix[index]) <= tolerance);
}

function sameGeometryRotate(first, second, tolerance = 1e-6) {
  return Number.isFinite(first?.degrees)
    && Number.isFinite(second?.degrees)
    && Math.abs(first.degrees - second.degrees) <= tolerance;
}

async function waitForScreeningImages(page, targetSelector = '') {
  return page.evaluate(async ({ targetSelector, timeoutMs }) => {
    const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
    const fontState = document.fonts?.ready
      ? await Promise.race([
        document.fonts.ready.then(() => 'ready'),
        delay(timeoutMs).then(() => 'timeout'),
      ])
      : 'unsupported';
    const images = [...document.images];
    const selected = images.filter((image) => {
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      const hasLayout = rect.width > 0 && rect.height > 0;
      const rendered = hasLayout
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) > 0;
      const inViewport = rendered
        && rect.bottom > 0
        && rect.right > 0
        && rect.top < innerHeight
        && rect.left < innerWidth;
      return inViewport || Boolean(targetSelector && image.matches(targetSelector));
    });
    const waitForImage = (image) => new Promise((resolveImage) => {
      const describe = (status) => ({
        status,
        src: image.getAttribute('src') ?? '',
        currentSrc: image.currentSrc,
        loading: image.loading,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      if (image.complete) {
        resolveImage(describe(image.naturalWidth > 0 ? 'loaded' : 'error'));
        return;
      }
      let timer;
      const finish = (status) => {
        clearTimeout(timer);
        image.removeEventListener('load', onLoad);
        image.removeEventListener('error', onError);
        resolveImage(describe(status));
      };
      const onLoad = () => finish('loaded');
      const onError = () => finish('error');
      image.addEventListener('load', onLoad, { once: true });
      image.addEventListener('error', onError, { once: true });
      timer = setTimeout(() => finish('timeout'), timeoutMs);
    });
    const results = await Promise.all(selected.map(waitForImage));
    return {
      targetSelector,
      timeoutMs,
      fontState,
      totalImages: images.length,
      selectedImages: selected.length,
      skippedImages: images.length - selected.length,
      loadedImages: results.filter((entry) => entry.status === 'loaded').length,
      erroredImages: results.filter((entry) => entry.status === 'error').length,
      timedOutImages: results.filter((entry) => entry.status === 'timeout').length,
      results,
    };
  }, { targetSelector, timeoutMs: imageReadinessTimeoutMs });
}

async function waitForHomeScreeningReadiness(page) {
  await page.waitForFunction((expectedActs) => {
    const acts = [...document.querySelectorAll('[data-home-act]')];
    const dynamicHostsReady = [
      ['homeModules', 3],
      ['homeSecondaryRail', 1],
      ['homeAgentRail', 2],
      ['homeLaneMainline', 2],
      ['homeLaneEvents', 2],
      ['homeLaneBehind', 2],
    ].every(([id, minimum]) => (document.getElementById(id)?.children.length ?? 0) >= minimum);
    return acts.map((node) => node.dataset.homeAct).join(',') === expectedActs.join(',')
      && document.querySelectorAll('main').length === 1
      && dynamicHostsReady;
  }, homeActs.map((act) => act.value), { timeout: 12_000 });
  const readiness = await waitForScreeningImages(page, '#heroStarImg');
  await page.waitForTimeout(1_100);
  return readiness;
}

async function primeDeepLazyImages(page) {
  const segmentScrollTops = await page.evaluate(() => {
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    return [...new Set([.22, .47, .72, 1].map((fraction) => Math.round(maximum * fraction)))];
  });
  for (const scrollTop of segmentScrollTops) {
    await page.evaluate((top) => {
      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, top);
      root.style.scrollBehavior = previousBehavior;
    }, scrollTop);
    await page.waitForTimeout(180);
    await waitForScreeningImages(page);
  }
  await page.evaluate(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousBehavior;
  });
  await waitForScreeningImages(page);
}

async function collectHomeContract(page) {
  const requiredIds = [
    'top', 'start', 'featured-agents', 'lane-mainline', 'lane-events', 'lane-behind', 'about',
    'statusText', 'homeNavToggle', 'homeNav', 'editorOpen', 'heroTitle', 'heroIntro', 'archiveStatus',
    'homeHeroArt', 'heroCarouselTrack', 'heroCarouselPrev', 'heroCarouselNext', 'heroCarouselDots', 'heroCoverIndex', 'heroStarImg',
    'homeModules', 'homeSecondaryRail', 'homeAgentRail', 'homeLaneMainline', 'homeLaneEvents', 'homeLaneBehind',
    'musicPlayer', 'cassetteOpen', 'musicToggle', 'trackName', 'prevTrack', 'nextTrack', 'playMode', 'volume', 'playlistOpen', 'audio',
    'cassetteStage', 'cassetteCloseScrim', 'cassetteDeckTitle', 'cassetteClose', 'cassetteShell', 'cassetteSideBadge', 'cassetteSideMeta',
    'cassetteTrackName', 'cassetteTimeNow', 'cassetteSeek', 'cassetteTimeEnd', 'cassetteSideA', 'cassetteSideB', 'cassetteSideHint',
    'cassettePrev', 'cassetteToggle', 'cassetteNext', 'cassetteMode', 'cassetteVolume', 'cassettePlaylistBtn', 'cassettePlaylist',
    'toast', 'playlist', 'playlistItems',
  ];
  return page.evaluate(({ expectedActs, requiredIds }) => {
    const acts = [...document.querySelectorAll('[data-home-act]')];
    const href = (selector) => document.querySelector(selector)?.getAttribute('href') ?? '';
    const roleLinks = [...document.querySelectorAll('#homeAgentRail a.home-agent-card:not(.more)[href]')].map((node) => node.getAttribute('href'));
    return {
      acts: acts.map((node) => ({
        value: node.dataset.homeAct ?? '',
        label: node.querySelector('.home-act-label__zh')?.textContent.trim() ?? '',
      })),
      uniqueActs: new Set(acts.map((node) => node.dataset.homeAct)).size,
      expectedActs,
      missingIds: requiredIds.filter((id) => !document.getElementById(id)),
      mainCount: document.querySelectorAll('main').length,
      skipHref: href('.skip-link'),
      primaryHref: href('.hero-primary-action'),
      playHref: href('.hero-play-action'),
      pathHrefs: [...document.querySelectorAll('#homeModules a[href]')].map((node) => node.getAttribute('href')),
      laneJumpHrefs: [...document.querySelectorAll('.home-lane-jump a[href]')].map((node) => node.getAttribute('href')),
      roleLinks,
      editorHosts: document.querySelectorAll('[data-editor-id]').length,
      englishActSegments: document.querySelectorAll('.home-act-label__en').length,
      decorationLayers: ['.hero__projector-light', '.hero__curtain', '.hero__screen-grain'].filter((selector) => document.querySelector(selector)).length,
    };
  }, { expectedActs: homeActs, requiredIds });
}

async function collectHomeHeroState(page) {
  return page.evaluate(() => {
    const slides = [...document.querySelectorAll('#heroCarouselTrack .hero-carousel-slide')];
    const controls = ['heroCarouselPrev', 'heroCarouselNext', 'heroCarouselDots'].map((id) => {
      const node = document.getElementById(id);
      if (!node) return { id, missing: true };
      const style = getComputedStyle(node);
      return { id, display: style.display, visibility: style.visibility, pointerEvents: style.pointerEvents };
    });
    const visibleIndexes = slides.flatMap((slide, index) => {
      const style = getComputedStyle(slide);
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > .99;
      return visible ? [index] : [];
    });
    return {
      firstSrc: slides[0]?.querySelector('img')?.currentSrc ?? slides[0]?.querySelector('img')?.getAttribute('src') ?? '',
      visibleIndexes,
      domActiveIndexes: slides.flatMap((slide, index) => slide.classList.contains('is-active') ? [index] : []),
      controls,
    };
  });
}

async function collectHomeHeroGeometry(page) {
  return page.evaluate(() => {
    const art = document.querySelector('.hero-art');
    const title = document.querySelector('#heroTitle');
    if (!art || !title) return null;
    const artStyle = getComputedStyle(art);
    const titleStyle = getComputedStyle(title);
    const rect = art.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const parseTransform = (value) => {
      const raw = String(value || 'none').trim();
      if (raw === 'none') return { raw, matrix: identity, identity: true };
      const matrix2d = raw.match(/^matrix\(([^)]+)\)$/i);
      const matrix3d = raw.match(/^matrix3d\(([^)]+)\)$/i);
      const values = (matrix2d?.[1] ?? matrix3d?.[1])?.split(',').map(Number);
      let matrix = null;
      if (matrix2d && values?.length === 6 && values.every(Number.isFinite)) {
        const [a, b, c, d, e, f] = values;
        matrix = [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1];
      } else if (matrix3d && values?.length === 16 && values.every(Number.isFinite)) {
        matrix = values;
      }
      return {
        raw,
        matrix,
        identity: Boolean(matrix && matrix.every((entry, index) => Math.abs(entry - identity[index]) <= 1e-6)),
      };
    };
    const parseRotate = (value) => {
      const raw = String(value || 'none').trim().toLowerCase();
      if (raw === 'none') return { raw, degrees: 0, identity: true };
      const match = raw.match(/^(-?(?:\d+\.?\d*|\.\d+))(deg|rad|grad|turn)$/);
      if (!match) return { raw, degrees: null, identity: false };
      const amount = Number(match[1]);
      const factor = { deg: 1, rad: 180 / Math.PI, grad: .9, turn: 360 }[match[2]];
      const degrees = amount * factor;
      return { raw, degrees, identity: Math.abs(degrees) <= 1e-6 };
    };
    const parseClipPath = (value) => {
      const raw = String(value || 'none').trim();
      return { raw, none: raw === 'none' };
    };
    return {
      transform: parseTransform(artStyle.transform),
      clipPath: parseClipPath(artStyle.clipPath),
      rotate: parseRotate(artStyle.rotate),
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
      ratio: Math.round((rect.width / rect.height) * 1000) / 1000,
      titleTransform: parseTransform(titleStyle.transform),
      titleClipPath: parseClipPath(titleStyle.clipPath),
      titleWidth: Math.round(titleRect.width * 100) / 100,
      titleHeight: Math.round(titleRect.height * 100) / 100,
      titleText: [...title.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent.trim()).join(''),
      titleAfter: getComputedStyle(title, '::after').content,
      titleOpacity: titleStyle.opacity,
    };
  });
}

async function inspectAnimationDisabledVisibility(page) {
  const styleTag = await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;box-shadow:none!important;border-radius:0!important}*::before,*::after{content:none!important;opacity:0!important;visibility:hidden!important}' });
  const state = await page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) >= .99
        && rect.width > 0
        && rect.height > 0;
    };
    const layoutHosts = [
      ['00', '.hero'],
      ['01', '.start-paths'],
      ['02', '.home-agent-rail'],
      ['03', '#homeLaneMainline'],
      ['04', '#homeLaneEvents'],
      ['05', '#homeLaneBehind'],
      ['06', '.about-credits'],
    ];
    const layoutSignatures = layoutHosts.map(([act, selector]) => {
      const node = document.querySelector(selector);
      if (!node) return { act, selector, signature: 'missing' };
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const children = [...node.children].slice(0, 8).map((child) => {
        const childRect = child.getBoundingClientRect();
        return [
          Math.round(childRect.left - rect.left),
          Math.round(childRect.top - rect.top),
          Math.round(childRect.width),
          Math.round(childRect.height),
        ].join(',');
      }).join('|');
      return {
        act,
        selector,
        signature: [style.display, style.gridTemplateColumns, style.gridTemplateRows, style.flexDirection, node.children.length, children].join(';'),
      };
    });
    return {
      acts: [...document.querySelectorAll('[data-home-act]')].map((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const label = node.querySelector('.home-act-label');
        const heading = node.querySelector('h1,h2');
        const primaryEntry = node.querySelector('.hero-primary-action,.path-card,.controls .button,.about-link');
        return {
          act: node.dataset.homeAct,
          display: style.display,
          visibility: style.visibility,
          opacity: Number(style.opacity),
          width: rect.width,
          height: rect.height,
          labelVisible: visible(label),
          headingVisible: visible(heading),
          primaryEntryVisible: visible(primaryEntry),
        };
      }),
      layoutSignatures,
      uniqueLayoutSignatures: new Set(layoutSignatures.map((entry) => entry.signature)).size,
      revealNodesHidden: [...document.querySelectorAll('[data-motion-reveal]')].filter((node) => !visible(node)).length,
    };
  });
  await styleTag.evaluate((node) => node.remove());
  return state;
}

async function inspectHomeActClearance(page, act, viewport) {
  return page.evaluate(({ act, viewport }) => {
    const target = document.querySelector(`[data-home-act="${act}"]`);
    const label = target?.querySelector('.home-act-label');
    const heading = target?.querySelector('h1,h2');
    const viewportRect = { x: 0, y: 0, top: 0, left: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight };
    const intersects = (first, second) => Boolean(first && second
      && first.left < second.right - .5
      && first.right > second.left + .5
      && first.top < second.bottom - .5
      && first.bottom > second.top + .5);
    const visibleRect = (node) => {
      if (!node) return null;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const visible = style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) > 0
        && rect.width > 0
        && rect.height > 0
        && intersects(rect, viewportRect);
      return visible ? { rect: rect.toJSON(), position: style.position } : null;
    };
    const headingRects = [
      { name: 'act-label', node: label },
      { name: heading?.tagName.toLowerCase() ?? 'heading', node: heading },
    ].map(({ name, node }) => ({ name, rect: node?.getBoundingClientRect().toJSON() ?? null }));
    const overlays = [
      { name: 'topbar', node: document.querySelector('.topbar') },
      { name: 'nav', node: document.querySelector('.home-lane-jump') },
      { name: 'tape-dock', node: document.getElementById('musicPlayer') },
    ].flatMap(({ name, node }) => {
      const visible = visibleRect(node);
      return visible ? [{ name, ...visible }] : [];
    });
    const overlaps = headingRects.flatMap((title) => overlays.flatMap((overlay) => (
      intersects(title.rect, overlay.rect) ? [{ title: title.name, overlay: overlay.name }] : []
    )));
    const headingsFullyVisible = headingRects.every(({ rect }) => Boolean(rect
      && rect.left >= -.5
      && rect.right <= innerWidth + .5
      && rect.top >= -.5
      && rect.bottom <= innerHeight + .5));
    const dock = document.getElementById('musicPlayer');
    const dockPosition = dock ? getComputedStyle(dock).position : '';
    const dockInFlow = dockPosition !== 'fixed' && dockPosition !== 'absolute' && dockPosition !== 'sticky';
    return {
      passed: Boolean(target && label && heading && headingsFullyVisible && overlaps.length === 0 && dockInFlow),
      viewport,
      act,
      targetRect: target?.getBoundingClientRect().toJSON() ?? null,
      headingRects,
      overlays,
      overlaps,
      headingsFullyVisible,
      dockPosition,
      dockInFlow,
    };
  }, { act, viewport });
}

async function inspectHomeInitialOverlay(page, variant) {
  return page.evaluate((currentVariant) => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousBehavior;
    const viewportRect = { x: 0, y: 0, top: 0, left: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight };
    const intersects = (first, second) => Boolean(first && second
      && first.left < second.right - .5
      && first.right > second.left + .5
      && first.top < second.bottom - .5
      && first.bottom > second.top + .5);
    const describe = (node) => {
      const id = node.id ? `#${node.id}` : '';
      const classes = [...node.classList].slice(0, 2).map((name) => `.${name}`).join('');
      return `${node.tagName.toLowerCase()}${id || classes}`;
    };
    const visibleTargets = [
      ['act-number', '[data-home-act] .home-act-label'],
      ['heading', 'main h1,main h2'],
      ['body', 'main p:not(.home-act-label)'],
      ['primary-action', 'main .hero-actions .button,main .controls .button'],
    ].flatMap(([kind, selector]) => [...document.querySelectorAll(selector)].flatMap((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const visible = style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) > 0
        && rect.width > 0
        && rect.height > 0
        && intersects(rect, viewportRect);
      return visible ? [{ kind, element: describe(node), rect: rect.toJSON() }] : [];
    }));
    const overlays = [
      ['topbar', document.querySelector('.topbar')],
      ['nav', document.querySelector('.home-lane-jump')],
      ['tape-dock', document.getElementById('musicPlayer')],
    ].map(([name, node]) => {
      const style = node ? getComputedStyle(node) : null;
      const rect = node?.getBoundingClientRect();
      const visible = Boolean(rect && style
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) > 0
        && rect.width > 0
        && rect.height > 0
        && intersects(rect, viewportRect));
      return {
        name,
        position: style?.position ?? '',
        rect: rect?.toJSON() ?? null,
        visible,
        fixedOrSticky: style?.position === 'fixed' || style?.position === 'sticky',
      };
    });
    const overlaps = visibleTargets.flatMap((target) => overlays.flatMap((overlay) => (
      overlay.visible && overlay.fixedOrSticky && intersects(target.rect, overlay.rect)
        ? [{ target, overlay: { name: overlay.name, position: overlay.position, rect: overlay.rect } }]
        : []
    )));
    const kinds = new Set(visibleTargets.map((target) => target.kind));
    const dock = document.getElementById('musicPlayer');
    const dockStyle = dock ? getComputedStyle(dock) : null;
    const cassetteOpenRect = document.getElementById('cassetteOpen')?.getBoundingClientRect();
    const dockInFlow = Boolean(dockStyle
      && dockStyle.position !== 'fixed' && dockStyle.position !== 'absolute' && dockStyle.position !== 'sticky');
    return {
      variant: currentVariant,
      scrollY: window.scrollY,
      viewport: viewportRect,
      targets: visibleTargets,
      overlays,
      overlaps,
      visibleKinds: [...kinds],
      dockInFlow,
      cassetteOpenRect: cassetteOpenRect?.toJSON() ?? null,
      passed: window.scrollY <= .5
        && ['act-number', 'heading', 'body', 'primary-action'].every((kind) => kinds.has(kind))
        && dockInFlow
        && Boolean(cassetteOpenRect && cassetteOpenRect.width >= 44 && cassetteOpenRect.height >= 44)
        && overlaps.length === 0,
    };
  }, variant);
}

async function inspectHome320(page) {
  const base = await page.evaluate(() => {
    const overflowing = [...document.querySelectorAll('body *')].filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.position !== 'fixed' && rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
    }).slice(0, 20).map((node) => ({ tag: node.tagName, id: node.id, className: node.className, rect: node.getBoundingClientRect().toJSON() }));
    const targetSelectors = '#homeNavToggle,#editorOpen,#cassetteOpen,.hero-actions .button,.controls .button,.home-lane-jump a,.path-card,.chip-link,.home-agent-card,.home-lane-card';
    const undersized = [...document.querySelectorAll(targetSelectors)].filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      return visible && (rect.width < 44 || rect.height < 44);
    }).map((node) => ({ tag: node.tagName, id: node.id, className: node.className, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
    const dock = document.getElementById('musicPlayer');
    const dockRect = dock?.getBoundingClientRect();
    const dockStyle = dock ? getComputedStyle(dock) : null;
    const cassetteOpenRect = document.getElementById('cassetteOpen')?.getBoundingClientRect();
    const main = document.querySelector('main');
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      overflowing,
      undersized,
      dockVisible: Boolean(dockRect && dockStyle?.display !== 'none' && dockRect.height > 0),
      dockHeight: dockRect?.height ?? 0,
      dockPosition: dockStyle?.position ?? '',
      dockInFlow: Boolean(dock && main
        && (main.compareDocumentPosition(dock) & Node.DOCUMENT_POSITION_FOLLOWING)
        && dockStyle?.position !== 'fixed' && dockStyle?.position !== 'absolute' && dockStyle?.position !== 'sticky'),
      cassetteOpenRect: cassetteOpenRect?.toJSON() ?? null,
      bodyPaddingBottom: Number.parseFloat(getComputedStyle(document.body).paddingBottom) || 0,
    };
  });
  const overlaps = [];
  for (const act of homeActs) {
    const selector = `[data-home-act="${act.value}"]`;
    const target = page.locator(`${selector} a[href],${selector} button`).first();
    if (await target.count() === 0) continue;
    await target.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await page.waitForTimeout(60);
    const overlap = await target.evaluate((node) => {
      const dock = document.getElementById('musicPlayer');
      const topbar = document.querySelector('.topbar');
      const rect = node.getBoundingClientRect();
      const dockRect = dock?.getBoundingClientRect();
      const topbarRect = topbar?.getBoundingClientRect();
      return {
        target: node.id || node.className || node.tagName,
        targetRect: rect.toJSON(),
        dockRect: dockRect?.toJSON() ?? null,
        topbarRect: topbarRect?.toJSON() ?? null,
        overlapsDock: Boolean(dockRect && rect.bottom > dockRect.top - 4),
        overlapsTopbar: Boolean(topbarRect && rect.top < topbarRect.bottom + 4),
      };
    });
    if (overlap.overlapsDock || overlap.overlapsTopbar) overlaps.push({ act: act.value, ...overlap });
  }
  return { ...base, overlaps };
}

function isExpectedBackendRequest(url, routeName) {
  if (routeName !== 'editor') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:'
      && parsed.hostname === 'localhost'
      && parsed.port === '3001'
      && parsed.pathname.startsWith('/api/auth/');
  } catch {
    return false;
  }
}

await mkdir(outputDir, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  routes: [],
  deepLinks: [],
  interactions: [],
  homeScreening: {
    actCaptures: [],
    fullCaptures: [],
    checks: [],
    initialOverlayInspections: [],
    readiness: [],
  },
  summary: {
    routes: routes.length,
    variantsPerRoute: variants.length,
    screenshotsExpected: (routes.length * variants.length) + homeReleaseVariants.length + 26,
    screenshotsCaptured: 0,
    deepLinksExpected: deepLinkChecks.length,
    deepLinksPassed: 0,
    interactionsExpected: 1 + homeReleaseVariants.length,
    interactionsPassed: 0,
    homeReleaseChecksExpected: homeReleaseVariants.length,
    homeReleaseChecksPassed: 0,
    homeScreeningActScreenshotsExpected: 21,
    homeScreeningActScreenshotsCaptured: 0,
    homeScreeningFullScreenshotsExpected: 5,
    homeScreeningFullScreenshotsCaptured: 0,
    homeScreeningChecksExpected: 8,
    homeScreeningChecksPassed: 0,
    blockingFailures: 0,
  },
  failures: [],
};

function recordHomeScreeningCheck(name, passed, detail) {
  const entry = { name, passed: Boolean(passed), detail };
  report.homeScreening.checks.push(entry);
  if (entry.passed) {
    report.summary.homeScreeningChecksPassed += 1;
  } else {
    report.failures.push({ route: 'index', variant: 'home-screening', type: name, detail });
    report.summary.blockingFailures += 1;
  }
  return entry;
}

let browser;
let serverHandle;

try {
  serverHandle = await startStaticServer();
  browser = await chromium.launch({ headless: true });

  for (const route of routes) {
    const routeResult = { name: route.name, path: route.path, captures: [] };
    report.routes.push(routeResult);

    for (const variant of variants) {
      const context = await browser.newContext({
        viewport: variant.viewport,
        deviceScaleFactor: 1,
        reducedMotion: variant.reducedMotion,
      });
      const page = await context.newPage();
      const pageErrors = [];
      const consoleErrors = [];
      const failedRequests = [];
      const externalRequests = [];
      const localHttpErrors = [];
      const captureFailures = [];

      page.on('pageerror', (error) => {
        pageErrors.push(serializeError(error));
      });
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push({ text: message.text(), location: message.location() });
        }
      });
      page.on('request', (request) => {
        const url = request.url();
        if (/^https?:/i.test(url) && !url.startsWith(`${serverHandle.origin}/`)) {
          externalRequests.push({
            url,
            method: request.method(),
            resourceType: request.resourceType(),
            expectedBackendOffline: isExpectedBackendRequest(url, route.name),
          });
        }
      });
      page.on('requestfailed', (request) => {
        const url = request.url();
        const isLocal = url.startsWith(`${serverHandle.origin}/`);
        const resourceType = request.resourceType();
        const errorText = request.failure()?.errorText ?? 'Unknown request failure';
        failedRequests.push({
          url,
          method: request.method(),
          resourceType,
          errorText,
          isLocal,
          expectedBackendOffline: isExpectedBackendRequest(url, route.name),
          ignoredAsBenignMediaAbort: resourceType === 'media' && errorText === 'net::ERR_ABORTED',
        });
      });
      page.on('response', (response) => {
        if (response.url().startsWith(`${serverHandle.origin}/`) && response.status() >= 400) {
          localHttpErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            expectedBackendOffline: isExpectedBackendRequest(response.url(), route.name),
          });
        }
      });

      const requestedUrl = `${serverHandle.origin}${route.path}`;
      const screenshotFile = `${route.name}--${variant.name}.png`;

      try {
        await page.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(1_500);
        await page.screenshot({ path: resolve(outputDir, screenshotFile), fullPage: false });
        report.summary.screenshotsCaptured += 1;
      } catch (error) {
        captureFailures.push(serializeError(error));
      }

      let pageState = {
        title: '',
        finalUrl: page.url(),
        horizontalOverflow: null,
        bodyUsable: false,
        mainElementCount: null,
        signalFieldCount: null,
        routeLoaderCount: null,
        officialMedia: [],
        homeArchive: null,
      };
      try {
        pageState = await page.evaluate(({ expectedOfficialCovers }) => {
          const documentElement = document.documentElement;
          const body = document.body;
          const viewportWidth = window.innerWidth;
          const scrollWidth = Math.max(
            documentElement?.scrollWidth ?? 0,
            body?.scrollWidth ?? 0,
          );
          return {
            title: document.title,
            finalUrl: window.location.href,
            bodyUsable: body instanceof HTMLBodyElement && body.childElementCount > 0,
            mainElementCount: document.querySelectorAll('main').length,
            signalFieldCount: document.querySelectorAll('.hooxi-signal-field').length,
            routeLoaderCount: document.querySelectorAll('.hooxi-route-loader').length,
            homeArchive: document.body.classList.contains('home-page') ? (() => {
              const primary = document.querySelector('.hero-primary-action');
              const play = document.querySelector('.hero-play-action');
              const image = document.querySelector('#heroStarImg');
              const primaryStyle = primary ? getComputedStyle(primary) : null;
              const playStyle = play ? getComputedStyle(play) : null;
              return {
                primaryHref: primary?.getAttribute('href') ?? '',
                playHref: play?.getAttribute('href') ?? '',
                pathCount: document.querySelectorAll('#homeModules .path-card').length,
                hasTimeline: Boolean(document.querySelector('#timeline')),
                hasExpandControls: Boolean(document.querySelector('#expandAll,#collapseAll')),
                imageSrc: image?.getAttribute('src') ?? '',
                imageResolvedSrc: image?.currentSrc ?? '',
                imageNaturalWidth: image?.naturalWidth ?? 0,
                primaryFontSize: Number.parseFloat(primaryStyle?.fontSize ?? '0'),
                playFontSize: Number.parseFloat(playStyle?.fontSize ?? '0'),
                primaryArea: primary ? primary.getBoundingClientRect().width * primary.getBoundingClientRect().height : 0,
                playArea: play ? play.getBoundingClientRect().width * play.getBoundingClientRect().height : 0,
              };
            })() : null,
            officialMedia: [...document.querySelectorAll('.page-timeline-item')].flatMap((item) => {
              const image = item.querySelector('.cover-link img');
              if (!image) return [];
              const src = image.getAttribute('src') ?? '';
              const rect = image.getBoundingClientRect();
              const style = getComputedStyle(image);
              const visible = rect.width > 0
                && rect.height > 0
                && style.display !== 'none'
                && style.visibility !== 'hidden'
                && Number(style.opacity) > 0;
              if (!visible && !expectedOfficialCovers.includes(src)) return [];
              const coverLink = item.querySelector('.cover-link');
              const videoLink = item.querySelector('.video-link');
              const sourceLink = item.querySelector('.wiki-link');
              return [{
                src,
                resolvedSrc: image.currentSrc,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
                coverHref: coverLink?.href ?? '',
                videoHref: videoLink?.href ?? '',
                sourceHref: sourceLink?.href ?? '',
                visible,
                contractMedia: expectedOfficialCovers.includes(src),
              }];
            }),
            horizontalOverflow: {
              viewportWidth,
              scrollWidth,
              overflowPixels: Math.max(0, scrollWidth - viewportWidth),
              hasOverflow: scrollWidth > viewportWidth + 1,
            },
          };
        }, { expectedOfficialCovers: mainlineOfficialMedia.map((media) => media.cover) });
      } catch (error) {
        captureFailures.push(serializeError(error));
      }

      const blockingFailures = [];
      for (const error of pageErrors) {
        blockingFailures.push({ type: 'pageerror', detail: error });
      }
      for (const error of consoleErrors) {
        blockingFailures.push({ type: 'console-error', detail: error });
      }
      for (const request of externalRequests) {
        if (!request.expectedBackendOffline) {
          blockingFailures.push({ type: 'external-request', detail: request });
        }
      }
      for (const error of localHttpErrors) {
        if (!error.expectedBackendOffline) {
          blockingFailures.push({ type: 'local-http-error', detail: error });
        }
      }
      for (const request of failedRequests) {
        if (!request.ignoredAsBenignMediaAbort && !request.expectedBackendOffline && request.isLocal) {
          blockingFailures.push({ type: 'request-failed', detail: request });
        }
      }
      if (pageState.horizontalOverflow?.hasOverflow) {
        blockingFailures.push({ type: 'horizontal-overflow', detail: pageState.horizontalOverflow });
      }
      if (route.name === 'index') {
        const home = pageState.homeArchive;
        const homePassed = home
          && home.primaryHref === '#start'
          && home.playHref === 'tape-wall-sample.html'
          && home.pathCount === 3
          && !home.hasTimeline
          && !home.hasExpandControls
          && (home.imageSrc === `${serverHandle.origin}/assets/hero/zzz-random-play-keyart.png`
            || home.imageSrc === `${serverHandle.origin}/assets/hero/zzz-random-play-keyart.webp`)
          && (home.imageResolvedSrc === `${serverHandle.origin}/assets/hero/zzz-random-play-keyart.png`
            || home.imageResolvedSrc === `${serverHandle.origin}/assets/hero/zzz-random-play-keyart.webp`)
          && home.imageNaturalWidth > 0
          && home.primaryFontSize > home.playFontSize
          && home.primaryArea > home.playArea
          && pageErrors.length === 0
          && externalRequests.length === 0
          && !pageState.horizontalOverflow?.hasOverflow;
        if (!homePassed) {
          blockingFailures.push({
            type: 'home-archive-entry',
            detail: { home, pageErrors, externalRequests, horizontalOverflow: pageState.horizontalOverflow },
          });
        }
      }
      if (route.name === 'mainline') {
        const mediaPassed = mainlineOfficialMedia.every((expected) => pageState.officialMedia.some((media) => media.contractMedia
          && media.src === expected.cover
          && media.resolvedSrc === `${serverHandle.origin}/${expected.cover}`
          && media.naturalWidth === 1920
          && media.naturalHeight === 1080
          && media.coverHref === expected.video
          && media.videoHref === expected.video));
        if (!mediaPassed || externalRequests.length !== 0) {
          blockingFailures.push({ type: 'official-media', detail: { expectedMedia: mainlineOfficialMedia, actual: pageState.officialMedia, externalRequests } });
        }
      }
      if (!pageState.bodyUsable) {
        blockingFailures.push({ type: 'body-unusable', detail: { bodyUsable: pageState.bodyUsable } });
      }
      if (pageState.mainElementCount !== 1) {
        blockingFailures.push({ type: 'main-element-count', detail: { count: pageState.mainElementCount } });
      }
      if (publicRouteNames.has(route.name) && (pageState.signalFieldCount !== 1 || pageState.routeLoaderCount !== 1)) {
        blockingFailures.push({
          type: 'public-motion-layers',
          detail: { signalFieldCount: pageState.signalFieldCount, routeLoaderCount: pageState.routeLoaderCount },
        });
      }
      for (const error of captureFailures) {
        blockingFailures.push({ type: 'capture-error', detail: error });
      }

      const capture = {
        variant: variant.name,
        viewport: variant.viewport,
        reducedMotion: variant.reducedMotion,
        screenshot: screenshotFile,
        requestedUrl,
        title: pageState.title,
        finalUrl: pageState.finalUrl,
        bodyUsable: pageState.bodyUsable,
        mainElementCount: pageState.mainElementCount,
        signalFieldCount: pageState.signalFieldCount,
        routeLoaderCount: pageState.routeLoaderCount,
        officialMedia: pageState.officialMedia,
        homeArchive: pageState.homeArchive,
        horizontalOverflow: pageState.horizontalOverflow,
        pageErrors,
        consoleErrors,
        failedRequests,
        externalRequests,
        localHttpErrors,
        blockingFailures,
      };
      routeResult.captures.push(capture);

      for (const failure of blockingFailures) {
        report.failures.push({ route: route.name, variant: variant.name, ...failure });
      }
      report.summary.blockingFailures += blockingFailures.length;

      await context.close();
    }
  }

  for (const variant of homeReleaseVariants) {
    const context = await browser.newContext({
      viewport: variant.viewport,
      deviceScaleFactor: 1,
      reducedMotion: variant.reducedMotion,
    });
    const page = await context.newPage();
    const pageErrors = [];
    const externalRequests = [];
    page.on('pageerror', error => pageErrors.push(serializeError(error)));
    page.on('request', request => {
      const url = request.url();
      if (/^https?:/i.test(url) && !url.startsWith(`${serverHandle.origin}/`)) externalRequests.push(url);
    });
    let entry;
    try {
      await page.goto(`${serverHandle.origin}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);
      const isMobile = variant.viewport.width <= 640;
      const initial = await page.evaluate(() => {
        const toggle = document.querySelector('#homeNavToggle');
        const nav = document.querySelector('#homeNav');
        return {
          toggleDisplay: toggle ? getComputedStyle(toggle).display : '',
          expanded: toggle?.getAttribute('aria-expanded') ?? '',
          navDisplay: nav ? getComputedStyle(nav).display : '',
        };
      });
      let keyboard = { enterOpened: true, escapeClosed: true, focusReturned: true, spaceOpened: true, linkClosed: true };
      let openedNav = { expanded: true, display: '', internalOverflow: false, targetsPass: true, lastVisible: true };
      if (isMobile) {
        await page.locator('#homeNavToggle').focus();
        await page.keyboard.press('Enter');
        keyboard.enterOpened = await page.locator('#homeNavToggle').getAttribute('aria-expanded') === 'true';
        await page.keyboard.press('Escape');
        keyboard.escapeClosed = await page.locator('#homeNavToggle').getAttribute('aria-expanded') === 'false';
        keyboard.focusReturned = await page.evaluate(() => document.activeElement?.id === 'homeNavToggle');
        await page.keyboard.press('Space');
        keyboard.spaceOpened = await page.locator('#homeNavToggle').getAttribute('aria-expanded') === 'true';
        openedNav = await page.evaluate(() => {
          const nav = document.querySelector('#homeNav');
          const links = [...nav.querySelectorAll('a')];
          const last = links.at(-1)?.getBoundingClientRect();
          return {
            expanded: document.querySelector('#homeNavToggle')?.getAttribute('aria-expanded') === 'true',
            display: getComputedStyle(nav).display,
            internalOverflow: nav.scrollWidth > nav.clientWidth + 1,
            targetsPass: links.length > 0 && links.every(node => { const box = node.getBoundingClientRect(); return box.width >= 44 && box.height >= 44; }),
            lastVisible: Boolean(last && last.top >= 0 && last.bottom <= innerHeight),
          };
        });
        await page.evaluate(() => document.querySelector('#homeNav a:last-child')?.addEventListener('click', event => event.preventDefault(), { once: true }));
        await page.locator('#homeNav a:last-child').click();
        keyboard.linkClosed = await page.locator('#homeNavToggle').getAttribute('aria-expanded') === 'false';
      }
      const state = await page.evaluate(({ isMobile, width, height }) => {
        const rect = selector => document.querySelector(selector)?.getBoundingClientRect() ?? null;
        const overlaps = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
        const primary = document.querySelector('.hero-primary-action');
        const play = document.querySelector('.hero-play-action');
        const image = document.querySelector('#heroStarImg');
        const nav = document.querySelector('#homeNav');
        const toggle = document.querySelector('#homeNavToggle');
        const primaryStyle = getComputedStyle(primary);
        const playStyle = getComputedStyle(play);
        const probe = document.createElement('i');
        probe.style.backgroundColor = 'var(--color-accent)';
        document.body.append(probe);
        const accent = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const keySelectors = ['#heroTitle', '#heroIntro', '.hero-primary-action', '.hero-play-action', '.hero-index'];
        const dockRect = rect('.cassette-dock');
        const artRect = rect('.hero-art');
        const visibleArtHeight = artRect ? Math.max(0, Math.min(height, artRect.bottom) - Math.max(0, artRect.top)) : 0;
        const navLinks = [...document.querySelectorAll('#homeNav a')];
        const nowrap = [...document.querySelectorAll('#homeNav a,.hero-actions .button')].every(node => node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1);
        return {
          toggleRect: rect('#homeNavToggle'),
          navExpanded: toggle?.getAttribute('aria-expanded') ?? '',
          navDisplay: nav ? getComputedStyle(nav).display : '',
          navInternalOverflow: nav ? nav.scrollWidth > nav.clientWidth + 1 : true,
          navTargetsPass: navLinks.length > 0 && navLinks.every(node => { const box = node.getBoundingClientRect(); return box.width >= 44 && box.height >= 44; }),
          lastNavVisible: (() => { const box = navLinks.at(-1)?.getBoundingClientRect(); return Boolean(box && box.top >= 0 && box.bottom <= height); })(),
          primaryBackground: primaryStyle.backgroundColor,
          primaryColor: primaryStyle.color,
          accent,
          primaryWeightPass: parseFloat(primaryStyle.fontSize) > parseFloat(playStyle.fontSize)
            && primary.getBoundingClientRect().width * primary.getBoundingClientRect().height > play.getBoundingClientRect().width * play.getBoundingClientRect().height,
          imageLoaded: image?.complete && image.naturalWidth > 0,
          pathCount: document.querySelectorAll('#homeModules .path-card').length,
          hasTimeline: Boolean(document.querySelector('#timeline')),
          horizontalOverflow: document.documentElement.scrollWidth > width + 1,
          dockClear: keySelectors.every(selector => { const box = rect(selector); return !box || box.bottom <= 0 || box.top >= height || !overlaps(box, dockRect); }),
          nowrap,
          firstFold1280: width !== 1280 || (keySelectors.every(selector => rect(selector)?.bottom <= height)
            && visibleArtHeight >= Math.min(420, artRect?.height * .7)),
          artVisibleRatio: artRect ? visibleArtHeight / artRect.height : 0,
        };
      }, { isMobile, width: variant.viewport.width, height: variant.viewport.height });
      const passed = pageErrors.length === 0
        && externalRequests.length === 0
        && state.primaryBackground === state.accent
        && state.primaryBackground !== 'rgba(0, 0, 0, 0)'
        && state.primaryColor !== state.primaryBackground
        && state.primaryWeightPass
        && state.imageLoaded
        && state.pathCount === 3
        && !state.hasTimeline
        && !state.horizontalOverflow
        && state.dockClear
        && state.nowrap
        && state.firstFold1280
        && (isMobile
          ? initial.toggleDisplay !== 'none'
            && initial.expanded === 'false'
            && initial.navDisplay === 'none'
            && state.toggleRect?.width >= 44
            && state.toggleRect?.height >= 44
            && openedNav.expanded
            && openedNav.display !== 'none'
            && !openedNav.internalOverflow
            && openedNav.targetsPass
            && openedNav.lastVisible
            && Object.values(keyboard).every(Boolean)
          : initial.toggleDisplay === 'none');
      const screenshot = `${variant.name}.png`;
      await page.screenshot({ path: resolve(outputDir, screenshot), fullPage: false });
      report.summary.screenshotsCaptured += 1;
      entry = { name: variant.name, passed, viewport: variant.viewport, reducedMotion: variant.reducedMotion, screenshot, detail: { initial, keyboard, openedNav, state, pageErrors, externalRequests } };
    } catch (error) {
      entry = { name: variant.name, passed: false, viewport: variant.viewport, reducedMotion: variant.reducedMotion, detail: serializeError(error) };
    }
    report.interactions.push(entry);
    if (entry.passed) {
      report.summary.interactionsPassed += 1;
      report.summary.homeReleaseChecksPassed += 1;
    } else {
      report.failures.push({ route: 'index', variant: variant.name, type: 'home-release-gate', detail: entry });
      report.summary.blockingFailures += 1;
    }
    await context.close();
  }

  const normalHomeGeometry = new Map();
  for (const variant of homeScreeningVariants) {
    const context = await browser.newContext({
      viewport: variant.viewport,
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    try {
      await page.goto(`${serverHandle.origin}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      const readiness = await waitForHomeScreeningReadiness(page);
      report.homeScreening.readiness.push({ variant: variant.name, phase: 'initial', ...readiness });
      const initialOverlay = await inspectHomeInitialOverlay(page, { motion: 'normal', ...variant });
      report.homeScreening.initialOverlayInspections.push(initialOverlay);
      if (!initialOverlay.passed) {
        report.failures.push({ route: 'index', variant: variant.name, type: 'home-initial-overlay', detail: initialOverlay });
        report.summary.blockingFailures += 1;
      }

      if (variant.name === '1440x900') {
        const contract = await collectHomeContract(page);
        const expectedValues = homeActs.map((act) => act.value);
        const expectedLabels = homeActs.map((act) => act.label);
        const contractPassed = contract.acts.map((act) => act.value).join(',') === expectedValues.join(',')
          && contract.acts.map((act) => act.label).join('|') === expectedLabels.join('|')
          && contract.uniqueActs === homeActs.length
          && contract.missingIds.length === 0
          && contract.mainCount === 1
          && contract.skipHref === '#top'
          && contract.primaryHref === '#start'
          && contract.playHref === 'tape-wall-sample.html'
          && contract.pathHrefs.join(',') === 'mainline.html,stories.html,stories.html#agentSearchForm'
          && contract.laneJumpHrefs.join(',') === '#lane-mainline,#lane-events,#lane-behind,#about'
          && contract.roleLinks.length >= 8
          && contract.roleLinks.every((href) => href?.startsWith('character.html?id='))
          && contract.editorHosts >= 1
          && contract.englishActSegments === homeActs.length
          && contract.decorationLayers === 3;
        recordHomeScreeningCheck('home-seven-act-contract', contractPassed, contract);

        const before = await collectHomeHeroState(page);
        await page.waitForTimeout(8_000);
        const after = await collectHomeHeroState(page);
        const stable = before.firstSrc === after.firstSrc
          && before.visibleIndexes.join(',') === '0'
          && after.visibleIndexes.join(',') === '0';
        recordHomeScreeningCheck('home-first-frame-stable-8s', stable, { before, after });

        const controlsStatic = after.controls.length === 3
          && after.controls.every((control) => !control.missing
            && control.display === 'none'
            && control.visibility === 'hidden'
            && control.pointerEvents === 'none');
        recordHomeScreeningCheck('home-carousel-controls-noninteractive', controlsStatic, after.controls);
      }

      const geometry = await collectHomeHeroGeometry(page);
      normalHomeGeometry.set(variant.name, geometry);
      if (variant.name === '1440x900') {
        const geometryPassed = geometry
          && geometry.transform.identity
          && geometry.clipPath.none
          && geometry.rotate.identity
          && geometry.titleTransform.identity
          && geometry.titleClipPath.none
          && Math.abs(geometry.ratio - 1.6) <= .01
          && geometry.titleText.length > 0
          && geometry.titleAfter === 'none';
        recordHomeScreeningCheck('home-normal-final-hero-geometry', geometryPassed, geometry);
      }

      const viewportDir = resolve(outputDir, variant.name);
      await mkdir(viewportDir, { recursive: true });
      for (const act of homeActs) {
        const locator = page.locator(`[data-home-act="${act.value}"]`);
        await locator.evaluate((node) => {
          const root = document.documentElement;
          const previousBehavior = root.style.scrollBehavior;
          root.style.scrollBehavior = 'auto';
          node.scrollIntoView({ block: 'start', inline: 'nearest' });
          root.style.scrollBehavior = previousBehavior;
        });
        await page.waitForTimeout(80);
        const clearance = await inspectHomeActClearance(page, act.value, variant.viewport);
        if (!clearance.passed) {
          report.failures.push({ route: 'index', variant: variant.name, type: 'home-act-overlay', detail: clearance });
          report.summary.blockingFailures += 1;
        }
        const actReadiness = await waitForScreeningImages(page);
        report.homeScreening.readiness.push({ variant: variant.name, phase: `act-${act.value}`, ...actReadiness });
        await locator.screenshot({ path: resolve(viewportDir, `${act.file}.png`), animations: 'disabled' });
        report.homeScreening.actCaptures.push({ variant: variant.name, act: act.value, file: `${variant.name}/${act.file}.png`, clearance });
        report.summary.homeScreeningActScreenshotsCaptured += 1;
        report.summary.screenshotsCaptured += 1;
      }
      const fullFile = `${variant.fullName}.png`;
      await primeDeepLazyImages(page);
      await page.screenshot({ path: resolve(outputDir, fullFile), fullPage: true, animations: 'disabled' });
      report.homeScreening.fullCaptures.push({ variant: variant.name, reducedMotion: 'no-preference', file: fullFile });
      report.summary.homeScreeningFullScreenshotsCaptured += 1;
      report.summary.screenshotsCaptured += 1;

      if (variant.name === '1440x900') {
        const animationDisabled = await inspectAnimationDisabledVisibility(page);
        const visible = animationDisabled.acts.length === homeActs.length
          && animationDisabled.acts.every((act) => act.display !== 'none'
            && act.visibility !== 'hidden'
            && act.opacity >= .99
            && act.width > 0
            && act.height > 0
            && act.labelVisible
            && act.headingVisible
            && act.primaryEntryVisible)
          && animationDisabled.layoutSignatures.length === homeActs.length
          && animationDisabled.uniqueLayoutSignatures >= 6
          && animationDisabled.revealNodesHidden === 0;
        recordHomeScreeningCheck('home-animation-none-content-visible', visible, animationDisabled);
      }
    } catch (error) {
      const detail = { variant: variant.name, error: serializeError(error) };
      report.failures.push({ route: 'index', variant: variant.name, type: 'home-screening-capture', detail });
      report.summary.blockingFailures += 1;
    } finally {
      await context.close();
    }
  }

  let reducedWideGeometry = null;
  for (const variant of homeReducedVariants) {
    const context = await browser.newContext({
      viewport: variant.viewport,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    try {
      await page.goto(`${serverHandle.origin}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      const readiness = await waitForHomeScreeningReadiness(page);
      report.homeScreening.readiness.push({ variant: variant.name, phase: 'initial', ...readiness });
      const initialOverlay = await inspectHomeInitialOverlay(page, { motion: 'reduced', ...variant });
      report.homeScreening.initialOverlayInspections.push(initialOverlay);
      if (!initialOverlay.passed) {
        report.failures.push({ route: 'index', variant: variant.name, type: 'home-initial-overlay', detail: initialOverlay });
        report.summary.blockingFailures += 1;
      }
      if (variant.name === 'home-reduced-wide') reducedWideGeometry = await collectHomeHeroGeometry(page);
      const fullFile = `${variant.name}.png`;
      await primeDeepLazyImages(page);
      await page.screenshot({ path: resolve(outputDir, fullFile), fullPage: true, animations: 'disabled' });
      report.homeScreening.fullCaptures.push({ variant: variant.name, reducedMotion: 'reduce', file: fullFile });
      report.summary.homeScreeningFullScreenshotsCaptured += 1;
      report.summary.screenshotsCaptured += 1;
    } catch (error) {
      const detail = { variant: variant.name, error: serializeError(error) };
      report.failures.push({ route: 'index', variant: variant.name, type: 'home-screening-reduced-capture', detail });
      report.summary.blockingFailures += 1;
    } finally {
      await context.close();
    }
  }

  {
    const variant = { name: 'home-reduced-tablet', viewport: { width: 768, height: 1024 } };
    const context = await browser.newContext({ viewport: variant.viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto(`${serverHandle.origin}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      const readiness = await waitForHomeScreeningReadiness(page);
      report.homeScreening.readiness.push({ variant: variant.name, phase: 'initial-overlay-only', ...readiness });
      const initialOverlay = await inspectHomeInitialOverlay(page, { motion: 'reduced', ...variant });
      report.homeScreening.initialOverlayInspections.push(initialOverlay);
      if (!initialOverlay.passed) {
        report.failures.push({ route: 'index', variant: variant.name, type: 'home-initial-overlay', detail: initialOverlay });
        report.summary.blockingFailures += 1;
      }
    } catch (error) {
      const detail = { variant: variant.name, error: serializeError(error) };
      report.homeScreening.initialOverlayInspections.push({ variant: { motion: 'reduced', ...variant }, passed: false, error: detail.error });
      report.failures.push({ route: 'index', variant: variant.name, type: 'home-initial-overlay', detail });
      report.summary.blockingFailures += 1;
    } finally {
      await context.close();
    }
  }

  const normalWideGeometry = normalHomeGeometry.get('1440x900');
  const reducedGeometryPassed = Boolean(normalWideGeometry && reducedWideGeometry)
    && sameGeometryMatrix(normalWideGeometry.transform, reducedWideGeometry.transform)
    && normalWideGeometry.clipPath.none === reducedWideGeometry.clipPath.none
    && sameGeometryRotate(normalWideGeometry.rotate, reducedWideGeometry.rotate)
    && sameGeometryMatrix(normalWideGeometry.titleTransform, reducedWideGeometry.titleTransform)
    && normalWideGeometry.titleClipPath.none === reducedWideGeometry.titleClipPath.none
    && Math.abs(normalWideGeometry.width - reducedWideGeometry.width) <= .5
    && Math.abs(normalWideGeometry.height - reducedWideGeometry.height) <= .5
    && Math.abs(normalWideGeometry.ratio - reducedWideGeometry.ratio) <= .001
    && Math.abs(normalWideGeometry.titleWidth - reducedWideGeometry.titleWidth) <= .5
    && Math.abs(normalWideGeometry.titleHeight - reducedWideGeometry.titleHeight) <= .5;
  recordHomeScreeningCheck('home-reduced-final-hero-geometry', reducedGeometryPassed, { normal: normalWideGeometry, reduced: reducedWideGeometry });

  {
    const context = await browser.newContext({ viewport: { width: 320, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    let inspection;
    try {
      await page.goto(`${serverHandle.origin}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      const readiness = await waitForHomeScreeningReadiness(page);
      report.homeScreening.readiness.push({ variant: '320x844', phase: 'inspection', ...readiness });
      inspection = await inspectHome320(page);
      const passed = inspection.scrollWidth <= inspection.innerWidth + 1
        && inspection.overflowing.length === 0
        && inspection.undersized.length === 0
        && inspection.dockVisible
        && inspection.dockInFlow
        && inspection.cassetteOpenRect?.width >= 44
        && inspection.cassetteOpenRect?.height >= 44
        && inspection.overlaps.length === 0;
      recordHomeScreeningCheck('home-320-overflow-targets-dock', passed, inspection);
    } catch (error) {
      recordHomeScreeningCheck('home-320-overflow-targets-dock', false, { inspection, error: serializeError(error) });
    } finally {
      await context.close();
    }
  }

  const initialOverlayPassed = report.homeScreening.initialOverlayInspections.length === 6
    && report.homeScreening.initialOverlayInspections.every((inspection) => inspection.passed);
  const matrixPassed = report.summary.homeScreeningActScreenshotsCaptured === report.summary.homeScreeningActScreenshotsExpected
    && report.summary.homeScreeningFullScreenshotsCaptured === report.summary.homeScreeningFullScreenshotsExpected
    && initialOverlayPassed;
  recordHomeScreeningCheck('home-screening-capture-matrix', matrixPassed, {
    actCaptured: report.summary.homeScreeningActScreenshotsCaptured,
    actExpected: report.summary.homeScreeningActScreenshotsExpected,
    fullCaptured: report.summary.homeScreeningFullScreenshotsCaptured,
    fullExpected: report.summary.homeScreeningFullScreenshotsExpected,
    initialOverlayInspections: report.homeScreening.initialOverlayInspections,
    initialOverlayExpected: 6,
  });

  for (const check of deepLinkChecks) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    let result;
    try {
      await page.goto(`${serverHandle.origin}${check.path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);
      result = await page.evaluate(check.verify);
    } catch (error) {
      result = { passed: false, detail: serializeError(error) };
    }
    const entry = { name: check.name, path: check.path, passed: Boolean(result?.passed), detail: result?.detail ?? {} };
    report.deepLinks.push(entry);
    if (entry.passed) {
      report.summary.deepLinksPassed += 1;
    } else {
      report.failures.push({ route: check.name, variant: 'deep-link', type: 'deep-link-failed', detail: entry });
      report.summary.blockingFailures += 1;
    }
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    let entry;
    try {
      await page.goto(`${serverHandle.origin}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);
      const transitionMode = await page.evaluate(() => {
        const loader = document.querySelector('.hooxi-route-loader');
        sessionStorage.removeItem('__hooxiNativeViewTransition');
        addEventListener('pageswap', (event) => {
          sessionStorage.setItem('__hooxiNativeViewTransition', event.viewTransition ? 'observed' : 'missing');
        }, { once: true });
        return {
          native: Boolean(CSS.supports?.('view-transition-name: none'))
            && 'onpageswap' in window
            && matchMedia('(prefers-reduced-motion: no-preference)').matches
            && getComputedStyle(loader).display === 'none',
          loaderDisplay: getComputedStyle(loader).display,
        };
      });
      const navigation = page.waitForURL(`${serverHandle.origin}/mainline.html`, { timeout: 5_000 });
      await page.evaluate(() => document.querySelector('a[href="mainline.html"]')?.click());
      let leaving;
      if (transitionMode.native) {
        leaving = { mode: 'native-view-transition', state: 'native', ariaHidden: 'true', hasLeavingClass: false };
      } else {
        await page.waitForFunction(() => document.querySelector('.hooxi-route-loader')?.classList.contains('is-leaving'));
        leaving = await page.evaluate(() => {
          const loader = document.querySelector('.hooxi-route-loader');
          return {
            mode: 'route-loader',
            state: loader?.dataset.state ?? '',
            ariaHidden: loader?.getAttribute('aria-hidden') ?? '',
            hasLeavingClass: loader?.classList.contains('is-leaving') ?? false,
          };
        });
      }
      await navigation;
      await page.waitForTimeout(500);
      const arrived = await page.evaluate(() => ({
        path: location.pathname,
        signalFieldCount: document.querySelectorAll('.hooxi-signal-field').length,
        routeLoaderCount: document.querySelectorAll('.hooxi-route-loader').length,
        loaderState: document.querySelector('.hooxi-route-loader')?.dataset.state ?? '',
        loaderAriaHidden: document.querySelector('.hooxi-route-loader')?.getAttribute('aria-hidden') ?? '',
        nativeViewTransition: sessionStorage.getItem('__hooxiNativeViewTransition') ?? '',
      }));
      const departurePassed = transitionMode.native
        ? arrived.nativeViewTransition === 'observed'
        : leaving.hasLeavingClass && leaving.state === 'leaving' && leaving.ariaHidden === 'false';
      entry = {
        name: 'same-origin-route-loader',
        passed: departurePassed
          && arrived.path === '/mainline.html'
          && arrived.signalFieldCount === 1
          && arrived.routeLoaderCount === 1
          && arrived.loaderState === 'idle'
          && arrived.loaderAriaHidden === 'true',
        detail: { transitionMode, leaving, arrived },
      };
    } catch (error) {
      entry = { name: 'same-origin-route-loader', passed: false, detail: serializeError(error) };
    } finally {
      await context.close();
    }
    report.interactions.push(entry);
    if (entry.passed) {
      report.summary.interactionsPassed += 1;
    } else {
      report.failures.push({ route: entry.name, variant: 'interaction', type: 'interaction-failed', detail: entry });
      report.summary.blockingFailures += 1;
    }
  }
} catch (error) {
  report.failures.push({ route: null, variant: null, type: 'runner-error', detail: serializeError(error) });
  report.summary.blockingFailures += 1;
} finally {
  if (browser) {
    await browser.close().catch((error) => {
      report.failures.push({ route: null, variant: null, type: 'browser-close-error', detail: serializeError(error) });
      report.summary.blockingFailures += 1;
    });
  }
  if (serverHandle?.server) {
    await closeServer(serverHandle.server).catch((error) => {
      report.failures.push({ route: null, variant: null, type: 'server-close-error', detail: serializeError(error) });
      report.summary.blockingFailures += 1;
    });
  }

  report.summary.passed = report.summary.blockingFailures === 0;
  await writeFile(resolve(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify(report.summary, null, 2));
process.exitCode = report.summary.passed ? 0 : 1;
