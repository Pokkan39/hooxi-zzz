(()=>{
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeUrl=(value,{image=false}={})=>{const text=String(value||'').trim();if(!text)return '';if(image&&(text.startsWith('data:image/')||text.startsWith('blob:')))return text;try{const url=new URL(text,location.href);return ['http:','https:'].includes(url.protocol)||url.origin===location.origin?url.href:''}catch{return ''}};
  const id=new URLSearchParams(location.search).get('id')||'';
  const preview=()=>{if(!new URLSearchParams(location.search).has('editorPreview'))return null;try{return JSON.parse(localStorage.getItem('hooxi:preview:data'))}catch{return null}};
  const data=preview()||window.archiveData||{};
  const character=(data.characters||[]).find(item=>item.id===id);
  const faction=(data.factions||[]).find(item=>item.id===character?.factionId);
  const allRecords=['mainline','stories','behindScenes','events'].flatMap(key=>data[key]||[]);
  const content=document.querySelector('#characterContent');
  const section=(title,kicker,body,empty)=>`<section class="character-module"><div class="character-module-head"><span>${kicker}</span><h2>${title}</h2></div>${body||`<p class="character-empty">${empty}</p>`}</section>`;
  const card=(entry,kind)=>`<article class="character-content-card ${kind}"><span>${esc(entry.source||entry.type||'档案记录')}</span><h3>${esc(entry.title)}</h3><p>${esc(entry.summary)}</p>${entry.video?`<a class="video-link" href="${esc(entry.video)}" target="_blank" rel="noreferrer">▶ 打开视频 ↗</a>`:''}${entry.recordId?'<a class="wiki-link" href="#related-records">查看关联剧情 ↓</a>':''}</article>`;
  const list=(items,empty)=>items?.length?`<ul class="character-wiki-list">${items.map(item=>`<li>${esc(typeof item==='string'?item:item.name||item.title||item.label)}${typeof item==='object'&&item.amount?` <b>× ${esc(item.amount)}</b>`:''}</li>`).join('')}</ul>`:`<p class="character-empty">${empty}</p>`;
  const sourceLinks=(character.sources||[]).map(source=>`<a class="related-record" href="${esc(source.url)}" target="_blank" rel="noreferrer"><span>${esc(source.type||'资料来源')}</span><b>${esc(source.label)}</b><small>外部资料 ↗</small></a>`).join('');
  if(!character){
    document.title='Hooxi // 角色不存在';
    document.querySelector('#characterName').innerHTML='角色<br/><span>不存在</span>';
    document.querySelector('#characterSummary').textContent='该角色标识不存在，请返回角色阵营目录检查 characterId。';
    content.innerHTML='<a class="button" href="stories.html">返回角色阵营目录</a>';
    return;
  }
  document.title=`${character.name} // Hooxi 角色档案`;
  document.documentElement.style.setProperty('--character-theme',faction?.theme||'#ff9c52');
  document.querySelector('#characterName').innerHTML=`<span data-editor-id="character.${esc(character.id)}.name" data-editor-type="character" data-editor-field="name">${esc(character.name)}</span><br/><span>角色档案</span>`;
  document.querySelector('#characterSummary').textContent=character.summary||'角色简介待补充。';
  document.querySelector('#characterSummary').dataset.editorId=`character.${character.id}.summary`;
  document.querySelector('#characterSummary').dataset.editorField='summary';
  document.querySelector('#characterRailMark').textContent=character.name.slice(0,1);
  document.querySelector('#characterFileIndex').textContent=String((data.characters||[]).indexOf(character)+1).padStart(2,'0');
  document.querySelector('#characterPortrait').innerHTML=character.portrait?`<img src="${esc(character.portrait)}" alt="${esc(character.name)} 立绘" loading="lazy" data-editor-id="character.${esc(character.id)}.portrait" data-editor-type="image" data-editor-field="portrait"/>`:'<span>立绘待接入</span>';
  document.querySelector('#characterMeta').innerHTML=[['所属阵营',faction?.name],['属性',character.attribute],['特性',character.specialty],['定位',character.role]].filter(([,value])=>value).map(([label,value])=>`<span><b>${label}</b>${esc(value)}</span>`).join('');
  document.querySelector('#characterFaction').innerHTML=faction?`<a class="button small" href="faction.html?id=${encodeURIComponent(faction.id)}">返回${esc(faction.name)} →</a>`:'';
  const related=(character.relatedIds||[]).map(recordId=>allRecords.find(record=>record.id===recordId)).filter(Boolean);
  const modules={
    profile:section('角色资料','// PERSONNEL DATA',`<div class="character-data-grid"><div><span>代理人编号</span><b>${String(character.id).toUpperCase()}</b></div><div><span>稀有度</span><b>${esc(character.rank||'待确认')}</b></div><div><span>所属阵营</span><b>${esc(faction?.name||'待确认')}</b></div><div><span>作战属性</span><b>${esc(character.attribute||'待补充')}</b></div><div><span>战斗特性</span><b>${esc(character.specialty||'待补充')}</b></div><div><span>攻击类型</span><b>${esc(character.attackType||'待补充')}</b></div><div><span>实装日期</span><b>${esc(character.releaseDate||'待核验')}</b></div><div><span>生日</span><b>${esc(character.birthday||'待核验')}</b></div></div><div class="character-wiki-block"><h3>战斗要点</h3><p>${esc(character.combat?.overview||'战斗机制待补充。')}</p></div><div class="character-wiki-block"><h3>资料快照</h3><p>更新于 ${esc(character.updatedAt||'待记录')}。基础事实与攻略建议分层维护；攻略内容会随版本变化。</p></div>`,'暂无角色资料。'),
    story:section('养成材料','// MATERIALS',`<div class="character-wiki-columns"><div class="character-wiki-block"><h3>等级突破</h3>${list(character.materials?.level,'材料名称与总量正在核验。')}</div><div class="character-wiki-block"><h3>技能升级</h3>${list(character.materials?.skills,'技能材料正在核验。')}</div><div class="character-wiki-block"><h3>核心技</h3>${list(character.materials?.core,'核心技材料正在核验。')}</div></div><p class="character-wiki-note">${esc(character.materials?.note||'以游戏内当前版本为准。')}</p>`,'尚未录入养成材料。'),
    build:section('养成攻略','// BUILD GUIDE',`<div class="character-wiki-columns"><div class="character-wiki-block"><h3>推荐音擎</h3>${list(character.build?.wEngines,'推荐音擎待整理。')}</div><div class="character-wiki-block"><h3>驱动盘</h3>${list(character.build?.driveDiscs,'驱动盘方案待整理。')}</div><div class="character-wiki-block"><h3>主词条</h3>${list(character.build?.mainStats,'主词条待整理。')}</div><div class="character-wiki-block"><h3>副词条</h3>${list(character.build?.subStats,'副词条优先级待整理。')}</div><div class="character-wiki-block"><h3>技能优先级</h3>${list(character.combat?.skillPriority,'技能优先级待整理。')}</div><div class="character-wiki-block"><h3>配队方向</h3>${list(character.build?.teams,'配队建议待整理。')}</div></div><p class="character-wiki-note">${esc(character.build?.note||'攻略内容应标为玩家整理，并以游戏内实际版本为准。')}</p>`,'尚未录入养成建议。'),
    related:section('来源与关联','// SOURCES & RECORDS',`${sourceLinks}${related.map(record=>`<a class="related-record" href="${record.factionId?`faction.html?id=${encodeURIComponent(record.factionId)}`:'stories.html'}"><span>${esc(record.tag||'档案')}</span><b>${esc(record.title)}</b><small>${esc(record.summary)}</small></a>`).join('')}`,'尚未关联资料来源或其他档案。')
  };
  const components=data.site?.pages?.character?.components||[];
  document.querySelector('.character-detail-page').insertAdjacentHTML('beforeend',`<div class="free-components">${components.map(component=>component.type==='image'?`<img class="free-component" src="${esc(safeUrl(component.src,{image:true}))}" alt="${esc(component.alt)}" data-editor-id="component.${esc(component.id)}" data-editor-type="image" data-editor-field="src" data-component-id="${esc(component.id)}"/>`:component.type==='link'?`<a class="free-component" href="${esc(safeUrl(component.href)||'#')}" data-editor-id="component.${esc(component.id)}" data-editor-type="link" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</a>`:`<p class="free-component" data-editor-id="component.${esc(component.id)}" data-editor-type="text" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</p>`).join('')}</div>`);
  const setTab=tab=>{content.innerHTML=modules[tab]||modules.profile;document.querySelectorAll('[data-character-tab]').forEach(button=>{const active=button.dataset.characterTab===tab;button.classList.toggle('is-active',active);if(button.getAttribute('role')==='tab')button.setAttribute('aria-selected',String(active));});document.querySelector('#characterStageStatus').textContent=tab.toUpperCase();};
  document.querySelectorAll('[data-character-tab]').forEach(button=>button.addEventListener('click',()=>setTab(button.dataset.characterTab)));
  document.querySelector('.character-stage')?.addEventListener('pointermove',event=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const rect=event.currentTarget.getBoundingClientRect();event.currentTarget.style.setProperty('--stage-x',`${(event.clientX-rect.left)/rect.width-.5}`);event.currentTarget.style.setProperty('--stage-y',`${(event.clientY-rect.top)/rect.height-.5}`);});
  setTab('profile');
})();