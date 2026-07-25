import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

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
const route = `${base}/stories.html?agent=aria&verify=s1-7`;
const sizes = [
  [1920, 1080], [1440, 900], [1180, 800], [881, 800],
  [768, 900], [414, 896], [375, 812], [320, 700],
];
const failures = [];
const checks = [];
await mkdir(resolve(rootDir, 'artifacts'), { recursive: true });
const browser = await chromium.launch({ headless: true });

const record = (name, passed, detail = {}) => {
  checks.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
};

for (const [width, height] of sizes) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(route, { waitUntil: 'networkidle' });

  const state = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.agent-roster-card')];
    const panel = document.querySelector('.agent-roster-panel');
    const workbench = document.querySelector('#agentWorkbench');
    const normalize = value => {
      const probe = document.createElement('i');
      probe.style.color = value;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const frameGeometry = [cards.find(card => card.classList.contains('is-selected')), cards.find(card => !card.classList.contains('is-selected'))].filter(Boolean).map(card => {
      const image = card.querySelector('.agent-card-image');
      const before = getComputedStyle(card, '::before');
      const cardBox = card.getBoundingClientRect();
      const imageBox = image.getBoundingClientRect();
      const outerCut = cardBox.width * .18;
      const innerCut = imageBox.width * .18 + .5;
      const outerSlope = cardBox.height / outerCut;
      const innerSlope = imageBox.height / innerCut;
      const normalDistance = Math.abs(cardBox.height * 3 - outerCut * 3) / Math.hypot(cardBox.height, outerCut);
      return {
        id:card.dataset.agentId,
        selected:card.classList.contains('is-selected'),
        beforeContent:before.content,
        beforeBorders:[before.borderTopWidth, before.borderRightWidth, before.borderBottomWidth, before.borderLeftWidth],
        inset:[imageBox.left - cardBox.left, imageBox.top - cardBox.top, cardBox.right - imageBox.right, cardBox.bottom - imageBox.bottom],
        slopeDelta:Math.abs(outerSlope - innerSlope),
        normalDistance,
      };
    });
    return {
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      clip: cards[0] ? getComputedStyle(cards[0]).clipPath : '',
      frameGeometry,
      firstTrackTops: cards.slice(0, 3).map(card => Math.round(card.getBoundingClientRect().top)),
      theme: normalize(workbench?.style.getPropertyValue('--selected-agent-theme') || ''),
      rail: panel ? getComputedStyle(panel, '::after').backgroundColor : '',
      railContent: panel ? getComputedStyle(panel, '::after').content : '',
      transition: cards[0] ? getComputedStyle(cards[0]).transitionDuration : '',
      tickerCount: document.querySelectorAll('.agent-roster-ticker').length,
      tickerAriaHidden: document.querySelector('.agent-roster-tickers')?.getAttribute('aria-hidden') || '',
      tickerAnimation: document.querySelector('.agent-roster-ticker') ? getComputedStyle(document.querySelector('.agent-roster-ticker')).animationName : '',
      panelBackground: panel ? getComputedStyle(panel).backgroundColor : '',
      panelAlpha: panel ? parseFloat(getComputedStyle(panel).backgroundColor.match(/[\d.]+(?=\))/)?.[0] || '1') : 1,
      panelBackdrop: panel ? (getComputedStyle(panel).backdropFilter || getComputedStyle(panel).webkitBackdropFilter || '') : '',
      tickerOpacity: document.querySelector('.agent-roster-ticker') ? parseFloat(getComputedStyle(document.querySelector('.agent-roster-ticker')).opacity) : 0,
      controls: [...document.querySelectorAll('.agent-orbit-button, .agent-deep-links a, .agent-category-menu a, .agent-search-form input, .agent-search-form select, .agent-clear-button')].map(control => {
        const rect = control.getBoundingClientRect();
        const workbenchRect = document.querySelector('.agent-workbench-shell').getBoundingClientRect();
        return {
          className:control.className,
          width:rect.width,
          height:rect.height,
          disabled:control.matches(':disabled, [aria-disabled="true"]'),
          visible:control.getClientRects().length > 0,
          insideViewport:rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
          insideWorkbench:rect.left >= workbenchRect.left - 1 && rect.right <= workbenchRect.right + 1 && rect.top >= workbenchRect.top - 1 && rect.bottom <= workbenchRect.bottom + 1,
        };
      }),
      footerGap: document.querySelector('footer') ? Math.max(0, document.querySelector('footer').getBoundingClientRect().top - document.querySelector('#agentWorkbench').getBoundingClientRect().bottom) : null,
    };
  });

  record(`viewport-${width}-no-overflow`, !state.overflow, state);
  record(`viewport-${width}-cut-cards`, state.frameGeometry.length > 0 && state.frameGeometry.every(frame =>
    frame.beforeContent !== 'none'
      && frame.beforeContent !== 'normal'
      && frame.beforeBorders.every(value => parseFloat(value) >= .5)
      && frame.inset.every(value => value >= 2 && value <= 4)
  ), state);
  record(`viewport-${width}-no-errors`, errors.length === 0, { errors });
  record(`viewport-${width}-roster-tickers`, state.tickerCount === 2 && state.tickerAriaHidden === 'true', state);
  record(`viewport-${width}-translucent-roster`, state.panelBackground.includes('rgba') && state.panelAlpha >= .5 && state.panelAlpha <= .82 && state.panelBackdrop.includes('blur'), state);
  record(`viewport-${width}-ticker-visible-but-subordinate`, state.tickerOpacity >= .04 && state.tickerOpacity <= .07, state);
  record(`viewport-${width}-control-targets`, state.controls.filter(control => control.visible && !control.disabled).every(control => control.height >= 43.5), { controls:state.controls });
  record(`viewport-${width}-footer-follows-workbench`, state.footerGap !== null && state.footerGap >= 0 && state.footerGap <= 10, { footerGap:state.footerGap });
  if (width === 1440) {
    const keyControls = state.controls.filter(control => control.visible && !control.disabled);
    record('desktop-primary-controls-complete-in-viewport-and-workbench', keyControls.length >= 9 && keyControls.every(control => control.insideViewport && control.insideWorkbench), { controls:keyControls });
  }
  if (width > 880) {
    const firstRowCount = width > 1180 ? 3 : 2;
    const firstRowTops = state.firstTrackTops.slice(0, firstRowCount);
    const parallel = firstRowTops.length === firstRowCount
      && firstRowTops.every(top => Math.abs(top - firstRowTops[0]) <= 1);
    record(`viewport-${width}-parallel-tracks`, parallel, state);
    record(`viewport-${width}-theme-rail`, state.rail === state.theme && state.railContent.includes('SELECT'), state);
  }
  if (width === 1440 || width === 881) {
    record(`viewport-${width}-parallel-card-frame`, state.frameGeometry.length === 2 && state.frameGeometry.every(frame =>
      frame.beforeContent !== 'none'
        && frame.beforeContent !== 'normal'
        && frame.beforeBorders.every(value => parseFloat(value) >= .5)
        && frame.inset.every(value => Math.abs(value - 3) < .6)
        && frame.slopeDelta < .08
        && frame.normalDistance > 2 && frame.normalDistance < 4
    ), { frames:state.frameGeometry });
  }
  if (width === 1440) {
    await page.screenshot({ path: 'artifacts/agent-select-roster.png', fullPage: false });
  }
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto(route, { waitUntil: 'networkidle' });

  const rosterNames = await page.evaluate(() => [...document.querySelectorAll('.agent-roster-card')].map(card => {
    const name = card.querySelector('.agent-card-copy b');
    const cardRect = card.getBoundingClientRect();
    const nameRect = name?.getBoundingClientRect();
    const range = document.createRange();
    if (name) range.selectNodeContents(name);
    const textRect = name ? range.getBoundingClientRect() : null;
    const style = name ? getComputedStyle(name) : null;
    const cut = cardRect.width * .18;
    const relativeTop = textRect ? textRect.top - cardRect.top : 0;
    const relativeBottom = textRect ? textRect.bottom - cardRect.top : 0;
    const safeLeft = cardRect.left + cut * (relativeBottom / cardRect.height);
    const safeRight = cardRect.right - cut * (1 - relativeTop / cardRect.height);
    const rect = textRect ? {
      left:textRect.left,
      top:textRect.top,
      right:textRect.right,
      bottom:textRect.bottom,
      width:textRect.width,
      height:textRect.height,
    } : null;
    const visible = Boolean(name && textRect)
      && style.textOverflow !== 'ellipsis'
      && name.scrollWidth <= name.clientWidth + 1
      && name.scrollHeight <= name.clientHeight + 2
      && textRect.left >= nameRect.left - 2
      && textRect.right <= nameRect.right + 2
      && textRect.top >= nameRect.top - 2
      && textRect.bottom <= nameRect.bottom + 2
      && textRect.left >= safeLeft - 2
      && textRect.right <= safeRight + 2;
    return {
      id:card.dataset.agentId || '',
      name:name?.textContent.trim() || '',
      rect,
      visible,
      safe:{ left:safeLeft, right:safeRight },
      overflow:style ? { textOverflow:style.textOverflow, overflow:style.overflow, scrollWidth:name.scrollWidth, clientWidth:name.clientWidth } : null,
    };
  }));
  record('roster-names-fully-visible', rosterNames.length > 0 && rosterNames.every(item => item.visible), {
    failures:rosterNames.filter(item => !item.visible).map(({ id, name, rect, safe, overflow }) => ({ id, name, rect, safe, overflow })),
  });

  const rosterGutters = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.agent-roster-card')].slice(0, 4);
    const boxes = cards.map(card => {
      const rect = card.getBoundingClientRect();
      return { id:card.dataset.agentId || '', left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, width:rect.width, height:rect.height };
    });
    const horizontal = [[0, 1], [1, 2]].map(([leftIndex, rightIndex]) => {
      const left = boxes[leftIndex];
      const right = boxes[rightIndex];
      if (!left || !right) return { cards:[left?.id || '', right?.id || ''], gap:null };
      const overlapTop = Math.max(left.top, right.top);
      const overlapBottom = Math.min(left.bottom, right.bottom);
      const y = (overlapTop + overlapBottom) / 2;
      const leftCut = left.width * .18;
      const rightCut = right.width * .18;
      const leftVisibleRight = left.right - leftCut * (1 - (y - left.top) / left.height);
      const rightVisibleLeft = right.left + rightCut * ((y - right.top) / right.height);
      return { cards:[left.id, right.id], y, gap:rightVisibleLeft - leftVisibleRight, edges:{ leftVisibleRight, rightVisibleLeft } };
    });
    const vertical = boxes[0] && boxes[3]
      ? { cards:[boxes[0].id, boxes[3].id], gap:boxes[3].top - boxes[0].bottom }
      : { cards:[boxes[0]?.id || '', boxes[3]?.id || ''], gap:null };
    return { horizontal, vertical };
  });
  record('roster-cards-use-tight-visual-gutters',
    rosterGutters.horizontal.length === 2
      && rosterGutters.horizontal.every(item => item.gap !== null && item.gap >= 32 && item.gap <= 52)
      && rosterGutters.vertical.gap !== null
      && rosterGutters.vertical.gap >= 0 && rosterGutters.vertical.gap <= 6,
    rosterGutters);

  const workbenchBox = await page.locator('#agentWorkbench').boundingBox();
  await page.mouse.move(workbenchBox.x + workbenchBox.width * .24, workbenchBox.y + workbenchBox.height * .28);
  await page.waitForTimeout(80);
  const stageMotion = await page.evaluate(() => ({
    gridX: document.querySelector('#agentWorkbench')?.style.getPropertyValue('--stage-grid-x') || '',
    portraitX: document.querySelector('#agentWorkbench')?.style.getPropertyValue('--portrait-x') || '',
  }));
  const stageMotionValues = [stageMotion.gridX, stageMotion.portraitX].map(value => Number.parseFloat(value));
  record('pointer-drives-stage',
    stageMotionValues.every(value => Number.isFinite(value) && Math.abs(value) > .01),
    stageMotion);

  const aria = page.locator('[data-agent-id="aria"]');
  const ariaBox = await aria.boundingBox();
  await page.mouse.move(ariaBox.x + ariaBox.width * .76, ariaBox.y + ariaBox.height * .34);
  await page.waitForTimeout(260);
  const cardMotion = await aria.evaluate(card => ({
    panX: card.style.getPropertyValue('--card-pan-x'),
    panY: card.style.getPropertyValue('--card-pan-y'),
    transform: getComputedStyle(card.querySelector('img')).transform,
  }));
  const cardMotionValues = [cardMotion.panX, cardMotion.panY].map(value => Number.parseFloat(value));
  record('pointer-drives-card-portrait',
    cardMotionValues.every(value => Number.isFinite(value) && Math.abs(value) > .01)
      && cardMotion.transform !== 'none',
    cardMotion);

  const hoverGeometry = await aria.evaluate(card => {
    const matrix = value => new DOMMatrixReadOnly(value === 'none' ? undefined : value);
    const image = card.querySelector('img');
    const cardTransform = matrix(getComputedStyle(card).transform);
    const imageTransform = matrix(getComputedStyle(image).transform);
    return {
      expectedTrackY: 0,
      actualTrackY: cardTransform.m42,
      panX: parseFloat(card.style.getPropertyValue('--card-pan-x')) || 0,
      panY: parseFloat(card.style.getPropertyValue('--card-pan-y')) || 0,
      imageX: imageTransform.m41,
      imageY: imageTransform.m42,
      imageHeight: image.getBoundingClientRect().height / imageTransform.d,
      imageScale: imageTransform.a,
    };
  });
  record('hover-retains-track-and-consumes-pan',
    Math.abs(hoverGeometry.actualTrackY - hoverGeometry.expectedTrackY) < .6
      && Math.abs(hoverGeometry.imageX - hoverGeometry.panX) < .6
      && Math.abs(hoverGeometry.imageY - (hoverGeometry.panY - hoverGeometry.imageHeight * .03)) < .6,
    hoverGeometry);

  const grades = await page.evaluate(() => [...document.querySelectorAll('.agent-roster-card')].map(card => {
    const badge = card.querySelector('.agent-card-grade');
    const cardBox = card.getBoundingClientRect();
    const gradeBox = badge?.getBoundingClientRect();
    const cut = cardBox.width * .18;
    const points = gradeBox ? [
      [gradeBox.left, gradeBox.top], [gradeBox.right, gradeBox.top],
      [gradeBox.left, gradeBox.bottom], [gradeBox.right, gradeBox.bottom],
    ].map(([x, y]) => ({ x:x - cardBox.left, y:y - cardBox.top })) : [];
    const inside = points.length === 4 && points.every(point => {
      const leftEdge = cut * (point.y / cardBox.height);
      const rightEdge = cardBox.width - cut * (1 - point.y / cardBox.height);
      return point.x >= leftEdge && point.x <= rightEdge && point.y >= 0 && point.y <= cardBox.height;
    });
    return { id:card.dataset.agentId, rank:card.dataset.rank, text:badge?.textContent.trim() || '', inside, points, width:cardBox.width, height:cardBox.height };
  }));
  record('all-rank-badges-match-and-stay-inside-cut-polygon', grades.length > 0 && grades.every(grade => grade.text === grade.rank && grade.inside), { grades:grades.filter(grade => grade.text !== grade.rank || !grade.inside) });

  const rosterDensity = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.agent-roster-card')];
    const cutRatio = .18;
    const pointInsideCard = (point, cardBox) => {
      const y = Math.max(0, Math.min(cardBox.height, point.y - cardBox.top));
      const leftEdge = cardBox.left + cardBox.width * cutRatio * (y / cardBox.height);
      const rightEdge = cardBox.right - cardBox.width * cutRatio * (1 - y / cardBox.height);
      return point.x >= leftEdge - 2 && point.x <= rightEdge + 2 && point.y >= cardBox.top - 2 && point.y <= cardBox.bottom + 2;
    };
    const names = cards.map(card => {
      const name = card.querySelector('.agent-card-copy b');
      const cardBox = card.getBoundingClientRect();
      const style = getComputedStyle(name);
      const range = document.createRange();
      range.selectNodeContents(name);
      const rects = [...range.getClientRects()];
      const inside = rects.length > 0 && rects.every(rect => [
        { x:rect.left, y:rect.top }, { x:rect.right, y:rect.top },
        { x:rect.left, y:rect.bottom }, { x:rect.right, y:rect.bottom },
      ].every(point => pointInsideCard(point, cardBox)));
      const fullName = window.archiveData.characters.find(character => character.id === card.dataset.agentId)?.name || '';
      return {
        id:card.dataset.agentId,
        name:name.textContent.trim(),
        fullName,
        ariaLabel:card.getAttribute('aria-label') || '',
        inside,
        textOverflow:style.textOverflow,
        overflowX:style.overflowX,
        scrollWidth:name.scrollWidth,
        clientWidth:name.clientWidth,
        scrollHeight:name.scrollHeight,
        clientHeight:name.clientHeight,
        lineCount:new Set(rects.map(rect => Math.round(rect.top))).size,
        rects:rects.map(rect => ({ left:rect.left, right:rect.right, top:rect.top, bottom:rect.bottom })),
      };
    });
    const visualGap = (leftCard, rightCard) => {
      const left = leftCard.getBoundingClientRect();
      const right = rightCard.getBoundingClientRect();
      const top = Math.max(left.top, right.top);
      const bottom = Math.min(left.bottom, right.bottom);
      const sampleY = top + (bottom - top) * .5;
      const leftY = (sampleY - left.top) / left.height;
      const rightY = (sampleY - right.top) / right.height;
      const leftVisibleRight = left.right - left.width * cutRatio * (1 - leftY);
      const rightVisibleLeft = right.left + right.width * cutRatio * rightY;
      return rightVisibleLeft - leftVisibleRight;
    };
    const intersects = (a, b) => a.left < b.right - .5 && a.right > b.left + .5 && a.top < b.bottom - .5 && a.bottom > b.top + .5;
    const nameCollisions = [];
    for (let left = 0; left < names.length; left += 1) {
      for (let right = left + 1; right < names.length; right += 1) {
        if (names[left].rects.some(a => names[right].rects.some(b => intersects(a, b)))) {
          nameCollisions.push({ left:names[left].id, right:names[right].id, leftName:names[left].name, rightName:names[right].name });
        }
      }
    }
    return {
      names,
      nameCollisions,
      horizontalGaps:cards.length >= 3 ? [visualGap(cards[0], cards[1]), visualGap(cards[1], cards[2])] : [],
      verticalGap:cards.length >= 4 ? cards[3].getBoundingClientRect().top - cards[0].getBoundingClientRect().bottom : null,
    };
  });
  const badNames = rosterDensity.names.filter(item => !item.name || item.name.length > 8 || !item.inside || item.textOverflow === 'ellipsis' || item.scrollWidth > item.clientWidth + 1 || item.scrollHeight > item.clientHeight + 1 || item.lineCount > 2);
  record('roster-display-names-are-readable-two-line-labels', rosterDensity.names.length === 56 && badNames.length === 0, { names:badNames });
  record('roster-card-aria-labels-keep-full-names', rosterDensity.names.every(item => item.fullName && item.ariaLabel.includes(item.fullName)), {
    names:rosterDensity.names.filter(item => !item.fullName || !item.ariaLabel.includes(item.fullName)),
  });
  const rinaName = rosterDensity.names.find(item => item.id === 'rina');
  record('rina-uses-short-visible-name-and-full-accessible-name', rinaName?.name === '丽娜' && rinaName.ariaLabel.includes(rinaName.fullName), { rinaName });
  record('roster-adjacent-name-rects-do-not-intersect', rosterDensity.nameCollisions.length === 0, { collisions:rosterDensity.nameCollisions });
  record('roster-cards-use-tight-visual-gutters',
    rosterDensity.horizontalGaps.length === 2
      && rosterDensity.horizontalGaps.every(gap => gap >= 32 && gap <= 52)
      && rosterDensity.verticalGap >= 0 && rosterDensity.verticalGap <= 6,
    { horizontalGaps:rosterDensity.horizontalGaps, verticalGap:rosterDensity.verticalGap });

  const frameGeometry = await aria.evaluate(card => {
    const image = card.querySelector('.agent-card-image');
    const before = getComputedStyle(card, '::before');
    const cardBox = card.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    const outerCut = cardBox.width * .18;
    const innerCut = imageBox.width * .18 + .5;
    const outerSlope = (cardBox.height / outerCut);
    const innerSlope = (imageBox.height / innerCut);
    return {
      beforeContent:before.content,
      beforeBorders:[before.borderTopWidth, before.borderRightWidth, before.borderBottomWidth, before.borderLeftWidth],
      inset:[imageBox.left - cardBox.left, imageBox.top - cardBox.top, cardBox.right - imageBox.right, cardBox.bottom - imageBox.bottom],
      outerSlope,
      innerSlope,
    };
  });
  record('card-uses-single-parallel-polygon-frame',
    frameGeometry.beforeContent !== 'none'
      && frameGeometry.beforeContent !== 'normal'
      && frameGeometry.beforeBorders.every(width => parseFloat(width) >= .5)
      && frameGeometry.inset.every(value => Math.abs(value - 3) < .6)
      && Math.abs(frameGeometry.outerSlope - frameGeometry.innerSlope) < .08,
    frameGeometry);

  await page.mouse.move(0, 0);
  await page.waitForTimeout(220);
  const selectedBase = await aria.evaluate(card => {
    const style = getComputedStyle(card);
    return {
      y:new DOMMatrixReadOnly(style.transform).m42,
      scale:parseFloat(style.getPropertyValue('--card-base-scale')) + parseFloat(style.getPropertyValue('--card-interaction-scale')),
      track:parseFloat(style.getPropertyValue('--track-y')) || 0,
    };
  });
  await aria.hover();
  await page.waitForTimeout(220);
  const selectedHover = await aria.evaluate(card => {
    const style = getComputedStyle(card);
    return { y:new DOMMatrixReadOnly(style.transform).m42, scale:parseFloat(style.getPropertyValue('--card-base-scale')) + parseFloat(style.getPropertyValue('--card-interaction-scale')) };
  });
  await page.mouse.down();
  await page.waitForTimeout(220);
  const selectedActive = await aria.evaluate(card => {
    const style = getComputedStyle(card);
    return { y:new DOMMatrixReadOnly(style.transform).m42, scale:parseFloat(style.getPropertyValue('--card-base-scale')) + parseFloat(style.getPropertyValue('--card-interaction-scale')) };
  });
  record('selected-interaction-is-continuous',
    selectedHover.y <= selectedBase.y && selectedBase.y - selectedHover.y <= 4
      && selectedHover.scale >= selectedBase.scale && selectedHover.scale - selectedBase.scale <= .05
      && selectedActive.y <= selectedBase.track && selectedActive.y >= selectedHover.y
      && Math.abs(selectedActive.y - selectedHover.y) <= 5,
    { selectedBase, selectedHover, selectedActive });
  await page.mouse.up();

  const initialTheme = await page.locator('#agentWorkbench').evaluate(node => node.style.getPropertyValue('--selected-agent-theme'));
  await page.locator('[data-agent-id="anby"]').click();
  await page.waitForTimeout(80);
  record('selection-wipe-visible', await page.locator('#agentWipeOverlay').evaluate(node => node.classList.contains('is-wiping')));
  await page.waitForTimeout(800);
  const switched = await page.evaluate(() => {
    const workbench = document.querySelector('#agentWorkbench');
    const panel = document.querySelector('.agent-roster-panel');
    const probe = document.createElement('i');
    probe.style.color = workbench.style.getPropertyValue('--selected-agent-theme');
    document.body.append(probe);
    const theme = getComputedStyle(probe).color;
    probe.remove();
    return {
      selected: document.querySelector('.agent-roster-card.is-selected')?.dataset.agentId || '',
      theme,
      rail: getComputedStyle(panel, '::after').backgroundColor,
      rawTheme: workbench.style.getPropertyValue('--selected-agent-theme'),
    };
  });
  record('selection-updates-agent-and-rail', switched.selected === 'anby' && switched.rawTheme !== initialTheme && switched.rail === switched.theme, switched);
  await page.locator('[data-agent-id="rina"]').click();
  await page.waitForTimeout(420);
  const rinaDetail = await page.evaluate(() => {
    const character = window.archiveData.characters.find(item => item.id === 'rina');
    return {
      expected:character?.name || '',
      selected:document.querySelector('#selectedAgentName')?.textContent.trim() || '',
      visible:document.querySelector('[data-agent-id="rina"] [data-roster-display-name]')?.textContent.trim() || '',
    };
  });
  record('selected-agent-detail-keeps-full-name', rinaDetail.expected && rinaDetail.selected === rinaDetail.expected && rinaDetail.visible === '丽娜', rinaDetail);
  await context.close();
}

