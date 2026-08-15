(()=>{
  const snapshotDate='2026-07-29';
  const remielleWikiUrl='https://baike.mihoyo.com/zzz/wiki/content/2076/detail?mhy_presentation_style=fullscreen';
  const sourceLinks={
    official:'https://zenless.hoyoverse.com/',
    wiki:'https://baike.mihoyo.com/zzz/wiki/',
    prydwen:'https://www.prydwen.gg/zenless/characters'
  };
  const factionBlurbs={
    'cunning-hares':'以六分街为据点的万事屋，承接各类空洞相关委托，也是绳匠最早并肩行动的伙伴。',
    'belobog':'专注工程与空洞作业的重工企业，以机械、体能与火线突击见长。',
    'victoria-housekeeping':'看似优雅的家政团队，实际擅长清理高危目标与维持都市暗面秩序。',
    'sons-of-calydon':'驰骋外环的摩托帮，重视义气、自由与当面说清的规矩。',
    'section-6':'对空洞特别行动部第六课，负责特殊威胁研判与高优先级空洞任务。',
    'criminal-investigation-srt':'刑侦特勤相关队伍，在都市案件与异常事件一线取证作战。',
    'obol-squad':'防卫军序列中的精锐小队，执行高强度战术行动。',
    'stars-of-lyra':'以演出与经纪事务为表层身份的协作阵营，成员风格鲜明。',
    'mockingbird':'游走在都市暗面的搭档组合，行动风格狡黠且目标明确。',
    'yunkui-summit':'云岿山一脉，功法与门派传承并重，处事自有章法。',
    'spook-shack':'怪啖屋相关代理人集结地，风格灵异、幽默，任务往往出人意料。',
    'krampus-compliance-authority':'负责合规与惩戒执行的黑枝序列，行动冷静而直接。',
    'angels-of-delusion':'新兴偶像与执行一体的组合，表层是舞台，里层是委托。',
    'metropolitan-order-division':'都市秩序相关编制，关注街头秩序与异常事件处置。',
    'defense-force-silver-squad':'防卫军白银小队，保留军旅痕迹与高强度训练背景。',
    'external-strategy-department':'外务筹策相关编制，偏重情报、协调与特殊勤务。',
    'phaethon':'绳匠「法厄同」一侧的档案入口，串联录像店与城市委托线。',
    'covenant-of-dayat':'达识结社名称及蕾米埃尔·丹的成员关系由其官方角色百科页确认；独立阵营资料待官方公布。'
  };
  const factionLogos={
    'cunning-hares':'assets/icons/cunning-hares.png',
    'victoria-housekeeping':'assets/icons/victoria-housekeeping.png',
    'belobog':'assets/icons/belobog.png',
    'sons-of-calydon':'assets/icons/sons-of-calydon.png',
    'section-6':'assets/icons/section-6.png',
    'criminal-investigation-srt':'assets/icons/criminal-investigation-srt.png',
    'obol-squad':'assets/icons/obol-squad.png',
    'stars-of-lyra':'assets/icons/stars-of-lyra.png',
    'mockingbird':'assets/icons/mockingbird.png',
    'yunkui-summit':'assets/icons/yunkui-summit.png',
    'spook-shack':'assets/icons/spook-shack.png',
    'krampus-compliance-authority':'assets/icons/krampus-compliance-authority.png',
    'angels-of-delusion':'assets/icons/angels-of-delusion.png',
    'metropolitan-order-division':'assets/icons/metropolitan-order-division.png',
    'defense-force-silver-squad':'assets/icons/defense-force-silver-squad.png',
    'external-strategy-department':'assets/icons/external-strategy-department.png',
    'phaethon':'assets/icons/phaethon.png',
    'covenant-of-dayat':'assets/icons/covenant-of-dayat.png'
  };
  const factions=[
    ['cunning-hares','狡兔屋','#f3d33b'],['belobog','白祇重工','#ef6e3a'],['victoria-housekeeping','维多利亚家政','#bfc9dc'],['sons-of-calydon','卡吕冬之子','#e65031'],['section-6','对空洞特别行动部第六课','#65bce8'],['criminal-investigation-srt','刑侦特勤组','#3aaad8'],['obol-squad','奥波勒斯小队','#db3848'],['stars-of-lyra','天琴座','#f6a3cc'],['mockingbird','「反舌鸟」','#8169c7'],['yunkui-summit','云岿山','#d9b553'],['spook-shack','怪啖屋','#6bb68d'],['krampus-compliance-authority','「坎卜斯黑枝」','#a55555'],['angels-of-delusion','「妄想天使」','#ef8fc0'],['metropolitan-order-division','都市秩序部','#5b86b8'],['defense-force-silver-squad','防卫军・白银小队','#b8c3d1'],['external-strategy-department','外务筹策局','#988bc4'],['phaethon','「法厄同」','#e6c33b'],['covenant-of-dayat','达识结社','#cdb586']
  ].map(([id,name,theme])=>{
    const wikiId=({
      'cunning-hares':'547',
      'victoria-housekeeping':'548'
    })[id]||'';
    const base={
      id,name,theme,
      logo:factionLogos[id]||'',
      background:'',
      summary:factionBlurbs[id]||`${name}相关代理人阵营档案。`,
      members:[]
    };
    if(id==='covenant-of-dayat') return {
      ...base,
      sourceType:'official-member-page',
      sourceLabel:'蕾米埃尔·丹官方角色百科',
      sourceUrl:remielleWikiUrl
    };
    return {
      ...base,
      wikiId,
      wikiUrl:wikiId?`https://baike.mihoyo.com/zzz/wiki/content/${wikiId}/detail`:''
    };
  });
  const rows=[
    ['rina','亚历山德丽娜·莎芭丝缇安','Alexandrina Sebastiane','victoria-housekeeping','S','Electric','Support','Strike','2024-07-04','Weeping Cradle','September 23rd'],
    ['alice','爱丽丝·泰姆菲尔德','Alice Thymefield','spook-shack','S','Physical','Anomaly','Slash','2025-08-06','Practiced Perfection','August 30th'],
    ['anby','安比·德玛拉','Anby Demara','cunning-hares','A','Electric','Stun','Slash','2024-07-04','Demara Battery Mark II','February 20th'],
    ['anton','安东·伊万诺夫','Anton Ivanov','belobog','A','Electric','Attack','Pierce','2024-07-04','Drill Rig - Red Axis','May 2nd'],
    ['aria','爱芮','Aria','angels-of-delusion','S','Ether','Anomaly','Strike','2026-03-04','Angel in the Shell','June 7th'],
    ['harumasa','浅羽悠真','Asaba Harumasa','section-6','S','Electric','Attack','Pierce / Slash','2024-12-18','Zanshin Herb Case','July 19th'],
    ['astra-yao','耀嘉音','Astra Yao','stars-of-lyra','S','Ether','Support','Strike','2025-01-22','Elegant Vanity','January 31st'],
    ['banyue','般岳','Banyue','krampus-compliance-authority','S','Fire','Rupture','Strike','2025-12-17','Wrathful Vajra','July 24th'],
    ['ben','本·比格','Ben Bigger','belobog','A','Fire','Defense','Strike','2024-07-04','Big Cylinder','December 23rd'],
    ['billy-kid','比利·奇德','Billy Kid','cunning-hares','A','Physical','Attack','Pierce','2024-07-04','Starlight Engine Replica','November 25th'],
    ['burnice','柏妮思·怀特','Burnice White','sons-of-calydon','S','Fire','Anomaly','Pierce','2024-10-16','Flamemaker Shaker','May 23rd'],
    ['caesar','凯撒·金','Caesar King','sons-of-calydon','S','Physical','Defense','Slash / Strike','2024-09-25','Tusks of Fury','March 16th'],
    ['cissia','希希芙','Cissia','metropolitan-order-division','S','Electric','Attack','Slash','2026-04-15','Serpentine Seeker','January 10th'],
    ['corin','可琳·威克斯','Corin Wickes','victoria-housekeeping','A','Physical','Attack','Slash','2024-07-04','Housekeeper','June 2nd'],
    ['dialyn','琉音','Dialyn','krampus-compliance-authority','S','Physical','Stun','Slash','2025-11-26','Yesterday Calls','May 28th'],
    ['ellen','艾莲·乔','Ellen Joe','victoria-housekeeping','S','Ice','Attack','Slash','2024-07-04','Deep Sea Visitor','January 4th'],
    ['evelyn','伊芙琳·舒瓦利耶','Evelyn Chevalier','stars-of-lyra','S','Fire','Attack','Slash','2025-02-12','Heartstring Nocturne','October 7th'],
    ['grace-howard','格莉丝·霍华德','Grace Howard','belobog','S','Electric','Anomaly','Pierce','2024-07-04','Fusion Compiler','April 14th'],
    ['miyabi','星见雅','Hoshimi Miyabi','section-6','S','Frost','Anomaly','Slash','2024-12-18','Hailstorm Shrine','June 19th'],
    ['hugo','雨果・维拉德','Hugo Vlad','mockingbird','S','Ice','Attack','Slash','2025-05-14','Myriad Eclipse','August 20'],
    ['jane-doe','简·杜','Jane Doe','criminal-investigation-srt','S','Physical','Anomaly','Slash','2024-09-04','Sharpened Stinger','February 16th'],
    ['ju-fufu','橘福福','Ju Fufu','yunkui-summit','S','Fire','Stun','Strike','2025-06-25','Roaring Fur-nace','January 6th'],
    ['koleda','珂蕾妲·贝洛伯格','Koleda Belobog','belobog','S','Fire','Stun','Strike','2024-07-04','Hellfire Gears','August 10th'],
    ['manato','狛野真斗','Komano Manato','spook-shack','A','Fire','Rupture','Slash','2025-10-15',"Grill O'Wisp",'January 5th'],
    ['lighter','莱特','Lighter','sons-of-calydon','S','Fire','Stun','Strike','2024-11-27','Blazing Laurel','December 27th'],
    ['lucia','卢西娅・艾洛温','Lucia Elowen','spook-shack','S','Ether','Support','Strike','2025-10-15','Dreamlit Hearth','March 17th'],
    ['lucy','露西','Luciana de Montefio','sons-of-calydon','A','Fire','Support','Strike','2024-07-04','Kaboom the Cannon','August 14th'],
    ['nangong-yu','南宫羽','Nangong Yu','angels-of-delusion','S','Ether','Stun','Strike','2026-03-24','Neon Fantasies','September 29th'],
    ['nekomata','猫宫又奈','Nekomiya Mana','cunning-hares','S','Physical','Attack','Slash','2024-07-04','Steel Cushion','July 30th'],
    ['nicole-demara','妮可·德玛拉','Nicole Demara','cunning-hares','A','Ether','Support','Strike','2024-07-04','The Vault','November 11th'],
    ['norma','诺姆・霍洛维尔','Norma Hollowell','external-strategy-department','S','Fire','Stun','Strike','2026-07-08','Chief Sidekick','July 26th'],
    ['orphie-and-magus','奥菲丝与「鬼火」','Orphie Magnusson & Magus','obol-squad','S','Fire','Attack','Pierce / Slash','2025-09-24','Bellicose Blaze','November 3rd'],
    ['pan-yinhu','潘引壶','Pan Yinhu','yunkui-summit','A','Physical','Defense','Strike','2025-06-06','Tremor Trigram Vessel','May 10th'],
    ['piper','派派·韦尔','Piper Wheel','sons-of-calydon','A','Physical','Anomaly','Slash','2024-07-04','Roaring Ride','October 21st'],
    ['promeia','普罗米娅','Promeia','krampus-compliance-authority','S','Ice','Anomaly','Slash','2026-05-06','Frostfall Sickle','December 23rd'],
    ['pulchra','波可娜·费雷尼','Pulchra Fellini','sons-of-calydon','A','Physical','Stun','Slash','2025-03-12','Box Cutter','June 19th'],
    ['pyrois','佩洛伊斯','Pyrois','phaethon','I','Ether','Attack','Slash','2026-06-17','Sol Exuvia','待核验'],
    ['qingyi','青衣','Qingyi','criminal-investigation-srt','S','Electric','Stun','Strike','2024-08-14','Ice-Jade Teapot','January 1st'],
    ['remielle','蕾米埃尔·丹','REMIELLE','covenant-of-dayat','待公布','待公布','待公布','待公布','待公布','待公布','待公布'],
    ['seed','「席德」','Seed','obol-squad','S','Electric','Attack','Slash / Strike','2025-09-04','Cordis Germina','November 22nd'],
    ['seth','赛斯·洛威尔','Seth Lowell','criminal-investigation-srt','A','Electric','Defense','Slash','2024-09-04','Peacekeeper - Specialized','April 8th'],
    ['soldier-0-anby','零号·安比','Soldier 0 - Anby','defense-force-silver-squad','S','Electric','Attack','Slash','2025-03-12','Severed Innocence','February 20th'],
    ['soldier-11','11号','Soldier 11','obol-squad','S','Fire','Attack','Slash','2024-07-04','The Brimstone','March 21st'],
    ['soukaku','苍角','Soukaku','section-6','A','Ice','Support','Slash','2024-07-04','Bashful Demon','January 23rd'],
    ['starlight-billy','星徽・比利・奇德','Starlight - Billy Kid','cunning-hares','S','Physical','Rupture','Slash','2026-05-27','Starlight Rider Faceplate','November 25th'],
    ['sunna','千夏','Sunna','angels-of-delusion','S','Physical','Support','Strike','2026-02-06','Thoughtbop','July 18th'],
    ['trigger','「扳机」','Trigger','obol-squad','S','Electric','Stun','Pierce','2025-04-02','Spectral Gaze','April 21st'],
    ['yanagi','月城柳','Tsukishiro Yanagi','section-6','S','Electric','Anomaly','Slash','2024-11-06','Timeweaver','September 21st'],
    ['ukinami-yuzuha','浮波柚叶','Ukinami Yuzuha','spook-shack','S','Physical','Support','Strike','2025-07-16','Metanukimorphosis','November 2nd'],
    ['velina','维琳娜・艾嘉德','Velina Airgid','external-strategy-department','S','Wind','Anomaly','Slash','2026-06-17','Joyau Dore','September 22nd'],
    ['vivian','薇薇安・班希','Vivian Banshee','mockingbird','S','Ether','Anomaly','Slash','2025-04-23','Flight of Fancy','April 10'],
    ['lycaon','冯·莱卡恩','Von Lycaon','victoria-housekeeping','S','Ice','Stun','Strike','2024-07-04','The Restrained','October 4th'],
    ['ye-shunguang','叶瞬光','Ye Shunguang','yunkui-summit','S','Honed Edge','Attack','Slash','2025-12-30','Cloudcleave Radiance','January 20th'],
    ['yidhari','伊德海莉・墨菲','Yidhari Murphy','spook-shack','S','Ice','Rupture','Strike','2025-11-05',"Kraken's Cradle",'March 19th'],
    ['yixuan','仪玄','Yixuan','yunkui-summit','S','Auric Ink','Rupture','Strike','2025-06-06','Qingming Birdcage','December 3rd'],
    ['zhao','照','Zhao','krampus-compliance-authority','S','Ice','Defense','Slash','2025-12-30','Half-Sugar Bunny','October 14'],
    ['zhu-yuan','朱鸢','Zhu Yuan','criminal-investigation-srt','S','Ether','Attack','Pierce','2024-07-24','Riot Suppressor Mark VI','September 1st']
  ];
  const zh={Physical:'物理',Fire:'火',Ice:'冰',Electric:'电',Ether:'以太',Frost:'烈霜','Auric Ink':'玄墨','Honed Edge':'霜锋',Wind:'风',Attack:'强攻',Stun:'击破',Anomaly:'异常',Support:'支援',Defense:'防护',Rupture:'命破',Slash:'斩击',Strike:'打击',Pierce:'穿透'};
  const firstLine=value=>{
    const text=String(value||'').replace(/\r/g,'').trim();
    if(!text) return '';
    return text.split('\n').map(line=>line.trim()).find(Boolean)||'';
  };
  // 正式站只加载同源媒体；外部详情链接仍保留为用户主动点击的跳转。
  const mediaUrl=value=>{
    const text=String(value||'').trim();
    if(!text||text.startsWith('//')||/^https?:/i.test(text)||text.startsWith('/zzz/wiki/')) return '';
    return text;
  };
  const localCard=id=>`assets/portraits/${id}-card.webp`;
  const mindscapeMap={
    'rina':'Mindscape_Alexandrina_Sebastiane_Full.png',
    'alice':'Mindscape_Alice_Thymefield_Full.png',
    'anby':'Mindscape_Anby_Demara_Full.png',
    'anton':'Mindscape_Anton_Ivanov_Full.png',
    'aria':'Mindscape_Aria_Full.png',
    'harumasa':'Mindscape_Asaba_Harumasa_Full.png',
    'astra-yao':'Mindscape_Astra_Yao_Full.png',
    'banyue':'Mindscape_Banyue_Full.png',
    'ben':'Mindscape_Ben_Bigger_Full.png',
    'billy-kid':'Mindscape_Billy_Kid_Full.png',
    'burnice':'Mindscape_Burnice_White_Full.png',
    'caesar':'Mindscape_Caesar_King_Full.png',
    'cissia':'Mindscape_Cissia_Full.png',
    'corin':'Mindscape_Corin_Wickes_Full.png',
    'dialyn':'Mindscape_Dialyn_Full.png',
    'ellen':'Mindscape_Ellen_Joe_Full.png',
    'evelyn':'Mindscape_Evelyn_Chevalier_Full.png',
    'grace-howard':'Mindscape_Grace_Howard_Full.png',
    'miyabi':'Mindscape_Hoshimi_Miyabi_Full.png',
    'hugo':'Mindscape_Hugo_Vlad_Full.png',
    'jane-doe':'Mindscape_Jane_Doe_Full.png',
    'ju-fufu':'Mindscape_Ju_Fufu_Full.png',
    'koleda':'Mindscape_Koleda_Belobog_Full.png',
    'manato':'Mindscape_Komano_Manato_Full.png',
    'lighter':'Mindscape_Lighter_Full.png',
    'lucia':'Mindscape_Lucia_Elowen_Full.png',
    'lucy':'Mindscape_Luciana_de_Montefio_Full.png',
    'nangong-yu':'Mindscape_Nangong_Yu_Full.png',
    'nekomata':'Mindscape_Nekomiya_Mana_Full.png',
    'nicole-demara':'Mindscape_Nicole_Demara_Full.png',
    'orphie-and-magus':'Mindscape_Orphie_Magnusson_&_Magus_Full.png',
    'pan-yinhu':'Mindscape_Pan_Yinhu_Full.png',
    'piper':'Mindscape_Piper_Wheel_Full.png',
    'promeia':'Mindscape_Promeia_Full.png',
    'pulchra':'Mindscape_Pulchra_Fellini_Full.png',
    'qingyi':'Mindscape_Qingyi_Full.png',
    'seed':'Mindscape_Seed_Full.png',
    'seth':'Mindscape_Seth_Lowell_Full.png',
    'soldier-0-anby':'Mindscape_Soldier_0_-_Anby_Full.png',
    'soldier-11':'Mindscape_Soldier_11_Full.png',
    'soukaku':'Mindscape_Soukaku_Full.png',
    'starlight-billy':'Mindscape_Starlight_-_Billy_Kid_Full.png',
    'sunna':'Mindscape_Sunna_Full.png',
    'trigger':'Mindscape_Trigger_Full.png',
    'yanagi':'Mindscape_Tsukishiro_Yanagi_Full.png',
    'ukinami-yuzuha':'Mindscape_Ukinami_Yuzuha_Full.png',
    'vivian':'Mindscape_Vivian_Banshee_Full.png',
    'lycaon':'Mindscape_Von_Lycaon_Full.png',
    'ye-shunguang':'Mindscape_Ye_Shunguang_Full.png',
    'yidhari':'Mindscape_Yidhari_Murphy_Full.png',
    'yixuan':'Mindscape_Yixuan_Full.png',
    'zhao':'Mindscape_Zhao_Full.png',
    'zhu-yuan':'Mindscape_Zhu_Yuan_Full.png',
  };
  const localPortrait=id=>mindscapeMap[id]?`assets/portraits/${mindscapeMap[id]}`:`assets/portraits/${id}-portrait.webp`;
  const enrichmentBag=window.agentEnrichment?.agents||{};
  const characters=rows.map(([id,name,englishName,factionId,rank,attribute,specialty,attackType,releaseDate,signatureWEngine,birthday])=>{
    const enrich=enrichmentBag[id]||{};
    const factionName=factions.find(item=>item.id===factionId)?.name||'待核验阵营';
    const impression=String(enrich.impression||'').trim();
    const summary=id==='remielle'
      ?'蕾米埃尔·丹是达识结社成员；更多代理人资料待官方公布。'
      :(firstLine(impression)||`${name}是${factionName}的${zh[specialty]||specialty}代理人。`);
    const personalStories=(enrich.personalStories||[]).filter(item=>item&&item.summary).map(item=>({
      title:item.title||'角色故事',
      summary:item.summary,
      source:'角色档案摘录'
    }));
    const card=localCard(id);
    const wikiIcon=mediaUrl(enrich.iconUrl);
    const wikiHeader=mediaUrl(enrich.headerImgUrl);
    const growth=(enrich.growth||[]).map(stage=>({
      ...stage,
      materials:(stage?.materials||[]).map(material=>({
        ...material,
        url:material?.url||'',
        // 仅保留经 mediaUrl 校验的同源本地图标；丢弃远程热链。
        icon:mediaUrl(material?.icon)||''
      }))
    }));
    const gallery=(enrich.gallery||[]).map(item=>{
      if(!item) return null;
      // 仅保留同源本地图集；丢弃远程热链，避免 ||item.image 把外链带回页面。
      const image=mediaUrl(item.image||item.url||item.src)||'';
      if(!image) return null;
      return {...item,image};
    }).filter(Boolean);
    const wikiDetail=enrich.wikiUrl||(enrich.wikiId?`https://baike.mihoyo.com/zzz/wiki/content/${enrich.wikiId}/detail`:'');
    const sources=[
      {label:'绝区零官方资料',url:sourceLinks.official,type:'官方资料'},
      {label:'米哈游绝区零百科',url:wikiDetail||sourceLinks.wiki,type:id==='remielle'?'官方百科':'资料汇总'}
    ];
    if(id!=='remielle') sources.push({
      label:'Prydwen 角色卡面与攻略',
      url:`https://www.prydwen.gg/zenless/characters/${id==='anby'?'anby-demara':id==='soldier-0-anby'?'anby-demara-soldier-0':id==='starlight-billy'?'billy-starlight':id}`,
      type:'第三方资料'
    });
    (enrich.strategyLinks||[]).forEach(link=>{
      if(link?.url) sources.push({label:link.title||'相关资料',url:link.url,type:'攻略合集'});
    });
    return {
      id,name,englishName,factionId,rank,
      attribute:zh[attribute]||attribute,
      specialty:zh[specialty]||specialty,
      attackType:attackType.split(' / ').map(value=>zh[value]||value).join(' / '),
      releaseDate,signatureWEngine,birthday,
      card,
      avatar:card,
      headshot:card,
      portrait:localPortrait(id),
      iconUrl:wikiIcon,
      headerImgUrl:wikiHeader,
      summary,
      impression,
      cv:String(enrich.cv||'').trim(),
      shopNotes:enrich.shopNotes||[],
      gallery,
      growth,
      role:`${zh[attribute]||attribute} · ${zh[specialty]||specialty}`,
      combat:{overview:impression?`档案印象摘录：${firstLine(impression)}`:'核心机制、技能循环与实战要点待按技能资料补齐。',skillPriority:[]},
      materials:{level:[],skills:[],core:[],note:'材料名称与总量按官方游戏数据核验中；本站优先维护剧情关系与档案导航。'},
      build:{wEngines:[signatureWEngine],driveDiscs:[],mainStats:[],subStats:[],teams:[],note:'配装与配队属于版本向建议；正式档案层以角色关系、印象与剧情导航为主。'},
      sources,
      updatedAt:snapshotDate,
      personalStories,
      relatedIds:[],
      wikiId:enrich.wikiId||'',
      ...(id==='remielle'?{wikiUrl:wikiDetail}:{}),
      archiveNote:window.agentEnrichment?.note||''
    };
  });
  factions.forEach(faction=>{
    const members=characters.filter(character=>character.factionId===faction.id);
    faction.members=members.map(character=>character.id);
    if(members.length&&faction.id!=='covenant-of-dayat'){
      const names=members.slice(0,4).map(character=>character.name).join('、');
      const more=members.length>4?`等 ${members.length} 人`:`共 ${members.length} 人`;
      faction.summary=`${faction.summary} 现收录：${names}${more.startsWith('等')?more:`，${more}`}。`;
    }
  });
  const catalog={snapshotDate,sources:sourceLinks,factions,characters,enrichment:window.agentEnrichment||null};
  window.agentCatalog=catalog;
  const archive=window.archiveData||(window.archiveData={});
  const mergeById=(defaults,overrides)=>{
    const edited=new Map((overrides||[]).map(item=>[item.id,item]));
    // catalog is source of truth for roster; only keep non-conflicting local fields from data.js
    return defaults.map(item=>{
      const local=edited.get(item.id)||{};
      const merged={...item,...local,id:item.id};
      // prefer enrichment-backed narrative fields when local still looks like placeholder
      if(item.summary&&(!local.summary||/待补充|资料快照维护|可替换/.test(local.summary))) merged.summary=item.summary;
      if(item.personalStories?.length&&(!local.personalStories||!local.personalStories.length||local.personalStories.every(row=>/待补充|待接入/.test(row.title||'')))) merged.personalStories=item.personalStories;
      if(item.impression) merged.impression=item.impression;
      if(item.cv) merged.cv=item.cv;
      if(item.gallery?.length) merged.gallery=item.gallery;
      if(item.growth?.length) merged.growth=item.growth;
      if(item.sources?.length) merged.sources=item.sources;
      if(item.members) merged.members=item.members;
      if(item.sourceType==='official-member-page'){
        merged.summary=item.summary;
        merged.sourceType=item.sourceType;
        merged.sourceLabel=item.sourceLabel;
        merged.sourceUrl=item.sourceUrl;
        delete merged.wikiId;
        delete merged.wikiUrl;
      }
      if(item.theme&&!local.theme) merged.theme=item.theme;
      // 美术路径以 catalog 为准，避免旧空 logo / 坏相对路径覆盖
      if(item.logo!==undefined) merged.logo=item.logo||local.logo||'';
      if(item.avatar) merged.avatar=item.avatar;
      if(item.headshot) merged.headshot=item.headshot;
      if(item.portrait) merged.portrait=item.portrait;
      return merged;
    });
  };
  archive.factions=mergeById(factions,archive.factions);
  archive.characters=mergeById(characters,archive.characters);
  archive.meta={...(archive.meta||{}),agentSnapshotDate:snapshotDate,agentSource:window.agentEnrichment?.source||'agent-catalog',agentCount:archive.characters.length,factionCount:archive.factions.length};
})();
