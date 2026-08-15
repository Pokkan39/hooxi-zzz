import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Windows + MSYS2/Git Bash 下 playwright-core 加载时设置 process.title
   会触发 libuv 断言 `Assertion failed: process_title, src\win\util.c:412`，
   在加载阶段就崩溃。是否触发取决于父进程 title 长度，所以表现为间歇性。
   静态 import 会被提升到文件顶部、赋值来不及生效，必须用动态 import。 */
process.title = 'pw';
const { chromium } = await import('playwright');

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const contentTypes = { '.css':'text/css; charset=utf-8', '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.webp':'image/webp', '.woff2':'font/woff2' };
const startServer = () => new Promise((resolveServer, reject) => {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
      const filePath = resolve(rootDir, pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
      if (!(filePath === rootDir || filePath.startsWith(`${rootDir}${sep}`))) throw new Error('Forbidden');
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error('Not a file');
      response.writeHead(200, { 'cache-control':'no-store', 'content-length':fileStat.size, 'content-type':contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream' });
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
const serverHandle = process.env.HOOXI_BASE_URL ? null : await startServer();
const base = process.env.HOOXI_BASE_URL || serverHandle.origin;
const route = `${base}/stories.html?agent=anby&verify=batch4`;
const failures = [];
const checks = [];
await mkdir(resolve(rootDir, 'artifacts'), { recursive: true });
const browser = await chromium.launch({ headless: true });

const record = (name, passed, detail = {}) => {
  checks.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
};

const characterPanelNames = ['media','lore','profile','related'];
const readCharacterArchiveState = page => page.evaluate(panelNames => {
  const visible = element => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && Number.parseFloat(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
  };
  const tablist = document.querySelector('#dossier [role="tablist"], .character-module-nav[role="tablist"]');
  const tabs = tablist ? [...tablist.querySelectorAll('[role="tab"]')].filter(tab => tab.closest('[role="tablist"]') === tablist) : [];
  const tabState = tabs.map(tab => ({
    controls:tab.getAttribute('aria-controls') || '',
    selected:tab.getAttribute('aria-selected') || '',
    tabIndex:tab.tabIndex,
    focused:document.activeElement === tab,
  }));
  const panels = panelNames.map(id => {
    const panel = document.getElementById(id);
    return {
      id,
      exists:panel instanceof HTMLElement,
      role:panel?.getAttribute('role') || '',
      hidden:panel instanceof HTMLElement ? panel.hidden : false,
      inert:panel instanceof HTMLElement ? (panel.inert === true || panel.hasAttribute('inert')) : false,
      visible:visible(panel),
      labelledBy:panel?.getAttribute('aria-labelledby') || '',
    };
  });
  const selectedTabs = tabState.filter(tab => tab.selected === 'true');
  const visiblePanels = panels.filter(panel => panel.visible);
  const boundaryNodes = [...document.querySelectorAll('#artSource,#characterFooterSource,[data-rights-status],[data-unofficial-boundary]')];
  return {
    hash:location.hash,
    tablistExists:tablist instanceof HTMLElement,
    tablistLabel:tablist?.getAttribute('aria-label') || '',
    tabState,
    panels,
    selectedControls:selectedTabs.map(tab => tab.controls),
    visiblePanelIds:visiblePanels.map(panel => panel.id),
    selectedFocused:selectedTabs.length === 1 && selectedTabs[0].focused,
    boundaryCount:boundaryNodes.length,
    boundaryVisible:boundaryNodes.length >= 3 && boundaryNodes.every(visible),
    boundaryOutsidePanels:boundaryNodes.every(node => !node.closest('[role="tabpanel"]') && !(tablist && tablist.contains(node))),
  };
}, characterPanelNames);
const characterArchiveStatePass = (state, expected, { focus=false, hash } = {}) => {
  const selected = state.tabState.filter(tab => tab.selected === 'true');
  return state.tablistExists
    && JSON.stringify(state.tabState.map(tab => tab.controls)) === JSON.stringify(characterPanelNames)
    && state.panels.every(panel => panel.exists && panel.role === 'tabpanel')
    && selected.length === 1 && selected[0].controls === expected && selected[0].tabIndex === 0
    && state.tabState.filter(tab => tab.controls !== expected).every(tab => tab.selected === 'false' && tab.tabIndex === -1)
    && JSON.stringify(state.visiblePanelIds) === JSON.stringify([expected])
    && state.panels.find(panel => panel.id === expected)?.hidden === false
    && state.panels.find(panel => panel.id === expected)?.inert === false
    && state.panels.filter(panel => panel.id !== expected).every(panel => panel.hidden && panel.inert && !panel.visible)
    && (!focus || state.selectedFocused)
    && (hash === undefined || state.hash === hash)
    && state.boundaryVisible && state.boundaryOutsidePanels;
};

{
  const [{ build }, actualBundle] = await Promise.all([
    import('esbuild'),
    readFile(resolve(rootDir, 'stories.js'), 'utf8'),
  ]);
  const rebuilt = await build({
    absWorkingDir:rootDir,
    entryPoints:['src/stories.jsx'],
    bundle:true,
    minify:true,
    format:'iife',
    platform:'browser',
    target:'es2020',
    outfile:'stories.js',
    write:false,
  });
  const rebuiltBundle = rebuilt.outputFiles[0]?.text || '';
  record('stories-bundle-matches-readable-react-source', actualBundle === rebuiltBundle, {
    actualBytes:actualBundle.length,
    rebuiltBytes:rebuiltBundle.length,
  });
}

for (const viewport of [
  { label:'desktop-1440', width:1440, height:900 },
  { label:'desktop-1280', width:1280, height:900 },
  { label:'mobile-390', width:390, height:844 },
  { label:'mobile-320', width:320, height:700 },
]) {
  const context = await browser.newContext({ viewport:{ width:viewport.width, height:viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(route, { waitUntil:'networkidle' });
  await page.waitForSelector('#agentGrid [data-agent-id]');
  const state = await page.evaluate(() => {
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
    const hit = element => {
      if (!visible(element)) return false;
      const rect = element.getBoundingClientRect();
      const point = document.elementFromPoint(
        Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2)),
        Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2)),
      );
      return Boolean(point && (point === element || element.contains(point) || point.contains(element)));
    };
    const disjoint = (first, second) => Boolean(first && second
      && (first.right <= second.left + 1 || second.right <= first.left + 1
        || first.bottom <= second.top + 1 || second.bottom <= first.top + 1));
    const sameViewportBand = regions => regions.every(region => region && region.top < innerHeight && region.bottom > 0)
      && Math.min(...regions.map(region => region.bottom)) > Math.max(...regions.map(region => region.top));
    const sidebar = document.querySelector('.site-sidebar');
    const workbench = document.querySelector('#agentWorkbench');
    const stage = workbench?.querySelector('[data-character-stage], .agent-selected-stage');
    const category = workbench?.querySelector('.agent-category-menu');
    const directory = workbench?.querySelector('[data-agent-directory], .agent-roster-panel');
    const grid = workbench?.querySelector('#agentGrid');
    const cards = [...(grid?.querySelectorAll('[data-agent-id]') || [])];
    const directoryTitle = [...(directory?.querySelectorAll('h2,h3,[data-directory-title]') || [])]
      .find(element => /选择代理人|代理人名录|代理人/.test(element.textContent || ''));
    const resultCount = [...document.querySelectorAll('#agentResultCount,[data-result-count],output')].find(visible);
    const totalCount = document.querySelector('#agentTotalCount');
    const entrances = [...(workbench?.querySelectorAll('a[href],button') || [])].filter(element => /^(基础|技能|装备)$/.test((element.querySelector('b')?.textContent || element.textContent || '').replace(/\s+/g, ' ').trim()));
    const rosterScrollBox = box(document.querySelector('#agentRosterScroll'));
    const intersects = (first, second) => Boolean(first && second && first.right > second.left && first.left < second.right && first.bottom > second.top && first.top < second.bottom);
    const viewportBox = { left:0, right:innerWidth, top:0, bottom:innerHeight };
    const cardGeometry = cards.map(card => {
      const cardBox = box(card);
      const image = card.querySelector('img,picture img');
      const imageBox = box(image);
      const imageUrl = image?.getAttribute('src') ? new URL(image.getAttribute('src'), location.href) : null;
      const visibleForLoad = intersects(cardBox, viewportBox) && (!rosterScrollBox || intersects(cardBox, rosterScrollBox));
      return {
        width:cardBox?.width || 0,
        height:cardBox?.height || 0,
        imageCoverage:imageBox && cardBox?.width > 0 && cardBox.height > 0
          ? (Math.min(imageBox.width, cardBox.width) * Math.min(imageBox.height, cardBox.height)) / (cardBox.width * cardBox.height) : 0,
        imageLoaded:image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        visibleForLoad,
        portraitSrc:image?.getAttribute('src') || '',
        sameOriginLocalPortrait:Boolean(imageUrl && imageUrl.origin === location.origin && /^\/assets\/portraits\/[^/]+-card\.webp$/.test(imageUrl.pathname)),
      };
    });
    const sortedWidths = cardGeometry.map(item => item.width).sort((a, b) => a - b);
    const sortedHeights = cardGeometry.map(item => item.height).sort((a, b) => a - b);
    const median = values => values.length ? values[Math.floor(values.length / 2)] : 0;
    const internalScrollTraps = [...(workbench?.querySelectorAll('*') || [])].filter(element => {
      const style = getComputedStyle(element);
      return (/^(auto|scroll)$/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1)
        || (/^(auto|scroll)$/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1);
    }).map(element => element.className || element.id || element.tagName);
    const sidebarBox = box(sidebar);
    const stageBox = box(stage);
    const categoryBox = box(category);
    const directoryBox = box(directory);
    const desktopRegions = [sidebarBox, stageBox, directoryBox];
    const desktopThreeColumn = sameViewportBand(desktopRegions)
      && sidebarBox.right <= stageBox.left + 1 && stageBox.right <= directoryBox.left + 1
      && disjoint(sidebarBox, stageBox) && disjoint(stageBox, directoryBox) && disjoint(sidebarBox, directoryBox);
    const mobileNaturalFlow = [stageBox, categoryBox, directoryBox].every(Boolean)
      && stageBox.bottom <= categoryBox.top + 1 && categoryBox.bottom <= directoryBox.top + 1
      && disjoint(stageBox, categoryBox) && disjoint(categoryBox, directoryBox)
      && [stage, category, directory].every(element => !['fixed','sticky','absolute'].includes(getComputedStyle(element).position))
      && internalScrollTraps.length === 0;
    const details = [...document.querySelectorAll('details[data-archive-disclosure]')];
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id).filter(Boolean);
    const primary = [...document.querySelectorAll('#selectedAgentPrimaryLink')];
    return {
      react:window.__HOOXI_STORIES_REACT__ === true,
      horizontalOverflow:document.documentElement.scrollWidth > innerWidth + 1,
      documentScrolls:document.scrollingElement === document.documentElement,
      sidebarVisible:visible(sidebar),
      sidebarBox,
      sidebarControls:[...(sidebar?.querySelectorAll('a[href],button') || [])].filter(element => {
        const rect = element.getBoundingClientRect();
        return !element.disabled && element.getAttribute('aria-disabled') !== 'true'
          && visible(element) && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
      }).map(element => ({ text:(element.textContent || '').trim(), hit:hit(element) })),
      stageVisible:visible(stage),
      stageBox,
      categoryBox,
      entranceLabels:entrances.map(element => (element.textContent || '').replace(/\s+/g, ' ').trim()),
      entrancesVisibleAndHit:entrances.length === 3 && entrances.every(visible) && (innerWidth <= 880 || entrances.every(hit)),
      directoryVisible:visible(directory),
      directoryBox,
      directoryTitleVisible:visible(directoryTitle),
      resultCountVisible:visible(resultCount),
      desktopThreeColumn,
      mobileNaturalFlow,
      internalScrollTraps,
      rosterCount:cards.length,
      factionOptions:document.querySelectorAll('#factionFilter option').length,
      totalText:totalCount?.textContent.trim() || '',
      resultText:resultCount?.textContent.trim() || '',
      minimumCardWidth:innerWidth <= 320 ? 112 : 140,
      personDominantGrid:cards.length === 57
        && cardGeometry.every(item => item.sameOriginLocalPortrait && item.imageCoverage >= .5 && (!item.visibleForLoad || item.imageLoaded))
        && median(sortedWidths) >= (innerWidth <= 320 ? 112 : 140)
        && median(sortedHeights) >= median(sortedWidths) * 1.25,
      visibleCardImages:cardGeometry.filter(item => item.visibleForLoad).length,
      unloadedVisibleCardImages:cardGeometry.filter(item => item.visibleForLoad && !item.imageLoaded).map(item => item.portraitSrc),
      invalidPortraitSources:cardGeometry.filter(item => !item.sameOriginLocalPortrait).map(item => item.portraitSrc),
      medianCard:{ width:median(sortedWidths), height:median(sortedHeights) },
      minImageCoverage:cardGeometry.length ? Math.min(...cardGeometry.map(item => item.imageCoverage)) : 0,
      selected:document.querySelector('#selectedAgentName')?.textContent.trim() || '',
      primaryCount:primary.length,
      primaryHref:primary[0]?.getAttribute('href') || '',
      detailsCount:details.length,
      detailsStable:details.length === 1 && details[0].id === 'agentFilterDisclosure'
        && Boolean(details[0].querySelector(':scope > summary')?.textContent.trim())
        && Boolean(details[0].querySelector(':scope > #agentSearchForm #agentSearch')),
      uniqueIds:new Set(ids).size === ids.length,
      sourcesVisible:visible(document.querySelector('[data-source-section]')),
      sourceActions:document.querySelectorAll('[data-source-action]').length,
    };
  });
  record(`stories-${viewport.label}-uses-approved-three-part-character-workbench`,
    !state.horizontalOverflow && state.documentScrolls
      && state.sidebarVisible && state.sidebarControls.length > 0 && state.sidebarControls.every(control => control.hit)
      && state.stageVisible && state.entrancesVisibleAndHit
      && state.directoryVisible && state.directoryTitleVisible && state.resultCountVisible
      && (viewport.width > 880 ? state.desktopThreeColumn : state.mobileNaturalFlow),
    state);
  record(`stories-${viewport.label}-renders-person-dominant-directory-and-current-stage-actions`,
    state.react && state.rosterCount === 57 && state.factionOptions === 19
      && state.totalText === '57' && state.resultText === '57' && state.personDominantGrid
      && state.selected === '安比·德玛拉'
      && state.primaryCount === 1 && state.primaryHref === 'character.html?id=anby',
    state);
  record(`stories-${viewport.label}-keeps-stable-disclosure-and-visible-source-boundary`,
    state.detailsCount === 1 && state.detailsStable && state.uniqueIds && state.sourcesVisible && state.sourceActions === 3 && errors.length === 0,
    { ...state, errors });
  await context.close();
}

for (const viewport of [
  { label:'desktop-1440', width:1440, height:900 },
  { label:'desktop-user-1536x774', width:1536, height:774 },
  { label:'mobile-390', width:390, height:844 },
]) {
  const context = await browser.newContext({ viewport:{ width:viewport.width, height:viewport.height } });
  const page = await context.newPage();
  for (const target of [
    { id:'aria', mode:'portrait', compact:false, source:'portrait', src:'assets/portraits/aria-portrait.webp', width:1600, height:1800, alphaBbox:[345, 54, 1254, 1800] },
    { id:'sunna', mode:'portrait', compact:false, source:'portrait', src:'assets/portraits/sunna-portrait.webp', width:1600, height:1800, alphaBbox:[399, 2, 1204, 1799] },
    { id:'remielle', mode:'portrait', compact:false, source:'portrait', src:'assets/portraits/remielle-portrait.webp', width:1600, height:1800, alphaBbox:[99, 0, 1501, 1800] },
  ]) {
    await page.goto(`${base}/stories.html?agent=${target.id}&verify=${target.mode}-stage`, { waitUntil:'networkidle' });
    await page.waitForFunction(() => {
      const image = document.querySelector('#selectedAgentPortrait > img');
      return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
    });
    const scanAlpha = viewport.label === 'desktop-1440';
    const state = await page.evaluate((scanAlpha) => {
      const stage = document.querySelector('#selectedAgentStage');
      const host = document.querySelector('#selectedAgentPortrait');
      const image = host?.querySelector(':scope > img');
      const rosterImage = document.querySelector(`#agentGrid [data-agent-id="${CSS.escape(host?.dataset.stageAgentId || '')}"] .agent-card-image img`);
      const style = image ? getComputedStyle(image) : null;
      const hostRect = host?.getBoundingClientRect();
      const imageRect = image?.getBoundingClientRect();
      const background = style?.backgroundColor || '';
      const alphaMatch = background.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/i);
      const backgroundAlpha = background === 'transparent' ? 0 : alphaMatch ? Number(alphaMatch[1]) : 1;
      let alphaScan = null;
      if (scanAlpha && image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d', { willReadFrequently:true });
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let minAlpha = 255;
          let maxAlpha = 0;
          let minX = canvas.width;
          let minY = canvas.height;
          let maxX = -1;
          let maxY = -1;
          for (let y = 0; y < canvas.height; y += 1) {
            for (let x = 0; x < canvas.width; x += 1) {
              const alpha = pixels[(y * canvas.width + x) * 4 + 3];
              minAlpha = Math.min(minAlpha, alpha);
              maxAlpha = Math.max(maxAlpha, alpha);
              if (alpha === 0) continue;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
          alphaScan = {
            available:true,
            extrema:[minAlpha, maxAlpha],
            bbox:maxX >= 0 ? [minX, minY, maxX + 1, maxY + 1] : null,
          };
        } catch (error) {
          alphaScan = { available:false, error:error instanceof Error ? error.message : String(error) };
        }
      }
      return {
        selected:document.querySelector('[data-agent-id][aria-current="true"]')?.dataset.agentId || '',
        source:stage?.dataset.portraitSource || '',
        mode:host?.dataset.portraitMode || '',
        compact:host?.classList.contains('is-compact-card') || false,
        src:image?.getAttribute('src') || '',
        loaded:image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        naturalWidth:image?.naturalWidth || 0,
        naturalHeight:image?.naturalHeight || 0,
        objectFit:style?.objectFit || '',
        objectPosition:style?.objectPosition || '',
        background,
        backgroundAlpha,
        backgroundImage:style?.backgroundImage || '',
        borderWidths:style ? [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth] : [],
        outlineStyle:style?.outlineStyle || '',
        outlineWidth:style?.outlineWidth || '',
        boxShadow:style?.boxShadow || '',
        hostRect:hostRect ? { left:hostRect.left, right:hostRect.right, top:hostRect.top, bottom:hostRect.bottom, width:hostRect.width, height:hostRect.height } : null,
        imageRect:imageRect ? { left:imageRect.left, right:imageRect.right, top:imageRect.top, bottom:imageRect.bottom, width:imageRect.width, height:imageRect.height } : null,
        imageInsideHost:Boolean(hostRect && imageRect
          && imageRect.left >= hostRect.left - 1 && imageRect.right <= hostRect.right + 1
          && imageRect.top >= hostRect.top - 1 && imageRect.bottom <= hostRect.bottom + 1),
        rosterSrc:rosterImage?.getAttribute('src') || '',
        rosterObjectFit:rosterImage ? getComputedStyle(rosterImage).objectFit : '',
        alphaScan,
      };
    }, scanAlpha);
    const transparentFrameless = state.backgroundAlpha === 0 && state.backgroundImage === 'none'
      && state.borderWidths.length === 4 && state.borderWidths.every(width => width === '0px')
      && (state.outlineStyle === 'none' || state.outlineWidth === '0px')
      && state.boxShadow === 'none';
    const authenticAlpha = !scanAlpha || state.alphaScan?.available
      && JSON.stringify(state.alphaScan.extrema) === JSON.stringify([0, 255])
      && JSON.stringify(state.alphaScan.bbox) === JSON.stringify(target.alphaBbox);
    const targetSpecific = state.naturalWidth === target.width && state.naturalHeight === target.height
      && state.rosterSrc === `assets/portraits/${target.id}-card.webp` && state.rosterObjectFit === 'cover'
      && authenticAlpha;
    record(`stories-${viewport.label}-${target.id}-${target.mode}-stage-uses-approved-transparent-frameless-foreground`,
      state.selected === target.id && state.source === target.source
        && state.mode === target.mode && state.compact === target.compact
        && state.src === target.src && state.loaded && transparentFrameless && targetSpecific,
      state);
  }

  await page.goto(`${base}/stories.html?agent=anby&verify=portrait-stage`, { waitUntil:'networkidle' });
  await page.waitForFunction(() => {
    const image = document.querySelector('#selectedAgentPortrait > img');
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  });
  const normal = await page.evaluate(() => {
    const host = document.querySelector('#selectedAgentPortrait');
    const image = host?.querySelector(':scope > img');
    const rosterImage = document.querySelector('#agentGrid [data-agent-id="anby"] .agent-card-image img');
    return {
      selected:document.querySelector('[data-agent-id][aria-current="true"]')?.dataset.agentId || '',
      mode:host?.dataset.portraitMode || '',
      compact:host?.classList.contains('is-compact-card') || false,
      src:image?.getAttribute('src') || '',
      loaded:image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
      rosterObjectFit:rosterImage ? getComputedStyle(rosterImage).objectFit : '',
    };
  });
  record(`stories-${viewport.label}-normal-portrait-does-not-use-compact-card-and-roster-keeps-cover`,
    normal.selected === 'anby' && normal.mode === 'portrait' && !normal.compact
      && normal.src === 'assets/portraits/anby-portrait.webp' && normal.loaded
      && normal.rosterObjectFit === 'cover',
    normal);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/stories.html?agent=nicole-demara&q=%E5%A6%AE%E5%8F%AF&faction=cunning-hares&unknown=keep#agentSearch`, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.activeElement?.id === 'agentSearch');
  const initial = await page.evaluate(() => ({
    selected:document.querySelector('[data-agent-id][aria-current="true"]')?.dataset.agentId || '',
    count:Number(document.querySelector('#agentResultCount')?.textContent || 0),
    query:document.querySelector('#agentSearch')?.value || '',
    faction:document.querySelector('#factionFilter')?.value || '',
    params:Object.fromEntries(new URL(location.href).searchParams),
    hash:location.hash,
    focused:document.activeElement?.id || '',
  }));
  record('stories-valid-agent-query-faction-and-hash-initialize-together',
    initial.selected === 'nicole-demara' && initial.count === 1 && initial.query === '妮可'
      && initial.faction === 'cunning-hares' && initial.params.agent === 'nicole-demara'
      && initial.params.q === '妮可' && initial.params.faction === 'cunning-hares'
      && initial.params.unknown === 'keep' && initial.hash === '#agentSearch' && initial.focused === 'agentSearch',
    initial);

  await page.locator('#agentSearchClear').click();
  const cleared = await page.evaluate(() => ({
    count:Number(document.querySelector('#agentResultCount')?.textContent || 0),
    query:document.querySelector('#agentSearch')?.value || '',
    faction:document.querySelector('#factionFilter')?.value || '',
    params:Object.fromEntries(new URL(location.href).searchParams),
    hash:location.hash,
    focused:document.activeElement?.id || '',
  }));
  record('stories-clear-restores-directory-and-preserves-unknown-query-and-hash',
    cleared.count === 57 && !cleared.query && !cleared.faction
      && !('q' in cleared.params) && !('faction' in cleared.params)
      && cleared.params.agent === 'nicole-demara' && cleared.params.unknown === 'keep'
      && cleared.hash === '#agentSearch' && cleared.focused === 'agentSearch',
    cleared);

  await page.locator('[data-agent-id="nicole-demara"]').focus();
  const expectedNext = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#agentGrid [data-agent-id]')];
    const current = document.activeElement;
    const columns = getComputedStyle(document.querySelector('#agentGrid')).gridTemplateColumns.trim().split(/\s+/).length || 1;
    const index = cards.indexOf(current);
    return cards[Math.min(cards.length - 1, index + (index % columns < columns - 1 ? 1 : 0))]?.dataset.agentId || current?.dataset.agentId || '';
  });
  await page.keyboard.press('ArrowRight');
  const roving = await page.evaluate(() => ({
    focused:document.activeElement?.dataset.agentId || '',
    selected:document.querySelector('[data-agent-id][aria-current="true"]')?.dataset.agentId || '',
    tabStops:[...document.querySelectorAll('#agentGrid [data-agent-id]')].filter(card => card.tabIndex === 0).map(card => card.dataset.agentId),
    primary:document.querySelector('#selectedAgentPrimaryLink')?.getAttribute('href') || '',
    agent:new URL(location.href).searchParams.get('agent') || '',
  }));
  record('stories-arrow-key-updates-focus-selection-roving-tabindex-primary-action-and-url',
    roving.focused === expectedNext && roving.selected === expectedNext
      && roving.tabStops.length === 1 && roving.tabStops[0] === expectedNext
      && roving.primary === `character.html?id=${expectedNext}` && roving.agent === expectedNext,
    { expectedNext, roving });

  await page.locator('#agentSearch').fill('batch4-no-result');
  await page.waitForFunction(() => document.querySelector('#selectedAgentName')?.textContent.trim() === '未找到匹配代理人'
    && !document.querySelector('#selectedAgentPrimaryLink'));
  const empty = await page.evaluate(() => {
    const result = [...document.querySelectorAll('#agentResultCount,[data-result-count],output')].find(element => element.getClientRects().length);
    return {
      empty:document.querySelector('#agentGrid')?.classList.contains('agent-roster-empty') || false,
      selected:document.querySelector('#selectedAgentName')?.textContent.trim() || '',
      primaryCount:document.querySelectorAll('#selectedAgentPrimaryLink').length,
      result:result?.textContent.trim() || '',
      q:new URL(location.href).searchParams.get('q') || '',
    };
  });
  record('stories-empty-result-removes-primary-action-and-keeps-clear-recovery',
    empty.empty && empty.selected === '未找到匹配代理人' && empty.primaryCount === 0 && empty.result === '0' && empty.q === 'batch4-no-result',
    empty);
  await page.locator('#agentSearchClear').click();
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:390, height:844 } });
  const page = await context.newPage();
  await page.goto(`${base}/stories.html?agent=missing&q=batch4-no-result&faction=missing&unknown=keep#agentSearchForm`, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.activeElement?.id === 'agentSearch');
  const invalid = await page.evaluate(() => ({
    params:Object.fromEntries(new URL(location.href).searchParams),
    hash:location.hash,
    focused:document.activeElement?.id || '',
    empty:document.querySelector('#agentGrid')?.classList.contains('agent-roster-empty') || false,
    selected:document.querySelector('#selectedAgentName')?.textContent.trim() || '',
  }));
  record('stories-invalid-agent-and-faction-fall-back-without-losing-owned-q-unknown-query-or-hash',
    !('agent' in invalid.params) && !('faction' in invalid.params)
      && invalid.params.q === 'batch4-no-result' && invalid.params.unknown === 'keep'
      && invalid.hash === '#agentSearchForm' && invalid.focused === 'agentSearch'
      && invalid.empty && invalid.selected === '未找到匹配代理人',
    invalid);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/stories.html?agent=anby&unknown=keep#agentSearchForm`, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.activeElement?.id === 'agentSearch');
  const hashDisclosure = await page.evaluate(() => ({
    open:document.querySelector('#agentFilterDisclosure')?.open || false,
    focused:document.activeElement?.id || '',
    hash:location.hash,
    unknown:new URL(location.href).searchParams.get('unknown') || '',
  }));
  record('stories-deep-hash-opens-filter-disclosure-focuses-search-and-preserves-url',
    hashDisclosure.open && hashDisclosure.focused === 'agentSearch'
      && hashDisclosure.hash === '#agentSearchForm' && hashDisclosure.unknown === 'keep',
    hashDisclosure);

  const ids = await page.evaluate(() => window.archiveData.characters.map(character => character.id));
  const galleryFallbacks = {
    norma:'assets/gallery/norma/05.png',
    pyrois:'assets/gallery/pyrois/05.png',
    velina:'assets/gallery/velina/06.png',
  };
  const badLinks = [];
  const badArt = [];
  const artSources = { default:0, gallery:0 };
  const sampleThemes = {};
  for (const id of ids) {
    await page.evaluate(agentId => document.querySelector(`[data-agent-id="${CSS.escape(agentId)}"]`)?.click(), id);
    await page.waitForFunction(agentId => document.querySelector('#selectedAgentPrimaryLink')?.getAttribute('href') === `character.html?id=${agentId}`, id);
    await page.waitForFunction(() => [...document.querySelectorAll('.agent-stage-art > img,.agent-stage-portrait > img')]
      .every(image => image.complete && image.naturalWidth > 0));
    const state = await page.evaluate(() => {
      const stage = document.querySelector('.agent-selected-stage');
      const art = [...document.querySelectorAll('.agent-stage-art > img')];
      const portrait = [...document.querySelectorAll('.agent-stage-portrait > img')];
      return {
        links:[...document.querySelectorAll('.agent-stage-actions a[href*="character.html?id="]')].map(anchor => anchor.getAttribute('href') || ''),
        artSource:stage?.dataset.characterArtSource || '',
        artPath:stage?.dataset.characterArtPath || '',
        portraitSource:stage?.dataset.portraitSource || '',
        artPaths:art.map(image => image.getAttribute('src') || ''),
        portraitPaths:portrait.map(image => image.getAttribute('src') || ''),
        imagesLoaded:[...art,...portrait].every(image => image.complete && image.naturalWidth > 0),
        cardPaths:[...document.querySelectorAll('#agentGrid img')].map(image => image.getAttribute('src') || ''),
        theme:getComputedStyle(document.querySelector('.agent-workbench-shell')).getPropertyValue('--character-theme-rgb').trim(),
      };
    });
    const expectedLinks = new Set([
      `character.html?id=${id}`,
      `character.html?id=${id}#media`,
      `character.html?id=${id}#lore`,
      `character.html?id=${id}#related`,
    ]);
    if (state.links.length !== 4 || state.links.some(link => link.includes('#art') || !expectedLinks.has(link))) badLinks.push({ id, links:state.links });
    const expectedArtPath = galleryFallbacks[id] || `assets/mindscape/default/${id}.webp`;
    const expectedArtSource = galleryFallbacks[id] ? 'gallery' : 'default';
    const expectedPortraitSource = 'portrait';
    const expectedPortraitPath = `assets/portraits/${id}-portrait.webp`;
    artSources[state.artSource] = (artSources[state.artSource] || 0) + 1;
    if (state.artSource !== expectedArtSource || state.artPath !== expectedArtPath
      || state.portraitSource !== expectedPortraitSource
      || state.artPaths.length !== 1 || state.artPaths[0] !== expectedArtPath
      || state.portraitPaths.length !== 1 || state.portraitPaths[0] !== expectedPortraitPath
      || !state.imagesLoaded
      || state.cardPaths.length !== 57
      || state.cardPaths.some(imagePath => !/^assets\/portraits\/[^/]+-card\.webp$/.test(imagePath))) {
      badArt.push({ id, expectedArtSource, expectedArtPath, expectedPortraitSource, expectedPortraitPath, state });
    }
    if (['anby','ellen','norma'].includes(id)) sampleThemes[id] = state.theme;
  }
  record('stories-all-57-agent-links-use-approved-dossier-targets-without-art-hash', ids.length === 57 && badLinks.length === 0, { total:ids.length, badLinks });
  record('stories-stage-uses-54-default-and-3-gallery-art-with-one-local-foreground-and-card-only-roster',
    ids.length === 57 && artSources.default === 54 && artSources.gallery === 3 && badArt.length === 0,
    { total:ids.length, artSources, badArt });
  record('stories-anby-non-default-and-norma-switch-theme-and-art-source',
    sampleThemes.anby && sampleThemes.ellen && sampleThemes.norma
      && new Set(Object.values(sampleThemes)).size === 3,
    { sampleThemes });
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/stories.html?agent=anby`, { waitUntil:'networkidle' });
  const favorite = page.locator('.agent-stage-favorite');
  const initial = await favorite.getAttribute('aria-pressed');
  await favorite.click();
  const selected = await favorite.getAttribute('aria-pressed');
  await page.reload({ waitUntil:'networkidle' });
  const persisted = await page.locator('.agent-stage-favorite').getAttribute('aria-pressed');
  await page.locator('.agent-stage-favorite').click();
  const cleared = await page.locator('.agent-stage-favorite').getAttribute('aria-pressed');
  record('stories-favorite-toggle-persists-and-can-be-cleared',
    initial === 'false' && selected === 'true' && persisted === 'true' && cleared === 'false',
    { initial, selected, persisted, cleared });
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 }, reducedMotion:'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/stories.html?agent=anby`, { waitUntil:'networkidle' });
  await page.locator('[data-agent-id="norma"]').click();
  const reduced = await page.evaluate(() => ({
    matches:matchMedia('(prefers-reduced-motion: reduce)').matches,
    selected:document.querySelector('[data-agent-id][aria-current="true"]')?.dataset.agentId || '',
    artSource:document.querySelector('.agent-selected-stage')?.dataset.characterArtSource || '',
    artPath:document.querySelector('.agent-selected-stage')?.dataset.characterArtPath || '',
    wiping:document.querySelector('.agent-wipe-overlay')?.classList.contains('is-wiping') || false,
    disallowedAnimations:document.getAnimations().filter(animation => {
      if (animation.playState !== 'running') return false;
      const timing = animation.effect?.getTiming() || {};
      const target = animation.effect?.target;
      return timing.iterations === Infinity || Number(timing.duration) > 200;
    }).map(animation => ({ target:animation.effect?.target?.className || '', duration:animation.effect?.getTiming().duration })),
  }));
  record('stories-reduced-motion-switches-norma-theme-and-gallery-art-without-wipe',
    reduced.matches && reduced.selected === 'norma' && reduced.artSource === 'gallery'
      && reduced.artPath === 'assets/gallery/norma/05.png' && !reduced.wiping && reduced.disallowedAnimations.length === 0,
    reduced);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/faction.html`, { waitUntil:'networkidle' });
  const directory = await page.evaluate(() => ({
    count:document.querySelectorAll('#factionDirectoryList [data-faction-id]').length,
    countText:document.querySelector('#directoryCount')?.textContent.trim() || '',
    detailHidden:document.querySelector('#factionDetail')?.hidden || false,
    disclosure:document.querySelector('#faction-directory-notes') instanceof HTMLDetailsElement,
    title:document.title,
    twitter:document.querySelector('meta[name="twitter:title"]')?.content || '',
    source:(document.querySelector('#factionSourceStatus')?.textContent || '').trim(),
  }));
  record('faction-directory-without-id-renders-18-items-and-stable-source-meta',
    directory.count === 18 && directory.countText === '18' && directory.detailHidden && directory.disclosure
      && directory.title.includes('阵营目录') && directory.twitter.includes('粉丝非官方') && /本地角色目录/.test(directory.source),
    directory);
  await context.close();
}

for (const sample of [
  { id:'cunning-hares', members:5, records:4, source:true },
  { id:'phaethon', members:1, records:0, source:false },
]) {
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/faction.html?id=${sample.id}`, { waitUntil:'networkidle' });
  const state = await page.evaluate(() => {
    const details = [...document.querySelectorAll('details[data-archive-disclosure]')];
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id).filter(Boolean);
    return {
      members:document.querySelectorAll('#factionMembers [data-member-id]').length,
      memberCount:document.querySelector('#memberCount')?.textContent.trim() || '',
      records:document.querySelectorAll('#factionRecords [data-record-id]').length,
      recordCount:document.querySelector('#factionCount')?.textContent.trim() || '',
      details:details.length,
      detailsStable:details.every(detail => detail.id && detail.querySelector(':scope > summary')),
      uniqueIds:new Set(ids).size === ids.length,
      memberLinks:[...document.querySelectorAll('#factionMembers .faction-primary-action')].map(link => link.getAttribute('href') || ''),
      sourceHref:document.querySelector('#factionSourceAction [data-source-action]')?.getAttribute('href') || '',
      sourceText:(document.querySelector('#factionSourceStatus')?.textContent || '').trim(),
      title:document.title,
      twitter:document.querySelector('meta[name="twitter:title"]')?.content || '',
    };
  });
  record(`faction-${sample.id}-renders-required-members-records-disclosures-and-source-policy`,
    state.members === sample.members && state.memberCount === String(sample.members)
      && state.records === sample.records && state.recordCount === String(sample.records)
      && state.details > 0 && state.detailsStable && state.uniqueIds
      && state.memberLinks.length === sample.members && state.memberLinks.every(link => /^character\.html\?id=[^#]+$/.test(link))
      && (sample.source ? /^https:\/\//.test(state.sourceHref) : !state.sourceHref && /待核验/.test(state.sourceText) && /不伪造/.test(state.sourceText))
      && state.title.includes('粉丝非官方') && state.twitter.includes('粉丝非官方'),
    state);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/faction.html?id=missing-faction`, { waitUntil:'networkidle' });
  const invalid = await page.evaluate(() => ({
    directoryVisible:!document.querySelector('#factionDirectory')?.hidden,
    detailHidden:document.querySelector('#factionDetail')?.hidden || false,
    count:document.querySelectorAll('[data-faction-id]').length,
    notice:(document.querySelector('#factionNotice')?.textContent || '').trim(),
  }));
  record('faction-invalid-id-returns-to-18-item-directory-with-notice',
    invalid.directoryVisible && invalid.detailHidden && invalid.count === 18 && /未找到阵营标识/.test(invalid.notice), invalid);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  await context.addInitScript(() => localStorage.setItem('hooxi:preview:data', JSON.stringify({
    factions:[{ id:'cunning-hares', name:'污染阵营', members:[], theme:'#000' }], characters:[], stories:[], mainline:[], behindScenes:[], events:[],
  })));
  const page = await context.newPage();
  await page.goto(`${base}/faction.html?id=cunning-hares#factionContextContent`, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.activeElement?.id === 'factionContextContent');
  const official = await page.evaluate(() => ({
    name:document.querySelector('#factionName')?.textContent.trim() || '',
    members:document.querySelectorAll('[data-member-id]').length,
    contextOpen:document.querySelector('#factionContext')?.open || false,
    focused:document.activeElement?.id || '',
    hash:location.hash,
  }));
  record('faction-formal-page-ignores-localstorage-and-hash-opens-focuses-details',
    official.name === '狡兔屋' && official.members === 5 && official.contextOpen
      && official.focused === 'factionContextContent' && official.hash === '#factionContextContent', official);
  await context.close();
}

{
  const preview = {
    factions:[{ id:'preview-faction', name:'预览阵营', theme:'red;--owned:1', logo:'javascript:alert(1)', wikiUrl:'data:text/html,unsafe' }],
    characters:[{ id:'preview-agent', name:'预览角色', factionId:'preview-faction', portrait:'javascript:alert(2)', attribute:'Ether', specialty:'Attack' }],
    stories:[{ id:'safe-record', title:'安全记录', factionId:'preview-faction', sourceUrl:'https://example.com/source', summary:'safe' }],
    mainline:[], behindScenes:[], events:[],
  };
  const context = await browser.newContext({ viewport:{ width:1280, height:800 } });
  await context.addInitScript(value => localStorage.setItem('hooxi:preview:data', JSON.stringify(value)), preview);
  const page = await context.newPage();
  await page.goto(`${base}/faction.html?id=preview-faction&editorPreview=1`, { waitUntil:'networkidle' });
  const state = await page.evaluate(() => ({
    bodyTheme:document.body.style.getPropertyValue('--faction-theme'),
    rootTheme:document.documentElement.style.getPropertyValue('--faction-theme'),
    dangerousHrefs:[...document.querySelectorAll('[href]')].map(node => node.getAttribute('href') || '').filter(href => /^(?:javascript|data):/i.test(href)),
    dangerousImages:[...document.querySelectorAll('img')].map(node => node.getAttribute('src') || '').filter(src => /^(?:javascript|data):/i.test(src)),
    safeHref:document.querySelector('[data-record-id="safe-record"] [data-source-action]')?.getAttribute('href') || '',
    factionSource:document.querySelector('#factionSourceAction [href]')?.getAttribute('href') || '',
  }));
  record('faction-editor-preview-rejects-dangerous-urls-and-confines-sanitized-theme-to-body',
    state.bodyTheme === '#f3d33b' && !state.rootTheme && state.dangerousHrefs.length === 0
      && state.dangerousImages.length === 0 && state.safeHref === 'https://example.com/source' && !state.factionSource,
    state);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/cultivate.html`, { waitUntil:'networkidle' });
  const state = await page.evaluate(() => {
    const faqs = [...document.querySelectorAll('#faqList > details[data-archive-disclosure]')];
    const materials = [...document.querySelectorAll('#matGrid > [data-cultivate-search-item]')];
    const materialDetails = materials.map(material => material.querySelector(':scope > details[data-archive-disclosure]'));
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id).filter(Boolean);
    const covers = [...document.querySelectorAll('#matGrid img')].map(image => image.getAttribute('src') || '');
    return {
      faqs:faqs.length,
      materials:materials.length,
      disclosures:document.querySelectorAll('details[data-archive-disclosure]').length,
      stable:faqs.concat(materialDetails).every(detail => detail instanceof HTMLDetailsElement && detail.id && detail.querySelector(':scope > summary[id][aria-controls]')),
      uniqueIds:new Set(ids).size === ids.length,
      covers,
      result:document.querySelector('#cultivateResultCount')?.value || '',
      sourceVisible:Boolean(document.querySelector('[data-source-section]')?.getClientRects().length),
      sourceActions:document.querySelectorAll('[data-source-action]').length,
      metadataFields:[...document.querySelectorAll('.cultivate-source-details dt')].map(node => node.textContent.trim()),
    };
  });
  record('cultivate-renders-23-faq-44-material-and-67-stable-disclosures',
    state.faqs === 23 && state.materials === 44 && state.disclosures === 67 && state.stable && state.uniqueIds && /67/.test(state.result), state);
  record('cultivate-uses-44-local-icons-visible-source-boundary-and-per-item-source-metadata',
    state.covers.length === 44 && new Set(state.covers).size === 44
      && state.covers.every(src => /^assets\/wiki\/cultivate\/.+\.(?:png|jpe?g|webp|avif|svg)$/i.test(src))
      && state.sourceVisible && state.sourceActions === 45
      && ['来源类型','核验日期','权利状态','使用说明'].every(label => state.metadataFields.filter(field => field === label).length === 44),
    state);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:390, height:844 } });
  const page = await context.newPage();
  await page.goto(`${base}/cultivate.html?q=%E7%AD%89%E7%BA%A7%E4%B8%8A%E9%99%90%E6%9C%80%E9%AB%98&unknown=keep#cultivate-faq-698-01`, { waitUntil:'networkidle' });
  await page.waitForTimeout(500);
  const filtered = await page.evaluate(() => ({
    q:document.querySelector('#cultivateQuery')?.value || '',
    visibleFaqs:[...document.querySelectorAll('#faqList > details')].filter(item => !item.hidden).length,
    openFaqs:[...document.querySelectorAll('#faqList > details')].filter(item => item.open && !item.hidden).length,
    visibleMaterials:[...document.querySelectorAll('#matGrid > article')].filter(item => !item.hidden).length,
    params:Object.fromEntries(new URL(location.href).searchParams),
    hash:location.hash,
    focused:document.activeElement?.id || '',
  }));
  record('cultivate-q-initialization-preserves-unknown-query-hash-and-opens-matching-faq',
    filtered.q === '等级上限最高' && filtered.visibleFaqs > 0 && filtered.openFaqs === filtered.visibleFaqs
      && filtered.visibleMaterials === 0 && filtered.params.q === '等级上限最高'
      && filtered.params.unknown === 'keep' && filtered.hash === '#cultivate-faq-698-01', filtered);
  await page.locator('#cultivateClear').click();
  const cleared = await page.evaluate(() => ({
    result:document.querySelector('#cultivateResultCount')?.value || '',
    q:new URL(location.href).searchParams.get('q'),
    unknown:new URL(location.href).searchParams.get('unknown'),
    hash:location.hash,
    focused:document.activeElement?.id || '',
    hidden:document.querySelectorAll('[data-cultivate-search-item][hidden]').length,
    openFaqs:document.querySelectorAll('#faqList > details[open]').length,
  }));
  record('cultivate-clear-restores-all-results-and-preserves-unknown-query-and-hash',
    /67/.test(cleared.result) && cleared.q === null && cleared.unknown === 'keep'
      && cleared.hash === '#cultivate-faq-698-01' && cleared.focused === 'cultivateQuery'
      && cleared.hidden === 0 && cleared.openFaqs === 0, cleared);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:390, height:844 } });
  const page = await context.newPage();
  await page.goto(`${base}/cultivate.html?q=%E7%AD%89%E7%BA%A7%E4%B8%8A%E9%99%90%E6%9C%80%E9%AB%98&unknown=keep#cultivate-13`, { waitUntil:'networkidle' });
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => ({
    q:new URL(location.href).searchParams.get('q'),
    unknown:new URL(location.href).searchParams.get('unknown'),
    hash:location.hash,
    focused:document.activeElement?.id || '',
    hidden:document.querySelector('#cultivate-13')?.hidden || false,
    input:document.querySelector('#cultivateQuery')?.value || '',
  }));
  record('cultivate-hidden-hash-target-clears-only-owned-q-restores-target-and-focuses-it',
    state.q === null && state.unknown === 'keep' && state.hash === '#cultivate-13'
      && state.focused === 'cultivate-13' && !state.hidden && !state.input, state);
  await context.close();
}

