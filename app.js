const defaultConfig={appearance:{title:'绝区零 / 剧情档案',intro:'按版本补剧情，按代理人追关联。',bgUrl:'',bgOpacity:18,particles:true,gridEffect:true,titleScale:100,bodyScale:100},cards:[{category:'主线剧情',no:'01',tag:'主线 · 序章',title:'绳匠的序章',desc:'从录像店出发，代理人第一次接触空洞。',video:''},{category:'主线剧情',no:'02',tag:'主线 · 第一章',title:'猫的失物',desc:'在六分街与空洞之间，寻找失踪的委托人。',video:''},{category:'角色档案',no:'03',tag:'角色剧情 · 安比',title:'安比的午后',desc:'一份汉堡，一次意外的约会。',video:''},{category:'角色档案',no:'04',tag:'EP / PV · 角色展示',title:'代理人的信号',desc:'收录角色 EP、PV 与战斗演示视频。',video:''},{category:'往期活动',no:'05',tag:'往期活动 · 新艾利都',title:'城市的回声',desc:'回看限时活动与特别主题剧情。',video:''}],tracks:window.__hooxiAudioCatalog?.getTracks?.()||[]};
window.hooxiDefaultConfig=defaultConfig;
function loadConfig(){try{const saved=JSON.parse(localStorage.getItem('hooxiZZZConfig'));if(!saved)return structuredClone(defaultConfig);if(saved.tracks?.some(t=>t.url?.startsWith('blob:'))){saved.tracks=structuredClone(defaultConfig.tracks)}const cfg={...structuredClone(defaultConfig),...saved,appearance:{...structuredClone(defaultConfig.appearance),...(saved.appearance||{})}};if(!Array.isArray(cfg.tracks)||!cfg.tracks.length)cfg.tracks=window.__hooxiAudioCatalog?.getTracks?.()||[];if(!cfg.appearance.intro||/整合站|可替换|示例内容|普通档案页承载/.test(cfg.appearance.intro)||cfg.appearance.intro==='《绝区零》剧情视频档案与角色关系导航。按主线补课、按代理人找关联，少剧透，再回视频平台观看。')cfg.appearance.intro=defaultConfig.appearance.intro;if(!cfg.appearance.title||/新艾利都/.test(cfg.appearance.title)||cfg.appearance.title==='先找到片 / 再决定看哪段')cfg.appearance.title=defaultConfig.appearance.title;return cfg}catch{return structuredClone(defaultConfig)}}
const safeUrl=(value,{image=false}={})=>{const text=String(value||'').trim();if(!text)return '';if(image&&(text.startsWith('data:image/')||text.startsWith('blob:')))return text;try{const url=new URL(text,location.href);return ['http:','https:'].includes(url.protocol)||url.origin===location.origin?url.href:''}catch{return ''}};
let config=loadConfig(),previewArchiveData=null;window.hooxiZZZConfig=config;if(new URLSearchParams(location.search).has('editorPreview')){try{previewArchiveData=JSON.parse(localStorage.getItem('hooxi:preview:data'));const hero=previewArchiveData?.site?.pages?.home?.hero;if(hero)config.appearance={...config.appearance,eyebrow:hero.eyebrow||'',title:hero.title||config.appearance.title,intro:hero.intro||config.appearance.intro,titleScale:Number(hero.titleScale)||config.appearance.titleScale||100,bodyScale:Number(hero.bodyScale)||config.appearance.bodyScale||100}}catch{}}let currentTrack=0;let playMode=localStorage.getItem('hooxiPlayMode')||'order';let cassetteSide=localStorage.getItem('hooxiCassetteSide')||'A';const playModes={order:{label:'顺序',aria:'播放模式：顺序播放'},random:{label:'随机',aria:'播放模式：随机播放'},single:{label:'单曲',aria:'播放模式：单曲循环'}};const $=s=>document.querySelector(s);const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderFreeComponents(pageKey){const components=(previewArchiveData||window.archiveData)?.site?.pages?.[pageKey]?.components||[];if(!components.length)return;const host=document.querySelector('main')||document.body;const markup=components.map(component=>component.type==='image'?`<img class="free-component" src="${esc(safeUrl(component.src,{image:true}))}" alt="${esc(component.alt)}" data-editor-id="component.${esc(component.id)}" data-editor-type="image" data-editor-field="src" data-component-id="${esc(component.id)}"/>`:component.type==='link'?`<a class="free-component" href="${esc(safeUrl(component.href)||'#')}" data-editor-id="component.${esc(component.id)}" data-editor-type="link" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</a>`:`<p class="free-component" data-editor-id="component.${esc(component.id)}" data-editor-type="text" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</p>`).join('');host.insertAdjacentHTML('beforeend',`<div class="free-components">${markup}</div>`)}
function save(){window.hooxiZZZConfig=config;localStorage.setItem('hooxiZZZConfig',JSON.stringify(config));toast('配置已保存到本机浏览器')}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function applyAppearance(){const a=config.appearance;const [first,...rest]=a.title.split(' / ');$('#heroTitle').innerHTML=`${esc(first)}<br/><span>${esc(rest.join(' / ')||'剧情档案')}</span>`;$('#heroTitle').dataset.editorId='site.page.home.hero.title';$('#heroTitle').dataset.editorField='title';$('#heroIntro').textContent=a.intro;$('#heroIntro').dataset.editorId='site.page.home.hero.intro';$('#heroIntro').dataset.editorField='intro';const eyebrow=$('.hero .eyebrow');if(eyebrow){eyebrow.textContent=a.eyebrow||eyebrow.textContent;eyebrow.dataset.editorId='site.page.home.hero.eyebrow';eyebrow.dataset.editorField='eyebrow'};const titleScale=Math.min(140,Math.max(80,Number(a.titleScale)||100));const bodyScale=Math.min(130,Math.max(85,Number(a.bodyScale)||100));document.documentElement.style.setProperty('--hero-title-scale',`${titleScale/100}`);document.documentElement.style.setProperty('--body-text-scale',`${bodyScale/100}`);document.body.style.setProperty('--user-bg',a.bgUrl?`url("${a.bgUrl.replaceAll('"','')}" )`:'none');document.body.style.setProperty('--bg-opacity',a.bgOpacity/100);$('.ambient').classList.toggle('paused',!a.particles);document.body.classList.toggle('no-grid',!a.gridEffect);if($('#editTitle')){$('#editTitle').value=a.title;$('#editIntro').value=a.intro;$('#bgUrl').value=a.bgUrl;$('#bgOpacity').value=a.bgOpacity;$('#bgOpacityValue').textContent=`${a.bgOpacity}%`;$('#particles').checked=a.particles;$('#gridEffect').checked=a.gridEffect}}
// 首页主视觉由 HTML 解析阶段先选一次，避免固定图与随机图重复下载。
function renderHeroLayered(){
  const art=$('#homeHeroArt');
  const far=$('#heroFar');
  const mid=$('#heroMid');
  const near=$('#heroNear');
  if(!art||!far||!mid||!near)return;
  let acts=[];
  try{acts=JSON.parse(document.querySelector('.hero')?.dataset.heroActs||'[]')}catch{}
  const selected=window.__hooxiHeroSelection||acts[Math.floor(Math.random()*acts.length)]||{};
  const slug=selected.slug||selected[0];
  const name=selected.name||selected[1]||'';
  if(!slug)return;
  window.__hooxiHeroSelection={slug,name};
  art.dataset.heroAct=slug;
  const setSource=(image,layer)=>{
    const src=`assets/hero/acts/${slug}/${layer}.webp`;
    if(image.getAttribute('src')!==src)image.src=src;
  };
  setSource(far,'far');
  setSource(mid,'mid');
  setSource(near,'near');
  near.alt=`${name} 活动主视觉`;
  const caption=$('#heroActName');
  if(caption)caption.textContent=name;
}
function pickLaneItems(items,limit=6){
  return [...(items||[])]
    .filter(item=>item&&(item.cover||item.title))
    .sort((a,b)=>{
      const av=String(a.version||'');
      const bv=String(b.version||'');
      if(av!==bv)return bv.localeCompare(av,undefined,{numeric:true});
      return (Number(b.order)||0)-(Number(a.order)||0);
    })
    .slice(0,limit);
}
function renderHomeReelCards(host,items){
  if(!host)return;
  if(!items.length){
    host.innerHTML='<p class="home-empty">档案预览尚未装载。</p>';
    return;
  }
  host.innerHTML=items.map(item=>{
    const cover=safeUrl(item.cover,{image:true})||item.cover||'';
    const tag=item.tag||item.version||item.type||item.section;
    const summary=(item.summary||item.chapter||'').replace(/\s+/g,' ').trim().slice(0,42);
    return `<a class="home-reel-card" href="${esc(item.pageHref)}${item.id?'#'+esc(item.id):''}" data-fx="press"><span class="home-reel-cover">${cover?`<img src="${esc(cover)}" alt="" loading="lazy"/>`:''}</span><span class="home-reel-copy"><small>${esc(tag)}</small><b>${esc(item.title||'未命名')}</b><em>${esc(summary||'进入正式页查看详情')}</em></span></a>`;
  }).join('');
}
function renderHomeModules(archive){
  const host=$('#homeModules');
  if(!host)return;
  const factions=archive.factions||[];
  const characters=archive.characters||[];
  const mainline=archive.mainline||[];
  const paths=[
    {href:'mainline.html',kicker:'剧情',title:'主线补课',desc:'按版本与章节找空洞行动与世界观媒体。',meta:`${mainline.length} 条主线`,tone:'is-primary'},
    {href:'stories.html',kicker:'代理人',title:'角色与阵营',desc:`${characters.length} 名代理人、${factions.length} 个阵营，可搜可筛。`,meta:'进入单人档案',tone:''},
    {href:'stories.html#agentSearchForm',kicker:'搜索',title:'按名字找人',desc:'直接定位代理人，再看相关影像与阵营关系。',meta:'打开目录搜索',tone:'is-soft'}
  ];
  host.innerHTML=paths.map((p,i)=>`<a class="path-card ${p.tone}" href="${esc(p.href)}" data-fx="press" data-index="${String(i+1).padStart(2,'0')}"><i class="path-glow" aria-hidden="true"></i><span class="path-kicker">${esc(p.kicker)}</span><b>${esc(p.title)}</b><p>${esc(p.desc)}</p><span class="path-meta">${esc(p.meta)}</span></a>`).join('');
}
function renderHomeArchive(){
  const archive=previewArchiveData||window.archiveData||{};
  const factions=archive.factions||[];
  const characters=archive.characters||[];
  const mainline=archive.mainline||[];
  const events=archive.events||[];
  const behind=archive.behindScenes||[];
  const status=$('#archiveStatus');
  if(status)status.textContent=`${factions.length} 阵营 · ${characters.length} 代理人 · ${mainline.length} 主线 · ${events.length} 活动 · ${behind.length} 幕后`;
  renderHomeModules(archive);
  const reels=[
    ...pickLaneItems(mainline,2).map(item=>({...item,pageHref:'events.html',section:'主线'})),
    ...pickLaneItems(events,2).map(item=>({...item,pageHref:'events.html',section:'活动'})),
    ...pickLaneItems(behind,2).map(item=>({...item,pageHref:'behind-scenes.html',section:'幕后'}))
  ];
  renderHomeReelCards($('#homeArchiveReels'),reels);
  const rail=$('#homeAgentRail');
  if(rail){
    const featured=factions.filter(f=>f.id!=='covenant-of-dayat');
    rail.innerHTML=featured.length?featured.map((faction,i)=>{
      const n=i+1;
      const logo=faction.logo?safeUrl(faction.logo,{image:true})||faction.logo:'';
      const members=(faction.members||[]).length;
      return `<a class="home-faction-channel" href="faction.html?id=${encodeURIComponent(faction.id)}" style="--fc-theme:${esc(faction.theme||'#e0b41c')}" data-fx="press" tabindex="0"><span class="home-fc-channel">${String(n).padStart(2,'0')}</span><span class="home-fc-scan" aria-hidden="true"></span><span class="home-fc-logo">${logo?`<img src="${esc(logo)}" alt="" aria-hidden="true" loading="lazy"/>`:`<span class="home-fc-logo-text">${esc(faction.name?.slice(0,2)||'?')}</span>`}</span><span class="home-fc-name">${esc(faction.name||'?')}</span><span class="home-fc-meta"><b>${members}</b><em>代理人</em></span><span class="home-fc-corner" aria-hidden="true">▶</span></a>`;
    }).join(''):'<p class="home-empty">阵营数据尚未装载。请确认 agent-catalog 已正确引入。</p>';
  }
}
function render(){renderHomeArchive();if($('#contentList'))renderContentEditor();}
function renderContentEditor(){$('#contentList').innerHTML=config.cards.map((c,i)=>`<div class="content-row"><b>${i+1}</b><input data-i="${i}" data-k="category" value="${esc(c.category)}" placeholder="分类"/><input data-i="${i}" data-k="tag" value="${esc(c.tag)}" placeholder="标签"/><input data-i="${i}" data-k="title" value="${esc(c.title)}" placeholder="标题"/><input data-i="${i}" data-k="desc" value="${esc(c.desc)}" placeholder="简介"/><input data-i="${i}" data-k="video" value="${esc(c.video)}" placeholder="视频链接（可选）"/><button data-remove="${i}" aria-label="删除">×</button></div>`).join('');document.querySelectorAll('#contentList input').forEach(x=>x.oninput=()=>{const i=x.dataset.i,k=x.dataset.k,pos=x.selectionStart;config.cards[i][k]=x.value;render();const next=document.querySelector(`#contentList input[data-i="${i}"][data-k="${k}"]`);next?.focus();next?.setSelectionRange(pos,pos)});document.querySelectorAll('[data-remove]').forEach(x=>x.onclick=()=>{config.cards.splice(+x.dataset.remove,1);render()})}
function renderMusicEditor(){$('#musicList').innerHTML=config.tracks.map((t,i)=>`<div class="music-row"><input data-i="${i}" data-k="name" value="${esc(t.name)}" placeholder="歌曲名称"/><input data-i="${i}" data-k="url" value="${esc(t.url)}" placeholder="音频 URL"/><button data-track-remove="${i}">×</button></div>`).join('');document.querySelectorAll('#musicList input').forEach(x=>x.oninput=()=>{config.tracks[x.dataset.i][x.dataset.k]=x.value;updatePlayer()});document.querySelectorAll('[data-track-remove]').forEach(x=>x.onclick=()=>{config.tracks.splice(+x.dataset.trackRemove,1);renderMusicEditor();updatePlayer()})}
function formatTrackName(raw){
  let s=String(raw||'').trim();
  if(!s) return '未选择音乐';
  s=s.replace(/\.(ogg|mp3|wav|flac|m4a|aac)$/i,'');
  // normalize separators
  s=s.replace(/\s*[–—]\s*/g,' - ').replace(/\s*_+\s*/g,' - ').replace(/\s{2,}/g,' ').trim();
  // drop production tags but keep real artist names
  s=s.replace(/(^|\s-\s)(HOYO-MiX|HOYO MIX|miHoYo|mihoyo)(?=\s-\s|$)/gi,'$1');
  s=s.replace(/\s-\s(HOYO-MiX|HOYO MIX|miHoYo|mihoyo)\s-\s/gi,' - ');
  // if pattern is "A - B - Title" and A/B are studios, keep title
  const parts=s.split(/\s-\s/).map(x=>x.trim()).filter(Boolean);
  const isStudio=v=>/^(三Z-STUDIO|HOYO-MiX|HOYO MIX|miHoYo|mihoyo)$/i.test(v);
  if(parts.length>=2){
    const title=parts[parts.length-1];
    const artists=parts.slice(0,-1).filter(p=>!isStudio(p));
    if(artists.length) s=artists.join(' / ')+' - '+title;
    else s=title;
  }
  s=s.replace(/^\s*-\s*|\s*-\s*$/g,'').replace(/\s{2,}/g,' ').trim();
  return s||'未命名曲目';
}
function updatePlayer(){
  window.hooxiZZZConfig=config;
  if(window.__hooxiPlayer){window.__hooxiPlayer.refreshTracks();window.__hooxiPlayer.render();}
}
function play(){return window.__hooxiPlayer?.play?.()||Promise.resolve(false)}
function next(dir=1){return dir<0?window.__hooxiPlayer?.prev?.():window.__hooxiPlayer?.next?.()}
function cyclePlayMode(){const modes=['order','random','single'];playMode=modes[(modes.indexOf(playMode)+1)%modes.length];localStorage.setItem('hooxiPlayMode',playMode);window.__hooxiPlayer?.setMode?.(playMode);toast(`已切换为${playModes[playMode].aria.replace('播放模式：','')}`)}
if(document.querySelector('#heroTitle')){applyAppearance();renderHeroLayered();render();renderFreeComponents('home');}updatePlayer();
function bindHomeNav(){
  const toggle=$('#homeNavToggle');
  const nav=$('#homeNav');
  if(!toggle||!nav)return;
  const setOpen=(open,{restoreFocus=false}={})=>{
    nav.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'关闭主导航菜单':'打开主导航菜单');
    if(restoreFocus)toggle.focus();
  };
  toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
  nav.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false)});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){
      event.preventDefault();
      setOpen(false,{restoreFocus:true});
    }
  });
  matchMedia('(min-width: 641px)').addEventListener?.('change',event=>{if(event.matches)setOpen(false)});
}
bindHomeNav();
const editorButton=document.querySelector('#editorOpen');if(editorButton)editorButton.onclick=()=>{location.href='editor.html'};if(document.querySelector('#editor')){$('#editorClose').onclick=()=>$('#editor').classList.remove('open');document.querySelectorAll('.editor-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.editor-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.editor-body').forEach(x=>x.classList.add('hidden'));$(`#${b.dataset.tab}Tab`).classList.remove('hidden');if(b.dataset.tab==='music')renderMusicEditor()});
$('#editTitle').oninput=$('#editIntro').oninput=$('#bgUrl').oninput=()=>{config.appearance={title:$('#editTitle').value,intro:$('#editIntro').value,bgUrl:$('#bgUrl').value,bgOpacity:+$('#bgOpacity').value,particles:$('#particles').checked,gridEffect:$('#gridEffect').checked};applyAppearance()};$('#particles').onchange=$('#gridEffect').onchange=()=>{config.appearance={title:$('#editTitle').value,intro:$('#editIntro').value,bgUrl:$('#bgUrl').value,bgOpacity:+$('#bgOpacity').value,particles:$('#particles').checked,gridEffect:$('#gridEffect').checked};applyAppearance()};$('#bgOpacity').oninput=e=>{$('#bgOpacityValue').textContent=`${e.target.value}%`;config.appearance={title:$('#editTitle').value,intro:$('#editIntro').value,bgUrl:$('#bgUrl').value,bgOpacity:+e.target.value,particles:$('#particles').checked,gridEffect:$('#gridEffect').checked};applyAppearance()};$('#saveAppearance').onclick=()=>{config.appearance={title:$('#editTitle').value,intro:$('#editIntro').value,bgUrl:$('#bgUrl').value,bgOpacity:+$('#bgOpacity').value,particles:$('#particles').checked,gridEffect:$('#gridEffect').checked};applyAppearance();save()};$('#addCard').onclick=()=>{config.cards.push({category:'往期活动',no:'',tag:'新节点',title:'未命名剧情',desc:'填写这段剧情的简介。',video:''});renderContentEditor()};$('#saveContent').onclick=()=>{render();save()};$('#addTrack').onclick=()=>{config.tracks.push({name:'新歌曲',url:''});renderMusicEditor()};$('#saveMusic').onclick=()=>{currentTrack=0;updatePlayer();save()};}
if(document.querySelector('#editor')){$('#exportConfig').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(config,null,2)],{type:'application/json'}));a.download='hooxi-zzz-config.json';a.click();URL.revokeObjectURL(a.href)};$('#importConfig').onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{config=JSON.parse(r.result);window.hooxiZZZConfig=config;applyAppearance();render();updatePlayer();save();toast('配置导入成功')}catch{toast('配置文件格式不正确')}};r.readAsText(file)};$('#resetConfig').onclick=()=>{if(confirm('确定恢复默认内容吗？')){config=structuredClone(defaultConfig);window.hooxiZZZConfig=config;localStorage.removeItem('hooxiZZZConfig');applyAppearance();render();updatePlayer();toast('已恢复默认配置')}};$('#audioUpload').onchange=e=>{[...e.target.files].forEach(file=>{const url=URL.createObjectURL(file);config.tracks.push({name:file.name,url,local:true});});renderMusicEditor();toast('已加入本机歌单，可立即试听')};$('#exportPlaylist').onclick=()=>{const playlist=config.tracks.filter(t=>!t.local).map(t=>({name:t.name,url:t.url}));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(playlist,null,2)],{type:'application/json'}));a.download='playlist.json';a.click();toast('已生成 playlist.json；音频文件请复制到 assets/audio/')};}
window.addEventListener('load',()=>{updatePlayer();bindPlayerDockGuard();});

