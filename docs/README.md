# Hooxi 绝区零剧情档案站

## 当前版本

这是一个运行时按静态文件发布的网站，部分交互由 esbuild 在发布前预构建；站点包含绝区零主题路线图、章节展开/折叠、动态背景、站内音乐播放器和“小白可用”的可视化编辑器。内容栏目为：主线剧情、角色档案、系列·幕后/对谈、往期活动。角色页已作为游戏式代理人档案入口，提供阵营、成员、个人剧情、PV 和养成攻略；主线页提供版本总览、组合筛选、剧透控制和版本路线图；站内条目是 Hooxi 档案的可编辑示例，不代表 Hooxi 的真实投稿。

阵营成员交互由 `src/faction-members.jsx` 通过 `npm run build:faction-members` 预构建为根目录 `faction-members.js` 与 `faction-members.css`，并精确依赖 `motion@12.23.12`。React Bits vendored 源码的许可证位于 `src/vendor/react-bits/LICENSE.md`；`faction.js` 会先输出原生 `article`、角色链接与 `details` fallback，只有 React 首次提交成功后才替换，因此 bundle 加载或渲染失败时仍保留可读成员目录。共享 `fx-reveal.js` 不会向 `.faction-member-react-card` 及其后代添加全局 glare 标记，成员卡由 React Bits 自行处理；可使用 `node artifacts/__faction-glare-probe.mjs` 覆盖桌面、移动、减少动态效果和原生 fallback 验证。成员卡图片固定以 `contain` 与 `center bottom` 完整呈现，并禁用图片层 Tilt 变形以避免 hover 裁切；卡片分区不保留继承间隙，标题不再受固定窄宽限制。

## 网站定位与正式规划

网站的正式定位、目标用户、双层产品结构、内容边界、建模素材要求、技术架构、分阶段路线、验收指标和风险门禁，统一见 [`HOOXI-WEBSITE-POSITIONING-PLAN.md`](HOOXI-WEBSITE-POSITIONING-PLAN.md)。后续首页、HOOXI PLAY、角色与阵营、编辑发布和 AI 接待施工均应以该文件为范围基线。

三方视觉与技术对照（官方 wiki / 南孚 / `F:/web` Active Theory）与「学什么、不学什么、何时才能改正式站」见 [`VISUAL-TECH-REFERENCE-COMPARE.md`](VISUAL-TECH-REFERENCE-COMPARE.md)。该文档是重建参考，**不构成自动施工授权**；未获用户明确要求前，不得把对照结论直接改入正式站主链路代码。

视觉研究台账见 [`HOOXI-VISUAL-RESEARCH-LEDGER.md`](HOOXI-VISUAL-RESEARCH-LEDGER.md)：先搜索、再核验，不猜；它区分正式基线、学习材料与证据层，并要求后续效果登记来源、版权、无障碍、性能、不能照搬和回退信息。台账不会把无法访问的 YouTube 主题写成已核验，也不抓取 Patreon 付费内容。

正式 R1 已于 2026-07-19 获得施工授权。全站视觉与交互唯一合同见根目录 [`../design.md`](../design.md)；媒体来源、封面和权利状态规则见 [`media-source-policy.md`](media-source-policy.md)。发布前至少执行 `npm run test:content` 与 `npm run test:formal`；`npm run test:ui` 默认生成带时间戳的 `artifacts/ui-gate-YYYYMMDD-HHMMSS/`，也可通过 `HOOXI_UI_OUTPUT_DIR` 指定固定输出目录，不会删除既有视觉证据，并同时阻断正式路由外联、无效页面结构和失效深链。代理人工作台由 `src/stories.jsx` 构建为正式 `stories.js`；`npm run test:stories` 直接自启临时静态服务，不会覆盖正式脚本。

`site-motion.js` 是 `index.html`、`mainline.html`、`stories.html`、`character.html`、`faction.html`、`events.html`、`behind-scenes.html` 7 个核心公开页共享的动态背景与同源页面转场层。发布时必须与 `motion.css` 一起纳入正式门禁基线；编辑器不挂载该层，内容可用性不得依赖转场动画。

设计重想讨论稿（用户价值、信息架构、双层体验、视觉优先级；只讨论不定案施工）见 [`HOOXI-DESIGN-RETHINK.md`](HOOXI-DESIGN-RETHINK.md)。该稿不替代 [`HOOXI-WEBSITE-POSITIONING-PLAN.md`](HOOXI-WEBSITE-POSITIONING-PLAN.md)，也**不构成施工授权**。

**功能 + 视觉设计审核稿**见 [`HOOXI-FUNCTION-VISUAL-REVIEW.md`](HOOXI-FUNCTION-VISUAL-REVIEW.md)。分步改时优先改裁片 [`HOOXI-FUNCTION-VISUAL-PART-0.md`](HOOXI-FUNCTION-VISUAL-PART-0.md)（仅 1.1 之前）。长版备份见 [`HOOXI-FUNCTION-VISUAL-REVIEW.v0.1-full.md`](HOOXI-FUNCTION-VISUAL-REVIEW.v0.1-full.md)。**改设计稿 ≠ 改正式站**。

**InterKnot-Web 迁移分析**见 [`INTERKNOT-MIGRATION-ANALYSIS.md`](INTERKNOT-MIGRATION-ANALYSIS.md)。该文档分析了 InterKnot Nuxt 社区平台与现有静态站点的技术栈差异，并提出三种可行方案：视觉借鉴（推荐）、SSG 迁移、完整社区平台迁移。**不构成自动施工授权**。

按仓库现况填写的**网站需求填空工单**见 [`网站需求填空工单-HOOXI-现况填写.md`](网站需求填空工单-HOOXI-现况填写.md)（定位/用户/双层入口/页面范围/禁忌与验收；标注现况 vs 建议默认 vs 待拍板；**不构成施工授权**）。