{
  const customData = {
    guide:{ id:'698', title:'危险指南', wikiUrl:'javascript:alert(1)', faqs:[{ question:'问题', answer:'答案' }] },
    materials:[{ id:'cultivate-unsafe', wikiId:'1', title:'危险素材', summary:'测试', cover:'../unsafe.png', sourceUrl:'data:text/html,unsafe' }],
  };
  const context = await browser.newContext({ viewport:{ width:1280, height:800 } });
  const page = await context.newPage();
  await page.route('**/cultivate-data.js*', route => route.fulfill({
    status:200,
    contentType:'text/javascript; charset=utf-8',
    body:`window.hooxiCultivateData=${JSON.stringify(customData)};`,
  }));
  await page.goto(`${base}/cultivate.html`, { waitUntil:'networkidle' });
  const state = await page.evaluate(() => ({
    hrefs:[...document.querySelectorAll('[href]')].map(node => node.getAttribute('href') || '').filter(href => /^(?:javascript|data):/i.test(href)),
    unsafeImages:[...document.querySelectorAll('#matGrid img')].map(node => node.getAttribute('src') || ''),
    disabled:[...document.querySelectorAll('[data-source-action].is-disabled')].map(node => node.textContent.trim()),
  }));
  record('cultivate-rejects-dangerous-guide-material-urls-and-nonlocal-cover-paths',
    state.hrefs.length === 0 && state.unsafeImages.length === 0 && state.disabled.length === 2, state);
  await context.close();
}

