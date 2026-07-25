# HOOXI 媒体与来源政策

> 版本：M1  
> 核验基准日期：2026-07-23  
> 适用对象：正式档案事实、视频链接、封面、角色/阵营图片、引用与玩家整理内容

## 1. 基本原则

HOOXI 是非官方整理站。**事实可信度、展示权利与文件可用性必须分别判断**：来源权威不等于允许转载；能下载不等于能发布；第三方整理不能覆盖官方事实。

正式记录必须保存来源类型、发布者、原始链接、核验日期和权利状态。本站只发布结构化事实、原创短摘要、获准本地资产、官方嵌入或普通外链，不镜像外站正文和媒体库。

## 2. 来源优先级

同一事实冲突时按下列顺序核验；同级来源优先采用发布时间更晚、内容更具体的原始页面，并在 `rightsNote` 记录冲突和取舍。

1. 《绝区零》官方站、HoYoverse / 米哈游官方公告与产品页。
2. 官方 HoYoLAB / 米游社账号与帖子。
3. 已核验账号身份的官方 Bilibili / YouTube 公共页面。
4. 米哈游官方百科或官方 Wiki。
5. 有编辑责任的第三方数据库、媒体或 Wiki。
6. 玩家攻略、帖子、视频、表格与社区整理。

转载官方内容的第三方页面仍按第三方处理；无法确认账号身份时不得标记为官方。

## 3. `media-catalog.js` 最小字段

媒体记录使用批准后的统一 schema：

```js
{
  id,
  title,
  mediaRole,          // full-story / chapter-trailer / version-pv / lore-short / agent-demo / ep / interview
  platform,           // official-site / hoyolab / bilibili / youtube / local
  videoUrl,
  canonicalUrl,
  cover,
  coverOriginalUrl,
  coverWidth,
  coverHeight,
  sourceType,         // official-video / official-article / fan-archive / third-party
  publisher,
  publisherId,        // 可选；官方账号有稳定数字 ID 时保存
  bvid,               // 可选；Bilibili 详情页的稳定视频 ID
  officialDescription,// 可选；仅保存已核验的官方短详情，不镜像长文
  totalDurationSeconds,       // 可选；投稿总时长
  primaryPartDurationSeconds, // 可选；本站索引的中文 P1 时长
  isReprint,          // 可选；由 copyright 判断原创/转载，不能表达 no_reprint
  noReprint,          // 可选；由 rights.no_reprint 单独记录禁止转载标记
  citations,          // 可选；支持身份、详情和权利判断的原始 URL 列表
  publishedAt,
  sourceCheckedAt,
  version,
  spoilerLevel,
  rightsStatus,       // approved / fan-index-use / unresolved / custom-fallback
  rightsNote
}
```

- `canonicalUrl` 必须指向原始详情页，不得填聚合搜索页或图片代理。
- `coverOriginalUrl` 只记录实际使用过的外部原封面来源；`custom-fallback` 没有外部原封面时必须留空，不能用文章页冒充图片来源。
- `sourceCheckedAt` 是编辑者最后打开原始来源并确认内容的日期，不得用抓取时间或文件修改时间替代。
- `platform` 描述承载渠道；`sourceType` 描述内容责任类型。官方 B 站视频应为 `platform: "bilibili"` + `sourceType: "official-video"`。
- 官方 B 站项必须保存 `bvid`、`publisherId`、`isReprint`、`noReprint` 与 `citations`；当前唯一认可的《绝区零》官方投稿账号为发布者“绝区零”与 UID `1636034895`。`isReprint` 由 `copyright` 判断原创/转载，`noReprint` 由 `rights.no_reprint` 单独判断，二者不得互相替代。`videoUrl` 和 `canonicalUrl` 都使用无分享参数的 `https://www.bilibili.com/video/<BVID>` 详情页。
- 正式页面只引用 `mediaIds`；迁移期可保留旧 `video`、`cover`、`wikiUrl` 读取兼容，但不得继续生成第二套媒体事实。

## 4. 权利状态

| `rightsStatus` | 含义 | 允许行为 |
|---|---|---|
| `approved` | HOOXI 原创、明确许可或已有可验证授权覆盖本站用途 | 可按授权范围本地化、压缩和发布，并保留证据与署名 |
| `fan-index-use` | 仅确认适合非官方索引/缩略展示，具体边界写入 `rightsNote` | 可链接或官方嵌入；只有 `rightsNote` 明确允许缩略本地化时才保存封面，不镜像原视频 |
| `unresolved` | 作者、许可或转载边界尚未确认 | 不发布外部媒体文件；保留外链并使用 HOOXI fallback |
| `custom-fallback` | HOOXI 自制的非官方档案封面 | 可本地发布；不得包含官方 Logo、角色立绘、游戏截图或近似官方卡面 |

“官方公开发布”不自动等于 `approved`。没有明确许可或可说明的索引用途时，使用 `unresolved` + HOOXI fallback。

## 5. 封面规则

### 5.1 可本地化条件

本地封面必须满足以下任一条件：

- `rightsStatus: "approved"`，且 `rightsNote` 记录权利依据；或
- `rightsStatus: "fan-index-use"`，且 `rightsNote` 明确记录允许非官方索引缩略使用的依据与限制；或
- `rightsStatus: "custom-fallback"`，资源由 HOOXI 自制。

处理时只做必要的尺寸压缩、格式转换和安全裁切；不得去水印、伪造官方标识或改变作品含义。文件使用稳定、语义化相对路径，正式页不得热链第三方图片。