**S1 重构落点**（统一 token + 首页三条路径、去假模块墙）见 progress 2026-07-19 条目；token 文件 `tokens.css`。

**用户本轮要求 vs 现况对照**（难看/不协调/配色/模块少；先对齐再按 skill 重构）见 [`USER-REQ-VS-STATUS-2026-07-19.md`](USER-REQ-VS-STATUS-2026-07-19.md)。**不等于施工授权。**

**正式站缺口清单**（产品 Spec vs 现况、原型边界、D1–D8 决策板、施工包 C1–C5；skill 复查摘要）见 [`HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`](HOOXI-FORMAL-SITE-GAP-CHECKLIST.md)。**C1–C4 与现行美术覆盖（18 阵营 logo + 57 角色卡面）已落地**；**P1 品牌可读（7 页 SEO TDK + favicon + 首页轻量关于）已落地**；正式首页当前采用“午夜放映档案”七幕长卷，不再采用 2026-07-19 的 10 模块（6 LIVE / 4 LOCK）模块墙事实。主线页 `?lane=` 车道切换与正式档案可读性继续保留；C5 本阶段不做。本站不是官方 wiki 整站复刻。

对照审核稿 §3 的**抛砖视觉 Demo**（非正式站）：[`../prototype/visual-review-demos/`](../prototype/visual-review-demos/README.md)。五版可切换：门面档案为主 / 门面进店为主 / 主线终端 / 角色阵营墙 / PLAY 店内 2D。**仅讨论视觉，不替换正式首页。**

官方绳网情报站**高保真视觉复刻原型 v1**（非正式站）：[`../prototype/wiki-visual-replica/`](../prototype/wiki-visual-replica/README.md)。含首页骨架 + **游戏式代理人选取 UI**：默认**左角色大展示 + 右真机斜切花名册**（更陡左斜边 parallelogram、**3 列近方卡**、底栏「稀有度+等级N+属性」、**黄框选中**、左轨基础/技能/装备、右缘黄绿 `SELECT` 混角色 tone；筛选折叠；点选只换左图不拆页）；背景氛围动效保留；可切「档案」；切人斜切扫场 + 分角色待机。数据 `roster.json`/`agents.json` 同源 56 名（含 rank `I`），卡面 56/56；`?motion=1` 可强制全动效评审。对照真机选角帧与 B 站 UI 动作合集。**不是整站复制，也不改正式站主链路。**

## 游戏化档案界面

正式首页现在是“午夜放映档案”七幕长卷：序幕·今晚放映、第一幕·选片、第二幕·演员表、第三幕·正片、第四幕·加映、第五幕·片后谈、片尾·关于档案；序幕保留 Dual Gate，正式查档为主行动，PLAY 录像店是可跳过的次行动。首页职责是把访客送入真实查档路径和代理人精选索引；主线、角色剧情、活动与幕后长列表仍由各自正式栏目承载。页面尾部磁带坞保留完整播放器功能，但作为文档流内的次级面板，不遮挡内容或成为主 CTA。

首页长期 CSS 约定：伪元素只承担单一装饰职责；第二视觉职责必须落在具名 DOM 节点，不把内容或多个交互状态藏进同一个 `::before` / `::after`；`motion.css` 只表达状态、节奏和轻量转场，不定义最终几何；首页规则必须挂在 `.home-page` / `.home-act` 等首页作用域下，不向正式子页泄漏。Home / Feature Reel 的中文展示字体是明确例外，正文、导航和数据字段仍遵循全站字体 token。

主线、角色故事、幕后/对谈、活动和阵营页使用各自的主题色、档案编号与 HUD 首屏，便于快速分辨内容类型。时间轴卡片会按封面实际比例采用横向或纵向阅读布局；幕后页在没有资料时显示“等待制作信号”空状态，而不是留出空白区域。共享子页精选封面轮播在幕后页每 3 秒自动推进，其他子页保持每 5 秒推进；指针悬停、轮播内键盘焦点、页面隐藏或系统开启“减少动态效果”时暂停，条件全部解除后恢复。

`cinematic-slice.html` 是与正式首页隔离的 Active Theory 氛围首屏切片验证稿：使用黑场电影感、店外夜景 2.5D 视差、颗粒扫描线、极简 HUD、Space Grotesk/Space Mono 免费可商用字体和点击进店预渲染视频，用来验证“高级、丝滑、有格调”的首页方向，不替换正式 `index.html`。

`tech-direction-demos.html` 是与正式首页隔离的技术方向对照合集，用于讨论 HOOXI 首页该走哪条技术路径，不替换正式 `index.html`。当前包含五向：01 巨物首屏（低成本高冲击）、02 预渲染帧序列滚动（中成本强沉浸，进入段落后后台预热 48 帧）、03 信号控制台状态机（低成本强导航）、04 点击才加载的进店视频（可控加载 + 失败/减动效终帧兜底）、05 高配/移动弱网降级层（工程兜底）。每屏带决策标签；`prefers-reduced-motion` 下停止自动 scrub/扫描线/视频播放，帧序列改为按钮步进。

`tape-wall-sample.html` 是与正式首页隔离的 HOOXI PLAY 沉浸式录像店样板。它使用独立 CSS 和脚本，从店外待机开始，经用户点击/键盘开门与镜头推进进入店内；左侧提供书目分类、窄版 VHS 磁带墙和 CRT 看片台，右侧由原创接待邦布提供站内导航与 DeepSeek 待接入界面。`prototype/hooxi-rebuild/` 是重建后的隔离游戏式 Demo：先显示 HOOXI 厂商屏和 `CLICK TO CONNECT` 标题页，点击后才加载连接成片；到达店铺入口后必须依次确认橱窗、进入门廊，再点击播放进门成片并落到店内。流程仅由按钮、热点、返回和 Escape 推进，不使用滚动驱动；`?motion=1` 可强制评审完整动效，减少动态效果时直接使用海报切换。当前视觉层使用电影化全屏构图、倾斜粗体标题、场景色彩分级和无卡片式热点；同一会话重复进场会复用已加载视频，店内“继续探索”会显示明确的未开放状态。该页面不会替换正式 `index.html`。