{
  const html = await readFile(resolve(rootDir, 'tape-wall-sample.html'), 'utf8');
  const script = await readFile(resolve(rootDir, 'tape-wall-sample.js'), 'utf8');
  record('play-is-single-formal-page-with-meta-source-boundary-and-no-deepseek-or-network-code',
    /HOOXI PLAY/.test(html) && /粉丝非官方/.test(html) && /无隶属/.test(html) && /版权归米哈游/.test(html)
      && /磁带封套使用本地角色立绘裁切/.test(html) && /相关角色立绘版权归米哈游所有/.test(html)
      && !/立绘与截图|截图美术版权/.test(html) && /data-source-section/.test(html)
      && !/DeepSeek/i.test(`${html}\n${script}`) && !/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(script),
    { htmlBytes:html.length, scriptBytes:script.length });
}

for (const targetId of ['store-interior','catalog','bangboo-desk']) {
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  const external = [];
  page.on('request', request => {
    const url = request.url();
    if (/^https?:/.test(url) && new URL(url).origin !== new URL(base).origin) external.push(url);
  });
  await page.goto(`${base}/tape-wall-sample.html#${targetId}`, { waitUntil:'networkidle' });
  await page.waitForFunction(id => document.activeElement?.id === id, targetId);
  const state = await page.evaluate(id => ({
    hash:location.hash,
    focused:document.activeElement?.id || '',
    inside:document.body.classList.contains('is-inside'),
    opening:document.body.classList.contains('is-opening'),
    storefrontHidden:document.querySelector('[data-storefront]')?.hidden || false,
    targetVisible:Boolean(document.getElementById(id)?.getClientRects().length),
    cultivateLinks:[...document.querySelectorAll('a[href="cultivate.html"]')].length,
    title:document.title,
    description:document.querySelector('meta[name="description"]')?.content || '',
    source:(document.querySelector('[data-source-section]')?.textContent || '').trim(),
  }), targetId);
  record(`play-initial-${targetId}-hash-opens-without-animation-focuses-target-and-preserves-hash`,
    state.hash === `#${targetId}` && state.focused === targetId && state.inside && !state.opening
      && state.storefrontHidden && state.targetVisible && state.cultivateLinks >= 1
      && /HOOXI PLAY/.test(state.title) && /粉丝非官方/.test(state.description)
      && /本地档案索引/.test(state.source) && external.length === 0,
    { ...state, external });
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/tape-wall-sample.html`, { waitUntil:'networkidle' });
  await page.locator('[data-enter-store]').first().click();
  const opening = await page.evaluate(() => document.body.classList.contains('is-opening') && location.hash === '');
  await page.waitForFunction(() => document.body.classList.contains('is-inside'), null, { timeout:3500 });
  const entered = await page.evaluate(() => ({ focused:document.activeElement?.id || '', hash:location.hash }));
  record('play-door-animation-enters-store-and-focuses-interior-without-changing-hash', opening && entered.focused === 'store-interior' && !entered.hash, { opening, entered });

  await page.evaluate(() => { location.hash = '#catalog'; });
  await page.waitForFunction(() => document.activeElement?.id === 'catalog');
  await page.evaluate(() => { location.hash = '#bangboo-desk'; });
  await page.waitForFunction(() => document.activeElement?.id === 'bangboo-desk');
  const hashchange = await page.evaluate(() => ({
    hash:location.hash,
    focused:document.activeElement?.id || '',
    inside:document.body.classList.contains('is-inside'),
    opening:document.body.classList.contains('is-opening'),
  }));
  record('play-hashchange-reveals-target-without-animation-or-hash-rewrite',
    hashchange.hash === '#bangboo-desk' && hashchange.focused === 'bangboo-desk' && hashchange.inside && !hashchange.opening, hashchange);
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:390, height:844 } });
  const page = await context.newPage();
  await page.goto(`${base}/tape-wall-sample.html`, { waitUntil:'networkidle' });
  await page.evaluate(() => document.querySelector('.skip-link')?.click());
  const skipped = await page.evaluate(() => ({ inside:document.body.classList.contains('is-inside'), opening:document.body.classList.contains('is-opening'), focused:document.activeElement?.id || '' }));
  record('play-skip-link-enters-immediately-and-focuses-interior', skipped.inside && !skipped.opening && skipped.focused === 'store-interior', skipped);
  await page.locator('[data-filter="character"]').click();
  const filtered = await page.evaluate(() => ({
    tapes:document.querySelectorAll('.tape-wall-tape').length,
    pressed:document.querySelector('[data-filter="character"]')?.getAttribute('aria-pressed') || '',
    tabStops:[...document.querySelectorAll('.tape-wall-tape')].filter(button => button.tabIndex === 0).length,
    focused:document.activeElement?.dataset.tapeId || '',
  }));
  await page.keyboard.press('ArrowRight');
  const moved = await page.evaluate(() => document.activeElement?.dataset.tapeId || '');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-viewer-link]')?.getAttribute('aria-disabled') !== 'true');
  const selected = await page.evaluate(() => ({
    tape:document.querySelector('.tape-wall-tape.is-active')?.dataset.tapeId || '',
    title:document.querySelector('[data-viewer-title]')?.textContent.trim() || '',
    image:document.querySelector('[data-viewer-image]')?.getAttribute('src') || '',
    href:document.querySelector('[data-viewer-link]')?.getAttribute('href') || '',
    closeDisabled:document.querySelector('[data-viewer-close]')?.disabled ?? true,
  }));
  await page.locator('[data-viewer-close]').click();
  const returned = await page.evaluate(() => ({
    focused:document.activeElement?.dataset.tapeId || '',
    active:document.querySelectorAll('.tape-wall-tape.is-active').length,
    title:document.querySelector('[data-viewer-title]')?.textContent.trim() || '',
    disabled:document.querySelector('[data-viewer-link]')?.getAttribute('aria-disabled') || '',
  }));
  record('play-filter-keyboard-crt-selection-and-return-contracts-remain-operable',
    filtered.tapes === 6 && filtered.pressed === 'true' && filtered.tabStops === 1 && filtered.focused
      && moved && moved !== filtered.focused && selected.tape === moved && selected.title !== '尚未选片'
      && /^assets\/portraits\//.test(selected.image) && /^(?:character|stories)\.html/.test(selected.href) && !selected.closeDisabled
      && returned.focused === moved && returned.active === 0 && returned.title === '尚未选片' && returned.disabled === 'true',
    { filtered, moved, selected, returned });
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:390, height:844 }, reducedMotion:'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/tape-wall-sample.html`, { waitUntil:'networkidle' });
  await page.locator('[data-enter-store]').first().click();
  const reduced = await page.evaluate(() => ({
    matches:matchMedia('(prefers-reduced-motion: reduce)').matches,
    inside:document.body.classList.contains('is-inside'),
    opening:document.body.classList.contains('is-opening'),
    focused:document.activeElement?.id || '',
  }));
  record('play-reduced-motion-skips-door-animation-and-focuses-interior', reduced.matches && reduced.inside && !reduced.opening && reduced.focused === 'store-interior', reduced);
  await context.close();
}