function bindPlayerDockGuard(){
  const player=document.querySelector('.music-player');
  if(!player||player.dataset.dockGuard)return;
  player.dataset.dockGuard='1';
  player.classList.remove('is-compact');
}




if(document.querySelector('.music-player'))bindPlayerDockGuard();


function syncCassettePlaying(force){
  const audio=$('#audio');
  const playing = force===true ? true : force===false ? false : !!(audio && !audio.paused && !audio.ended);
  document.querySelectorAll('.cassette-shell, .cassette-mini, .music-player').forEach(el=>el.classList.toggle('is-playing', playing));
  const mt=$('#musicToggle'); const ct=$('#cassetteToggle');
  const icon = playing ? '❚❚' : '▶';
  if(mt){mt.textContent=icon;mt.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');}
  if(ct){ct.textContent=icon;ct.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');}
}

function formatClock(sec){
  const n=Math.max(0,Math.floor(Number(sec)||0));
  const m=Math.floor(n/60); const s=n%60;
  return `${m}:${String(s).padStart(2,'0')}`;
}
function updateCassetteTransport(){
  const audio=$('#audio'); if(!audio) return;
  const seek=$('#cassetteSeek');
  const now=$('#cassetteTimeNow');
  const end=$('#cassetteTimeEnd');
  const dur=Number.isFinite(audio.duration)?audio.duration:0;
  const cur=Number.isFinite(audio.currentTime)?audio.currentTime:0;
  if(now) now.textContent=formatClock(cur);
  if(end) end.textContent=formatClock(dur);
  if(seek && !seek.matches(':active')){
    seek.value=String(dur?Math.round((cur/dur)*1000):0);
  }
  // spool speed cue via CSS var
  const shell=$('#cassetteShell');
  if(shell){
    const rate = (!audio.paused && dur>0) ? (0.7 + (cur/dur)*0.9) : 0;
    shell.style.setProperty('--reel-speed', `${Math.max(0.55, 1.35-rate*0.5)}s`);
  }
}
function setCassetteSide(side){
  cassetteSide = side==='B' ? 'B' : 'A';
  localStorage.setItem('hooxiCassetteSide', cassetteSide);
  const shell=$('#cassetteShell');
  if(shell){
    shell.dataset.side=cassetteSide;
    shell.classList.toggle('is-side-b', cassetteSide==='B');
  }
  const badge=$('#cassetteSideBadge'); if(badge) badge.textContent=`SIDE ${cassetteSide}`;
  const meta=$('#cassetteSideMeta'); if(meta) meta.textContent = cassetteSide==='A' ? 'C60 · TYPE I' : 'C60 · TYPE II';
  const hint=$('#cassetteSideHint'); if(hint) hint.textContent = cassetteSide==='A' ? 'A 面顺序走带' : 'B 面反向翻面';
  document.querySelectorAll('.side-btn').forEach(btn=>{
    const on=btn.dataset.side===cassetteSide;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', String(on));
  });
  // B side visual only: reverse track list order display without mutating source
  const list=$('#cassettePlaylist');
  if(list && !list.hidden) updatePlayer();
}

let cassetteLastFocus=null;
let cassetteCloseTimer=0;
let cassetteOpenToken=0;
const cassetteReducedMotion={matches:false,addEventListener:()=>{},removeEventListener:()=>{}};
function openCassetteStage(){
  const stage=$('#cassetteStage'); if(!stage)return;
  const opener=$('#cassetteOpen');
  const wasHidden=stage.hidden||stage.classList.contains('hidden');
  if(wasHidden){const active=document.activeElement;cassetteLastFocus=active instanceof HTMLElement?active:null;}
  if(cassetteCloseTimer){clearTimeout(cassetteCloseTimer);cassetteCloseTimer=0;}
  const openToken=++cassetteOpenToken;
  stage.hidden=false;
  stage.classList.remove('hidden','is-closing','is-open');
  stage.setAttribute('aria-hidden','false');
  opener?.setAttribute('aria-expanded','true');
  document.body.classList.add('cassette-open');
  setCassetteSide(cassetteSide||'A');
  updatePlayer();
  syncCassettePlaying();
  updateCassetteTransport();
  const finishOpen=()=>{
    if(openToken!==cassetteOpenToken||stage.hidden||stage.classList.contains('is-closing'))return;
    stage.classList.add('is-open');
    $('#cassetteClose')?.focus();
  };
  if(cassetteReducedMotion?.matches)finishOpen();
  else requestAnimationFrame(finishOpen);
}
function closeCassetteStage(){
  const stage=$('#cassetteStage'); if(!stage||stage.hidden||stage.classList.contains('hidden')||stage.classList.contains('is-closing'))return;
  cassetteOpenToken++;
  $('#cassetteOpen')?.setAttribute('aria-expanded','false');
  stage.classList.add('is-closing');
  stage.classList.remove('is-open');
  const finishClose=()=>{
    cassetteCloseTimer=0;
    stage.hidden=true;
    stage.classList.add('hidden');
    stage.classList.remove('is-closing');
    stage.setAttribute('aria-hidden','true');
    document.body.classList.remove('cassette-open');
    const list=$('#cassettePlaylist');
    if(list)list.hidden=true;
    $('#cassettePlaylistBtn')?.setAttribute('aria-expanded','false');
    const previous=cassetteLastFocus;
    cassetteLastFocus=null;
    const restore=previous?.isConnected&&!previous.hasAttribute?.('disabled')&&previous!==document.body?previous:$('#cassetteOpen');
    restore?.focus();
  };
  if(cassetteReducedMotion?.matches)finishClose();
  else cassetteCloseTimer=setTimeout(finishClose,180);
}
function bindCassetteStage(){
  if(window.__cassetteBound) return; window.__cassetteBound=1;
  $('#cassetteOpen')?.addEventListener('click', openCassetteStage);
  $('#cassetteClose')?.addEventListener('click', closeCassetteStage);
  $('#cassetteCloseScrim')?.addEventListener('click', closeCassetteStage);
  $('#cassetteSideA')?.addEventListener('click', ()=>setCassetteSide('A'));
  $('#cassetteSideB')?.addEventListener('click', ()=>setCassetteSide('B'));
  document.addEventListener('keydown', e=>{
    if(!document.body.classList.contains('cassette-open'))return;
    if(e.key==='Escape'){e.preventDefault();closeCassetteStage();return;}
    if(e.key!=='Tab')return;
    const deck=$('#cassetteStage')?.querySelector('.cassette-deck'); if(!deck)return;
    const focusable=[...deck.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.closest('[hidden],.hidden')&&el.getAttribute('aria-hidden')!=='true');
    if(!focusable.length){e.preventDefault();return;}
    const first=focusable[0],last=focusable[focusable.length-1],active=document.activeElement;
    if(e.shiftKey&&(active===first||!deck.contains(active))){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(active===last||!deck.contains(active))){e.preventDefault();first.focus();}
  });
  const audio=$('#audio');
  if(audio){
    audio.addEventListener('play', ()=>syncCassettePlaying(true));
    audio.addEventListener('pause', ()=>syncCassettePlaying(false));
    audio.addEventListener('ended', ()=>syncCassettePlaying(false));
    audio.addEventListener('timeupdate', updateCassetteTransport);
    audio.addEventListener('loadedmetadata', updateCassetteTransport);
    audio.addEventListener('durationchange', updateCassetteTransport);
  }
  setCassetteSide(cassetteSide||'A');
}
bindCassetteStage();