`scroll-world-prototype.html` 已升级为真实长页滚动叙事原型：页面保留原生 `body` 纵向滚动，以 sticky `100dvh` 舞台覆盖约 9 屏轨道，依次经历 Gate、Entry、Reveal、Choice、Explore。Entry 的 48 帧进店镜头占约 3 屏，由 `scrollY` 经 `requestAnimationFrame` 连续、双向映射；滚动事件不调用 `preventDefault`，也不排队补间。真实 GLB 会在 Entry 开始时接管底层画面，帧序列只在前段短暂叠加并在门体近景前淡出，避免平面门框遮挡实时场景。完整 GLB 使用 sRGB 输出、ACES 色调映射、暖色主光、冷色轮廓光和软阴影；原始 PBR 材质与贴图继续保留。相同连续进度同步写入 CSS、帧序列与完整 GLB 相机，进入 Choice 后仍沿用左右书柜、左柜真实模型命中、录像带抽取/归位、fallback 和 Escape 返回闭环。减少动态效果会压缩轨道并直接使用末帧，移动端保持原生滚动和可访问 DOM 控件。Three.js 动态导入或 WebGL 失败时仍保留 DOM/CSS fallback。默认从同源 `assets/scroll-world/door-entry/` 读取 poster、choice 和 48 张进门帧；本地研究时仍可用 `?frames=http://127.0.0.1:8092` 覆盖素材根目录。适配器提供连续 `setScrollProgress(progress, detail)`，滚动期间直接设置相机姿态，不创建补间。适配接口与资产边界见 `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md`。

用户提供的 RandomPlay PMX 已在仓库外隔离区完成安全审计、Blender 导入诊断，并拆出“最左贴墙书柜 + 4 件物品”的本地研究 GLB Spike；网页仅在显式 `assets` 参数下接入该左柜样件，其余柜体、门、CRT、前台和邦布仍使用 DOM/CSS 或预渲染表现。授权仍未知，原始 ZIP、PMX、FX、来源不明贴图、Blend、GLB 和衍生渲染不得进入公开仓库。完整流程与后续扩展见 `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md`。

阵营页会根据 `faction.html?id=<factionId>` 读取阵营主题、关联记录和标识。未设置阵营标识图片时，页面使用字母占位徽章，保证档案仍然可阅读。站点会遵守系统“减少动态效果”偏好，自动缩短或取消非必要动画。

## 角色 Wiki 数据快照

角色区由三层数据拼成正式档案花名册，加载顺序为 `data.js` → `agent-enrichment.js` → `agent-catalog.js`：

1. `data.js`：保留主线 / 支线 / 活动等剧情条目；`factions` 与 `characters` 默认可为空，只放本地覆盖。
2. `agent-enrichment.js`：从本地归档 `website-archives/zzz-wiki` 抽取的代理人印象、个人故事摘要、图集、来源链接及职级晋升阶段（纯文本属性与有限材料字段，不向浏览器透传 Wiki HTML；结构化摘要，不是整站复制）。
3. `agent-catalog.js`：维护 57 名代理人与 18 个阵营的稳定 ID、已确认属性、阵营关系，并把 enrichment 合并进 `window.archiveData`。

当前 `snapshotDate` 为 **2026-07-29**。第 57 名角色蕾米埃尔的官方 Wiki 编号为 `2076`，英文名为 `REMIELLE`；她与达识结社的关系由官方角色页佐证，独立阵营资料仍待公布。蕾米埃尔尚未确认的等级、属性、特性、攻击类型、实装日期、生日、专属音擎、CV 等字段统一显示“待公布”，不得用推测值补齐。

- 基础事实优先核对绝区零官方 / 米游社百科归档；攻略建议可参考 Prydwen 等站，但必须标记来源。
- 不复制官方 wiki 整站或第三方长篇攻略；站内只保留结构化事实、短摘要和来源链接。材料总量、配装、词条和配队未完成核验时显示“待核验”，不得用推测数字填充。
- `stories.html` 是图四三段式角色目录：左侧固定站点导航，中部显示当前角色的大舞台及基础/技能/装备信息，右侧显示 57 人人物卡网格；搜索与阵营筛选收进原生 `details` disclosure，选择角色时无需刷新即可同步舞台、URL 与详情入口。
- `faction.html` 展示阵营摘要与成员；角色详情统一使用 `character.html?id=<id>`。详情页的四个 Hash tab 始终只显示一个活动 panel，支持浏览器 history、方向键、Home/End、roving tabindex，并把旧 hash 映射到当前模块；角色模块导航不再创建内部限宽/限高滚动条，站点侧栏保留栏目链接、展开/收起，以及上一/下一栏目和浏览器后退/前进控制；来源、版权归属、粉丝非官方与无隶属边界常显在 tab panel 之外。材料图标从本地 wiki 镜像复制到 `assets/materials/<epId>.<ext>`，页面只加载同源 `icon`；无图标时降级为等级字母。档案图集从镜像按原格式（含 GIF）复制到 `assets/gallery/<agentId>/<nn>.<ext>`，每角色最多 8 张，镜像缺失项跳过；页面只加载同源图集，禁止热链。材料详情若来自 `/zzz/wiki/...`，规范化为 `https://baike.mihoyo.com/...`，仅在用户点击时外跳。
- `character-sample.html`、`tech-direction-demos.html`、`cinematic-slice.html`、`prototype/` 等仍是隔离实验/样板，不替换正式档案首页。
- 重新生成 enrichment：`python scripts/build-agent-enrichment.py`（读取 `F:/website-archives/zzz-wiki`，写出 `artifacts/agent-enrichment.json`、`agent-enrichment.js`，并本地化材料图标到 `assets/materials/`、档案图集到 `assets/gallery/`）。