const archiveMobileRoutes = ['stories.html', 'faction.html', 'cultivate.html'];
const archiveMobileStates = [];
for (const width of [320, 390]) {
  for (const route of archiveMobileRoutes) {
    const context = await browser.newContext({ viewport:{ width, height:844 } });
    const page = await context.newPage();
    await page.goto(`${base}/${route}`, { waitUntil:'networkidle' });
    const nativeSummary = page.locator('.archive-mobile-nav > summary');
    const mode = await nativeSummary.count() ? 'details' : 'sidebar';
    const control = mode === 'details' ? nativeSummary : page.locator('[data-sidebar-toggle]');
    await control.focus();
    await page.keyboard.press('Enter');
    const openedByEnter = await page.evaluate(mode => mode === 'details'
      ? Boolean(document.querySelector('.archive-mobile-nav')?.open)
      : document.body.classList.contains('is-sidebar-expanded'), mode);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.waitForFunction(mode => mode === 'details'
      ? Boolean(document.querySelector('.archive-mobile-nav')?.open)
      : document.body.classList.contains('is-sidebar-expanded'), mode);
    archiveMobileStates.push(await page.evaluate(({ width, route, openedByEnter, mode }) => {
      const box = node => {
        const rect = node?.getBoundingClientRect();
        return rect ? { width:rect.width, height:rect.height } : null;
      };
      const root = mode === 'details' ? document.querySelector('.archive-mobile-nav') : document.querySelector('.site-sidebar');
      const control = mode === 'details' ? root?.querySelector(':scope > summary') : root?.querySelector('[data-sidebar-toggle]');
      const links = [...(mode === 'details' ? root?.querySelectorAll('nav a[href]') || [] : root?.querySelectorAll('.site-sidebar-nav a[href]') || [])];
      const visible = node => Boolean(node) && getComputedStyle(node).display !== 'none' && Boolean(node.getClientRects().length);
      const editorControls = [...(root?.querySelectorAll('a,button') || [])]
        .filter(node => /editor/i.test(`${node.getAttribute('href') || ''} ${node.textContent || ''} ${node.getAttribute('aria-label') || ''}`));
      return {
        width, route, mode, openedByEnter,
        openedBySpace:mode === 'details' ? Boolean(root?.open) : document.body.classList.contains('is-sidebar-expanded'),
        rootVisible:visible(root), controlExpanded:mode === 'details' ? String(Boolean(root?.open)) : control?.getAttribute('aria-expanded') || '',
        linkHrefs:links.map(link => link.getAttribute('href') || ''),
        editorControls:editorControls.length, controlBox:box(control), linkBoxes:links.map(box),
        noHorizontalOverflow:document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth,
      };
    }, { width, route, openedByEnter, mode }));
    await context.close();
  }
}
record('stories-faction-cultivate-mobile-public-navigation-is-keyboard-accessible-and-overflow-safe',
  archiveMobileStates.length === 6 && archiveMobileStates.every(state => {
    const expectedLinks = state.mode === 'details'
      ? 'mainline.html|stories.html|events.html|cultivate.html|behind-scenes.html'
      : 'index.html|mainline.html|stories.html|events.html|cultivate.html|behind-scenes.html|stories.html#agentSearchForm';
    const linkGeometryPassed = state.mode === 'details'
      ? state.linkBoxes.length === 5 && state.linkBoxes.every(box => box && box.height >= 44)
      : state.linkBoxes.length === 7;
    return state.openedByEnter && state.openedBySpace && state.rootVisible && state.controlExpanded === 'true'
      && state.linkHrefs.join('|') === expectedLinks && state.editorControls === 0 && state.controlBox?.height >= 44
      && linkGeometryPassed && state.noHorizontalOverflow;
  }),
  { archiveMobileStates });

