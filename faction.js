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
  /* 成员卡字段图标：只用 webp 批次（无底彩色字形，深色卡面可读）。
     PNG 批次（fire/support/rupture 等）是黑色字形或自带浅底圆章，压在立绘上会糊掉，宁缺不混。
     未收录的值（火/强攻/防护/命破…）只出文字，卡面文字行本身 57/57 完整，不丢信息。 */
  const FIELD_ICONS={
    '电':'electric','冰':'ice','以太':'ether','物理':'physical',
    '击破':'stun','异常':'anomaly'
  };
  const fieldIcon=value=>{
    const key=FIELD_ICONS[text(value)];
    return key?`<img class="fi" src="assets/field-icons/${key}.webp" alt="" aria-hidden="true" loading="lazy"/>`:'';
  };

  /* ── 档案条：只出已收录字段，缺值整行不出 ── */
  /* 语音映射按中文名索引（官方站 id 与站内 wikiId 不通，只能靠名字对齐）。
     语音文件引用官方公开 CDN，本地不落存储。 */
  /* 站内与官方的名字写法有差异（站内「狛野 真斗」带空格、官方不带；
     站内「星徽·比利·奇德」比官方「星徽·比利」长），去掉空格与括号后再按前缀互含匹配。 */
  const normName=value=>text(value).replace(/[\s·「」]/g,'');
  let voiceIndex=null;
  const voiceFor=(member,langKey)=>{
    const bag=window.agentVoices?.agents;
    if(!bag)return '';
    if(!voiceIndex){
      voiceIndex=new Map();
      for(const [name,entry] of Object.entries(bag))voiceIndex.set(normName(name),entry);
    }
    const key=normName(member?.name);
    let hit=voiceIndex.get(key);
    if(!hit){
      for(const [indexKey,entry] of voiceIndex){
        if(indexKey.startsWith(key)||key.startsWith(indexKey)){hit=entry;break;}
      }
    }
    const list=hit?.voices?.[langKey];
    return Array.isArray(list)&&list.length?list[0]:'';
  };
  /* CV 原始格式为「中配：X\n日配：Y\n英配：暂无」四语种串，「暂无」为占位需剔除。
     中配与日配都挂播放按钮。此前注释称「日配数据存疑」系误判：采集脚本
     scripts/collect-agent-voices.mjs 是按 locale 分路径抓取（zh-cn / ja-jp），
     且每个语种新建独立 browser context 规避 HTTP 缓存串味，归属是可靠的。
     复核结果：35 位角色同时有中日语音，中日 URL 重复数 0，抽样下载两条均为有效 MP3 且体积不同。
     英配/韩配映射表未采，无按钮只出文字。 */
  const CV_LANG_KEY={'中':'zh','日':'ja'};
  const cvBrief=(member,value)=>text(value).split('\n')
    .map(line=>line.split('：'))
    .filter(pair=>pair.length===2&&!/^暂无$/.test(pair[1].trim()))
    .map(([lang,name])=>{
      const short=lang.replace('配','');
      const src=voiceFor(member,CV_LANG_KEY[short]);
      const btn=src?`<button type="button" class="fg-cv-play" data-voice="${escapeHtml(src)}" aria-label="试听${escapeHtml(short)}配语音">▶</button>`:'';
      return `<i>${escapeHtml(short)}</i>${escapeHtml(name.trim())}${btn}`;
    })
    .join('<em>·</em>');
  /* ── 档案条 = 磁带盒背标（J-card）：三层权重，不是四行等权表格 ──
     第一层 专武 = A 面主标题（整行主色标签，rank 决定收边金/银）
     第二层 生日/实装 = 日期钢印（等宽小字，无格子）
     第三层 配音 = 演职员表（压到最低层，播放按钮保留高亮）
     缺值整段不出，不留空壳。 */
  /* 日期钢印取数字部分：生日「February 20th」→「02.20」，实装「2024-07-04」→「2024.07.04」。
     取不到就退回原文，不猜不编。 */
  const MONTHS=['january','february','march','april','may','june',
    'july','august','september','october','november','december'];
  const stampBirth=value=>{
    const raw=text(value);
    const hit=raw.toLowerCase().match(/([a-z]+)\s*(\d{1,2})/);
    if(hit){
      const month=MONTHS.indexOf(hit[1]);
      if(month>=0)return `${pad(month+1)}.${pad(hit[2])}`;
    }
    return raw;
  };
  const stampDate=value=>{
    const raw=text(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw.replace(/-/g,'.'):raw;
  };
  const dossierRows=(member,rank)=>{
    const weapon=escapeHtml(text(member?.signatureWEngine));
    const birth=escapeHtml(stampBirth(member?.birthday));
    const debut=escapeHtml(stampDate(member?.releaseDate));
    const cv=cvBrief(member,member?.cv);
    const grade=/^[SA]$/.test(rank)?` grade-${rank.toLowerCase()}`:'';
    const stamps=[
      birth&&`<div class="fg-stamp"><dt>BIRTH</dt><dd>${birth}</dd></div>`,
      debut&&`<div class="fg-stamp"><dt>DEBUT</dt><dd>${debut}</dd></div>`
    ].filter(Boolean).join('');
    return [
      weapon&&`<div class="fg-dos-hero${grade}"><dt>W-ENGINE</dt><dd>${weapon}</dd></div>`,
      stamps&&`<div class="fg-dos-stamps">${stamps}</div>`,
      cv&&`<div class="fg-dos-cv"><dt>CV</dt><dd>${cv}</dd></div>`
    ].filter(Boolean).join('');
  };

  /* 返回键：页面顶部时留在流内（站点导航条 .ik-header z-index:100 比它高，
     无条件 fixed 会被压在 HOOXI 标志底下），滚过导航条后才升为悬浮常驻。 */
  const backBar=document.querySelector('.fg-back-bar');
  if(backBar){
    const header=document.querySelector('.ik-header');
    const syncBack=()=>{
      const gate=(header?header.getBoundingClientRect().height:78)+8;
      backBar.classList.toggle('is-floating',window.scrollY>gate);
    };
    addEventListener('scroll',syncBack,{passive:true});
    addEventListener('resize',syncBack);
    syncBack();
  }

  /* 立绘透明边距补偿：立绘 PNG 各自带不同的透明边距（实测 57 张：顶部 0.2%~21.3%，
     高度占比 78.6%~99.7%），直接铺满容器会让人物看起来一大一小、且普遍偏小。
     全部贴底对齐（底部边距一致为 0.1%），所以按"不透明高度占比"反推缩放系数、以底边为锚点放大即可。
     用 1/占比 求系数并夹在 1~1.28：占比已接近满幅的那几张（最满 100%）系数=1，不会被裁。
     实测 57 张全部未被裁顶。系数写在外层 .fg-stage-portrait 上（走 CSS scale 属性）：
     img 的 transform 已被 hover 视差占用，若在 img 上设 transform-origin 会连带改掉视差轴心。 */
  const trimCache=new Map();
  const trimPortrait=img=>{
    const key=img.getAttribute('src');
    if(!key)return;
    const box=img.closest('.fg-stage-portrait')||img;
    const setVar=v=>box.style.setProperty('--port-trim',v);
    if(trimCache.has(key)){setVar(trimCache.get(key));return;}
    const probe=new Image();
    probe.onload=()=>{
      /* 缩到 200px 宽再取样，量边界够用且比原图快一个量级 */
      const w=200,h=Math.max(1,Math.round(probe.naturalHeight*w/probe.naturalWidth));
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(probe,0,0,w,h);
      let top=-1,bottom=-1;
      try{
        const data=ctx.getImageData(0,0,w,h).data;
        for(let y=0;y<h;y+=1){
          let hit=false;
          for(let x=0;x<w;x+=2){if(data[(y*w+x)*4+3]>12){hit=true;break;}}
          if(hit){if(top<0)top=y;bottom=y;}
        }
      }catch(error){return;/* 跨域取样失败就不补偿，保持原样 */}
      if(top<0)return;
      const ratio=(bottom-top+1)/h;
      const scale=Math.min(1.28,Math.max(1,+(1/ratio).toFixed(3)));
      trimCache.set(key,scale);
      if(img.getAttribute('src')===key)setVar(scale);
    };
    probe.src=key;
  };

  /* 语音试听：独立 Audio，不进 BGM 播放列表（ZZZPlayer.loadTrack 只接受列表索引，
     注入会污染全站播放列表）。播语音时暂停 BGM，避免两路声音叠在一起。 */
  let voiceAudio=null;
  /* 同一角色有中/日两个按钮，来回切换时上一次的 play() 会被新的 load 打断并抛 AbortError。
     若直接用 .catch(stopVoice)，这个迟到的 reject 会把刚点亮的新按钮清掉（表现为状态错位一格：
     切语种后两个按钮都不亮，再点一次才亮）。用自增 token 标记本次播放，
     只有 token 仍是最新时才允许清状态。 */
  let voiceToken=0;
  const stopVoice=()=>{
    voiceToken+=1;
    if(voiceAudio)voiceAudio.pause();
    document.querySelectorAll('.fg-cv-play.playing').forEach(el=>el.classList.remove('playing'));
  };
  document.addEventListener('click',event=>{
    const btn=event.target.closest('.fg-cv-play');
    if(!btn)return;
    const src=btn.dataset.voice;
    if(!src)return;
    const wasPlaying=btn.classList.contains('playing');
    stopVoice();
    if(wasPlaying)return;
    if(!voiceAudio){
      voiceAudio=new Audio();
      voiceAudio.addEventListener('ended',stopVoice);
      voiceAudio.addEventListener('error',stopVoice);
    }
    const myToken=++voiceToken;
    try{window.ZZZPlayer?.pause();}catch(error){/* BGM 未就绪时忽略 */}
    voiceAudio.src=src;
    btn.classList.add('playing');
    voiceAudio.play().catch(()=>{if(myToken===voiceToken)stopVoice();});
  });

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
    delete document.body.dataset.motif;
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
    /* 阵营母题：面板装饰语言按阵营切换，未收录阵营走默认档案风（CSS 只认精选 id） */
    document.body.dataset.motif=text(faction?.id)||'';
    notice.hidden=true;
    notice.textContent='';
    directory.hidden=true;
    detail.hidden=false;

    buildMarquee($('#stageMarquee'),[factionEn(faction),name,'Faction File','HOOXI Archive']);
    /* 立绘背后条带的竖排大字：复制两份保证纵向滚动无缝 */
    const reelText=(el,word)=>{if(el)el.textContent=`${word}  ${word}  `;};
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
      const attribute=text(member?.attribute);
      const specialty=text(member?.specialty);
      const trait=[attribute,specialty].filter(Boolean).join(' · ');
      const marks=`${fieldIcon(attribute)}${fieldIcon(specialty)}`;
      const en=text(member?.englishName);
      return `<div class="fg-mcard" style="--mc:${escapeHtml(color)}" data-i="${index}" role="button" tabindex="0" aria-label="查看${escapeHtml(text(member?.name))}">
        <div class="ph">
          ${/^[SA]$/.test(rank)?`<img class="mr" src="assets/rank-${escapeHtml(rank.toLowerCase())}.png" alt="${escapeHtml(rank)}级"/>`:''}
          <img src="${escapeHtml(cardArt(member))}" alt="${escapeHtml(text(member?.name))}" loading="lazy"/>
          ${marks?`<span class="mk" aria-hidden="true">${marks}</span>`:''}
          ${trait?`<span class="mt">${escapeHtml(trait)}</span>`:''}
        </div>
        <p class="mn">${escapeHtml(text(member?.name))}${en?`<i>${escapeHtml(en)}</i>`:''}</p>
      </div>`;
    }).join(''):'<p class="fg-empty">HOOXI 本地角色目录暂未映射该阵营成员。</p>';

    const cards=[...document.querySelectorAll('.fg-mcard')];

    // 面板下方快捷切换条：缩略图列表 + 左右箭头
    const switchList=$('#switchList');
    switchList.innerHTML=members.length?members.map((member,index)=>
      `<button type="button" class="fg-switch-item" data-i="${index}" role="tab" aria-label="切换到${escapeHtml(text(member?.name))}">
        <img src="${escapeHtml(cardArt(member))}" alt="" loading="lazy"/>
        <span>${escapeHtml(text(member?.name))}</span>
      </button>`
    ).join(''):'';
    const switchItems=[...switchList.querySelectorAll('.fg-switch-item')];
    const switchWrap=$('#agentSwitch');
    switchWrap.hidden=members.length<2;

    let current=-1;
    const select=(index,animate=true)=>{
      const member=members[index];
      if(!member)return;
      /* 切角色必须掐掉语音：Audio 在 DOM 之外，面板重渲染只会清掉按钮态，
         不停的话上一位的语音会继续播到结束 */
      stopVoice();
      current=index;
      const color=agentColor(member,theme);
      document.body.style.setProperty('--agent',color);
      cards.forEach((el,i)=>el.classList.toggle('active',i===index));
      // 只横向居中底部卡片，禁止带动页面纵向滚动
      const cardStrip=cards[index].parentElement;
      if(cardStrip)cardStrip.scrollTo({left:cards[index].offsetLeft-(cardStrip.clientWidth-cards[index].offsetWidth)/2,behavior:animate?'smooth':'auto'});
      switchItems.forEach((el,i)=>{
        el.classList.toggle('active',i===index);
        el.setAttribute('aria-selected',i===index?'true':'false');
      });
      if(switchItems[index])switchItems[index].scrollIntoView({block:'nearest',inline:'nearest',behavior:animate?'smooth':'auto'});
      const apply=()=>{
        const img=$('#stageImg');
        const art=fullArt(member);
        if(art){img.src=art;img.hidden=false;trimPortrait(img);}else{img.hidden=true;}
        img.alt=`${text(member?.name)}立绘`;
        const rank=text(member?.rank).toUpperCase();
        const rankBadge=$('#panelRank');
        rankBadge.innerHTML=/^[SA]$/.test(rank)?`<img class="fg-rank-img" src="assets/rank-${escapeHtml(rank.toLowerCase())}.png" alt="${escapeHtml(rank)}级"/>`:'—';
        rankBadge.className='fg-rank';
        $('#panelNo').textContent=`AGENT No.${pad(index+1)} // ${requestedId.toUpperCase()}`;
        $('#agentName').textContent=text(member?.name);
        $('#agentEn').textContent=text(member?.englishName);
        reelText($('#reelWordA'),text(member?.englishName)||factionEn(faction));
        reelText($('#reelWordB'),factionEn(faction)||text(member?.name));
        const attribute=text(member?.attribute);
        const specialty=text(member?.specialty||member?.role);
        $('#agentChips').innerHTML=[
          attribute&&`<span class="fg-chip attr">${fieldIcon(attribute)}属性 <b>${escapeHtml(attribute)}</b></span>`,
          specialty&&`<span class="fg-chip">${fieldIcon(specialty)}特性 <b>${escapeHtml(specialty)}</b></span>`,
          text(member?.attackType)&&`<span class="fg-chip">${escapeHtml(text(member?.attackType))}</span>`
        ].filter(Boolean).join('');
        $('#agentDossier').innerHTML=dossierRows(member,rank);
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
    switchItems.forEach((el,index)=>{
      el.addEventListener('click',()=>select(index));
    });
    const step=delta=>members.length&&select((current+delta+members.length)%members.length);
    $('#switchPrev').addEventListener('click',()=>step(-1));
    $('#switchNext').addEventListener('click',()=>step(1));
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