角色数据建议字段：`id`、`name`、`factionId`、`avatar`、`portrait`、`summary`、`impression`、`attribute`、`specialty`、`role`、`personalStories`、`sources`、`relatedIds`。阵营的 `members` 由 catalog 自动按 `factionId` 汇总；图标路径填写在 `factions[].logo`。

- 阵营图标放入 `assets/icons/`；角色头像和立绘放入 `assets/portraits/`。只保存相对路径，静态页面不会上传本地文件。
- `pv` 应标注为官方资料并链接到公开视频；`buildGuide` 必须标注“玩家整理”，并注明以游戏内实际版本为准；个人剧情和关联档案可用已有记录 ID 互相连接。
- 现行角色视觉覆盖为 57 张本地 card 与 57 张完整透明 portrait：card 使用 `assets/portraits/<characterId>-card.webp`，portrait 使用 `assets/portraits/<characterId>-portrait.webp`。Stories / Character 只使用 portrait；roster / avatar / headshot 只使用 card，不得互相回流。
- **2026-07-19 美术增强（历史批次）**：该轮当时为 17 个阵营配置本地 logo（`assets/icons/<factionId>.png`，由 `agent-catalog.js` 注入），并以当时的本地卡面替换列表首字母占位。现行覆盖已由 2026-07-29 的 18 阵营 / 57 角色合同接续；仅当 logo/头像字段仍为空时，目录才显示名称首字占位。
- **批次A 官方 B 站媒体**：`media-catalog.js` 统一收录公测 PV 与世界观 PV；`data.js` 只保存对应 `mediaIds` / `sourceIds`，来源链接指向各自 B 站官方详情页。`mainline.html`、`events.html`、`behind-scenes.html` 会在 `data.js` 后、`page.js` 前加载媒体目录；`page.js` 用首个有效 `mediaIds` 派生缺失的视频、封面和官方详情来源，同时保留条目显式字段及本地编辑器覆盖，派生的目录对象不会写入导出数据。公开档案页不再运行时请求 B 站 API，已有媒体目录的正式条目只使用同源本地封面，图片和“资料来源”分别链接对应官方视频详情。维护时可执行 `python scripts/collect-official-bilibili.py`，脚本串行调用本机 yt-dlp、只采元数据、不下载视频，并把可恢复进度写入 `artifacts/bilibili-official-1636034895.json`；仅在 stderr 错误行或非零退出内容明确出现 HTTP 412、错误码/code=-352、风控文本时立即停止，正常 JSON stdout 中偶然出现数字 412/352 不视为风控；重试仍为 0，重新枚举不会清空已有 BVID 与 pending。2026-07-23 空间枚举仍停于 HTTP 412；当前两条 checked 明确标为 `manualVerifiedApiEvidence`，来自已人工核验的官方详情 API 证据，并非本次脚本在线成功。两张官方原缩略图已按原图 1920×1080 转为本地 WebP 且不去水印；证据记录本地 `coverSha256`，并对各自原 JPEG 仅做一次精确下载且成功记录 `sourceImageSha256`。`npm run test:content` 会读取该证据文件，逐条交叉核对身份、标题、日期、时长、转载状态、原图 URL、详情页，并用 Node 标准库解析本地 WebP 实际尺寸及校验 SHA-256，替换 fallback 或证据缺失均会失败。目录分别记录 `isReprint`（copyright）与 `noReprint`（rights.no_reprint），中文 P1 时长为 133/247 秒，总时长为 517/973 秒。世界观 PV 官方 pubdate 为 2024-07-06。
- **立绘解析（维护时必看）**：Stories 的正式解析在 `src/stories.jsx` 的 `resolvePortrait()`，Character 的正式解析在 `character.js` 的 `CHARACTER_HERO_COMPOSITION` 与 portrait source；当前 57/57 均使用普通 `portrait` 分支与 `assets/portraits/<id>-portrait.webp`，并分别通过 `data-portrait-source` / `data-portrait-mode` 与 `data-portrait-source/path` 暴露真实分支，不存在 card fallback。Stories 主舞台与 Character Hero 使用 portrait；右侧 roster/avatar/headshot 仍独立使用 `<id>-card.webp`，不得把舞台立绘链与缩略图链合并。资源必须本地同源且真实存在，禁止依靠 404 回退；否则会触发 `console-error` 与 `local-http-error` 阻塞失败。
- 图片未提供时会显示站内占位，阵营、成员和角色页面仍可正常打开。添加资源后，提交图片与更新后的 `agent-catalog.js` 一并发布。

阵营成员区使用 vendored React Bits `SpotlightCard` 与基于 Motion 的 `TiltedCard`：图片仍只读取 `faction.js` 清洗后的同源本地路径，桌面 fine pointer 且未开启“减少动态效果”时启用轻量倾斜；触摸、粗指针或 reduced-motion 环境使用静止参数。React 不再读取或筛选 `archiveData`，原生 fallback 与 React 共用同一份安全 view model。


## 角色与阵营专区侧边栏

