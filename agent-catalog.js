(()=>{
  const snapshotDate='2026-07-13';
  const sourceLinks={
    official:'https://zenless.hoyoverse.com/',
    wiki:'https://zenless-zone-zero.fandom.com/wiki/Agent',
    prydwen:'https://www.prydwen.gg/zenless/characters'
  };
  const factions=[
    ['cunning-hares','狡兔屋','#f3d33b'],['belobog','白祇重工','#ef6e3a'],['victoria-housekeeping','维多利亚家政','#bfc9dc'],['sons-of-calydon','卡吕冬之子','#e65031'],['section-6','对空洞特别行动部第六课','#65bce8'],['criminal-investigation-srt','刑侦特勤组','#3aaad8'],['obol-squad','奥波勒斯小队','#db3848'],['stars-of-lyra','天琴座','#f6a3cc'],['mockingbird','「反舌鸟」','#8169c7'],['yunkui-summit','云岿山','#d9b553'],['spook-shack','怪啖屋','#6bb68d'],['krampus-compliance-authority','「坎卜斯黑枝」','#a55555'],['angels-of-delusion','「妄想天使」','#ef8fc0'],['metropolitan-order-division','都市秩序部','#5b86b8'],['defense-force-silver-squad','防卫军・白银小队','#b8c3d1'],['external-strategy-department','外务筹策局','#988bc4'],['phaethon','「法厄同」','#e6c33b']
  ].map(([id,name,theme])=>({id,name,theme,logo:'',background:'',summary:'绝区零代理人所属阵营。成员与角色资料按资料快照维护。',members:[]}));
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
  const characters=rows.map(([id,name,englishName,factionId,rank,attribute,specialty,attackType,releaseDate,signatureWEngine,birthday])=>({
    id,name,englishName,factionId,rank,attribute:zh[attribute]||attribute,specialty:zh[specialty]||specialty,attackType:attackType.split(' / ').map(value=>zh[value]||value).join(' / '),releaseDate,signatureWEngine,birthday,
    avatar:`assets/portraits/${id}-card.webp`,headshot:`assets/portraits/${id}-card.webp`,portrait:id==='anby'?'assets/portraits/anby-portrait.png':`assets/portraits/${id}-card.webp`,
    summary:`${name}是${factions.find(item=>item.id===factionId)?.name||'待核验阵营'}的${zh[specialty]||specialty}代理人。基础档案按 ${snapshotDate} 资料快照维护。`,
    role:`${zh[attribute]||attribute} · ${zh[specialty]||specialty}`,
    combat:{overview:'核心机制、技能循环与实战要点待按官方技能资料补齐。',skillPriority:[]},
    materials:{level:[],skills:[],core:[],note:'材料名称与总量正在按官方游戏数据核验；未完成前不展示推测数字。'},
    build:{wEngines:[signatureWEngine],driveDiscs:[],mainStats:[],subStats:[],teams:[],note:'配装与配队属于版本攻略建议，后续条目会标注适用版本与来源。'},
    sources:[{label:'绝区零官方资料',url:sourceLinks.official,type:'官方资料'},{label:'Zenless Zone Zero Wiki',url:sourceLinks.wiki,type:'资料汇总'},{label:'Prydwen 角色卡面与攻略',url:`https://www.prydwen.gg/zenless/characters/${id==='anby'?'anby-demara':id==='soldier-0-anby'?'anby-demara-soldier-0':id==='starlight-billy'?'billy-starlight':id}`,type:'第三方资料'}],
    updatedAt:snapshotDate,personalStories:[],relatedIds:[]
  }));
  factions.forEach(faction=>{faction.members=characters.filter(character=>character.factionId===faction.id).map(character=>character.id)});
  const catalog={snapshotDate,sources:sourceLinks,factions,characters};
  window.agentCatalog=catalog;
  const archive=window.archiveData||(window.archiveData={});
  archive.factions=factions;
  archive.characters=characters;
})();