for (const viewport of [{ label:'desktop', width:1440, height:900 }, { label:'mobile', width:390, height:844 }]) {
  const context = await browser.newContext({ viewport: { width:viewport.width, height:viewport.height }, reducedMotion:'no-preference' });
  const page = await context.newPage();
  const representatives = [];
  for (const id of ['anby', 'ellen', 'miyabi']) {
    await page.goto(`${base}/stories.html?agent=${id}&verify=s1-7`, { waitUntil:'networkidle' });
    const alpha = await page.evaluate(() => {
      const portrait = document.querySelector('#selectedAgentPortrait');
      const image = portrait?.querySelector('img');
      if (!portrait || !image || !image.complete || !image.naturalWidth) return { available:false };
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently:true });
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
        for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) {
          if (pixels[(y * canvas.width + x) * 4 + 3] < 8) continue;
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
        const imageBox = image.getBoundingClientRect();
        const stageBox = portrait.getBoundingClientRect();
        const infoBox = document.querySelector('.agent-stage-info').getBoundingClientRect();
        const scaleX = imageBox.width / canvas.width;
        const scaleY = imageBox.height / canvas.height;
        const alphaTop = imageBox.top + minY * scaleY;
        const alphaBottom = imageBox.top + (maxY + 1) * scaleY;
        const alphaLeft = imageBox.left + minX * scaleX;
        const alphaRight = imageBox.left + (maxX + 1) * scaleX;
        const clippedTop = Math.max(alphaTop, stageBox.top);
        const clippedBottom = Math.min(alphaBottom, stageBox.bottom);
        const clippedLeft = Math.max(alphaLeft, stageBox.left);
        const clippedRight = Math.min(alphaRight, stageBox.right);
        const sourceTop = Math.max(minY, (stageBox.top - imageBox.top) / scaleY);
        const sourceBottom = Math.min(maxY + 1, (stageBox.bottom - imageBox.top) / scaleY);
        return {
          available:true,
          stageWidth:stageBox.width,
          stageHeight:stageBox.height,
          widthRatio:Math.max(0, clippedRight - clippedLeft) / stageBox.width,
          heightRatio:Math.max(0, clippedBottom - clippedTop) / stageBox.height,
          sourceTopRatio:sourceTop / canvas.height,
          sourceBottomRatio:sourceBottom / canvas.height,
          sourceSpanRatio:(sourceBottom - sourceTop) / canvas.height,
          alphaTopRatio:minY / canvas.height,
          headroom:clippedTop - stageBox.top,
          visibleBottom:clippedBottom,
          infoTop:infoBox.top,
        };
      } catch (error) {
        return { available:false, error:error.message };
      }
    });
    representatives.push({ id, ...alpha });
  }
  const measurable = representatives.filter(item => item.available);
  record(`${viewport.label}-representative-alpha-is-head-to-waist-closeup`,
    measurable.length === representatives.length && measurable.every(item =>
      item.widthRatio >= .42
        && item.heightRatio >= .78
        && item.sourceTopRatio <= item.alphaTopRatio + .02
        && item.sourceSpanRatio <= .68
        && item.sourceBottomRatio >= .55
        && item.sourceBottomRatio <= .72
        && item.headroom >= -2
        && item.headroom <= item.stageHeight * .15
        && item.visibleBottom <= item.infoTop + 2
    ),
    { viewport, representatives });
  await context.close();
}