`stories.html`、`character.html`、`faction.html` 三个角色与阵营专区路由共享可收纳侧栏 (`site-sidebar.css` / `site-sidebar.js`)，提供栏目导航、展开/收起、上一/下一栏目和浏览器后退/前进控制。侧栏在桌面端默认展开且持久化状态到 `localStorage`，移动端 (≤640px) 默认收起；用户可通过切换按钮、`[` 快捷键、Escape 键或点击遮罩关闭。侧栏会自动识别当前路由并标记对应栏目为 `aria-current="page"`；`site-sidebar.css` 针对角色与阵营专区补充了布局兼容规则，确保侧栏不遮挡角色详情页的左侧轨道、阵营页的 React 成员卡或角色目录的搜索工作台。移动端侧栏展开时会显示全屏遮罩，点击遮罩或按 Escape 可收起侧栏并将焦点回到切换控件。系统开启"减少动态效果"时，侧栏过渡动画会被压缩为近即时切换，且不会创建全局点击光效画布。验证专区侧栏接入可运行 `node scripts/verify-faction-sidebar-integration.mjs`，覆盖三页在桌面 (1440px)、移动 (390px/320px) 和 reduced-motion 下的侧栏唯一性、键盘操作、焦点管理、无横向溢出和 React 成员卡 glare 隔离。

角色个人档案页统一通过 `character.html?id=<id>` 进入：顶部影画舞台负责角色视觉与身份，正文使用四个 Hash tab 承载媒体、故事、资料与关联档案，并严格保持单活动 panel。Character Hero 背景影画在桌面端使用 `cover` 铺满首屏，移动端按自然文档流使用 `16:9` 容器并以 `cover` 铺满，展示层边缘允许裁切；前景 portrait 继续使用 `contain` 完整展示并按角色构图参数细调。源素材转换仍禁止裁切、拉伸或抠图；Stories 舞台不变，roster / avatar / headshot 继续使用独立的 card + `cover` 链。



主线页在原有档案终端 HUD 视觉上增加了专用“剧情调查路线”控制台：

- **版本总览**：显示当前档案总数、版本节点数和每个版本的记录数量；点击版本轨道可快速切换版本。
- **组合筛选**：可同时按版本、档案类型及角色、阵营、地点、标题等关键词缩小范围；“清空筛选”仅恢复筛选条件，不会改变条目数据。
- **剧透控制**：默认遮挡剧情概要；开启“显示剧透”后才展示对应内容。该偏好只保存在当前浏览器。
- **路线关联**：主线记录使用 `prevId`、`nextId` 与 `relatedIds` 表达前后节点和关联档案，页面会以路线信息层级呈现。

主线条目在原有标题、摘要和媒体字段之外，使用以下字段维护路线图：`version`、`type`、`routeType`、`chapter`、`faction`、`location`、`characters`、`status`、`spoilerLevel`、`prevId`、`nextId`、`relatedIds`。其中 `characters` 与 `relatedIds` 使用逗号分隔的 ID 或名称；未填写的旧条目会以兼容默认值继续展示。

## 小白编辑流程

1. 打开网站，点击右上角黄色 `✦` 进入 `editor.html`。
2. 输入服务端配置的账号和密码，进入本地编辑工作台。
3. 在左侧选择页面，例如主线剧情、角色故事、往期活动或幕后/对谈。
4. 在左侧直接修改标题、简介、图片路径、视频链接、父级分组、父条目和分支名称。
5. 在“内容编辑”模式下，单击右侧模块会自动定位左侧设置；双击标题或简介可直接原地修改。
6. 每个左侧字段后的 `!` 说明按钮会解释用途、填写格式和影响范围。
7. 点击“刷新预览”，右侧真实网页会显示当前浏览器里的草稿效果。
8. 切到“布局拖动”，在右侧真实网页里点击“调整位置”，用鼠标拖动模块并导出 `layout-data.js`。
9. 点击“保存到本机”可把草稿写入当前浏览器；这一步不会影响线上访客。
10. 确认无误后点击“导出当前文件”，用下载的 `data.js` 覆盖仓库根目录同名文件，并同步覆盖拖动导出的 `layout-data.js`。
11. 执行 `git add`、`git commit`、`git push origin main`，等待 GitHub Pages 或绑定域名的托管服务更新。

**部署机制与唯一的质量兜底（务必先读）**

`.github/workflows/pages.yml` 是仓库唯一的工作流，触发条件只有 `push` 到 `main` 与手动 `workflow_dispatch`，步骤为 `upload-pages-artifact` 配 `path: .`，即把整个仓库全量上传并部署到 GitHub Pages。

由此有两个后果，任何人推 `main` 或合并 PR 前都必须清楚：

- **合并即上线。** 推到 `main` 的内容会直接成为线上站点，中间没有预发布环节。
- **没有任何 CI 测试把关。** 该工作流不执行 `npm test`、不执行 `npm run test:ui`、不执行 `npm run test:formal`。在 Pull Request 上不会触发任何检查，PR 页面的 checks 列表是空的——这是「没有配置检查」，不是「检查通过」。

所以质量兜底完全依赖本地。合并或直推 `main` 之前，至少跑完这三项并确认结果：

- `npm test`：档案媒体校验、链接诚信、非官方边界
- `npm run test:ui`：截图矩阵、深链、交互、首页发布与放映检查，须 `blockingFailures: 0`
- `npm run test:formal`：正式站基线比对。它的作用是拦截未经授权的正式站改动，报 `GATE_FAIL` 时先分辨是「本次改动确实获得批准」还是「出现了不该有的偏离」；确属已批准的施工，才在用户明确同意后用 `--write` 推进基线，不可顺手重建。

后端有意关闭时，仅 editor 的 `/api/auth/session` 精确 connection-refused 控制台消息作为预期离线证据记录，不算阻断；其他控制台错误仍阻断。

`artifacts/formal-site-gate-baseline.json` 是必须随仓库跟踪的门禁证据，不能再被 `artifacts/*` 忽略。

