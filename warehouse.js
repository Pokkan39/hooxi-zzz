/* 仓库浮层：材料 / 驱动盘 / 音擎。驱动盘与音擎数值来自 wiki，材料为演示数据。 */
(() => {
  const overlay = document.getElementById('wh-overlay');
  const inspect = document.getElementById('wh-inspect');
  const insTitle = document.getElementById('wh-ins-title');
  const insLeft = document.getElementById('wh-ins-left');
  const insRight = document.getElementById('wh-ins-right');
  const grid = document.getElementById('wh-grid');
  const detail = document.getElementById('wh-detail');
  const title = document.getElementById('wh-title');
  const action = document.getElementById('wh-action');
  const funnel = document.getElementById('wh-funnel');
  if (!overlay || !grid || !detail) return;

  const GLYPH = ['✦','✧','❖','◈','◎','⬡','⬢','✚','♦','◇','△','▽'];
  const SETS = (window.DISC_SETS && window.DISC_SETS.length) ? window.DISC_SETS : [];
  const SET = SETS.map(s => s.name);
  const SET_FX = Object.fromEntries(SETS.map(s => [s.name, { p2: s.p2, p4: s.p4 }]));
  const SET_ICON = Object.fromEntries(SETS.map(s => [s.name, s.icon]));
  const SET_ART = Object.fromEntries(SETS.filter(s => s.art).map(s => [s.name, s.art]));
  const SET_ART_A = Object.fromEntries(SETS.filter(s => s.artA).map(s => [s.name, s.artA]));
  const RANK_N = { S: 5, A: 4, B: 3 };
  const ENGINES = (window.WENGINE_DATA || []).map((w,i) => ({
    ...w, r: RANK_N[w.rank] || 3,
    lv: 0, star: 1,
    locked: Math.sin(i*3)*10000 - Math.floor(Math.sin(i*3)*10000) > .7,
    owner: Math.sin(i*5)*10000 - Math.floor(Math.sin(i*5)*10000) > .6,
    isNew: Math.sin(i*7)*10000 - Math.floor(Math.sin(i*7)*10000) > .85
  }));

  /* ===== 驱动盘属性建模（wiki《驱动盘》+ Fandom Drive Disc）=====
     主属性：1/2/3 号位固定生命/攻击/防御；4/5/6 号位各有独立随机池。
     满级 = 初始 × 4，每级 +20% 初始。
     副词条：全游戏仅 10 种（5 固定值 + 5 百分比）。穿透率/异常掌控/冲击力/
     能量自动回复/伤害加成 只能作主属性，不会作为副词条出现。
     +N 表示该条被强化的次数，显示数值 = 单条基础值 × (N+1)。
     每升 3 级触发一次副词条事件：不足 4 条则新增，已满 4 条则随机强化一条。
     0 级初始条数按稀有度：S 3~4，A 2~3，B 1~2；0 级无 +N。
     S 满级 15（5 次事件），A 满级 12（4 次事件）。副词条上限恒为 4。 */
  const MAIN_FIXED = { 1:'生命值', 2:'攻击力', 3:'防御力' };
  const MAIN_POOL = {
    4: ['暴击率','暴击伤害','攻击力%','生命值%','异常精通','防御力%'],
    5: ['攻击力%','生命值%','穿透率','伤害加成','防御力%'],
    6: ['异常掌控','冲击力','能量自动回复','攻击力%','生命值%','防御力%']
  };
  const MAIN_INIT = {
    '生命值':550,'攻击力':79,'防御力':46,
    '生命值%':7.5,'攻击力%':7.5,'防御力%':12,
    '暴击率':6,'暴击伤害':12,'异常精通':23,
    '穿透率':6,'伤害加成':7.5,'异常掌控':7.5,
    '冲击力':4.5,'能量自动回复':15
  };
  const MAIN_PCT = new Set(['生命值%','攻击力%','防御力%','暴击率','暴击伤害','穿透率','伤害加成','异常掌控','冲击力']);
  const SUB_POOL = ['生命值','攻击力','防御力','生命值%','攻击力%','防御力%','暴击率','暴击伤害','异常精通','穿透值'];
  const SUB_BASE = {
    S: { '生命值':112,'攻击力':19,'防御力':15,'生命值%':3,'攻击力%':3,'防御力%':4.8,'暴击率':2.4,'暴击伤害':4.8,'异常精通':9,'穿透值':9 },
    A: { '生命值':80, '攻击力':12,'防御力':10,'生命值%':2,'攻击力%':2,'防御力%':3.2,'暴击率':1.6,'暴击伤害':3.2,'异常精通':6,'穿透值':6 }
  };
  const LV_MAX = { 5:15, 4:12 };
  const MAIN_UNIT = { '能量自动回复':'分' };
  const mainLabel = stat => stat === '伤害加成' ? '以太伤害加成' : stat.endsWith('%') ? stat.slice(0, -1) : stat;
  const subLabel = stat => stat.endsWith('%') ? stat.slice(0, -1) : stat;

  const rng = (n) => { let x = Math.sin(n)*10000; return x - Math.floor(x); };
  const pick = (arr, n) => arr[Math.floor(rng(n)*arr.length)];
  const mainInitOf = (stat, r) => {
    const v = MAIN_INIT[stat];
    return r === 4 ? Math.round(v * 2 / 3) : v;
  };
  const fmtMain = (stat, v) => {
    if (stat === '能量自动回复') return v.toFixed(1) + '分';
    if (MAIN_PCT.has(stat) || stat.endsWith('%')) return +v.toFixed(1) + '%';
    return String(Math.round(v));
  };
  const fmtSub = (stat, v) => (stat.endsWith('%') || stat==='暴击率' || stat==='暴击伤害') ? +v.toFixed(1)+'%' : String(Math.round(v));
  const subVal = (stat, r, n) => SUB_BASE[r===5?'S':'A'][stat] * (n+1);
  const eventsOf = lv => Math.floor(lv / 3);
  const mainAt = (stat, r, lv) => mainInitOf(stat, r) * (1 + 0.2*lv);

  const makeDisc = (set, slot, r, i) => {
    const main = MAIN_FIXED[slot] || pick(MAIN_POOL[slot], i*11+slot);
    const lvMax = LV_MAX[r];
    const nSub = (r === 5 ? 3 : 2) + (rng(i * 17) < 0.5 ? 1 : 0);
    const used = new Set();
    const sub = [];
    for (let k = 0; k < nSub; k++) {
      let s, t = 0;
      do { s = pick(SUB_POOL, i * 29 + k * 7 + t); t++; } while (used.has(s) && t < 20);
      used.add(s);
      sub.push({ s, n: 0 });
    }
    return { set, slot, r, lv: 0, lvMax, main, sub, locked: rng(i) > .72, owner: rng(i * 5) > .55, alert: rng(i * 7) > .82 };
  };
  const DISC = [];
  {
    let i = 0;
    for (const r of [5, 4]) {
      for (const set of SET) {
        for (let slot = 1; slot <= 6; slot++, i++) DISC.push(makeDisc(set, slot, r, i));
      }
    }
  }

  const KEY_CAT = new Set(['货币','资源','任务道具','装饰','照片墙装饰','收藏柜装饰','信息','礼物','能量物品']);
  const ALL_MAT = (window.MAT_DATA || []).map((m,i) => ({
    name:m.name, desc:m.desc, r:m.r, cat:m.cat, get:m.get||'', icon:m.icon,
    n: 1 + Math.floor(rng(i*31+7)*188), i
  }));
  const MAT = ALL_MAT.filter(m => !KEY_CAT.has(m.cat));
  const KEY = ALL_MAT.filter(m => KEY_CAT.has(m.cat));

  const SHAPE = ['sq','tri','bag','gear','tube','disc','sq','tri','bag','gear','tube','disc'];
  const art = (c,g,shape) => `<span class="wh-art wh-art--${shape}" style="--c:${c}" data-g="${GLYPH[g]}"></span>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let tab = 'mat';
  let sel = 0;
  const LABELS = { mat:'材料道具', disc:'驱动仓库', engine:'音擎仓库', key:'重要物品' };
  const ACTIONS = { mat:'道具处理', disc:'拆解', engine:'回收', key:'' };
  const CAP = { disc:3000, engine:2000 };

  const discFace = (d) => SET_ICON[d.set]
    ? `<img class="wh-wicon" src="${esc(SET_ICON[d.set])}" alt="" width="144" height="144">`
    : '<span class="wh-art wh-art--drive"></span>';
  const discCase = (d) => {
    const src = d.r === 5 ? SET_ART[d.set] : SET_ART_A[d.set];
    return src ? `<img class="wh-case" src="${esc(src)}" alt="" width="256" height="256">` : '';
  };
  const discBody = (d) => discCase(d) || discFace(d);
  function cellMat(m,i){
    return `<button class="wh-cell" type="button" role="listitem" data-i="${i}" aria-label="${esc(m.name)}">
      <span class="wh-slot" data-rank="${m.r}">${m.icon?`<img class="wh-wicon" src="${esc(m.icon)}" alt="" width="144" height="144">`:art(m.color,m.g,SHAPE[m.g])}<span class="wh-qty">${m.n}</span></span>
    </button>`;
  }
  function cellDisc(d,i){
    const hue = 200 + (d.set.length*17)%120;
    return `<button class="wh-cell" type="button" role="listitem" data-i="${i}" aria-label="${esc(d.set)} ${d.slot}号位">
      <span class="wh-slot wh-slot--disc" data-rank="${d.r}" style="--c:hsl(${hue} 55% 62%)">
        ${discBody(d)}
        <b class="wh-pos">${d.slot}</b>
        ${d.owner?'<i class="wh-owner"></i>':''}
        ${d.alert?'<i class="wh-dot"></i>':''}
        ${d.locked?'<i class="wh-lock"></i>':''}
        <span class="wh-qty">等级${d.lv}</span>
      </span>
    </button>`;
  }
  function cellEngine(w,i){
    const n = w.star || 1;
    const stars = [1,2,3,4,5].map(k=>`<i class="${k<=n?'is-on':''}"></i>`).join('');
    return `<button class="wh-cell" type="button" role="listitem" data-i="${i}" aria-label="${esc(w.name)}">
      <span class="wh-slot wh-slot--engine" data-rank="${w.r}">
        <img class="wh-wicon" src="${esc(w.icon)}" alt="" width="144" height="144">
        ${w.owner?'<i class="wh-owner"></i>':''}
        ${w.isNew?'<b class="wh-new">NEW!</b>':''}
        ${w.locked?'<i class="wh-lock"></i>':''}
        <span class="wh-stars-mini" aria-hidden="true">${stars}</span>
        <span class="wh-qty">等级${w.lv}</span>
      </span>
    </button>`;
  }

  function itemsOf(){
    if (tab==='disc') return DISC;
    if (tab==='engine') return ENGINES;
    if (tab==='key') return KEY;
    return MAT;
  }

  const getLinks = (get) => String(get||'').split(/[、,，]/).map(s=>s.trim()).filter(Boolean);

  function paintSel(){
    grid.querySelectorAll('.wh-cell').forEach(b => b.classList.toggle('is-sel', +b.dataset.i===sel));
  }

  function detailMat(m){
    const links = getLinks(m.get).slice(0,3);
    detail.innerHTML = `
      <div class="wh-dt-head">
        <h3>${esc(m.name)}</h3>
        <span class="wh-rank" data-rank="${m.r}"></span>
        <div class="wh-dt-art">${m.icon?`<img class="wh-wicon" src="${esc(m.icon)}" alt="" width="144" height="144">`:art(m.color,m.g,SHAPE[m.g])}</div>
      </div>
      <p class="wh-own">当前拥有 × ${m.n}</p>
      <p class="wh-desc">${esc(m.desc||'')}</p>
      <div class="wh-links">
        ${links.map(t=>`<button class="wh-link" type="button">[ 获取 ]${esc(t)}<i></i></button>`).join('')}
      </div>`;
  }
  function detailDisc(d){
    const mainNow = mainAt(d.main, d.r, d.lv);
    const fx = SET_FX[d.set] || { p2:'', p4:'' };
    const padded = d.sub.slice();
    while (padded.length < 4) padded.push(null);
    const subRows = padded.map(x => {
      if (!x) return emptyChip();
      const bump = x._bump ? ' is-bump' : '';
      x._bump = false;
      return `<p class="wh-stat${bump}"><span>${esc(subLabel(x.s))}${x.n?`<i>+${x.n}</i>`:''}</span><b>${fmtSub(x.s, subVal(x.s,d.r,x.n))}</b></p>`;
    }).join('');
    detail.innerHTML = `
      <div class="wh-dt-head">
        <h3>${esc(d.set)} [${d.slot}]</h3>
        <span class="wh-badges"><span class="wh-pos">${d.slot}</span>${d.owner?'<i class="wh-owner"></i>':''}</span>
        <div class="wh-dt-art wh-dt-art--disc">${discBody(d)}</div>
      </div>
      <div class="wh-lv-row"><span class="wh-lv" data-rank="${d.r===5?'S':'A'}" data-max="${d.lvMax}"><i>${d.r===5?'S':'A'}</i> 等级${d.lv} / ${d.lvMax}</span><span class="wh-empty">— EMPTY —</span></div>
      <p class="wh-sec">主属性</p>
      <p class="wh-stat"><span>${esc(mainLabel(d.main))}</span><b>${fmtMain(d.main, mainNow)}</b></p>
      <p class="wh-sec">副属性</p>
      ${subRows}
      <button class="wh-sec wh-sec--more" type="button" id="wh-set-toggle" aria-expanded="false">套装效果<span class="wh-caret"></span></button>
      <div class="wh-set-body" id="wh-set-body" hidden>
        <p class="wh-fx"><b>2件套</b>${esc(fx.p2)}</p>
        <p class="wh-fx"><b>4件套</b>${esc(fx.p4)}</p>
      </div>
      <div class="wh-dt-foot">
        <button class="wh-icon-btn wh-icon-btn--trash" type="button" aria-label="分解"></button>
        <button class="wh-icon-btn wh-icon-btn--lock" type="button" aria-label="锁定"></button>
        <button class="wh-view" type="button" data-inspect="disc">查看</button>
      </div>
      <div class="wh-dt-foot wh-dt-foot--sim">
        <button class="wh-view" type="button" data-up="3"${d.lv>=d.lvMax?' disabled':''}>强化 +3</button>
        <button class="wh-view wh-view--max" type="button" data-up="max"${d.lv>=d.lvMax?' disabled':''}>一键满级</button>
        <button class="wh-view" type="button" data-up="reset">重置</button>
      </div>`;
    detail.querySelector('[data-inspect]')?.addEventListener('click', () => openInspect(d, 'disc'));
  }
  function starRow(n){
    return `<span class="wh-stars" aria-label="${n}星">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'is-on':''}"></i>`).join('')}</span>`;
  }
  const parseNum = v => {
    const s = String(v ?? '');
    const m = s.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  };
  const subUnit = v => String(v ?? '').includes('%') ? '%' : '';
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmtAtk = v => String(Math.round(v));
  const fmtSubNow = (w, t) => {
    if (t <= 0) return String(w.sub0);
    if (t >= 1) return String(w.subMax);
    const a = parseNum(w.sub0), b = parseNum(w.subMax);
    const u = subUnit(w.subMax) || subUnit(w.sub0);
    const n = lerp(a, b, t);
    return (u === '%' ? +n.toFixed(1) : Math.round(n)) + u;
  };
  const engineT = w => Math.max(0, Math.min(1, (w.lv || 0) / (w.lvMax || 60)));
  const engineAtkNow = w => {
    const t = engineT(w);
    if (t <= 0) return w.atk0;
    if (t >= 1) return w.atkMax;
    return Math.round(lerp(w.atk0, w.atkMax, t));
  };
  const engineFx = w => {
    const i = Math.max(0, Math.min(4, (w.star || 1) - 1));
    return (w.effectLv && w.effectLv[i]) || w.effect || '';
  };
  function paintEngineCell(w){
    const cell = grid.querySelector('.wh-cell.is-sel');
    if (!cell) return;
    const qty = cell.querySelector('.wh-qty');
    if (qty) qty.textContent = `等级${w.lv}`;
    const stars = cell.querySelector('.wh-stars-mini');
    if (stars) stars.innerHTML = [1,2,3,4,5].map(k=>`<i class="${k<=(w.star||1)?'is-on':''}"></i>`).join('');
  }
  function detailEngine(w){
    const t = engineT(w);
    const fx = engineFx(w);
    const titleFx = (w.effect||'').split(/[；。]/)[0] || w.name;
    const atk = engineAtkNow(w);
    const sub = fmtSubNow(w, t);
    const maxed = w.lv >= w.lvMax;
    const starred = (w.star || 1) >= 5;
    detail.innerHTML = `
      <div class="wh-dt-head">
        <h3>${esc(w.name)}</h3>
        ${starRow(w.star||1)}
        <div class="wh-dt-art"><img class="wh-wicon" src="${esc(w.icon)}" alt=""></div>
      </div>
      <div class="wh-lv-row"><span class="wh-lv" data-rank="${w.rank||'S'}" data-max="${w.lvMax}"><i>${esc(w.rank||'S')}</i> 等级${w.lv} / ${w.lvMax}</span></div>
      <p class="wh-sec">基础属性</p>
      <p class="wh-stat"><span>基础攻击力</span><b>${fmtAtk(atk)}</b></p>
      <p class="wh-sec">高级属性</p>
      <p class="wh-stat"><span>${esc(w.subName)}</span><b>${esc(sub)}</b></p>
      <p class="wh-sec">音擎效果</p>
      <p class="wh-fx-lead">对于 <b>${esc(w.spec||'')}</b> 角色，能够触发以下效果</p>
      <p class="wh-fx-name">${esc(titleFx.slice(0,12))}</p>
      <p class="wh-fx">${esc(fx)}</p>
      <div class="wh-dt-foot">
        <button class="wh-icon-btn wh-icon-btn--lock" type="button" aria-label="锁定"></button>
        <button class="wh-view" type="button" data-inspect="engine">查看</button>
      </div>
      <div class="wh-dt-foot wh-dt-foot--sim">
        <button class="wh-view" type="button" data-elv="10"${maxed?' disabled':''}>升级 +10</button>
        <button class="wh-view wh-view--max" type="button" data-elv="max"${maxed?' disabled':''}>一键满级</button>
        <button class="wh-view" type="button" data-estar="1"${starred?' disabled':''}>升阶 +1</button>
        <button class="wh-view" type="button" data-ereset>重置</button>
      </div>`;
    detail.querySelector('[data-inspect]')?.addEventListener('click', () => openInspect(w, 'engine'));
  }

  function cloneSub(sub){ return sub.map(x => ({ s:x.s, n:x.n })); }
  DISC.forEach(d => { d._init = { lv:d.lv, sub:cloneSub(d.sub) }; });

  function applyEvent(d){
    if (d.sub.length < 4) {
      const used = new Set(d.sub.map(x => x.s));
      const pool = SUB_POOL.filter(s => !used.has(s));
      const s = pool[Math.floor(Math.random()*pool.length)];
      d.sub.push({ s, n:0, _bump:true });
    } else {
      const x = d.sub[Math.floor(Math.random()*d.sub.length)];
      x.n++;
      x._bump = true;
    }
  }
  function sim(d, kind){
    if (kind==='reset') {
      d.lv = d._init.lv;
      d.sub = cloneSub(d._init.sub);
      return;
    }
    const target = kind==='max' ? d.lvMax : Math.min(d.lvMax, d.lv+3);
    const ev0 = eventsOf(d.lv), ev1 = eventsOf(target);
    for (let i=0;i<ev1-ev0;i++) applyEvent(d);
    d.lv = target;
  }

  function detailOf(it){
    if (tab==='disc') detailDisc(it);
    else if (tab==='engine') detailEngine(it);
    else detailMat(it);
    kickDetail();
  }

  function subChip(x, d){
    return `<p class="wh-stat"><span>${esc(subLabel(x.s))}${x.n?`<i>+${x.n}</i>`:''}</span><b>${fmtSub(x.s, subVal(x.s,d.r,x.n))}</b></p>`;
  }
  function emptyChip(){ return `<p class="wh-stat wh-stat--empty">— EMPTY —</p>`; }

  function openInspect(it, kind){
    if (!inspect) return;
    inspect.hidden = false;
    document.body.classList.add('wh-inspect-open');
    overlay.hidden = true;
    if (kind==='disc') {
      const d = it;
      const mainNow = mainAt(d.main, d.r, d.lv);
      const fx = SET_FX[d.set] || { p2:'', p4:'' };
      const subs = d.sub.slice();
      while (subs.length < 4) subs.push(null);
      insTitle.textContent = `${d.set} [${d.slot}]`;
      insLeft.innerHTML = `
        <span class="wh-ins-slot">${d.slot}</span>
        ${d.owner?'<i class="wh-owner wh-ins-owner"></i>':''}
        <div class="wh-ins-art wh-ins-art--disc">${discBody(d)}</div>
        <div class="wh-ins-tools">
          <button class="wh-icon-btn wh-icon-btn--trash" type="button" aria-label="分解"><b>R</b></button>
          <button class="wh-icon-btn wh-icon-btn--lock" type="button" aria-label="锁定"><b>T</b></button>
        </div>`;
      insRight.innerHTML = `
        <div class="wh-lv-row"><span class="wh-lv" data-rank="${d.r===5?'S':'A'}" data-max="${d.lvMax}"><i>${d.r===5?'S':'A'}</i> 等级${d.lv} <b>/${d.lvMax}</b>${d.lv>=d.lvMax?'<em class="wh-max">MAX</em>':''}</span><span class="wh-empty">— EMPTY —</span></div>
        <p class="wh-sec">主属性</p>
        <div class="wh-stat-grid"><p class="wh-stat"><span>${esc(mainLabel(d.main))}</span><b>${fmtMain(d.main, mainNow)}</b></p>${emptyChip()}</div>
        <p class="wh-sec">副属性</p>
        <div class="wh-stat-grid">${subs.map(x => x ? subChip(x,d) : emptyChip()).join('')}</div>
        <p class="wh-sec">套装效果</p>
        <p class="wh-fx-name">${esc(d.set)}</p>
        <p class="wh-fx"><b>2件套</b> ${esc(fx.p2)}</p>
        <p class="wh-fx"><b>4件套</b> ${esc(fx.p4)}</p>`;
    } else {
      const w = it;
      const fx = engineFx(w);
      insTitle.textContent = w.name;
      insLeft.innerHTML = `
        <span class="wh-ins-spec">${esc(w.spec||'')}</span>
        ${w.owner?'<i class="wh-owner wh-ins-owner"></i>':''}
        <div class="wh-ins-art"><img class="wh-wicon wh-anim" src="${esc(w.anim || w.icon)}" alt=""></div>
        <label class="wh-ins-new${w.isNew?' is-on':''}"><i class="wh-switch"></i> NEW!</label>
        <p class="wh-ins-blurb">${esc(w.name)}为「 ${esc(w.spec||'')} 」特制的暴力音擎</p>
        <button class="wh-icon-btn wh-icon-btn--lock wh-ins-lock" type="button" aria-label="锁定"><b>T</b></button>`;
      insRight.innerHTML = `
        <div class="wh-lv-row"><span class="wh-lv" data-rank="${w.rank||'S'}" data-max="${w.lvMax}"><i>${esc(w.rank||'S')}</i> 等级${w.lv} <b>/${w.lvMax}</b></span>${starRow(w.star||1)}</div>
        <p class="wh-sec">基础属性</p>
        <div class="wh-stat-grid"><p class="wh-stat"><span>基础攻击力</span><b>${fmtAtk(engineAtkNow(w))}</b></p>${emptyChip()}</div>
        <p class="wh-sec">高级属性</p>
        <div class="wh-stat-grid"><p class="wh-stat"><span>${esc(w.subName)}</span><b>${esc(fmtSubNow(w, engineT(w)))}</b></p>${emptyChip()}${emptyChip()}${emptyChip()}</div>
        <p class="wh-sec">音擎效果</p>
        <p class="wh-fx-lead">对于 <b>${esc(w.spec||'')}</b> 角色，能够触发以下效果</p>
        <p class="wh-fx">${esc(fx)}</p>`;
    }
  }
  function closeInspect(){
    if (!inspect || inspect.hidden) return false;
    inspect.hidden = true;
    document.body.classList.remove('wh-inspect-open');
    overlay.hidden = false;
    return true;
  }

  function kick(el, cls){
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
  function kickDetail(){
    kick(detail, 'is-swap');
  }
  function draw(){
    const items = itemsOf();
    const cap = CAP[tab];
    title.innerHTML = cap ? `${LABELS[tab]} <i>[ ${items.length} / ${cap} ]</i>` : (LABELS[tab] || '仓库');
    action.hidden = !ACTIONS[tab];
    if (ACTIONS[tab]) action.querySelector('span').textContent = ACTIONS[tab];
    funnel.hidden = tab!=='disc';
    const cell = tab==='disc' ? cellDisc : tab==='engine' ? cellEngine : cellMat;
    grid.classList.remove('is-in');
    grid.innerHTML = items.map((it,i)=> cell(it,i)).join('');
    grid.querySelectorAll('.wh-cell').forEach((b,i)=> {
      if (i<24) b.style.setProperty('--i', i);
      b.onclick = ()=>{ sel=+b.dataset.i; paintSel(); detailOf(items[sel]); };
    });
    void grid.offsetWidth;
    grid.classList.add('is-in');
    paintSel();
    if (items[sel]) detailOf(items[sel]);
    else detail.innerHTML = '';
  }

  overlay.querySelectorAll('.wh-tab').forEach(t => {
    t.addEventListener('click', () => {
      if (t.disabled) return;
      tab = t.dataset.tab;
      sel = 0;
      overlay.querySelectorAll('.wh-tab').forEach(x => {
        x.classList.toggle('is-active', x===t);
        x.setAttribute('aria-selected', x===t ? 'true' : 'false');
      });
      draw();
    });
  });

  detail.addEventListener('click', e => {
    const up = e.target.closest('[data-up]');
    if (up && tab==='disc') {
      const d = DISC[sel];
      if (!d || up.disabled) return;
      sim(d, up.dataset.up);
      detailDisc(d);
      const qty = grid.querySelector('.wh-cell.is-sel .wh-qty');
      if (qty) qty.textContent = `等级${d.lv}`;
      return;
    }
    const elv = e.target.closest('[data-elv]');
    const estar = e.target.closest('[data-estar]');
    const ereset = e.target.closest('[data-ereset]');
    if (tab==='engine' && (elv || estar || ereset)) {
      const w = ENGINES[sel];
      if (!w) return;
      if (ereset) { w.lv = 0; w.star = 1; }
      else if (estar && !estar.disabled && (w.star||1) < 5) w.star = (w.star||1) + 1;
      else if (elv && !elv.disabled) w.lv = elv.dataset.elv==='max' ? w.lvMax : Math.min(w.lvMax, (w.lv||0)+10);
      else return;
      detailEngine(w);
      paintEngineCell(w);
      return;
    }
    const btn = e.target.closest('#wh-set-toggle');
    if (!btn) return;
    const body = document.getElementById('wh-set-body');
    if (!body) return;
    const open = body.hidden;
    body.hidden = !open;
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  function syncWhTop(){
    const tb = document.querySelector('.topbar');
    overlay.style.setProperty('--wh-top', (tb ? Math.ceil(tb.getBoundingClientRect().height) : 52) + 'px');
    const nav = document.querySelector('.bottom-nav');
    overlay.style.setProperty('--wh-nav', (nav ? Math.ceil(nav.getBoundingClientRect().height) : 90) + 'px');
    if (inspect) {
      inspect.style.setProperty('--wh-top', overlay.style.getPropertyValue('--wh-top'));
    }
  }

  function fire(){
    closeInspect();
    overlay.hidden = false;
    overlay.classList.remove('is-enter');
    void overlay.offsetWidth;
    overlay.classList.add('is-enter');
    overlay.addEventListener('animationend', function onIn(e){
      if (e.target !== overlay || e.animationName !== 'wh-in') return;
      overlay.classList.remove('is-enter');
      overlay.removeEventListener('animationend', onIn);
    });
    document.body.classList.add('wh-open');
    syncWhTop();
    tab = 'mat';
    sel = 0;
    overlay.querySelectorAll('.wh-tab').forEach(x => {
      const on = x.dataset.tab==='mat';
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    draw();
  }
  function shut(){
    closeInspect();
    overlay.hidden = true;
    overlay.classList.remove('is-enter');
    document.body.classList.remove('wh-open');
    document.body.classList.remove('wh-inspect-open');
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('data-label') === '仓库') fire();
      else shut();
    });
  });
  document.querySelector('.back-button')?.addEventListener('click', () => {
    if (closeInspect()) return;
    shut();
  });
  document.addEventListener('keydown', e => {
    if (e.key!=='Escape') return;
    if (closeInspect()) return;
    if (!overlay.hidden) shut();
  });
  window.addEventListener('resize', () => { if (!overlay.hidden || (inspect && !inspect.hidden)) syncWhTop(); });

  window.__WH__ = { DISC, MAT, KEY, ENGINES, SET, SET_FX, MAIN_FIXED, MAIN_POOL, MAIN_INIT, SUB_POOL, SUB_BASE, LV_MAX, eventsOf, mainAt, fmtMain, fmtSub, subVal };
})();
