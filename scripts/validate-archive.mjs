import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(rootDir, "artifacts", "archive-contract.json");
const bilibiliEvidencePath = path.join(rootDir, "artifacts", "bilibili-official-1636034895.json");
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
const contractRoutes = {
  exact: [
    "index.html",
    "mainline.html",
    "stories.html",
    "character.html",
    "faction.html",
    "events.html",
    "behind-scenes.html",
    "editor.html"
  ],
  queryKeys: {
    "mainline.html": ["lane"],
    "stories.html": ["agent", "q", "faction"],
    "character.html": ["id"],
    "faction.html": ["id"]
  },
  hashTargets: {
    "stories.html": ["agentSearchForm", "agentSearch"],
    "character.html": ["media", "lore", "profile", "related", "story", "build", "growth"]
  },
  laneValues: ["mainline", "stories", "events", "behind", "media"]
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
  for (const relativePath of ["data.js", "agent-enrichment.js", "agent-catalog.js", "media-catalog.js"]) {
    runScript(context, relativePath);
  }
  const archive = context.window.archiveData;
  const mediaCatalog = context.window.hooxiMediaCatalog;
  if (!archive || typeof archive !== "object") throw new Error("正式运行时未暴露 window.archiveData");
  if (!mediaCatalog || typeof mediaCatalog !== "object") throw new Error("media-catalog.js 未暴露 window.hooxiMediaCatalog");
  return { archive, mediaCatalog };
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

function buildContract(archive) {
  return {
    version: "1.0.0",
    generatedAt: "2026-07-19",
    counts: { factions: 17, characters: 56 },
    routes: contractRoutes,
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

let archive;
let mediaCatalog;
try {
  ({ archive, mediaCatalog } = loadFormalRuntime());
  results.push({
    label: "安全加载正式 window.archiveData 与媒体目录",
    failures: []
  });
} catch (error) {
  results.push({
    label: "安全加载正式 window.archiveData 与媒体目录",
    failures: [error instanceof Error ? error.message : String(error)]
  });
}

if (archive && mediaCatalog) {
  if (writeContract) {
    validate("生成正式数据契约快照", (fail) => {
      try {
        const contract = buildContract(archive);
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
      expected = buildContract(archive);
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