编辑页使用后端账号会话认证，账号密码由服务端环境变量 `EDITOR_ACCOUNTS_JSON` 配置，仓库和公开页面不保存账号密码。没有仓库写权限的人即使登录，也只能改自己浏览器里的草稿，不能改线上网站。公开页不会默认显示任何编辑模板或施工工具，只有点右上角 `✦` 才会进入编辑页。

## 内容来源标注

米游社百科（`baike.mihoyo.com`）属于官方来源；BWIKI、Fandom 与 GameKee 属于社区来源。本站只整理原创短摘要和结构化字段，不批量复制任一 Wiki 的原文或图片；引用外部资料时，应在词条“来源”字段中如实标注其来源类型。可参考：

## 音乐与自动播放说明

播放器不会在页面加载时自动播放，也不会因编辑器、卡片或菜单操作而启动。只有点击底部播放按钮才会播放；默认音量为 25%，用户调整后会保存在当前浏览器。请只使用自己创作、获得授权或明确允许使用的音频地址。

## 词条封面、角色立绘与 Wiki 字段

四个档案页的封面现在支持点击跳转视频：词条同时填写“封面图片”和“视频链接”后，访客点击封面会在新标签页打开视频。封面图片建议放到 `assets/covers/`，角色头像/立绘建议放到 `assets/portraits/`，编辑器中填写相对路径。

编辑器按官方 Wiki 常见的信息组织方式分为：基本信息（分类、类型、标题、简介、版本、日期）、角色与世界观（阵营、相关角色、地点/空洞区域）、媒体与来源（视频、封面、角色立绘、附加图片、官方资料链接）。这些字段是结构化预留，不会自动复制 Wiki 原文；可参考：

- <https://wiki.biligame.com/zzz/游戏历史>
- <https://zenless-zone-zero.fandom.com/zh/wiki/绝區零_Wiki>

选择本地图片按钮只提供当前浏览器预览，静态 GitHub Pages 不会自动上传文件。要让所有访客看到，仍需把图片复制到对应资源目录，并在字段中填写路径后导出 `data.js` 发布。图片只保存路径，使用懒加载，适合后续增加数百张图片；封面采用透明、完整展示模式，不裁切图片主体，也不再由封面容器产生黑色边框。页面会根据图片原始宽高自动识别横图、竖图和近方图：桌面端横图使用上下布局，竖图/近方图使用图文并排布局，手机端统一切换为上下布局。

装饰图片同样只保存路径：可在本地维护时添加为独立贴片，并直接编辑显示宽度、透明度、旋转角度和角标开关。装饰图容器默认透明、保持原始宽高比；最终还是导出 `layout-data.js` 覆盖仓库后发布。


网站现在提供四个独立档案页：主线时间轴、角色档案、系列·幕后/对谈、往期活动。角色的 PV、个人剧情和养成内容归入角色详情页；`data.js` 是默认数据源。

公开页面只保留右上角 `✦` 编辑入口。点击后进入 `editor.html`，通过服务端账号登录后才能看到本地编辑页。编辑页不会直接写回线上网站，发布仍需导出文件并手动推送 Git。

### 让所有访客看到编辑结果

1. 在 `editor.html` 输入服务端配置的账号和密码。
2. 修改 `data.js` 或 `layout-data.js`。
3. 点击“导出当前文件”。
4. 用下载文件覆盖仓库根目录同名文件。
5. 执行 `git add`、`git commit`、`git push origin main`。
6. 等 GitHub Pages 或绑定域名的托管服务更新后，所有访客才能看到新内容。

编辑内容保存在当前浏览器的 `localStorage`。静态 GitHub Pages 不会让网页直接写回仓库，也不要在公开网页中放 GitHub Token。

## 全站位置数据

公开页面默认不再显示左下角“调整位置”施工工具，避免访客看到维护界面。站点仍会读取 `layout-data.js` 中已发布的布局数据；如确需重新调整布局，应在本地维护后导出 `layout-data.js`，再覆盖仓库同名文件并推送。

## 阵营专属页面

词条填写稳定的 `factionId` 后，标题和“进入阵营档案”会跳转到 `faction.html?id=<factionId>`。阵营定义位于 `data.js` 的 `factions` 集合，支持名称、简介、标识、背景和主题色；专属页会自动汇总主线、支线、幕后/对谈和活动中的相关记录。视频封面仍优先打开视频，不与阵营入口冲突。


## 本地编辑与发布

访客页面按静态站发布，编辑入口在右上角 `✦`；账号登录依赖已配置并启动的后端认证服务。

### 编辑入口

浏览器打开 `editor.html`（例如 `http://localhost:8080/editor.html`），输入服务端配置的账号和密码。账号由环境变量 `EDITOR_ACCOUNTS_JSON` 在服务端配置，文档和公开页面不应记录任何真实凭据。

登录成功后进入可视化工作台：左侧改内容、父级、子级和图片路径，右侧用真实网页预览草稿；布局拖动模式会在右侧页面中复用现有布局工具。编辑器只会保存到当前浏览器或导出文件，不会直接改线上站点。

### Git 发布流程

```bash
git status
git add data.js layout-data.js
git commit -m "更新剧情档案内容"
git push origin main
```

只改了哪个文件，就只添加哪个文件。推送后等待 GitHub Pages 或绑定域名的托管平台刷新。

### 分享源码

推荐直接发仓库链接：`https://github.com/Pokkan39/hooxi-zzz`。如果打包 zip，别带真实密钥、账号密码或 `backend/.env`。

### 域名说明

内容编辑不会影响域名。域名只和 DNS、托管平台 Pages 设置、`CNAME` 文件有关；不要让内容维护者改这些配置。

### 本地预览

