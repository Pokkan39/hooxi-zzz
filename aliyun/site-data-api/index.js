const crypto=require('node:crypto');
const OSS=require('ali-oss');
const DEFAULT_OBJECT_KEY='hooxi-zzz/site-data.json';
const MAX_BODY_BYTES=2*1024*1024;

exports.handler=function(event,context,callback){const promise=handleRequest(event,context);if(typeof callback==='function'){promise.then(value=>callback(null,value)).catch(callback);return}return promise};

async function handleRequest(event,context,dependencies={}){
  let headers=buildHeaders({});
  try{
    const request=parseRequest(event);headers=buildHeaders(request.headers);
    if(request.method==='OPTIONS')return response(204,'',headers);
    if(!isSiteDataPath(request.path))return jsonResponse(404,{message:'Not found'},headers);
    const storage=dependencies.storage||createStorage(context);
    if(request.method==='GET')return jsonResponse(200,await readDocument(storage),headers);
    if(request.method!=='PUT')return jsonResponse(405,{message:'Method not allowed'},headers);
    if(!validPassword(request.headers['x-edit-password']))return jsonResponse(401,{message:'共享编辑密码错误。'},headers);
    if(Buffer.byteLength(request.body||'','utf8')>MAX_BODY_BYTES)return jsonResponse(413,{message:'请求数据过大。'},headers);
    const payload=parseJsonBody(request.body);
    if(!Number.isInteger(payload.expectedVersion)||payload.expectedVersion<0)return jsonResponse(400,{message:'expectedVersion 必须是非负整数。'},headers);
    if(!validSiteData(payload.data))return jsonResponse(400,{message:'站点数据结构不正确。'},headers);
    const current=await readDocument(storage);
    if(payload.expectedVersion!==current.version)return jsonResponse(409,{message:'云端已有新版本。',version:current.version,updatedAt:current.updatedAt},headers);
    const next={version:current.version+1,updatedAt:new Date().toISOString(),data:payload.data};
    await storage.put(getObjectKey(),Buffer.from(JSON.stringify(next,null,2)),{'Content-Type':'application/json; charset=utf-8'});
    return jsonResponse(200,next,headers);
  }catch(error){console.error('Hooxi site data API error:',error);return jsonResponse(500,{message:error.message||'Internal server error'},headers)}
}
function parseRequest(event){const raw=Buffer.isBuffer(event)?event.toString('utf8'):event;const data=typeof raw==='string'?safeJsonParse(raw,{}):(raw||{});const headers=lowerCaseHeaders(data.headers||{});const method=(data.requestContext?.http?.method||data.httpMethod||data.method||'GET').toUpperCase();const path=data.rawPath||data.path||data.requestContext?.http?.path||data.requestContext?.path||'/site-data';let body=data.body||'';if(data.isBase64Encoded&&body)body=Buffer.from(body,'base64').toString('utf8');return{method,path,headers,body}}
function lowerCaseHeaders(headers){return Object.fromEntries(Object.entries(headers).map(([key,value])=>[key.toLowerCase(),value]))}
function buildHeaders(requestHeaders){const allowed=process.env.ALLOWED_ORIGIN||'*';const origin=pickAllowedOrigin(allowed,requestHeaders.origin||'');return{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,PUT,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Accept,X-Edit-Password','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'}}
function pickAllowedOrigin(value,requestOrigin){if(value==='*')return'*';const allowed=value.split(',').map(x=>x.trim()).filter(Boolean);return requestOrigin&&allowed.includes(requestOrigin)?requestOrigin:(allowed[0]||'*')}
function isSiteDataPath(path){const clean=path.replace(/\/+$/,'')||'/';return clean==='/site-data'||clean.endsWith('/site-data')}
function validPassword(received){const expected=process.env.EDIT_PASSWORD||'';if(!expected||typeof received!=='string')return false;const a=Buffer.from(expected),b=Buffer.from(received);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
function validSiteData(data){return Boolean(data&&isObject(data.home)&&isObject(data.home.appearance)&&Array.isArray(data.home.cards)&&Array.isArray(data.home.tracks)&&isObject(data.archive)&&['mainline','stories','behindScenes','events'].every(key=>Array.isArray(data.archive[key])))}
function isObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)}
async function readDocument(storage){try{const result=await storage.get(getObjectKey());const value=safeJsonParse(result.content.toString('utf8'),null);if(value&&Number.isInteger(value.version)&&validSiteData(value.data))return value;throw new Error('OSS 中的站点数据无效。')}catch(error){if(error.code==='NoSuchKey'||error.status===404)return{version:0,updatedAt:null,data:null};throw error}}
function createStorage(context){const credentials=context?.credentials||{};const client=new OSS({region:requiredEnv('OSS_REGION'),bucket:requiredEnv('BUCKET_NAME'),accessKeyId:credentials.accessKeyId||process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,accessKeySecret:credentials.accessKeySecret||process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,stsToken:credentials.securityToken||process.env.ALIBABA_CLOUD_SECURITY_TOKEN,timeout:8000});return{get:key=>client.get(key),put:(key,body,headers)=>client.put(key,body,{headers})}}
function requiredEnv(name){const value=process.env[name];if(!value)throw new Error(`缺少环境变量 ${name}`);return value}
function getObjectKey(){return process.env.OBJECT_KEY||DEFAULT_OBJECT_KEY}
function parseJsonBody(body){return body?safeJsonParse(body,{}):{}}
function safeJsonParse(text,fallback){try{return JSON.parse(text)}catch{return fallback}}
function jsonResponse(statusCode,body,headers){return response(statusCode,JSON.stringify(body),headers)}
function response(statusCode,body,headers){return{statusCode,headers,isBase64Encoded:false,body}}
exports._test={handleRequest,validSiteData,getObjectKey};
