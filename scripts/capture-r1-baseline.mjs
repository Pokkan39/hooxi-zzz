import { createReadStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Windows Git Bash/MSYS2: playwright-core may crash while setting process.title. */
process.title = 'pw';
const { chromium } = await import('playwright');

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
const outputDir = resolve(rootDir, process.env.HOOXI_UI_OUTPUT_DIR || `artifacts/ui-gate-${stamp}`);

const PUBLIC_ARCHIVE = 'PUBLIC_ARCHIVE';
const PUBLIC_PLAY = 'PUBLIC_PLAY';
const INTERNAL_TOOL = 'INTERNAL_TOOL';

const routes = [
  { name: 'index', path: '/index.html', family: PUBLIC_ARCHIVE },
  { name: 'mainline', path: '/mainline.html', family: PUBLIC_ARCHIVE },
  { name: 'stories-anby', path: '/stories.html?agent=anby', family: PUBLIC_ARCHIVE, storiesAgent: 'anby' },
  { name: 'stories-remielle', path: '/stories.html?agent=remielle', family: PUBLIC_ARCHIVE, storiesAgent: 'remielle' },
  { name: 'character-anby-default', path: '/character.html?id=anby', family: PUBLIC_ARCHIVE, character: { id: 'anby', art: 'default', foreground: 'portrait', credit: 'default' } },
  { name: 'character-remielle-default', path: '/character.html?id=remielle', family: PUBLIC_ARCHIVE, character: { id: 'remielle', art: 'default', foreground: 'portrait', credit: 'official-wiki', composition: 'exception' } },
  { name: 'character-aria-default', path: '/character.html?id=aria', family: PUBLIC_ARCHIVE, character: { id: 'aria', art: 'default', foreground: 'portrait' } },
  { name: 'character-sunna-default', path: '/character.html?id=sunna', family: PUBLIC_ARCHIVE, character: { id: 'sunna', art: 'default', foreground: 'portrait' } },
  { name: 'character-norma-gallery', path: '/character.html?id=norma', family: PUBLIC_ARCHIVE, character: { id: 'norma', art: 'gallery', foreground: 'portrait' } },
  { name: 'faction-cunning-hares', path: '/faction.html?id=cunning-hares', family: PUBLIC_ARCHIVE },
  { name: 'faction-covenant-of-dayat', path: '/faction.html?id=covenant-of-dayat', family: PUBLIC_ARCHIVE, factionSource: 'remielle-official-member-page' },
  { name: 'events', path: '/events.html', family: PUBLIC_ARCHIVE },
  { name: 'behind-scenes', path: '/behind-scenes.html', family: PUBLIC_ARCHIVE },
  { name: 'cultivate', path: '/cultivate.html', family: PUBLIC_ARCHIVE },
  { name: 'play', path: '/tape-wall-sample.html', family: PUBLIC_PLAY },
  { name: 'editor', path: '/editor.html', family: INTERNAL_TOOL },
];

const routeVariants = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' },
  { name: 'reduced-desktop', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
];

const homeReleaseVariants = [
  { name: 'home-320', viewport: { width: 320, height: 720 }, reducedMotion: 'no-preference' },
  { name: 'home-375', viewport: { width: 375, height: 812 }, reducedMotion: 'no-preference' },
  { name: 'home-390', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' },
  { name: 'home-414', viewport: { width: 414, height: 896 }, reducedMotion: 'no-preference' },
  { name: 'home-768', viewport: { width: 768, height: 900 }, reducedMotion: 'no-preference' },
  { name: 'home-1280', viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' },
  { name: 'home-1440', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
  { name: 'home-390-reduced', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
  { name: 'home-1440-reduced', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
];

const homeActVariants = [
  { name: 'wide', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
  { name: 'tablet', viewport: { width: 768, height: 1024 }, reducedMotion: 'no-preference' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' },
];

const homeFullVariants = [
  { name: 'home-full-wide', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
  { name: 'home-full-tablet', viewport: { width: 768, height: 1024 }, reducedMotion: 'no-preference' },
  { name: 'home-full-mobile', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' },
  { name: 'home-full-wide-reduced', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
  { name: 'home-full-mobile-reduced', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
];

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const report = {
  generatedAt: new Date().toISOString(),
  outputDir,
  screenshots: [],
  checks: [],
  failures: [],
  summary: {},
};

function detail(value) {
  if (typeof value === 'string') return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function check(scope, rule, passed, evidence = {}) {
  const entry = { scope, rule, passed: Boolean(passed), detail: detail(evidence) };
  report.checks.push(entry);
  if (!entry.passed) report.failures.push(entry);
  return entry.passed;
}

function checkBrowser(scope, results) {
  for (const result of results) check(scope, result.rule, result.passed, result.detail);
}

const characterPanelNames = ['media', 'lore', 'profile', 'related'];
const readCharacterTabState = page => page.evaluate((panelNames) => {
  const visible = (element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && Number.parseFloat(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
  };
  const tablist = document.querySelector('#dossier [role="tablist"], .character-module-nav[role="tablist"]');
  const tabs = tablist ? [...tablist.querySelectorAll('[role="tab"]')].filter((tab) => tab.closest('[role="tablist"]') === tablist) : [];
  const tabState = tabs.map((tab) => ({
    controls: tab.getAttribute('aria-controls') || '',
    selected: tab.getAttribute('aria-selected') || '',
    tabIndex: tab.tabIndex,
    focused: document.activeElement === tab,
  }));
  const panels = panelNames.map((id) => {
    const panel = document.getElementById(id);
    return {
      id,
      exists: panel instanceof HTMLElement,
      role: panel?.getAttribute('role') || '',
      hidden: panel instanceof HTMLElement ? panel.hidden : false,
      inert: panel instanceof HTMLElement ? (panel.inert === true || panel.hasAttribute('inert')) : false,
      visible: visible(panel),
    };
  });
  const selectedTabs = tabState.filter((tab) => tab.selected === 'true');
  const boundaryNodes = [...document.querySelectorAll('#artSource,#characterFooterSource,[data-rights-status],[data-unofficial-boundary]')];
  return {
    hash: location.hash,
    tablistExists: tablist instanceof HTMLElement,
    tabState,
    panels,
    selectedFocused: selectedTabs.length === 1 && selectedTabs[0].focused,
    visiblePanelIds: panels.filter((panel) => panel.visible).map((panel) => panel.id),
    boundaryCount: boundaryNodes.length,
    boundaryVisible: boundaryNodes.length >= 3 && boundaryNodes.every(visible),
    boundaryOutsidePanels: boundaryNodes.every((node) => !node.closest('[role="tabpanel"]') && !(tablist && tablist.contains(node))),
  };
}, characterPanelNames);
const characterTabStatePass = (state, expected, { focus = false, hash } = {}) => {
  const selected = state.tabState.filter((tab) => tab.selected === 'true');
  return state.tablistExists
    && JSON.stringify(state.tabState.map((tab) => tab.controls)) === JSON.stringify(characterPanelNames)
    && state.panels.every((panel) => panel.exists && panel.role === 'tabpanel')
    && selected.length === 1 && selected[0].controls === expected && selected[0].tabIndex === 0
    && state.tabState.filter((tab) => tab.controls !== expected).every((tab) => tab.selected === 'false' && tab.tabIndex === -1)
    && JSON.stringify(state.visiblePanelIds) === JSON.stringify([expected])
    && state.panels.find((panel) => panel.id === expected)?.hidden === false
    && state.panels.find((panel) => panel.id === expected)?.inert === false
    && state.panels.filter((panel) => panel.id !== expected).every((panel) => panel.hidden && panel.inert && !panel.visible)
    && (!focus || state.selectedFocused)
    && (hash === undefined || state.hash === hash)
    && state.boundaryVisible && state.boundaryOutsidePanels;
};

function safeName(value) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'capture';
}

function createStaticServer(root) {
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
        response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Method not allowed');
        return;
      }
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      const decodedPath = decodeURIComponent(requestUrl.pathname);
      const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^[/\\]+/, '');
      const filePath = resolve(root, relativePath);
      if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
        response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Forbidden');
        return;
      }
      const file = await stat(filePath);
      if (!file.isFile()) throw new Error('Not a file');
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-length': file.size,
        'content-type': mimeTypes.get(extname(filePath).toLowerCase()) || 'application/octet-stream',
      });
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      createReadStream(filePath).on('error', () => response.destroy()).pipe(response);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}

async function listen(server) {
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Static server did not expose a TCP address');
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolveClose) => server.close(() => resolveClose()));
}

function isAllowedEditorSession(route, rawUrl) {
  if (route.family !== INTERNAL_TOOL) return false;
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'http:'
      && url.hostname === 'localhost'
      && url.port === '3001'
      && url.pathname === '/api/auth/session'
      && url.search === '';
  } catch {
    return false;
  }
}

function makeMonitor(page, route, baseUrl) {
  const state = { pageErrors: [], consoleErrors: [], requestFailures: [], httpErrors: [], externalRequests: [], allowedEditorSession: [], allowIntentionalNavigationAborts: false };
  const baseOrigin = new URL(baseUrl).origin;
  const classify = (rawUrl) => {
    try {
      const url = new URL(rawUrl);
      if (url.origin === baseOrigin || url.protocol === 'data:' || url.protocol === 'blob:') return 'local';
      if (isAllowedEditorSession(route, rawUrl)) return 'editor-session';
      return 'external';
    } catch {
      return 'external';
    }
  };

  page.on('pageerror', (error) => state.pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    const record = { text: message.text(), url: location.url || '', line: location.lineNumber || 0 };
    const exactOfflineSessionConsole = route.family === INTERNAL_TOOL
      && record.text.includes('http://localhost:3001/api/auth/session')
      && /CORS policy|Failed to fetch|ERR_CONNECTION_REFUSED|NetworkError/i.test(record.text);
    if (isAllowedEditorSession(route, record.url) || exactOfflineSessionConsole) {
      state.allowedEditorSession.push({ type: 'console', ...record, url: 'http://localhost:3001/api/auth/session' });
      return;
    }
    state.consoleErrors.push(record);
  });
  page.on('requestfailed', (request) => {
    const record = { url: request.url(), resourceType: request.resourceType(), error: request.failure()?.errorText || 'request failed' };
    if (classify(record.url) === 'editor-session') state.allowedEditorSession.push({ type: 'requestfailed', ...record });
    else if (state.allowIntentionalNavigationAborts && classify(record.url) === 'local' && record.resourceType !== 'document' && /ERR_ABORTED/i.test(record.error)) return;
    else state.requestFailures.push(record);
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    const record = { url: response.url(), status: response.status(), resourceType: response.request().resourceType() };
    if (classify(record.url) === 'editor-session') state.allowedEditorSession.push({ type: 'http', ...record });
    else state.httpErrors.push(record);
  });
  page.on('request', (request) => {
    const classification = classify(request.url());
    if (classification === 'external') state.externalRequests.push({ url: request.url(), resourceType: request.resourceType() });
    if (classification === 'editor-session') state.allowedEditorSession.push({ type: 'request', url: request.url(), resourceType: request.resourceType() });
  });

  return {
    allowIntentionalNavigationAborts() {
      state.allowIntentionalNavigationAborts = true;
    },
    audit(scope) {
      check(scope, 'no-pageerror', state.pageErrors.length === 0, state.pageErrors);
      check(scope, 'no-unexpected-console-error', state.consoleErrors.length === 0, state.consoleErrors);
      check(scope, 'no-local-http-error', state.httpErrors.length === 0, state.httpErrors);
      check(scope, 'no-request-failure', state.requestFailures.length === 0, state.requestFailures);
      check(scope, 'no-external-runtime-resource', state.externalRequests.length === 0, state.externalRequests);
      if (route.family === INTERNAL_TOOL) {
        const invalidEditorEvents = state.allowedEditorSession.filter((entry) => !isAllowedEditorSession(route, entry.url));
        check(scope, 'editor-only-allows-exact-localhost-session-offline', invalidEditorEvents.length === 0, invalidEditorEvents);
      }
    },
  };
}

async function waitForVisualReadiness(page) {
  await page.waitForSelector('main', { state: 'attached', timeout: 12_000 });
  await page.evaluate(async () => {
    const timeout = (ms) => new Promise((resolveTimeout) => setTimeout(resolveTimeout, ms));
    if (document.fonts?.ready) await Promise.race([document.fonts.ready, timeout(5_000)]);
    const visibleLocalImages = [...document.images].filter((image) => {
      const src = image.currentSrc || image.src;
      if (!src || !src.startsWith(location.origin)) return false;
      const rect = image.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
    });
    visibleLocalImages.forEach((image) => {
      image.loading = 'eager';
    });
    await Promise.race([
      Promise.all(visibleLocalImages.map(async (image) => {
        if (!image.complete || image.naturalWidth <= 0) {
          await new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          });
        }
        if (typeof image.decode === 'function') {
          await image.decode().catch(() => {});
        }
      })),
      new Promise((resolve) => setTimeout(resolve, 12_000)),
    ]);
  });
  const readiness = await page.evaluate(() => {
    const visibleLocalImages = [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      const src = image.currentSrc || image.src;
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth
        && (src.startsWith(location.origin) || src.startsWith('data:'));
    });
    return {
      fonts: document.fonts ? document.fonts.status : 'unsupported',
      images: visibleLocalImages.map((image) => ({ src: image.currentSrc || image.src, complete: image.complete, width: image.naturalWidth })),
    };
  });
  return readiness;
}

async function waitForFullPageImages(page) {
  await page.evaluate(async () => {
    const pause = (ms) => new Promise((resolvePause) => setTimeout(resolvePause, ms));
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    for (let top = 0; top < height; top += Math.max(320, innerHeight - 120)) {
      scrollTo(0, top);
      await pause(40);
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(100);
  const state = await page.evaluate(() => [...document.images].filter((image) => {
    const style = getComputedStyle(image);
    const rect = image.getBoundingClientRect();
    const src = image.currentSrc || image.src;
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
      && (src.startsWith(location.origin) || src.startsWith('data:'));
  }).map((image) => ({ src: image.currentSrc || image.src, complete: image.complete, width: image.naturalWidth })));
  return state;
}

async function openPage(browser, baseUrl, route, variant, path = route.path) {
  const context = await browser.newContext({
    viewport: variant.viewport,
    reducedMotion: variant.reducedMotion,
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: false,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(20_000);
  const monitor = makeMonitor(page, route, baseUrl);
  const url = `${baseUrl}${path}`;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    check(`${route.name}/${variant.name}`, 'navigation-returns-success', Boolean(response && response.ok()), { url, status: response?.status() ?? null });
    await page.waitForLoadState('load', { timeout: 8_000 }).catch(() => undefined);
    const readiness = await waitForVisualReadiness(page);
    check(`${route.name}/${variant.name}`, 'fonts-and-visible-local-images-ready', readiness.fonts !== 'loading' && readiness.images.every((image) => image.complete && image.width > 0), readiness);
  } catch (error) {
    check(`${route.name}/${variant.name}`, 'navigation-and-visual-readiness', false, { url, error: error.message });
  }
  return { context, page, monitor };
}

async function closePage(session, scope) {
  session.monitor.audit(scope);
  await session.context.close();
}

async function runCommonContract(page, route, scope) {
  const results = await page.evaluate((family) => {
    const normalized = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const bodyText = normalized(document.body.textContent).toLowerCase();
    const sourceNode = document.querySelector('#sources, #pageSources, [data-source-section], [data-sources], [data-source-block], .page-sources, .source-notes');
    const rightsNode = document.querySelector('#rights, #copyright, [data-rights], [data-unofficial-boundary], footer');
    const skipLinks = [...document.querySelectorAll('a.skip-link[href^="#"], a[data-skip-link][href^="#"], a.character-dossier-link[href="#dossier"]')]
      .filter((link) => Boolean(document.getElementById(decodeURIComponent(link.hash.slice(1)))));
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1;
    const h1Count = document.querySelectorAll('h1').length;
    const publicBoundary = /粉丝\s*非官方|非官方/.test(bodyText) && /无隶属|不隶属|未获.*授权|没有.*关系/.test(bodyText);
    return [
      { rule: 'exactly-one-main', passed: document.querySelectorAll('main').length === 1, detail: { count: document.querySelectorAll('main').length } },
      { rule: 'no-horizontal-overflow', passed: !overflow, detail: { viewport: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth } },
      ...(family === 'INTERNAL_TOOL' ? [{
        rule: 'editor-is-noindex',
        passed: [...document.querySelectorAll('meta[name="robots" i]')].some((node) => /(^|[,\s])noindex($|[,\s])/.test(node.content.toLowerCase())),
        detail: [...document.querySelectorAll('meta[name="robots" i]')].map((node) => node.content),
      }] : [
        { rule: 'public-page-has-skip-link', passed: skipLinks.length > 0, detail: { count: skipLinks.length, hrefs: skipLinks.map((node) => node.getAttribute('href')) } },
        { rule: 'public-page-has-exactly-one-h1', passed: h1Count === 1, detail: { count: h1Count } },
        { rule: 'public-page-has-source-node', passed: Boolean(sourceNode), detail: { selector: sourceNode?.id || sourceNode?.className || null } },
        { rule: 'public-page-has-rights-node', passed: Boolean(rightsNode), detail: { selector: rightsNode?.id || rightsNode?.className || null } },
        { rule: 'public-page-states-unofficial-and-no-affiliation', passed: publicBoundary, detail: { hasUnofficial: /粉丝\s*非官方|非官方/.test(bodyText), hasNoAffiliation: /无隶属|不隶属|未获.*授权|没有.*关系/.test(bodyText) } },
      ]),
    ];
  }, route.family);
  checkBrowser(scope, results);
}

async function runHomeContract(page, scope, variant) {
  const results = await page.evaluate(({ reduced, approvedSources }) => {
    const normalized = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const slides = [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')];
    const heroSources = slides.map((slide) => slide.querySelector('img')?.getAttribute('src') || '');
    const sourcePolicies = heroSources.map((source, index) => {
      try {
        const url = new URL(source, location.href);
        return url.origin === location.origin && url.pathname.startsWith('/assets/') && url.pathname.replace(/^\/+/, '') === approvedSources[index];
      } catch { return false; }
    });
    const indexNodes = document.querySelectorAll('#heroCarouselIndex');
    const pauseNodes = document.querySelectorAll('#heroCarouselPause');
    const pause = pauseNodes[0];
    const pauseBox = pause?.getBoundingClientRect();
    const status = document.querySelector('#heroCarouselStatus');
    const describedBy = (pause?.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    const acts = [...document.querySelectorAll('[data-home-act]')];
    const actValues = acts.map((node) => node.dataset.homeAct || '');
    const activeSlides = slides.filter((slide) => slide.classList.contains('is-active'));
    const mainEntry = [...document.querySelectorAll('a[href]')].find((node) => /mainline\.html|stories\.html/.test(node.getAttribute('href') || ''));
    const playEntry = [...document.querySelectorAll('a[href]')].find((node) => /tape-wall-sample\.html/.test(node.getAttribute('href') || ''));
    const characterEntry = [...document.querySelectorAll('a[href]')].find((node) => /character\.html\?id=/.test(node.getAttribute('href') || ''));
    const overlapPairs = acts.slice(0, -1).map((act, index) => {
      const current = act.getBoundingClientRect();
      const next = acts[index + 1].getBoundingClientRect();
      return { current: act.dataset.homeAct, next: acts[index + 1].dataset.homeAct, overlap: current.bottom > next.top + 1 };
    }).filter((pair) => pair.overlap);
    const mobileTargets = innerWidth <= 414
      ? [document.querySelector('#homeNavToggle'), document.querySelector('.home-page .topbar > .icon-button:last-child')].filter(Boolean)
      : [];
    const undersizedRequiredTargets = [pause, ...mobileTargets].filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    }).map((node) => ({ selector: node.id || node.className, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
    const statusText = normalized(status?.textContent);
    /* 楼层编号导航：编号必须连续、必须对读屏隐藏（阵营/栏目语义由 h2 承担），
       且不得与旧伪元素编号并存造成重复朗读或重复显示。 */
    const navNums = [...document.querySelectorAll('.section-nav-num')].map((node) => normalized(node.textContent));
    const navHidden = [...document.querySelectorAll('.section-nav')].every((node) => node.getAttribute('aria-hidden') === 'true');
    // Hero 的 01 由 .hero::before 水印承担，不再单独放编号节点；若存在则必须是装饰
    const heroNum = document.querySelector('.hero-nav-num');
    const heroNumHidden = !heroNum || heroNum.getAttribute('aria-hidden') === 'true';
    const legacyNumPseudo = ['#finder .section-head', '#featured-agents .section-head', '#archive-reels .section-head']
      .map((selector) => document.querySelector(selector))
      .filter(Boolean)
      .map((node) => getComputedStyle(node, '::after').content)
      .filter((content) => content && content !== 'none' && content !== 'normal');
    /* Hero 的 01 由 .hero::before 巨型水印承担，楼层编号从 02 起递增。
       只校验连续性，不锁定起始值，避免首楼层编号归属变化时误报。 */
    const numsSequential = navNums.length > 0
      && navNums.every((text, index) => /^\d{2}$/.test(text) && Number(text) === Number(navNums[0]) + index);
    return [
      { rule: 'home-floor-numbers-are-sequential-and-decorative', passed: numsSequential && navHidden && heroNumHidden && legacyNumPseudo.length === 0, detail: { navNums, navHidden, heroNumHidden, legacyNumPseudo } },
      { rule: 'home-has-four-approved-local-hero-images', passed: slides.length === 4 && sourcePolicies.length === 4 && sourcePolicies.every(Boolean), detail: { heroSources, sourcePolicies } },
      { rule: 'home-has-one-static-index-and-one-pause-control', passed: indexNodes.length === 1 && pauseNodes.length === 1 && indexNodes[0].tagName !== 'OUTPUT' && indexNodes[0].getAttribute('aria-live') === null, detail: { indexes: indexNodes.length, pauses: pauseNodes.length, indexTag: indexNodes[0]?.tagName || '', indexLive: indexNodes[0]?.getAttribute('aria-live') ?? null } },
      { rule: 'home-exposes-pause-status-to-pause-control', passed: Boolean(status && pause && describedBy.includes(status.id) && statusText), detail: { describedBy, statusText } },
      { rule: 'home-has-current-unique-data-home-acts', passed: acts.length > 0 && actValues.every(Boolean) && new Set(actValues).size === acts.length, detail: actValues },
      { rule: 'home-exposes-exactly-one-current-slide', passed: activeSlides.length === 1, detail: { activeSlides: activeSlides.map((slide) => slide.dataset.heroSlide) } },
      { rule: 'home-required-controls-are-at-least-44px', passed: undersizedRequiredTargets.length === 0, detail: undersizedRequiredTargets },
      { rule: 'home-acts-do-not-overlap', passed: overlapPairs.length === 0, detail: overlapPairs },
      { rule: 'home-main-play-and-character-entries-exist', passed: Boolean(mainEntry && playEntry && characterEntry), detail: { main: mainEntry?.getAttribute('href') || null, play: playEntry?.getAttribute('href') || null, character: characterEntry?.getAttribute('href') || null } },
      ...(reduced ? [{ rule: 'home-reduced-motion-keeps-carousel-paused', passed: /减动效|减少动态效果/.test(statusText) && activeSlides[0]?.dataset.heroSlide === '0', detail: { statusText, active: activeSlides[0]?.dataset.heroSlide || null } }] : []),
    ];
  }, {
    reduced: variant.reducedMotion === 'reduce',
    approvedSources: [
      'assets/hero/zzz-random-play-keyart.webp',
      'assets/gallery/miyabi/05.webp',
      'assets/gallery/harumasa/04.webp',
      'assets/gallery/aria/01.webp',
    ],
  });
  checkBrowser(scope, results);
}

async function runStoriesContract(page, scope, mobile, expectedAgent = 'anby') {
  const results = await page.evaluate(({ isMobile, targetAgent }) => {
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
    };
    const box = (element) => {
      const rect = element?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
    };
    const disjoint = (first, second) => Boolean(first && second
      && (first.right <= second.left + 1 || second.right <= first.left + 1
        || first.bottom <= second.top + 1 || second.bottom <= first.top + 1));
    const sidebar = document.querySelector('.site-sidebar');
    const workbench = document.querySelector('#agentWorkbench');
    const stage = workbench?.querySelector('[data-character-stage], .agent-selected-stage');
    const category = workbench?.querySelector('.agent-category-menu');
    const directory = workbench?.querySelector('[data-agent-directory], .agent-roster-panel');
    const cards = [...(workbench?.querySelectorAll('#agentGrid [data-agent-id]') || [])];
    const selected = workbench?.querySelector('#agentGrid [data-agent-id][aria-current="true"]');
    const art = [...(workbench?.querySelectorAll('.agent-stage-art > img') || [])];
    const foreground = [...(workbench?.querySelectorAll('.agent-stage-portrait > img') || [])];
    const primaryLink = workbench?.querySelector('#selectedAgentPrimaryLink');
    const factionLink = workbench?.querySelector('#selectedAgentFaction');
    const selectedName = workbench?.querySelector('#selectedAgentName');
    const targetCardImage = workbench?.querySelector(`#agentGrid [data-agent-id="${targetAgent}"] img`);
    const expectedArtPath = `assets/mindscape/default/${targetAgent}.webp`;
    const expectedPortraitPath = `assets/portraits/${targetAgent}-portrait.webp`;
    const expectedCardPath = `assets/portraits/${targetAgent}-card.webp`;
    const entrances = [...(workbench?.querySelectorAll('a[href],button') || [])]
      .filter((element) => /^(基础|技能|装备)$/.test((element.querySelector('b')?.textContent || element.textContent || '').replace(/\s+/g, ' ').trim()));
    const directoryTitle = [...(directory?.querySelectorAll('h2,h3,[data-directory-title]') || [])]
      .find((element) => /选择代理人|代理人名录|代理人/.test(element.textContent || ''));
    const resultCount = [...document.querySelectorAll('#agentResultCount,[data-result-count],output')].find(visible);
    const totalCount = document.querySelector('#agentTotalCount');
    const sidebarBox = box(sidebar);
    const stageBox = box(stage);
    const categoryBox = box(category);
    const directoryBox = box(directory);
    const desktopRegions = [sidebarBox, stageBox, directoryBox];
    const desktopThreeColumn = desktopRegions.every((region) => region && region.top < innerHeight && region.bottom > 0)
      && Math.min(...desktopRegions.map((region) => region.bottom)) > Math.max(...desktopRegions.map((region) => region.top))
      && sidebarBox.right <= stageBox.left + 1 && stageBox.right <= directoryBox.left + 1
      && disjoint(sidebarBox, stageBox) && disjoint(stageBox, directoryBox) && disjoint(sidebarBox, directoryBox);
    const internalScrollTraps = [...(workbench?.querySelectorAll('*') || [])].filter((element) => {
      const style = getComputedStyle(element);
      return (/^(auto|scroll)$/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1)
        || (/^(auto|scroll)$/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1);
    });
    const mobileNaturalFlow = [stageBox, categoryBox, directoryBox].every(Boolean)
      && stageBox.bottom <= categoryBox.top + 1 && categoryBox.bottom <= directoryBox.top + 1
      && disjoint(stageBox, categoryBox) && disjoint(categoryBox, directoryBox)
      && [stage, category, directory].every((element) => !['fixed', 'sticky', 'absolute'].includes(getComputedStyle(element).position))
      && internalScrollTraps.length === 0;
    const rosterScrollBox = box(document.querySelector('#agentRosterScroll'));
    const intersects = (first, second) => Boolean(first && second && first.right > second.left && first.left < second.right && first.bottom > second.top && first.top < second.bottom);
    const viewportBox = { left:0, right:innerWidth, top:0, bottom:innerHeight };
    const cardGeometry = cards.map((card) => {
      const cardBox = box(card);
      const image = card.querySelector('img,picture img');
      const imageBox = box(image);
      const imageUrl = image?.getAttribute('src') ? new URL(image.getAttribute('src'), location.href) : null;
      const visibleForLoad = intersects(cardBox, viewportBox) && (!rosterScrollBox || intersects(cardBox, rosterScrollBox));
      return {
        width: cardBox?.width || 0,
        height: cardBox?.height || 0,
        imageCoverage: imageBox && cardBox?.width > 0 && cardBox.height > 0
          ? (Math.min(imageBox.width, cardBox.width) * Math.min(imageBox.height, cardBox.height)) / (cardBox.width * cardBox.height) : 0,
        imageLoaded: image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        visibleForLoad,
        portraitSrc:image?.getAttribute('src') || '',
        sameOriginLocalPortrait:Boolean(imageUrl && imageUrl.origin === location.origin && /^\/assets\/portraits\/[^/]+-card\.webp$/.test(imageUrl.pathname)),
      };
    });
    const median = (values) => values.length ? values.sort((a, b) => a - b)[Math.floor(values.length / 2)] : 0;
    const medianWidth = median(cardGeometry.map((item) => item.width));
    const medianHeight = median(cardGeometry.map((item) => item.height));
    const minimumCardWidth = innerWidth <= 320 ? 112 : 140;
    const personDominantGrid = cards.length === 57
      && cardGeometry.every((item) => item.sameOriginLocalPortrait && item.imageCoverage >= .5 && (!item.visibleForLoad || item.imageLoaded))
      && medianWidth >= minimumCardWidth && medianHeight >= medianWidth * 1.25;
    const imageState = [...art, ...foreground].map((image) => ({ src: image.getAttribute('src') || '', complete: image.complete, width: image.naturalWidth }));
    const foregroundPath = foreground[0]?.getAttribute('src') || '';
    const disclosure = document.querySelector('details[data-archive-disclosure]');
    const disclosureStable = document.querySelectorAll('details[data-archive-disclosure]').length === 1
      && disclosure?.id === 'agentFilterDisclosure'
      && Boolean(disclosure.querySelector(':scope > summary')?.textContent.trim())
      && Boolean(disclosure.querySelector(':scope > #agentSearchForm #agentSearch'));
    return [
      { rule: 'stories-has-57-agents-and-18-factions', passed: cards.length === 57 && document.querySelectorAll('#factionFilter option').length === 19 && totalCount?.textContent.trim() === '57' && resultCount?.textContent.trim() === '57', detail: { cards: cards.length, factionOptions: document.querySelectorAll('#factionFilter option').length, total: totalCount?.textContent.trim() || '', result: resultCount?.textContent.trim() || '' } },
      { rule: 'stories-loads-site-sidebar-stage-three-entries-and-person-directory', passed: visible(sidebar) && visible(stage) && entrances.length === 3 && entrances.every(visible) && visible(directory) && visible(directoryTitle) && visible(resultCount) && personDominantGrid, detail: { sidebar: visible(sidebar), stage: visible(stage), entrances: entrances.map((element) => (element.textContent || '').replace(/\s+/g, ' ').trim()), directory: visible(directory), directoryTitle: visible(directoryTitle), resultCount: visible(resultCount), personDominantGrid, minimumCardWidth, medianWidth, medianHeight, visibleCardImages:cardGeometry.filter((item) => item.visibleForLoad).length, unloadedVisibleCardImages:cardGeometry.filter((item) => item.visibleForLoad && !item.imageLoaded).map((item) => item.portraitSrc), invalidPortraitSources:cardGeometry.filter((item) => !item.sameOriginLocalPortrait).map((item) => item.portraitSrc), minImageCoverage: cardGeometry.length ? Math.min(...cardGeometry.map((item) => item.imageCoverage)) : 0 } },
      { rule: 'stories-uses-one-native-filter-disclosure', passed: disclosureStable, detail: { count:document.querySelectorAll('details[data-archive-disclosure]').length, id:disclosure?.id || '', summary:(disclosure?.querySelector(':scope > summary')?.textContent || '').trim(), form:Boolean(disclosure?.querySelector(':scope > #agentSearchForm #agentSearch')) } },
      { rule: isMobile ? 'stories-mobile-three-part-workbench-uses-natural-flow-without-scroll-traps' : 'stories-desktop-three-part-workbench-is-same-fold-and-disjoint', passed: document.documentElement.scrollWidth <= innerWidth + 1 && (isMobile ? mobileNaturalFlow : desktopThreeColumn), detail: { sidebarBox, stageBox, categoryBox, directoryBox, desktopThreeColumn, mobileNaturalFlow, horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, internalScrollTraps: internalScrollTraps.map((node) => node.className || node.id || node.tagName) } },
      { rule: 'stories-selected-agent-has-one-loaded-approved-keyart-and-one-foreground', passed: art.length === 1 && foreground.length === 1 && imageState.every((image) => image.complete && image.width > 0) && stage?.dataset.characterArtSource === 'default' && stage?.dataset.characterArtPath === expectedArtPath && stage?.dataset.portraitSource === 'portrait' && foregroundPath === expectedPortraitPath, detail: { targetAgent, artSource: stage?.dataset.characterArtSource || '', artPath: stage?.dataset.characterArtPath || '', portraitSource: stage?.dataset.portraitSource || '', foregroundPath, imageState } },
      { rule: 'stories-default-and-gallery-paths-use-current-resolver-contract', passed: stage?.dataset.characterArtSource === 'default' && /^assets\/mindscape\/default\/[a-z0-9-]+\.webp$/.test(stage?.dataset.characterArtPath || '') && /^(portrait|card-fallback)$/.test(stage?.dataset.portraitSource || '') && /^assets\/portraits\/[a-z0-9-]+-(?:portrait|card)\.webp$/.test(foregroundPath), detail: { artSource: stage?.dataset.characterArtSource || '', artPath: stage?.dataset.characterArtPath || '', portraitSource: stage?.dataset.portraitSource || '', foregroundPath } },
      { rule: 'stories-url-selection-is-present', passed: selected?.dataset.agentId === targetAgent && new URL(location.href).searchParams.get('agent') === targetAgent, detail: { targetAgent, selected: selected?.dataset.agentId || null, query: new URL(location.href).searchParams.get('agent') } },
      ...(targetAgent === 'remielle' ? [{ rule: 'stories-remielle-links-and-default-portrait-card-assets-are-exact', passed: (selectedName?.textContent || '').trim() === '蕾米埃尔·丹' && primaryLink?.getAttribute('href') === 'character.html?id=remielle' && factionLink?.getAttribute('href') === 'faction.html?id=covenant-of-dayat' && stage?.dataset.characterArtPath === expectedArtPath && foregroundPath === expectedPortraitPath && targetCardImage?.getAttribute('src') === expectedCardPath, detail: { name:(selectedName?.textContent || '').trim(), primary:primaryLink?.getAttribute('href') || '', faction:factionLink?.getAttribute('href') || '', art:stage?.dataset.characterArtPath || '', portrait:foregroundPath, card:targetCardImage?.getAttribute('src') || '' } }] : []),
    ];
  }, { isMobile:mobile, targetAgent:expectedAgent });
  checkBrowser(scope, results);
}

async function runCharacterContract(page, scope, character) {
  const expected = {
    ...character,
    composition: character.composition || 'default',
    credit: character.credit || (character.art === 'gallery' ? 'gallery' : 'default'),
    artPath: character.art === 'gallery' ? 'assets/gallery/norma/05.png' : `assets/mindscape/default/${character.id}.webp`,
    foregroundPath: `assets/portraits/${character.id}-${character.foreground}.webp`,
  };
  const results = await page.evaluate((target) => {
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number.parseFloat(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
    };
    const text = (element) => (element?.innerText || element?.textContent || '').replace(/\s+/g, ' ').trim();
    const art = document.querySelector('#art[data-character-art-source]');
    const keyart = document.querySelector('.d-keyart[data-character-art-source]');
    const keyartImage = document.querySelector('.d-keyart-image');
    const portrait = document.querySelector('#characterHeroPortrait');
    const englishName = document.querySelector('#characterEnglishName');
    const catalog = window.archiveData?.characters || [];
    const expectedEnglishName = catalog.find((item) => item.id === target.id)?.englishName?.trim() || '';
    const invalidCatalogEnglishNames = catalog.filter((item) => {
      const value = (item.englishName || '').trim();
      return !value || value === (item.id || '').trim() || value === (item.name || '').trim();
    }).map((item) => ({ id:item.id || '', name:item.name || '', englishName:item.englishName || '' }));
    const modules = [...document.querySelectorAll('#characterContent .character-module')];
    const moduleIds = modules.map((module) => module.id);
    const moduleHeadings = modules.map((module) => ({ kicker:text(module.querySelector('.character-module-head > span')), title:text(module.querySelector('.character-module-head > h2')) }));
    const sourceCard = document.querySelector('#artSource.character-art-credit');
    const activeCredit = [...(sourceCard?.querySelectorAll('[data-character-art-credit]') || [])].find(visible);
    const boundaryText = `${text(activeCredit)} ${text(document.querySelector('#characterFooterSource'))} ${text(document.querySelector('[data-unofficial-boundary]'))}`;
    const creditHref = activeCredit?.querySelector('a[data-source-action], a[href]')?.getAttribute('href') || '';
    const legacyVisible = ['.zzz-roster', '.zzz-watermark', '.zzz-idcard', '.zzz-edge', '.zzz-hud', '.character-hud', '.agent-roster-panel', '[data-character-watermark]']
      .filter((selector) => visible(document.querySelector(selector)));
    const defaultCredit = activeCredit?.dataset.characterArtCredit === 'default'
      && /Toastertjie/.test(boundaryText)
      && /Steam Workshop\s*3491187965/.test(boundaryText)
      && /许可|授权/.test(boundaryText)
      && /版权归米哈游/.test(boundaryText)
      && creditHref === 'https://steamcommunity.com/sharedfiles/filedetails/?id=3491187965';
    const officialWikiCredit = activeCredit?.dataset.characterArtCredit === 'official-wiki'
      && /米哈游.*百科/.test(boundaryText)
      && /版权归米哈游/.test(boundaryText)
      && !/Toastertjie|Steam/i.test(boundaryText)
      && creditHref === 'https://baike.mihoyo.com/zzz/wiki/content/2076/detail?mhy_presentation_style=fullscreen';
    const galleryCredit = activeCredit?.dataset.characterArtCredit === 'gallery'
      && /官方\s*gallery/i.test(boundaryText)
      && /版权归米哈游/.test(boundaryText)
      && /粉丝非官方/.test(boundaryText)
      && !/Toastertjie/.test(boundaryText)
      && !creditHref;
    return [
      { rule: `character-${target.id}-resolves-approved-${target.art}-keyart`, passed: art?.dataset.characterArtSource === target.art && art?.dataset.characterArtPath === target.artPath && keyart?.dataset.characterArtSource === target.art && keyart?.dataset.characterArtPath === target.artPath && keyartImage?.getAttribute('src') === target.artPath && keyartImage?.complete && keyartImage?.naturalWidth > 0, detail: { artSource: art?.dataset.characterArtSource || '', artPath: art?.dataset.characterArtPath || '', keyartSource: keyart?.dataset.characterArtSource || '', keyartPath: keyart?.dataset.characterArtPath || '', image: keyartImage?.getAttribute('src') || '', loaded: Boolean(keyartImage?.complete && keyartImage?.naturalWidth > 0) } },
      { rule: `character-${target.id}-resolves-loaded-${target.foreground}-foreground`, passed: art?.dataset.heroComposition === target.composition && art?.dataset.heroPortrait === 'foreground' && portrait?.dataset.portraitSource === target.foreground && portrait?.dataset.portraitPath === target.foregroundPath && portrait?.getAttribute('src') === target.foregroundPath && portrait?.complete && portrait?.naturalWidth > 0 && (target.foreground === 'card' ? /角色卡图/.test(portrait.alt) : /全身立绘/.test(portrait.alt)), detail: { heroComposition: art?.dataset.heroComposition || '', heroPortrait: art?.dataset.heroPortrait || '', source: portrait?.dataset.portraitSource || '', path: portrait?.dataset.portraitPath || '', src: portrait?.getAttribute('src') || '', alt: portrait?.alt || '', loaded: Boolean(portrait?.complete && portrait?.naturalWidth > 0) } },
      { rule: 'character-exposes-real-english-name-and-one-shot-text-motion-state', passed: Boolean(expectedEnglishName) && visible(englishName) && !englishName.hidden && englishName.lang === 'en' && (englishName.textContent || '').trim() === expectedEnglishName && art?.dataset.characterTextMotion === 'enter' && moduleHeadings.length === 4 && moduleHeadings.every((heading) => heading.kicker && heading.title), detail: { expectedEnglishName, renderedEnglishName:(englishName?.textContent || '').trim(), hidden:englishName?.hidden ?? null, lang:englishName?.lang || '', motion:art?.dataset.characterTextMotion || '', moduleHeadings } },
      { rule: 'character-anby-english-name-oracle-is-canonical', passed: target.id !== 'anby' || ((englishName?.textContent || '').trim() === 'Anby Demara' && expectedEnglishName === 'Anby Demara'), detail: { character:target.id, expectedEnglishName, renderedEnglishName:(englishName?.textContent || '').trim() } },
      { rule: 'character-catalog-has-distinct-nonempty-english-names', passed: catalog.length > 0 && invalidCatalogEnglishNames.length === 0, detail: { catalogSize:catalog.length, invalidCatalogEnglishNames } },
      { rule: 'character-keeps-four-archive-panels-in-dom', passed: JSON.stringify(moduleIds) === JSON.stringify(['media', 'lore', 'profile', 'related']), detail: { moduleIds } },
      { rule: 'character-has-correct-source-license-copyright-and-unofficial-boundary', passed: visible(sourceCard) && visible(activeCredit) && (target.credit === 'gallery' ? galleryCredit : target.credit === 'official-wiki' ? officialWikiCredit : defaultCredit), detail: { expectedCredit:target.credit, creditMode: activeCredit?.dataset.characterArtCredit || '', boundaryText, creditHref, defaultCredit, officialWikiCredit, galleryCredit } },
      { rule: 'character-does-not-render-legacy-xray-roster-hud-watermark', passed: legacyVisible.length === 0, detail: legacyVisible },
    ];
  }, expected);
  checkBrowser(scope, results);
  const tabState = await readCharacterTabState(page);
  check(scope, 'character-defaults-to-media-with-one-visible-inert-synchronized-panel-and-persistent-boundary',
    characterTabStatePass(tabState, 'media', { hash: '' }), tabState);
}

async function runRecordStackContract(page, scope, kind) {
  const results = await page.evaluate((pageKind) => {
    const timeline = document.querySelector('#pageTimeline');
    const records = [...document.querySelectorAll('#pageTimeline [data-record-id]')];
    const details = [...document.querySelectorAll('#pageTimeline details[data-archive-disclosure]')];
    const filter = document.querySelector('#pageTimeline .archive-filter-bar');
    const covers = [...document.querySelectorAll('#pageTimeline .archive-record-cover img')];
    const coverState = covers.map((image) => {
      const url = new URL(image.currentSrc || image.src, location.href);
      const rect = image.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
      return { src: image.getAttribute('src') || '', sameOrigin: url.origin === location.origin, insideAssets: url.pathname.startsWith('/assets/'), visible, loaded: image.complete && image.naturalWidth > 0 };
    });
    const sourceLinks = [...document.querySelectorAll('#pageTimeline [data-source-action][href]')];
    const unsafeLinks = sourceLinks.filter((link) => {
      try {
        const url = new URL(link.href, location.href);
        return !['http:', 'https:'].includes(url.protocol)
          || (url.origin !== location.origin && (link.target !== '_blank' || !link.relList.contains('noreferrer')));
      } catch { return true; }
    });
    return [
      { rule: `${pageKind}-uses-current-lightweight-record-stack`, passed: Boolean(timeline) && records.length > 0, detail: { timeline: timeline?.id || null, records: records.length } },
      { rule: `${pageKind}-uses-stable-record-hashes-and-native-details`, passed: records.every((record) => Boolean(record.id)) && details.length > 0 && details.every((detail) => Boolean(detail.id) && Boolean(detail.querySelector(':scope > summary'))), detail: { recordIds: records.slice(0, 8).map((record) => record.id), details: details.length, unstableDetails: details.filter((detail) => !detail.id || !detail.querySelector(':scope > summary')).map((detail) => detail.outerHTML.slice(0, 120)) } },
      ...(pageKind === 'behind-scenes' ? [{ rule: 'behind-scenes-does-not-add-a-filter-bar', passed: !filter, detail: filter?.outerHTML || null }] : [{ rule: `${pageKind}-has-one-current-filter-bar`, passed: Boolean(filter) && document.querySelectorAll('#pageTimeline .archive-filter-bar').length === 1, detail: { count: document.querySelectorAll('#pageTimeline .archive-filter-bar').length } }]),
      { rule: `${pageKind}-official-media-uses-real-loaded-local-covers-and-safe-links`, passed: covers.length > 0 && coverState.every((cover) => cover.sameOrigin && cover.insideAssets && (!cover.visible || cover.loaded)) && unsafeLinks.length === 0, detail: { covers: coverState, sourceLinks: sourceLinks.length, unsafeLinks: unsafeLinks.map((link) => link.getAttribute('href')) } },
    ];
  }, kind);
  checkBrowser(scope, results);
}

async function runFactionContract(page, scope, expectedSource = '') {
  const results = await page.evaluate((targetSource) => {
    const directory = document.querySelector('#factionDirectory, [data-faction-directory], .faction-directory');
    const detail = document.querySelector('#factionDetail, [data-faction-detail], .faction-detail');
    const members = document.querySelectorAll('[data-member-id], [data-agent-id], .faction-member');
    const sourceState = document.querySelector('[data-source-status], .source-status, #sources, #pageSources');
    const scopedStatus = document.querySelector('#factionSourceStatus');
    const scopedContext = document.querySelector('#factionContextContent');
    const scopedAction = document.querySelector('#factionSourceAction a[data-source-action]');
    const scopedText = `${scopedStatus?.textContent || ''} ${scopedContext?.textContent || ''}`.replace(/\s+/g, ' ').trim();
    return [
      { rule: 'faction-has-stable-directory-and-detail-structure', passed: Boolean(directory && detail), detail: { directory: directory?.id || directory?.className || null, detail: detail?.id || detail?.className || null } },
      { rule: 'faction-detail-lists-members', passed: members.length > 0, detail: { count: members.length } },
      { rule: 'faction-exposes-source-status-and-boundary', passed: Boolean(sourceState) && /待核验|来源|source/i.test(sourceState.textContent || '') && /非官方/i.test(document.body.textContent || ''), detail: sourceState?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 300) || '' },
      ...(targetSource === 'remielle-official-member-page' ? [{ rule:'faction-covenant-uses-remielle-scoped-official-member-source', passed:/角色(?:百科)?页/.test(scopedText) && /成员关系/.test(scopedText) && !/阵营专属词条/.test(scopedText) && scopedAction?.href === 'https://baike.mihoyo.com/zzz/wiki/content/2076/detail?mhy_presentation_style=fullscreen', detail:{ scopedText, href:scopedAction?.href || '' } }] : []),
    ];
  }, expectedSource);
  checkBrowser(scope, results);
}

async function runCultivateContract(page, scope) {
  const results = await page.evaluate(() => {
    const faqs = [...document.querySelectorAll('#faqList > details[data-archive-disclosure]')];
    const materials = [...document.querySelectorAll('#matGrid > [data-cultivate-search-item]')];
    const materialDetails = materials.map((material) => material.querySelector(':scope > details[data-archive-disclosure]'));
    const allDetails = [...document.querySelectorAll('details[data-archive-disclosure]')];
    const source = document.querySelector('[data-source-section]');
    const covers = [...document.querySelectorAll('#matGrid img')].map((image) => image.getAttribute('src') || '');
    const metadataFields = [...document.querySelectorAll('.cultivate-source-details dt')].map((node) => node.textContent.trim());
    return [
      { rule: 'cultivate-has-23-faqs', passed: faqs.length === 23, detail: { count: faqs.length } },
      { rule: 'cultivate-has-44-materials', passed: materials.length === 44, detail: { count: materials.length } },
      { rule: 'cultivate-has-query-hash-and-67-stable-native-details', passed: Boolean(document.querySelector('#cultivateQuery')) && allDetails.length === 67 && faqs.concat(materialDetails).every((detail) => detail instanceof HTMLDetailsElement && detail.id && detail.querySelector(':scope > summary[id][aria-controls]')), detail: { query: Boolean(document.querySelector('#cultivateQuery')), details: allDetails.length, unstable: faqs.concat(materialDetails).filter((detail) => !(detail instanceof HTMLDetailsElement) || !detail.id || !detail.querySelector(':scope > summary[id][aria-controls]')).length } },
      { rule: 'cultivate-has-44-local-icons-and-per-item-source-rights', passed: covers.length === 44 && new Set(covers).size === 44 && covers.every((src) => /^assets\/wiki\/cultivate\/.+\.(?:png|jpe?g|webp|avif|svg)$/i.test(src)) && ['来源类型', '核验日期', '权利状态', '使用说明'].every((label) => metadataFields.filter((field) => field === label).length === 44), detail: { covers: covers.length, uniqueCovers: new Set(covers).size, fieldCounts: Object.fromEntries(['来源类型', '核验日期', '权利状态', '使用说明'].map((label) => [label, metadataFields.filter((field) => field === label).length])) } },
      { rule: 'cultivate-has-source-and-unofficial-boundary', passed: Boolean(source) && /非官方/i.test(document.body.textContent || ''), detail: source?.id || source?.className || null },
    ];
  });
  checkBrowser(scope, results);
}

async function runPlayContract(page, scope) {
  const results = await page.evaluate(() => {
    const tapes = [...document.querySelectorAll('.tape-wall-tape[data-tape-id]')];
    const viewer = document.querySelector('.tape-wall-viewer');
    const viewerImage = document.querySelector('[data-viewer-image]');
    const flyers = document.querySelectorAll('.tape-wall-flyer');
    const fallbackLinks = [...document.querySelectorAll('a[href]')].filter((link) => /^(?:mainline|stories|cultivate)\.html/.test(link.getAttribute('href') || ''));
    const shareMeta = [...document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[name="twitter:title"]')].map((node) => node.content || '');
    return [
      { rule: 'play-has-share-unofficial-boundary', passed: /粉丝非官方/.test(document.body.textContent || '') && /无隶属/.test(document.body.textContent || '') && shareMeta.some((value) => /粉丝非官方|非官方/.test(value)), detail: shareMeta },
      { rule: 'play-has-hash-keyboard-and-crt-structure', passed: Boolean(document.querySelector('[data-enter-store]') && document.querySelector('#store-interior[tabindex]') && document.querySelector('#catalog[tabindex]') && document.querySelector('#bangboo-desk[tabindex]') && viewer && tapes.length > 0 && tapes.every((tape) => tape.matches('button') && tape.dataset.tapeId)), detail: { enter: Boolean(document.querySelector('[data-enter-store]')), viewer: Boolean(viewer), tapes: tapes.length, targets: ['store-interior', 'catalog', 'bangboo-desk'].map((id) => ({ id, exists: Boolean(document.getElementById(id)), tabIndex: document.getElementById(id)?.tabIndex ?? null })) } },
      { rule: 'play-has-no-flyer-before-interaction', passed: flyers.length === 0, detail: { count: flyers.length } },
      { rule: 'play-defers-heavy-viewer-asset-before-interaction', passed: Boolean(viewerImage) && !viewerImage.getAttribute('src') && !document.querySelector('video[src], audio[src], iframe[src]'), detail: { viewerImage: viewerImage?.getAttribute('src') || null, heavy: [...document.querySelectorAll('video[src], audio[src], iframe[src]')].map((node) => ({ tag: node.tagName, src: node.getAttribute('src') })) } },
      { rule: 'play-has-formal-archive-fallbacks', passed: fallbackLinks.length >= 3, detail: fallbackLinks.map((link) => link.getAttribute('href')) },
    ];
  });
  checkBrowser(scope, results);
}

async function runRouteSpecificContract(page, route, variant, scope) {
  if (route.name === 'index' && variant.name === 'desktop') await runHomeContract(page, scope, variant);
  if (route.storiesAgent && ['desktop', 'mobile'].includes(variant.name)) await runStoriesContract(page, scope, variant.name === 'mobile', route.storiesAgent);
  if (route.character && variant.name === 'desktop') await runCharacterContract(page, scope, route.character);
  if (['mainline', 'events', 'behind-scenes'].includes(route.name) && variant.name === 'desktop') await runRecordStackContract(page, scope, route.name);
  if (route.name.startsWith('faction-') && variant.name === 'desktop') await runFactionContract(page, scope, route.factionSource || '');
  if (route.name === 'cultivate' && variant.name === 'desktop') await runCultivateContract(page, scope);
  if (route.name === 'play' && variant.name === 'desktop') await runPlayContract(page, scope);
}

async function capture(browser, baseUrl, route, variant, options = {}) {
  const scope = options.scope || `${route.name}/${variant.name}`;
  const session = await openPage(browser, baseUrl, route, variant, options.path || route.path);
  try {
    await runCommonContract(session.page, route, scope);
    if (options.home) await runHomeContract(session.page, scope, variant);
    if (options.act) {
      const moved = await session.page.evaluate((act) => {
        const node = [...document.querySelectorAll('[data-home-act]')].find((candidate) => candidate.dataset.homeAct === act);
        if (!node) return false;
        node.scrollIntoView({ block: 'start', inline: 'nearest' });
        return true;
      }, options.act);
      check(scope, 'home-act-target-exists', moved, { act: options.act });
      await waitForVisualReadiness(session.page);
    }
    if (options.routeSpecific) await runRouteSpecificContract(session.page, route, variant, scope);
    if (options.fullPage) {
      const fullPageImages = await waitForFullPageImages(session.page);
      check(scope, 'all-rendered-local-images-ready-for-full-page-capture', fullPageImages.every((image) => image.complete && image.width > 0), fullPageImages);
    }
    const file = `${safeName(options.file || `${route.name}-${variant.name}`)}.png`;
    const filePath = resolve(outputDir, file);
    await session.page.screenshot({ path: filePath, fullPage: Boolean(options.fullPage), animations: 'disabled', timeout: 20_000 });
    report.screenshots.push({ file, kind: options.kind || 'route', route: route.name, variant: variant.name, act: options.act || null, fullPage: Boolean(options.fullPage) });
  } catch (error) {
    check(scope, 'capture-completes', false, { error: error.message });
  } finally {
    await closePage(session, scope);
  }
}

async function collectHomeActs(browser, baseUrl) {
  const route = routes[0];
  const variant = routeVariants[0];
  const scope = 'home-act-discovery';
  const session = await openPage(browser, baseUrl, route, variant);
  try {
    await runCommonContract(session.page, route, scope);
    const acts = await session.page.evaluate(() => [...document.querySelectorAll('[data-home-act]')].map((node) => ({
      value: node.dataset.homeAct || '',
      id: node.id || '',
      label: (node.getAttribute('aria-label') || node.querySelector('h1, h2, h3')?.textContent || '').replace(/\s+/g, ' ').trim(),
    })));
    check(scope, 'home-act-values-are-unique-and-named', acts.length > 0 && acts.every((act) => act.value) && new Set(acts.map((act) => act.value)).size === acts.length, acts);
    return acts;
  } finally {
    await closePage(session, scope);
  }
}

async function runDeepLinkChecks(browser, baseUrl) {
  const checks = [
    {
      name: 'mainline-lane-stories', route: routes[1], path: '/mainline.html?lane=stories',
      verify: () => ({
        lane: new URL(location.href).searchParams.get('lane') || '',
        heading: document.querySelector('h1')?.textContent.trim() || '',
        count: document.querySelectorAll('#pageTimeline [data-record-id]').length,
        expected: window.archiveData?.stories?.length || 0,
      }),
      pass: (value) => value.lane === 'stories' && /角色剧情/.test(value.heading) && value.count === value.expected && value.expected === 54,
    },
    {
      name: 'stories-agent', route: routes[2], path: '/stories.html?agent=anby',
      verify: () => ({ selected: document.querySelector('[data-agent-id].is-selected, [data-agent-id][aria-current="true"], [data-agent-id][aria-selected="true"]')?.dataset.agentId || '', query: new URL(location.href).searchParams.get('agent') }),
      pass: (value) => value.selected === 'anby' && value.query === 'anby',
    },
    {
      name: 'stories-query', route: routes[2], path: '/stories.html?q=%E5%AE%89%E6%AF%94',
      verify: () => ({ query: document.querySelector('#agentSearch, [data-agent-search]')?.value || '', visible:Number(document.querySelector('#agentResultCount')?.textContent || 0) }),
      pass: (value) => value.query === '安比' && value.visible > 0 && value.visible < 57,
    },
    {
      name: 'stories-faction', route: routes[2], path: '/stories.html?faction=cunning-hares',
      verify: () => ({ faction: document.querySelector('#factionFilter, [data-faction-filter]')?.value || '', visible:Number(document.querySelector('#agentResultCount')?.textContent || 0) }),
      pass: (value) => value.faction === 'cunning-hares' && value.visible > 0 && value.visible < 57,
    },
    {
      name: 'stories-hash', route: routes[2], path: '/stories.html?agent=anby&unknown=keep#agentSearchForm',
      verify: () => ({ hash: location.hash, focus: document.activeElement?.id || '', open: document.querySelector('#agentFilterDisclosure')?.open || false, unknown: new URL(location.href).searchParams.get('unknown') || '' }),
      pass: (value) => value.hash === '#agentSearchForm' && value.focus === 'agentSearch' && value.open && value.unknown === 'keep',
    },
    { name: 'character-media', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#media', characterTabExpected: 'media', expectedHash: '#media' },
    { name: 'character-lore', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#lore', characterTabExpected: 'lore', expectedHash: '#lore' },
    { name: 'character-profile', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#profile', characterTabExpected: 'profile', expectedHash: '#profile' },
    { name: 'character-related', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#related', characterTabExpected: 'related', expectedHash: '#related' },
    { name: 'character-art-alias', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#art', characterTabExpected: 'media', expectedHash: '#art' },
    { name: 'character-dossier-alias', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#dossier', characterTabExpected: 'media', expectedHash: '#dossier' },
    { name: 'character-story-alias', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#story', characterTabExpected: 'lore', expectedHash: '#story' },
    { name: 'character-growth-alias', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#growth', characterTabExpected: 'profile', expectedHash: '#growth' },
    { name: 'character-build-alias', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#build', characterTabExpected: 'profile', expectedHash: '#build' },
    { name: 'character-combat-alias', route: routes.find((route) => route.name === 'character-anby-default'), path: '/character.html?id=anby#combat', characterTabExpected: 'profile', expectedHash: '#combat' },
  ];
  for (const item of checks) {
    const variant = routeVariants[0];
    const scope = `deep-link/${item.name}`;
    const session = await openPage(browser, baseUrl, item.route, variant, item.path);
    try {
      await runCommonContract(session.page, item.route, scope);
      const value = item.characterTabExpected
        ? await readCharacterTabState(session.page)
        : await session.page.evaluate(item.verify);
      const passed = item.characterTabExpected
        ? characterTabStatePass(value, item.characterTabExpected, { hash: item.expectedHash })
        : item.pass(value);
      check(scope, 'deep-link-contract', passed, value);
    } catch (error) {
      check(scope, 'deep-link-contract', false, { error: error.message });
    } finally {
      await closePage(session, scope);
    }
  }
  return checks.length;
}

async function openStoriesFilterDisclosure(page) {
  const disclosure = page.locator('#agentFilterDisclosure');
  if (!await disclosure.evaluate((element) => element.open)) await page.locator('#agentFilterDisclosure > summary').click();
  await page.waitForFunction(() => document.querySelector('#agentFilterDisclosure')?.open && document.querySelector('#agentSearch')?.getClientRects().length);
}

async function runInteractionChecks(browser, baseUrl) {
  const stories = routes[2];
  const character = routes.find((route) => route.name === 'character-anby-default');
  const home = routes[0];
  const play = routes.find((route) => route.name === 'play');
  if (!play) throw new Error('Missing play route');
  const desktop = routeVariants[0];
  const interactions = [
    {
      name: 'stories-card-click-updates-selection-primary-and-url', route: stories,
      run: async (page) => {
        const target = await page.locator('#agentGrid [data-agent-id]').nth(1).getAttribute('data-agent-id');
        await page.locator('#agentGrid [data-agent-id]').nth(1).click();
        await page.waitForFunction((id) => document.querySelector('#agentGrid [data-agent-id][aria-current="true"]')?.dataset.agentId === id && new URL(location.href).searchParams.get('agent') === id, target);
        return page.evaluate((id) => ({ target: id, selected: document.querySelector('#agentGrid [data-agent-id][aria-current="true"]')?.dataset.agentId || '', primary: document.querySelector('#selectedAgentPrimaryLink')?.getAttribute('href') || '', query: new URL(location.href).searchParams.get('agent') || '' }), target);
      },
      pass: (value) => Boolean(value.target) && value.selected === value.target && value.primary === `character.html?id=${value.target}` && value.query === value.target,
    },
    {
      name: 'stories-home-key-focuses-first-card', route: stories,
      run: async (page) => {
        await page.locator('#agentGrid [data-agent-id][aria-current="true"]').focus();
        await page.keyboard.press('End');
        await page.keyboard.press('Home');
        return page.evaluate(() => ({ focused: document.activeElement?.dataset.agentId || '', first: document.querySelector('#agentGrid [data-agent-id]')?.dataset.agentId || '' }));
      },
      pass: (value) => Boolean(value.first) && value.focused === value.first,
    },
    {
      name: 'stories-end-key-focuses-last-card', route: stories,
      run: async (page) => {
        await page.locator('#agentGrid [data-agent-id][aria-current="true"]').focus();
        await page.keyboard.press('End');
        return page.evaluate(() => ({ focused: document.activeElement?.dataset.agentId || '', last: [...document.querySelectorAll('#agentGrid [data-agent-id]')].at(-1)?.dataset.agentId || '' }));
      },
      pass: (value) => Boolean(value.last) && value.focused === value.last,
    },
    {
      name: 'stories-search-filters-and-preserves-url-state', route: stories,
      run: async (page) => {
        await openStoriesFilterDisclosure(page);
        await page.locator('#agentSearch').fill('安比');
        await page.waitForFunction(() => Number(document.querySelector('#agentResultCount')?.textContent) > 0 && Number(document.querySelector('#agentResultCount')?.textContent) < 57);
        return page.evaluate(() => ({ value: document.querySelector('#agentSearch')?.value || '', count:Number(document.querySelector('#agentResultCount')?.textContent || 0), query: new URL(location.href).searchParams.get('q') || '' }));
      },
      pass: (value) => value.value === '安比' && value.query === '安比' && value.count > 0 && value.count < 57,
    },
    {
      name: 'stories-faction-filter-filters-and-preserves-url-state', route: stories,
      run: async (page) => {
        await openStoriesFilterDisclosure(page);
        await page.locator('#factionFilter').selectOption('cunning-hares');
        await page.waitForFunction(() => Number(document.querySelector('#agentResultCount')?.textContent) > 0 && Number(document.querySelector('#agentResultCount')?.textContent) < 57);
        return page.evaluate(() => ({ value: document.querySelector('#factionFilter')?.value || '', count:Number(document.querySelector('#agentResultCount')?.textContent || 0), query: new URL(location.href).searchParams.get('faction') || '' }));
      },
      pass: (value) => value.value === 'cunning-hares' && value.query === 'cunning-hares' && value.count > 0 && value.count < 57,
    },
    {
      name: 'stories-favorite-persists-and-can-be-cleared', route: stories,
      run: async (page) => {
        const favorite = page.locator('.agent-stage-favorite');
        const initial = await favorite.getAttribute('aria-pressed');
        await favorite.click();
        const selected = await favorite.getAttribute('aria-pressed');
        await page.reload({ waitUntil: 'load' });
        await page.waitForSelector('.agent-stage-favorite');
        const persisted = await page.locator('.agent-stage-favorite').getAttribute('aria-pressed');
        await page.locator('.agent-stage-favorite').click();
        const cleared = await page.locator('.agent-stage-favorite').getAttribute('aria-pressed');
        return { initial, selected, persisted, cleared };
      },
      pass: (value) => value.initial === 'false' && value.selected === 'true' && value.persisted === 'true' && value.cleared === 'false',
    },
    {
      name: 'character-text-motion-is-finite-transform-opacity-and-settles', route: character,
      run: async (page) => page.evaluate(async () => {
        const screen = document.querySelector('.character-screen');
        const english = document.querySelector('#characterEnglishName');
        const targets = [english, document.querySelector('#characterName'), ...document.querySelectorAll('.character-identity > div'), document.querySelector('.character-dossier-link')].filter(Boolean);
        const state = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return { opacity:Number.parseFloat(style.opacity || '1'), transform:style.transform, left:rect.left, top:rect.top };
        };
        screen.removeAttribute('data-character-text-motion');
        void screen.offsetWidth;
        screen.dataset.characterTextMotion = 'enter';
        void screen.offsetWidth;
        const start = targets.map((element) => state(element));
        const animations = targets.flatMap((element, index) => element.getAnimations().filter((animation) => animation.animationName?.startsWith('archive-character-')).map((animation) => {
          const timing = animation.effect?.getTiming() || {};
          const properties = [...new Set((animation.effect?.getKeyframes() || []).flatMap((frame) => Object.keys(frame)).filter((property) => !['offset','computedOffset','easing','composite'].includes(property)))];
          return { target:index, name:animation.animationName, delay:Number(timing.delay || 0), duration:Number(timing.duration || 0), iterations:timing.iterations, properties };
        }));
        const headingTransitions = [...document.querySelectorAll('.character-module-head > span,.character-module-head > h2')].map((element) => ({
          property:getComputedStyle(element).transitionProperty.split(',').map((value) => value.trim()).filter(Boolean),
          duration:getComputedStyle(element).transitionDuration,
        }));
        await new Promise((resolveWait) => setTimeout(resolveWait, 1_500));
        const end = targets.map((element) => state(element));
        return {
          english:{ text:(english?.textContent || '').trim(), hidden:english?.hidden ?? null, lang:english?.lang || '' },
          motion:screen.dataset.characterTextMotion || '',
          animations,
          headingTransitions,
          englishMovedHorizontally:Math.abs((start[0]?.left || 0) - (end[0]?.left || 0)) > .1,
          changedTargets:start.map((value, index) => value.opacity !== end[index].opacity || value.transform !== end[index].transform || Math.abs(value.left - end[index].left) > .1 || Math.abs(value.top - end[index].top) > .1).filter(Boolean).length,
          targetCount:targets.length,
          settled:end.every((value) => value.opacity >= .99 && ['none','matrix(1, 0, 0, 1, 0, 0)','matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'].includes(value.transform)),
        };
      }),
      pass: (value) => value.english.text === 'Anby Demara' && value.english.hidden === false && value.english.lang === 'en' && value.motion === 'enter'
        && value.animations.length >= value.targetCount
        && value.animations.every((animation) => {
          const total = animation.delay + animation.duration * animation.iterations;
          const budget = animation.name === 'archive-character-english-breathe' ? 1_400 : 500;
          return Number.isFinite(animation.iterations) && animation.iterations >= 1 && animation.iterations <= 2 && total <= budget && animation.properties.length > 0 && animation.properties.every((property) => ['transform','opacity'].includes(property));
        })
        && value.animations.some((animation) => animation.name === 'archive-character-english-enter' && animation.iterations === 1 && animation.properties.includes('transform') && animation.properties.includes('opacity'))
        && value.animations.some((animation) => animation.name === 'archive-character-english-breathe' && animation.iterations === 2 && animation.duration >= 250 && animation.duration <= 500 && animation.delay === animation.duration && JSON.stringify(animation.properties) === JSON.stringify(['transform']))
        && value.englishMovedHorizontally && value.changedTargets === value.targetCount && value.settled
        && value.headingTransitions.length === 8 && value.headingTransitions.every((transition) => transition.property.length > 0 && transition.property.every((property) => ['transform','opacity'].includes(property))),
    },
    {
      name: 'character-reduced-motion-is-static-and-near-instant', route: character, variant: routeVariants[2],
      run: async (page) => page.evaluate(async () => {
        const screen = document.querySelector('.character-screen');
        const targets = [document.querySelector('#characterEnglishName'), document.querySelector('#characterName'), ...document.querySelectorAll('.character-identity > div'), document.querySelector('.character-dossier-link'), document.querySelector('.character-module-nav a.is-active > span')].filter(Boolean);
        const state = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return { opacity:Number.parseFloat(style.opacity || '1'), transform:style.transform, left:rect.left, top:rect.top };
        };
        screen.removeAttribute('data-character-text-motion');
        void screen.offsetWidth;
        screen.dataset.characterTextMotion = 'enter';
        void screen.offsetWidth;
        const before = targets.map((element) => state(element));
        const animations = targets.flatMap((element) => element.getAnimations().filter((animation) => animation.animationName?.startsWith('archive-character-')).map((animation) => animation.effect?.getTiming() || {}));
        await new Promise((resolveWait) => setTimeout(resolveWait, 80));
        const after = targets.map((element) => state(element));
        const headingDurations = [...document.querySelectorAll('.character-module-head > span,.character-module-head > h2')].map((element) => getComputedStyle(element).transitionDuration);
        return { reduced:matchMedia('(prefers-reduced-motion: reduce)').matches, animations, before, after, headingDurations };
      }),
      pass: (value) => value.reduced && value.animations.every((timing) => Number(timing.duration || 0) <= 1)
        && value.before.every((state, index) => state.opacity >= .99 && state.transform === 'none' && Math.abs(state.left - value.after[index].left) <= .5 && Math.abs(state.top - value.after[index].top) <= .5)
        && value.headingDurations.every((duration) => duration.split(',').every((part) => Number.parseFloat(part) <= .001)),
    },
    {
      name: 'character-mobile-switches-panel-without-horizontal-overflow', route: character, variant: routeVariants[1],
      run: async (page) => {
        await page.locator('#dossier [role="tablist"] [role="tab"][aria-controls="lore"]').click();
        await page.waitForTimeout(50);
        return { state:await readCharacterTabState(page), viewport:await page.evaluate(() => ({ width:innerWidth, documentWidth:document.documentElement.scrollWidth, bodyWidth:document.body.scrollWidth })) };
      },
      pass: (value) => value.viewport.width === 390 && value.viewport.documentWidth <= value.viewport.width + 1 && value.viewport.bodyWidth <= value.viewport.width + 1
        && characterTabStatePass(value.state, 'lore', { focus:true, hash:'#lore' }),
    },
    {
      name: 'character-mobile-longest-english-name-has-no-horizontal-overflow', route: character, variant: routeVariants[1],
      run: async (page) => {
        const longest = await page.evaluate(() => [...(window.archiveData?.characters || [])]
          .filter((item) => (item.englishName || '').trim())
          .sort((left, right) => [...right.englishName.trim()].length - [...left.englishName.trim()].length)[0]);
        await page.goto(`${baseUrl}/character.html?id=${encodeURIComponent(longest.id)}`, { waitUntil:'networkidle' });
        await page.waitForSelector('#characterEnglishName:not([hidden])');
        await page.waitForTimeout(1_500);
        return page.evaluate((expected) => {
          const english = document.querySelector('#characterEnglishName');
          const rect = english.getBoundingClientRect();
          const style = getComputedStyle(english);
          return {
            expected,
            rendered:(english.textContent || '').trim(),
            hidden:english.hidden,
            viewportWidth:innerWidth,
            documentWidth:document.documentElement.scrollWidth,
            bodyWidth:document.body.scrollWidth,
            rect:{ left:rect.left, right:rect.right, width:rect.width },
            scrollWidth:english.scrollWidth,
            clientWidth:english.clientWidth,
            whiteSpace:style.whiteSpace,
            overflowWrap:style.overflowWrap,
          };
        }, { id:longest.id, englishName:longest.englishName.trim() });
      },
      pass: (value) => value.viewportWidth === 390 && value.rendered === value.expected.englishName && value.hidden === false
        && value.documentWidth <= value.viewportWidth + 1 && value.bodyWidth <= value.viewportWidth + 1
        && value.rect.left >= -1 && value.rect.right <= value.viewportWidth + 1 && value.scrollWidth <= value.clientWidth + 1
        && value.whiteSpace === 'normal' && value.overflowWrap === 'anywhere',
    },
    {
      name: 'character-editor-preview-missing-english-name-hides-safely', route: character, variant: routeVariants[1],
      run: async (page) => {
        const expectedName = await page.evaluate(() => {
          const preview = structuredClone(window.archiveData || {});
          const character = preview.characters?.find((item) => item.id === 'anby');
          if (character) character.englishName = '';
          localStorage.setItem('hooxi:preview:data', JSON.stringify(preview));
          return character?.name || '';
        });
        let result;
        try {
          await page.goto(`${baseUrl}/character.html?id=anby&editorPreview=1`, { waitUntil:'networkidle' });
          await page.waitForSelector('#characterName');
          await page.locator('#dossier [role="tablist"] [role="tab"][aria-controls="lore"]').click();
          await page.waitForTimeout(240);
          result = {
            expectedName,
            state:await readCharacterTabState(page),
            view:await page.evaluate(() => {
              const english = document.querySelector('#characterEnglishName');
              const title = document.querySelector('#characterName');
              const modules = [...document.querySelectorAll('#characterContent .character-module')];
              const titleStyle = getComputedStyle(title);
              const titleRect = title.getBoundingClientRect();
              return {
                englishHidden:english?.hidden ?? null,
                englishText:(english?.textContent || '').trim(),
                title:(title?.textContent || '').trim(),
                titleVisible:titleStyle.display !== 'none' && titleStyle.visibility !== 'hidden' && titleRect.width > 0 && titleRect.height > 0,
                motion:document.querySelector('.character-screen')?.dataset.characterTextMotion || '',
                moduleIds:modules.map((module) => module.id),
                viewportWidth:innerWidth,
                documentWidth:document.documentElement.scrollWidth,
                bodyWidth:document.body.scrollWidth,
              };
            }),
          };
        } finally {
          await page.evaluate(() => localStorage.removeItem('hooxi:preview:data'));
        }
        result.storageCleared = await page.evaluate(() => localStorage.getItem('hooxi:preview:data') === null);
        return result;
      },
      pass: (value) => value.storageCleared && value.view.viewportWidth === 390 && value.expectedName && value.view.title === value.expectedName && value.view.titleVisible
        && value.view.englishHidden === true && value.view.englishText === '' && value.view.motion === 'enter'
        && JSON.stringify(value.view.moduleIds) === JSON.stringify(['media','lore','profile','related'])
        && characterTabStatePass(value.state, 'lore', { focus:true, hash:'#lore' })
        && value.view.documentWidth <= value.view.viewportWidth + 1 && value.view.bodyWidth <= value.view.viewportWidth + 1,
    },
    {
      name: 'character-mobile-invalid-id-stays-readable-without-text-motion', route: { ...character, path:'/character.html?id=not-a-character' }, variant: routeVariants[1],
      run: async (page) => page.evaluate(() => {
        const visible = (element) => {
          if (!element) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number.parseFloat(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
        };
        const english = document.querySelector('#characterEnglishName');
        const screen = document.querySelector('.character-screen');
        const title = document.querySelector('#characterName');
        const returnLink = document.querySelector('#characterContent a[href="stories.html"]');
        return {
          englishHidden:english?.hidden ?? null,
          englishText:(english?.textContent || '').trim(),
          motion:screen?.getAttribute('data-character-text-motion'),
          title:(title?.textContent || '').trim(),
          titleVisible:visible(title),
          returnText:(returnLink?.textContent || '').replace(/\s+/g, ' ').trim(),
          returnVisible:visible(returnLink),
          viewportWidth:innerWidth,
          documentWidth:document.documentElement.scrollWidth,
          bodyWidth:document.body.scrollWidth,
        };
      }),
      pass: (value) => value.viewportWidth === 390 && value.englishHidden === true && value.englishText === '' && value.motion === null
        && value.title === '角色不存在' && value.titleVisible && /返回角色与阵营/.test(value.returnText) && value.returnVisible
        && value.documentWidth <= value.viewportWidth + 1 && value.bodyWidth <= value.viewportWidth + 1,
    },
    {
      name: 'character-tabs-click-history-keyboard-and-focus-stay-synchronized', route: character,
      run: async (page) => {
        const initial = await readCharacterTabState(page);
        const tabCount = await page.evaluate(() => {
          const tablist = document.querySelector('#dossier [role="tablist"], .character-module-nav[role="tablist"]');
          return tablist ? [...tablist.querySelectorAll('[role="tab"]')].filter((tab) => tab.closest('[role="tablist"]') === tablist).length : 0;
        });
        const clicks = [];
        const history = [];
        const keyboard = [];
        if (tabCount !== 4) return { tabCount, initial, clicks, history, keyboard };
        await page.evaluate(() => {
          const neutral = (transform) => ['none','matrix(1, 0, 0, 1, 0, 0)','matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'].includes(transform);
          const milliseconds = (value) => value.trim().endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1_000;
          window.__readCharacterPanelHead = (panel) => [...panel.querySelectorAll('.character-module-head > span,.character-module-head > h2')].map((element) => {
            const style = getComputedStyle(element);
            return {
              node:element.matches('h2') ? 'h2' : 'span',
              opacity:Number.parseFloat(style.opacity || '1'),
              transform:style.transform,
              neutral:neutral(style.transform),
              properties:style.transitionProperty.split(',').map((value) => value.trim()).filter(Boolean),
              durations:style.transitionDuration.split(',').map(milliseconds),
            };
          });
          window.__characterPanelTransitionEvents = [];
          window.__recordCharacterPanelTransition = (event) => {
            const element = event.target;
            if (!(element instanceof HTMLElement) || !element.matches('.character-module-head > span,.character-module-head > h2')) return;
            const panel = element.closest('.character-module');
            window.__characterPanelTransitionEvents.push({
              type:event.type,
              panel:panel?.id || '',
              node:element.matches('h2') ? 'h2' : 'span',
              property:event.propertyName,
            });
          };
          const content = document.querySelector('#characterContent');
          content.addEventListener('transitionrun', window.__recordCharacterPanelTransition);
          content.addEventListener('transitionend', window.__recordCharacterPanelTransition);
          window.__removeCharacterPanelTransitionListeners = () => {
            content.removeEventListener('transitionrun', window.__recordCharacterPanelTransition);
            content.removeEventListener('transitionend', window.__recordCharacterPanelTransition);
          };
        });
        for (const target of ['lore', 'profile', 'related']) {
          const tab = page.locator(`#dossier [role="tablist"] [role="tab"][aria-controls="${target}"]`);
          await page.evaluate(() => { window.__characterPanelTransitionEvents.length = 0; });
          await tab.click();
          const motion = await tab.evaluate((element) => {
            const readAnimations = (target) => target?.getAnimations().filter((animation) => animation.animationName?.startsWith('archive-character-')).map((animation) => {
              const timing = animation.effect?.getTiming() || {};
              const properties = [...new Set((animation.effect?.getKeyframes() || []).flatMap((frame) => Object.keys(frame)).filter((property) => !['offset','computedOffset','easing','composite'].includes(property)))];
              return { name:animation.animationName, iterations:timing.iterations, properties };
            }) || [];
            return { anchor:readAnimations(element), text:readAnimations(element.querySelector(':scope > span')) };
          });
          await page.waitForTimeout(220);
          await page.waitForFunction((id) => {
            const events = (window.__characterPanelTransitionEvents || []).filter((event) => event.panel === id);
            return ['span','h2'].every((node) => ['transform','opacity'].every((property) => ['transitionrun','transitionend'].every((type) => events.some((event) => event.node === node && event.property === property && event.type === type))));
          }, target, { timeout:400 });
          const panelMotion = await page.evaluate((id) => ({
            events:[...(window.__characterPanelTransitionEvents || [])].filter((event) => event.panel === id),
            final:window.__readCharacterPanelHead?.(document.getElementById(id)) || [],
          }), target);
          clicks.push({ target, motion, panelMotion, state:await readCharacterTabState(page) });
        }
        await page.evaluate(() => window.__removeCharacterPanelTransitionListeners?.());
        for (const [direction, expected] of [['back', 'profile'], ['back', 'lore'], ['forward', 'profile'], ['forward', 'related']]) {
          await page.evaluate((value) => window.history[value](), direction);
          await page.waitForTimeout(80);
          history.push({ direction, expected, state: await readCharacterTabState(page) });
        }
        await page.goto(`${baseUrl}/character.html?id=anby`, { waitUntil: 'networkidle' });
        await page.locator('#dossier [role="tablist"] [role="tab"][aria-controls="media"]').focus();
        for (const [key, expected] of [['ArrowRight', 'lore'], ['ArrowLeft', 'media'], ['ArrowLeft', 'related'], ['Home', 'media'], ['End', 'related']]) {
          await page.keyboard.press(key);
          await page.waitForTimeout(50);
          keyboard.push({ key, expected, state: await readCharacterTabState(page) });
        }
        return { tabCount, initial, clicks, history, keyboard };
      },
      pass: (value) => {
        const allowed = ['transform','opacity'];
        const expectedTransitions = ['span:transform','span:opacity','h2:transform','h2:opacity'];
        const panelMotionPass = value.clicks.every(({ panelMotion }) => panelMotion.final.length === 2
          && panelMotion.events.length >= expectedTransitions.length * 2
          && panelMotion.events.every((event) => ['transitionrun','transitionend'].includes(event.type) && ['span','h2'].includes(event.node) && allowed.includes(event.property))
          && expectedTransitions.every((expected) => {
            const [node, property] = expected.split(':');
            return ['transitionrun','transitionend'].every((type) => panelMotion.events.some((event) => event.type === type && event.node === node && event.property === property));
          })
          && panelMotion.final.every((final) => final.opacity >= .99 && final.neutral
            && final.properties.length > 0 && final.properties.every((property) => allowed.includes(property))
            && final.durations.length > 0 && final.durations.every((duration) => duration > 0 && duration <= 200)));
        return value.tabCount === 4
          && characterTabStatePass(value.initial, 'media', { hash: '' })
          && value.clicks.length === 3
          && value.clicks.every(({ target, state }) => characterTabStatePass(state, target, { focus: true, hash: `#${target}` }))
          && value.clicks.every(({ motion }) => motion.anchor.length === 0 && motion.text.some((animation) => animation.name === 'archive-character-tab-confirm' && animation.iterations === 1 && animation.properties.every((property) => allowed.includes(property))))
          && panelMotionPass
          && value.history.length === 4
          && value.history.every(({ expected, state }) => characterTabStatePass(state, expected, { focus: true, hash: `#${expected}` }))
          && value.keyboard.length === 5
          && value.keyboard.every(({ expected, state }) => characterTabStatePass(state, expected, { focus: true, hash: `#${expected}` }));
      },
    },
    {
      name: 'home-carousel-advances-when-unpaused', route: home,
      run: async (page) => {
        const before = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        await page.waitForFunction((index) => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')) !== index, before, { timeout: 9_500 });
        const after = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        return { before, after };
      },
      pass: (value) => value.before >= 0 && value.after >= 0 && value.before !== value.after,
    },
    {
      name: 'home-carousel-pauses-on-hover', route: home,
      run: async (page) => {
        await page.locator('#homeHeroArt').hover();
        const before = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        const status = await page.locator('#heroCarouselStatus').textContent();
        await page.waitForTimeout(7_600);
        const after = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        return { before, after, status };
      },
      pass: (value) => value.before >= 0 && value.before === value.after && /指针悬停/.test(value.status || ''),
    },
    {
      name: 'home-carousel-pauses-on-focus', route: home,
      run: async (page) => {
        await page.locator('#heroCarouselPause').focus();
        const before = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        const status = await page.locator('#heroCarouselStatus').textContent();
        await page.waitForTimeout(7_600);
        const after = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        return { before, after, status };
      },
      pass: (value) => value.before >= 0 && value.before === value.after && /焦点位于 Hero/.test(value.status || ''),
    },
    {
      name: 'home-carousel-pauses-when-hidden', route: home,
      run: async (page) => {
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        const before = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        const status = await page.locator('#heroCarouselStatus').textContent();
        await page.waitForTimeout(7_600);
        const after = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        return { before, after, status };
      },
      pass: (value) => value.before >= 0 && value.before === value.after && /页面(?:位于后台|不可见)/.test(value.status || ''),
    },
    {
      name: 'home-carousel-reduced-motion-stays-on-first-slide', route: home, variant: routeVariants[2],
      run: async (page) => {
        const before = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        const status = await page.locator('#heroCarouselStatus').textContent();
        await page.waitForTimeout(7_600);
        const after = await page.evaluate(() => [...document.querySelectorAll('#heroCarouselTrack [data-hero-slide]')].findIndex((slide) => slide.classList.contains('is-active')));
        return { before, after, status, reduced: await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches) };
      },
      pass: (value) => value.reduced && value.before === 0 && value.after === 0 && /减动效/.test(value.status || ''),
    },
    {
      name: 'play-hash-keyboard-crt-single-flyer-and-lazy-heavy-asset', route: play, path: '/tape-wall-sample.html#catalog',
      run: async (page) => {
        await page.waitForFunction(() => document.body.classList.contains('is-inside') && document.activeElement?.id === 'catalog');
        await page.evaluate(() => {
          window.__uiGateFlyerMax = 0;
          window.__uiGateFlyerObserver = new MutationObserver(() => {
            window.__uiGateFlyerMax = Math.max(window.__uiGateFlyerMax, document.querySelectorAll('.tape-wall-flyer').length);
          });
          window.__uiGateFlyerObserver.observe(document.body, { childList: true });
        });
        const first = page.locator('.tape-wall-tape[tabindex="0"]');
        await first.focus();
        const before = await first.getAttribute('data-tape-id');
        await page.keyboard.press('ArrowRight');
        const moved = await page.evaluate(() => document.activeElement?.dataset.tapeId || '');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('[data-viewer-link]')?.getAttribute('aria-disabled') !== 'true');
        await page.waitForTimeout(700);
        return page.evaluate(({ before, moved }) => {
          window.__uiGateFlyerObserver?.disconnect();
          const image = document.querySelector('[data-viewer-image]');
          return {
            before,
            moved,
            hash: location.hash,
            active: document.querySelector('.tape-wall-tape.is-active')?.dataset.tapeId || '',
            title: document.querySelector('[data-viewer-title]')?.textContent.trim() || '',
            image: image?.getAttribute('src') || '',
            imageLoaded: image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
            href: document.querySelector('[data-viewer-link]')?.getAttribute('href') || '',
            flyerMax: window.__uiGateFlyerMax || 0,
            flyerNow: document.querySelectorAll('.tape-wall-flyer').length,
          };
        }, { before, moved });
      },
      pass: (value) => value.hash === '#catalog' && value.before && value.moved && value.before !== value.moved && value.active === value.moved && value.title !== '尚未选片' && /^assets\/portraits\//.test(value.image) && value.imageLoaded && /^(?:character|stories)\.html/.test(value.href) && value.flyerMax === 1 && value.flyerNow === 0,
    },
    {
      name: 'same-origin-navigation-follows-native-link', route: home, intentionalNavigation: true,
      run: async (page) => {
        const link = page.locator('a[href="mainline.html"]').first();
        const href = await link.getAttribute('href');
        await Promise.all([
          page.waitForURL((url) => url.origin === new URL(baseUrl).origin && url.pathname.endsWith('/mainline.html')),
          link.click(),
        ]);
        return { href, url: page.url() };
      },
      pass: (value) => value.href === 'mainline.html' && new URL(value.url).pathname.endsWith('/mainline.html'),
    },
  ];

  for (const item of interactions) {
    const scope = `interaction/${item.name}`;
    const session = await openPage(browser, baseUrl, item.route, item.variant || desktop, item.path || item.route.path);
    try {
      await runCommonContract(session.page, item.route, scope);
      if (item.intentionalNavigation) session.monitor.allowIntentionalNavigationAborts();
      const value = await item.run(session.page);
      check(scope, 'interaction-contract', item.pass(value), value);
    } catch (error) {
      check(scope, 'interaction-contract', false, { error: error.message });
    } finally {
      await closePage(session, scope);
    }
  }
  return interactions.length;
}

async function writeReport() {
  report.blockingFailures = report.failures.length;
  report.summary.checks = report.checks.length;
  report.summary.passedChecks = report.checks.filter((entry) => entry.passed).length;
  report.summary.failedChecks = report.failures.length;
  report.summary.screenshots = report.screenshots.length;
  await writeFile(resolve(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

let staticServer;
let browser;
try {
  await mkdir(outputDir, { recursive: true });
  staticServer = createStaticServer(rootDir);
  const baseUrl = await listen(staticServer);
  browser = await chromium.launch({ headless: true });

  for (const route of routes) {
    for (const variant of routeVariants) {
      await capture(browser, baseUrl, route, variant, { routeSpecific: true, kind: 'route' });
    }
  }

  const homeActs = await collectHomeActs(browser, baseUrl);
  for (const variant of homeReleaseVariants) {
    await capture(browser, baseUrl, routes[0], variant, { home: true, kind: 'home-release' });
  }
  for (const act of homeActs) {
    for (const variant of homeActVariants) {
      await capture(browser, baseUrl, routes[0], variant, { home: true, act: act.value, file: `home-act-${act.value}-${variant.name}`, kind: 'home-act' });
    }
  }
  for (const variant of homeFullVariants) {
    await capture(browser, baseUrl, routes[0], variant, { home: true, fullPage: true, file: variant.name, kind: 'home-full' });
  }

  const deepLinkCount = await runDeepLinkChecks(browser, baseUrl);
  const interactionCount = await runInteractionChecks(browser, baseUrl);
  const expectedScreenshots = routes.length * routeVariants.length + homeReleaseVariants.length + homeActs.length * homeActVariants.length + homeFullVariants.length;
  report.summary = {
    ...report.summary,
    routes: routes.length,
    routeVariants: routes.length * routeVariants.length,
    homeReleaseVariants: homeReleaseVariants.length,
    homeActs: homeActs.map((act) => act.value),
    homeActVariants: homeActs.length * homeActVariants.length,
    homeFullVariants: homeFullVariants.length,
    deepLinks: deepLinkCount,
    interactions: interactionCount,
    expectedScreenshots,
  };
  check('summary', 'screenshot-total-matches-current-act-derived-plan', report.screenshots.length === expectedScreenshots, { actual: report.screenshots.length, expected: expectedScreenshots, homeActs: homeActs.map((act) => act.value) });
} catch (error) {
  check('runner', 'ui-gate-runs-to-completion', false, { error: error.message, stack: error.stack });
} finally {
  if (browser) await browser.close();
  if (staticServer) await closeServer(staticServer);
  await writeReport();
}

if (report.blockingFailures > 0) {
  console.error(`UI gate failed: ${report.blockingFailures} blocking failure(s). Report: ${resolve(outputDir, 'report.json')}`);
  process.exitCode = 1;
} else {
  console.log(`UI gate passed: ${report.screenshots.length} screenshots. Report: ${resolve(outputDir, 'report.json')}`);
}