在项目目录执行：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080/`。


- 正式站切口进度：C1–C4 已落地（2026-07-19）；详见缺口清单。C5 本阶段不做。

## 2026-07-23 可读性改版
- 正式站配色：冷灰档案站（`tokens.css`），单一琥珀强调。
- 角色页：档案图集横向滑块；职级晋升 range 滑块（`character.js` + `wiki-readability.css`）。
- 活动页：顶部目录跳转 `wiki-page-toc`，锚点 `event-group-*` / `event-item-*`。

## 2026-07-23 冷灰美术全站扩展
- 正式子页统一冷灰档案站表面（顶栏/英雄区/时间轴/分组头/卡片），覆盖 `multi-page.css` 奶油纸与多色霓虹频道色。
- 入口样式：`tokens.css` + `theme-zzz.css` → `wiki-readability.css`；缓存 `cold-gray-2`。

## 2026-07-23 P0 视觉层级
- 首页视觉主角：录像店海报；主标题去大块实心黄。
- 主线 HUD 降不透明度；播放器暗轨。
- 样式：`wiki-readability.css` Hierarchy pass；缓存 `hierarchy-2`。

## 2026-07-23 录像店视觉与外观编辑
- 首页主角图：HOOXI PLAY 正门插画。
- 编辑器可改首页主角图路径/本地预览，以及标题、正文字号百分比。
- 字段：。

## 2026-07-23 ZZZ 美术语言
- 复古×潮流：硬色块切角、琥珀主强调 + 稀有信号青。
- 首页海报板、路径卡、卡带式播放器；缓存 。

## 2026-07-23 最终成品收口
- 首页播放器默认收为左下 136px 磁带小坞，悬停或键盘聚焦时展开完整控制；手机子页播放器收为 220px，避免遮挡主线赛道控件。
- `npm run test:stories` 该轮当时覆盖 98 项；`npm run test:ui` 该轮当时覆盖 8 个页面、桌面/手机/减动效 3 个视口、24 张截图、9 个深链接与原生 View Transition / 旧 route-loader 双路径。
- 正式门禁基线该轮当时包含 41 个文件；`wiki-readability.css` 虽由 `theme-zzz.css` 的 `@import` 间接加载，也必须纳入指纹，发布时不得遗漏。
- 独立预览位于 `artifacts/final-preview-2026-07-23/`，使用 `node serve-preview.mjs` 启动。该轻量闭包包含正式页面、运行脚本、字体、封面、立绘、图标、材料与音频，不包含约 1.3GB 的可选角色动态图集、后端凭据或无关原型。
- 内容边界不变：当前只有 2 条已核验官方 PV / 世界观媒体；主线与部分档案缺口属于内容采编欠账，不得用推测材料伪装完成。

## 2026-07-25 首页首刀
- 正式首页完成“午夜放映档案”七幕首刀，保留稳定 ID、动态内容宿主和既有链接；“开始查档”为主行动，PLAY 为可跳过次行动。
- 验证入口：`HOOXI_UI_OUTPUT_DIR="artifacts/home-midnight-screening-r2" npm run test:ui`；最终报告见 `../artifacts/home-midnight-screening-r2/report.json`。内容与 formal 的已知失败及归因见根目录 `progress.md` 的 2026-07-25 记录。

## 2026-07-28 角色影画工作台与正式门禁

- 该轮当时 Stories 采用图四三段式：左侧固定站点导航，中部为当前角色大舞台及基础/技能/装备信息，右侧为 56 人人物卡网格；筛选使用原生 `details` disclosure。桌面保持舞台与名录分区，移动端转为自然纵向流，不制造内部滚动陷阱。
- Character 统一入口为 `character.html?id=<id>`；媒体、故事、资料、关联四个 Hash tab 始终只显示一个活动 panel，支持 history、键盘导航与旧 hash 映射。来源、版权归属、粉丝非官方与无隶属边界常显，不随 panel 隐藏。
- 该轮当时的影画素材为 53 个 `assets/mindscape/default/<id>.webp` 加 `norma`、`pyrois`、`velina` 三个本地 gallery 回退；Stories 与 Character 均保持一张完整背景影画加一张前景。当时 56/56 均使用本地 portrait，不再存在 card fallback；名单缩略图仍独立使用 card。背景 `contain` 不裁剪，前景按角色细调且不挡标题、操作区或背景关键主体。Norma 构图是该轮已批准的视觉基线。
- 最终门禁：`test:stories` 95/95；`test:boundary:runtime` 12/12；`test:boundary:all` 83/83；`test:contrast` 1403 项（672 个真实可见样本 + 728 个语义样本 + 3 个几何样本，最低 4.62:1）；UI gate 1673/1673、65 PNG、0 failure；formal baseline 共 63 个文件，刷新后输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- 正式 UI 报告：`artifacts/r1-character-workbench-restored-20260728/formal-ui-gate/report.json`。固定输出目录仍可通过 `HOOXI_UI_OUTPUT_DIR` 指定。

## 2026-07-28 Character 文字动效维护

- 该轮 56 人目录要求每个 `character.englishName` 都是非空且区别于 id/中文名的真实英文名，并只注入 `#characterEnglishName`；编辑预览或异常运行时数据缺失该字段时节点安全保持 `hidden`，不阻断中文角色名与档案。有效角色完成中文名、身份字段与四个档案 Panel 注入后，`.character-screen` 仍写入一次性 `data-character-text-motion="enter"`。
- 新动效仅在 `.archive-character` 内使用有限次 transform/opacity：Hero 分层入场、英文名两次微呼吸、活动 Tab 确认与 Panel 标题 crossfade；不得改为永久循环、逐字 DOM、发光或官方 UI 复刻。减动效保持静止终态，移动端保持自然流和无横向溢出。
- 维护后至少执行 `node --check character.js`；当前相关门禁由 `npm run test:ui` 检查桌面重播、点击触发的 Panel 标题 transition run/end 与终态、Hash/焦点/hidden/inert、减动效、390px 最长英文名、编辑预览缺失英文名和无效角色无横溢出，英文名最终态对比度由 `npm run test:contrast -- anby` 或完整 `npm run test:contrast` 检查。

