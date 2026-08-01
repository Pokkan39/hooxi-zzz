// 从 F:/website-archives/zzz-wiki 镜像响应中提取 role_talent 技能数据，
// 生成 agent-talents.js（window.agentTalents），供角色页技能模块渲染。
// 素材路径保留镜像内相对路径 /zzz/wiki/assets/...，由前端脚本按本站镜像映射。
import {readFileSync,readdirSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';

const MIRROR='F:/website-archives/zzz-wiki';
const RESPONSES=join(MIRROR,'mirror/responses');
const ASSETS=join(MIRROR,'assets/act-upload.mihoyo.com');
const SITE_ASSETS='F:/hooxi-zzz/assets/wiki/act-upload.mihoyo.com';
const OUT='F:/hooxi-zzz/agent-talents.js';

// 技能图标本地化：镜像文件复制到本站 assets/wiki/，返回站内相对路径
const localizeIcon=url=>{
  const text=String(url||'').trim();
  if(!text)return '';
  const rel=text
    .replace(/^https?:\/\/act-upload\.mihoyo\.com\//,'')
    .replace(/^\/zzz\/wiki\/assets\/act-upload\.mihoyo\.com\//,'')
    .split('?')[0];
  if(!rel||rel.startsWith('http'))return '';
  const src=join(ASSETS,rel);
  if(!existsSync(src))return '';
  const dest=join(SITE_ASSETS,rel);
  if(!existsSync(dest)){mkdirSync(dirname(dest),{recursive:true});copyFileSync(src,dest)}
  return `assets/wiki/act-upload.mihoyo.com/${rel}`;
};

// enrichment 中角色 id -> wikiId 映射（用于输出按本站角色 id 索引）
const enrichmentSrc=readFileSync('F:/hooxi-zzz/agent-enrichment.js','utf8');
const wikiToAgent={};
for(const m of enrichmentSrc.matchAll(/"([a-z0-9_]+)":\{"id":"[a-z0-9_]+","wikiId":"(\d+)"/g)){
  wikiToAgent[m[2]]=m[1];
}

const stripTags=html=>String(html||'')
  .replace(/<span[^>]*>/g,'').replace(/<\/span>/g,'')
  .replace(/<br\s*\/?>/g,'\n').replace(/<\/p>\s*<p[^>]*>/g,'\n')
  .replace(/<[^>]+>/g,'').trim();

const talents={};
let withTalent=0, mapped=0, files=0;
for(const file of readdirSync(RESPONSES)){
  if(!file.endsWith('.json'))continue;
  let json;
  try{json=JSON.parse(readFileSync(join(RESPONSES,file),'utf8'))}catch{continue}
  const page=json?.data?.page;
  if(!page?.modules)continue;
  files++;
  const rt=page.modules.flatMap(m=>m.components||[]).find(c=>c.component_id==='role_talent');
  if(!rt)continue;
  const entryId=String(page.id);
  const agentId=wikiToAgent[entryId];
  let data;
  try{data=JSON.parse(rt.data)}catch{continue}
  const groups=(data.list||[]).map(group=>{
    const child=group.children?.[0]||{};
    const icon=localizeIcon(child.icon||child.animated_icon||group.icon||group.animated_icon||'');
    return {
      name:String(child.title||group.tab_name||group.title||'').trim(),
      icon,
      desc:stripTags(child.desc),
      growth:(child.growth||[]).map(stage=>({
        name:String(stage?.name||'').trim(),
        rows:(stage?.children||[]).flatMap(node=>(node?.row||[]).flat().map(cell=>stripTags(cell)).filter(Boolean))
      })).filter(stage=>stage.name&&stage.rows.length).slice(0,8)
    };
  }).filter(g=>g.name&&g.desc);
  if(!groups.length)continue;
  withTalent++;
  if(agentId){talents[agentId]={wikiId:entryId,wikiName:page.name||'',skills:groups};mapped++}
}

const js=`// 由 scripts/generate-agent-talents.mjs 从官方 Wiki 镜像生成；请勿手改。
// 技能文案版权归属米哈游，本站仅作非官方档案展示。
window.agentTalents=${JSON.stringify({generatedFrom:'zzz-wiki mirror role_talent',agents:talents})};\n`;
writeFileSync(OUT,js);
console.log(`响应文件 ${files} · 含 role_talent ${withTalent} · 映射到本站角色 ${mapped} · 输出 ${OUT}`);