for (const viewport of [{ label:'desktop', width:1440, height:900 }, { label:'mobile', width:390, height:844 }]) {
  const context = await browser.newContext({ viewport: { width:viewport.width, height:viewport.height }, reducedMotion:'no-preference' });
  const page = await context.newPage();
  const compactAgents = [];
  for (const id of ['aria', 'sunna']) {
    await page.goto(`${base}/stories.html?agent=${id}&verify=compact-waist`, { waitUntil:'networkidle' });
    compactAgents.push(await page.evaluate(() => {
      const portrait = document.querySelector('#selectedAgentPortrait');
      const image = portrait?.querySelector('img');
      const portraitBox = portrait?.getBoundingClientRect();
      const imageBox = image?.getBoundingClientRect();
      const style = image ? getComputedStyle(image) : null;
      return {
        selected:document.querySelector('.agent-roster-card.is-selected')?.dataset.agentId || '',
        compact:portrait?.classList.contains('is-compact-card') || false,
        mode:portrait?.dataset.portraitMode || '',
        widthRatio:imageBox && portraitBox ? imageBox.width / portraitBox.width : 0,
        heightRatio:imageBox && portraitBox ? imageBox.height / portraitBox.height : 0,
        sourceTopRatio:imageBox && portraitBox ? Math.max(0, portraitBox.top - imageBox.top) / imageBox.height : 1,
        sourceBottomRatio:imageBox && portraitBox ? Math.min(1, (portraitBox.bottom - imageBox.top) / imageBox.height) : 1,
        imageTop:imageBox && portraitBox ? imageBox.top - portraitBox.top : 0,
        borderWidths:style ? [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth] : [],
        objectFit:style?.objectFit || '',
      };
    }));
  }
  const widthBounds = viewport.label === 'desktop' ? [.55, .82] : [.82, 1];
  record(`${viewport.label}-compact-stage-is-head-to-waist-without-profile-frame`,
    compactAgents.every((compact, index) => compact.selected === ['aria', 'sunna'][index]
      && compact.compact && compact.mode === 'compact'
      && compact.widthRatio >= widthBounds[0] && compact.widthRatio <= widthBounds[1]
      && compact.heightRatio >= 1.42 && compact.heightRatio <= 1.48
      && compact.sourceTopRatio <= .02
      && compact.sourceBottomRatio >= .67 && compact.sourceBottomRatio <= .71
      && Math.abs(compact.imageTop) <= 2
      && compact.borderWidths.every(width => width === '0px')
      && compact.objectFit === 'contain'),
    { viewport, compactAgents });
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(route, { waitUntil: 'networkidle' });
  const box = await page.locator('#agentWorkbench').boundingBox();
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .2);
  await page.locator('[data-agent-id="aria"]').hover();
  await page.waitForTimeout(60);
  const reduced = await page.evaluate(() => {
    const workbench = document.querySelector('#agentWorkbench');
    const card = document.querySelector('[data-agent-id="aria"]');
    return {
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      stageX: workbench.style.getPropertyValue('--stage-grid-x'),
      panX: card.style.getPropertyValue('--card-pan-x'),
      trackTransform: getComputedStyle(card).transform,
      tickerAnimation: getComputedStyle(document.querySelector('.agent-roster-ticker')).animationName,
    };
  });
  record('reduced-motion-removes-input-drift', reduced.reduced && !reduced.stageX && !reduced.panX && reduced.trackTransform === 'none', reduced);
  record('reduced-motion-stops-roster-ticker', reduced.tickerAnimation === 'none', reduced);
  await page.locator('[data-agent-id="anby"]').click();
  const reducedSwitch = await page.evaluate(() => ({
    selected: document.querySelector('.agent-roster-card.is-selected')?.dataset.agentId || '',
    wiping: document.querySelector('#agentWipeOverlay')?.classList.contains('is-wiping') || false,
  }));
  record('reduced-motion-switches-immediately', reducedSwitch.selected === 'anby' && !reducedSwitch.wiping, reducedSwitch);
  await context.close();
}

await browser.close();
if (serverHandle) await closeServer(serverHandle.server);
console.log(JSON.stringify({ passed: failures.length === 0, checks: checks.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
