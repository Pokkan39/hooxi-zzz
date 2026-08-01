import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(rootDir, "artifacts", "archive-contract.json");
const bilibiliEvidencePath = path.join(rootDir, "artifacts", "bilibili-official-1636034895.json");
const ariaPortraitEvidencePath = path.join(rootDir, "artifacts", "aria-portrait-20260729", "source-and-conversion.json");
const ariaPortraitPath = path.join(rootDir, "assets", "portraits", "aria-portrait.webp");
const sunnaPortraitEvidencePath = path.join(rootDir, "artifacts", "sunna-portrait-20260729", "source-and-conversion.json");
const sunnaPortraitSourcePath = path.join(rootDir, "artifacts", "sunna-portrait-20260729", "source-original.png");
const sunnaPortraitPath = path.join(rootDir, "assets", "portraits", "sunna-portrait.webp");
const remielleEvidenceDir = path.join(rootDir, "artifacts", "remielle-official-20260729");
const remielleConversionEvidencePath = path.join(remielleEvidenceDir, "conversion-evidence.json");
const remielleSourceManifestPath = path.join(remielleEvidenceDir, "source-manifest.json");
const remielleOfficialPageUrl = "https://baike.mihoyo.com/zzz/wiki/content/2076/detail?mhy_presentation_style=fullscreen";
const storiesScriptRef = "stories.js?v=sunna-portrait-1";
const wikiMigrationCatalogPath = path.join(rootDir, "artifacts", "wiki-migrate", "catalog.json");
const cultivateAssetsDir = path.join(rootDir, "assets", "wiki", "cultivate");
const ignoredCultivateAssetEntries = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
const trustedBilibiliEvidenceSources = new Set(["manualVerifiedApiEvidence", "yt-dlp-online-detail"]);
const writeContract = process.argv.includes("--write-contract");
const unknownArgs = process.argv.slice(2).filter((arg) => arg !== "--write-contract");
const mediaFields = [
  "id", "title", "mediaRole", "platform", "videoUrl", "canonicalUrl",
  "officialDescription", "bvid", "publisherId", "totalDurationSeconds", "primaryPartDurationSeconds",
  "isReprint", "noReprint", "citations", "cover", "coverOriginalUrl", "coverWidth", "coverHeight", "sourceType",
  "publisher", "publishedAt", "sourceCheckedAt", "version", "spoilerLevel",
  "rightsStatus", "rightsNote"
];
const archiveCollections = ["factions", "characters", "mainline", "stories", "behindScenes", "events"];
const allowedOfficialDomains = [
  "mihoyo.com", "hoyoverse.com", "hoyolab.com", "bilibili.com", "youtube.com", "youtu.be"
];
const allowedRightsStatuses = new Set([
  "approved", "fan-index-use", "unresolved", "custom-fallback"
]);
const allowedSourceTypes = new Set([
  "official-video", "official-article", "fan-archive", "third-party"
]);
const allowedMediaRoles = new Set([
  "full-story", "chapter-trailer", "version-pv", "lore-short",
  "agent-demo", "ep", "interview"
]);
const allowedPlatforms = new Set([
  "official-site", "hoyolab", "bilibili", "youtube", "local"
]);
const officialBilibiliPublisher = "绝区零";
const officialBilibiliPublisherId = "1636034895";
const bvidPattern = /^BV[0-9A-Za-z]{10}$/;
const approvedMindscapeSlugs = [
  "alice", "anby", "anton", "aria", "astra-yao", "banyue", "ben", "billy-kid", "burnice",
  "caesar", "cissia", "corin", "dialyn", "ellen", "evelyn", "grace-howard", "harumasa", "hugo",
  "jane-doe", "ju-fufu", "koleda", "lighter", "lucia", "lucy", "lycaon", "manato", "miyabi",
  "nangong-yu", "nekomata", "nicole-demara", "orphie-and-magus", "pan-yinhu", "piper", "promeia",
  "pulchra", "qingyi", "remielle", "rina", "seed", "seth", "soldier-0-anby", "soldier-11", "soukaku",
  "starlight-billy", "sunna", "trigger", "ukinami-yuzuha", "vivian", "yanagi", "ye-shunguang",
  "yidhari", "yixuan", "zhao", "zhu-yuan"
];
const contractRoutes = {
  publicArchive: [
    "index.html",
    "mainline.html",
    "stories.html",
    "character.html",
    "faction.html",
    "events.html",
    "behind-scenes.html",
    "cultivate.html"
  ],
  publicPlay: ["tape-wall-sample.html"],
  internalTool: ["editor.html"],
  exact: [
    "index.html",
    "mainline.html",
    "stories.html",
    "character.html",
    "faction.html",
    "events.html",
    "behind-scenes.html",
    "cultivate.html",
    "tape-wall-sample.html",
    "editor.html"
  ],
  queryKeys: {
    "mainline.html": ["lane"],
    "stories.html": ["agent", "q", "faction"],
    "character.html": ["id"],
    "faction.html": ["id"],
    "cultivate.html": ["q"]
  },
  hashTargets: {
    "stories.html": ["agentSearchForm", "agentSearch", "selected-agent-disclosure", "selected-agent-disclosure-content"],
    "character.html": ["art", "media", "lore", "profile", "related", "story", "build", "growth"],
    "faction.html": ["faction-directory-notes", "factionContext", "factionContextContent"],
    "cultivate.html": ["sources", "cultivate-faq-698-01", "cultivate-13", "cultivate-13-source-details", "cultivate-13-source-details-content"],
    "tape-wall-sample.html": ["store-interior", "catalog", "bangboo-desk"]
  },
  networkPolicy: {
    publicExternalRequests: [],
    internalToolExactAllowlist: {
      "editor.html": ["http://localhost:3001/api/auth/session"]
    }
  },
  laneValues: ["mainline", "stories", "events", "behind", "media"]
};
const galleryFallbackPaths = {
  norma: "assets/gallery/norma/05.png",
  pyrois: "assets/gallery/pyrois/05.png",
  velina: "assets/gallery/velina/06.png"
};
const characterHeroContract = {
  characters: 57,
  defaultCount: 54,
  galleryFallbackIds: Object.keys(galleryFallbackPaths),
  galleryFallbackPaths,
  themePriority: ["i", "l", "c"],
  requiredThemeCount: 57,
  requiredUniqueThemeCount: 57,
  allowFactionFallbackOnNormalPath: false
};
function createSafeContext() {
  return vm.createContext({ window: Object.create(null) }, {
    codeGeneration: { strings: false, wasm: false }
  });
}

