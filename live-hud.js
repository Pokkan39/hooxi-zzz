/* ============================================================
   HOOXI // 真实数据 HUD
   把子页 hero 里原本写死的装饰标签（SIGNAL LOCKED / NE-01 / 圆环 01）
   替换为由本地档案真实派生的数据：版本分布、记录计数、当前筛选状态。
   不新增依赖；数据全部来自已加载的 window.archiveData。
   删除页面中的 script 引用即可回滚。
   ============================================================ */
(function(){
  'use strict';

  var KEY_BY_BODY={
    'archive-mainline':'mainline',
    'archive-events':'events',
    'archive-behind':'behindScenes',
    'archive-stories':'stories'
  };

  /* 阵营页：把 FACTION LINK / ACCESS GRANTED / NE-F 换成真实成员与关联统计 */
  function renderFactionStatus(){
    var status=document.querySelector('.hero-status');
    if(!status)return true;
    var members=document.querySelectorAll('a[href*="character.html"]').length;
    var records=document.querySelectorAll('.related-record,.page-card,.faction-record').length;
    var params=new URLSearchParams(location.search);
    var fid=params.get('id')||'';
    var d=window.archiveData||{};
    var faction=(d.factions||[]).find(function(f){return f&&(f.id===fid)});
    // 统计该阵营在各栏目出现的关联记录
    var linked=0;
    ['mainline','stories','events','behindScenes'].forEach(function(k){
      (d[k]||[]).forEach(function(x){
        if(x&&(x.factionId===fid||(x.faction&&faction&&x.faction===faction.name)))linked++;
      });
    });
    if(!members&&!linked)return false;
    status.classList.add('hud-live-status');
    status.innerHTML=
      '<span>MEMBERS <b>'+(members||0)+'</b></span>'+
      '<span>RECORDS <b>'+(linked||records||0)+'</b></span>'+
      (faction&&faction.name?'<span>ID <b>'+String(fid).toUpperCase().slice(0,14)+'</b></span>':'');
    return true;
  }

  function currentKey(){
    var cls=document.body.className||'';
    for(var k in KEY_BY_BODY){if(cls.indexOf(k)>-1)return KEY_BY_BODY[k]}
    return null;
  }

  function readItems(key){
    var d=window.archiveData||{};
    // 优先读页面已渲染的记录数，回落到打包数据
    var live=document.querySelectorAll('.page-timeline-item').length;
    var arr=Array.isArray(d[key])?d[key]:[];
    return {arr:arr,live:live||arr.length};
  }

  /* 版本分布：返回 [{v,count}] 已排序，未标注单列 */
  function versionBuckets(arr){
    var map=new Map();
    arr.forEach(function(x){
      var v=(x&&x.version)?String(x.version):'未标注';
      map.set(v,(map.get(v)||0)+1);
    });
    var known=[],unknown=0;
    map.forEach(function(n,v){
      if(v==='未标注')unknown=n; else known.push({v:v,count:n});
    });
    known.sort(function(a,b){return a.v.localeCompare(b.v,undefined,{numeric:true})});
    return {known:known,unknown:unknown};
  }

  /* 把 hero-hud 换成真实版本进度环 */
  function renderVersionDial(hud,stats){
    var known=stats.buckets.known;
    var covered=known.reduce(function(s,x){return s+x.count},0);
    var total=covered+stats.buckets.unknown;
    var pct=total?Math.round(covered/total*100):0;
    var latest=known.length?known[known.length-1].v:'—';

    hud.classList.add('hud-live');
    hud.removeAttribute('aria-hidden');
    hud.setAttribute('role','img');
    hud.setAttribute('aria-label',
      '版本覆盖率 '+pct+'%，已标注 '+covered+' 条，未标注 '+stats.buckets.unknown+' 条，最新版本 '+latest);

    hud.innerHTML=
      '<span class="hud-live-kicker">VERSION COVERAGE</span>'+
      '<div class="hud-dial" style="--pct:'+pct+'">'+
        '<b>'+pct+'<i>%</i></b>'+
        '<small>'+covered+' / '+total+'</small>'+
      '</div>'+
      '<span class="hud-live-latest">LATEST <b>'+latest+'</b></span>'+
      '<span class="hud-live-note">'+stats.buckets.unknown+' 条待标注版本</span>';
  }

  /* 把 hero-status 的写死标签换成真实状态 */
  function renderStatus(status,stats){
    var known=stats.buckets.known;
    status.classList.add('hud-live-status');
    status.innerHTML=
      '<span>RECORDS <b>'+stats.live+'</b></span>'+
      '<span>VERSIONS <b>'+known.length+'</b></span>'+
      '<span>SOURCE <b>'+(stats.withSource)+'</b></span>';
  }

  function countWithSource(arr){
    return arr.filter(function(x){
      return x&&(x.sourceUrl||x.wikiUrl||(x.mediaIds&&x.mediaIds.length));
    }).length;
  }

  function boot(){
    // 阵营页走独立统计（无版本维度）
    if(document.body.className.indexOf('archive-faction')>-1){renderFactionStatus();return}
    var key=currentKey();
    if(!key)return;
    var got=readItems(key);
    if(!got.arr.length&&!got.live)return;

    var stats={
      live:got.live,
      buckets:versionBuckets(got.arr),
      withSource:countWithSource(got.arr)
    };

    var hud=document.querySelector('.hero-hud');
    if(hud)renderVersionDial(hud,stats);

    var status=document.querySelector('.hero-status');
    if(status)renderStatus(status,stats);
  }

  // page.js 渲染完成后再读，确保 live 计数准确
  function start(){setTimeout(boot,60);setTimeout(boot,600);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();