const archiveDesktopNavStates = [];
for (const route of archiveMobileRoutes) {
  const context = await browser.newContext({ viewport:{ width:641, height:844 } });
  const page = await context.newPage();
  await page.goto(`${base}/${route}`, { waitUntil:'networkidle' });
  archiveDesktopNavStates.push(await page.evaluate(route => {
    const visible = node => Boolean(node) && getComputedStyle(node).display !== 'none' && Boolean(node.getClientRects().length);
    const sidebar = document.querySelector('.site-sidebar');
    const desktop = document.querySelector('.archive-topbar > nav');
    const mobile = document.querySelector('.archive-mobile-nav');
    return {
      route,
      mode:sidebar ? 'sidebar' : 'archive-nav',
      sidebarVisible:visible(sidebar),
      toggleVisible:visible(document.querySelector('[data-sidebar-toggle]')),
      sidebarLinks:document.querySelectorAll('.site-sidebar-nav a[href]').length,
      desktopVisible:visible(desktop),
      desktopLinks:desktop?.querySelectorAll('a[href]').length || 0,
      mobileVisible:visible(mobile),
    };
  }, route));
  await context.close();
}
record('stories-faction-cultivate-641px-use-current-public-navigation-without-duplicate-mobile-controls',
  archiveDesktopNavStates.length === 3 && archiveDesktopNavStates.every(state => state.mode === 'sidebar'
    ? state.sidebarVisible && state.toggleVisible && state.sidebarLinks === 7 && !state.desktopVisible && !state.mobileVisible
    : state.desktopVisible && state.desktopLinks === 5 && !state.mobileVisible && !state.sidebarVisible),
  { archiveDesktopNavStates });

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 }, reducedMotion:'no-preference' });
  const page = await context.newPage();
  const sourceState = () => page.evaluate(() => {
    const sources = document.querySelector('#sources');
    return {
      hash:location.hash, focused:document.activeElement?.id || '', inside:document.body.classList.contains('is-inside'),
      opening:document.body.classList.contains('is-opening'), visible:Boolean(sources?.getClientRects().length),
    };
  });
  await page.goto(`${base}/tape-wall-sample.html#sources`, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.activeElement?.id === 'sources');
  const initial = await sourceState();
  await page.evaluate(() => { location.hash = '#catalog'; });
  await page.waitForFunction(() => document.activeElement?.id === 'catalog');
  await page.evaluate(() => { location.hash = '#sources'; });
  await page.waitForFunction(() => document.activeElement?.id === 'sources');
  const hashchange = await sourceState();
  record('play-sources-initial-and-hashchange-enter-without-animation-and-preserve-real-focus',
    [initial, hashchange].every(state => state.hash === '#sources' && state.focused === 'sources' && state.inside && !state.opening && state.visible),
    { initial, hashchange });
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 }, reducedMotion:'no-preference' });
  const page = await context.newPage();
  await page.goto(`${base}/tape-wall-sample.html#store-interior`, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.activeElement?.id === 'store-interior');
  const covers = await page.evaluate(() => [...document.querySelectorAll('.tape-wall-tape__cover')].map(image => ({
    src:image.getAttribute('src') || '', loading:image.loading, decoding:image.decoding, fetchpriority:image.getAttribute('fetchpriority') || '',
  })));
  const flight = await page.evaluate(() => {
    const live = document.querySelector('[data-live-status]');
    const flyers = () => document.querySelectorAll('.tape-wall-flyer').length;
    const buttons = [...document.querySelectorAll('.tape-wall-tape')];
    let maxFlyers = flyers();
    const samples = [];
    const announcements = [];
    const flyerObserver = new MutationObserver(() => { maxFlyers = Math.max(maxFlyers, flyers()); });
    const liveObserver = new MutationObserver(() => {
      const text = live?.textContent.trim() || '';
      if (/^已把《/.test(text)) announcements.push(text);
    });
    flyerObserver.observe(document.body, { childList:true, subtree:true });
    liveObserver.observe(live, { childList:true, characterData:true, subtree:true });
    buttons[0]?.click();
    samples.push(flyers());
    const first = buttons[0]?.dataset.tapeId || '';
    buttons[1]?.click();
    samples.push(flyers());
    const final = buttons[1]?.dataset.tapeId || '';
    return new Promise(resolve => setTimeout(() => {
      flyerObserver.disconnect();
      liveObserver.disconnect();
      resolve({
        first, final, samples, maxFlyers, announcements,
        active:document.querySelector('.tape-wall-tape.is-active')?.dataset.tapeId || '',
        code:document.querySelector('[data-viewer-code]')?.textContent || '',
        live:live?.textContent.trim() || '', flyers:flyers(),
      });
    }, 700));
  });
  await page.keyboard.press('Escape');
  const afterEscape = await page.evaluate(() => ({
    flyers:document.querySelectorAll('.tape-wall-flyer').length, active:document.querySelectorAll('.tape-wall-tape.is-active').length,
    image:document.querySelector('[data-viewer-image]')?.getAttribute('src') || '', closeDisabled:document.querySelector('[data-viewer-close]')?.disabled ?? false,
    disabled:document.querySelector('[data-viewer-link]')?.getAttribute('aria-disabled') || '',
  }));
  await page.evaluate(() => document.querySelector('.tape-wall-tape')?.click());
  await page.waitForTimeout(700);
  await page.locator('[data-viewer-close]').click();
  const afterReturn = await page.evaluate(() => ({ flyers:document.querySelectorAll('.tape-wall-flyer').length, active:document.querySelectorAll('.tape-wall-tape.is-active').length, image:document.querySelector('[data-viewer-image]')?.getAttribute('src') || '' }));
  await page.evaluate(() => document.querySelector('.tape-wall-tape')?.click());
  await page.locator('[data-filter="character"]').click();
  const afterFilter = await page.evaluate(() => ({
    flyers:document.querySelectorAll('.tape-wall-flyer').length, active:document.querySelectorAll('.tape-wall-tape.is-active').length,
    image:document.querySelector('[data-viewer-image]')?.getAttribute('src') || '', filter:document.querySelector('[data-filter="character"]')?.getAttribute('aria-pressed') || '',
  }));
  record('play-local-lazy-covers-and-concurrent-selection-flight-cleanup-contracts',
    covers.length === 10 && covers.every(cover => /^assets\/portraits\/.+\.(?:png|jpe?g|webp)$/i.test(cover.src) && cover.loading === 'lazy' && cover.decoding === 'async' && cover.fetchpriority === 'low')
      && flight.samples.every(count => count <= 1) && flight.maxFlyers <= 1 && flight.flyers === 0
      && flight.active === flight.final && flight.final && flight.final !== flight.first && flight.code.includes(flight.final.toUpperCase())
      && /^已把《/.test(flight.live) && flight.announcements.length <= 1
      && afterEscape.flyers === 0 && afterEscape.active === 0 && !afterEscape.image && afterEscape.closeDisabled && afterEscape.disabled === 'true'
      && afterReturn.flyers === 0 && afterReturn.active === 0 && !afterReturn.image
      && afterFilter.flyers === 0 && afterFilter.active === 0 && !afterFilter.image && afterFilter.filter === 'true',
    { covers, flight, afterEscape, afterReturn, afterFilter });
  await context.close();
}

{
  const allowedRelative = 'assets/icons/cunning-hares.png';
  const allowedSameOrigin = `${base}/assets/icons/cunning-hares.png`;
  const previewCases = [
    { id:'allow-relative', image:allowedRelative, allowed:true },
    { id:'allow-same-origin', image:allowedSameOrigin, allowed:true },
    { id:'reject-html', image:'/index.html', allowed:false },
    { id:'reject-api', image:'/api/auth/session', allowed:false },
    { id:'reject-external', image:'https://example.test/cover.png', allowed:false },
    { id:'reject-protocol-relative', image:'//example.test/cover.png', allowed:false },
    { id:'reject-javascript', image:'javascript:alert(1)', allowed:false },
    { id:'reject-data', image:'data:image/png;base64,AAAA', allowed:false },
    { id:'reject-blob', image:'blob:https://example.test/cover', allowed:false },
    { id:'reject-backslash', image:'assets\\icons\\cunning-hares.png', allowed:false },
    { id:'reject-encoded-escape', image:'/assets/%2e%2e/index.png', allowed:false },
    { id:'reject-dotdot-escape', image:'/assets/../index.png', allowed:false },
    { id:'reject-non-image', image:'/assets/icons/cunning-hares.txt', allowed:false },
  ];
  const preview = {
    factions:previewCases.map(item => ({ id:item.id, name:item.id, members:[`${item.id}-agent`], logo:item.image, theme:'#f3d33b' })),
    characters:previewCases.map(item => ({ id:`${item.id}-agent`, name:item.id, factionId:item.id, portrait:item.image, attribute:'Ether', specialty:'Attack' })),
    stories:[], mainline:[], behindScenes:[], events:[],
  };
  const context = await browser.newContext({ viewport:{ width:1280, height:800 } });
  await context.addInitScript(value => localStorage.setItem('hooxi:preview:data', JSON.stringify(value)), preview);
  const page = await context.newPage();
  const previewResults = [];
  for (const item of previewCases) {
    await page.goto(`${base}/faction.html?id=${item.id}&editorPreview=1`, { waitUntil:'networkidle' });
    previewResults.push(await page.evaluate(item => {
      const images = [...document.querySelectorAll('#factionLogo img,#factionDetail img')].map(image => image.getAttribute('src') || '');
      const valid = src => {
        try {
          const url = new URL(src, location.href);
          return url.origin === location.origin && /^\/assets\//.test(url.pathname) && /\.(?:png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
        } catch { return false; }
      };
      return { id:item.id, allowed:item.allowed, images, valid:images.every(valid) };
    }, item));
  }
  record('faction-editor-preview-image-whitelist-allows-only-same-origin-assets-images',
    previewResults.length === previewCases.length && previewResults.every(result => result.allowed ? result.images.length === 2 && result.valid : result.images.length === 0),
    { previewResults });
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1280, height:800 } });
  const page = await context.newPage();
  await page.goto(`${base}/faction.html`, { waitUntil:'networkidle' });
  const directory = await page.evaluate(() => ({
    ids:[...document.querySelectorAll('[data-faction-id]')].map(node => node.dataset.factionId || ''),
    images:[...document.querySelectorAll('#factionDirectoryList img')].map(image => image.getAttribute('src') || ''),
  }));
  const validAsset = src => /^assets\/.+\.(?:png|jpe?g|webp|gif|svg)$/i.test(src);
  const formalResults = [];
  for (const id of directory.ids) {
    await page.goto(`${base}/faction.html?id=${encodeURIComponent(id)}`, { waitUntil:'networkidle' });
    formalResults.push(await page.evaluate(id => ({
      id,
      images:[...document.querySelectorAll('#factionLogo img,#factionDetail img')].map(image => image.getAttribute('src') || ''),
    }), id));
  }
  record('faction-formal-directory-and-all-18-details-retain-local-asset-emblems-and-member-images',
    directory.ids.length === 18 && directory.images.length === 18 && directory.images.every(validAsset)
      && formalResults.length === 18 && formalResults.every(result => result.images.length >= 2 && result.images.every(validAsset)),
    { directory, formalResults });
  await context.close();
}

{
  const remielleWikiUrl = 'https://baike.mihoyo.com/zzz/wiki/content/2076/detail?mhy_presentation_style=fullscreen';
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${base}/character.html?id=remielle`, { waitUntil:'networkidle' });
  const characterState = await page.evaluate(() => {
    const character = (window.archiveData?.characters || []).find(item => item.id === 'remielle');
    const text = selector => (document.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
    return {
      character,
      name:text('#characterName'),
      englishName:text('#characterEnglishName'),
      meta:text('#characterMeta'),
      profile:text('#profile'),
      related:text('#related'),
      sourceHrefs:[...document.querySelectorAll('#related a[data-source-action]')].map(link => link.href),
    };
  });
  const pendingFields = ['rank','attribute','specialty','attackType','releaseDate','signatureWEngine','birthday','cv'];
  record('remielle-character-fields-links-and-visible-pending-contract',
    characterState.character?.name === '蕾米埃尔·丹'
      && characterState.character?.englishName === 'REMIELLE'
      && characterState.character?.factionId === 'covenant-of-dayat'
      && characterState.character?.wikiUrl === remielleWikiUrl
      && pendingFields.every(field => characterState.character?.[field] === '待公布')
      && characterState.name === '蕾米埃尔·丹'
      && characterState.englishName === 'REMIELLE'
      && /达识结社/.test(characterState.meta)
      && /稀有度[^]*待公布/.test(characterState.profile)
      && /作战属性[^]*待公布/.test(characterState.profile)
      && /战斗特性[^]*待公布/.test(characterState.profile)
      && /攻击类型[^]*待公布/.test(characterState.profile)
      && /实装日期[^]*待公布/.test(characterState.profile)
      && /生日[^]*待公布/.test(characterState.profile)
      && /签名音擎[^]*待公布/.test(characterState.profile)
      && /角色\s*CV[^]*待公布/i.test(characterState.profile)
      && characterState.sourceHrefs.includes(remielleWikiUrl),
    { characterState, pendingFields });

  await page.goto(`${base}/stories.html?agent=remielle`, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.querySelector('#selectedAgentPortrait')?.dataset.stageAgentId === 'remielle');
  const storiesState = await page.evaluate(() => {
    const stage = document.querySelector('#selectedAgentStage');
    const stagePortrait = document.querySelector('#selectedAgentPortrait');
    const primary = document.querySelector('#selectedAgentPrimaryLink');
    const faction = document.querySelector('#selectedAgentFaction');
    const art = document.querySelector('#selectedAgentStage .agent-stage-art img');
    const portrait = document.querySelector('#selectedAgentPortrait img');
    const card = document.querySelector('[data-agent-id="remielle"] img');
    return {
      name:document.querySelector('#selectedAgentName')?.textContent?.trim() || '',
      stageAgentId:stagePortrait?.dataset.stageAgentId || '',
      artSource:stage?.dataset.characterArtSource || '',
      artPath:stage?.dataset.characterArtPath || '',
      portraitSource:stage?.dataset.portraitSource || '',
      primaryHref:primary?.getAttribute('href') || '',
      factionHref:faction?.getAttribute('href') || '',
      artSrc:art?.getAttribute('src') || '',
      portraitSrc:portrait?.getAttribute('src') || '',
      cardSrc:card?.getAttribute('src') || '',
    };
  });
  record('stories-remielle-links-faction-and-stage-assets-resolve',
    storiesState.name === '蕾米埃尔·丹'
      && storiesState.stageAgentId === 'remielle'
      && storiesState.artSource === 'default'
      && storiesState.artPath === 'assets/mindscape/default/remielle.webp'
      && storiesState.portraitSource === 'portrait'
      && storiesState.primaryHref === 'character.html?id=remielle'
      && storiesState.factionHref === 'faction.html?id=covenant-of-dayat'
      && storiesState.artSrc === 'assets/mindscape/default/remielle.webp'
      && storiesState.portraitSrc === 'assets/portraits/remielle-portrait.webp'
      && storiesState.cardSrc === 'assets/portraits/remielle-card.webp',
    storiesState);

  await page.goto(`${base}/faction.html?id=covenant-of-dayat`, { waitUntil:'networkidle' });
  const factionState = await page.evaluate(() => {
    const source = document.querySelector('#factionSourceStatus');
    const context = document.querySelector('#factionContextContent');
    const action = document.querySelector('#factionSourceAction a[data-source-action]');
    const member = document.querySelector('#factionMembers a[href="character.html?id=remielle"]');
    return {
      sourceText:source?.textContent?.replace(/\s+/g, ' ').trim() || '',
      contextText:context?.textContent?.replace(/\s+/g, ' ').trim() || '',
      actionHref:action?.href || '',
      memberHref:member?.getAttribute('href') || '',
    };
  });
  record('covenant-of-dayat-uses-remielle-scoped-official-member-source',
    /角色(?:百科)?页/.test(factionState.sourceText)
      && /成员关系/.test(`${factionState.sourceText} ${factionState.contextText}`)
      && !/阵营专属词条/.test(`${factionState.sourceText} ${factionState.contextText}`)
      && factionState.actionHref === remielleWikiUrl
      && factionState.memberHref === 'character.html?id=remielle',
    factionState);
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/character.html?id=anby`, { waitUntil:'networkidle' });
  const sidebar = await page.evaluate(() => ({
    exists:document.querySelector('.site-sidebar') instanceof HTMLElement,
    editorLinks:[...document.querySelectorAll('.site-sidebar a[href],.site-sidebar button')].filter(node => /editor/i.test(`${node.getAttribute('href') || ''} ${node.textContent || ''} ${node.getAttribute('aria-label') || ''}`)).map(node => node.outerHTML),
  }));
  record('public-site-sidebar-has-no-editor-button-or-link', sidebar.exists && sidebar.editorLinks.length === 0, sidebar);
  await context.close();
}

