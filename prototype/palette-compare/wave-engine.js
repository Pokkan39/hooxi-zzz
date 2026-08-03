/* wave-engine.js —— 隐藏播放引擎。
   提供：单一 <audio>、播放/暂停/上下曲/音量/播放模式、
   Web Audio Analyser 频谱数据（供两侧竖排 Canvas 消费）。
   完全独立：不读 DOM、不依赖 app.js/existing cassette。 */
(function () {
  'use strict';

  /* 复用恢复的歌单 */
  var TRACKS = [
    { name: 'pinKing', url: '../../assets/audio/ChiliChill乐团 _ 三Z-STUDIO _ HOYO-MiX - pinKing.ogg' },
    { name: '食通万物', url: '../../assets/audio/hanser _ 三Z-STUDIO _ HOYO-MiX - 食通万物 修心修身.ogg' },
    { name: 'AIZO', url: '../../assets/audio/King Gnu - AIZO.ogg' },
    { name: 'DAMIDAMI', url: '../../assets/audio/Sihan _ 三Z-STUDIO _ HOYO-MiX - DAMIDAMI.ogg' },
    { name: '60%的日常', url: '../../assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常.ogg' },
    { name: 'Billy Mode', url: '../../assets/audio/三Z-STUDIO _ HOYO-MiX - Billy Mode.ogg' },
    { name: '绝望吧台', url: '../../assets/audio/三Z-STUDIO _ HOYO-MiX - Burning Desires 绝望吧台.ogg' },
    { name: 'Fearless', url: '../../assets/audio/三Z-STUDIO _ HOYO-MiX - Fearless 无所畏惧.ogg' },
    { name: '晓', url: '../../assets/audio/三Z-STUDIO _ HOYO-MiX - 晓.ogg' },
    { name: '流光夜巷', url: '../../assets/audio/三Z-STUDIO _ HOYO-MiX - 流光夜巷.ogg' },
    { name: '问', url: '../../assets/audio/三Z-STUDIO _ HOYO-MiX - 问.ogg' },
    { name: 'FURYON', url: '../../assets/audio/三Z-STUDIO _ HOYO-MiX _ Alaina Cross - FURYON 狂怒觉醒.ogg' }
  ];

  var LS_KEY = 'hooxiWaveState';

  function loadState() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
  }

  var saved = loadState();
  var state = {
    idx: Math.min(TRACKS.length - 1, Math.max(0, saved.idx || 0)),
    time: saved.t || 0,
    vol: typeof saved.v === 'number' ? Math.min(1, Math.max(0, saved.v)) : 0.25,
    mode: saved.mode || 'order'   // order | random | single
  };

  /* ---- audio element ---- */
  var audio = new Audio();
  audio.preload = 'none';
  audio.volume = state.vol;
  audio.src = TRACKS[state.idx].url;

  /* ---- Web Audio (lazy, 仅用户手势后) ---- */
  var ac = null, analyser = null, srcNode = null;
  var freqData = null;

  function ensureAudioContext() {
    if (ac) return true;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    ac = new Ctx();
    analyser = ac.createAnalyser();
    analyser.fftSize = 256;                 // 128 bins
    analyser.smoothingTimeConstant = 0.8;
    srcNode = ac.createMediaElementSource(audio);
    srcNode.connect(analyser);
    analyser.connect(ac.destination);
    freqData = new Uint8Array(analyser.frequencyBinCount);
    return true;
  }

  function resumeAC() {
    if (ac && ac.state === 'suspended') ac.resume();
  }

  /* ---- 核心操作 ---- */
  function load(i, autoplay) {
    state.idx = (i + TRACKS.length) % TRACKS.length;
    var t = TRACKS[state.idx];
    audio.src = t.url;
    state.time = 0;
    emit('track');
    if (autoplay) play();
    else save();
  }

  function play() {
    if (!ensureAudioContext()) { /* 无 AudioContext 时退化为无可视化播放 */ }
    resumeAC();
    var p = audio.play();
    if (p && p.catch) p.catch(function () {});
  }

  function pause() { audio.pause(); }

  function toggle() {
    if (audio.paused) play(); else pause();
  }

  function next(dir) {
    dir = dir || 1;
    var n;
    if (state.mode === 'random' && TRACKS.length > 1) {
      do { n = Math.floor(Math.random() * TRACKS.length); } while (n === state.idx);
    } else {
      n = (state.idx + dir + TRACKS.length) % TRACKS.length;
    }
    load(n, !audio.paused);
  }

  function cycleMode() {
    var modes = ['order', 'random', 'single'];
    state.mode = modes[(modes.indexOf(state.mode) + 1) % modes.length];
    save();
    emit('mode');
    return state.mode;
  }

  function setVolume(v) {
    v = Math.min(1, Math.max(0, Number(v) || 0));
    audio.volume = v;
    state.vol = v;
    save();
    emit('volume');
  }

  /* 进度 0..1 */
  function progress() {
    var d = audio.duration;
    return (d && isFinite(d) && d > 0) ? audio.currentTime / d : 0;
  }

  /* 频谱字节数组（0-255）；未播放时返回全 0 */
  function spectrum() {
    if (!analyser || !freqData) return null;
    analyser.getByteFrequencyData(freqData);
    return freqData;
  }

  /* ---- 轻量事件 ---- */
  var listeners = {};
  function on(ev, cb) {
    (listeners[ev] = listeners[ev] || []).push(cb);
  }
  function emit(ev) {
    (listeners[ev] || []).forEach(function (cb) { cb(); });
  }

  audio.addEventListener('play',  function () { emit('state'); save(); });
  audio.addEventListener('pause', function () { emit('state'); save(); });
  audio.addEventListener('ended', function () {
    if (state.mode === 'single') { audio.currentTime = 0; play(); }
    else next(1);
  });
  audio.addEventListener('timeupdate', function () { emit('time'); });

  /* 恢复历史播放进度（仅 seek，不自动起播） */
  if (state.time > 1) {
    audio.addEventListener('loadedmetadata', function seekOnce() {
      audio.removeEventListener('loadedmetadata', seekOnce);
      if (state.time < audio.duration - 1) audio.currentTime = state.time;
    });
  }

  function save() {
    saveState({
      idx: state.idx, t: audio.currentTime || 0,
      v: state.vol, mode: state.mode
    });
  }
  window.addEventListener('pagehide', save);

  /* ---- 公开 ---- */
  window.waveEngine = {
    tracks: TRACKS,
    audio: audio,
    state: function () { return state; },
    current: function () { return TRACKS[state.idx]; },
    playing: function () { return !audio.paused && !audio.ended; },
    play: play, pause: pause, toggle: toggle, next: next,
    cycleMode: cycleMode, setVolume: setVolume,
    progress: progress, spectrum: spectrum,
    on: on
  };
})();
