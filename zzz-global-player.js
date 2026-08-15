/* ===========================================================
   zzz-global-player.js — 全局声纹音乐播放器单例
   功能：两侧频谱可视化 · 顶栏迷你控件 · 跨页状态持久
   IIFE 包裹，仅暴露 window.ZZZPlayer
   =========================================================== */
;(function(){
'use strict';

/* ---- 播放列表 ---- */
var PLAYLIST = [
  { id:'track-01', title:'一颗方糖悬滞的时间', artist:'阿兰 / 三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/阿兰 _ 三Z-STUDIO _ HOYO-MiX - 一颗方糖悬滞的时间.ogg', cover:'', lrc:'' },
  { id:'track-02', title:'pinKing', artist:'ChiliChill乐团 / 三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/ChiliChill乐团 _ 三Z-STUDIO _ HOYO-MiX - pinKing.ogg', cover:'', lrc:'' },
  { id:'track-03', title:'食通万物 修心修身', artist:'hanser / 三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/hanser _ 三Z-STUDIO _ HOYO-MiX - 食通万物 修心修身.ogg', cover:'', lrc:'' },
  { id:'track-04', title:'AIZO', artist:'King Gnu', album:'绝区零 OST', src:'assets/audio/King Gnu - AIZO.ogg', cover:'', lrc:'' },
  { id:'track-05', title:'DAMIDAMI', artist:'Sihan / 三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/Sihan _ 三Z-STUDIO _ HOYO-MiX - DAMIDAMI.ogg', cover:'', lrc:'' },
  { id:'track-06', title:'60%的日常', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常.ogg', cover:'', lrc:'' },
  { id:'track-07', title:'60%的日常·悠闲', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常·悠闲.ogg', cover:'', lrc:'' },
  { id:'track-08', title:'60%的日常·自由', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常·自由.ogg', cover:'', lrc:'' },
  { id:'track-09', title:'60%的遐想', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想.ogg', cover:'', lrc:'' },
  { id:'track-10', title:'60%的遐想·热情', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想·热情.ogg', cover:'', lrc:'' },
  { id:'track-11', title:'60%的遐想·静谧', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想·静谧.ogg', cover:'', lrc:'' },
  { id:'track-12', title:'Billy Mode', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - Billy Mode.ogg', cover:'', lrc:'' },
  { id:'track-13', title:'Burning Desires 绝望吧台', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - Burning Desires 绝望吧台.ogg', cover:'', lrc:'' },
  { id:'track-14', title:'chaos_exe', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - chaos_exe.ogg', cover:'', lrc:'' },
  { id:'track-15', title:'Fearless 无所畏惧', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - Fearless 无所畏惧.ogg', cover:'', lrc:'' },
  { id:'track-16', title:'ReDreaming Angel 复梦天使', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - ReDreaming Angel 复梦天使.ogg', cover:'', lrc:'' },
  { id:'track-17', title:'乐园梦游计', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 乐园梦游计.ogg', cover:'', lrc:'' },
  { id:'track-18', title:'午晴闲闻', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 午晴闲闻.ogg', cover:'', lrc:'' },
  { id:'track-19', title:'天使ロード中…^_−☆', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 天使ロード中…^_−☆.ogg', cover:'', lrc:'' },
  { id:'track-20', title:'妄想色心跳', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 妄想色心跳.ogg', cover:'', lrc:'' },
  { id:'track-21', title:'小停再出发', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 小停再出发.ogg', cover:'', lrc:'' },
  { id:'track-22', title:'当群星交汇', artist:'三Z-STUDIO / HOYO-MiX / 耀嘉音', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 当群星交汇 (Feat_耀嘉音).ogg', cover:'', lrc:'' },
  { id:'track-23', title:'把心跳变成节奏', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 把心跳变成节奏.ogg', cover:'', lrc:'' },
  { id:'track-24', title:'晓', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 晓.ogg', cover:'', lrc:'' },
  { id:'track-25', title:'流光夜巷', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 流光夜巷.ogg', cover:'', lrc:'' },
  { id:'track-26', title:'澄空映辉', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 澄空映辉.ogg', cover:'', lrc:'' },
  { id:'track-27', title:'繁星数载', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 繁星数载.ogg', cover:'', lrc:'' },
  { id:'track-28', title:'绘本', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 绘本.ogg', cover:'', lrc:'' },
  { id:'track-29', title:'问', artist:'三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX - 问.ogg', cover:'', lrc:'' },
  { id:'track-30', title:'FURYON 狂怒觉醒', artist:'三Z-STUDIO / HOYO-MiX / Alaina Cross', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX _ Alaina Cross - FURYON 狂怒觉醒.ogg', cover:'', lrc:'' },
  { id:'track-31', title:'Tiny Giant 小巨星', artist:'三Z-STUDIO / HOYO-MiX / Ashley Alisha', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX _ Ashley Alisha - Tiny Giant 小巨星.ogg', cover:'', lrc:'' },
  { id:'track-32', title:'乐园游梦记', artist:'三Z-STUDIO / HOYO-MiX / 于梓贝', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 乐园游梦记.ogg', cover:'', lrc:'' },
  { id:'track-33', title:'原色', artist:'三Z-STUDIO / HOYO-MiX / 于梓贝', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 原色.ogg', cover:'', lrc:'' },
  { id:'track-34', title:'闪亮', artist:'三Z-STUDIO / HOYO-MiX / 于梓贝', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 闪亮.ogg', cover:'', lrc:'' },
  { id:'track-35', title:'千万次初见', artist:'三Z-STUDIO / HOYO-MiX / 黄美珍', album:'绝区零 OST', src:'assets/audio/三Z-STUDIO _ HOYO-MiX _ 黄美珍 - 千万次初见.ogg', cover:'', lrc:'' },
  { id:'track-36', title:'My Curse, My Fate', artist:'宫阁 / 三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/宫阁 _ 三Z-STUDIO _ HOYO-MiX - My Curse, My Fate (Destin et malédiction).ogg', cover:'', lrc:'' },
  { id:'track-37', title:'不及', artist:'苏诗丁 / 三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/苏诗丁 _ 三Z-STUDIO _ HOYO-MiX - 不及.ogg', cover:'', lrc:'' },
  { id:'track-38', title:'红透晚烟青', artist:'金玟岐 / 三Z-STUDIO / HOYO-MiX', album:'绝区零 OST', src:'assets/audio/金玟岐 _ 三Z-STUDIO _ HOYO-MiX - 红透晚烟青.ogg', cover:'', lrc:'' }
];

/* ---- 状态 ---- */
var state = restoreState();
var audio = null;
var audioCtx = null;
var analyser = null;
var sourceNode = null;
var canvasL = null;
var canvasR = null;
var rafId = null;
var accentColor = 'rgba(62,199,214,0.7)';
var accentRgb   = '62,199,214'; // 用于 gradient 构建，避免每帧字符串解析
var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function restoreState(){
  try {
    var s = JSON.parse(sessionStorage.getItem('zzz-player-state'));
    if(s && typeof s.trackIndex === 'number') return s;
  } catch(e){}
  return { trackIndex: 0, time: 0, playing: false };
}

function saveState(){
  if(!audio) return;
  state.time = audio.currentTime || 0;
  state.playing = !audio.paused;
  sessionStorage.setItem('zzz-player-state', JSON.stringify(state));
}

/* ---- 初始化 ---- */
function init(){
  createAudio();
  injectSideWaveforms();
  injectMiniPlayer();
  updateAccentColor();
  observeTheme();
  // 恢复状态 — 必须在 loadedmetadata 后 seek，否则浏览器忽略 currentTime
  if(PLAYLIST[state.trackIndex] && PLAYLIST[state.trackIndex].src){
    var restoreTime = state.time || 0;
    var restorePlaying = !!state.playing;
    audio.addEventListener('loadedmetadata', function onMeta(){
      audio.removeEventListener('loadedmetadata', onMeta);
      if(restoreTime > 0){
        try { audio.currentTime = restoreTime; } catch(e){}
      }
      if(restorePlaying){
        audio.play().catch(function(){});
      }
    });
    loadTrack(state.trackIndex, false);
  }
  // 定期保存
  setInterval(saveState, 2000);
  // 页面离开时保存
  window.addEventListener('beforeunload', saveState);
  // reduced motion
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function(e){
    reducedMotion = e.matches;
  });
}

/* ---- Audio 元素 ---- */
function createAudio(){
  audio = document.createElement('audio');
  audio.preload = 'metadata';
  audio.volume = 0.7;
  audio.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(audio);
  audio.addEventListener('ended', handleEnded);
  audio.addEventListener('play', onPlayStateChange);
  audio.addEventListener('pause', onPlayStateChange);
  audio.addEventListener('timeupdate', onTimeUpdate);
}

function handleEnded(){
  next();
}

function onPlayStateChange(){
  updateMiniPlayBtn();
  saveState();
}

function onTimeUpdate(){
  // 用于 player.html 的进度更新（通过事件）
  window.dispatchEvent(new CustomEvent('zzz-player-timeupdate', { detail: { time: audio.currentTime, duration: audio.duration } }));
}

/* ---- 加载曲目 ---- */
function loadTrack(index, autoplay){
  if(index < 0 || index >= PLAYLIST.length) index = 0;
  state.trackIndex = index;
  var track = PLAYLIST[index];
  if(!track || !track.src){
    // 跳过无源曲目
    if(autoplay) next();
    return;
  }
  audio.src = track.src;
  audio.load();
  if(autoplay) audio.play().catch(function(){});
  updateMiniTitle();
  saveState();
  window.dispatchEvent(new CustomEvent('zzz-player-trackchange', { detail: { index: index, track: track } }));
}

/* ---- 播放控制 ---- */
function play(){
  ensureAudioContext();
  if(!audio.src && PLAYLIST[state.trackIndex]){
    loadTrack(state.trackIndex, true);
  } else {
    audio.play().catch(function(){});
  }
}
function pause(){ audio.pause(); }
function togglePlay(){ audio.paused ? play() : pause(); }
function next(){
  var idx = (state.trackIndex + 1) % PLAYLIST.length;
  loadTrack(idx, true);
}
function prev(){
  var idx = state.trackIndex - 1;
  if(idx < 0) idx = PLAYLIST.length - 1;
  loadTrack(idx, true);
}
function seek(time){ audio.currentTime = time; }
function setVolume(v){ audio.volume = Math.max(0, Math.min(1, v)); }

/* ---- Web Audio API（声纹） ---- */
function ensureAudioContext(){
  if(audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.78;
    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    startVisualization();
  } catch(e){
    console.warn('[ZZZPlayer] AudioContext unavailable:', e);
  }
}

/* ---- 两侧声纹 Canvas ---- */
function injectSideWaveforms(){
  canvasL = document.createElement('canvas');
  canvasL.className = 'zzz-side-waveform zzz-side-waveform--left';
  canvasL.width = 28;
  canvasL.height = window.innerHeight;
  canvasL.setAttribute('aria-hidden', 'true');

  canvasR = document.createElement('canvas');
  canvasR.className = 'zzz-side-waveform zzz-side-waveform--right';
  canvasR.width = 28;
  canvasR.height = window.innerHeight;
  canvasR.setAttribute('aria-hidden', 'true');

  document.body.appendChild(canvasL);
  document.body.appendChild(canvasR);

  window.addEventListener('resize', function(){
    var h = window.innerHeight;
    canvasL.height = h;
    canvasR.height = h;
  });
}

function startVisualization(){
  if(rafId) return;
  var dataArray = new Uint8Array(analyser.frequencyBinCount);
  // 缓存 ctx，避免每帧重复获取
  var ctxL = canvasL.getContext('2d');
  var ctxR = canvasR.getContext('2d');
  var pauseFrameSkip = 0;

  function draw(){
    rafId = requestAnimationFrame(draw);
    // tab 隐藏时跳过绘制，节省 CPU
    if(document.hidden) return;
    // reduced-motion + 暂停：每 4 帧才更新一次呼吸动画
    var isPlaying = audio && !audio.paused;
    if(!isPlaying){
      if(++pauseFrameSkip < 4) return;
      pauseFrameSkip = 0;
    }
    analyser.getByteFrequencyData(dataArray);
    drawBars(ctxL, canvasL.width, canvasL.height, dataArray, 'left', isPlaying);
    drawBars(ctxR, canvasR.width, canvasR.height, dataArray, 'right', isPlaying);
  }
  draw();
}

// ctx 由调用方传入（已缓存），避免每帧 getContext
function drawBars(ctx, w, h, data, side, isPlaying){
  ctx.clearRect(0, 0, w, h);

  var bars = data.length;
  var slotH = h / bars;
  var lineH = Math.max(1.5, slotH * 0.22); // 细线：约22%槽高，最细1.5px
  var now = isPlaying ? 0 : Date.now();

  // 渐变：从边缘（亮）→ 内侧（淡出）
  var rgb = accentRgb;
  var grad = ctx.createLinearGradient(0, 0, w, 0);
  if(side === 'left'){
    grad.addColorStop(0,    'rgba('+rgb+',0.9)');
    grad.addColorStop(0.45, 'rgba('+rgb+',0.35)');
    grad.addColorStop(1,    'rgba('+rgb+',0)');
  } else {
    grad.addColorStop(0,    'rgba('+rgb+',0)');
    grad.addColorStop(0.55, 'rgba('+rgb+',0.35)');
    grad.addColorStop(1,    'rgba('+rgb+',0.9)');
  }

  // 发光感
  ctx.shadowBlur  = 5;
  ctx.shadowColor = 'rgba('+rgb+',0.55)';
  ctx.fillStyle   = grad;

  for(var i = 0; i < bars; i++){
    var val;
    if(isPlaying){
      val = data[i] / 255;
    } else {
      val = 0.05 + 0.025 * Math.sin(now / 1400 + i * 0.35);
    }
    var barW = val * w * 0.88;
    if(barW < 0.8) barW = 0.8;

    var cy = i * slotH + slotH / 2; // 竖向居中
    var y  = cy - lineH / 2;

    if(side === 'left'){
      ctx.fillRect(0,       y, barW, lineH);
    } else {
      ctx.fillRect(w-barW, y, barW, lineH);
    }
  }

  ctx.shadowBlur = 0; // 重置，避免影响其他绘制
}

/* ---- 顶栏迷你控件 ---- */
function injectMiniPlayer(){
  var topbar = document.querySelector('.topbar');
  if(!topbar) return;
  // 避免重复注入
  if(document.getElementById('zzzMiniPlayer')) return;

  var div = document.createElement('div');
  div.className = 'zzz-mini-player';
  div.id = 'zzzMiniPlayer';
  div.innerHTML =
    '<button class="zzz-mini-prev" aria-label="上一曲">&#9664;&#9664;</button>' +
    '<button class="zzz-mini-play" aria-label="播放/暂停">&#9654;</button>' +
    '<button class="zzz-mini-next" aria-label="下一曲">&#9654;&#9654;</button>' +
    '<div class="zzz-mini-info"><span class="zzz-mini-title">加载中…</span></div>' +
    '<a class="zzz-mini-expand" href="player.html" aria-label="打开播放器">&#9835;</a>';

  topbar.appendChild(div);

  // 绑定事件
  div.querySelector('.zzz-mini-prev').addEventListener('click', function(e){ e.stopPropagation(); prev(); });
  div.querySelector('.zzz-mini-play').addEventListener('click', function(e){ e.stopPropagation(); togglePlay(); });
  div.querySelector('.zzz-mini-next').addEventListener('click', function(e){ e.stopPropagation(); next(); });

  updateMiniTitle();
  updateMiniPlayBtn();
}

function updateMiniTitle(){
  var el = document.querySelector('.zzz-mini-title');
  if(!el) return;
  var track = PLAYLIST[state.trackIndex];
  el.textContent = track ? track.title + ' — ' + track.artist : '无曲目';
}

function updateMiniPlayBtn(){
  var btn = document.querySelector('.zzz-mini-play');
  if(!btn) return;
  btn.innerHTML = (audio && !audio.paused) ? '&#10074;&#10074;' : '&#9654;';
  btn.setAttribute('aria-label', (audio && !audio.paused) ? '暂停' : '播放');
}

/* ---- 主题色同步 ---- */
function updateAccentColor(){
  var cs = getComputedStyle(document.documentElement);
  var signal = cs.getPropertyValue('--signal').trim();
  if(signal){
    // 转为带透明度
    accentColor = signal.startsWith('#') ? hexToRgba(signal, 0.7) : signal;
  } else {
    accentColor = 'rgba(62,199,214,0.7)';
  }
}

function hexToRgba(hex, alpha){
  var r = parseInt(hex.slice(1,3),16);
  var g = parseInt(hex.slice(3,5),16);
  var b = parseInt(hex.slice(5,7),16);
  accentRgb = r+','+g+','+b;
  return 'rgba('+r+','+g+','+b+','+alpha+')';
}

function observeTheme(){
  var observer = new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      if(m.attributeName === 'data-theme'){
        updateAccentColor();
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/* ---- 公共 API ---- */
window.ZZZPlayer = {
  play: play,
  pause: pause,
  togglePlay: togglePlay,
  prev: prev,
  next: next,
  seek: seek,
  setVolume: setVolume,
  getAnalyser: function(){ ensureAudioContext(); return analyser; },
  getAudio: function(){ return audio; },
  getPlaylist: function(){ return PLAYLIST; },
  getState: function(){ return Object.assign({}, state); },
  loadTrack: loadTrack
};

/* ---- 启动 ---- */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