function runScript(context, relativePath) {
  const filePath = path.join(rootDir, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  new vm.Script(source, { filename: filePath }).runInContext(context, { timeout: 3000 });
}

function loadFormalRuntime() {
  const context = createSafeContext();
  for (const relativePath of ["data.js", "agent-enrichment.js", "agent-xray.js", "agent-catalog.js", "media-catalog.js", "cultivate-data.js"]) {
    runScript(context, relativePath);
  }
  const archive = context.window.archiveData;
  const agentCatalog = context.window.agentCatalog;
  const agentXray = context.window.agentXray;
  const mediaCatalog = context.window.hooxiMediaCatalog;
  const cultivateData = context.window.hooxiCultivateData;
  const wikiMigrationCatalog = JSON.parse(fs.readFileSync(wikiMigrationCatalogPath, "utf8"));
  if (!archive || typeof archive !== "object") throw new Error("正式运行时未暴露 window.archiveData");
  if (!agentCatalog || typeof agentCatalog !== "object") throw new Error("agent-catalog.js 未暴露 window.agentCatalog");
  if (!agentXray || typeof agentXray !== "object") throw new Error("agent-xray.js 未暴露 window.agentXray");
  if (!mediaCatalog || typeof mediaCatalog !== "object") throw new Error("media-catalog.js 未暴露 window.hooxiMediaCatalog");
  if (!cultivateData || typeof cultivateData !== "object") throw new Error("cultivate-data.js 未暴露 window.hooxiCultivateData");
  if (!wikiMigrationCatalog || !Array.isArray(wikiMigrationCatalog.pages)) throw new Error("wiki-migrate catalog 缺少 pages 数组");
  return { archive, agentCatalog, agentXray, mediaCatalog, cultivateData, wikiMigrationCatalog };
}

function loadCharacterArtResolver(archive) {
  const context = vm.createContext({
    window: { archiveData: archive },
    document: { readyState: "loading", addEventListener() {} }
  }, { codeGeneration: { strings: false, wasm: false } });
  runScript(context, "archive-tools.js");
  if (typeof context.window.resolveCharacterArt !== "function") {
    throw new Error("archive-tools.js 未暴露 window.resolveCharacterArt");
  }
  return context.window.resolveCharacterArt;
}

function isHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isAllowedDomain(hostname) {
  const host = hostname.toLowerCase();
  return allowedOfficialDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function collectArchiveItems(archive) {
  return archiveCollections.flatMap((collection) => {
    const items = archive[collection];
    return Array.isArray(items) ? items.map((item) => ({ collection, item })) : [];
  });
}

function resolveLocalFile(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim() || isHttpUrl(relativePath)) return null;
  const filePath = path.resolve(rootDir, relativePath);
  const relative = path.relative(rootDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return filePath;
}

function archiveIds(archive, collection) {
  const items = archive[collection];
  if (!Array.isArray(items)) throw new Error(`正式数据缺少 ${collection} 数组`);
  const ids = items.map((item) => item?.id);
  if (ids.some((id) => typeof id !== "string" || !id)) throw new Error(`正式数据 ${collection} 存在无效 ID`);
  if (new Set(ids).size !== ids.length) throw new Error(`正式数据 ${collection} 存在重复 ID`);
  return ids.sort();
}

function sortWikiIds(values) {
  return [...new Set(values.map((value) => String(value)))].sort((left, right) => left.localeCompare(right, "en", { numeric: true }));
}

function wikiIdDifference(left, right) {
  const rightSet = new Set(right.map((value) => String(value)));
  return sortWikiIds(left.filter((value) => !rightSet.has(String(value))));
}

function buildCultivateContract(cultivateData, wikiMigrationCatalog) {
  const guide = cultivateData?.guide;
  const materials = Array.isArray(cultivateData?.materials) ? cultivateData.materials : [];
  const materialWikiIds = materials.map((item) => item?.wikiId).filter(Boolean);
  const catalogCandidateIds = (wikiMigrationCatalog?.pages || [])
    .filter((page) => page?.channel === "cultivate")
    .map((page) => page?.id)
    .filter(Boolean);
  return {
    guideCount:guide && typeof guide === "object" ? 1 : 0,
    guideId:String(guide?.id || ""),
    faqCount:Array.isArray(guide?.faqs) ? guide.faqs.length : 0,
    materialCount:materials.length,
    catalogCandidateCount:catalogCandidateIds.length,
    catalogOnlyIds:wikiIdDifference(catalogCandidateIds, materialWikiIds),
    materialsOutsideCatalogIds:wikiIdDifference(materialWikiIds, catalogCandidateIds),
  };
}

function buildContract(archive, cultivateData, wikiMigrationCatalog) {
  return {
    version: "1.0.0",
    generatedAt: "2026-07-29",
    counts: { factions: 18, characters: 57 },
    routes: contractRoutes,
    characterHero: characterHeroContract,
    cultivate: buildCultivateContract(cultivateData, wikiMigrationCatalog),
    ids: {
      characters: archiveIds(archive, "characters"),
      factions: archiveIds(archive, "factions"),
      mainline: archiveIds(archive, "mainline"),
      stories: archiveIds(archive, "stories"),
      behindScenes: archiveIds(archive, "behindScenes"),
      events: archiveIds(archive, "events")
    }
  };
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseWebpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("不是有效的 WebP RIFF 文件");
  }
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > buffer.length) throw new Error(`WebP ${type} 数据块越界`);
    if (type === "VP8 ") {
      if (size < 10 || buffer[data + 3] !== 0x9d || buffer[data + 4] !== 0x01 || buffer[data + 5] !== 0x2a) throw new Error("无效 VP8 帧头");
      return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    }
    if (type === "VP8L") {
      if (size < 5 || buffer[data] !== 0x2f) throw new Error("无效 VP8L 帧头");
      const bits = buffer.readUInt32LE(data + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (type === "VP8X") {
      if (size < 10) throw new Error("无效 VP8X 帧头");
      return {
        width: 1 + buffer[data + 4] + (buffer[data + 5] << 8) + (buffer[data + 6] << 16),
        height: 1 + buffer[data + 7] + (buffer[data + 8] << 8) + (buffer[data + 9] << 16)
      };
    }
    offset = data + size + (size % 2);
  }
  throw new Error("WebP 缺少 VP8/VP8L/VP8X 尺寸块");
}

function webpChunkTypes(buffer) {
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("不是有效的 WebP RIFF 文件");
  }
  const riffEnd = 8 + buffer.readUInt32LE(4);
  if (riffEnd < 12 || riffEnd > buffer.length) throw new Error("WebP RIFF 数据范围越界");

  const types = [];
  let offset = 12;
  while (offset + 8 <= riffEnd) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    const end = data + size;
    if (end > riffEnd) throw new Error(`WebP ${type} 数据块越界`);
    types.push(type);
    offset = end + (size % 2);
    if (offset > riffEnd) throw new Error(`WebP ${type} 填充字节越界`);
  }
  if (offset !== riffEnd) throw new Error("WebP 数据块头不完整");
  return types;
}

function hasWebpAlpha(buffer) {
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("不是有效的 WebP RIFF 文件");
  }
  const riffEnd = 8 + buffer.readUInt32LE(4);
  if (riffEnd < 12 || riffEnd > buffer.length) throw new Error("WebP RIFF 数据范围越界");

  let offset = 12;
  let vp8xAlpha = false;
  let alphChunk = false;
  let vp8lAlpha = null;
  while (offset + 8 <= riffEnd) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    const end = data + size;
    if (end > riffEnd) throw new Error(`WebP ${type} 数据块越界`);

    if (type === "VP8X") {
      if (size < 10) throw new Error("无效 VP8X 帧头");
      vp8xAlpha ||= Boolean(buffer[data] & 0x10);
    } else if (type === "ALPH") {
      if (size < 1) throw new Error("无效 ALPH 数据块");
      alphChunk = true;
    } else if (type === "VP8L") {
      if (size < 5 || buffer[data] !== 0x2f) throw new Error("无效 VP8L 帧头");
      vp8lAlpha = Boolean((buffer.readUInt32LE(data + 1) >>> 28) & 1);
    }

    offset = end + (size % 2);
    if (offset > riffEnd) throw new Error(`WebP ${type} 填充字节越界`);
  }
  if (offset !== riffEnd) throw new Error("WebP 数据块头不完整");
  return vp8lAlpha === null ? alphChunk || vp8xAlpha : vp8lAlpha;
}

function parsePngIhdr(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature)) {
    throw new Error("不是有效的 PNG 文件");
  }
  if (buffer.readUInt32BE(8) !== 13 || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("PNG 缺少标准 IHDR 块");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
}

function normalizeUploadDate(value) {
  return typeof value === "string" && /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : "";
}

