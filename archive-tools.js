/* ============================================================
   HOOXI // 档案检索增强
   1. stories 工作台补「角色剧情」入口（54 条记录原本只在车道可达）
   2. 全站搜索扩展到剧情标题与摘要
   3. 活动页版本 / 类型筛选
   4. 随机看一条探索入口
   仅读取本地 window.archiveData，不请求外部接口。
   删除页面中的 script 引用即可回滚。
   ============================================================ */
(function () {
  'use strict';

  const D = () => window.archiveData || {};
  const LANES = [
    { key: 'mainline', label: '主线 / 媒体', href: 'mainline.html' },
    { key: 'stories', label: '角色剧情', href: 'mainline.html?lane=stories' },
    { key: 'events', label: '往期活动', href: 'events.html' },
    { key: 'behindScenes', label: '幕后 · 对谈', href: 'behind-scenes.html' }
  ];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* 汇总全部可检索记录，附带所属车道用于生成跳转地址 */
  function allRecords() {
    const out = [];
    for (const lane of LANES) {
      for (const x of (D()[lane.key] || [])) {
        if (!x || !x.id) continue;
        out.push({
          id: x.id, title: x.title || '', summary: x.summary || '',
          version: x.version || '', type: x.routeType || x.type || '',
          chapter: x.chapter || '', faction: x.faction || '',
          characters: Array.isArray(x.characters) ? x.characters : [],
          cover: x.cover || '', lane
        });
      }
    }
    return out;
  }

  const recordHref = r =>
    r.lane.href + (r.lane.href.includes('?') ? '' : '') + '#' + encodeURIComponent(r.id);

  function matches(r, q) {
    const k = q.toLowerCase();
    return [r.title, r.summary, r.chapter, r.version, r.type, r.faction, r.characters.join(' ')]
      .join(' ').toLowerCase().includes(k);
  }

  /* ---------- 1. stories 工作台补角色剧情入口 ---------- */
  function injectStoriesEntry() {
    if (!document.body.classList.contains('archive-stories')) return;
    const shell = document.querySelector('.agent-workbench-shell')
      || document.querySelector('.agent-workbench');
    if (!shell || document.querySelector('.story-lane-entry')) return;
    const n = (D().stories || []).length;
    if (!n) return;
    const box = document.createElement('div');
    box.className = 'story-lane-entry';
    box.innerHTML =
      `<div class="story-lane-entry__copy">`
      + `<b>角色剧情与秘闻</b>`
      + `<small>本页用于挑选代理人；${n} 条角色剧情、支线与档案记录在专用车道浏览。</small>`
      + `</div>`
      + `<a class="story-lane-entry__go" href="mainline.html?lane=stories">进入角色剧情车道 →</a>`;
    shell.parentNode.insertBefore(box, shell);
  }

  /* ---------- 2. 全站检索面板 ---------- */
  function buildSearchPanel() {
    const host = document.querySelector('.timeline-page') || document.querySelector('main');
    if (!host || document.querySelector('.archive-finder')) return;
    if (!document.querySelector('.page-timeline')) return;

    const recs = allRecords();
    if (!recs.length) return;

    const panel = document.createElement('section');
    panel.className = 'archive-finder';
    panel.innerHTML =
      `<div class="archive-finder__head">`
      + `<span class="archive-finder__kicker">FIND / 全站检索</span>`
      + `<p>在 ${recs.length} 条档案里按标题、摘要、角色或版本查找。</p>`
      + `</div>`
      + `<div class="archive-finder__row">`
      + `<label class="archive-finder__field"><span>关键词</span>`
      + `<input type="search" id="finderQuery" placeholder="例如 卧底蓝调 / 安比 / 1.4" autocomplete="off"/></label>`
      + `<button type="button" class="archive-finder__random" id="finderRandom" title="随机打开一条档案">🎲 随机看一条</button>`
      + `</div>`
      + `<div class="archive-finder__results" id="finderResults" role="status" aria-live="polite"></div>`;
    host.insertBefore(panel, host.firstChild);

    const input = panel.querySelector('#finderQuery');
    const results = panel.querySelector('#finderResults');

    function render(q) {
      const key = q.trim();
      if (!key) { results.innerHTML = ''; results.classList.remove('is-open'); return; }
      const hit = recs.filter(r => matches(r, key)).slice(0, 12);
      results.classList.add('is-open');
      if (!hit.length) {
        results.innerHTML = `<p class="archive-finder__empty">没有匹配「${esc(key)}」的档案。换个关键词或版本号试试。</p>`;
        return;
      }
      results.innerHTML = hit.map(r =>
        `<a class="archive-finder__hit" href="${esc(recordHref(r))}">`
        + `<span class="archive-finder__lane">${esc(r.lane.label)}</span>`
        + `<b>${esc(r.title)}</b>`
        + `<small>${esc((r.summary || r.chapter || '').slice(0, 54))}</small>`
        + `</a>`).join('')
        + (hit.length >= 12 ? `<p class="archive-finder__more">仅显示前 12 条，继续输入可缩小范围。</p>` : '');
    }

    let t = null;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => render(input.value), 140);
    });

    panel.querySelector('#finderRandom').addEventListener('click', () => {
      const r = recs[Math.floor(Math.random() * recs.length)];
      if (r) location.href = recordHref(r);
    });
  }

  /* ---------- 3. 活动页版本 / 类型筛选 ---------- */
  function buildEventFilters() {
    if (!document.body.classList.contains('archive-events')) return;
    const host = document.querySelector('.timeline-page');
    if (!host || document.querySelector('.event-filters')) return;
    const items = [...document.querySelectorAll('.page-timeline-item')];
    if (items.length < 8) return;

    const data = D().events || [];
    const byId = new Map(data.map(x => [x.id, x]));
    const versions = [...new Set(data.map(x => x.version || '未标注'))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const types = [...new Set(data.map(x => x.routeType || x.type || '活动档案'))];

    const bar = document.createElement('section');
    bar.className = 'event-filters';
    bar.innerHTML =
      `<div class="event-filters__row">`
      + `<label><span>版本</span><select id="evVersion"><option value="all">全部版本 (${data.length})</option>`
      + versions.map(v => {
        const n = data.filter(x => (x.version || '未标注') === v).length;
        return `<option value="${esc(v)}">${esc(v)} (${n})</option>`;
      }).join('')
      + `</select></label>`
      + `<label><span>类型</span><select id="evType"><option value="all">全部类型</option>`
      + types.map(t => {
        const n = data.filter(x => (x.routeType || x.type || '活动档案') === t).length;
        return `<option value="${esc(t)}">${esc(t)} (${n})</option>`;
      }).join('')
      + `</select></label>`
      + `<label class="event-filters__search"><span>检索</span>`
      + `<input type="search" id="evQuery" placeholder="活动名称或关键词" autocomplete="off"/></label>`
      + `<button type="button" id="evClear">清空</button>`
      + `<output id="evCount"></output>`
      + `</div>`;
    // 插在检索面板之后、记录列表之前，避免与全站检索争抢首位
    const finder = host.querySelector('.archive-finder');
    const anchor = host.querySelector('.page-timeline');
    if (finder && finder.nextSibling) host.insertBefore(bar, finder.nextSibling);
    else if (anchor) host.insertBefore(bar, anchor);
    else host.insertBefore(bar, host.firstChild);

    const $ = s => bar.querySelector(s);
    const out = $('#evCount');

    function apply() {
      const v = $('#evVersion').value, t = $('#evType').value;
      const q = $('#evQuery').value.trim().toLowerCase();
      let shown = 0;
      for (const el of items) {
        const rec = byId.get(el.dataset.id) || {};
        const okV = v === 'all' || (rec.version || '未标注') === v;
        const okT = t === 'all' || (rec.routeType || rec.type || '活动档案') === t;
        const okQ = !q || [rec.title, rec.summary, rec.chapter].join(' ').toLowerCase().includes(q);
        const ok = okV && okT && okQ;
        el.hidden = !ok;
        if (ok) shown++;
      }
      out.textContent = `${shown} / ${items.length} 条`;
      // 分组标题在其下所有记录被隐藏时一并收起
      document.querySelectorAll('.archive-group').forEach(g => {
        const rows = [...g.querySelectorAll('.page-timeline-item')];
        g.hidden = rows.length > 0 && rows.every(r => r.hidden);
      });
    }

    ['#evVersion', '#evType'].forEach(s => $(s).addEventListener('change', apply));
    let q = null;
    $('#evQuery').addEventListener('input', () => { clearTimeout(q); q = setTimeout(apply, 140); });
    $('#evClear').addEventListener('click', () => {
      $('#evVersion').value = 'all'; $('#evType').value = 'all'; $('#evQuery').value = '';
      apply();
    });
    apply();
  }

  /* ---------- 4. 角色页：相关档案与声优等补充信息 ---------- */
  function buildCharacterRelated() {
    if (!document.body.classList.contains('archive-character')) return;
    if (document.querySelector('.char-related')) return;
    const host = document.querySelector('.character-detail-page');
    if (!host) return;

    const id = new URLSearchParams(location.search).get('id') || '';
    const c = (D().characters || []).find(x => x && x.id === id);
    if (!c) return;

    // 姓名可能是「安比·德玛拉」，用首段做宽松匹配
    const keys = [c.name, String(c.name || '').split(/[·・]/)[0], c.englishName]
      .filter(Boolean).map(String);
    const hit = allRecords().filter(r =>
      keys.some(k => k.length > 1 && (
        r.characters.some(n => n && n.includes(k)) ||
        r.title.includes(k) || r.summary.includes(k)))
    ).slice(0, 8);

    const stories = Array.isArray(c.personalStories) ? c.personalStories : [];
    // 战斗与养成数据在源数据中为占位空壳，如实标注缺口而不是填充猜测数值
    const gaps = [];
    const co = c.combat || {};
    if (co.overview && /待|核验中|补齐/.test(co.overview)) gaps.push({ k: '战斗要点', v: co.overview });
    const mt = c.materials || {};
    if (mt.note && /待|核验中|补齐/.test(mt.note)) gaps.push({ k: '养成素材', v: mt.note });
    if (!hit.length && !stories.length && !c.cv && !gaps.length) return;

    const box = document.createElement('section');
    box.className = 'char-related';
    let html = `<h2 class="char-related__title">档案关联</h2>`;

    if (c.cv || c.birthday || c.signatureWEngine) {
      html += `<div class="char-related__facts">`;
      if (c.cv) html += `<span><small>配音</small><b>${esc(typeof c.cv === 'string' ? c.cv : (c.cv.zh || c.cv.cn || Object.values(c.cv)[0]))}</b></span>`;
      if (c.birthday) html += `<span><small>生日</small><b>${esc(c.birthday)}</b></span>`;
      if (c.signatureWEngine) html += `<span><small>专武</small><b>${esc(c.signatureWEngine)}</b></span>`;
      if (c.releaseDate) html += `<span><small>实装</small><b>${esc(c.releaseDate)}</b></span>`;
      html += `</div>`;
    }

    if (stories.length) {
      html += `<div class="char-related__block"><h3>个人剧情 <i>${stories.length}</i></h3><ul>`
        + stories.slice(0, 10).map(s => {
          const t = typeof s === 'string' ? s : (s.title || s.name || '');
          return t ? `<li>${esc(t)}</li>` : '';
        }).join('') + `</ul></div>`;
    }

    if (hit.length) {
      html += `<div class="char-related__block"><h3>相关档案 <i>${hit.length}</i></h3><div class="char-related__list">`
        + hit.map(r => `<a href="${esc(recordHref(r))}">`
          + `<span>${esc(r.lane.label)}</span><b>${esc(r.title)}</b></a>`).join('')
        + `</div></div>`;
    }

    if (gaps.length) {
      html += `<div class="char-related__gaps"><h3>尚未收录 <i>${gaps.length}</i></h3>`
        + gaps.map(g => `<p><b>${esc(g.k)}</b><span>${esc(g.v)}</span></p>`).join('')
        + `</div>`;
    }

    box.innerHTML = html;
    host.appendChild(box);
  }

  /* ---------- 0. 子页 skip link：键盘一次直达正文 ----------
     子页侧栏含 15 个以上可聚焦项，键盘用户原本需 Tab 十余次才能进入正文。 */
  function injectSkipLink() {
    if (!document.body.classList.contains('subpage')) return;
    if (document.querySelector('.archive-skip-link')) return;
    const main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'mainContent';
    // 让 main 可成为焦点目标，否则部分浏览器只滚动不移焦
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');

    const a = document.createElement('a');
    a.className = 'archive-skip-link';
    a.href = '#' + main.id;
    a.textContent = '跳到主要内容';
    a.addEventListener('click', e => {
      e.preventDefault();
      main.focus({ preventScroll: true });
      main.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* ---------- 5. 立绘光栅影画（X-ray）----------
     黑白线稿为底，鼠标位置透出彩色原图。规范见 DESIGN.md 第 6 节。
     纯 CSS mask 实现，不用 Canvas/WebGL；触屏与减动效下直接显示彩色。

     zoneSel 是感应区选择器：角色页给整个立绘舞台（单张大立绘，
     指针不必精确压在图上），阵营页留空表示各卡片独立感应。 */
  var XRAY_TARGETS = [
    { host: '.character-portrait', zone: '.character-stage' },
    // .agent-entry-head 自身 pointer-events:none，且被兄弟层 .agent-entry-glow
    // 盖住，事件只能挂在外层链接上
    { host: '.agent-entry-head', zone: '.agent-entry' }
  ];

  function canHoverXray() {
    return window.matchMedia('(hover:hover) and (pointer:fine)').matches
      && !window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  }

  function mountXray(host, zoneSel) {
    if (!host || host.dataset.xrayReady) return;
    var img = host.querySelector('img');
    if (!img) return;
    host.dataset.xrayReady = '1';
    host.classList.add('d-xray');

    // 同图副本作黑白覆盖层，alt 清空避免读屏重复播报
    var veil = document.createElement('span');
    veil.className = 'd-xray-veil';
    veil.setAttribute('aria-hidden', 'true');
    var copy = img.cloneNode(true);
    copy.removeAttribute('id');
    copy.setAttribute('alt', '');
    copy.setAttribute('loading', 'lazy');
    veil.appendChild(copy);
    host.appendChild(veil);

    if (!canHoverXray()) return;

    var raf = null, px = 50, py = 30;
    function paint() {
      host.style.setProperty('--mx', px + '%');
      host.style.setProperty('--my', py + '%');
      raf = null;
    }
    var zone = (zoneSel && host.closest(zoneSel)) || host;
    zone.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      py = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      host.classList.add('is-live');
      if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
    zone.addEventListener('pointerleave', function () {
      host.classList.remove('is-live');
    }, { passive: true });
  }

  function injectPortraitXray() {
    XRAY_TARGETS.forEach(function (t) {
      document.querySelectorAll(t.host).forEach(function (host) {
        mountXray(host, t.zone);
      });
    });
  }

  function boot() {
    try { injectSkipLink(); } catch (e) { }
    try { injectPortraitXray(); } catch (e) { }
    try { injectStoriesEntry(); } catch (e) { }
    // 检索面板先建，活动筛选再插到其后，保证纵向顺序稳定
    try { buildSearchPanel(); } catch (e) { }
    try { buildEventFilters(); } catch (e) { }
    try { buildCharacterRelated(); } catch (e) { }
  }

  // 记录为异步渲染，延后并重试
  function start() { boot(); setTimeout(boot, 700); setTimeout(boot, 1800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
