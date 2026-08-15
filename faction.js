(()=>{
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
  const text=value=>String(value??'').trim();
  const slug=value=>text(value).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'item';
  const safeTheme=value=>/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(text(value))?text(value):'#ffe600';
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
        ||!decodedPath.startsWith('/assets/')
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
  const agentColors=window.agentColors||{};
  const recordSources=[
    ['mainline','主线'],
    ['stories','角色剧情'],
    ['behindScenes','幕后与对谈'],
    ['events','往期活动']
  ];

  const FACTION_EN={
    'cunning-hares':'Gentle House',
    'belobog':'Belobog Heavy Industries',
    'victoria-housekeeping':'Victoria Housekeeping',
    'sons-of-calydon':'Sons of Calydon',
    'section-6':'Section 6',
    'criminal-investigation-srt':'Criminal Investigation',
    'obol-squad':'Obol Squad',
    'stars-of-lyra':'Stars of Lyra',
    'mockingbird':'Mockingbird',
    'yunkui-summit':'Yunkui Summit',
    'spook-shack':'Spook Shack',
    'krampus-compliance-authority':'Krampus',
    'angels-of-delusion':'Angels of Delusion',
    'metropolitan-order-division':'Metropolitan Order',
    'defense-force-silver-squad':'Silver Squad',
    'external-strategy-department':'External Strategy',
    'phaethon':'Phaethon',
    'covenant-of-dayat':'Covenant of Dayat'
  };
  const factionEn=item=>FACTION_EN[text(item?.id)]||text(item?.id).replace(/-/g,' ');

  const $=selector=>document.querySelector(selector);
  const notice=$('#factionNotice');
  const directory=$('#factionDirectory');
  const detail=$('#factionDetail');
  const sourceStatus=$('#factionSourceStatus');
  const sourceAction=$('#factionSourceAction');

  const memberListFor=item=>{
    const memberIds=new Set(Array.isArray(item?.members)?item.members.map(text):[]);
    return characters.filter(character=>text(character?.factionId)===text(item?.id)||memberIds.has(text(character?.id)));
  };
  const localLogo=item=>safeLocalImage(item?.logo);
  const cardArt=member=>safeLocalImage(member?.card||member?.avatar||member?.headshot||member?.portrait);
  const fullArt=member=>safeLocalImage(member?.portrait||member?.card||member?.avatar);
  const agentColor=(member,fallback)=>safeTheme(agentColors[text(member?.id)]||fallback);
  const pad=value=>String(value).padStart(2,'0');

  /* ── 跑马灯（内容重复两遍实现无缝滚动） ── */
  const buildMarquee=(node,items,hlEvery=0)=>{
    if(!node)return;
    const seq=items.map((item,index)=>`<span class="mi${hlEvery&&index%hlEvery===hlEvery-1?' hl':''}">${escapeHtml(item)}</span><span class="dot"></span>`).join('');
    node.innerHTML=`<div class="fg-marquee-track">${seq}${seq}</div>`;
  };

  /* ── 交错入场 ── */
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('revealed');io.unobserve(entry.target);}
  }),{threshold:.1});
  const observe=nodes=>nodes.forEach((el,index)=>{el.style.transitionDelay=(index%6*70)+'ms';io.observe(el);});

  /* ════════ 目录页 ════════ */
  const renderDirectory=invalid=>{
    document.body.style.removeProperty('--faction-theme');
    document.body.style.removeProperty('--agent');
    directory.hidden=false;
    detail.hidden=true;
    if(invalid){
      notice.hidden=false;
      notice.textContent=`未找到阵营标识“${requestedId}”；以下仍显示可用阵营目录。`;
    }else{
      notice.hidden=true;
      notice.textContent='';
    }
    buildMarquee($('#dirMarquee'),['Faction Archive','阵营档案','New Eridu','HOOXI','Hollow Raiders','新艾利都']);
    buildMarquee($('#dirBgMarquee'),factions.flatMap(item=>[text(item?.name)||text(item?.id),factionEn(item)]));
    buildMarquee($('#dirBgMarquee2'),['Admit One','HOOXI Archive','New Eridu','Faction Pass','Hollow Raiders','阵营档案']);
    buildMarquee($('#footTape'),['World All Ends Here','欢迎来到新艾利都','Zenless Zone Zero','HOOXI Fan Archive']);
    $('#directoryCountSticker').textContent=`${pad(factions.length)} 个阵营已收录`;
    $('#factionDirectoryList').innerHTML=factions.length
      ?factions.map((item,idx)=>{
        const id=text(item?.id);
        const name=text(item?.name)||id||'未命名阵营';
        const logo=localLogo(item);
        const members=memberListFor(item);
        const arts=members.map(cardArt).filter(Boolean).slice(0,3);
        const theme=safeTheme(item?.theme);
        return `<a class="fg-fcard fg-ticket fx-glare-target" style="--fc:${escapeHtml(theme)}" href="faction.html?id=${encodeURIComponent(id)}" data-faction-id="${escapeHtml(id)}">
          <span class="fg-fcard-en" aria-hidden="true">${escapeHtml(factionEn(item))}</span>
          <div class="fg-fcard-body">
            <span class="fg-ticket-head" aria-hidden="true">HOOXI ARCHIVE · FACTION PASS</span>
            <div class="fg-fcard-top">
              ${logo?`<span class="fg-fcard-emblem"><img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}徽记" loading="lazy"/></span>`:''}
              <div>
                <h3>${escapeHtml(name)}</h3>
                <p class="en">${escapeHtml(factionEn(item))}</p>
              </div>
            </div>
            <p class="sum">${escapeHtml(text(item?.summary))}</p>
            <div class="fg-fcard-foot">
              <span class="fg-fcard-count">${pad(members.length)} AGENTS</span>
              <span class="fg-fcard-cta">查看阵营档案</span>
            </div>
          </div>
          <div class="fg-fcard-arts" aria-hidden="true"><div class="fig">${arts.map(src=>`<img src="${escapeHtml(src)}" alt="" loading="lazy"/>`).join('')}</div></div>
          <span class="fg-ticket-perf" aria-hidden="true"></span>
          <span class="fg-ticket-stub" aria-hidden="true">
            <span class="stub-serial">NO.${pad(idx+1)}</span>
            <span class="stub-admit">ADMIT ONE</span>
            <span class="stub-barcode"></span>
            <span class="stub-venue">NEW·ERIDU</span>
          </span>
          <span class="fg-ticket-holo" aria-hidden="true"></span>
        </a>`;
      }).join('')
      :'<p class="fg-empty">当前预览数据未提供阵营目录。</p>';
    observe([...document.querySelectorAll('.fg-fcard')]);
    sourceStatus.textContent='目录与成员映射来自 HOOXI 本地角色目录与已核验记录索引；目录仅展示阵营徽记，版权归米哈游所有。';
    sourceAction.replaceChildren();
    setPageMeta('阵营目录 // HOOXI（粉丝非官方）','《绝区零》阵营目录与本地成员映射。HOOXI 为粉丝非官方档案，与米哈游/HoYoverse 无隶属。');
  };

  /* ════════ 关联记录 ════════ */
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
    $('#factionCount').textContent=String(total);
    const usedIds=new Set();
    $('#factionRecords').innerHTML=groups.length?groups.map(group=>{
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

  /* ════════ 详情页 ════════ */
  const renderFaction=()=>{
    const name=text(faction?.name)||requestedId;
    const summary=text(faction?.summary)||`${name}的成员与关联记录导航。`;
    const logo=localLogo(faction);
    const theme=safeTheme(faction?.theme);
    const members=memberListFor(faction);
    document.body.style.setProperty('--faction-theme',theme);
    notice.hidden=true;
    notice.textContent='';
    directory.hidden=true;
    detail.hidden=false;

    buildMarquee($('#stageMarquee'),[factionEn(faction),name,'Faction File','HOOXI Archive']);
    buildMarquee($('#midTape'),[factionEn(faction),name,`${pad(members.length)} Agents`,`Theme ${theme}`,'New Eridu Archive'],3);
    buildMarquee($('#footTape'),['World All Ends Here','欢迎来到新艾利都','Zenless Zone Zero',name]);

    const ghost=$('#stageGhostEmblem');
    if(logo){ghost.src=logo;ghost.hidden=false;}else{ghost.hidden=true;}
    $('#panelFaction').innerHTML=`${logo?`<img src="${escapeHtml(logo)}" alt=""/>`:''}<span>${escapeHtml(name)} · ${escapeHtml(factionEn(faction)).toUpperCase()}</span>`;
    const briefEmblem=$('#briefEmblem');
    if(logo){briefEmblem.src=logo;briefEmblem.hidden=false;}else{briefEmblem.hidden=true;}
    $('#briefName').textContent=name;
    $('#briefSummary').textContent=summary;
    const wikiBtn=$('#btnWiki');
    const wiki=safeUrl(faction?.wikiUrl);
    if(wiki){wikiBtn.href=wiki;wikiBtn.style.display='';}
    else wikiBtn.style.display='none';

    $('#memberHint').textContent=`${pad(members.length)} AGENTS // 点击切换 · ← → 键切换`;
    $('#factionMembers').innerHTML=members.length?members.map((member,index)=>{
      const rank=text(member?.rank).toUpperCase();
      const color=agentColor(member,theme);
      return `<div class="fg-mcard" style="--mc:${escapeHtml(color)}" data-i="${index}" role="button" tabindex="0" aria-label="查看${escapeHtml(text(member?.name))}">
        <div class="ph">
          ${rank?`<span class="mr ${rank==='S'?'s':rank==='A'?'a':''}">${escapeHtml(rank)}</span>`:''}
          <img src="${escapeHtml(cardArt(member))}" alt="${escapeHtml(text(member?.name))}" loading="lazy"/>
        </div>
        <p class="mn">${escapeHtml(text(member?.name))}</p>
      </div>`;
    }).join(''):'<p class="fg-empty">HOOXI 本地角色目录暂未映射该阵营成员。</p>';

    const cards=[...document.querySelectorAll('.fg-mcard')];
    let current=-1;
    const select=(index,animate=true)=>{
      const member=members[index];
      if(!member)return;
      current=index;
      const color=agentColor(member,theme);
      document.body.style.setProperty('--agent',color);
      cards.forEach((el,i)=>el.classList.toggle('active',i===index));
      cards[index].scrollIntoView({block:'nearest',inline:'center',behavior:animate?'smooth':'auto'});
      const apply=()=>{
        const img=$('#stageImg');
        const art=fullArt(member);
        if(art){img.src=art;img.hidden=false;}else{img.hidden=true;}
        img.alt=`${text(member?.name)}立绘`;
        const rank=text(member?.rank).toUpperCase();
        const rankBadge=$('#panelRank');
        rankBadge.textContent=rank?`${rank} 级`:'—';
        rankBadge.className='fg-rank '+(rank==='S'?'s':rank==='A'?'a':'');
        $('#panelNo').textContent=`AGENT No.${pad(index+1)} // ${requestedId.toUpperCase()}`;
        $('#agentName').textContent=text(member?.name);
        $('#agentEn').textContent=text(member?.englishName);
        $('#agentChips').innerHTML=[
          text(member?.attribute)&&`<span class="fg-chip">属性 <b>${escapeHtml(text(member?.attribute))}</b></span>`,
          text(member?.specialty||member?.role)&&`<span class="fg-chip">特性 <b>${escapeHtml(text(member?.specialty||member?.role))}</b></span>`,
          text(member?.attackType)&&`<span class="fg-chip">${escapeHtml(text(member?.attackType))}</span>`
        ].filter(Boolean).join('');
        $('#agentDesc').textContent=text(member?.summary||member?.impression)||'身份资料待核验。';
        $('#btnChar').href=`character.html?id=${encodeURIComponent(text(member?.id))}`;
      };
      const wrap=$('#stagePortrait');
      if(animate&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
        wrap.classList.remove('swap-in');
        wrap.classList.add('swap-out');
        setTimeout(()=>{apply();wrap.classList.remove('swap-out');wrap.classList.add('swap-in');},240);
      }else apply();
    };
    cards.forEach((el,index)=>{
      el.addEventListener('click',()=>select(index));
      el.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();select(index);}
      });
    });
    document.addEventListener('keydown',event=>{
      if(!members.length||event.target.matches('input,textarea,select'))return;
      if(event.key==='ArrowRight')select((current+1)%members.length);
      if(event.key==='ArrowLeft')select((current-1+members.length)%members.length);
    });

    /* 立绘轻微视差 */
    const stage=$('.fg-stage');
    if(stage&&matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
      stage.addEventListener('mousemove',event=>{
        const rect=stage.getBoundingClientRect();
        const x=(event.clientX-rect.left)/rect.width-.5;
        $('#stageImg').style.transform=`translateX(${x*18}px) rotate(${x*1.2}deg)`;
      });
      stage.addEventListener('mouseleave',()=>{$('#stageImg').style.transform='';});
    }

    select(0,false);

    $('#factionContextContent').innerHTML=`<p>${escapeHtml(name)}的成员关系按本地角色目录中的 factionId 与阵营成员表交叉整理；关联记录只读取当前打包 archiveData，不从正式页本地存储补写。角色代表色提取自本地立绘素材并经人工核对。</p>`;
    renderRecords();

    const scopedSource=safeUrl(faction?.sourceUrl);
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
    setPageMeta(`${name} // HOOXI 阵营档案（粉丝非官方）`,`${name}成员与关联记录导航。HOOXI 为粉丝非官方档案，与米哈游/HoYoverse 无隶属。`);
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
})();
