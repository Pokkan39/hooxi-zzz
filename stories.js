(()=>{
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeUrl=(value,{image=false}={})=>{const text=String(value||'').trim();if(!text)return '';if(image&&(text.startsWith('data:image/')||text.startsWith('blob:')))return text;try{const url=new URL(text,location.href);return ['http:','https:'].includes(url.protocol)||url.origin===location.origin?url.href:''}catch{return ''}};
  const preview=()=>{if(!new URLSearchParams(location.search).has('editorPreview'))return null;try{return JSON.parse(localStorage.getItem('hooxi:preview:data'))}catch{return null}};
  const data=preview()||window.archiveData||{};
  const factions=data.factions||[];
  const characters=data.characters||[];
  const memberCount=faction=>faction.members?.length||characters.filter(character=>character.factionId===faction.id).length;
  const icon=(faction)=>faction.logo
    ?`<img src="${esc(faction.logo)}" alt="${esc(faction.name)} 图标" loading="lazy"/>`
    :`<span aria-hidden="true">${esc(faction.name.slice(0,1))}</span>`;

  document.querySelector('#factionCount').textContent=factions.length;
  document.querySelector('#factionGrid').innerHTML=factions.map((faction,index)=>`<a class="faction-entry" href="faction.html?id=${encodeURIComponent(faction.id)}" style="--faction-card-theme:${esc(faction.theme||'#f3d33b')}" aria-label="进入${esc(faction.name)}阵营档案" data-editor-id="faction.${esc(faction.id)}" data-editor-type="faction" data-editor-bind="factions.${esc(faction.id)}"><span class="faction-entry-index">FACTION ${String(index+1).padStart(2,'0')}</span><span class="faction-entry-icon" data-editor-id="faction.${esc(faction.id)}.logo" data-editor-field="logo">${icon(faction)}</span><span class="faction-entry-copy"><b data-editor-id="faction.${esc(faction.id)}.name" data-editor-field="name">${esc(faction.name)}</b><small>${memberCount(faction)} 名成员 · 点击进入档案</small></span><span class="faction-entry-action" aria-hidden="true">ENTER ↗</span></a>`).join('')||'<p class="character-empty">尚未录入阵营，请在 data.js 的 factions 中添加第一项。</p>';
  const components=data.site?.pages?.stories?.components||[];
  document.querySelector('.character-directory').insertAdjacentHTML('beforeend',`<div class="free-components">${components.map(component=>component.type==='image'?`<img class="free-component" src="${esc(safeUrl(component.src,{image:true}))}" alt="${esc(component.alt)}" data-editor-id="component.${esc(component.id)}" data-editor-type="image" data-editor-field="src" data-component-id="${esc(component.id)}"/>`:component.type==='link'?`<a class="free-component" href="${esc(safeUrl(component.href)||'#')}" data-editor-id="component.${esc(component.id)}" data-editor-type="link" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</a>`:`<p class="free-component" data-editor-id="component.${esc(component.id)}" data-editor-type="text" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</p>`).join('')}</div>`);
  document.querySelectorAll('.faction-entry').forEach(card=>{
    card.addEventListener('pointerdown',()=>card.classList.add('is-pressed'));
    card.addEventListener('pointerup',()=>card.classList.remove('is-pressed'));
    card.addEventListener('pointerleave',()=>card.classList.remove('is-pressed'));
  });
})();
