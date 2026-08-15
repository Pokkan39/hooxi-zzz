(function(){
  'use strict';
  const tracks=[
  {
    "id": "ogg-9d408739ff",
    "name": "阿兰 _ 三Z-STUDIO _ HOYO-MiX - 一颗方糖悬滞的时间.ogg",
    "url": "assets/audio/阿兰 _ 三Z-STUDIO _ HOYO-MiX - 一颗方糖悬滞的时间.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-ab3b211f93",
    "name": "宫阁 _ 三Z-STUDIO _ HOYO-MiX - My Curse, My Fate (Destin et malédiction).ogg",
    "url": "assets/audio/宫阁 _ 三Z-STUDIO _ HOYO-MiX - My Curse, My Fate (Destin et malédiction).ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-d7b42823c4",
    "name": "金玟岐 _ 三Z-STUDIO _ HOYO-MiX - 红透晚烟青.ogg",
    "url": "assets/audio/金玟岐 _ 三Z-STUDIO _ HOYO-MiX - 红透晚烟青.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-3bb662e6d5",
    "name": "三Z-STUDIO _ HOYO-MiX _ 黄美珍 - 千万次初见.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX _ 黄美珍 - 千万次初见.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-c1cc0ed44a",
    "name": "三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 乐园游梦记.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 乐园游梦记.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-c3c1d15804",
    "name": "三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 闪亮.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 闪亮.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-29270291c1",
    "name": "三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 原色.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX _ 于梓贝 - 原色.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-3aa5f8b526",
    "name": "三Z-STUDIO _ HOYO-MiX _ Alaina Cross - FURYON 狂怒觉醒.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX _ Alaina Cross - FURYON 狂怒觉醒.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-aab87bd7ad",
    "name": "三Z-STUDIO _ HOYO-MiX _ Ashley Alisha - Tiny Giant 小巨星.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX _ Ashley Alisha - Tiny Giant 小巨星.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-b09df73c1f",
    "name": "三Z-STUDIO _ HOYO-MiX - 60%的日常.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-e9514c601f",
    "name": "三Z-STUDIO _ HOYO-MiX - 60%的日常·悠闲.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常·悠闲.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-473ae69d3f",
    "name": "三Z-STUDIO _ HOYO-MiX - 60%的日常·自由.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常·自由.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-2ba15c1c4b",
    "name": "三Z-STUDIO _ HOYO-MiX - 60%的日常·自由(1).ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的日常·自由(1).ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-494cb5d094",
    "name": "三Z-STUDIO _ HOYO-MiX - 60%的遐想.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-7bad2681fe",
    "name": "三Z-STUDIO _ HOYO-MiX - 60%的遐想·静谧.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想·静谧.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-762b86b411",
    "name": "三Z-STUDIO _ HOYO-MiX - 60%的遐想·静谧(1).ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想·静谧(1).ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-181fc95b1a",
    "name": "三Z-STUDIO _ HOYO-MiX - 60%的遐想·热情.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 60%的遐想·热情.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-f889633903",
    "name": "三Z-STUDIO _ HOYO-MiX - 把心跳变成节奏.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 把心跳变成节奏.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-7d7a6935f5",
    "name": "三Z-STUDIO _ HOYO-MiX - 澄空映辉.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 澄空映辉.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-3b6877ff17",
    "name": "三Z-STUDIO _ HOYO-MiX - 当群星交汇 (Feat_耀嘉音).ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 当群星交汇 (Feat_耀嘉音).ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-5f5e65ac29",
    "name": "三Z-STUDIO _ HOYO-MiX - 繁星数载.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 繁星数载.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-aa25c9a7e4",
    "name": "三Z-STUDIO _ HOYO-MiX - 绘本.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 绘本.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-18b1fb4b0b",
    "name": "三Z-STUDIO _ HOYO-MiX - 乐园梦游计.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 乐园梦游计.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-fff79bc3a3",
    "name": "三Z-STUDIO _ HOYO-MiX - 流光夜巷.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 流光夜巷.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-17cb4b787d",
    "name": "三Z-STUDIO _ HOYO-MiX - 天使ロード中…^_−☆.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 天使ロード中…^_−☆.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-58e4878f8b",
    "name": "三Z-STUDIO _ HOYO-MiX - 妄想色心跳.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 妄想色心跳.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-e363e3882e",
    "name": "三Z-STUDIO _ HOYO-MiX - 问.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 问.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-9f61c012a9",
    "name": "三Z-STUDIO _ HOYO-MiX - 午晴闲闻.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 午晴闲闻.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-f0310f4d48",
    "name": "三Z-STUDIO _ HOYO-MiX - 小停再出发.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 小停再出发.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-146df74ee1",
    "name": "三Z-STUDIO _ HOYO-MiX - 晓.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - 晓.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-752c8a1abc",
    "name": "三Z-STUDIO _ HOYO-MiX - Billy Mode.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - Billy Mode.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-12ac233eb6",
    "name": "三Z-STUDIO _ HOYO-MiX - Burning Desires 绝望吧台.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - Burning Desires 绝望吧台.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-d7c2c7d76e",
    "name": "三Z-STUDIO _ HOYO-MiX - chaos_exe.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - chaos_exe.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-73e767c15d",
    "name": "三Z-STUDIO _ HOYO-MiX - Fearless 无所畏惧.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - Fearless 无所畏惧.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-482e1ffc2f",
    "name": "三Z-STUDIO _ HOYO-MiX - ReDreaming Angel 复梦天使.ogg",
    "url": "assets/audio/三Z-STUDIO _ HOYO-MiX - ReDreaming Angel 复梦天使.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-b3c1087aa4",
    "name": "苏诗丁 _ 三Z-STUDIO _ HOYO-MiX - 不及.ogg",
    "url": "assets/audio/苏诗丁 _ 三Z-STUDIO _ HOYO-MiX - 不及.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-fa5b780b0a",
    "name": "ChiliChill乐团 _ 三Z-STUDIO _ HOYO-MiX - pinKing.ogg",
    "url": "assets/audio/ChiliChill乐团 _ 三Z-STUDIO _ HOYO-MiX - pinKing.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-0719c91436",
    "name": "hanser _ 三Z-STUDIO _ HOYO-MiX - 食通万物 修心修身.ogg",
    "url": "assets/audio/hanser _ 三Z-STUDIO _ HOYO-MiX - 食通万物 修心修身.ogg",
    "mime": "audio/ogg"
  },
  {
    "id": "ogg-166c75ba0b",
    "name": "Sihan _ 三Z-STUDIO _ HOYO-MiX - DAMIDAMI.ogg",
    "url": "assets/audio/Sihan _ 三Z-STUDIO _ HOYO-MiX - DAMIDAMI.ogg",
    "mime": "audio/ogg"
  }
];
  const clone=()=>tracks.map(track=>({...track}));
  const normalizeTrack=(value,index=0)=>{
    const item=value&&typeof value==='object'?value:{};
    const url=String(item.url||'').trim();
    const name=String(item.name||item.title||url.split('/').pop()||`曲目 ${index+1}`).trim();
    if(!url)return null;
    const id=String(item.id||'legacy-'+index+'-'+url).trim();
    return {id,name,url,mime:String(item.mime||'audio/ogg'),...(item.local?{local:true}:{})};
  };
  const normalizeTracks=(list)=>Array.isArray(list)?list.map(normalizeTrack).filter(Boolean):[];
  window.__hooxiAudioCatalog=Object.freeze({tracks:Object.freeze(tracks.map(track=>Object.freeze({...track}))),getTracks:clone,normalizeTrack,normalizeTracks});
})();
