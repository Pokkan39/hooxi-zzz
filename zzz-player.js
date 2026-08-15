(function(){
  'use strict';
  if(window.__hooxiPlayer)return;

  const catalog=window.__hooxiAudioCatalog;
  const stateKey='hooxiAudioSession';
  const modeLabels={order:'顺序',random:'随机',single:'单曲循环'};
  const modeAria={order:'播放模式：顺序播放',random:'播放模式：随机播放',single:'播放模式：单曲循环'};
  const qs=(selector,root=document)=>root.querySelector(selector);
  const safeText=value=>String(value??'').trim();
  const cloneCatalog=()=>catalog?.getTracks?.()||[];
  const normalizeTrack=(value,index)=>catalog?.normalizeTrack?.(value,index)||({
    id:String(value?.id||`legacy-${index}`),name:safeText(value?.name||value?.title||`曲目 ${index+1}`),url:safeText(value?.url),mime:safeText(value?.mime||'audio/ogg'),...(value?.local?{local:true}:{}),
  });
  const normalizeTracks=list=>Array.isArray(list)?list.map(normalizeTrack).filter(track=>track.url):[];
  const readSession=()=>{try{return JSON.parse(sessionStorage.getItem(stateKey)||'null')}catch{return null}};
  const writeSession=()=>{try{const track=tracks[index];sessionStorage.setItem(stateKey,JSON.stringify({trackId:track?.id||'',index,currentTime:Number.isFinite(audio?.currentTime)?audio.currentTime:0,volume:audio?.volume??volume,muted:!!audio?.muted,mode}))}catch{}};
  const readLocal=key=>{try{return localStorage.getItem(key)}catch{return null}};
  const writeLocal=(key,value)=>{try{localStorage.setItem(key,String(value))}catch{}};
  const dispatch=(name,detail={})=>window.dispatchEvent(new CustomEvent(`hooxi-player-${name}`,{detail}));


  let tracks=[];
  let index=0;
  let mode='order';
  let volume=.25;
  let restoredTime=0;
  let restoredMuted=false;
  let audio=null;
  let host=null;
  let status=null;
  let download=null;
  let seek=null;
  let mute=null;
  let playlist=null;
  let bound=false;

  function resolveTracks(){
    const configured=normalizeTracks(window.hooxiZZZConfig?.tracks).filter(track=>!track.url.startsWith('blob:'));
    if(configured.length)return configured;
    try{
      const saved=JSON.parse(localStorage.getItem('hooxiZZZConfig')||'null');
      const stored=normalizeTracks(saved?.tracks).filter(track=>!track.url.startsWith('blob:'));
      if(stored.length)return stored;
    }catch{}
    return cloneCatalog();
  }
  function readPrefs(){
    const saved=readSession();
    const localVolume=Number.parseFloat(readLocal('hooxiVolume'));
    volume=Number.isFinite(localVolume)?Math.min(1,Math.max(0,localVolume)):Number.isFinite(saved?.volume)?Math.min(1,Math.max(0,saved.volume)):.25;
    const storedMode=readLocal('hooxiPlayMode');
    mode=['order','random','single'].includes(storedMode)?storedMode:(['order','random','single'].includes(saved?.mode)?saved.mode:'order');
    const wantedId=safeText(saved?.trackId);
    const wantedIndex=Number.isInteger(saved?.index)?saved.index:0;
    index=Math.max(0,Math.min(wantedId?Math.max(0,tracks.findIndex(track=>track.id===wantedId)):wantedIndex,Math.max(0,tracks.length-1)));
    restoredTime=Number.isFinite(saved?.currentTime)&&saved.currentTime>0?saved.currentTime:0;
    restoredMuted=!!saved?.muted;
  }
  function createHost(){
    host=document.getElementById('musicPlayer');
    if(host){
      host.classList.add('zzz-player');
      return host;
    }
    host=document.createElement('section');
    host.id='musicPlayer';
    host.className='zzz-player';
    host.setAttribute('aria-label','音乐播放器');
    host.innerHTML='<div class="zzz-player-shell"><div class="zzz-player-head"><span class="zzz-player-kicker">HOOXI AUDIO // LOCAL OGG</span><strong data-zzz-track-name>未选择音乐</strong><span class="zzz-player-state" id="zzzPlayerStatus" role="status" aria-live="polite">待机：点击播放后加载音频</span></div><div class="zzz-player-controls"><button id="musicToggle" type="button" class="zzz-player-button zzz-player-play" aria-label="播放音乐" aria-pressed="false">▶</button><button id="prevTrack" type="button" class="zzz-player-button" aria-label="上一首" title="上一首">◀</button><button id="nextTrack" type="button" class="zzz-player-button" aria-label="下一首" title="下一首">▶</button><button id="playMode" type="button" class="zzz-player-button" aria-label="播放模式：顺序播放" title="播放模式：顺序播放">顺序</button><button id="zzzMute" type="button" class="zzz-player-button" aria-label="静音" aria-pressed="false">静音</button><label class="zzz-player-volume"><span>音量</span><input id="volume" type="range" min="0" max="1" step=".05" value=".25" aria-label="音量"/></label><button id="playlistOpen" type="button" class="zzz-player-button" aria-expanded="false" aria-controls="playlist">歌单</button></div><div class="zzz-player-progress"><span id="zzzTimeNow" aria-live="off">0:00</span><input id="zzzSeek" type="range" min="0" max="1000" value="0" step="1" aria-label="播放进度" aria-valuetext="0:00 / 0:00"/><span id="zzzTimeEnd">0:00</span></div><div class="zzz-player-actions"><a id="zzzPlayerDownload" href="#" download class="zzz-player-download" hidden>下载 OGG</a><button id="zzzPlayerRetry" type="button" class="zzz-player-button" hidden>重试</button></div><div id="playlist" class="zzz-player-playlist" hidden><strong>播放列表</strong><div id="playlistItems"></div></div><audio id="audio" preload="none"></audio><canvas class="zzz-waveform" id="zzzWaveform" width="320" height="48" aria-hidden="true"></canvas></div>';
    const footer=document.querySelector('footer');
    if(footer?.parentNode)footer.parentNode.insertBefore(host,footer);
    else document.body.appendChild(host);
    return host;
  }
  function ensureHomeMarkup(){
    host.classList.add('zzz-player');
    const body=qs('.music-player-body',host)||host;
    audio=qs('#audio',host)||document.createElement('audio');
    if(!audio.id){audio.id='audio';body.appendChild(audio)}
    audio.preload='none';
    if(!qs('#zzzPlayerStatus',host)){body.insertAdjacentHTML('beforeend','<span class="zzz-player-state" id="zzzPlayerStatus" role="status" aria-live="polite">待机：点击播放后加载音频</span>')}
    if(!qs('#zzzMute',host))body.insertAdjacentHTML('beforeend','<button id="zzzMute" type="button" class="zzz-player-button" aria-label="静音" aria-pressed="false">静音</button>');
    if(!qs('#zzzSeek',host))body.insertAdjacentHTML('beforeend','<div class="zzz-player-progress"><span id="zzzTimeNow">0:00</span><input id="zzzSeek" type="range" min="0" max="1000" value="0" step="1" aria-label="播放进度" aria-valuetext="0:00 / 0:00"/><span id="zzzTimeEnd">0:00</span></div>');
    if(!qs('#zzzPlayerDownload',host))body.insertAdjacentHTML('beforeend','<div class="zzz-player-actions"><a id="zzzPlayerDownload" href="#" download class="zzz-player-download" hidden>下载 OGG</a><button id="zzzPlayerRetry" type="button" class="zzz-player-button" hidden>重试</button></div>');
    if(!qs('#zzzWaveform',host))body.insertAdjacentHTML('beforeend','<canvas class="zzz-waveform" id="zzzWaveform" width="320" height="48" aria-hidden="true"></canvas>');
    playlist=qs('#playlist',host)||null;
  }
  function setup(){
    host=createHost();
    if(!host.querySelector('.zzz-player-shell'))ensureHomeMarkup();
    audio=qs('#audio',host)||document.getElementById('audio');
    status=qs('#zzzPlayerStatus',host);download=qs('#zzzPlayerDownload',host);seek=qs('#zzzSeek',host);mute=qs('#zzzMute',host);playlist=qs('#playlist',host);
    tracks=resolveTracks();
    readPrefs();
    audio.volume=volume;
    audio.muted=restoredMuted;
    if(playlist){playlist.hidden=true;playlist.classList.add('hidden')}
    bind();
    render();
  }
  function name(){return tracks[index]?.name||'未选择音乐'}
  function clock(value){const n=Math.max(0,Math.floor(Number(value)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}
  function setStatus(text,kind='idle'){if(!status)return;status.textContent=text;status.dataset.state=kind}
  function render(){
    const track=tracks[index];
    host.dataset.mode=mode;
    host.dataset.state=audio?.paused?'paused':'playing';
    host.querySelectorAll('[data-zzz-track-name],#trackName,#cassetteTrackName').forEach(el=>{el.textContent=name()});
    const modeButton=qs('#playMode',host);if(modeButton){modeButton.textContent=modeLabels[mode];modeButton.title=modeAria[mode];modeButton.setAttribute('aria-label',modeAria[mode])}
    if(audio){audio.volume=volume;audio.muted=!!audio.muted}
    const volumeInput=qs('#volume',host);if(volumeInput)volumeInput.value=String(audio?.volume??volume);
    if(mute){mute.textContent=audio?.muted?'取消静音':'静音';mute.setAttribute('aria-pressed',String(!!audio?.muted));mute.setAttribute('aria-label',audio?.muted?'取消静音':'静音')}
    const playButton=qs('#musicToggle',host);if(playButton){const playing=!!audio&&!audio.paused&&!audio.ended;playButton.textContent=playing?'❚❚':'▶';playButton.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');playButton.setAttribute('aria-pressed',String(playing))}
    if(download){download.hidden=!track?.url;download.href=track?.url||'#';download.download=track?.name||'audio.ogg'}
    const items=qs('#playlistItems',host);if(items){items.innerHTML=tracks.map((item,i)=>`<button type="button" class="playlist-item ${i===index?'selected':''}" data-zzz-play-index="${i}" aria-current="${i===index?'true':'false'}"><span>${String(i+1).padStart(2,'0')}</span><b>${item.name}</b></button>`).join('')}
    updateTime();dispatch('trackchange',{track,index,mode});
  }
  function updateTime(){
    const duration=Number.isFinite(audio?.duration)?audio.duration:0;const current=Number.isFinite(audio?.currentTime)?audio.currentTime:0;
    const now=qs('#zzzTimeNow',host),end=qs('#zzzTimeEnd',host);if(now)now.textContent=clock(current);if(end)end.textContent=clock(duration);
    if(seek&&!seek.matches(':active'))seek.value=String(duration>0?Math.round(current/duration*1000):0);
    if(seek)seek.setAttribute('aria-valuetext',`${clock(current)} / ${clock(duration)}`);
    dispatch('timechange',{currentTime:current,duration});
  }
  function loadTrack(nextIndex,{autoplay=false,seekTo=0}={}){
    if(!tracks.length){setStatus('不支持：没有可用本地音频','error');return Promise.resolve(false)}
    index=(nextIndex+tracks.length)%tracks.length;const track=tracks[index];
    restoredTime=seekTo||0;audio.pause();audio.removeAttribute('src');audio.load();
    audio.src=track.url;audio.load();setStatus('加载中…','loading');render();
    if(!autoplay)return Promise.resolve(true);
    return playLoaded();
  }
  function playLoaded(){
    const promise=audio.play();
    return Promise.resolve(promise).then(()=>{setStatus('播放中','playing');dispatch('playstatechange',{playing:true});return true}).catch(error=>{setStatus(error?.name==='NotAllowedError'?'需要用户手势才能播放':'音频加载失败，请检查 OGG 文件','error');if(download)download.hidden=false;dispatch('error',{error});return false})
  }
  function play(){
    if(!audio.src)return loadTrack(index,{autoplay:true,seekTo:restoredTime});
    return playLoaded();
  }
  function pause(){audio.pause();setStatus('已暂停','paused');writeSession();dispatch('playstatechange',{playing:false});return true}
  function toggle(){return audio.paused?play():pause()}
  function choose(nextIndex,autoplay= !audio.paused){writeSession();return loadTrack(nextIndex,{autoplay,seekTo:0})}
  function next(direction=1){if(!tracks.length)return Promise.resolve(false);let nextIndex;if(mode==='random'&&tracks.length>1){do{nextIndex=Math.floor(Math.random()*tracks.length)}while(nextIndex===index)}else nextIndex=(index+direction+tracks.length)%tracks.length;return choose(nextIndex,!audio.paused)}
  function setPlaylistOpen(open){
    if(!playlist)return;
    playlist.hidden=!open;
    playlist.classList.toggle('hidden',!open);
    qs('#playlistOpen',host)?.setAttribute('aria-expanded',String(open));
  }
  function bind(){
    if(bound)return;bound=true;
    qs('#musicToggle',host)?.addEventListener('click',toggle);qs('#prevTrack',host)?.addEventListener('click',()=>choose(index-1,!audio||!audio.paused));qs('#nextTrack',host)?.addEventListener('click',()=>choose(index+1,!audio||!audio.paused));qs('#playMode',host)?.addEventListener('click',()=>{mode=mode==='order'?'random':mode==='random'?'single':'order';writeLocal('hooxiPlayMode',mode);render();writeSession()});
    qs('#cassetteToggle')?.addEventListener('click',toggle);qs('#cassettePrev')?.addEventListener('click',()=>choose(index-1,!audio.paused));qs('#cassetteNext')?.addEventListener('click',()=>choose(index+1,!audio.paused));qs('#cassetteMode')?.addEventListener('click',()=>{qs('#playMode',host)?.click()});
    qs('#volume',host)?.addEventListener('input',event=>{volume=Math.min(1,Math.max(0,Number(event.target.value)||0));audio.volume=volume;writeLocal('hooxiVolume',volume);dispatch('volumechange',{volume,muted:audio.muted});writeSession()});
    mute?.addEventListener('click',()=>{audio.muted=!audio.muted;dispatch('volumechange',{volume:audio.volume,muted:audio.muted});render();writeSession()});
    seek?.addEventListener('change',()=>{if(Number.isFinite(audio.duration)&&audio.duration>0){try{audio.currentTime=audio.duration*(Number(seek.value)/1000)}catch{setStatus('当前音频不可定位','error')}}updateTime();writeSession()});
    qs('#playlistOpen',host)?.addEventListener('click',()=>setPlaylistOpen(playlist?.hidden!==false));
    qs('#zzzPlayerRetry',host)?.addEventListener('click',()=>loadTrack(index,{autoplay:true,seekTo:audio.currentTime||0}));
    host.addEventListener('click',event=>{const item=event.target.closest('[data-zzz-play-index]');if(item)choose(Number(item.dataset.zzzPlayIndex),true)});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&playlist&&!playlist.hidden)setPlaylistOpen(false)});
    audio.addEventListener('loadedmetadata',()=>{if(restoredTime>0&&Number.isFinite(audio.duration)&&audio.duration>restoredTime){try{audio.currentTime=restoredTime}catch{}}restoredTime=0;setStatus('就绪：点击播放','ready');updateTime()});
    audio.addEventListener('timeupdate',updateTime);audio.addEventListener('durationchange',updateTime);
    audio.addEventListener('play',()=>{setStatus('播放中','playing');render();dispatch('playstatechange',{playing:true})});audio.addEventListener('pause',()=>{if(!audio.ended)setStatus('已暂停','paused');render();writeSession();dispatch('playstatechange',{playing:false})});
    audio.addEventListener('ended',()=>{writeSession();if(mode==='single')choose(index,true);else next(1)});
    audio.addEventListener('error',()=>{setStatus('错误：无法加载此 OGG','error');if(download)download.hidden=false;qs('#zzzPlayerRetry',host)?.removeAttribute('hidden');dispatch('error',{error:audio.error})});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){writeSession();dispatch('visibilitychange',{visible:false})}});window.addEventListener('pagehide',writeSession);window.addEventListener('beforeunload',writeSession);
  }
  function refreshTracks(){tracks=resolveTracks();index=Math.min(index,Math.max(0,tracks.length-1));render()}
  window.__hooxiPlayer={get audio(){return audio},get tracks(){return tracks.map(track=>({...track}))},get index(){return index},get mode(){return mode},getState:()=>({trackId:tracks[index]?.id||'',index,currentTime:audio?.currentTime||0,volume:audio?.volume??volume,muted:!!audio?.muted,mode,playing:!!audio&&!audio.paused}),play,pause,toggle,next,prev:()=>next(-1),selectTrack:(i,autoplay=true)=>choose(i,autoplay),setMode:value=>{if(modeLabels[value]){mode=value;writeLocal('hooxiPlayMode',mode);render();writeSession()}},setVolume:value=>{volume=Math.min(1,Math.max(0,Number(value)||0));audio.volume=volume;writeLocal('hooxiVolume',volume);render();writeSession()},setMuted:value=>{audio.muted=!!value;render();writeSession()},refreshTracks,render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