**精确例外（仅 UID `1636034895`）：** 可将该官方账号原创投稿（`isReprint: false`）的 Bilibili 投稿索引缩略封面转为本地 WebP，路径限定为 `assets/covers/official/bilibili/`，只用于指向原详情页的非官方索引缩略展示。必须保留 `coverOriginalUrl`、BVID、UID、原详情页引用、独立的 `noReprint` 和 `rightsNote`；不得去水印、不得下载或镜像视频。`noReprint: true` 表示投稿明确设置未经作者授权禁止转载，必须记录本地缩略展示的撤下风险；`noReprint: false` 只表示该开关未设置，不等于 HOOXI 获得授权。此例外不等于授权，`rightsNote` 必须明示“未获得转载或再分发授权”；转载投稿、其他 UID、正文图、视频与音频均不在例外内。若因 412/352 等风控无法核验原缩略 URL、`copyright` 或 `rights.no_reprint`，必须停止采集并保持 pending，不得猜测或把既有 fallback 伪装成官方缩略图。

### 5.2 HOOXI fallback

无法确认外部封面权利时，使用 HOOXI 自有 fallback：

- 由站内 token 生成非官方档案牌，只包含栏目、原创短标题、档案编号和 `HOOXI ARCHIVE`。
- 不使用官方 Logo、角色立绘、游戏截图或近似官方 UI 构图。
- `coverOriginalUrl` 可保留原缩略来源供维护核验，但公开页只加载本地 fallback。
- fallback 的 `rightsStatus` 为 `custom-fallback`；原媒体事实仍保留自己的 `sourceType`、发布者和原始链接。

## 6. 摘要、引用与署名边界

- 名称、日期、版本、阵营、角色关系等事实仍须标来源以便复核。
- 简介、角色印象和剧情摘要由 HOOXI 重写；禁止拼接改写官方百科、第三方 Wiki 或玩家长文。
- 必要引用必须短、紧邻署名和原始链接，不得用多段引用替代原创内容。
- 自译须标“非官方翻译”，不得覆盖官方译名。
- 第三方与玩家观点必须显示来源类型，不得包装为官方结论。
- 嵌入或链接视频不表示 HOOXI 拥有视频。
- 收到有效撤下请求时，先下线相关本地媒体或嵌入，再核验争议。

## 7. 获取与运行时限制

- **禁止公开页面运行时抓取**官方站、HoYoLAB、Bilibili、YouTube、官方百科、第三方 Wiki 或玩家页面。
- **禁止第三方图片/视频代理、解防盗链服务、公共 CORS 代理和来源不明 CDN 转发。**
- 核心内容不得依赖外站 DOM、临时签名 URL、Cookie、账号会话或抓取接口。
- 采集只在编辑/维护阶段人工核验或通过获准的离线流程完成；发布产物必须是本地结构化数据、合规本地资产、官方嵌入或普通外链。
- 官方 B 站维护脚本必须串行、低频、可恢复且不下载视频；遇 412/352 或工具明确风控时立即保存进度并停止，不以 sleep 重试循环、账号登录、代理或其他方式绕过。
- 不规避登录、地区限制、付费墙、robots、访问频率限制或技术保护措施。
- **当前交付口径（2026-07-24，用户确认暂时放弃官方直达）：** 公开站不以官方 B 站空间/封面直达为交付条件。主线 / 活动 / 幕后继续使用已迁入的本地封面，卡片优先进入站内栏目页；有已核验 `sourceUrl` / `wikiUrl` 时可外链资料来源。官方空间列表仍受 412 风控，维护脚本可低频复探但不得循环撞墙。**不得**把未核验 BVID、猜测链接、热链官方缩略图或“已接官方直达”文案伪装成已完成能力；日后若要恢复官方直达，须有可核验 BVID 清单或 412 解除后的新证据，并经用户再授权施工。

## 8. 发布前核验

每条媒体记录发布前必须确认：

1. `id` 唯一，所有 `mediaIds` / `sourceIds` 引用存在。
2. `mediaRole`、`platform`、`sourceType`、`publisher` 和 `canonicalUrl` 完整且互相一致。
3. `publishedAt`、`sourceCheckedAt` 为有效日期；变动性事实接近发布日期时已复核。
4. `rightsStatus` 与实际展示方式一致，`rightsNote` 能解释本地化或 fallback 决定。
5. 本地封面文件存在，声明宽高为正；外部封面不作为正式页唯一资源。
6. 第三方/玩家内容有可见来源，观点未写成官方事实。
7. 页面不含运行时抓取、第三方代理、临时热链或需要登录的核心资源。
8. 非官方边界与原始播放/资料入口可见。

## 9. 发布阻断条件

出现任一情况必须阻断相关记录或媒体发布：

- PV、角色展示或版本宣传被误标为 `full-story`。
- 关键事实只有无法追溯的截图、转述或聚合页，且无法交叉核验。
- `sourceCheckedAt` 缺失，或将未来/未官宣信息当作已确认事实。
- `rightsStatus: "unresolved"` 的外部图片、视频、音频、模型或字体被保存为正式本地资产。
- 使用第三方代理、绕过防盗链、临时签名 URL 或运行时抓取支撑正式页面。
- 转载内容过长、缺少必要署名、移除水印，或可能让用户误认 HOOXI 为官方。
- 玩家整理未标注为玩家观点，攻略数据未说明适用版本。
- 权利方已提出撤下要求但尚未完成下线与核验。

被阻断时可以发布不含争议媒体的 HOOXI fallback 与已核验事实；不得以“先上线后补来源”绕过本政策。
