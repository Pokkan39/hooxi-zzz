(() => {
  'use strict';

  const tapes = [
    ['story-launch','featured','story','您拨打的用户正在空洞中','公测启程','第一场，第一幕。沿着法厄同的信号进入新艾利都。','assets/portraits/anby-card.webp','mainline.html','#ffd21c'],
    ['anby','featured','character','安比的午后','安比·德玛拉','一份汉堡，一次城市约会，以及电影留下的线索。','assets/portraits/anby-card.webp','character.html?id=anby','#65d7e8'],
    ['miyabi','featured','character','虚狩的霜刃','星见雅','对空六课的锋刃掠过空洞，异常信号随霜雪静止。','assets/portraits/miyabi-card.webp','character.html?id=miyabi','#dcecff'],
    ['story-origin','story','story','奇迹的起点','世界观档案','旧都覆灭之后，奇迹之城如何在空洞边缘继续运转。','assets/portraits/yixuan-card.webp','mainline.html','#ee6842'],
    ['story-store','story','story','录像店营业中','六分街日常','卷帘门升起，城市里的每次相遇都成为一盘收藏。','assets/portraits/nicole-demara-card.webp','stories.html','#ffd21c'],
    ['story-hollow','story','story','空洞调查日志','特别行动','将散落的委托、调查和异常读数重新接回时间轴。','assets/portraits/zhu-yuan-card.webp','events.html','#ee6842'],
    ['nicole','character','character','账单危机','妮可·德玛拉','新的委托、旧的账单，妮可总能找到最有收益的路线。','assets/portraits/nicole-demara-card.webp','character.html?id=nicole-demara','#e77cff'],
    ['billy','character','character','星徽骑士永不落幕','比利·奇德','热血录像带转到最后一格，英雄仍会准时登场。','assets/portraits/billy-kid-card.webp','character.html?id=billy-kid','#ff6b54'],
    ['zhu-yuan','character','character','治安官行动记录','朱鸢','治安局的追缉记录，秩序与选择在街巷交会。','assets/portraits/zhu-yuan-card.webp','character.html?id=zhu-yuan','#65d7e8'],
    ['ellen','character','character','鲨鱼女仆请勿加班','艾莲·乔','任务间隙，一段只想准时下班的私人影像。','assets/portraits/ellen-card.webp','character.html?id=ellen','#8ba6ff']
  ].map(([id,row,kind,title,label,summary,image,href,color]) => ({id,row,kind,title,label,summary,image,href,color}));

  const body = document.body;
  const storefront = document.querySelector('[data-storefront]');
  const interior = document.querySelector('[data-store-interior]');
  const nav = document.querySelector('[data-store-nav]');
  const footer = document.querySelector('[data-store-footer]');
  const live = document.querySelector('[data-live-status]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rows = Object.fromEntries([...document.querySelectorAll('[data-tape-row]')].map(row => [row.dataset.tapeRow, row]));
  const filters = document.querySelector('.tape-wall-filters');
  const shelves = document.querySelector('.tape-wall-shelves');
  const viewer = document.querySelector('.tape-wall-viewer');
  const image = document.querySelector('[data-viewer-image]');
  const empty = document.querySelector('[data-viewer-empty]');
  const kind = document.querySelector('[data-viewer-kind]');
  const title = document.querySelector('[data-viewer-title]');
  const description = document.querySelector('[data-viewer-description]');
  const code = document.querySelector('[data-viewer-code]');
  const play = document.querySelector('[data-viewer-link]');
  const close = document.querySelector('[data-viewer-close]');
  const ejectTitle = document.querySelector('[data-eject-title]');
  let filter = 'all';
  let selected = null;
  let pointerFrame = 0;

  function enterStore(skipAnimation = false) {
    if (!storefront || body.classList.contains('is-opening')) return;
    body.classList.add('is-opening');
    const finish = () => {
      storefront.hidden = true;
      nav.hidden = false;
      interior.hidden = false;
      footer.hidden = false;
      body.classList.remove('is-outside', 'is-opening');
      body.classList.add('is-inside');
      interior.focus({ preventScroll: true });
      live.textContent = '大门已打开，欢迎光临 HOOXI PLAY。';
      try { sessionStorage.setItem('hooxi:store-entered', '1'); } catch {}
    };
    if (skipAnimation || reduced.matches) finish();
    else setTimeout(finish, 2380);
  }

  document.querySelectorAll('[data-enter-store]').forEach(button => button.addEventListener('click', () => enterStore()));
  storefront.addEventListener('click', event => {
    if (event.target.closest('button')) return;
    enterStore();
  });
  addEventListener('keydown', event => {
    if (!body.classList.contains('is-outside') || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    enterStore();
  });
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    enterStore(true);
  });

  function makeTape(tape, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tape-wall-tape';
    button.dataset.tapeId = tape.id;
    button.dataset.kind = tape.kind;
    button.setAttribute('role', 'listitem');
    button.setAttribute('aria-label', `${tape.kind === 'story' ? '剧情录像' : '角色档案'}：${tape.title}，${tape.label}`);
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--tape-accent', tape.color);
    const label = document.createElement('span');
    label.className = 'tape-wall-tape__label';
    label.textContent = `${String(index + 1).padStart(2, '0')} · ${tape.label}`;
    button.append(label);
    return button;
  }

  function render() {
    Object.values(rows).forEach(row => row.replaceChildren());
    const visible = tapes.filter(tape => filter === 'all' || tape.kind === filter);
    visible.forEach((tape, index) => rows[tape.row].append(makeTape(tape, index)));
    Object.values(rows).forEach(row => row.closest('.tape-wall-shelf-wrap').hidden = !row.children.length);
    [...document.querySelectorAll('.tape-wall-tape')].forEach((button, index) => button.tabIndex = index ? -1 : 0);
    live.textContent = `正在展示 ${visible.length} 盘录像。`;
  }

  const tapeFor = button => tapes.find(tape => tape.id === button.dataset.tapeId);
  function finishSelection(button, tape) {
    selected?.classList.remove('is-active');
    selected?.setAttribute('aria-pressed', 'false');
    selected = button;
    button.classList.add('is-active');
    button.setAttribute('aria-pressed', 'true');
    empty.hidden = true;
    image.hidden = false;
    image.src = tape.image;
    image.alt = `${tape.label}录像封套`;
    kind.textContent = `// ${tape.kind === 'story' ? 'STORY TAPE' : 'AGENT FILE'} · NOW SCREENING`;
    title.textContent = tape.title;
    description.textContent = tape.summary;
    code.textContent = `TAPE ${tape.id.toUpperCase()} · 00:${String(tapes.indexOf(tape) + 1).padStart(2, '0')}:47`;
    play.href = tape.href;
    play.removeAttribute('aria-disabled');
    close.disabled = false;
    live.textContent = `已把《${tape.title}》送到看片台。`;
  }

  function selectTape(button) {
    const tape = tapeFor(button);
    if (!tape) return;
    if (reduced.matches || !button.animate) return finishSelection(button, tape);
    const start = button.getBoundingClientRect();
    const target = viewer.querySelector('.tape-wall-viewer__screen').getBoundingClientRect();
    const flyer = document.createElement('img');
    flyer.className = 'tape-wall-flyer';
    flyer.src = tape.image;
    flyer.alt = '';
    Object.assign(flyer.style, {left:`${start.left}px`,top:`${start.top}px`,width:`${start.width}px`,height:`${start.height}px`});
    document.body.append(flyer);
    flyer.animate([{transform:'rotate(-4deg) scale(.92)'},{left:`${target.left}px`,top:`${target.top}px`,width:`${target.width}px`,height:`${target.height}px`,transform:'none'}], {duration:520,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'}).finished.catch(() => {}).then(() => { flyer.remove(); finishSelection(button, tape); });
  }

  function clearViewer() {
    selected?.classList.remove('is-active');
    selected?.setAttribute('aria-pressed', 'false');
    selected?.focus();
    selected = null;
    image.hidden = true;
    image.removeAttribute('src');
    empty.hidden = false;
    kind.textContent = '// WAITING SIGNAL';
    title.textContent = '看片台待机中';
    description.textContent = '选择一盘录像，封套与档案说明会在 CRT 屏幕中显影。';
    code.textContent = 'TIME CODE · --:--:--';
    play.href = '#catalog';
    play.setAttribute('aria-disabled', 'true');
    close.disabled = true;
  }

  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    clearViewer();
    render();
    document.querySelector('.tape-wall-tape')?.focus();
  });
  shelves.addEventListener('click', event => {
    const button = event.target.closest('.tape-wall-tape');
    if (button) selectTape(button);
  });
  shelves.addEventListener('keydown', event => {
    const button = event.target.closest('.tape-wall-tape');
    if (!button) return;
    const buttons = [...document.querySelectorAll('.tape-wall-tape')];
    const index = buttons.indexOf(button);
    if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowLeft' ? -1 : 1)));
      buttons.forEach((item, position) => item.tabIndex = position === next ? 0 : -1);
      buttons[next]?.focus();
    } else if (['Enter',' '].includes(event.key)) {
      event.preventDefault();
      selectTape(button);
    }
  });
  close.addEventListener('click', clearViewer);
  addEventListener('keydown', event => { if (event.key === 'Escape' && selected) clearViewer(); });

  shelves.addEventListener('pointermove', event => {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches || reduced.matches || pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      const rect = shelves.getBoundingClientRect();
      shelves.style.setProperty('--wall-x', `${((event.clientX - rect.left) / rect.width - .5) * 4}px`);
      shelves.style.setProperty('--wall-y', `${((event.clientY - rect.top) / rect.height - .5) * 3}px`);
      pointerFrame = 0;
    });
  });
  shelves.addEventListener('pointerleave', () => {
    shelves.style.removeProperty('--wall-x');
    shelves.style.removeProperty('--wall-y');
  });

  const form = document.querySelector('[data-concierge-form]');
  const queryInput = form.elements.query;
  const status = document.querySelector('[data-concierge-status]');
  const reply = document.querySelector('[data-concierge-reply]');
  const routes = [
    { terms:['安比'], text:'找到安比的角色档案。你可以先查看个人资料与角色故事。', href:'character.html?id=anby', label:'打开安比档案' },
    { terms:['角色','代理人','人物'], text:'角色专柜收录阵营、代理人资料和个人故事。', href:'stories.html', label:'进入角色专柜' },
    { terms:['活动','限时'], text:'往期活动区保存限时事件和特别录像。', href:'events.html', label:'查看往期活动' },
    { terms:['幕后','对谈','访谈','制作'], text:'幕后货架收录制作记录与深夜对谈。', href:'behind-scenes.html', label:'进入幕后货架' },
    { terms:['主线','剧情','章节','版本'], text:'主线书架按版本和章节整理剧情路线。', href:'mainline.html', label:'浏览主线剧情' }
  ];
  function answerQuery(value) {
    const query = value.trim();
    if (!query) {
      status.textContent = '请先告诉邦布你想找什么。';
      reply.hidden = true;
      return;
    }
    const route = routes.find(item => item.terms.some(term => query.includes(term)));
    status.textContent = '导航模式已完成站内匹配 · DeepSeek 待接入';
    reply.replaceChildren();
    const copy = document.createElement('span');
    copy.textContent = route?.text || '店内目前分为主线剧情、角色故事、往期活动和幕后对谈四类。你可以从左侧书目区继续翻看。';
    reply.append(copy);
    const link = document.createElement('a');
    link.href = route?.href || '#catalog';
    link.textContent = route?.label || '查看全部书目';
    reply.append(link);
    reply.hidden = false;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    answerQuery(queryInput.value);
  });
  document.querySelector('.bangboo-suggestions').addEventListener('click', event => {
    const button = event.target.closest('[data-query]');
    if (!button) return;
    queryInput.value = button.dataset.query;
    answerQuery(button.dataset.query);
  });

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.getAttribute('aria-disabled') === 'true') {
      if (anchor) event.preventDefault();
      return;
    }
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || anchor.target === '_blank') return;
    const target = new URL(anchor.href, location.href);
    if (target.origin !== location.origin || target.hash && target.pathname === location.pathname || reduced.matches) return;
    event.preventDefault();
    ejectTitle.textContent = `PLAY / ${selected ? tapeFor(selected).title : anchor.textContent.trim()}`;
    body.classList.add('is-ejecting');
    setTimeout(() => location.assign(anchor.href), 460);
  });
  addEventListener('pageshow', () => body.classList.remove('is-ejecting'));

  render();
})();