const results = [];
function validate(label, callback) {
  const failures = [];
  try {
    callback((message) => failures.push(message));
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  results.push({ label, failures });
}

if (unknownArgs.length) {
  results.push({ label: "命令行参数", failures: [`未知参数：${unknownArgs.join(", ")}`] });
}

validate("蕾米埃尔官方资产来源、转换证据与实际输出精确匹配", (fail) => {
  const expectedSources = {
    "display-1.png": {
      url:"https://act-upload.mihoyo.com/nap-obc-indep/2026/07/23/15559334/9004fd5d455c82bc20247eb0f6891050_1725964822439510660.png",
      bytes:1325525, sha256:"2acb13fc026f9e6d524386ecfa8e4f1ea3bb30f1cc6c2f1937651b498aa082cf",
      mode:"RGBA", dimensions:[1580, 2028], alphaExtrema:[0, 255], alphaBBox:[2, 1, 1578, 2026], colorType:6,
    },
    "mindscape-1.png": {
      url:"https://act-upload.mihoyo.com/nap-obc-indep/2026/07/29/71319299/af7afc5a763a30d882b57f60404ea963_1839644649078809127.png",
      bytes:1660629, sha256:"0e572e3019f59ee5fe7ac4990567621ba6adf875ab064b07da4b14545987f92c",
      mode:"RGB", dimensions:[2112, 1163], alphaExtrema:null, alphaBBox:null, colorType:2,
    },
    "faction.png": {
      url:"https://act-upload.mihoyo.com/nap-obc-indep/2026/07/22/15559334/299478a0ed06ec799a465ad2487b4e5d_2844220404539584154.png",
      bytes:69014, sha256:"3dd4e8b68ee47d546e20932918f07b6de77927ccac2b7e245108d9c16e63f34f",
      mode:"RGBA", dimensions:[220, 220], alphaExtrema:[0, 255], alphaBBox:[11, 2, 209, 216], colorType:6,
    },
  };
  const expectedOutputs = {
    "assets/portraits/remielle-portrait.webp": {
      sourceFile:"artifacts/remielle-official-20260729/display-1.png", sourceKey:"display-1.png",
      sha256:"3f1c2089ef629613d8d039445254808348b16763106c42e8f902aa73b80460c5", bytes:767004,
      dimensions:[1600, 1800], alphaExtrema:[0, 255], alphaBBox:[99, 0, 1501, 1800],
      resized:[1402, 1800], canvas:[1600, 1800], placement:[99, 0], format:"WebP", mode:"RGBA",
    },
    "assets/portraits/remielle-card.webp": {
      sourceFile:"artifacts/remielle-official-20260729/display-1.png", sourceKey:"display-1.png",
      sha256:"2390bcc00f1f97e36218ed28d9f3b6cc5df48e67e7614bbdb2517f46780c8e1f", bytes:96798,
      dimensions:[374, 512], alphaExtrema:[0, 255], alphaBBox:[0, 32, 374, 512],
      resized:[374, 480], canvas:[374, 512], placement:[0, 32], format:"WebP", mode:"RGBA",
    },
    "assets/mindscape/default/remielle.webp": {
      sourceFile:"artifacts/remielle-official-20260729/mindscape-1.png", sourceKey:"mindscape-1.png",
      sha256:"1aaef504d5bada8c98e2787c5f4b04b30ecbcc5a06b93c195092374975e4d262", bytes:1055842,
      dimensions:[2880, 1080], alphaExtrema:[0, 255], alphaBBox:[459, 0, 2420, 1080],
      resized:[1961, 1080], canvas:[2880, 1080], placement:[459, 0], format:"WebP", mode:"RGBA",
    },
    "assets/icons/covenant-of-dayat.png": {
      sourceFile:"artifacts/remielle-official-20260729/faction.png", sourceKey:"faction.png",
      sha256:"3dd4e8b68ee47d546e20932918f07b6de77927ccac2b7e245108d9c16e63f34f", bytes:69014,
      dimensions:[220, 220], alphaExtrema:[0, 255], alphaBBox:[11, 2, 209, 216],
      resized:[220, 220], canvas:[220, 220], placement:[0, 0], format:"PNG", mode:"RGBA",
    },
  };

  let manifest;
  let evidence;
  for (const [label, filePath, assign] of [
    ["source manifest", remielleSourceManifestPath, (value) => { manifest = value; }],
    ["conversion evidence", remielleConversionEvidencePath, (value) => { evidence = value; }],
  ]) {
    try {
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new Error("文件不存在");
      assign(JSON.parse(fs.readFileSync(filePath, "utf8")));
    } catch (error) {
      fail(`蕾米埃尔 ${label} 无法读取或解析：${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (!manifest || !evidence) return;

  if (manifest.characterId !== "remielle" || evidence.characterId !== "remielle") fail("蕾米埃尔两份证据的 characterId 必须为 remielle");
  if (manifest.sourcePage !== remielleOfficialPageUrl || evidence.officialPageUrl !== remielleOfficialPageUrl) {
    fail("蕾米埃尔官方页必须精确为米哈游百科 Wiki 2076 fullscreen URL");
  }

  const manifestByFile = new Map((Array.isArray(manifest.assets) ? manifest.assets : []).map((asset) => [asset?.file, asset]));
  for (const [file, expected] of Object.entries(expectedSources)) {
    const actual = manifestByFile.get(file);
    if (!actual) {
      fail(`蕾米埃尔 source manifest 缺少固定来源 ${file}`);
      continue;
    }
    const fields = {
      url:expected.url, contentType:"image/png", bytes:expected.bytes, sha256:expected.sha256,
      format:"PNG", mode:expected.mode, width:expected.dimensions[0], height:expected.dimensions[1],
      alphaExtrema:expected.alphaExtrema, alphaBBox:expected.alphaBBox,
    };
    for (const [field, value] of Object.entries(fields)) {
      if (!sameJson(actual[field], value)) fail(`蕾米埃尔来源 ${file} 的 ${field} 错误：期望 ${JSON.stringify(value)}，实际 ${JSON.stringify(actual[field])}`);
    }
  }

  const outputs = Array.isArray(evidence.outputs) ? evidence.outputs : [];
  const outputPaths = outputs.map((output) => output?.outputFile);
  if (outputs.length !== 4 || new Set(outputPaths).size !== 4 || !sameJson([...outputPaths].sort(), Object.keys(expectedOutputs).sort())) {
    fail(`蕾米埃尔 conversion evidence 必须完整且仅包含四项正式输出，实际 ${JSON.stringify(outputPaths)}`);
  }

  for (const output of outputs) {
    const expected = expectedOutputs[output?.outputFile];
    if (!expected) continue;
    const source = expectedSources[expected.sourceKey];
    const evidenceFields = {
      sourceFile:expected.sourceFile, officialPageUrl:remielleOfficialPageUrl, directUrl:source.url,
      sourceSha256:source.sha256, sourceBytes:source.bytes, sourceMode:source.mode,
      sourceAlphaExtrema:source.alphaExtrema, sourceDimensions:source.dimensions, sourceAlphaBBox:source.alphaBBox,
      outputSha256:expected.sha256, outputBytes:expected.bytes, outputMode:expected.mode,
      outputAlphaExtrema:expected.alphaExtrema, outputDimensions:expected.dimensions, outputAlphaBBox:expected.alphaBBox,
      canvas:expected.canvas,
    };
    for (const [field, value] of Object.entries(evidenceFields)) {
      if (!sameJson(output[field], value)) fail(`蕾米埃尔输出 ${output.outputFile} 的证据字段 ${field} 错误：期望 ${JSON.stringify(value)}，实际 ${JSON.stringify(output[field])}`);
    }
    if (!sameJson(output.scale?.resizedDimensions, expected.resized)
      || output.placement?.x !== expected.placement[0] || output.placement?.y !== expected.placement[1]) {
      fail(`蕾米埃尔输出 ${output.outputFile} 的 resize/placement 与可信转换事实不一致`);
    }
    if (output.crop !== false || output.upscale !== false || output.aiUpscale !== false
      || output.stretch !== false || output.backgroundRemoval !== false) {
      fail(`蕾米埃尔输出 ${output.outputFile} 禁止裁切、放大、AI 超分、拉伸或移除背景`);
    }

    const [sourceWidth, sourceHeight] = source.dimensions;
    const [resizedWidth, resizedHeight] = expected.resized;
    const [canvasWidth, canvasHeight] = expected.canvas;
    const [placementX, placementY] = expected.placement;
    const ratioWithinOnePixel = Math.abs(resizedWidth - sourceWidth * resizedHeight / sourceHeight) <= 1
      && Math.abs(resizedHeight - sourceHeight * resizedWidth / sourceWidth) <= 1;
    const geometryValid = ratioWithinOnePixel
      && resizedWidth <= sourceWidth && resizedHeight <= sourceHeight
      && placementX >= 0 && placementY >= 0
      && placementX + resizedWidth <= canvasWidth && placementY + resizedHeight <= canvasHeight
      && Math.abs(placementX - (canvasWidth - resizedWidth) / 2) <= 1
      && placementY === canvasHeight - resizedHeight;
    if (!geometryValid) fail(`蕾米埃尔输出 ${output.outputFile} 的比例/placement/canvas 几何不成立`);

    const encoding = output.encoding || {};
    if (expected.format === "WebP") {
      if (encoding.format !== "WebP" || encoding.mode !== "RGBA" || encoding.lossless !== true
        || encoding.method !== 6 || encoding.exact !== true || encoding.resampling !== "LANCZOS") {
        fail(`蕾米埃尔输出 ${output.outputFile} 的 WebP 编码证据不完整`);
      }
    } else if (encoding.format !== "PNG" || encoding.operation !== "byte-for-byte copy"
      || output.outputSha256 !== output.sourceSha256 || output.outputBytes !== output.sourceBytes) {
      fail("达识结社图标必须记录为源 PNG 的逐字节复制");
    }

    const outputPath = resolveLocalFile(output.outputFile);
    if (!outputPath || !fs.existsSync(outputPath) || !fs.statSync(outputPath).isFile()) {
      fail(`蕾米埃尔正式输出不存在：${output.outputFile}`);
      continue;
    }
    try {
      const buffer = fs.readFileSync(outputPath);
      const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
      if (sha256 !== expected.sha256 || buffer.length !== expected.bytes) {
        fail(`蕾米埃尔实际输出 ${output.outputFile} 的 SHA256/bytes 与证据不一致`);
      }
      if (expected.format === "WebP") {
        const dimensions = parseWebpDimensions(buffer);
        if (!sameJson([dimensions.width, dimensions.height], expected.dimensions)) fail(`蕾米埃尔实际 WebP ${output.outputFile} 尺寸错误`);
        if (!hasWebpAlpha(buffer)) fail(`蕾米埃尔实际 WebP ${output.outputFile} 缺少 alpha`);
        const chunkTypes = webpChunkTypes(buffer);
        if (!chunkTypes.includes("VP8L") || chunkTypes.includes("VP8 ")) fail(`蕾米埃尔实际 WebP ${output.outputFile} 必须为 lossless VP8L`);
      } else {
        const ihdr = parsePngIhdr(buffer);
        if (!sameJson([ihdr.width, ihdr.height], expected.dimensions) || ihdr.bitDepth !== 8 || ihdr.colorType !== 6) {
          fail(`达识结社实际 PNG 图标 IHDR/alpha 错误：${JSON.stringify(ihdr)}`);
        }
      }
    } catch (error) {
      fail(`蕾米埃尔实际输出 ${output.outputFile} 无法校验：${error instanceof Error ? error.message : String(error)}`);
    }

    const optionalSourcePath = path.join(rootDir, output.sourceFile);
    if (fs.existsSync(optionalSourcePath) && fs.statSync(optionalSourcePath).isFile()) {
      const sourceBuffer = fs.readFileSync(optionalSourcePath);
      const sourceSha256 = crypto.createHash("sha256").update(sourceBuffer).digest("hex");
      const ihdr = parsePngIhdr(sourceBuffer);
      if (sourceSha256 !== source.sha256 || sourceBuffer.length !== source.bytes
        || !sameJson([ihdr.width, ihdr.height], source.dimensions) || ihdr.bitDepth !== 8 || ihdr.colorType !== source.colorType) {
        fail(`蕾米埃尔可用源 PNG ${output.sourceFile} 与固定可信元数据不一致`);
      }
    }
  }
});

validate("Stories 正式脚本 cache token 精确匹配", (fail) => {
  const html = fs.readFileSync(path.join(rootDir, "stories.html"), "utf8");
  const scriptRefs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)]
    .map((match) => match[1])
    .filter((ref) => ref.split("?", 1)[0] === "stories.js");
  if (!sameJson(scriptRefs, [storiesScriptRef])) {
    fail(`stories.html 必须精确加载 ${storiesScriptRef}，实际 ${JSON.stringify(scriptRefs)}`);
  }
});

let archive;
let agentCatalog;
let agentXray;
let mediaCatalog;
let cultivateData;
let wikiMigrationCatalog;
let resolveCharacterArt;
try {
  ({ archive, agentCatalog, agentXray, mediaCatalog, cultivateData, wikiMigrationCatalog } = loadFormalRuntime());
  resolveCharacterArt = loadCharacterArtResolver(archive);
  results.push({
    label: "安全加载正式数据、媒体目录、养成证据与角色影画 resolver",
    failures: []
  });
} catch (error) {
  results.push({
    label: "安全加载正式数据、媒体目录、养成证据与角色影画 resolver",
    failures: [error instanceof Error ? error.message : String(error)]
  });
}

if (archive && agentCatalog && agentXray && mediaCatalog && cultivateData && wikiMigrationCatalog && resolveCharacterArt) {
  if (writeContract) {
    validate("生成正式数据契约快照", (fail) => {
      try {
        const contract = buildContract(archive, cultivateData, wikiMigrationCatalog);
        fs.mkdirSync(path.dirname(contractPath), { recursive: true });
        fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error));
      }
    });
  }

  const mediaItems = Array.isArray(mediaCatalog.items) ? mediaCatalog.items : [];
  const archiveItems = collectArchiveItems(archive);
  const mediaIds = new Set(mediaItems.map((item) => item?.id).filter(Boolean));

  validate("主线官方媒体映射保持单一真相", (fail) => {
    const mainlineById = new Map((archive.mainline || []).map((item) => [item?.id, item]));
    const mediaById = new Map(mediaItems.map((item) => [item?.id, item]));
    const forbiddenCompatIds = new Set(["media-894", "media-895"]);
    const mappings = [
      {
        archiveId:"mainline-1783788881092",
        mediaId:"zzz-launch-pv",
        bvid:"BV1vy411B7cd",
        rightsNoteParts:["noReprint=false", "不等于已授权", "未获得转载或再分发授权"],
      },
      {
        archiveId:"mainline-1783792988187",
        mediaId:"zzz-worldview-pv",
        bvid:"BV1GE4m1R7k5",
        rightsNoteParts:["noReprint=true", "未经作者授权禁止转载", "立即撤下"],
      },
    ];
    for (const mapping of mappings) {
      const archiveItem = mainlineById.get(mapping.archiveId);
      if (!archiveItem) {
        fail(`缺少主线媒体档案：${mapping.archiveId}`);
        continue;
      }
      for (const field of ["mediaIds", "sourceIds"]) {
        const refs = archiveItem[field];
        if (!sameJson(refs, [mapping.mediaId])) {
          fail(`主线 ${mapping.archiveId} 的 ${field} 必须精确映射 ${mapping.mediaId}`);
        }
        for (const id of Array.isArray(refs) ? refs : []) {
          if (forbiddenCompatIds.has(id)) fail(`主线 ${mapping.archiveId} 禁止误匹配兼容记录 ${id}`);
        }
      }
      const media = mediaById.get(mapping.mediaId);
      if (!media) {
        fail(`媒体目录缺少主线映射目标：${mapping.mediaId}`);
        continue;
      }
      if (media.bvid !== mapping.bvid) {
        fail(`媒体 ${mapping.mediaId} 的 BVID 必须为 ${mapping.bvid}`);
      }
      if (archiveItem.sourceUrl !== media.canonicalUrl) {
        fail(`主线 ${mapping.archiveId} 的 sourceUrl 必须等于 ${mapping.mediaId} 的 canonicalUrl`);
      }
      if (media.sourceCheckedAt !== "2026-07-23" || !isIsoDate(media.sourceCheckedAt)) {
        fail(`媒体 ${mapping.mediaId} 的 sourceCheckedAt 必须为有效日期 2026-07-23`);
      }
      if (media.rightsStatus !== "fan-index-use") {
        fail(`媒体 ${mapping.mediaId} 的 rightsStatus 必须为 fan-index-use`);
      }
      for (const part of mapping.rightsNoteParts) {
        if (!String(media.rightsNote || "").includes(part)) {
          fail(`媒体 ${mapping.mediaId} 的 rightsNote 缺少语义：${part}`);
        }
      }
    }
  });

  validate("养成指南、FAQ、素材与迁移目录语义一致", (fail) => {
    const guide = cultivateData.guide;
    const materials = Array.isArray(cultivateData.materials) ? cultivateData.materials : [];
    if (!guide || typeof guide !== "object") {
      fail("养成数据缺少唯一指南对象");
    } else {
      if (String(guide.id) !== "698") fail(`养成指南 ID 必须为 698，实际为 ${JSON.stringify(guide.id)}`);
      if (guide.wikiUrl !== "https://baike.mihoyo.com/zzz/wiki/content/698/detail") {
        fail("养成指南 wikiUrl 必须精确指向官方百科 698 详情页");
      }
      const faqs = Array.isArray(guide.faqs) ? guide.faqs : [];
      if (faqs.length !== 23) fail(`养成指南 FAQ 必须为 23 条，实际为 ${faqs.length}`);
      const faqQuestions = faqs.map((faq) => String(faq?.question || "").trim());
      if (faqQuestions.some((question) => !question) || faqs.some((faq) => !String(faq?.answer || "").trim())) {
        fail("养成指南 FAQ 的 question/answer 必须为非空文本");
      }
      if (new Set(faqQuestions).size !== faqQuestions.length) fail("养成指南 FAQ question 必须唯一");
    }

    if (materials.length !== 44) fail(`养成素材必须为 44 条，实际为 ${materials.length}`);
    const uniqueFields = {
      id: materials.map((item) => item?.id),
      wikiId: materials.map((item) => item?.wikiId),
      sourceUrl: materials.map((item) => item?.sourceUrl),
      cover: materials.map((item) => item?.cover),
    };
    for (const [field, values] of Object.entries(uniqueFields)) {
      if (values.some((value) => typeof value !== "string" || !value.trim())) fail(`养成素材 ${field} 必须全部为非空字符串`);
      if (new Set(values).size !== values.length) fail(`养成素材 ${field} 必须唯一`);
    }

    for (const item of materials) {
      const wikiId = String(item?.wikiId || "");
      if (!/^\d+$/.test(wikiId)) fail(`养成素材 ${item?.id || "<unknown>"} 的 wikiId 必须为数字字符串`);
      if (item?.id !== `cultivate-${wikiId}`) fail(`养成素材 ID 必须与 wikiId 精确对应：${item?.id} / ${wikiId}`);
      const expectedSourceUrl = `https://baike.mihoyo.com/zzz/wiki/content/${wikiId}/detail`;
      if (!isHttpUrl(item?.sourceUrl) || item.sourceUrl !== expectedSourceUrl) {
        fail(`养成素材 ${item?.id || "<unknown>"} 的 sourceUrl 必须精确指向官方百科 ${wikiId} 详情页`);
      }
      const coverPath = resolveLocalFile(item?.cover);
      const relativeToAssetDir = coverPath ? path.relative(cultivateAssetsDir, coverPath) : "";
      if (!coverPath || relativeToAssetDir.startsWith("..") || path.isAbsolute(relativeToAssetDir)) {
        fail(`养成素材 ${item?.id || "<unknown>"} 的 cover 必须位于 assets/wiki/cultivate/`);
      } else if (!fs.existsSync(coverPath) || !fs.statSync(coverPath).isFile() || fs.statSync(coverPath).size <= 0) {
        fail(`养成素材 ${item?.id || "<unknown>"} 的 cover 必须是非空本地文件：${item?.cover}`);
      }
    }

    const catalogCandidates = wikiMigrationCatalog.pages.filter((page) => page?.channel === "cultivate");
    const catalogCandidateIds = catalogCandidates.map((page) => String(page?.id || ""));
    const materialWikiIds = materials.map((item) => String(item?.wikiId || ""));
    if (catalogCandidateIds.length !== 45) fail(`wiki catalog 的 channel=cultivate 候选页必须为 45 条，实际为 ${catalogCandidateIds.length}`);
    if (catalogCandidateIds.some((id) => !/^\d+$/.test(id))) fail("wiki catalog 的 cultivate 候选 ID 必须为数字字符串");
    if (new Set(catalogCandidateIds).size !== catalogCandidateIds.length) fail("wiki catalog 的 cultivate 候选 ID 必须唯一");
    const catalogOnlyIds = wikiIdDifference(catalogCandidateIds, materialWikiIds);
    const materialsOutsideCatalogIds = wikiIdDifference(materialWikiIds, catalogCandidateIds);
    if (!sameJson(catalogOnlyIds, ["698"])) {
      fail(`cultivate 候选页减去素材 wikiId 必须精确等于 {698}，实际为 ${JSON.stringify(catalogOnlyIds)}`);
    }
    if (materialsOutsideCatalogIds.length) {
      fail(`素材 wikiId 反向减去 cultivate 候选页必须为空，实际为 ${JSON.stringify(materialsOutsideCatalogIds)}`);
    }

    if (!fs.existsSync(cultivateAssetsDir) || !fs.statSync(cultivateAssetsDir).isDirectory()) {
      fail("缺少 assets/wiki/cultivate 目录");
    } else {
      const entries = fs.readdirSync(cultivateAssetsDir, { withFileTypes: true });
      const relevantEntries = entries.filter((entry) => !ignoredCultivateAssetEntries.has(entry.name));
      const nonFiles = relevantEntries.filter((entry) => !entry.isFile()).map((entry) => entry.name).sort();
      if (nonFiles.length) fail(`assets/wiki/cultivate 只允许素材文件，发现非文件项：${nonFiles.join("、")}`);
      const actualAssetFiles = relevantEntries.filter((entry) => entry.isFile()).map((entry) =>
        path.relative(rootDir, path.join(cultivateAssetsDir, entry.name)).split(path.sep).join("/"),
      ).sort();
      const referencedCovers = [...uniqueFields.cover].sort();
      if (actualAssetFiles.length !== 44) fail(`assets/wiki/cultivate 有效素材文件必须为 44 个，实际为 ${actualAssetFiles.length}`);
      if (!sameJson(actualAssetFiles, referencedCovers)) {
        fail(`assets/wiki/cultivate 文件集合必须与 44 个 cover 引用精确一致；忽略规则仅限 ${[...ignoredCultivateAssetEntries].join("、")}`);
      }
    }
  });

  validate("正式数据契约快照严格匹配", (fail) => {
    if (!fs.existsSync(contractPath)) {
      fail("缺少 artifacts/archive-contract.json；先运行 node scripts/validate-archive.mjs --write-contract");
      return;
    }
    let contract;
    try {
      contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    } catch (error) {
      fail(`契约快照不是有效 JSON：${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    let expected;
    try {
      expected = buildContract(archive, cultivateData, wikiMigrationCatalog);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
      return;
    }
    if (!sameJson(contract, expected)) {
      fail("契约快照与当前正式数据/固定路由不一致；确认变更后重新运行 --write-contract");
    }
  });

  validate("正式数据满足契约基线", (fail) => {
    if (!fs.existsSync(contractPath)) return;
    let contract;
    try {
      contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    } catch {
      return;
    }
    for (const [collection, expectedCount] of Object.entries(contract.counts || {})) {
      const actual = Array.isArray(archive[collection]) ? archive[collection].length : 0;
      if (actual !== expectedCount) fail(`正式 ${collection} 数量变化：期望 ${expectedCount}，实际 ${actual}`);
    }
    for (const [collection, ids] of Object.entries(contract.ids || {})) {
      const actualIds = (archive[collection] || []).map((item) => item?.id).sort();
      if (!sameJson(actualIds, ids)) fail(`正式数据 ID 集合变化：${collection}`);
    }
    for (const route of contract.routes?.exact || []) {
      if (!fs.existsSync(path.join(rootDir, route))) fail(`契约路由入口不存在：${route}`);
    }
    for (const route of Object.keys(contract.routes?.queryKeys || {})) {
      if (!fs.existsSync(path.join(rootDir, route))) fail(`查询参数所属路由不存在：${route}`);
    }
    for (const route of Object.keys(contract.routes?.hashTargets || {})) {
      if (!fs.existsSync(path.join(rootDir, route))) fail(`Hash 所属路由不存在：${route}`);
    }
  });

  validate("默认影画资产精确覆盖角色目录", (fail) => {
    const excluded = new Set(["norma", "pyrois", "velina"]);
    const characters = Array.isArray(agentCatalog.characters) ? agentCatalog.characters : [];
    if (characters.length !== 57) fail(`agent-catalog 角色数量变化：期望 57，实际 ${characters.length}`);

    const catalogSlugs = characters
      .map((character) => character?.id)
      .filter((id) => typeof id === "string" && id && !excluded.has(id))
      .sort();
    if (!sameJson(catalogSlugs, approvedMindscapeSlugs)) {
      fail("agent-catalog 默认影画角色集合与批准的 54 slug 不一致");
    }

    const assetDir = path.join(rootDir, "assets", "mindscape", "default");
    if (!fs.existsSync(assetDir) || !fs.statSync(assetDir).isDirectory()) {
      fail("缺少 assets/mindscape/default 目录");
      return;
    }

    const actualFiles = fs.readdirSync(assetDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webp"))
      .map((entry) => entry.name)
      .sort();
    const expectedFiles = approvedMindscapeSlugs.map((slug) => `${slug}.webp`);
    const actualSet = new Set(actualFiles);
    const expectedSet = new Set(expectedFiles);
    for (const file of expectedFiles) {
      if (!actualSet.has(file)) fail(`缺少默认影画：assets/mindscape/default/${file}`);
    }
    for (const file of actualFiles) {
      if (!expectedSet.has(file)) fail(`默认影画目录存在额外 WebP：assets/mindscape/default/${file}`);
    }

    for (const file of expectedFiles) {
      const filePath = path.join(assetDir, file);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue;
      try {
        const buffer = fs.readFileSync(filePath);
        const dimensions = parseWebpDimensions(buffer);
        if (dimensions.width !== 2880 || dimensions.height !== 1080) {
          fail(`默认影画尺寸错误：assets/mindscape/default/${file}，期望 2880x1080，实际 ${dimensions.width}x${dimensions.height}`);
        }
        if (!hasWebpAlpha(buffer)) {
          fail(`默认影画缺少透明通道：assets/mindscape/default/${file}`);
        }
      } catch (error) {
        fail(`默认影画无法解析：assets/mindscape/default/${file}：${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

  validate("全 57 人 portrait 资产完整且爱芮与 Sunna 证据及 lossless WebP 精确匹配", (fail) => {
    const characters = Array.isArray(agentCatalog.characters) ? agentCatalog.characters : [];
    if (characters.length !== 57) fail(`agent-catalog 角色数量变化：期望 57，实际 ${characters.length}`);
    for (const character of characters) {
      const id = character?.id;
      if (!id) continue;
      const relativePath = `assets/portraits/${id}-portrait.webp`;
      const filePath = path.join(rootDir, relativePath);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        fail(`角色 ${id} 缺少 portrait：${relativePath}`);
      }
    }

    if (!fs.existsSync(ariaPortraitPath) || !fs.statSync(ariaPortraitPath).isFile()) return;
    try {
      const buffer = fs.readFileSync(ariaPortraitPath);
      const dimensions = parseWebpDimensions(buffer);
      const chunkTypes = webpChunkTypes(buffer);
      const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
      if (sha256 !== "642e6602eafaced7e793bdb1cac00941509875fd28ad90c7d52c798ab0a87aea") {
        fail(`爱芮 portrait SHA-256 错误：实际 ${sha256}`);
      }
      if (dimensions.width !== 1600 || dimensions.height !== 1800) {
        fail(`爱芮 portrait 尺寸错误：期望 1600x1800，实际 ${dimensions.width}x${dimensions.height}`);
      }
      if (!chunkTypes.includes("VP8L") || chunkTypes.includes("VP8 ")) {
        fail(`爱芮 portrait 必须使用 lossless VP8L，实际数据块 ${JSON.stringify(chunkTypes)}`);
      }
      if (!hasWebpAlpha(buffer)) fail("爱芮 portrait 的 VP8L 头未声明 alpha");

      const evidence = JSON.parse(fs.readFileSync(ariaPortraitEvidencePath, "utf8"));
      const expectedFields = [
        ["source.pageUrl", evidence.source?.pageUrl, "https://zenless-zone-zero.fandom.com/wiki/File:Agent_Aria_Human_Portrait.png"],
        ["source.directUrl", evidence.source?.directUrl, "https://static.wikia.nocookie.net/zenless-zone-zero/images/f/ff/Agent_Aria_Human_Portrait.png/revision/latest?format=original"],
        ["source.contentType", evidence.source?.contentType, "image/png"],
        ["source.format", evidence.source?.format, "PNG"],
        ["source.sha256", evidence.source?.sha256, "a84a70f66fb997493684b39d166da4dbecd9e6979dbe251fdbf61b8c574365bc"],
        ["source.mode", evidence.source?.mode, "RGBA"],
        ["conversion.resize.filter", evidence.conversion?.resize?.filter, "Lanczos"],
        ["conversion.canvas.mode", evidence.conversion?.canvas?.mode, "RGBA"],
        ["conversion.placement.horizontal", evidence.conversion?.placement?.horizontal, "center"],
        ["conversion.placement.vertical", evidence.conversion?.placement?.vertical, "bottom"],
        ["conversion.encoding.format", evidence.conversion?.encoding?.format, "WebP"],
        ["output.path", evidence.output?.path, "assets/portraits/aria-portrait.webp"],
        ["output.sha256", evidence.output?.sha256, "642e6602eafaced7e793bdb1cac00941509875fd28ad90c7d52c798ab0a87aea"],
        ["output.format", evidence.output?.format, "WEBP"],
        ["output.mode", evidence.output?.mode, "RGBA"],
      ];
      for (const [field, actual, expected] of expectedFields) {
        if (actual !== expected) fail(`爱芮 portrait 证据 ${field} 错误：期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
      }

      const exactFields = [
        ["source.dimensions", evidence.source?.dimensions, { width: 1052, height: 2020 }],
        ["source.alphaExtrema", evidence.source?.alphaExtrema, [0, 255]],
        ["source.alphaBBox", evidence.source?.alphaBBox, [0, 1, 1051, 2019]],
        ["conversion.resize", [evidence.conversion?.resize?.width, evidence.conversion?.resize?.height], [909, 1746]],
        ["conversion.canvas", [evidence.conversion?.canvas?.width, evidence.conversion?.canvas?.height], [1600, 1800]],
        ["conversion.canvas.background", evidence.conversion?.canvas?.background, [0, 0, 0, 0]],
        ["conversion.placement", [evidence.conversion?.placement?.x, evidence.conversion?.placement?.y], [345, 54]],
        ["output.dimensions", evidence.output?.dimensions, { width: 1600, height: 1800 }],
        ["output.alphaExtrema", evidence.output?.alphaExtrema, [0, 255]],
        ["output.alphaBBox", evidence.output?.alphaBBox, [345, 54, 1254, 1800]],
      ];
      for (const [field, actual, expected] of exactFields) {
        if (!sameJson(actual, expected)) fail(`爱芮 portrait 证据 ${field} 错误：期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
      }

      for (const [field, actual, expected] of [
        ["source.bytes", evidence.source?.bytes, 1273793],
        ["conversion.aiUpscale", evidence.conversion?.aiUpscale, false],
        ["conversion.crop", evidence.conversion?.crop, false],
        ["conversion.horizontalStretch", evidence.conversion?.horizontalStretch, false],
        ["conversion.encoding.lossless", evidence.conversion?.encoding?.lossless, true],
        ["conversion.encoding.method", evidence.conversion?.encoding?.method, 6],
        ["conversion.encoding.exact", evidence.conversion?.encoding?.exact, true],
        ["output.bytes", evidence.output?.bytes, 771862],
      ]) {
        if (actual !== expected) fail(`爱芮 portrait 证据 ${field} 错误：期望 ${expected}，实际 ${JSON.stringify(actual)}`);
      }

      const sourceSize = evidence.source?.dimensions;
      const resize = evidence.conversion?.resize;
      const ratioPreserved = Number.isInteger(sourceSize?.width) && Number.isInteger(sourceSize?.height)
        && Number.isInteger(resize?.width) && Number.isInteger(resize?.height)
        && (resize.width === Math.round(sourceSize.width * resize.height / sourceSize.height)
          || resize.height === Math.round(sourceSize.height * resize.width / sourceSize.width));
      if (!ratioPreserved) fail("爱芮 portrait resize 未保持来源纵横比，存在拉伸风险");

      const bbox = evidence.output?.alphaBBox;
      const canvas = evidence.conversion?.canvas;
      const placement = evidence.conversion?.placement;
      const bboxMatchesResize = Array.isArray(bbox) && bbox.length === 4
        && bbox[2] - bbox[0] === resize?.width && bbox[3] - bbox[1] === resize?.height;
      const bboxMatchesPlacement = Array.isArray(bbox) && bbox.length === 4
        && bbox[0] === placement?.x && bbox[1] === placement?.y
        && bbox[2] === placement?.x + resize?.width && bbox[3] === placement?.y + resize?.height;
      const bboxInsideCanvas = Array.isArray(bbox) && bbox.length === 4
        && bbox[0] >= 0 && bbox[1] >= 0 && bbox[2] <= canvas?.width && bbox[3] <= canvas?.height;
      if (!bboxMatchesResize || !bboxMatchesPlacement || !bboxInsideCanvas) {
        fail(`爱芮 portrait alpha bbox/resize/placement/canvas 几何不一致：${JSON.stringify({ bbox, resize, placement, canvas })}`);
      }
    } catch (error) {
      fail(`爱芮 portrait 或来源转换证据无法校验：${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const outputBuffer = fs.readFileSync(sunnaPortraitPath);
      const outputDimensions = parseWebpDimensions(outputBuffer);
      const outputChunkTypes = webpChunkTypes(outputBuffer);
      const outputSha256 = crypto.createHash("sha256").update(outputBuffer).digest("hex");
      const outputSha1 = crypto.createHash("sha1").update(outputBuffer).digest("hex");
      if (outputSha256 !== "484675bf7f5bd91e3d7a5489a8842e69aebe22928e1070cac2e240ffe6efea2e") {
        fail(`Sunna portrait SHA-256 错误：实际 ${outputSha256}`);
      }
      if (outputSha1 !== "25d27c0de01e4de96c301dcd66b7cc432bbbac89") {
        fail(`Sunna portrait SHA-1 错误：实际 ${outputSha1}`);
      }
      if (outputBuffer.length !== 645474) fail(`Sunna portrait 字节数错误：期望 645474，实际 ${outputBuffer.length}`);
      if (outputDimensions.width !== 1600 || outputDimensions.height !== 1800) {
        fail(`Sunna portrait 尺寸错误：期望 1600x1800，实际 ${outputDimensions.width}x${outputDimensions.height}`);
      }
      if (!outputChunkTypes.includes("VP8L") || outputChunkTypes.includes("VP8 ")) {
        fail(`Sunna portrait 必须使用 lossless VP8L，实际数据块 ${JSON.stringify(outputChunkTypes)}`);
      }
      if (!hasWebpAlpha(outputBuffer)) fail("Sunna portrait 的 VP8L 头未声明 alpha");

      const sourceBuffer = fs.readFileSync(sunnaPortraitSourcePath);
      const sourceSha256 = crypto.createHash("sha256").update(sourceBuffer).digest("hex");
      const sourceSha1 = crypto.createHash("sha1").update(sourceBuffer).digest("hex");
      const sourceIhdr = parsePngIhdr(sourceBuffer);
      if (sourceSha256 !== "30fbde333f13e20b9bb425c3f303fd39c7316fd2231c8e104431917874ff8049") {
        fail(`Sunna source-original SHA-256 错误：实际 ${sourceSha256}`);
      }
      if (sourceSha1 !== "bf8ddd733a7b7acf7f67b9f17d25471567934796") {
        fail(`Sunna source-original SHA-1 错误：实际 ${sourceSha1}`);
      }
      if (sourceBuffer.length !== 990824) fail(`Sunna source-original 字节数错误：期望 990824，实际 ${sourceBuffer.length}`);
      if (sourceIhdr.width !== 808 || sourceIhdr.height !== 1800 || sourceIhdr.bitDepth !== 8 || sourceIhdr.colorType !== 6) {
        fail(`Sunna source-original PNG IHDR 错误：期望 808x1800 8-bit RGBA，实际 ${JSON.stringify(sourceIhdr)}`);
      }

      const evidence = JSON.parse(fs.readFileSync(sunnaPortraitEvidencePath, "utf8"));
      const expectedFields = [
        ["generatedAt", evidence.generatedAt, "2026-07-29"],
        ["source.pageUrl", evidence.source?.pageUrl, "https://zenless-zone-zero.fandom.com/wiki/File:Agent_Sunna_Portrait.png"],
        ["source.apiUrl", evidence.source?.apiUrl, "https://zenless-zone-zero.fandom.com/api.php?action=query&format=json&formatversion=2&prop=imageinfo%7Crevisions%7Cinfo&titles=File%3AAgent%20Sunna%20Portrait.png&iiprop=timestamp%7Cuser%7Curl%7Csize%7Csha1%7Cmime%7Cmediatype%7Cbitdepth&rvprop=ids%7Ctimestamp&rvlimit=1"],
        ["source.officialCharacterPageUrl", evidence.source?.officialCharacterPageUrl, "https://zenless.hoyoverse.com/en-us/character?id=161791"],
        ["source.revision.timestamp", evidence.source?.revision?.timestamp, "2026-02-07T01:18:06Z"],
        ["source.contentType", evidence.source?.contentType, "image/png"],
        ["source.sha1", evidence.source?.sha1, "bf8ddd733a7b7acf7f67b9f17d25471567934796"],
        ["source.sha256", evidence.source?.sha256, "30fbde333f13e20b9bb425c3f303fd39c7316fd2231c8e104431917874ff8049"],
        ["source.format", evidence.source?.format, "PNG"],
        ["source.mode", evidence.source?.mode, "RGBA"],
        ["conversion.canvas.mode", evidence.conversion?.canvas?.mode, "RGBA"],
        ["conversion.placement.horizontal", evidence.conversion?.placement?.horizontal, "center"],
        ["conversion.placement.vertical", evidence.conversion?.placement?.vertical, "bottom"],
        ["conversion.encoding.format", evidence.conversion?.encoding?.format, "WebP"],
        ["output.path", evidence.output?.path, "assets/portraits/sunna-portrait.webp"],
        ["output.sha1", evidence.output?.sha1, "25d27c0de01e4de96c301dcd66b7cc432bbbac89"],
        ["output.sha256", evidence.output?.sha256, "484675bf7f5bd91e3d7a5489a8842e69aebe22928e1070cac2e240ffe6efea2e"],
        ["output.format", evidence.output?.format, "WEBP"],
        ["output.mode", evidence.output?.mode, "RGBA"],
      ];
      for (const [field, actual, expected] of expectedFields) {
        if (actual !== expected) fail(`Sunna portrait 证据 ${field} 错误：期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
      }

      const directUrl = String(evidence.source?.directUrl || "");
      const directUrlPrefix = "https://static.wikia.nocookie.net/zenless-zone-zero/images/3/39/Agent_Sunna_Portrait.png/revision/latest?";
      if (!directUrl.startsWith(directUrlPrefix) || !directUrl.includes("cb=20260207011806&format=original")) {
        fail(`Sunna portrait 证据 source.directUrl 必须指向指定 revision/latest 且包含 cb=20260207011806&format=original，实际 ${JSON.stringify(directUrl)}`);
      }

      const exactFields = [
        ["source.dimensions", evidence.source?.dimensions, { width: 808, height: 1800 }],
        ["source.alphaExtrema", evidence.source?.alphaExtrema, [0, 255]],
        ["source.alphaBBox", evidence.source?.alphaBBox, [3, 2, 808, 1799]],
        ["conversion.nativeSize", evidence.conversion?.nativeSize, { width: 808, height: 1800 }],
        ["conversion.canvas", [evidence.conversion?.canvas?.width, evidence.conversion?.canvas?.height], [1600, 1800]],
        ["conversion.canvas.background", evidence.conversion?.canvas?.background, [0, 0, 0, 0]],
        ["conversion.placement", [evidence.conversion?.placement?.x, evidence.conversion?.placement?.y], [396, 0]],
        ["output.dimensions", evidence.output?.dimensions, { width: 1600, height: 1800 }],
        ["output.alphaExtrema", evidence.output?.alphaExtrema, [0, 255]],
        ["output.alphaBBox", evidence.output?.alphaBBox, [399, 2, 1204, 1799]],
      ];
      for (const [field, actual, expected] of exactFields) {
        if (!sameJson(actual, expected)) fail(`Sunna portrait 证据 ${field} 错误：期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
      }

      for (const [field, actual, expected] of [
        ["source.pageId", evidence.source?.pageId, 44415],
        ["source.revision.id", evidence.source?.revision?.id, 151073],
        ["source.revision.parentId", evidence.source?.revision?.parentId, 142205],
        ["source.bytes", evidence.source?.bytes, 990824],
        ["conversion.aiUpscale", evidence.conversion?.aiUpscale, false],
        ["conversion.resize", evidence.conversion?.resize, false],
        ["conversion.crop", evidence.conversion?.crop, false],
        ["conversion.horizontalStretch", evidence.conversion?.horizontalStretch, false],
        ["conversion.encoding.lossless", evidence.conversion?.encoding?.lossless, true],
        ["conversion.encoding.method", evidence.conversion?.encoding?.method, 6],
        ["conversion.encoding.exact", evidence.conversion?.encoding?.exact, true],
        ["output.bytes", evidence.output?.bytes, 645474],
      ]) {
        if (actual !== expected) fail(`Sunna portrait 证据 ${field} 错误：期望 ${expected}，实际 ${JSON.stringify(actual)}`);
      }

      const sourceSize = evidence.source?.dimensions;
      const sourceBBox = evidence.source?.alphaBBox;
      const nativeSize = evidence.conversion?.nativeSize;
      const canvas = evidence.conversion?.canvas;
      const placement = evidence.conversion?.placement;
      const outputSize = evidence.output?.dimensions;
      const outputBBox = evidence.output?.alphaBBox;
      const validBBox = (bbox) => Array.isArray(bbox) && bbox.length === 4 && bbox.every(Number.isInteger);
      const translatedBBox = validBBox(sourceBBox) && Number.isInteger(placement?.x) && Number.isInteger(placement?.y)
        ? [sourceBBox[0] + placement.x, sourceBBox[1] + placement.y, sourceBBox[2] + placement.x, sourceBBox[3] + placement.y]
        : null;
      const geometryConsistent = sameJson(sourceSize, nativeSize)
        && sameJson(outputSize, { width: canvas?.width, height: canvas?.height })
        && Number.isInteger(nativeSize?.width) && Number.isInteger(nativeSize?.height)
        && Number.isInteger(canvas?.width) && Number.isInteger(canvas?.height)
        && placement?.x === (canvas.width - nativeSize.width) / 2
        && placement?.y === canvas.height - nativeSize.height
        && placement.x >= 0 && placement.y >= 0
        && placement.x + nativeSize.width <= canvas.width
        && placement.y + nativeSize.height <= canvas.height
        && validBBox(sourceBBox) && sourceBBox[0] >= 0 && sourceBBox[1] >= 0
        && sourceBBox[2] <= sourceSize?.width && sourceBBox[3] <= sourceSize?.height
        && sameJson(outputBBox, translatedBBox)
        && validBBox(outputBBox) && outputBBox[0] >= 0 && outputBBox[1] >= 0
        && outputBBox[2] <= canvas.width && outputBBox[3] <= canvas.height
        && sameJson(evidence.source?.alphaExtrema, evidence.output?.alphaExtrema);
      if (!geometryConsistent) {
        fail(`Sunna portrait alpha/bbox/placement/canvas 几何不一致：${JSON.stringify({ sourceSize, sourceBBox, nativeSize, canvas, placement, outputSize, outputBBox })}`);
      }
    } catch (error) {
      fail(`Sunna portrait、source-original 或来源转换证据无法校验：${error instanceof Error ? error.message : String(error)}`);
    }
  });

  validate("角色影画回退与独立主题色完整", (fail) => {
    const characters = Array.isArray(agentCatalog.characters) ? agentCatalog.characters : [];
    const fallbackIds = new Set(characterHeroContract.galleryFallbackIds);
    const resolvedThemes = new Map();

    for (const [id, expectedPath] of Object.entries(characterHeroContract.galleryFallbackPaths)) {
      const resolved = resolveCharacterArt(id);
      if (!resolved || resolved.source !== "gallery" || resolved.path !== expectedPath) {
        fail(`角色 ${id} resolver 回退错误：期望 gallery ${expectedPath}，实际 ${JSON.stringify(resolved)}`);
        continue;
      }
      if (/default|toastertjie/i.test(`${resolved.source} ${resolved.path}`)) {
        fail(`角色 ${id} gallery 回退不得标成 Default/Toastertjie：${JSON.stringify(resolved)}`);
      }
      if (!fs.existsSync(path.join(rootDir, expectedPath))) {
        fail(`角色 ${id} resolver 目标文件不存在：${expectedPath}`);
      }
    }

    for (const character of characters) {
      const id = character?.id;
      if (!id) continue;
      const resolved = resolveCharacterArt(id);
      const expectedDefaultPath = `assets/mindscape/default/${id}.webp`;
      if (fallbackIds.has(id)) {
        if (resolved?.source !== "gallery") fail(`gallery 回退角色进入了 Default 正常路径：${id}`);
      } else {
        if (!resolved || resolved.source !== "default" || resolved.path !== expectedDefaultPath) {
          fail(`角色 ${id} Default resolver 错误：期望 ${expectedDefaultPath}，实际 ${JSON.stringify(resolved)}`);
        } else if (!fs.existsSync(path.join(rootDir, expectedDefaultPath))) {
          fail(`角色 ${id} 缺少 Default 影画正常路径`);
        }
      }

      const xray = agentXray[id];
      if (!xray || typeof xray !== "object") {
        fail(`角色 ${id} 缺少预计算 i→l→c 主题数据`);
        continue;
      }
      const validThemeColor = (value) => Array.isArray(value)
        && value.length === 3
        && value.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255);
      const source = characterHeroContract.themePriority.find((key) => validThemeColor(xray[key]));
      const color = source ? xray[source] : null;
      const token = validThemeColor(color) ? color.join(",") : "";
      if (!token) {
        fail(`角色 ${id} 无法按 i→l→c 解析有效主题色`);
        continue;
      }
      const owner = resolvedThemes.get(token);
      if (owner) fail(`角色主题色必须独立覆盖：${owner} 与 ${id} 都解析为 ${token}`);
      else resolvedThemes.set(token, id);
    }

    if (characters.length !== characterHeroContract.requiredThemeCount) {
      fail(`角色主题目标数量变化：期望 ${characterHeroContract.requiredThemeCount}，实际 ${characters.length}`);
    }
    if (resolvedThemes.size !== characterHeroContract.requiredUniqueThemeCount) {
      fail(`独立角色主题色覆盖不足：期望 ${characterHeroContract.requiredUniqueThemeCount}，实际 ${resolvedThemes.size}`);
    }
  });

  validate("媒体与档案 ID 唯一", (fail) => {
    if (!Array.isArray(mediaCatalog.items)) fail("media-catalog.js 的 items 必须是数组");
    const seenMedia = new Set();
    for (const item of mediaItems) {
      if (!item?.id) fail("发现缺少 id 的媒体条目");
      else if (seenMedia.has(item.id)) fail(`媒体 ID 重复：${item.id}`);
      else seenMedia.add(item.id);
    }

    const seenArchive = new Map();
    for (const { collection, item } of archiveItems) {
      if (!item?.id) {
        fail(`${collection} 中发现缺少 id 的档案条目`);
      } else if (seenArchive.has(item.id)) {
        fail(`档案 ID 重复：${item.id}（${seenArchive.get(item.id)} / ${collection}）`);
      } else {
        seenArchive.set(item.id, collection);
      }
    }
  });

  validate("媒体字段与引用完整", (fail) => {
    for (const item of mediaItems) {
      for (const field of mediaFields) {
        const emptyFallbackOrigin = field === "coverOriginalUrl" && item.rightsStatus === "custom-fallback";
        if (!(field in item) || item[field] === null || (item[field] === "" && !emptyFallbackOrigin)) {
          fail(`媒体 ${item.id || "<unknown>"} 缺少必填字段 ${field}`);
        }
      }
    }
    for (const { item } of archiveItems) {
      for (const field of ["mediaIds", "sourceIds"]) {
        if (!(field in item)) continue;
        if (!Array.isArray(item[field])) {
          fail(`档案 ${item.id} 的 ${field} 必须是数组`);
          continue;
        }
        for (const id of item[field]) {
          if (!mediaIds.has(id)) fail(`档案 ${item.id} 的 ${field} 引用了不存在的媒体：${id}`);
        }
      }
    }
  });

  validate("官方 B 站证据逐字段交叉核验", (fail) => {
    let evidence;
    try {
      evidence = JSON.parse(fs.readFileSync(bilibiliEvidencePath, "utf8"));
    } catch (error) {
      fail(`无法读取官方 B 站证据 ${path.relative(rootDir, bilibiliEvidencePath)}：${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    if (String(evidence.uid || "") !== officialBilibiliPublisherId) fail("官方 B 站证据根 UID 不匹配");
    const checked = evidence.checked && typeof evidence.checked === "object" ? evidence.checked : {};
    const officialItems = mediaItems.filter((entry) => entry.platform === "bilibili" && entry.sourceType === "official-video");
    for (const item of officialItems) {
      const proof = checked[item.bvid];
      if (!proof || typeof proof !== "object") {
        fail(`媒体 ${item.id} 缺少 BVID ${item.bvid} 的 checked 证据条目`);
        continue;
      }
      if (!trustedBilibiliEvidenceSources.has(proof.evidenceSource)) {
        fail(`媒体 ${item.id} 的 evidenceSource 不可信：${proof.evidenceSource || "<empty>"}`);
      }
      const expectedUrl = `https://www.bilibili.com/video/${item.bvid}`;
      const comparisons = [
        ["BVID", item.bvid, proof.bvid],
        ["title", item.title, proof.title],
        ["publisher/uploader", item.publisher, proof.uploader],
        ["publisher/uploader UID", String(item.publisherId), String(proof.uploaderId)],
        ["publishedAt/uploadDate", item.publishedAt, normalizeUploadDate(proof.uploadDate)],
        ["totalDurationSeconds", item.totalDurationSeconds, proof.totalDurationSeconds],
        ["primaryPartDurationSeconds", item.primaryPartDurationSeconds, proof.primaryPartDurationSeconds],
        ["isReprint", item.isReprint, proof.isReprint],
        ["noReprint", item.noReprint, proof.noReprint],
        ["coverOriginalUrl/thumbnail", item.coverOriginalUrl, proof.thumbnail],
        ["verifiedOfficialUid", true, proof.verifiedOfficialUid],
        ["webpageUrl", expectedUrl, proof.webpageUrl]
      ];
      for (const [field, actual, expected] of comparisons) {
        if (actual !== expected) fail(`媒体 ${item.id} 的 ${field} 与证据不一致：目录=${JSON.stringify(actual)}，证据=${JSON.stringify(expected)}`);
      }
      const coverPath = resolveLocalFile(item.cover);
      if (!coverPath || !fs.existsSync(coverPath)) continue;
      try {
        const coverBuffer = fs.readFileSync(coverPath);
        const dimensions = parseWebpDimensions(coverBuffer);
        const coverSha256 = crypto.createHash("sha256").update(coverBuffer).digest("hex");
        for (const [field, actual, expected] of [
          ["coverWidth/WebP width", item.coverWidth, dimensions.width],
          ["coverHeight/WebP height", item.coverHeight, dimensions.height],
          ["thumbnailWidth/WebP width", proof.thumbnailWidth, dimensions.width],
          ["thumbnailHeight/WebP height", proof.thumbnailHeight, dimensions.height],
          ["coverSha256", proof.coverSha256, coverSha256]
        ]) {
          if (actual !== expected) fail(`媒体 ${item.id} 的 ${field} 不一致：记录=${JSON.stringify(actual)}，实际=${JSON.stringify(expected)}`);
        }
      } catch (error) {
        fail(`媒体 ${item.id} 的 WebP 尺寸/哈希读取失败：${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

  validate("官方 B 站投稿身份、详情链接与风险记录", (fail) => {
    const seenBvids = new Set();
    for (const item of mediaItems.filter((entry) => entry.platform === "bilibili" && entry.sourceType === "official-video")) {
      if (!bvidPattern.test(item.bvid || "")) fail(`媒体 ${item.id} 缺少合法 BVID`);
      else if (seenBvids.has(item.bvid)) fail(`官方 B 站 BVID 重复：${item.bvid}`);
      else seenBvids.add(item.bvid);
      if (item.publisher !== officialBilibiliPublisher) fail(`媒体 ${item.id} 的官方发布者必须为 ${officialBilibiliPublisher}`);
      if (item.publisherId !== officialBilibiliPublisherId) fail(`媒体 ${item.id} 的官方 UID 必须为 ${officialBilibiliPublisherId}`);
      const detailUrl = `https://www.bilibili.com/video/${item.bvid}`;
      if (item.videoUrl !== detailUrl || item.canonicalUrl !== detailUrl) {
        fail(`媒体 ${item.id} 的 videoUrl/canonicalUrl 必须是无跟踪参数的 BVID 详情页`);
      }
      if (typeof item.isReprint !== "boolean") fail(`媒体 ${item.id} 的 isReprint 必须是布尔值`);
      if (typeof item.noReprint !== "boolean") fail(`媒体 ${item.id} 的 noReprint 必须是布尔值`);
      if (!Array.isArray(item.citations) || !item.citations.includes(detailUrl) ||
        !item.citations.includes(`https://space.bilibili.com/${officialBilibiliPublisherId}`)) {
        fail(`媒体 ${item.id} 必须引用详情页与官方 UID 空间页`);
      }
      if (!String(item.rightsNote).includes(`noReprint=${item.noReprint}`) ||
        !String(item.rightsNote).includes("未获得转载或再分发授权")) {
        fail(`媒体 ${item.id} 的 rightsNote 必须准确解释 noReprint 与未授权风险`);
      }
      if (item.noReprint && !String(item.rightsNote).includes("未经作者授权禁止转载")) {
        fail(`媒体 ${item.id} 设置 noReprint=true 时必须明确禁止转载风险`);
      }
      if (!item.noReprint && !String(item.rightsNote).includes("不等于已授权")) {
        fail(`媒体 ${item.id} 设置 noReprint=false 时必须说明这不等于授权`);
      }
      if (!(Number.isFinite(item.totalDurationSeconds) && item.totalDurationSeconds > 0)) {
        fail(`媒体 ${item.id} 的 totalDurationSeconds 必须为正数`);
      }
      if (!(Number.isFinite(item.primaryPartDurationSeconds) && item.primaryPartDurationSeconds > 0 &&
        item.primaryPartDurationSeconds <= item.totalDurationSeconds)) {
        fail(`媒体 ${item.id} 的 primaryPartDurationSeconds 必须为不超过总时长的正数`);
      }
    }
  });

  validate("URL 协议与官方 canonical 域名", (fail) => {
    for (const item of mediaItems) {
      for (const field of ["videoUrl", "canonicalUrl"]) {
        if (!isHttpUrl(item[field])) fail(`媒体 ${item.id} 的 ${field} 必须是 http/https URL`);
      }
      if (item.coverOriginalUrl && !isHttpUrl(item.coverOriginalUrl)) {
        fail(`媒体 ${item.id} 的 coverOriginalUrl 必须为空或 http/https URL`);
      }
      if (String(item.sourceType).startsWith("official-") && isHttpUrl(item.canonicalUrl)) {
        const hostname = new URL(item.canonicalUrl).hostname;
        if (!isAllowedDomain(hostname)) fail(`媒体 ${item.id} 的官方 canonical 域名不在允许列表：${hostname}`);
      }
    }

    for (const { item } of archiveItems) {
      for (const field of ["video", "wikiUrl", "sourceUrl"]) {
        if (item[field] && !isHttpUrl(item[field])) fail(`档案 ${item.id} 的 ${field} 必须是 http/https URL`);
      }
      if (item.video && !item.cover) {
        fail(`档案 ${item.id} 已配置视频但缺少本地 cover，会触发运行时封面抓取`);
      }
      if (item.cover) {
        if (isHttpUrl(item.cover)) {
          fail(`档案 ${item.id} 的兼容 cover 必须本地化，禁止远程图片或代理：${item.cover}`);
        } else {
          const coverPath = resolveLocalFile(item.cover);
          if (!coverPath || !fs.existsSync(coverPath) || !fs.statSync(coverPath).isFile()) {
            fail(`档案 ${item.id} 的本地兼容 cover 不存在：${item.cover}`);
          }
        }
      }
    }
  });

  validate("本地封面存在且尺寸为正", (fail) => {
    for (const item of mediaItems) {
      const coverPath = resolveLocalFile(item.cover);
      if (!coverPath) {
        fail(`媒体 ${item.id} 的 cover 必须是仓库内本地相对路径`);
      } else if (!fs.existsSync(coverPath) || !fs.statSync(coverPath).isFile()) {
        fail(`媒体 ${item.id} 的本地封面不存在：${item.cover}`);
      } else if (fs.statSync(coverPath).size <= 0) {
        fail(`媒体 ${item.id} 的本地封面为空文件：${item.cover}`);
      }
      if (!(Number.isFinite(item.coverWidth) && item.coverWidth > 0)) fail(`媒体 ${item.id} 的 coverWidth 必须为正数`);
      if (!(Number.isFinite(item.coverHeight) && item.coverHeight > 0)) fail(`媒体 ${item.id} 的 coverHeight 必须为正数`);
    }
  });

  validate("必填日期与版权状态合法", (fail) => {
    if (!mediaCatalog.schemaVersion) fail("媒体目录缺少 schemaVersion");
    if (!isIsoDate(mediaCatalog.updatedAt)) fail("媒体目录 updatedAt 必须是 YYYY-MM-DD 有效日期");
    for (const item of mediaItems) {
      for (const field of ["publishedAt", "sourceCheckedAt"]) {
        if (!isIsoDate(item[field])) fail(`媒体 ${item.id} 的 ${field} 必须是 YYYY-MM-DD 有效日期`);
      }
      if (!allowedMediaRoles.has(item.mediaRole)) {
        fail(`媒体 ${item.id} 的 mediaRole 非法：${item.mediaRole}`);
      }
      if (!allowedPlatforms.has(item.platform)) {
        fail(`媒体 ${item.id} 的 platform 非法：${item.platform}`);
      }
      if (!allowedSourceTypes.has(item.sourceType)) {
        fail(`媒体 ${item.id} 的 sourceType 非法：${item.sourceType}`);
      }
      if (!allowedRightsStatuses.has(item.rightsStatus)) {
        fail(`媒体 ${item.id} 的 rightsStatus 非法：${item.rightsStatus}`);
      }
    }
    for (const { item } of archiveItems) {
      // 空数组在 JS 中为真值，必须判断实际是否含引用，否则无媒体记录会被误判
      const hasRef = (Array.isArray(item.mediaIds) && item.mediaIds.length > 0)
        || (Array.isArray(item.sourceIds) && item.sourceIds.length > 0);
      if (hasRef && !isIsoDate(item.updatedAt)) {
        fail(`含媒体引用的档案 ${item.id} 缺少有效 updatedAt`);
      }
    }
  });
}

let failureCount = 0;
for (const result of results) {
  if (result.failures.length === 0) {
    console.log(`[PASS] ${result.label}`);
  } else {
    failureCount += result.failures.length;
    console.error(`[FAIL] ${result.label}`);
    for (const failure of result.failures) console.error(`  - ${failure}`);
  }
}

if (failureCount > 0) {
  console.error(`\nFAIL: 档案媒体校验失败，共 ${failureCount} 个问题。`);
  process.exitCode = 1;
} else {
  const mode = writeContract ? "生成并校验" : "校验";
  console.log(`\nPASS: 档案媒体${mode}通过，共 ${results.length} 组检查。`);
}
