(()=>{
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeUrl=(value,{image=false}={})=>{
    const text=String(value||'').trim();
    if(!text)return '';
    if(image&&(text.startsWith('data:image/')||text.startsWith('blob:')))return text;
    try{
      const url=new URL(text,location.href);
      if(image)return url.origin===location.origin?url.href:'';
      return ['http:','https:'].includes(url.protocol)||url.origin===location.origin?url.href:'';
    }catch{return ''}
  };
  const preview=()=>{
    if(!new URLSearchParams(location.search).has('editorPreview'))return null;
    try{return JSON.parse(localStorage.getItem('hooxi:preview:data'))}catch{return null}
  };
  const setMetaDescription=text=>{
    let meta=document.querySelector('meta[name="description"]');
    if(!meta){meta=document.createElement('meta');meta.name='description';document.head.appendChild(meta)}
    meta.content=text;
  };
  const setMetaProp=(key,value)=>{
    const selector=key.startsWith('og:')?`meta[property="${key}"]`:`meta[name="${key}"]`;
    let meta=document.querySelector(selector);
    if(!meta){meta=document.createElement('meta');meta.setAttribute(key.startsWith('og:')?'property':'name',key);document.head.appendChild(meta)}
    meta.content=value;
  };
  const prose=text=>String(text||'').split(/\n+/).filter(Boolean).map(line=>`<p>${esc(line)}</p>`).join('');
  const list=(items,empty)=>items?.length
    ?`<ul class="character-wiki-list">${items.map(item=>`<li>${esc(typeof item==='string'?item:item.name||item.title||item.label)}${typeof item==='object'&&item.amount?` <b>× ${esc(item.amount)}</b>`:''}</li>`).join('')}</ul>`
    :`<p class="character-empty">${empty}</p>`;
  const section=(key,title,kicker,body,empty,{source=false}={})=>`<section class="character-module" id="${key}" role="tabpanel" aria-labelledby="character-tab-${key}" aria-hidden="${key==='media'?'false':'true'}"${key==='media'?'':' hidden inert'}${source?' data-source-section':''}><div class="character-module-head"><span>${kicker}</span><h2>${title}</h2></div>${body||`<p class="character-empty">${empty}</p>`}</section>`;
  const CHARACTER_HERO_DEFAULT={
    artPosition:'50% 50%',
    portraitTop:'clamp(34px,5vh,72px)',portraitRight:'clamp(10px,3.5vw,58px)',portraitBottom:'0px',
    portraitWidth:'min(58vw,820px)',portraitHeight:'calc(100% - clamp(34px,5vh,72px))',portraitObjectPosition:'center bottom'
  };
  const CHARACTER_HERO_COMPOSITION={
    remielle:{portraitRight:'0px'}
  };
  const HERO_COMPOSITION_VARS={
    artPosition:'--character-hero-art-position',
    portraitTop:'--character-hero-portrait-top',portraitRight:'--character-hero-portrait-right',portraitBottom:'--character-hero-portrait-bottom',
    portraitWidth:'--character-hero-portrait-width',portraitHeight:'--character-hero-portrait-height',portraitObjectPosition:'--character-hero-portrait-object-position'
  };
  const applyHeroComposition=(target,characterId)=>{
    const exception=CHARACTER_HERO_COMPOSITION[characterId]||{};
    const resolved={...CHARACTER_HERO_DEFAULT,...exception};
    Object.entries(HERO_COMPOSITION_VARS).forEach(([key,variable])=>target?.style.setProperty(variable,resolved[key]));
    if(target){
      target.dataset.heroComposition=CHARACTER_HERO_COMPOSITION[characterId]?'exception':'default';
      target.dataset.heroPortrait=resolved.portraitMode||'foreground';
    }
    return resolved;
  };

  const params=new URLSearchParams(location.search);
  const id=params.get('id')||'';
  const data=preview()||window.archiveData||{};
  const character=(data.characters||[]).find(item=>item.id===id);
  const faction=(data.factions||[]).find(item=>item.id===character?.factionId);
  const content=document.querySelector('#characterContent');
  const freeHost=document.querySelector('#characterFreeComponents');
  const screen=document.querySelector('.character-screen');
  const englishName=document.querySelector('#characterEnglishName');
  const heroPortrait=document.querySelector('#characterHeroPortrait');
  const footerSource=document.querySelector('#characterFooterSource');

  if(!character){
    document.title='Hooxi // 角色不存在';
    document.querySelector('#characterName').textContent='角色不存在';
    document.querySelector('#characterMeta').innerHTML='<div><dt>状态</dt><dd>无效角色标识</dd></div>';
    content.innerHTML='<section class="character-module" id="media"><h2>未找到角色</h2><p class="character-empty">该角色标识不存在，请返回角色与阵营目录重新选择。</p><a class="button" href="stories.html">返回角色与阵营</a></section>';
    return;
  }

  const shareTitle=`${character.name} // HOOXI 代理人档案（粉丝非官方）`;
  const shareDesc=`${character.name} · ${character.factionName||faction?.name||'代理人'}影画与个人档案。粉丝非官方，与米哈游、HoYoverse 无隶属。`;
  document.title=`${character.name} // Hooxi 角色档案`;
  setMetaDescription(`${character.name}角色影画、相关影像、剧情、资料与来源。Hooxi 粉丝非官方剧情档案站。`);
  setMetaProp('og:title',shareTitle);
  setMetaProp('og:description',shareDesc);
  setMetaProp('twitter:title',shareTitle);
  setMetaProp('twitter:description',shareDesc);
  const resolvedEnglishName=String(character.englishName||'').trim();
  if(englishName&&resolvedEnglishName){
    englishName.textContent=resolvedEnglishName;
    englishName.hidden=false;
  }
  screen?.setAttribute('aria-label',`${character.name}角色影画与档案入口`);
  const heroComposition=applyHeroComposition(screen,character.id);
  if(heroPortrait){
    const portraitSource='portrait';
    const portraitPath=`assets/portraits/${encodeURIComponent(character.id)}-portrait.webp`;
    heroPortrait.src=portraitPath;
    heroPortrait.alt=heroComposition.portraitHidden?'':`${character.name}全身立绘`;
    heroPortrait.fetchPriority='high';
    heroPortrait.hidden=Boolean(heroComposition.portraitHidden);
    heroPortrait.setAttribute('aria-hidden',String(Boolean(heroComposition.portraitHidden)));
    heroPortrait.dataset.portraitSource=portraitSource;
    heroPortrait.dataset.portraitPath=portraitPath;
  }
  if(footerSource){
    const portraitCredit='；前景角色立绘/卡图版权归米哈游';
    const ensurePortraitCredit=()=>{
      if(!footerSource.textContent.includes('立绘'))footerSource.append(document.createTextNode(portraitCredit));
    };
    new MutationObserver(ensurePortraitCredit).observe(footerSource,{childList:true,characterData:true,subtree:true});
    ensurePortraitCredit();
  }

  document.querySelector('#characterName').innerHTML=`<span data-editor-id="character.${esc(character.id)}.name" data-editor-type="character" data-editor-field="name">${esc(character.name)}</span>`;
  const identity=[
    ['所属阵营',faction?.name||character.factionName,faction?`faction.html?id=${encodeURIComponent(faction.id)}`:''],
    ['作战属性',character.attribute,''],
    ['战斗特性',character.specialty,'']
  ].filter(([,value])=>value).slice(0,3);
  document.querySelector('#characterMeta').innerHTML=identity.map(([label,value,href])=>`<div><dt>${esc(label)}</dt><dd>${href?`<a href="${esc(href)}">${esc(value)}</a>`:(window.ZZZIcons?.attrIcon(value,'')||'')+esc(value)}</dd></div>`).join('');

  const allRecords=['mainline','stories','behindScenes','events'].flatMap(key=>data[key]||[]);
  const related=(character.relatedIds||[]).map(recordId=>allRecords.find(record=>record.id===recordId)).filter(Boolean);
  const sourceLinks=(character.sources||[]).map(source=>{
    const href=safeUrl(source.url)||'#';
    const external=/^https?:/i.test(href);
    return `<a class="related-record" data-source-action href="${esc(href)}" ${external?'target="_blank" rel="noreferrer"':''}><span>${esc(source.type||'资料来源')}</span><b>${esc(source.label||'未命名来源')}</b><small>${external?'前往来源 ↗':'站内查看 →'}</small></a>`;
  }).join('');

  const storyCards=(character.personalStories||[]).map(story=>`<article class="character-content-card story"><span>${esc(story.source||'角色故事')}</span><h3>${esc(story.title||'角色故事')}</h3>${prose(story.summary)}</article>`).join('');
  const shopNotes=(character.shopNotes||[]).map(note=>`<article class="character-content-card note"><span>录像店留言</span>${prose(note)}</article>`).join('');

  const galleryRaw=(character.gallery||[]).map(item=>({item,src:safeUrl(item?.image,{image:true}),title:String(item?.title||'')})).filter(({src})=>src);
  const pickGallery=(predicates,used)=>{
    for(const entry of galleryRaw){
      if(used.has(entry.src))continue;
      if(predicates.some(test=>test(entry.title,entry.item))){used.add(entry.src);return entry}
    }
    return null;
  };
  const usedGallery=new Set();
  const mediaSlots=[
    {id:'entrance',label:'入场动画',hint:'入场特写 / 时装入场',pick:[title=>/入场/.test(title)]},
    {id:'idle',label:'待机动画',hint:'待机 / 时装待机',pick:[title=>/待机/.test(title)]},
    {id:'defeat',label:'战败动作',hint:'战败动作',pick:[title=>/战败/.test(title)]},
    {id:'portrait-art',label:'影画展示',hint:'影画展示',pick:[title=>/影画/.test(title)]},
    {id:'card',label:'角色卡片',hint:'角色卡片 / 立绘',pick:[title=>/卡片|立绘/.test(title)]},
    {id:'fashion',label:'时装展示',hint:'时装相关（非入场 / 待机优先）',pick:[title=>/时装|皮肤/.test(title)&&!/入场|待机/.test(title)]}
  ].map(slot=>({...slot,hit:pickGallery(slot.pick,usedGallery)}));
  const leftoverGallery=galleryRaw.filter(entry=>!usedGallery.has(entry.src));
  const galleryItems=[...mediaSlots.map(slot=>slot.hit).filter(Boolean),...leftoverGallery].slice(0,16);
  const galleryId=`character-gallery-${String(character.id).replace(/[^a-z0-9_-]/gi,'-')}`;
  const galleryFigures=galleryItems.map(({item,src},index)=>`<figure id="${galleryId}-panel-${index}" class="character-gallery-item${index===0?' is-active':''}" role="tabpanel" aria-labelledby="${galleryId}-tab-${index}" aria-hidden="${index===0?'false':'true'}" tabindex="${index===0?'0':'-1'}" data-gallery-slide="${index}" ${index===0?'':'inert'}><img src="${esc(src)}" alt="${esc(item.title||character.name)}" loading="lazy"/><figcaption>${esc(item.title||'档案图')}</figcaption></figure>`).join('');

  const mediaFromStories=(character.personalStories||[]).filter(story=>story&&(story.video||story.url||story.cover)).map(story=>{
    const href=safeUrl(story.video||story.url)||'';
    const cover=safeUrl(story.cover,{image:true});
    const external=/^https?:/i.test(href);
    return `<article class="character-content-card media">${cover?`<a class="character-media-cover" href="${esc(href||'#')}" ${href&&external?'target="_blank" rel="noreferrer"':''}><img src="${esc(cover)}" alt="${esc(story.title||character.name)}" loading="lazy"/></a>`:''}<span>${esc(story.source||story.tag||'相关影像')}</span><h3>${esc(story.title||'未命名影像')}</h3>${prose(story.summary)}${href?`<p class="character-media-link"><a class="video-link" data-source-action href="${esc(href)}" ${external?'target="_blank" rel="noreferrer"':''}>打开影像 ↗</a></p>`:'<p class="character-media-link"><span class="video-link disabled">链接待接入</span></p>'}</article>`;
  }).join('');
  const mediaFromRecords=related.filter(record=>record.video||record.cover).map(record=>{
    const video=safeUrl(record.video);
    const href=video||(record.factionId?`faction.html?id=${encodeURIComponent(record.factionId)}`:'stories.html');
    const cover=safeUrl(record.cover,{image:true});
    return `<article class="character-content-card media">${cover?`<div class="character-media-cover"><img src="${esc(cover)}" alt="${esc(record.title)}" loading="lazy"/></div>`:''}<span>${esc(record.tag||'站内档案')}</span><h3>${esc(record.title)}</h3><p>${esc(record.summary||'')}</p><p class="character-media-link">${video?`<a class="video-link" data-source-action href="${esc(video)}" target="_blank" rel="noreferrer">打开视频 ↗</a> `:''}<a class="related-record-inline" href="${esc(href)}">查看档案 →</a></p></article>`;
  }).join('');
  const mediaGallery=galleryItems.length?`<div class="character-wiki-block character-gallery-block"><h3>档案图集</h3><div class="wiki-gallery-slider" data-gallery-slider><button type="button" class="wiki-gallery-nav prev" data-gallery-prev aria-label="上一张">‹</button><div class="wiki-gallery-viewport"><div class="wiki-gallery-track">${galleryFigures}</div></div><button type="button" class="wiki-gallery-nav next" data-gallery-next aria-label="下一张">›</button><div class="wiki-gallery-meta" aria-live="polite"><span data-gallery-label>${esc(galleryItems[0]?.item?.title||'档案图')}</span><b><i data-gallery-index>1</i> / ${galleryItems.length}</b></div><div class="wiki-gallery-dots" role="tablist" aria-label="图集页码">${galleryItems.map((entry,index)=>`<button id="${galleryId}-tab-${index}" type="button" role="tab" aria-controls="${galleryId}-panel-${index}" aria-selected="${index===0?'true':'false'}" tabindex="${index===0?'0':'-1'}" data-gallery-dot="${index}" aria-label="第 ${index+1} 张：${esc(entry.item?.title||'档案图')}">${index+1}</button>`).join('')}</div></div></div>`:'';
  const mediaChecklist=`<details class="character-disclosure character-media-checklist" data-archive-disclosure="media-checklist"><summary><span>收录清单</span><b>${mediaSlots.filter(slot=>slot.hit).length} / ${mediaSlots.length} 已收录</b></summary><div class="character-media-slot-grid">${mediaSlots.map(slot=>slot.hit
    ?`<article class="character-media-slot is-ready"><div class="character-media-slot-frame"><img src="${esc(slot.hit.src)}" alt="${esc(slot.hit.item.title||slot.label)}" loading="lazy"/></div><div class="character-media-slot-copy"><span>${esc(slot.label)}</span><b>${esc(slot.hit.item.title||slot.label)}</b><small>本地镜像已收录</small></div></article>`
    :`<article class="character-media-slot is-empty"><div class="character-media-slot-copy"><span>${esc(slot.label)}</span><b>镜像未收录</b><small>${esc(slot.hint)} · 不热链、不伪造内容</small></div></article>`).join('')}</div><p class="character-wiki-note">六类媒体槽全部保留在清单中；缺少本地文件的项目只在展开后说明。</p></details>`;

  const growthStages=(character.growth||[]).filter(stage=>stage&&(stage.sections?.length||stage.materials?.length)).slice(0,8);
  const growthMaterials=materials=>(materials||[]).slice(0,16).map(material=>{
    const href=safeUrl(material.url);
    const grade=esc(material.grade||'等级待核验');
    const icon=safeUrl(material.icon,{image:true});
    const mark=icon?`<img class="character-growth-icon" src="${esc(icon)}" alt="" width="48" height="48" loading="lazy" decoding="async"/>`:`<span class="character-growth-grade" aria-label="稀有度 ${grade}">${grade}</span>`;
    const body=`${mark}<span><b>${esc(material.name||'未命名材料')}</b><small>× ${esc(material.amount||'待核验')}</small></span>`;
    return href?`<a class="character-growth-material" href="${esc(href)}" target="_blank" rel="noreferrer">${body}</a>`:`<div class="character-growth-material">${body}</div>`;
  }).join('');
  const growthBody=growthStages.length?`<div class="wiki-growth-slider" data-growth-slider><div class="wiki-growth-slider-head"><span>滑动查看职级</span><b data-growth-label>${esc(growthStages[0].name||'阶段 1')}</b></div><label class="wiki-growth-range"><span class="sr-only">职级晋升阶段</span><input type="range" min="0" max="${Math.max(growthStages.length-1,0)}" value="0" step="1" data-growth-range aria-valuetext="${esc(growthStages[0].name||'阶段 1')}"/></label><div class="wiki-growth-ticks" role="tablist" aria-label="职级晋升阶段">${growthStages.map((stage,index)=>`<button id="growth-stage-tab-${index}" type="button" role="tab" aria-selected="${index===0}" aria-controls="growth-stage-panel-${index}" tabindex="${index===0?'0':'-1'}" data-growth-stage="${index}" class="${index===0?'is-active':''}">${esc(stage.name||`阶段 ${index+1}`)}</button>`).join('')}</div><div class="character-growth-stages">${growthStages.map((stage,index)=>`<div id="growth-stage-panel-${index}" class="character-growth-stage" role="tabpanel" aria-labelledby="growth-stage-tab-${index}" data-growth-panel="${index}" ${index?'hidden':''}>${(stage.sections||[]).map(part=>`<section class="character-growth-section"><h3>${esc(part.name||part.header?.join(' / ')||'属性数据')}</h3>${part.header?.length?`<div class="character-growth-header">${part.header.map(value=>`<b>${esc(value)}</b>`).join('')}</div>`:''}<div class="character-growth-rows">${(part.rows||[]).map(row=>`<div class="character-growth-row">${row.map(cell=>`<span>${esc(cell)}</span>`).join('')}</div>`).join('')}</div></section>`).join('')}${stage.materials?.length?`<section class="character-growth-section"><h3>晋升材料</h3><div class="character-growth-materials">${growthMaterials(stage.materials)}</div></section>`:''}</div>`).join('')}</div><p class="character-wiki-note">数据来自米哈游绝区零百科快照；实际数值与消耗请以游戏内当前版本为准。</p></div>`:'<p class="character-empty">成长数据正在核验，暂未录入职级晋升阶段。</p>';
  const buildBody=`<div class="character-wiki-columns"><div class="character-wiki-block"><h3>签名音擎</h3>${list(character.build?.wEngines,'签名音擎待整理。')}</div><div class="character-wiki-block"><h3>驱动盘</h3>${list(character.build?.driveDiscs,'驱动盘方案待整理。')}</div><div class="character-wiki-block"><h3>主词条</h3>${list(character.build?.mainStats,'主词条待整理。')}</div><div class="character-wiki-block"><h3>副词条</h3>${list(character.build?.subStats,'副词条优先级待整理。')}</div><div class="character-wiki-block"><h3>技能优先级</h3>${list(character.combat?.skillPriority,'技能优先级待整理。')}</div><div class="character-wiki-block"><h3>配队方向</h3>${list(character.build?.teams,'配队建议待整理。')}</div></div><p class="character-wiki-note">${esc(character.build?.note||'攻略内容会标为玩家整理，并以游戏内实际版本为准。')}</p>`;

  const profileFacts=`<div class="character-data-grid"><div><span>代理人编号</span><b>${esc(String(character.id).toUpperCase())}</b></div><div><span>稀有度</span><b>${esc(character.rank||'待确认')}</b></div><div><span>所属阵营</span><b>${esc(faction?.name||'待确认')}</b></div><div><span>作战属性</span><b>${(window.ZZZIcons?.attrIcon(character.attribute,'')||'')}${esc(character.attribute||'待补充')}</b></div><div><span>战斗特性</span><b>${(window.ZZZIcons?.attrIcon(character.specialty,'')||'')}${esc(character.specialty||'待补充')}</b></div><div><span>攻击类型</span><b>${esc(character.attackType||'待补充')}</b></div><div><span>实装日期</span><b>${esc(character.releaseDate||'待核验')}</b></div><div><span>生日</span><b>${esc(character.birthday||'待核验')}</b></div></div>`;
  const profileLong=`<details class="character-disclosure" data-archive-disclosure="profile-notes"><summary>角色印象与资料快照</summary><div class="character-wiki-block"><h3>角色印象</h3>${character.impression?prose(character.impression):`<p>${esc(character.summary||'印象待补充。')}</p>`}</div>${character.cv?`<div class="character-wiki-block"><h3>角色 CV / 语音摘录</h3>${prose(character.cv)}</div>`:''}<div class="character-wiki-block"><h3>资料快照</h3><p>更新于 ${esc(character.updatedAt||'待记录')}。本页优先维护角色关系导航与档案摘要。</p></div></details>`;

  /* ---------- 技能介绍（官方 Wiki role_talent 管道，agent-talents.js 生成） ---------- */
  const talentRecord=(window.agentTalents?.agents||{})[character.id];
  const talentSkills=(talentRecord?.skills||[]).filter(skill=>skill&&skill.name);
  const talentId=`character-talent-${String(character.id).replace(/[^a-z0-9_-]/gi,'-')}`;
  const talentTabs=talentSkills.map((skill,index)=>{
    const shortLabel=skill.name.split('：')[0]||skill.name.slice(0,4);
    return `<button id="${talentId}-tab-${index}" type="button" role="tab" aria-controls="${talentId}-panel-${index}" aria-selected="${index===0?'true':'false'}" tabindex="${index===0?'0':'-1'}" class="talent-icon-tab${index===0?' is-active':''}" data-talent-tab="${index}" title="${esc(skill.name)}"><span class="talent-icon-circle talent-icon-no-img" aria-hidden="true">${esc(shortLabel.slice(0,2))}</span><span class="talent-icon-label">${esc(shortLabel)}</span></button>`;
  }).join('');
  const talentPanels=talentSkills.map((skill,index)=>{
    const growth=(skill.growth||[]).filter(stage=>stage.rows?.length);
    const shortLabel=skill.name.split('：')[0]||skill.name;
    const nameSuffix=skill.name.includes('：')?skill.name.slice(skill.name.indexOf('：')+1):'';
    const hasIcon=!!skill.icon;
    // 滑动升级表：每个 growth stage 做成一个水平卡片
    let growthHtml='';
    if(growth.length){
      const stageCircles=growth.map(stage=>{
        const stageChar=esc(stage.name);
        const isCore=stage.name.match(/^[A-F]$/);
        return `<div class="talent-stage-card"><span class="talent-stage-num${isCore?' is-core':''}">${isCore?`S${stageChar}`:`${stageChar}`}</span><ul class="talent-stage-rows">${stage.rows.map(row=>`<li>${esc(row)}</li>`).join('')}</ul></div>`;
      }).join('');
      growthHtml=`<div class="talent-growth-scroll" aria-label="技能升级"><div class="talent-growth-track">${stageCircles}</div></div><p class="talent-growth-tip">← 左右滑动查看升级 →</p>`;
    }
    return `<div id="${talentId}-panel-${index}" class="talent-panel${index===0?' is-active':''}" role="tabpanel" aria-labelledby="${talentId}-tab-${index}" aria-hidden="${index===0?'false':'true'}" ${index===0?'':'hidden inert'} data-talent-panel="${index}"><div class="talent-detail"><div class="talent-detail-left"><span class="talent-big-icon">${hasIcon?`<span class="talent-icon-circle"><img src="${esc(skill.icon)}" alt="" width="120" height="120" loading="lazy" decoding="async"/></span>`:`<span class="talent-icon-circle talent-icon-no-img" aria-hidden="true">${esc(shortLabel.slice(0,2))}</span>`}</span><div class="talent-detail-name"><span class="talent-detail-type">${esc(shortLabel)}</span><h3>${esc(skill.name)}</h3>${nameSuffix?`<span class="talent-detail-sub">${esc(nameSuffix)}</span>`:''}</div></div><div class="talent-detail-right"><p class="talent-desc">${esc(skill.desc)}</p></div></div>${growthHtml}</div>`;
  }).join('');
  const talentBody=talentSkills.length
    ?`<div class="talent-module" data-talent-module><div class="talent-icon-row" role="tablist" aria-label="技能列表">${talentTabs}</div><div class="talent-panels">${talentPanels}</div><p class="character-wiki-note">技能文案与成长数值来自米哈游绝区零百科快照；实际效果请以游戏内当前版本为准。</p></div>`
    :'';
  const talentDisclosure=talentBody?`<details class="character-disclosure" data-archive-disclosure="talent"><summary>技能 · 官方 Wiki 快照</summary>${talentBody}</details>`:'';
  const growthDisclosure=`<details class="character-disclosure" data-archive-disclosure="growth"><summary>成长 · 职级晋升</summary>${growthBody}</details>`;
  const buildDisclosure=`<details class="character-disclosure" data-archive-disclosure="build"><summary>养成 · 音擎、驱动盘与配队</summary>${buildBody}</details>`;
  const loreNotes=shopNotes?`<details class="character-disclosure" data-archive-disclosure="lore-notes"><summary>录像店留言</summary>${shopNotes}</details>`:'';
  const relatedRecords=related.length?`<details class="character-disclosure" data-archive-disclosure="related-records"><summary>关联档案 ${related.length} 条</summary>${related.map(record=>`<a class="related-record" href="${record.factionId?`faction.html?id=${encodeURIComponent(record.factionId)}`:'stories.html'}"><span>${esc(record.tag||'档案')}</span><b>${esc(record.title)}</b><small>${esc(record.summary)}</small></a>`).join('')}</details>`:'';

  const modules={
    media:section('media','相关影像','影像索引',[mediaFromStories,mediaFromRecords,mediaGallery,mediaChecklist].filter(Boolean).join(''),'暂无已关联影像。'),
    lore:section('lore','个人剧情','剧情记录',`${storyCards||'<p class="character-empty">尚未录入个人剧情摘录。</p>'}${loreNotes}`,'尚未录入个人剧情摘录。'),
    profile:section('profile','角色资料','资料档案',`<p class="character-module-intro">${esc(character.summary||'角色简介待补充。')}</p>${profileFacts}${profileLong}${growthDisclosure}${buildDisclosure}`,'暂无角色资料。'),
    talents:section('talents','技能','技能档案',talentBody,'技能数据正在整理，暂未录入。'),
    related:section('related','来源与关联','来源核对',`${sourceLinks||'<p class="character-empty">尚未录入角色资料来源。</p>'}${relatedRecords}`,'尚未关联资料来源或其他档案。',{source:true})
  };
  content.innerHTML=[modules.media,modules.lore,modules.profile,modules.talents,modules.related].join('');
  if(screen&&!screen.hasAttribute('data-character-text-motion'))screen.dataset.characterTextMotion='enter';

  const components=data.site?.pages?.character?.components||[];
  freeHost.innerHTML=components.map(component=>component.type==='image'
    ?`<img class="free-component" src="${esc(safeUrl(component.src,{image:true}))}" alt="${esc(component.alt)}" data-editor-id="component.${esc(component.id)}" data-editor-type="image" data-editor-field="src" data-component-id="${esc(component.id)}"/>`
    :component.type==='link'
      ?`<a class="free-component" href="${esc(safeUrl(component.href)||'#')}" data-editor-id="component.${esc(component.id)}" data-editor-type="link" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</a>`
      :`<p class="free-component" data-editor-id="component.${esc(component.id)}" data-editor-type="text" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</p>`).join('');

  const bindGallerySlider=()=>{
    const root=content.querySelector('[data-gallery-slider]');
    if(!root)return;
    const track=root.querySelector('.wiki-gallery-track');
    const slides=[...root.querySelectorAll('[data-gallery-slide]')];
    const dots=[...root.querySelectorAll('[data-gallery-dot]')];
    const label=root.querySelector('[data-gallery-label]');
    const indexEl=root.querySelector('[data-gallery-index]');
    if(!track||!slides.length)return;
    let index=0;
    const go=(next,{focus=false}={})=>{
      index=(next+slides.length)%slides.length;
      track.style.transform=`translateX(-${index*100}%)`;
      slides.forEach((slide,itemIndex)=>{
        const active=itemIndex===index;
        slide.classList.toggle('is-active',active);
        slide.setAttribute('aria-hidden',String(!active));
        slide.tabIndex=active?0:-1;
        slide.toggleAttribute('inert',!active);
      });
      dots.forEach((dot,itemIndex)=>{const active=itemIndex===index;dot.classList.toggle('is-active',active);dot.setAttribute('aria-selected',String(active));dot.tabIndex=active?0:-1});
      if(label)label.textContent=slides[index].querySelector('figcaption')?.textContent||`档案图 ${index+1}`;
      if(indexEl)indexEl.textContent=String(index+1);
      if(focus)dots[index]?.focus();
    };
    root.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>go(index-1));
    root.querySelector('[data-gallery-next]')?.addEventListener('click',()=>go(index+1));
    dots.forEach(dot=>dot.addEventListener('click',()=>go(+dot.dataset.galleryDot)));
    root.querySelector('.wiki-gallery-dots')?.addEventListener('keydown',event=>{
      const next={ArrowRight:index+1,ArrowDown:index+1,ArrowLeft:index-1,ArrowUp:index-1,Home:0,End:slides.length-1}[event.key];
      if(next===undefined)return;
      event.preventDefault();
      go(next,{focus:true});
    });
    go(0);
  };

  const selectGrowthStage=(button,{focus=false,index}={})=>{
    const tabs=[...content.querySelectorAll('[data-growth-stage]')];
    if(!tabs.length)return;
    const selected=index!==undefined?String(index):button?.dataset.growthStage;
    if(selected===undefined)return;
    const activeButton=tabs.find(tab=>tab.dataset.growthStage===selected)||tabs[0];
    tabs.forEach(tab=>{const active=tab.dataset.growthStage===activeButton.dataset.growthStage;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
    content.querySelectorAll('[data-growth-panel]').forEach(panel=>{panel.hidden=panel.dataset.growthPanel!==activeButton.dataset.growthStage});
    const range=content.querySelector('[data-growth-range]');
    const label=content.querySelector('[data-growth-label]');
    if(range){range.value=activeButton.dataset.growthStage;range.setAttribute('aria-valuetext',activeButton.textContent||'')}
    if(label)label.textContent=activeButton.textContent||'';
    if(focus)activeButton.focus();
  };

  const bindTalentTabs=()=>{
    const root=content.querySelector('[data-talent-module]');
    if(!root)return;
    const tabs=[...root.querySelectorAll('[data-talent-tab]')];
    const panels=[...root.querySelectorAll('[data-talent-panel]')];
    if(!tabs.length)return;
    let index=0;
    const go=(next,{focus=false}={})=>{
      index=(next+tabs.length)%tabs.length;
      tabs.forEach((tab,i)=>{
        const active=i===index;
        tab.classList.toggle('is-active',active);
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex=active?0:-1;
      });
      panels.forEach((panel,i)=>{
        const active=i===index;
        panel.classList.toggle('is-active',active);
        panel.hidden=!active;
        panel.toggleAttribute('inert',!active);
        panel.setAttribute('aria-hidden',String(!active));
      });
      if(focus)tabs[index]?.focus();
    };
    tabs.forEach(tab=>tab.addEventListener('click',()=>go(+tab.dataset.talentTab)));
    root.querySelector('[role="tablist"]')?.addEventListener('keydown',event=>{
      const next={ArrowRight:index+1,ArrowDown:index+1,ArrowLeft:index-1,ArrowUp:index-1,Home:0,End:tabs.length-1}[event.key];
      if(next===undefined)return;
      event.preventDefault();
      go(next,{focus:true});
    });
    go(0);
  };

  const archiveTablist=document.querySelector('.character-module-nav[role="tablist"]');
  const archiveTabs=[...(archiveTablist?.querySelectorAll(':scope > [role="tab"][data-character-nav]')||[])];
  const archivePanels=new Map([...content.querySelectorAll('.character-module[role="tabpanel"]')].map(panel=>[panel.id,panel]));
  const archiveRoutes={
    art:{panel:'media',view:'hero'},dossier:{panel:'media',view:'dossier'},
    media:{panel:'media',view:'dossier'},lore:{panel:'lore',view:'dossier'},profile:{panel:'profile',view:'dossier'},related:{panel:'related',view:'dossier'},
    source:{panel:'related',view:'dossier'},story:{panel:'lore',view:'dossier'},
    growth:{panel:'profile',view:'dossier',disclosure:'growth'},build:{panel:'profile',view:'dossier',disclosure:'build'},
    talent:{panel:'profile',view:'dossier',disclosure:'talent'},skill:{panel:'profile',view:'dossier',disclosure:'talent'},
    combat:{panel:'profile',view:'dossier',disclosure:'build'}
  };
  const resolveArchiveRoute=()=>{
    const hash=location.hash.replace(/^#/,'').toLowerCase();
    return archiveRoutes[hash]||(archivePanels.has(hash)?{panel:hash,view:'dossier'}:{panel:'media',view:'hero'});
  };
  const activateArchivePanel=(panelId,{focus=false,animate=true}={})=>{
    const key=archivePanels.has(panelId)?panelId:'media';
    const previous=archiveTabs.find(tab=>tab.getAttribute('aria-selected')==='true')?.dataset.characterNav;
    archiveTabs.forEach(tab=>{
      const active=tab.dataset.characterNav===key;
      tab.classList.toggle('is-active',active);
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
    });
    archivePanels.forEach((panel,id)=>{
      const active=id===key;
      panel.classList.remove('is-panel-entering');
      panel.hidden=!active;
      panel.toggleAttribute('inert',!active);
      panel.setAttribute('aria-hidden',String(!active));
    });
    const activePanel=archivePanels.get(key);
    if(activePanel&&animate&&previous&&previous!==key){
      activePanel.classList.add('is-panel-entering');
      requestAnimationFrame(()=>requestAnimationFrame(()=>activePanel.classList.remove('is-panel-entering')));
    }
    if(focus)archiveTabs.find(tab=>tab.dataset.characterNav===key)?.focus({preventScroll:true});
    return key;
  };
  const applyArchiveHash=({focus=false,scroll=false,animate=true}={})=>{
    const route=resolveArchiveRoute();
    activateArchivePanel(route.panel,{focus,animate});
    const disclosure=route.disclosure?content.querySelector(`[data-archive-disclosure="${route.disclosure}"]`):null;
    if(disclosure)disclosure.open=true;
    if(scroll&&route.view==='dossier')document.querySelector('#dossier')?.scrollIntoView({block:'start',behavior:'auto'});
    else if(scroll&&route.view==='hero')document.querySelector('#art')?.scrollIntoView({block:'start',behavior:'auto'});
    return route;
  };
  const navigateArchivePanel=panelId=>{
    const key=archivePanels.has(panelId)?panelId:'media';
    if(location.hash!==`#${key}`)history.pushState(null,'',`#${key}`);
    activateArchivePanel(key,{focus:true});
  };

  content.addEventListener('click',event=>selectGrowthStage(event.target.closest('[data-growth-stage]')));
  content.addEventListener('input',event=>{
    const range=event.target.closest('[data-growth-range]');
    if(range)selectGrowthStage(null,{index:+range.value});
  });
  content.addEventListener('keydown',event=>{
    const button=event.target.closest('[data-growth-stage]');
    if(!button)return;
    const tabs=[...content.querySelectorAll('[data-growth-stage]')];
    const index=tabs.indexOf(button);
    const next={ArrowRight:(index+1)%tabs.length,ArrowDown:(index+1)%tabs.length,ArrowLeft:(index-1+tabs.length)%tabs.length,ArrowUp:(index-1+tabs.length)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if(next===undefined)return;
    event.preventDefault();
    selectGrowthStage(tabs[next],{focus:true});
  });
  archiveTablist?.addEventListener('click',event=>{
    const tab=event.target.closest('[role="tab"][data-character-nav]');
    if(!tab||tab.closest('[role="tablist"]')!==archiveTablist)return;
    event.preventDefault();
    navigateArchivePanel(tab.dataset.characterNav);
  });
  archiveTablist?.addEventListener('keydown',event=>{
    const tab=event.target.closest('[role="tab"][data-character-nav]');
    if(!tab||tab.closest('[role="tablist"]')!==archiveTablist)return;
    const index=archiveTabs.indexOf(tab);
    const next={ArrowRight:(index+1)%archiveTabs.length,ArrowLeft:(index-1+archiveTabs.length)%archiveTabs.length,Home:0,End:archiveTabs.length-1}[event.key];
    if(next===undefined)return;
    event.preventDefault();
    navigateArchivePanel(archiveTabs[next].dataset.characterNav);
  });
  bindGallerySlider();
  bindTalentTabs();
  selectGrowthStage(content.querySelector('[data-growth-stage].is-active')||content.querySelector('[data-growth-stage]'));
  const initialRoute=applyArchiveHash({animate:false});
  if(location.hash&&initialRoute.view==='dossier')requestAnimationFrame(()=>document.querySelector('#dossier')?.scrollIntoView({block:'start',behavior:'auto'}));
  const restoreArchiveRoute=()=>{
    const route=resolveArchiveRoute();
    applyArchiveHash({focus:route.view==='dossier',scroll:true});
  };
  addEventListener('popstate',restoreArchiveRoute);
  addEventListener('hashchange',restoreArchiveRoute);
})();
