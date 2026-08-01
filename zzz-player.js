(function(){
  'use strict';
  // index.html 已有完整播放器，直接退出
  if(document.getElementById('musicPlayer'))return;

  var TRACKS=[
    {name:'pinKing',url:'assets/audio/ChiliChill乐团 _ 三Z-STUDIO _ HOYO-MiX - pinKing.ogg'},
    {name:'食通万物',url:'assets/audio/hanser _ 三Z-STUDIO _ HOYO-MiX - 食通万物 修心修身.ogg'},
    {name:'AIZO',url:'assets/audio/King Gnu - AIZO.ogg'},
    {name:'DAMIDAMI',url:'assets/audio/Sihan _ 三Z-STUDIO _ HOYO-MiX - DAMIDAMI.ogg'},
    {name:'60%的日常',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常.ogg'},
    {name:'60%的日常·悠闲',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常·悠闲.ogg'},
    {name:'60%的日常·自由(1)',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常·自由(1).ogg'},
    {name:'60%的日常·自由',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常·自由.ogg'},
    {name:'60%的遐想',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想.ogg'},
    {name:'60%的遐想·热情',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想·热情.ogg'},
    {name:'60%的遐想·静谧(1)',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想·静谧(1).ogg'},
    {name:'60%的遐想·静谧',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想·静谧.ogg'},
    {name:'Billy Mode',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - Billy Mode.ogg'},
    {name:'绝望吧台',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - Burning Desires 绝望吧台.ogg'},
    {name:'chaos_exe',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - chaos_exe.ogg'},
    {name:'Fearless',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - Fearless 无所畏惧.ogg'},
    {name:'ReDreaming Angel',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - ReDreaming Angel 复梦天使.ogg'},
    {name:'乐园梦游计',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 乐园梦游计.ogg'},
    {name:'午晴闲闻',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 午晴闲闻.ogg'},
    {name:'天使ロード中',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 天使ロード中…^_−☆.ogg'},
    {name:'妄想色心跳',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 妄想色心跳.ogg'},
    {name:'小停再出发',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 小停再出发.ogg'},
    {name:'当群星交汇',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 当群星交汇 (Feat_耀嘉音).ogg'},
    {name:'把心跳变成节奏',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 把心跳变成节奏.ogg'},
    {name:'晓',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 晓.ogg'},
    {name:'流光夜巷',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 流光夜巷.ogg'},
    {name:'澄空映辉',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 澄空映辉.ogg'},
    {name:'繁星数载',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 繁星数载.ogg'},
    {name:'绘本',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 绘本.ogg'},
    {name:'问',url:'assets/audio/三Z-STUDIO _ HOYO-MiX - 问.ogg'},
    {name:'FURYON',url:'assets/audio/三Z-STUDIO _ HOYO-MiX _ Alaina Cross - FURYON 狂怒觉醒.ogg'},
    {name:'Tiny Giant',url:'assets/audio/三Z-STUDIO _ HOYO-MiX _ Ashley Alisha - Tiny Giant 小巨星.ogg'},
    {name:'乐园游梦记',url:'assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 乐园游梦记.ogg'},
    {name:'原色',url:'assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 原色.ogg'},
    {name:'闪亮',url:'assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 闪亮.ogg'},
    {name:'千万次初见',url:'assets/audio/三Z-STUDIO _ HOYO-MiX _ 黄美珍 - 千万次初见.ogg'},
    {name:'不及',url:'assets/audio/苏诗丁 _ 三Z-STUDIO _ HOYO-MiX - 不及.ogg'},
    {name:'My Curse My Fate',url:'assets/audio/宫阁 _ 三Z-STUDIO _ HOYO-MiX - My Curse, My Fate (Destin et malédiction).ogg'},
    {name:'红透晚烟青',url:'assets/audio/金玟岐 _ 三Z-STUDIO _ HOYO-MiX - 红透晚烟青.ogg'},
    {name:'一颗方糖',url:'assets/audio/阿兰 _ 三Z-STUDIO _ HOYO-MiX - 一颗方糖悬滞的时间.ogg'}
  ];

  var STATE_KEY='hooxiPlayerState';
  var saved=null;
  try{saved=JSON.parse(sessionStorage.getItem(STATE_KEY));}catch(e){}
  var trackIdx=Math.max(0,Math.min(((saved&&saved.idx)||0),TRACKS.length-1));
  var savedTime=(saved&&saved.t)||0;
  var savedVol=(saved&&typeof saved.v==='number')?saved.v:0.7;

  // 注入隐藏的播放器 DOM（作为 cassette-float.js 的转发目标）
  var mp=document.createElement('div');
  mp.id='musicPlayer';
  mp.style.cssText='display:none;position:absolute;left:-9999px;';
  mp.setAttribute('aria-hidden','true');
  mp.innerHTML='<audio id="audio" preload="none"></audio>'
    +'<button id="musicToggle" type="button" aria-label="播放/暂停">▶</button>'
    +'<button id="prevTrack" type="button" aria-label="上一首">◀</button>'
    +'<button id="nextTrack" type="button" aria-label="下一首">▶</button>'
    +'<input id="volume" type="range" min="0" max="1" step="0.05" value="'+savedVol+'"/>'
    +'<span id="trackName"></span>'
    +'<button id="playlistOpen" type="button" style="display:none">歌单</button>'
    +'<button id="cassetteOpen" type="button" style="display:none">磁带机</button>';
  (document.body||document.documentElement).appendChild(mp);

  var audio=document.getElementById('audio');
  var btnToggle=document.getElementById('musicToggle');
  var btnPrev=document.getElementById('prevTrack');
  var btnNext=document.getElementById('nextTrack');
  var inputVol=document.getElementById('volume');
  var spanName=document.getElementById('trackName');

  audio.volume=savedVol;

  function loadTrack(idx,play,seekTo){
    trackIdx=((idx%TRACKS.length)+TRACKS.length)%TRACKS.length;
    var t=TRACKS[trackIdx];
    audio.src=t.url;
    if(spanName)spanName.textContent=t.name;
    audio.load();
    if(seekTo>1){
      audio.addEventListener('canplay',function seek(){
        audio.removeEventListener('canplay',seek);
        if(seekTo<audio.duration-1)audio.currentTime=seekTo;
      },{once:true});
    }
    if(play)audio.play().catch(function(){});
  }

  // 恢复曲目元信息（不加载音频，等用户点击再 load/play）
  trackIdx=Math.max(0,Math.min(trackIdx,TRACKS.length-1));
  if(spanName)spanName.textContent=TRACKS[trackIdx].name;
  // 不在页面加载时调用 audio.load() / audio.src=，
  // 避免触发网络请求令 Playwright networkidle 永远不满足。
  // loadTrack 首次在用户点击 toggle/prev/next 时才会执行。
  btnToggle.addEventListener('click',function(){
    if(!audio.src){loadTrack(trackIdx,true,savedTime);return;}
    if(audio.paused)audio.play().catch(function(){});
    else audio.pause();
  },true); // capture=true 确保在 waveform.js 的委托之前执行
  btnPrev.addEventListener('click',function(){loadTrack(trackIdx-1,!audio.src||!audio.paused,0);});
  btnNext.addEventListener('click',function(){loadTrack(trackIdx+1,!audio.src||!audio.paused,0);});
  inputVol.addEventListener('input',function(){
    audio.volume=Number(inputVol.value);
  });
  audio.addEventListener('ended',function(){
    loadTrack(trackIdx+1,true,0);
  });
  audio.addEventListener('play',function(){
    btnToggle.setAttribute('aria-label','暂停');
    btnToggle.textContent='⏸';
  });
  audio.addEventListener('pause',function(){
    btnToggle.setAttribute('aria-label','播放');
    btnToggle.textContent='▶';
  });

  window.addEventListener('pagehide',function(){
    try{
      sessionStorage.setItem(STATE_KEY,JSON.stringify({
        idx:trackIdx,
        t:audio.currentTime||0,
        v:audio.volume
      }));
    }catch(e){}
  });

  // 不在页面加载时 load 音频，等用户首次点击才触发网络请求
})();
