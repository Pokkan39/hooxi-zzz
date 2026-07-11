const HOOXI_API_BASE_URL="";
const HOOXI_SYNC_INTERVAL=5000;
const HOOXI_CACHE_KEY="hooxi:shared-site-data";

(function(){
  let version=0;
  let updatedAt=null;
  let editing=false;
  let dirty=false;
  let timer=null;
  let loading=false;

  function endpoint(){return HOOXI_API_BASE_URL?`${HOOXI_API_BASE_URL.replace(/\/+$/,'')}/site-data`:''}
  function status(text,state=''){document.querySelectorAll('[data-sync-status]').forEach(el=>{el.textContent=text;el.dataset.state=state})}
  function clone(value){return JSON.parse(JSON.stringify(value))}
  function validData(data){return data&&data.home&&data.home.appearance&&Array.isArray(data.home.cards)&&Array.isArray(data.home.tracks)&&data.archive&&['mainline','stories','behindScenes','events'].every(key=>Array.isArray(data.archive[key]))&&(!('layout' in data)||isPlainObject(data.layout))}
  function isPlainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)}
  function cached(){try{const value=JSON.parse(localStorage.getItem(HOOXI_CACHE_KEY));return validData(value?.data)?value:null}catch{return null}}
  function store(payload){localStorage.setItem(HOOXI_CACHE_KEY,JSON.stringify(payload))}
  function apply(payload,source='remote'){
    if(!validData(payload?.data))return false;
    version=Number(payload.version)||0;
    updatedAt=payload.updatedAt||null;
    store({data:payload.data,version,updatedAt});
    window.dispatchEvent(new CustomEvent('hooxi:data',{detail:{data:clone(payload.data),version,updatedAt,source}}));
    status(version?`已同步 · v${version}`:'使用默认数据','online');
    return true;
  }
  function defaults(){return {home:clone(window.hooxiDefaultConfig),archive:clone(window.archiveData||{}),layout:clone(window.hooxiLayout?.getData?.()||{})}}
  function currentData(){return window.hooxiCollectData?window.hooxiCollectData():defaults()}
  function markDirty(value=true){dirty=value;if(value)status('有未保存修改','dirty')}
  function beginEdit(){editing=true;dirty=false}
  function endEdit(){editing=false}
  function password(){let value=sessionStorage.getItem('hooxiEditPassword');if(value)return value;value=prompt('请输入共享编辑密码');if(value)sessionStorage.setItem('hooxiEditPassword',value);return value||''}
  async function load({quiet=false}={}){
    if(loading)return;
    const url=endpoint();
    if(!url){const saved=cached();if(saved)apply(saved,'cache');else apply({data:defaults(),version:0,updatedAt:null},'default');status('云端 API 待配置','offline');return}
    loading=true;if(!quiet)status('正在连接…','loading');
    try{
      const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const payload=await response.json();
      if(payload.data===null&&Number(payload.version)===0){apply({data:defaults(),version:0,updatedAt:null},'default');status('云端尚未初始化','online')}
      else if(Number(payload.version)>version){
        if(editing&&dirty){status(`云端已有 v${payload.version}，请先保存或重新载入`,'conflict')}
        else apply(payload,'remote');
      }else if(!version)apply(payload,'remote');
    }catch(error){if(!quiet){const saved=cached();if(saved)apply(saved,'cache');status('离线 · 使用本地缓存','offline')}console.warn('Hooxi sync load failed:',error)}finally{loading=false}
  }
  async function save(){
    const url=endpoint();
    if(!url){status('未配置云端 API，无法共享保存','offline');throw new Error('云端 API 尚未配置')}
    const secret=password();if(!secret)throw new Error('需要共享编辑密码');
    status('正在保存…','loading');
    const response=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json','X-Edit-Password':secret},body:JSON.stringify({expectedVersion:version,data:currentData()})});
    const payload=await response.json().catch(()=>({}));
    if(response.status===401){sessionStorage.removeItem('hooxiEditPassword');status('编辑密码错误','error');throw new Error('共享编辑密码错误')}
    if(response.status===409){status(`版本冲突 · 云端已是 v${payload.version}`,'conflict');throw new Error('云端已有新版本，请重新载入后再编辑')}
    if(!response.ok)throw new Error(payload.message||`保存失败（${response.status}）`);
    dirty=false;apply(payload,'saved');return payload;
  }
  function reload(){dirty=false;editing=false;version=0;return load()}
  window.HooxiSync={load,save,reload,markDirty,beginEdit,endEdit,getVersion:()=>version,getUpdatedAt:()=>updatedAt};
  document.addEventListener('DOMContentLoaded',()=>{load();timer=setInterval(()=>load({quiet:true}),HOOXI_SYNC_INTERVAL)});
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue=''}});
})();