const characterRepresentatives = [
  { id:'anby', source:'default', resolverSource:'default', creditMode:'default', composition:'default', expected:'/assets/mindscape/default/anby.webp', portraitSource:'portrait', portrait:'/assets/portraits/anby-portrait.webp', portraitAlt:/全身立绘/ },
  { id:'aria', source:'default-with-portrait-foreground', resolverSource:'default', creditMode:'default', composition:'default', expected:'/assets/mindscape/default/aria.webp', portraitSource:'portrait', portrait:'/assets/portraits/aria-portrait.webp', portraitAlt:/全身立绘/ },
  { id:'sunna', source:'default-with-portrait-foreground', resolverSource:'default', creditMode:'default', composition:'default', expected:'/assets/mindscape/default/sunna.webp', portraitSource:'portrait', portrait:'/assets/portraits/sunna-portrait.webp', portraitAlt:/全身立绘/ },
  { id:'remielle', source:'default-with-official-wiki-credit', resolverSource:'default', creditMode:'official-wiki', composition:'exception', expected:'/assets/mindscape/default/remielle.webp', portraitSource:'portrait', portrait:'/assets/portraits/remielle-portrait.webp', portraitAlt:/全身立绘/ },
  { id:'norma', source:'gallery-background-with-full-body', resolverSource:'gallery', creditMode:'gallery', composition:'default', expected:'/assets/gallery/norma/05.png', portraitSource:'portrait', portrait:'/assets/portraits/norma-portrait.webp', portraitAlt:/全身立绘/ },
];
for (const representative of characterRepresentatives) {
  let defaultSourceSnapshot = null;
  for (const hash of ['', '#art']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const localImages = [];
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.origin === new URL(base).origin && /\.(?:png|jpe?g|webp|avif)$/i.test(url.pathname)) localImages.push(url.pathname);
    });
    await page.goto(`${base}/character.html?id=${representative.id}${hash}`, { waitUntil:'networkidle' });
    const state = await page.evaluate(() => {
      const visible = element => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number.parseFloat(style.opacity || '1') > 0
          && rect.width > 0 && rect.height > 0;
      };
      const text = element => (element?.innerText || '').replace(/\s+/g, ' ').trim();
      const art = document.querySelector('#art[data-character-art-source]');
      const heroPortrait = document.querySelector('#characterHeroPortrait');
      const sourceCard = document.querySelector('#artSource.character-art-credit');
      const creditBranches = [...(sourceCard?.querySelectorAll('[data-character-art-credit]') || [])];
      const activeCredit = creditBranches.find(branch => visible(branch));
      const creditLink = activeCredit?.querySelector('a[data-source-action], a[href]');
      const footerSource = document.querySelector('#characterFooterSource');
      const creditText = text(activeCredit);
      const footerSourceText = text(footerSource);
      return {
        hash:location.hash,
        bodyClass:document.body.className,
        artVisible:visible(art),
        artId:art?.id || '',
        artSource:art?.getAttribute('data-character-art-source') || '',
        artPath:art?.getAttribute('data-character-art-path') || '',
        heroComposition:art?.dataset.heroComposition || '',
        heroPortrait:art?.dataset.heroPortrait || '',
        heroPortraitVisible:visible(heroPortrait),
        heroPortraitSource:heroPortrait?.dataset.portraitSource || '',
        heroPortraitPath:heroPortrait?.dataset.portraitPath || heroPortrait?.getAttribute('src') || '',
        heroPortraitAlt:heroPortrait?.getAttribute('alt') || '',
        heroPortraitLoaded:heroPortrait instanceof HTMLImageElement && heroPortrait.complete && heroPortrait.naturalWidth > 0,
        detailVisible:visible(document.querySelector('.character-detail-page')),
        identityAnchorVisible:visible(document.querySelector('.character-identity a[href^="faction.html?id="]')),
        dossierAnchorVisible:visible(document.querySelector('.character-dossier-link[href="#dossier"]')),
        moduleNavVisible:visible(document.querySelector('.character-module-nav')),
        moduleIds:[...document.querySelectorAll('#characterContent .character-module')].map(module => module.id),
        sourceModuleVisible:visible(document.querySelector('#related[data-source-section]')),
        legacyFirstFoldVisible:['.zzz-roster','.zzz-watermark','.zzz-idcard','.zzz-edge','.zzz-hud','.character-hud','.agent-roster-panel','[data-character-watermark]'].filter(selector => visible(document.querySelector(selector))),
        sourceCardVisible:visible(sourceCard),
        visibleCreditModes:creditBranches.filter(branch => visible(branch)).map(branch => branch.dataset.characterArtCredit || ''),
        creditMode:activeCredit?.dataset.characterArtCredit || '',
        creditText,
        footerSourceText,
        boundaryText:`${creditText} ${footerSourceText}`.replace(/\s+/g, ' ').trim(),
        creditHref:creditLink?.getAttribute('href') || '',
        creditLinkVisible:visible(creditLink),
      };
    });
    const archiveState = await readCharacterArchiveState(page);
    const paths = [...new Set(localImages)].sort();
    const sourceResolved = state.artSource === representative.resolverSource
      && (state.artPath.endsWith(representative.expected.replace(/^\/+/, '')) || paths.includes(representative.expected));
    const portraitResolved = state.heroPortraitVisible && state.heroPortraitLoaded
      && state.heroPortraitSource === representative.portraitSource
      && (state.heroPortraitPath.endsWith(representative.portrait.replace(/^\/+/, '')) || paths.includes(representative.portrait))
      && representative.portraitAlt.test(state.heroPortraitAlt);
    const attributionCorrect = representative.creditMode === 'gallery'
      ? state.sourceCardVisible
        && state.visibleCreditModes.length === 1
        && state.creditMode === 'gallery'
        && /站内.*本地.*官方\s*gallery/i.test(state.boundaryText)
        && /版权归米哈游/.test(state.boundaryText)
        && /非官方/.test(state.boundaryText)
        && !/Toastertjie/i.test(state.boundaryText)
        && /不使用\s*Default/i.test(state.boundaryText)
        && !state.creditHref
      : representative.creditMode === 'official-wiki'
        ? state.sourceCardVisible
          && state.visibleCreditModes.length === 1
          && state.creditMode === 'official-wiki'
          && state.creditLinkVisible
          && /米哈游.*百科/.test(state.boundaryText)
          && /版权归米哈游/.test(state.boundaryText)
          && !/Toastertjie|Steam/i.test(state.boundaryText)
          && state.creditHref === 'https://baike.mihoyo.com/zzz/wiki/content/2076/detail?mhy_presentation_style=fullscreen'
        : state.sourceCardVisible
          && state.visibleCreditModes.length === 1
          && state.creditMode === 'default'
          && state.creditLinkVisible
          && /Toastertjie/.test(state.boundaryText)
          && /Steam Workshop\s*3491187965/.test(state.boundaryText)
          && /许可|授权/.test(state.boundaryText)
          && /版权归米哈游/.test(state.boundaryText)
          && state.creditHref === 'https://steamcommunity.com/sharedfiles/filedetails/?id=3491187965';
    const sourceSnapshot = {
      creditMode:state.creditMode,
      creditText:state.creditText,
      footerSourceText:state.footerSourceText,
      creditHref:state.creditHref,
    };
    const sourceEquivalent = !hash || JSON.stringify(sourceSnapshot) === JSON.stringify(defaultSourceSnapshot);
    if (!hash) defaultSourceSnapshot = sourceSnapshot;
    record(`character-${representative.id}-${hash ? 'art-anchor' : 'default'}-uses-hero-and-single-active-archive-panel`,
      !state.bodyClass.split(/\s+/).includes('character-art-view')
        && state.artVisible && state.artId === 'art'
        && state.heroComposition === representative.composition && state.heroPortrait === 'foreground'
        && portraitResolved
        && state.detailVisible
        && state.identityAnchorVisible && state.dossierAnchorVisible
        && state.moduleNavVisible
        && JSON.stringify(state.moduleIds) === JSON.stringify(characterPanelNames)
        && state.legacyFirstFoldVisible.length === 0
        && characterArchiveStatePass(archiveState, 'media', { hash:hash || '' }),
      { representative, state, archiveState, paths, portraitResolved });
    record(`character-${representative.id}-${hash ? 'art-anchor' : 'default'}-resolves-${representative.source}`,
      sourceResolved && portraitResolved && attributionCorrect && sourceEquivalent,
      { representative, state, paths, sourceResolved, portraitResolved, attributionCorrect, sourceEquivalent });
    await context.close();
  }
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/character.html?id=anby`, { waitUntil:'networkidle' });
  const initial = await readCharacterArchiveState(page);
  const semanticTabCount = await page.evaluate(() => {
    const tablist = document.querySelector('#dossier [role="tablist"], .character-module-nav[role="tablist"]');
    return tablist ? [...tablist.querySelectorAll('[role="tab"]')].filter(tab => tab.closest('[role="tablist"]') === tablist).length : 0;
  });
  const clickStates = [];
  const historyStates = [];
  if (semanticTabCount === 4) {
    for (const target of ['lore','profile','related']) {
      await page.locator(`#dossier [role="tablist"] [role="tab"][aria-controls="${target}"]`).click();
      await page.waitForTimeout(50);
      clickStates.push({ target, state:await readCharacterArchiveState(page) });
    }
    for (const [direction, expected] of [['back','profile'],['back','lore'],['forward','profile'],['forward','related']]) {
      await page.evaluate(value => history[value](), direction);
      await page.waitForTimeout(80);
      historyStates.push({ direction, expected, state:await readCharacterArchiveState(page) });
    }
  }
  record('character-tabs-default-click-history-focus-and-single-panel-stay-synchronized',
    semanticTabCount === 4
      && characterArchiveStatePass(initial, 'media', { hash:'' })
      && clickStates.length === 3
      && clickStates.every(({ target, state }) => characterArchiveStatePass(state, target, { focus:true, hash:`#${target}` }))
      && historyStates.length === 4
      && historyStates.every(({ expected, state }) => characterArchiveStatePass(state, expected, { focus:true, hash:`#${expected}` })),
    { semanticTabCount, initial, clickStates, historyStates });

  const keyboardStates = [];
  await page.goto(`${base}/character.html?id=anby`, { waitUntil:'networkidle' });
  if (await page.locator('#dossier [role="tablist"] [role="tab"][aria-controls="media"]').count()) {
    await page.locator('#dossier [role="tablist"] [role="tab"][aria-controls="media"]').focus();
    for (const [key, expected] of [['ArrowRight','lore'],['ArrowLeft','media'],['ArrowLeft','related'],['Home','media'],['End','related']]) {
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
      keyboardStates.push({ key, expected, state:await readCharacterArchiveState(page) });
    }
  }
  record('character-tabs-support-arrow-home-end-roving-focus-and-hash',
    keyboardStates.length === 5
      && keyboardStates.every(({ expected, state }) => characterArchiveStatePass(state, expected, { focus:true, hash:`#${expected}` })),
    { keyboardStates });

  const legacyStates = [];
  const legacyOwnership = { art:'media', dossier:'media', story:'lore', growth:'profile', build:'profile', combat:'profile' };
  for (const [hash, expected] of Object.entries(legacyOwnership)) {
    await page.goto(`${base}/character.html?id=anby#${hash}`, { waitUntil:'networkidle' });
    await page.waitForTimeout(50);
    legacyStates.push({ hash, expected, state:await readCharacterArchiveState(page) });
  }
  record('character-legacy-hashes-resolve-to-owned-single-active-panel',
    legacyStates.length === Object.keys(legacyOwnership).length
      && legacyStates.every(({ hash, expected, state }) => characterArchiveStatePass(state, expected, { hash:`#${hash}` })),
    { legacyStates });
  await context.close();
}

