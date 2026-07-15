(()=>{
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeUrl=(value,{image=false}={})=>{const text=String(value||'').trim();if(!text)return '';if(image&&(text.startsWith('data:image/')||text.startsWith('blob:')))return text;try{const url=new URL(text,location.href);return ['http:','https:'].includes(url.protocol)||url.origin===location.origin?url.href:''}catch{return ''}};
  const id=new URLSearchParams(location.search).get('id')||'';
  const preview=()=>{if(!new URLSearchParams(location.search).has('editorPreview'))return null;try{return JSON.parse(localStorage.getItem('hooxi:preview:data'))}catch{return null}};
  const archiveData=preview()||window.archiveData||{};
  const factions=archiveData.factions||[];
  const characters=archiveData.characters||[];
  const faction=factions.find(item=>item.id===id);
  const sources=[['mainline','主线'],['stories','角色剧情'],['behindScenes','幕后 / 对谈'],['events','往期活动']];
  const records=()=>sources.flatMap(([key,label])=>{
    let rows=archiveData[key]||[];
    const storeKey=key==='behindScenes'?'behind-scenes':key;
    try{const saved=localStorage.getItem(`hooxi:${storeKey}`);if(saved){const parsed=JSON.parse(saved);rows=Array.isArray(parsed)?parsed:(parsed.items||rows)}}catch{}
    return rows.filter(row=>row.factionId===id).map(row=>({...row,source:label,page:`${storeKey}.html`}));
  });
  const memberList=()=>{
    const ids=faction?.members||[];
    return characters.filter(character=>character.factionId===id||ids.includes(character.id));
  };
  const headshot=member=>{
    const source=member.headshot||member.avatar;
    return source?`<img src="${esc(source)}" alt="${esc(member.name)} 头部立绘" loading="lazy"/>`:`<span>${esc(member.name.slice(0,1))}</span>`;
  };
  const portrait=member=>member.portrait?`<img src="${esc(member.portrait)}" alt="${esc(member.name)} 全身立绘" loading="lazy"/>`:'';
  const bindAgentDepth=()=>document.querySelectorAll('.agent-entry').forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch')return;
      const rect=card.getBoundingClientRect();
      card.style.setProperty('--agent-x',`${((event.clientX-rect.left)/rect.width-.5)*2}`);
      card.style.setProperty('--agent-y',`${((event.clientY-rect.top)/rect.height-.5)*2}`);
    });
    card.addEventListener('pointerleave',()=>{card.style.removeProperty('--agent-x');card.style.removeProperty('--agent-y')});
  });
  if(!faction){
    document.title='Hooxi // 阵营不存在';
    document.querySelector('#factionName').innerHTML='阵营<br/><span>不存在</span>';
    document.querySelector('#factionSummary').textContent='该阵营标识不存在，请返回角色阵营目录检查 factionId。';
    document.querySelector('#factionMembers').innerHTML='<a class="button" href="stories.html">返回角色阵营目录</a>';
    return;
  }
  document.title=`${faction.name} // Hooxi 阵营档案`;
  document.documentElement.style.setProperty('--faction-theme',faction.theme||'#f3d33b');
  document.querySelector('#factionName').innerHTML=`<span data-editor-id="faction.${esc(faction.id)}.name" data-editor-type="faction" data-editor-field="name">${esc(faction.name)}</span><br/><span>阵营档案</span>`;
  document.querySelector('#factionSummary').textContent=faction.summary||'';
  document.querySelector('#factionSummary').dataset.editorId=`faction.${faction.id}.summary`;
  document.querySelector('#factionSummary').dataset.editorField='summary';
  if(faction.background)document.querySelector('#factionHero').style.backgroundImage=`linear-gradient(#151719cc,#151719cc),url("${String(faction.background).replaceAll('"','')}")`;
  if(faction.logo)document.querySelector('#factionLogo').innerHTML=`<img src="${esc(faction.logo)}" alt="${esc(faction.name)} 标识"/>`;
  const members=memberList();
  document.querySelector('#memberCount').textContent=members.length;
  document.querySelector('#factionMembers').innerHTML=members.length
    ?members.map((member,index)=>`<a class="agent-entry agent-entry-${index%3}" href="character.html?id=${encodeURIComponent(member.id)}" style="--agent-order:${index}" data-editor-id="character.${esc(member.id)}" data-editor-type="character" data-editor-bind="characters.${esc(member.id)}"><span class="agent-entry-index">AGENT ${String(index+1).padStart(2,'0')}</span><span class="agent-entry-stage"><span class="agent-entry-glow" aria-hidden="true"></span><span class="agent-entry-head">${headshot(member)}</span><span class="agent-entry-portrait">${portrait(member)}</span></span><span class="agent-entry-copy"><b data-editor-id="character.${esc(member.id)}.name" data-editor-field="name">${esc(member.name)}</b><small>${esc(member.attribute||'属性待补充')} · ${esc(member.specialty||member.role||'资料待补充')}</small></span><span class="agent-entry-action" aria-hidden="true">OPEN FILE ↗</span></a>`).join('')
    :'<p class="character-empty">该阵营暂未录入成员。请在 data.js 的 characters 集合中添加角色，并在 factions.members 中关联角色 ID。</p>';
  bindAgentDepth();
  const components=archiveData.site?.pages?.faction?.components||[];
  document.querySelector('.faction-detail-page').insertAdjacentHTML('beforeend',`<div class="free-components">${components.map(component=>component.type==='image'?`<img class="free-component" src="${esc(safeUrl(component.src,{image:true}))}" alt="${esc(component.alt)}" data-editor-id="component.${esc(component.id)}" data-editor-type="image" data-editor-field="src" data-component-id="${esc(component.id)}"/>`:component.type==='link'?`<a class="free-component" href="${esc(safeUrl(component.href)||'#')}" data-editor-id="component.${esc(component.id)}" data-editor-type="link" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</a>`:`<p class="free-component" data-editor-id="component.${esc(component.id)}" data-editor-type="text" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</p>`).join('')}</div>`);
  const rows=records();
  document.querySelector('#factionCount').textContent=rows.length;
  document.querySelector('#factionRecords').innerHTML=rows.length
    ?rows.map(row=>`<article class="faction-record" data-id="${esc(row.id)}"><span class="episode-tag">${esc(row.source)} · ${esc(row.tag)}</span><h2>${esc(row.title)}</h2><p>${esc(row.summary)}</p><div class="page-links">${row.video?`<a class="video-link" href="${esc(row.video)}" target="_blank" rel="noreferrer">▶ 打开视频 ↗</a>`:''}<a class="wiki-link" href="${esc(row.wikiUrl)}" target="_blank" rel="noreferrer">资料来源 ↗</a></div></article>`).join('')
    :'<p class="character-empty">该阵营尚无关联剧情记录。</p>';
})();
