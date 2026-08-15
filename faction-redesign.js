(()=>{
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
  const text=value=>String(value??'').trim();
  const slug=value=>text(value).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'item';
  const safeTheme=value=>/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(text(value))?text(value):'#BFFF09';
  const spotlightColor=value=>{
    const hex=safeTheme(value).slice(1);
    const full=hex.length===3?hex.split('').map(char=>char+char).join(''):hex;
    const channels=[0,2,4].map(index=>Number.parseInt(full.slice(index,index+2),16));
    return `rgba(${channels.join(', ')}, 0.24)`;
  };
  const safeUrl=value=>{
    const raw=text(value);
    if(!raw||raw.startsWith('//'))return '';
    try{
      const url=new URL(raw,location.href);
      if(!['http:','https:'].includes(url.protocol))return '';
      const absolute=/^[a-z][a-z\d+.-]*:/i.test(raw);
      if(!absolute&&url.origin!==location.origin)return '';
      return url.href;
    }catch{return ''}
  };
  const safeLocalImage=value=>{
    const raw=text(value);
    if(!raw||raw.startsWith('//')||raw.includes('\\'))return '';
    try{
      const url=new URL(raw,location.href);
      const rawPath=raw.split(/[?#]/,1)[0];
      const decodedPath=decodeURIComponent(url.pathname);
      const hasEscape=rawPath.split('/').some(part=>{
        try{return ['.','..'].includes(decodeURIComponent(part))}catch{return true}
      });
      if(!['http:','https:'].includes(url.protocol)
        ||url.origin!==location.origin
        ||!decodedPath.includes('/assets/')
        ||/%2f|%5c/i.test(url.pathname)
        ||hasEscape
        ||!/\.(?:png|jpe?g|webp|gif|svg)$/i.test(decodedPath))return '';
      return raw;
    }catch{return ''}
  };
  const setMeta=(key,value)=>{
    const selector=key.startsWith('og:')?`meta[property="${key}"]`:`meta[name="${key}"]`;
    let node=document.querySelector(selector);
    if(!node){
      node=document.createElement('meta');
      node.setAttribute(key.startsWith('og:')?'property':'name',key);
      document.head.appendChild(node);
    }
    node.setAttribute('content',value);
  };
  const setPageMeta=(title,description)=>{
    document.title=title;
    setMeta('description',description);
    setMeta('og:title',title);
    setMeta('og:description',description);
    setMeta('twitter:title',title);
    setMeta('twitter:description',description);
  };
  const readPreview=()=>{
    if(!new URLSearchParams(location.search).has('editorPreview'))return null;
    try{
      const parsed=JSON.parse(localStorage.getItem('hooxi:preview:data')||'null');
      return parsed&&typeof parsed==='object'?parsed:null;
    }catch{return null}
  };

  const params=new URLSearchParams(location.search);
  const requestedId=params.get('id')||'';
  const archiveData=readPreview()||window.archiveData||{};
  const factions=Array.isArray(archiveData.factions)?archiveData.factions:[];
  const characters=Array.isArray(archiveData.characters)?archiveData.characters:[];
  const faction=factions.find(item=>text(item?.id)===requestedId)||null;
  const recordSources=[
    ['mainline','主线'],
    ['stories','角色剧情'],
    ['behindScenes','幕后与对谈'],
    ['events','往期活动']
  ];

  const heroName=document.querySelector('#factionName');
  const heroSummary=document.querySelector('#factionSummary');
  const heroLogo=document.querySelector('#factionLogo');
  const notice=document.querySelector('#factionNotice');
  const directory=document.querySelector('#factionDirectory');
  const detail=document.querySelector('#factionDetail');
  const sourceStatus=document.querySelector('#factionSourceStatus');
  const sourceAction=document.querySelector('#factionSourceAction');

  const memberListFor=item=>{
    const memberIds=new Set(Array.isArray(item?.members)?item.members.map(text):[]);
    return characters.filter(character=>text(character?.factionId)===text(item?.id)||memberIds.has(text(character?.id)));
  };
  const localLogo=item=>safeLocalImage(item?.logo);
  const memberImage=member=>safeLocalImage(member?.headshot||member?.avatar||member?.portrait);

  const renderDirectory=invalid=>{
    document.body.style.removeProperty('--faction-theme');
    heroName.textContent='阵营目录';
    heroSummary.textContent='选择阵营，查看本地成员映射、关联记录与已核验来源。';
    heroLogo.hidden=true;
    heroLogo.replaceChildren();
    directory.hidden=false;
    detail.hidden=true;
    if(invalid){
      notice.hidden=false;
      notice.textContent=`未找到阵营标识"${requestedId}"；以下仍显示可用阵营目录。`;
    }else{
      notice.hidden=true;
      notice.textContent='';
    }
    document.querySelector('#directoryCount').textContent=String(factions.length);
    document.querySelector('#factionDirectoryList').innerHTML=factions.length
      ?factions.map(item=>{
        const id=text(item?.id);
        const name=text(item?.name)||id||'未命名阵营';
        const logo=localLogo(item);
        const count=memberListFor(item).length;
        return `<article class="faction-directory-card" data-faction-id="${escapeHtml(id)}">
          <div class="faction-directory-emblem">${logo?`<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}徽记" loading="lazy"/>`:`<span aria-label="${escapeHtml(name)}暂无可用徽记">${escapeHtml(name.slice(0,1))}</span>`}</div>
          <div class="faction-directory-copy"><h3>${escapeHtml(name)}</h3><p>${count} 名成员</p></div>
          <a class="faction-primary-action" href="faction-redesign.html?id=${encodeURIComponent(id)}">查看阵营档案</a>
        </article>`;
      }).join('')
      :'<p class="faction-empty">当前预览数据未提供阵营目录。</p>';
    sourceStatus.textContent='目录与成员映射来自 HOOXI 本地角色目录与已核验记录索引；目录仅展示阵营徽记，版权归米哈游所有。';
    sourceAction.replaceChildren();
    setPageMeta('阵营目录 // HOOXI（粉丝非官方）','《绝区零》阵营目录与本地成员映射。HOOXI 为粉丝非官方档案，与米哈游/HoYoverse 无隶属。');
  };

  const memberViewModel=(member,index)=>{
    const id=text(member?.id)||`member-${index+1}`;
    const name=text(member?.name)||id;
    return {
      id,
      name,
      image:memberImage(member),
      facts:[text(member?.attribute),text(member?.specialty||member?.role)].filter(Boolean).join(' · ')||'身份资料待核验',
      summary:text(member?.summary||member?.impression),
      extraFacts:[
        ['英文名',text(member?.englishName)],
        ['攻击类型',text(member?.attackType)],
        ['收录日期',text(member?.releaseDate)]
      ].filter(([,value])=>value),
      href:`character.html?id=${encodeURIComponent(id)}`,
      disclosureId:`member-disclosure-${slug(id)}`,
      extraId:`member-extra-${slug(id)}`
    };
  };

  const renderMemberFallback=member=>{
    const hasExtra=member.summary||member.extraFacts.length;
    return `<article class="faction-member-entry faction-member-card faction-member-fallback-card" data-member-id="${escapeHtml(member.id)}">
      <div class="faction-member-image">${member.image?`<img src="${escapeHtml(member.image)}" alt="${escapeHtml(member.name)}立绘" loading="lazy"/>`:`<span aria-hidden="true">${escapeHtml(member.name.slice(0,1))}</span>`}</div>
      <div class="faction-member-copy"><h3>${escapeHtml(member.name)}</h3><p>${escapeHtml(member.facts)}</p></div>
      <a class="faction-primary-action" href="${escapeHtml(member.href)}">查看角色档案</a>
      ${hasExtra?`<details id="${escapeHtml(member.disclosureId)}" class="faction-disclosure faction-member-disclosure" data-archive-disclosure>
        <summary>更多成员资料</summary>
        <div id="${escapeHtml(member.extraId)}" class="faction-disclosure-content">
          ${member.summary?`<p>${escapeHtml(member.summary)}</p>`:''}
          ${member.extraFacts.length?`<dl>${member.extraFacts.map(([label,value])=>`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>`:''}
        </div>
      </details>`:''}
    </article>`;
  };

  const publishMemberPayload=(members,theme)=>{
    const payload={members,spotlightColor:spotlightColor(theme)};
    window.__HOOXI_FACTION_MEMBERS__=payload;
    window.__HOOXI_FACTION_MEMBERS_REACT__=false;
    window.dispatchEvent(new CustomEvent('hooxi:faction-members-ready',{detail:payload}));
  };

  const recordMatchesFaction=row=>text(row?.factionId)===requestedId
    ||(Array.isArray(row?.factionIds)&&row.factionIds.map(text).includes(requestedId));
  const recordActions=row=>{
    const specs=[['打开主要来源',row?.sourceUrl],['打开视频',row?.video],['打开资料词条',row?.wikiUrl]];
    const seen=new Set();
    const actions=[];
    let hasPrimary=false;
    specs.forEach(([label,value])=>{
      const raw=text(value);
      if(!raw)return;
      const href=safeUrl(raw);
      if(href&&seen.has(href))return;
      if(href){
        seen.add(href);
        actions.push(`<a${hasPrimary?'':' data-source-action'} href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${label}</a>`);
        hasPrimary=true;
      }else{
        actions.push(`<span class="faction-source-disabled">${label.replace(/^打开/,'')}不可用</span>`);
      }
    });
    if(!actions.length)actions.push('<span class="faction-source-disabled">来源不可用</span>');
    return actions.join('');
  };

  const renderRecords=()=>{
    const groups=recordSources.map(([key,label])=>{
      const rows=(Array.isArray(archiveData[key])?archiveData[key]:[]).filter(recordMatchesFaction);
      return {key,label,rows};
    }).filter(group=>group.rows.length);
    const total=groups.reduce((sum,group)=>sum+group.rows.length,0);
    document.querySelector('#factionCount').textContent=String(total);
    const usedIds=new Set();
    document.querySelector('#factionRecords').innerHTML=groups.length?groups.map(group=>{
      const contentId=`records-${slug(group.key)}-content`;
      const detailId=`records-${slug(group.key)}`;
      const records=group.rows.map((row,index)=>{
        const recordId=text(row?.id)||`${group.key}-${index+1}`;
        let domId=`record-${slug(group.key)}-${slug(recordId)}`;
        if(usedIds.has(domId))domId=`${domId}-${index+1}`;
        usedIds.add(domId);
        const groupName=text(row?.groupId||row?.group||row?.version||row?.tag)||'未分组';
        return `<article id="${domId}" class="faction-record" data-record-id="${escapeHtml(recordId)}" tabindex="-1">
          <p class="faction-record-meta">${escapeHtml(group.label)} · ${escapeHtml(groupName)}</p>
          <h3>${escapeHtml(row?.title||'未命名记录')}</h3>
          <p class="faction-record-summary">${escapeHtml(row?.summary||'该记录暂无公开摘要。')}</p>
          <code>记录 ID：${escapeHtml(recordId)}</code>
          <div class="faction-record-actions">${recordActions(row)}</div>
        </article>`;
      }).join('');
      return `<details id="${detailId}" class="faction-disclosure faction-record-group" data-archive-disclosure>
        <summary>${escapeHtml(group.label)} <b>${group.rows.length}</b></summary>
        <div id="${contentId}" class="faction-record-list">${records}</div>
      </details>`;
    }).join(''):'<p class="faction-empty">该阵营当前没有打包的关联记录；来源区仍保留成员映射与核验状态说明。</p>';
  };

  const renderFaction=()=>{
    const name=text(faction?.name)||requestedId;
    const summary=text(faction?.summary)||`${name}的成员与关联记录导航。`;
    const logo=localLogo(faction);
    const theme=safeTheme(faction?.theme);
    const members=memberListFor(faction).map(memberViewModel);
    document.body.style.setProperty('--faction-theme',theme);
    heroName.textContent=name;
    heroSummary.textContent=summary;
    notice.hidden=true;
    notice.textContent='';
    directory.hidden=true;
    detail.hidden=false;
    if(logo){
      heroLogo.hidden=false;
      heroLogo.innerHTML=`<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}徽记"/>`;
    }else{
      heroLogo.hidden=true;
      heroLogo.replaceChildren();
    }
    document.querySelector('#memberCount').textContent=String(members.length);
    const fallbackContent=members.length
      ?members.map(renderMemberFallback).join('')
      :'<p class="faction-empty">HOOXI 本地角色目录暂未映射该阵营成员。</p>';
    document.querySelector('#factionMembers').innerHTML=`<div data-faction-members-fallback>${fallbackContent}</div>`;
    publishMemberPayload(members,theme);
    document.querySelector('#factionContextContent').innerHTML=`<p>${escapeHtml(name)}的成员关系按本地角色目录中的 factionId 与阵营成员表交叉整理；关联记录只读取当前打包 archiveData，不从正式页本地存储补写。</p>`;
    renderRecords();

    const scopedSource=safeUrl(faction?.sourceUrl);
    const wiki=safeUrl(faction?.wikiUrl);
    if(faction?.sourceType==='official-member-page'&&scopedSource){
      sourceStatus.textContent='本页展示成员立绘与阵营徽记，版权归米哈游所有；阵营名称与成员关系由蕾米埃尔·丹官方角色百科页佐证；当前未收录独立阵营官方页面。';
      sourceAction.innerHTML=`<a data-source-action href="${escapeHtml(scopedSource)}" target="_blank" rel="noreferrer">打开蕾米埃尔·丹官方角色页</a>`;
    }else if(wiki){
      sourceStatus.textContent='本页展示成员立绘与阵营徽记，版权归米哈游所有；阵营专属词条已提供可信地址，成员映射与关联记录仍以 HOOXI 本地角色目录及打包索引为准。';
      sourceAction.innerHTML=`<a data-source-action href="${escapeHtml(wiki)}" target="_blank" rel="noreferrer">打开${escapeHtml(name)}资料来源</a>`;
    }else{
      sourceStatus.textContent='本页展示成员立绘与阵营徽记，版权归米哈游所有；阵营专属来源待核验，成员映射来自HOOXI本地角色目录与已核验记录索引；本站不伪造官方链接。';
      sourceAction.replaceChildren();
    }
    const shareTitle=`${name} // HOOXI 阵营档案（粉丝非官方）`;
    const shareDescription=`${name}成员与关联记录导航。HOOXI 为粉丝非官方档案，与米哈游/HoYoverse 无隶属。`;
    setPageMeta(shareTitle,shareDescription);
  };

  const focusHashTarget=()=>{
    if(!location.hash||location.hash==='#')return;
    let id='';
    try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
    const target=document.getElementById(id);
    if(!target)return;
    for(let node=target;node;node=node.parentElement){
      if(node instanceof HTMLDetailsElement)node.open=true;
    }
    const focusTarget=target instanceof HTMLDetailsElement
      ?target.querySelector(':scope > summary')
      :target;
    if(!(focusTarget instanceof HTMLElement))return;
    if(!focusTarget.matches('a,button,input,select,textarea,summary,[tabindex]'))focusTarget.tabIndex=-1;
    focusTarget.scrollIntoView({block:'start'});
    focusTarget.focus({preventScroll:true});
  };

  if(faction)renderFaction();
  else renderDirectory(Boolean(requestedId));
  requestAnimationFrame(focusHashTarget);
  window.addEventListener('hashchange',focusHashTarget);
  window.addEventListener('hooxi:faction-members-mounted',()=>{
    const refocus=()=>requestAnimationFrame(focusHashTarget);
    refocus();
    if(document.readyState!=='complete')window.addEventListener('load',refocus,{once:true});
  });
})();