{
  const galleryFallbacks = {
    norma:'assets/gallery/norma/05.png',
    pyrois:'assets/gallery/pyrois/05.png',
    velina:'assets/gallery/velina/06.png',
  };
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/character.html?id=anby`, { waitUntil:'networkidle' });
  const ids = await page.evaluate(() => (window.archiveData?.characters || []).map(character => character.id));
  const details = [];
  for (const id of ids) {
    const expectedPath = galleryFallbacks[id] || `assets/mindscape/default/${id}.webp`;
    const expectedSource = galleryFallbacks[id] ? 'gallery' : 'default';
    const expectedCreditMode = id === 'remielle' ? 'official-wiki' : expectedSource;
    const expectedPortraitSource = 'portrait';
    const expectedPortraitPath = `assets/portraits/${id}-portrait.webp`;
    await page.goto(`${base}/character.html?id=${encodeURIComponent(id)}`, { waitUntil:'networkidle' });
    await page.waitForFunction(() => {
      const keyart = document.querySelector('.d-keyart-image');
      const portrait = document.querySelector('#characterHeroPortrait');
      return keyart instanceof HTMLImageElement && keyart.complete && keyart.naturalWidth > 0
        && portrait instanceof HTMLImageElement && portrait.complete && portrait.naturalWidth > 0;
    });
    details.push(await page.evaluate(({ id, expectedPath, expectedSource, expectedCreditMode, expectedPortraitSource, expectedPortraitPath }) => {
      const text = element => (element?.innerText || element?.textContent || '').replace(/\s+/g, ' ').trim();
      const art = document.querySelector('#art[data-character-art-source]');
      const keyart = document.querySelector('.d-keyart');
      const keyartImage = keyart?.querySelector('.d-keyart-image');
      const portrait = document.querySelector('#characterHeroPortrait');
      const credit = [...document.querySelectorAll('#artSource [data-character-art-credit]')].find(branch => !branch.hidden);
      const creditText = text(credit);
      const boundaryText = `${creditText} ${text(document.querySelector('#characterFooterSource'))} ${text(document.querySelector('.footer-disclaimer'))}`;
      const creditHref = credit?.querySelector('a[data-source-action],a[href]')?.getAttribute('href') || '';
      const keyartLoaded = keyartImage instanceof HTMLImageElement && keyartImage.complete && keyartImage.naturalWidth > 0;
      const portraitLoaded = portrait instanceof HTMLImageElement && portrait.complete && portrait.naturalWidth > 0;
      const defaultAttribution = credit?.dataset.characterArtCredit === 'default'
        && /Toastertjie/.test(boundaryText)
        && /Steam Workshop\s*3491187965/.test(boundaryText)
        && /许可|授权/.test(boundaryText)
        && creditHref === 'https://steamcommunity.com/sharedfiles/filedetails/?id=3491187965';
      const officialWikiAttribution = credit?.dataset.characterArtCredit === 'official-wiki'
        && /米哈游.*百科/.test(boundaryText)
        && /版权归米哈游/.test(boundaryText)
        && !/Toastertjie|Steam/i.test(boundaryText)
        && creditHref === 'https://baike.mihoyo.com/zzz/wiki/content/2076/detail?mhy_presentation_style=fullscreen';
      const galleryAttribution = credit?.dataset.characterArtCredit === 'gallery'
        && /官方\s*gallery/i.test(boundaryText)
        && /版权归米哈游/.test(boundaryText)
        && /粉丝非官方/.test(boundaryText)
        && !/Toastertjie/i.test(boundaryText);
      return {
        id,
        expectedPath,
        expectedSource,
        expectedPortraitSource,
        expectedPortraitPath,
        artSource:art?.dataset.characterArtSource || '',
        artPath:art?.dataset.characterArtPath || '',
        keyartSource:keyart?.dataset.characterArtSource || '',
        keyartPath:keyart?.dataset.characterArtPath || '',
        keyartImagePath:keyartImage?.getAttribute('src') || '',
        keyartLoaded,
        portraitSource:portrait?.dataset.portraitSource || '',
        portraitPath:portrait?.dataset.portraitPath || '',
        portraitImagePath:portrait?.getAttribute('src') || '',
        portraitLoaded,
        creditMode:credit?.dataset.characterArtCredit || '',
        attribution:expectedCreditMode === 'official-wiki' ? officialWikiAttribution : expectedCreditMode === 'default' ? defaultAttribution : galleryAttribution,
      };
    }, { id, expectedPath, expectedSource, expectedCreditMode, expectedPortraitSource, expectedPortraitPath }));
  }
  const failures = details.filter(result => result.artSource !== result.expectedSource
    || result.artPath !== result.expectedPath
    || result.keyartSource !== result.expectedSource
    || result.keyartPath !== result.expectedPath
    || result.keyartImagePath !== result.expectedPath
    || !result.keyartLoaded
    || result.portraitSource !== result.expectedPortraitSource
    || result.portraitPath !== result.expectedPortraitPath
    || result.portraitImagePath !== result.expectedPortraitPath
    || !result.portraitLoaded
    || !result.attribution);
  const sourceCounts = details.reduce((counts, result) => {
    counts[result.artSource] = (counts[result.artSource] || 0) + 1;
    return counts;
  }, {});
  const creditCounts = details.reduce((counts, result) => {
    counts[result.creditMode] = (counts[result.creditMode] || 0) + 1;
    return counts;
  }, {});
  record('character-directory-all-57-details-resolve-loaded-keyart-foreground-and-attribution',
    ids.length === 57 && new Set(ids).size === 57
      && details.length === 57
      && sourceCounts.default === 54 && sourceCounts.gallery === 3
      && creditCounts.default === 53 && creditCounts['official-wiki'] === 1 && creditCounts.gallery === 3
      && failures.length === 0,
    { total:ids.length, sourceCounts, creditCounts, failures });
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/character.html?id=anby`, { waitUntil:'networkidle' });
  const themes = await page.evaluate(() => {
    const characters = window.archiveData?.characters || [];
    const table = window.agentXray || {};
    const valid = value => Array.isArray(value)
      && value.length === 3
      && value.every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255);
    const rows = characters.map(character => {
      const rec = table[character.id] || {};
      const source = ['i','l','c'].find(key => valid(rec[key])) || '';
      const value = source ? rec[source] : [];
      return { id:character.id, source, value, key:value.join(',') };
    });
    return {
      total:characters.length,
      rows,
      missing:rows.filter(row => !row.source).map(row => row.id),
      duplicateKeys:[...new Set(rows.filter(row => row.key).map(row => row.key).filter((key, index, all) => all.indexOf(key) !== index))],
    };
  });
  record('character-theme-priority-covers-57-independent-normal-paths',
    themes.total === 57
      && themes.missing.length === 0
      && themes.duplicateKeys.length === 0
      && themes.rows.every(row => ['i','l','c'].includes(row.source)),
    themes);
  await context.close();
}

const approvedHomeHeroActs = [
  'amusement-island-rescue','angel-muse-delusion','art-is-bangboo','artist-profile-book',
  'bangboo-genius-chip','beyond-sight','blade-shadow-coop','delusion-resonance',
  'extreme-judgment-trial','hollow-hunt-coronation','lame-crow-chronicle','lido-strange-tales',
  'mock-exam-comeback','old-dream-encore','silver-revival','simulated-annihilation',
  'sleepwalker-confession','tianshu-intel-atlas','wish-proxy-station',
];
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion:'no-preference' });
  const page = await context.newPage();
  await page.goto(`${base}/index.html`, { waitUntil:'networkidle' });
  const structure = await page.evaluate(({ approvedActs }) => {
    const art = document.querySelector('#heroNear');
    const source = art?.getAttribute('src') || '';
    let policy = { source, assetPath:'', sameOrigin:false, insideAssets:false, registeredPath:false };
    try {
      const url = new URL(source, location.href);
      const assetPath = url.pathname.replace(/^\/+/, '');
      const pathParts = assetPath.split('/');
      const layerName = pathParts.pop().replace(/\.webp$/i, '');
      const actSlug = pathParts.pop() || '';
      policy = {
        source,
        assetPath,
        sameOrigin:url.origin === location.origin,
        insideAssets:url.pathname.startsWith('/assets/'),
        registeredPath:assetPath.startsWith('assets/hero/acts/') && approvedActs.includes(actSlug),
        layerName,
        actSlug,
      };
    } catch {}
    return {
      artCount:document.querySelectorAll('#heroNear').length,
      policy,
      altText:(art?.getAttribute('alt') || '').trim(),
      captionCount:document.querySelectorAll('#heroActName').length,
      captionText:(document.querySelector('#heroActName')?.textContent || '').trim(),
      heroLiveCount:document.querySelectorAll('#homeHeroArt [aria-live]').length,
      // 轮播合同已废除：不得再出现任何换片控件或分层残留
      legacyCarousel:[
        '#heroCarouselTrack','#heroCarouselPause','#heroCarouselIndex','#heroCarouselStatus',
        '#heroCarouselPrev','#heroCarouselNext','#heroCarouselDots','.hero-carousel-dot',
        '#heroThumbstrip','.hero-thumb','[data-hero-slide]','#heroLayerBg','#heroLayerFg',
      ].filter(selector => document.querySelector(selector)),
      laneJumpCount:document.querySelectorAll('.home-lane-jump').length,
      laneMoreCount:document.querySelectorAll('.home-lane-card.more').length,
    };
  }, { approvedActs:approvedHomeHeroActs });
  record('home-has-single-registered-local-act-banner-and-no-carousel-controls',
    structure.artCount === 1
      && structure.policy.source
      && structure.policy.sameOrigin
      && structure.policy.insideAssets
      && structure.policy.registeredPath
      && structure.altText.length > 0
      && structure.captionCount === 1
      && structure.captionText.length > 0
      && structure.heroLiveCount === 0
      && structure.legacyCarousel.length === 0
      && structure.laneJumpCount === 0
      && structure.laneMoreCount === 0,
    structure);

  // 单图不再自动换片：等待超过原轮播周期后 src 必须保持不变
  const currentSrc = () => page.evaluate(() => document.querySelector('#heroNear')?.getAttribute('src') || '');
  const srcBefore = await currentSrc();
  await page.waitForTimeout(8_100);
  const srcAfter = await currentSrc();
  record('home-act-banner-does-not-auto-rotate',
    !!srcBefore && srcBefore === srcAfter,
    { srcBefore, srcAfter });

  // 文案与活动名角标必须完整落在视口内（视差位移不得把它们推出边界）
  const layout = await page.evaluate(() => {
    const box = selector => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:Math.round(r.left), right:Math.round(r.right), top:Math.round(r.top) };
    };
    return { copy:box('.hero-copy'), title:box('#heroTitle'), caption:box('#heroActName'), viewportWidth:window.innerWidth };
  });
  record('home-hero-copy-and-act-caption-stay-inside-viewport',
    !!layout.copy && !!layout.title && !!layout.caption
      && layout.copy.left >= 0
      && layout.title.left >= 0
      && layout.caption.left >= 0
      && layout.caption.right <= layout.viewportWidth,
    layout);

  // 深色满幅横幅上文案必须为浅色，否则不可读
  const contrast = await page.evaluate(() => {
    const lum = selector => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const m = getComputedStyle(el).color.match(/[\d.]+/g);
      if (!m) return null;
      const [r, g, b] = m.map(Number);
      return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    };
    return { title:lum('#heroTitle'), intro:lum('#heroIntro') };
  });
  record('home-hero-copy-is-light-on-dark-full-bleed-art',
    contrast.title !== null && contrast.intro !== null
      && contrast.title >= 180 && contrast.intro >= 180,
    contrast);
  await context.close();
}