## 2026-07-29 爱芮与千夏完整 portrait 维护合同

- `aria` 与 `sunna` 在 Stories 主舞台与 Character Hero 均必须使用经过来源、转换、alpha 与 SHA 门禁的本地 1600×1800 lossless portrait：普通 `portrait` 分支、非 compact/edge-card、`data-portrait-source="portrait"`。该合同签订时 56/56 均使用 `assets/portraits/<id>-portrait.webp`，不存在 card fallback；现行总数由下节的 57 人合同覆盖。
- 爱芮原始文件页为 <https://zenless-zone-zero.fandom.com/wiki/File:Agent_Aria_Human_Portrait.png>，原始 PNG 为 1052×2020 RGBA，SHA-256 为 `a84a70f66fb997493684b39d166da4dbecd9e6979dbe251fdbf61b8c574365bc`。当前输出将原图按比例 Lanczos 缩放到 909×1746，水平居中、底部对齐放入 1600×1800 透明 RGBA 画布，并编码为声明 alpha 的 lossless WebP/VP8L；输出 SHA-256 为 `642e6602eafaced7e793bdb1cac00941509875fd28ad90c7d52c798ab0a87aea`，实际 alpha extrema 为 `0..255`、非零 bbox 为 `[345,54,1254,1800]`。禁止 AI 放大、超分、横向拉伸或裁切。
- 千夏原始文件页为 <https://zenless-zone-zero.fandom.com/wiki/File:Agent_Sunna_Portrait.png>，官方角色 ID 为 `161791`；原始 PNG 为 808×1800 RGBA、990824 bytes，SHA-256 为 `30fbde333f13e20b9bb425c3f303fd39c7316fd2231c8e104431917874ff8049`。
- 千夏转换不缩放、不裁切、不拉伸：原始像素以 `x=396`、`y=0` 放入 1600×1800 透明 RGBA 画布并编码为 lossless WebP；输出 `assets/portraits/sunna-portrait.webp` 的 SHA-256 为 `484675bf7f5bd91e3d7a5489a8842e69aebe22928e1070cac2e240ffe6efea2e`，alpha extrema 为 `0..255`、非零 bbox 为 `[399,2,1204,1799]`。
- 右侧 roster/avatar/headshot 是独立缩略图链：爱芮与千夏继续分别使用 374×512 `aria-card.webp`、`sunna-card.webp`，`.agent-card-image img` 继续要求 `object-fit:cover`；不得用完整 portrait 替换 roster card，也不得让 card 回流为主舞台/详情页前景。
- 两份美术均为 HoYoverse/米哈游受保护的游戏美术，不是开放授权；Fandom 来源按 fair-use 镜像记录，仅用于粉丝非商业资料展示并保留来源、转换与权利边界。爱芮官方角色页为 <https://zenless.hoyoverse.com/en-us/character/?id=161792>，千夏官方角色页为 <https://zenless.hoyoverse.com/en-us/character?id=161791>；爱芮官方 PC 合成图含人形与机器人，不作为单人物前景。
- 替换维护时必须重新核验来源文件 SHA、尺寸、RGBA/alpha、转换参数和真实 1600×1800 lossless WebP，并更新 `artifacts/aria-portrait-20260729/`、`artifacts/sunna-portrait-20260729/` 的来源/转换证据与对应截图；随后仅通过 `npm run build:stories` 生成 `stories.js`。`stories.html` 必须精确加载 `stories.js?v=sunna-portrait-1`，`character.html` 必须精确加载 `character.js?v=character-sunna-portrait-1`，不得联动修改 CSS cache token；`assets/portraits/aria-portrait.webp` 与 `assets/portraits/sunna-portrait.webp` 必须显式纳入 formal 指纹集合。该轮 `npm run test:stories` 的 108 项覆盖 aria、sunna、anby 普通 portrait、56 人前景与 card-only roster 合同。

## 2026-07-29 蕾米埃尔与现行 57 人维护合同

- 本节覆盖当前正式站状态；上文 2026-07-28 的 56 人、83/83 边界门禁、65 PNG 与测试总数仅是对应日期的历史证据，不代表现行总量。现行统一为 **57 角色、18 阵营、57 card、57 张完整透明 portrait、54 张 Default + 3 张 gallery fallback**。
- 54 张 Default 的来源必须拆分记录：其中 **53 张**是项目方确认获 Toastertjie 许可的映射资产，另 **1 张蕾米埃尔 Default** 不属于该授权包，来自米哈游官方 Wiki。不得表述为“54 张均获 Toastertjie 许可”。
- 蕾米埃尔的官方 Wiki 编号为 `2076`，英文名为 `REMIELLE`；她与达识结社的关系由官方角色页佐证，独立阵营资料待公布。尚未确认的等级、属性、特性、攻击类型、实装日期、生日、专属音擎、CV 等字段统一显示“待公布”。
- 蕾米埃尔的 card 与 portrait 均来自官方 `display-1` 透明站姿，只允许等比缩小；Default 来自官方 `mindscape-1`，只允许等比缩小并居中封装到透明画布。整个转换链禁止裁切、放大、拉伸或抠图。
- Stories 主舞台与 Character Hero 使用 portrait；roster、avatar、headshot 使用 card。蕾米埃尔的 `display-1` / `mindscape-1` 美术版权归米哈游，HOOXI 仅作粉丝非官方档案展示并保留官方 Wiki 来源与转换边界。Character Hero 仅使用单角色水平构图例外避免宽翼遮挡标题，不改变/裁切源资产；无需专属 CSS。
