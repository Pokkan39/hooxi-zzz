(()=>{
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const data=window.archiveData||{};
  const factions=data.factions||[];
  const characters=data.characters||[];
  const memberCount=faction=>faction.members?.length||characters.filter(character=>character.factionId===faction.id).length;
  const icon=(faction)=>faction.logo
    ?`<img src="${esc(faction.logo)}" alt="${esc(faction.name)} 图标" loading="lazy"/>`
    :`<span aria-hidden="true">${esc(faction.name.slice(0,1))}</span>`;

  document.querySelector('#factionCount').textContent=factions.length;
  document.querySelector('#factionGrid').innerHTML=factions.map((faction,index)=>`<a class="faction-entry" href="faction.html?id=${encodeURIComponent(faction.id)}" style="--faction-card-theme:${esc(faction.theme||'#f3d33b')}" aria-label="进入${esc(faction.name)}阵营档案"><span class="faction-entry-index">FACTION ${String(index+1).padStart(2,'0')}</span><span class="faction-entry-icon">${icon(faction)}</span><span class="faction-entry-copy"><b>${esc(faction.name)}</b><small>${memberCount(faction)} 名成员 · 点击进入档案</small></span><span class="faction-entry-action" aria-hidden="true">ENTER ↗</span></a>`).join('')||'<p class="character-empty">尚未录入阵营，请在 data.js 的 factions 中添加第一项。</p>';
  document.querySelectorAll('.faction-entry').forEach(card=>{
    card.addEventListener('pointerdown',()=>card.classList.add('is-pressed'));
    card.addEventListener('pointerup',()=>card.classList.remove('is-pressed'));
    card.addEventListener('pointerleave',()=>card.classList.remove('is-pressed'));
  });
})();
