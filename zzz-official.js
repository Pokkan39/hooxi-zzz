(function(){
  'use strict';
  /* 官方镜像复刻交互层：楼层导航三行编号补全 + 角色页斜切缩略图条 + 琴键邻近缩放。
     遵守 zzz-motion.js 同一套减少动效判定；不接管滚动、不新建轮询。 */
  const reduceMotion=()=>false;
  const isHome=document.body.classList.contains('home-page');
  const isCharacter=document.body.classList.contains('archive-character');

  /* ---------- 首页：楼层导航补三行结构 + 两位编号 ---------- */
  const pad=n=>String(n).padStart(2,'0');
  const FLOOR_NUMS={marquee:'01',finder:'02',agents:'03',reels:'04',sources:'05'};

  const enrichHomeNavs=()=>{
    document.body.classList.add('official-dna');
    document.querySelectorAll('.home-act').forEach(act=>{
      const nav=act.querySelector('.section-nav');
      if(!nav)return;
      const head=act.querySelector('h2,h1');
      const label=(head?.textContent||'').trim();
      const num=FLOOR_NUMS[act.dataset.homeAct]||'';
      if(num&&!nav.querySelector('.section-nav-num')){
        const el=document.createElement('span');
        el.className='section-nav-num';
        el.textContent=num;
        el.setAttribute('aria-hidden','true');
        nav.prepend(el);
      }
      if(label&&!nav.querySelector('.section-nav-label')){
        const el=document.createElement('span');
        el.className='section-nav-label';
        el.textContent=label;
        nav.append(el);
      }
    });
  };

  /* ---------- 17 琴键式邻近缩放（规范 4.7） ---------- */
  /* 悬停卡 scale 1.06，前后邻居各 scale 1.02；
     只写 transform 与 filter，不改宽高，邻居不被推开；
     键盘 focus 同一套邻居规则；减动效下整体关闭。 */
  const initPianoKeys=(selector,scope)=>{
    const cards=[...scope.querySelectorAll(selector)];
    if(cards.length<3)return;
    const dim=()=>{
      cards.forEach(c=>{
        c.classList.remove('is-key-hot','is-key-near');
        c.style.removeProperty('--key-scale');
      });
    };
    const paint=hot=>{
      cards.forEach((c,i)=>{
        const dist=Math.abs(i-hot);
        c.classList.toggle('is-key-hot',dist===0);
        c.classList.toggle('is-key-near',dist===1);
        c.style.setProperty('--key-scale',dist===0?'1.08':dist===1?'1.03':'1');
      });
    };
    cards.forEach((card,i)=>{
      card.classList.add('zzz-key');
      card.addEventListener('pointerenter',()=>{if(!reduceMotion())paint(i);});
      card.addEventListener('focus',()=>{if(!reduceMotion())paint(i);});
    });
    scope.addEventListener('pointerleave',dim);
    scope.addEventListener('focusout',event=>{
      if(!scope.contains(event.relatedTarget))dim();
    });
  };

  /* ---------- 角色页：官方式斜切缩略图条（作用于档案模块 tab 导航） ---------- */
  const initCharacterNav=()=>{
    const nav=document.querySelector('.character-module-nav');
    if(!nav||nav.dataset.zzzOfficialNav==='on')return;
    nav.dataset.zzzOfficialNav='on';
    nav.classList.add('zzz-o-nav');
    [...nav.querySelectorAll('[data-character-nav]')].forEach(tab=>{
      tab.classList.add('zzz-o-nav-item');
      const label=tab.querySelector('span');
      if(label)label.classList.add('zzz-o-nav-label');
    });
  };

  /* ---------- 18 倾斜与高光跟随：图集封面与媒体卡片 ---------- */
  /* card 倾角 ±6deg，高光跟随 pointer；键盘焦点由 CSS :focus-visible 静态高光承担 */
  const initTiltGlare=()=>{
    const content=document.querySelector('#characterContent');
    if(!content||content.dataset.zzzTilt==='on')return;
    content.dataset.zzzTilt='on';
    if(reduceMotion())return;
    const paintGlare=(card,x,y)=>{
      const rect=card.getBoundingClientRect();
      const rx=((y-rect.top)/rect.height-.5)*-8;
      const ry=((x-rect.left)/rect.width-.5)*10;
      card.style.setProperty('--card-rx',`${rx.toFixed(2)}deg`);
      card.style.setProperty('--card-ry',`${ry.toFixed(2)}deg`);
      card.style.setProperty('--glare-x',`${(((x-rect.left)/rect.width)*100).toFixed(1)}%`);
      card.style.setProperty('--glare-y',`${(((y-rect.top)/rect.height)*100).toFixed(1)}%`);
    };
    // 事件委托：内容节点在 boot 后由 character.js 填充，故监听容器而非逐卡绑定
    const tiltSelector='.character-content-card,.wiki-gallery-slide,.character-media-cover';
    content.addEventListener('pointermove',event=>{
      const card=event.target instanceof Element?event.target.closest(tiltSelector):null;
      if(!card)return;
      card.classList.add('zzz-tilt');
      paintGlare(card,event.clientX,event.clientY);
    });
    content.addEventListener('pointerout',event=>{
      const card=event.target instanceof Element?event.target.closest('.zzz-tilt'):null;
      if(!card||card.contains(event.relatedTarget))return;
      ['--card-rx','--card-ry','--glare-x','--glare-y'].forEach(v=>card.style.removeProperty(v));
    });
  };

  /* ---------- 18b 角色页 Hero 多层视差 + 立绘3D倾斜 ---------- */
  /* 三层景深：背景影画(rate 0.18) / 立绘平移+倾斜(rate 0.45) / 文字反向(rate -0.15) */
  const initHeroTilt=()=>{
    const screen=document.querySelector('.character-screen');
    const portrait=document.querySelector('#characterHeroPortrait');
    const artImg=document.querySelector('.d-keyart-image');
    const copy=document.querySelector('.character-hero-copy');
    if(!screen||!portrait)return;
    if(screen.dataset.zzzHeroTilt==='on')return;
    screen.dataset.zzzHeroTilt='on';
    if(reduceMotion())return;
    const gsap=window.gsap;
    if(!gsap)return;
    const PX_X=72,PX_Y=22;
    // 立绘：平移 + 3D 倾斜
    const toRX=gsap.quickTo(portrait,'rotateX',{duration:.65,ease:'power2.out'});
    const toRY=gsap.quickTo(portrait,'rotateY',{duration:.65,ease:'power2.out'});
    const toPX=gsap.quickTo(portrait,'x',{duration:.65,ease:'power2.out',overwrite:'auto'});
    const toPY=gsap.quickTo(portrait,'y',{duration:.65,ease:'power2.out',overwrite:'auto'});
    // 背景影画：最远层，位移最小
    const toAX=artImg?gsap.quickTo(artImg,'x',{duration:.72,ease:'power2.out',overwrite:'auto'}):null;
    const toAY=artImg?gsap.quickTo(artImg,'y',{duration:.72,ease:'power2.out',overwrite:'auto'}):null;
    // 文字：反向最前层
    const toCX=copy?gsap.quickTo(copy,'x',{duration:.55,ease:'power2.out',overwrite:'auto'}):null;
    const toCY=copy?gsap.quickTo(copy,'y',{duration:.55,ease:'power2.out',overwrite:'auto'}):null;
    screen.addEventListener('pointermove',e=>{
      const rect=screen.getBoundingClientRect();
      const nx=((e.clientX-rect.left)/rect.width-.5)*2;
      const ny=((e.clientY-rect.top)/rect.height-.5)*2;
      toRX(ny*-4.5); toRY(nx*7);
      toPX(nx*PX_X*.45); toPY(ny*PX_Y*.45);
      if(toAX){toAX(nx*PX_X*.18); toAY(ny*PX_Y*.18);}
      if(toCX){toCX(nx*PX_X*-.15); toCY(ny*PX_Y*-.15);}
    },{passive:true});
    screen.addEventListener('pointerleave',()=>{
      toRX(0); toRY(0); toPX(0); toPY(0);
      if(toAX){toAX(0); toAY(0);}
      if(toCX){toCX(0); toCY(0);}
    },{passive:true});
  };

  /* ---------- 06 HUD 边框角标：档案模块头部视觉层，不动布局 ---------- */
  const initHudCorners=()=>{
    document.querySelectorAll('.character-module-head').forEach(head=>head.classList.add('zzz-hud-corner'));
  };

  const boot=()=>{
    if(isHome){
      document.body.classList.add('official-chrome');
      enrichHomeNavs();
      const paths=document.querySelector('#homeModules');
      if(paths)initPianoKeys('.path-card',paths);
      const reel=document.querySelector('#homeArchiveReels');
      if(reel)initPianoKeys('.home-reel-card',reel);
      // P3: 精选代理人卡片琴键缩放（动态渲染，需等 DOM 就绪）
      const rail=document.querySelector('#homeAgentRail');
      if(rail){
        const tryAgentKeys=()=>{
          if(rail.querySelector('.home-agent-card'))initPianoKeys('.home-agent-card',rail);
        };
        if(rail.querySelector('.home-agent-card'))tryAgentKeys();
        else if('MutationObserver' in window){
          const obs=new MutationObserver(()=>{
            if(rail.querySelector('.home-agent-card')){obs.disconnect();tryAgentKeys();}
          });
          obs.observe(rail,{childList:true});
        }
      }
    }
    if(isCharacter){
      // character.js 渲染完成后才存在模块与卡片；等内容落位再挂官方导航、06/18
      const content=document.querySelector('#characterContent');
      const apply=()=>{initCharacterNav();initHudCorners();initTiltGlare();initHeroTilt();};
      if(content){
        const observer='MutationObserver' in window?new MutationObserver(()=>{
          if(content.querySelector('.character-module')){observer.disconnect();apply();}
        }):null;
        if(content.querySelector('.character-module'))apply();
        else if(observer)observer.observe(content,{childList:true});
        else apply();
      }else apply();
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