{
  const mobileTopbars = [];
  for (const width of [320, 390]) {
    const context = await browser.newContext({ viewport:{ width, height:844 }, reducedMotion:'no-preference' });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil:'networkidle' });
    mobileTopbars.push(await page.evaluate(width => {
      const topbar = document.querySelector('.home-page .topbar');
      const brand = topbar?.querySelector(':scope > .brand');
      const toggle = topbar?.querySelector(':scope > #homeNavToggle');
      const endIcon = topbar?.querySelector(':scope > .icon-button:last-child');
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
      const brandBox = box(brand);
      const toggleBox = box(toggle);
      const iconBox = box(endIcon);
      const overlaps = (a, b) => !!a && !!b
        && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
        && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      return {
        width,
        brandVisible:visible(brand),
        brandText:(brand?.innerText || '').replace(/\s+/g, ' ').trim(),
        brandBox,
        toggleVisible:visible(toggle),
        toggleBox,
        iconVisible:visible(endIcon),
        iconBox,
        iconIsLast:topbar?.lastElementChild === endIcon,
        ordered:!!brandBox && !!toggleBox && !!iconBox
          && brandBox.left < toggleBox.left && toggleBox.left < iconBox.left,
        separated:!!brandBox && !!toggleBox && !!iconBox
          && !overlaps(brandBox, toggleBox) && !overlaps(toggleBox, iconBox) && !overlaps(brandBox, iconBox),
      };
    }, width));
    await context.close();
  }
  record('home-mobile-topbar-keeps-readable-brand-and-separate-44px-controls',
    mobileTopbars.length === 2 && mobileTopbars.every(state =>
      state.brandVisible
        && /HOOXI/.test(state.brandText)
        && state.brandBox?.width > 44
        && state.toggleVisible
        && state.toggleBox?.width >= 44 && state.toggleBox?.height >= 44
        && state.iconVisible
        && state.iconBox?.width >= 44 && state.iconBox?.height >= 44
        && state.iconIsLast
        && state.ordered
        && state.separated),
    { mobileTopbars });
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 }, reducedMotion:'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/index.html`, { waitUntil:'networkidle' });
  const before = await page.evaluate(() => document.querySelector('#heroNear')?.getAttribute('src') || '');
  await page.waitForTimeout(8_100);
  const after = await page.evaluate(() => document.querySelector('#heroNear')?.getAttribute('src') || '');
  record('home-reduced-motion-keeps-single-act-banner', !!before && before === after, { before, after });
  await context.close();
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  await page.goto(`${base}/events.html`, { waitUntil:'networkidle' });
  const oldEvent = await page.evaluate(() => {
    const group = [...document.querySelectorAll('details.archive-group')]
      .find(detail => detail.dataset.defaultOpen !== 'true' && detail.querySelector('.archive-record'));
    const record = group?.querySelector('.archive-record');
    return {
      groupId:group?.id || '',
      recordId:record?.id || '',
      title:(record?.querySelector('h3')?.textContent || '').trim(),
    };
  });
  if (!oldEvent.groupId || !oldEvent.recordId || !oldEvent.title) {
    record('events-search-opens-matching-old-group-and-clear-restores-latest', false, { oldEvent, reason:'缺少稳定旧版本活动样本' });
  } else {
    await page.locator('[data-filter="query"]').fill(oldEvent.title);
    const filtered = await page.evaluate(({ groupId, recordId }) => {
      const group = document.getElementById(groupId);
      const record = document.getElementById(recordId);
      return {
        groupVisible:Boolean(group && !group.hidden && group.getClientRects().length),
        groupOpen:group instanceof HTMLDetailsElement && group.open,
        recordVisible:Boolean(record && !record.hidden && record.getClientRects().length),
        openGroups:[...document.querySelectorAll('details.archive-group')].filter(group => group.open).map(group => group.id),
      };
    }, oldEvent);
    await page.locator('[data-filter-clear]').click();
    const cleared = await page.evaluate(() => ({
      openGroups:[...document.querySelectorAll('details.archive-group')].filter(group => group.open).map(group => group.id).sort(),
      defaultOpenGroups:[...document.querySelectorAll('details.archive-group[data-default-open="true"]')].map(group => group.id).sort(),
      hiddenGroups:[...document.querySelectorAll('details.archive-group')].filter(group => group.hidden).map(group => group.id),
    }));
    record('events-search-opens-matching-old-group-and-clear-restores-latest',
      filtered.groupVisible && filtered.groupOpen && filtered.recordVisible
        && filtered.openGroups.includes(oldEvent.groupId)
        && cleared.defaultOpenGroups.length === 1
        && JSON.stringify(cleared.openGroups) === JSON.stringify(cleared.defaultOpenGroups)
        && cleared.hiddenGroups.length === 0,
      { oldEvent, filtered, cleared });
  }

  await context.close();
  const focusBrowser = await chromium.launch({ headless:true });
  const focusContext = await focusBrowser.newContext({ viewport:{ width:1440, height:900 } });
  const hashPage = await focusContext.newPage();
  await hashPage.goto(`${base}/events.html?verify=batch3#event-group-ev-11`, { waitUntil:'networkidle' });
  await hashPage.waitForFunction(() => {
    const target = document.getElementById('event-group-ev-11');
    return document.activeElement === target?.querySelector(':scope > summary');
  });
  const groupHash = await hashPage.evaluate(() => {
    const target = document.getElementById('event-group-ev-11');
    const summary = target?.querySelector(':scope > summary');
    return {
      search:location.search,
      hash:location.hash,
      isDetails:target instanceof HTMLDetailsElement,
      open:target instanceof HTMLDetailsElement && target.open,
      summaryFocused:document.activeElement === summary,
    };
  });
  record('events-group-hash-opens-details-and-focuses-summary',
    groupHash.search === '?verify=batch3'
      && groupHash.hash === '#event-group-ev-11'
      && groupHash.isDetails && groupHash.open && groupHash.summaryFocused,
    groupHash);

  await hashPage.goto(`${base}/events.html?verify=batch3#event-11-001`, { waitUntil:'networkidle' });
  await hashPage.waitForTimeout(350);
  const recordHash = await hashPage.evaluate(() => {
    const target = document.getElementById('event-11-001');
    const ancestors = [];
    for (let node = target?.parentElement; node; node = node.parentElement) {
      if (node instanceof HTMLDetailsElement) ancestors.push({ id:node.id, open:node.open });
    }
    return {
      search:location.search,
      hash:location.hash,
      targetExists:!!target,
      targetVisible:Boolean(target && target.getClientRects().length),
      tabIndex:target?.tabIndex,
      targetFocused:document.activeElement === target,
      ancestors,
    };
  });
  record('events-record-hash-opens-ancestors-and-focuses-record',
    recordHash.search === '?verify=batch3'
      && recordHash.hash === '#event-11-001'
      && recordHash.targetExists && recordHash.targetVisible
      && recordHash.tabIndex === -1 && recordHash.targetFocused
      && recordHash.ancestors.length > 0 && recordHash.ancestors.every(ancestor => ancestor.open),
    recordHash);
  await focusContext.close();
  await focusBrowser.close();
}

{
  const routes = [
    { route:'mainline.html', dataKey:'mainline' },
    { route:'events.html', dataKey:'events' },
    { route:'behind-scenes.html', dataKey:'behindScenes' },
  ];
  const previewResults = [];
  for (const routeCase of routes) {
    const unsafeId = `batch3-unsafe-${routeCase.dataKey}`;
    const safeId = `batch3-safe-${routeCase.dataKey}`;
    const safePrimary = 'https://www.bilibili.com/video/BV1vy411B7cd';
    const safeSecondary = 'https://baike.mihoyo.com/zzz/wiki/content/783/detail';
    const preview = {
      [routeCase.dataKey]: [
        {
          id:unsafeId, title:'污染来源样本', summary:'危险链接不得进入 href。',
          video:'javascript:alert(1)', sourceUrl:'data:text/html,unsafe', wikiUrl:'not a valid url',
          version:'test', routeType:'测试记录', status:'测试', relatedIds:[], characters:[],
        },
        {
          id:safeId, title:'正式来源样本', summary:'正式链接应保持不变。',
          video:safePrimary, sourceUrl:safePrimary, wikiUrl:safeSecondary,
          sourceCheckedAt:'2026-07-23', rightsStatus:'fan-index-use', rightsNote:'仅用于链接原始来源。',
          version:'test', routeType:'测试记录', status:'测试', relatedIds:[], characters:[],
        },
      ],
      pageMeta:{ [routeCase.dataKey]:{ groups:[] } },
    };
    const context = await browser.newContext({ viewport:{ width:1280, height:800 } });
    await context.addInitScript(value => localStorage.setItem('hooxi:preview:data', JSON.stringify(value)), preview);
    const page = await context.newPage();
    await page.goto(`${base}/${routeCase.route}?editorPreview=1`, { waitUntil:'networkidle' });
    previewResults.push(await page.evaluate(({ unsafeId, safeId, safePrimary, safeSecondary, route }) => {
      const unsafe = document.getElementById(unsafeId);
      const safe = document.getElementById(safeId);
      const unsafeHrefs = [...(unsafe?.querySelectorAll('[href]') || [])].map(anchor => anchor.getAttribute('href') || '');
      const safePrimaryHref = safe?.querySelector(':scope .archive-source-action[href]')?.getAttribute('href') || '';
      const safeSecondaryHref = [...(safe?.querySelectorAll('details a[href]') || [])]
        .map(anchor => anchor.getAttribute('href') || '').find(href => href === safeSecondary) || '';
      return {
        route,
        unsafeExists:!!unsafe,
        unsafeHrefs,
        unsafeDisabledText:(unsafe?.querySelector('.archive-source-action.is-disabled')?.textContent || '').trim(),
        safeExists:!!safe,
        safePrimaryHref,
        safeSecondaryHref,
        twitterTitle:document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '',
      };
    }, { unsafeId, safeId, safePrimary, safeSecondary, route:routeCase.route }));
    await context.close();
  }
  record('three-page-preview-rejects-dangerous-links-and-keeps-http-links',
    previewResults.length === 3 && previewResults.every(result =>
      result.unsafeExists
        && result.unsafeHrefs.length === 0
        && /来源不可用/.test(result.unsafeDisabledText)
        && result.safeExists
        && result.safePrimaryHref === 'https://www.bilibili.com/video/BV1vy411B7cd'
        && result.safeSecondaryHref === 'https://baike.mihoyo.com/zzz/wiki/content/783/detail'),
    { previewResults });
  record('three-page-twitter-title-keeps-fan-unofficial-boundary',
    previewResults.length === 3 && previewResults.every(result => result.twitterTitle.includes('粉丝非官方')),
    { previewResults:previewResults.map(({ route, twitterTitle }) => ({ route, twitterTitle })) });
}

{
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  await context.addInitScript(() => {
    let archiveValue;
    Object.defineProperty(window, 'archiveData', {
      configurable:true,
      get(){ return archiveValue; },
      set(value){ archiveValue=value; window.__batch3ArchiveSnapshot=structuredClone(value); },
    });
  });
  const page = await context.newPage();
  await page.goto(`${base}/mainline.html`, { waitUntil:'networkidle' });
  const mainlineMedia = await page.evaluate(expected => expected.map(spec => {
    const record = document.getElementById(spec.archiveId);
    const details = record?.querySelector('details[data-archive-disclosure]');
    if (details) details.open=true;
    const metadata = details?.querySelector('.archive-record-details');
    const fields = Object.fromEntries([...(details?.querySelectorAll('dl > div') || [])].map(row => [
      (row.querySelector('dt')?.textContent || '').trim(),
      (row.querySelector('dd')?.textContent || '').trim(),
    ]));
    const original = window.archiveData?.mainline?.find(item => item.id === spec.archiveId);
    const pristine = window.__batch3ArchiveSnapshot?.mainline?.find(item => item.id === spec.archiveId);
    return {
      archiveId:spec.archiveId,
      recordExists:!!record,
      detailsExists:details instanceof HTMLDetailsElement,
      detailsOpen:details instanceof HTMLDetailsElement && details.open,
      metadataVisible:Boolean(metadata && metadata.getClientRects().length),
      sourceHref:record?.querySelector('.archive-source-action[href]')?.getAttribute('href') || '',
      sourceCheckedAt:fields['核验日期'] || '',
      rightsStatus:fields['权利状态'] || '',
      rightsNote:fields['使用说明'] || '',
      pristineHasDerivedFields:['sourceCheckedAt','rightsStatus','rightsNote'].some(field =>
        pristine && Object.prototype.hasOwnProperty.call(pristine, field)),
      originalUnchanged:JSON.stringify(original) === JSON.stringify(pristine),
    };
  }), [
    { archiveId:'mainline-1783788881092' },
    { archiveId:'mainline-1783792988187' },
  ]);
  record('mainline-runtime-derives-media-rights-details-without-mutating-archive-data',
    mainlineMedia.length === 2
      && mainlineMedia.every(result => result.recordExists && result.detailsExists && result.detailsOpen
        && result.metadataVisible
        && result.sourceCheckedAt === '2026-07-23'
        && result.rightsStatus === 'fan-index-use'
        && !result.pristineHasDerivedFields && result.originalUnchanged)
      && mainlineMedia[0]?.sourceHref === 'https://www.bilibili.com/video/BV1vy411B7cd'
      && /noReprint=false/.test(mainlineMedia[0]?.rightsNote || '')
      && /不等于已授权/.test(mainlineMedia[0]?.rightsNote || '')
      && /未获得转载或再分发授权/.test(mainlineMedia[0]?.rightsNote || '')
      && mainlineMedia[1]?.sourceHref === 'https://www.bilibili.com/video/BV1GE4m1R7k5'
      && /noReprint=true/.test(mainlineMedia[1]?.rightsNote || '')
      && /未经作者授权禁止转载/.test(mainlineMedia[1]?.rightsNote || '')
      && /立即撤下/.test(mainlineMedia[1]?.rightsNote || ''),
    { mainlineMedia });
  await context.close();
}

const disclosureRequiredRoutes = new Set([
  'mainline.html', 'stories.html', 'faction.html',
  'events.html', 'behind-scenes.html', 'cultivate.html',
]);
const formalPublicPages = [
  { name:'home', route:'index.html', path:'/index.html' },
  { name:'mainline', route:'mainline.html', path:'/mainline.html' },
  { name:'stories', route:'stories.html', path:'/stories.html' },
  { name:'character', route:'character.html', path:'/character.html?id=anby' },
  { name:'faction', route:'faction.html', path:'/faction.html?id=cunning-hares' },
  { name:'events', route:'events.html', path:'/events.html' },
  { name:'behind-scenes', route:'behind-scenes.html', path:'/behind-scenes.html' },
  { name:'cultivate', route:'cultivate.html', path:'/cultivate.html' },
  { name:'play', route:'tape-wall-sample.html', path:'/tape-wall-sample.html#store-interior' },
];
for (const routeCase of formalPublicPages) {
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await context.newPage();
  const disclosures = disclosureRequiredRoutes.has(routeCase.route);
  await page.goto(`${base}${routeCase.path}`, { waitUntil:'networkidle' });
  const structure = await page.evaluate(({ disclosures }) => {
    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') > 0
        && rect.width > 0 && rect.height > 0;
    };
    const sectionHeads = [...document.querySelectorAll('.section-head,[data-section-head]')].map(head => ({
      h2:head.querySelectorAll(':scope h2').length,
      descriptions:head.querySelectorAll(':scope > p,:scope > div > p').length,
    }));
    const details = [...document.querySelectorAll('details[data-archive-disclosure]')].filter(visible);
    const deepTarget = details.flatMap(detail => [...detail.querySelectorAll('[id]')]).find(Boolean) || null;
    const sourceNodes = [...document.querySelectorAll('[data-source-action],[data-source-section],#source,#sources,[data-unofficial-boundary],.footer-disclaimer')];
    return {
      h1Count:document.querySelectorAll('main h1').length,
      sectionHeads,
      disclosureRequired:disclosures,
      disclosureCount:details.length,
      disclosuresHaveSummary:details.every(detail => detail.querySelector(':scope > summary')),
      deepTargetId:deepTarget?.id || '',
      sourceNodeCount:sourceNodes.length,
      sourceVisible:sourceNodes.some(visible),
    };
  }, { disclosures });
  record(`${routeCase.name}-uses-stable-copy-budget-structure`,
    structure.h1Count === 1
      && structure.sectionHeads.every(head => head.h2 === 1 && head.descriptions <= 1)
      && (!structure.disclosureRequired || (structure.disclosureCount > 0 && structure.disclosuresHaveSummary && structure.deepTargetId))
      && structure.sourceVisible,
    structure);
  if (disclosures && structure.deepTargetId) {
    await page.evaluate(id => { location.hash = `#${id}`; }, structure.deepTargetId);
    await page.waitForTimeout(250);
    const expanded = await page.evaluate(id => {
      const target = document.getElementById(id);
      const ancestors = [];
      for (let node = target?.parentElement; node; node = node.parentElement) if (node instanceof HTMLDetailsElement) ancestors.push(node.open);
      return { ancestors, visible:Boolean(target && target.getClientRects().length) };
    }, structure.deepTargetId);
    record(`${routeCase.name}-deep-link-expands-progressive-disclosure`,
      expanded.ancestors.length > 0 && expanded.ancestors.every(Boolean) && expanded.visible,
      { target:structure.deepTargetId, ...expanded });
  }
  await context.close();
}

await browser.close();
if (serverHandle) await closeServer(serverHandle.server);
console.log(JSON.stringify({ passed: failures.length === 0, checks: checks.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
