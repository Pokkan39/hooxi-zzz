# HOOXI 全站设计系统合同

> 状态：批次 0 后唯一设计基线
> 生效日期：2026-07-27
> 适用范围：9 个正式公开路由（含 8 个档案页与 HOOXI PLAY）、内部编辑界面及后续专题页
> 权威性：视觉或交互实现与本文冲突时，以本文为准；历史设计稿、样板页与 `.hallmark` 记录仅作证据，不构成第二套规范。

## 1. 定位与边界

HOOXI 是 Hooxi 个人品牌下的《绝区零》**非官方剧情视频档案与角色关系导航站**。主任务是让用户按版本、角色、阵营和内容类型找到影像、理解前后关系、控制剧透并分享稳定链接。

- 正式档案是唯一内容真相；HOOXI PLAY 是可跳过的沉浸入口，不是访问门槛。
- 不冒充、不暗示隶属于米哈游、HoYoverse 或《绝区零》官方团队；非官方声明须在页脚与来源区稳定出现。
- 不复制官方 UI、导航结构、字体、图标、动效、色板或品牌文案；只研究任务层级、状态反馈和信息组织方法。
- 不扩张为全量 Wiki、数值攻略站、模型下载站、社区或必须依赖 AI 的产品。

## 2. Genre、主题来源与中心创意

### 2.1 Genre

**Cinematic archive utility / 凌晨录像档案工具。** 档案层以可读、可搜、可分享为先；电影感只在 Home、章节扉页与 PLAY 形成局部峰值。

### 2.2 Hallmark theme

- 全站默认：`theme: custom`，名称为 **Signal Workbench / midnight tape desk**。
- 仅当明确研究某种交互 DNA，且记录来源与批评性取舍时，可标 `theme: studied-DNA`。
- `studied-DNA` 只允许借用抽象关系，如“左主右辅”“切换后提交状态”“列表聚焦后背景退后”；不得复刻可识别的官方构图、组件皮肤或资产。

### 2.3 中心创意

**“凌晨录像店里的任务柜”：冷色夜场承载空间，暖色标签指向可查的真实档案。** 每屏只有一个主任务；VHS、标签纸、档案编号、CRT 只作为识别语法，不作为装饰堆叠。

## 3. 页面宏结构族

| 宏结构族 | 页面 | 固定顺序与主任务 |
|---|---|---|
| 电影式首页 `Cinematic Marquee` | Home | 4 图放映 → 直接查档 → 精选代理人 → 档案卷轴 → 来源/页脚；PLAY 仅为可跳过的安静次入口 |
| 路线控制台 `Route Console` | 主线、活动 | 标题与状态 → 筛选/剧透 → 版本或时间路线 → 条目 → 前后/关联 |
| 关系工作台 `Relation Workbench` | 角色与阵营目录 | 当前对象或导语 → 搜索/筛选 → 名册/阵营 → 默认角色详情深链；桌面可左主右辅，移动端改为顺序流 |
| 电影式角色档案 `Cinematic Character Dossier` | 角色详情 | 影画首屏 → 极简身份 → 单活动档案模块 → 来源与权利；默认 `?id=` 与 `#art` 使用同一完整文档 |
| 模块档案 `Record Stack` | 阵营、单条档案、养成 | 身份/封面 → 无剧透摘要 → 相关影像/资料 → 渐进披露 → 来源与核验 → 关联记录 |
| 专题放映 `Feature Reel` | 幕后、对谈、版本特辑 | 单一主题扉页 → 内容段落 → 媒体/来源 → 返回档案；不得替代常规档案结构 |
| 可选沉浸 `Optional Immersive PLAY` | 录像店 | 可跳过入口 → 空间/选择 → 真实档案预览 → 稳定档案 URL；失败直接回落档案，不套用档案页侧栏或共享 motion 层合同 |
| 内部工具 `Editor` | 编辑器 | 登录/状态 → 字段编辑 → 真实预览 → 校验/导出；不使用电影式遮挡影响操作 |

正式路由分族固定如下：

- `PUBLIC_ARCHIVE`：`index.html`、`mainline.html`、`stories.html`、`character.html`、`faction.html`、`events.html`、`behind-scenes.html`、`cultivate.html`。
- `PUBLIC_PLAY`：`tape-wall-sample.html`。它属于正式公开发布面，但不继承档案页共享侧栏与 motion 层数量断言。
- `INTERNAL_TOOL`：`editor.html`。它不计入 9 个正式公开路由，必须单独报告环境与鉴权问题。

空内容不造假模块：显示一句明确空状态与返回路径。无真实数据的功能不得用 `LOCK` 宫格占据主视觉。

## 4. 主题 Token

实现必须引用语义 token，不在组件内另造近似颜色。以下为唯一基线，均避免纯黑与纯白：

```css
:root {
  color-scheme: dark;

  --color-bg-stage: oklch(16% 0.018 255);
  --color-bg-base: oklch(20% 0.022 255);
  --color-surface-1: oklch(24% 0.028 255);
  --color-surface-2: oklch(29% 0.034 255);
  --color-surface-raised: oklch(33% 0.040 255);

  --color-text-1: oklch(94% 0.014 85);
  --color-text-2: oklch(79% 0.018 85);
  --color-text-3: oklch(63% 0.020 85);
  --color-line: oklch(72% 0.018 255 / 0.18);
  --color-line-strong: oklch(78% 0.024 255 / 0.32);

  --color-accent: oklch(84% 0.165 88);
  --color-accent-hover: oklch(89% 0.145 92);
  --color-accent-soft: oklch(84% 0.165 88 / 0.14);
  --color-cool: oklch(78% 0.105 177);
  --color-warm: oklch(72% 0.170 42);
  --color-danger: oklch(66% 0.205 28);
  --color-success: oklch(75% 0.135 158);
  --color-focus: oklch(86% 0.145 95);

  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --content-max: 1180px;
}
```

规则：强调色只用于主动作、当前状态和关键编号，建议不超过单屏视觉面积的 15%；正文不用强调色；危险、成功不得借用品牌黄表达。

### 4.1 角色页色彩层

- 角色色只在 `body.archive-character` / `archive/character-detail` 作用域生效，不写回 `:root`，不改变其他公开页或 Editor。
- 56 个角色的正常解析优先级固定为预计算 `agentXray[id].i → l → c`；每项须为可用 RGB 三元组，正常路径必须 56/56 覆盖且互不重复。
- `aria`、`sunna`、`nangong-yu` 虽无旧 gallery x-ray 记录，仍必须从已授权 Default 影画的离线结果持久化主题数据；不得以 faction 色代替正常数据。
- faction 色与固定 HOOXI accent 只允许作为损坏数据的最后安全回退；门禁必须证明 56 人正常路径没有进入该回退。
- 角色作用域变量至少包括 `--character-accent`、`--character-accent-rgb`、`--character-ambient`、`--character-on-accent`、`--character-page-bg`、`--character-surface`、`--character-surface-strong`、`--character-line`、`--character-text`、`--character-text-muted`。
- 角色色可驱动非语义背景、边框、按钮、标签、标题装饰与选中态；正文、来源、版权、错误、成功、警告和焦点可辨识度继续使用中性语义色，不随角色改变。

## 5. 字体、间距与字级

### 5.1 字体

- 拉丁展示：`Barlow Condensed`（OFL，自托管 WOFF2，按实际使用字重子集化）。
- 等宽元数据：`Space Mono`（OFL，自托管 WOFF2，仅编号、时间、状态和短标签）。
- 正文与中文：优先系统中文，不打包来源不明中文字体。
- 唯一精确例外：仅 Home 与 `Feature Reel` 的中文展示标题（Hero H1、各幕 H2、片尾主句）可使用系统仿宋/宋体栈 `"FangSong", "STFangsong", "Songti SC", "Noto Serif CJK SC", "SimSun", serif`；正文、按钮、导航、标签与其他控件继续使用共享 `--font-body`，不得外扩到其他 scope。

```css
--font-display: "Barlow Condensed", "Arial Narrow", "Segoe UI", sans-serif;
--font-body: "Segoe UI", "PingFang SC", "Microsoft YaHei UI", "Noto Sans CJK SC", sans-serif;
--font-mono: "Space Mono", "Cascadia Mono", "Consolas", monospace;
```

字体文件必须保留 OFL 许可证文本并本地托管；不运行时调用 Google Fonts 等第三方字体服务。当前拉丁子集与许可证统一存放在 `assets/fonts/`。中文标题不得强行使用只含拉丁字形的展示字体。

### 5.2 4pt 间距

唯一间距阶梯：`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px`。组件内部优先 8–16，区块间优先 48–96；禁止随手新增 10、18、22、30 等非阶梯值。

### 5.3 字体级别

| 级别 | 大小/行高 | 用途 |
|---|---|---|
| Display | `clamp(48px, 9vw, 112px) / .88` | Home/PLAY 单一主标题 |
| H1 | `clamp(36px, 6vw, 72px) / .95` | 页面标题 |
| H2 | `clamp(28px, 4vw, 44px) / 1.05` | 一级区块 |
| H3 | `22px / 1.2` | 模块标题 |
| Body L | `18px / 1.65` | 导语、摘要 |
| Body | `16px / 1.65` | 正文、控件 |
| Small | `14px / 1.5` | 辅助说明 |
| Meta | `12px / 1.35` | 编号、状态；可用等宽，不承载长文 |

正文最小 16px；移动端不得通过整体缩放规避重排。

## 6. 动效三级

| 级别 | 时长 | 允许用途 |
|---|---:|---|
| L1 即时反馈 | 120–180ms | hover、focus、按下、开关、颜色与 2–4px 位移 |
| L2 状态切换 | 240–480ms | 筛选结果、抽屉、标签切换、角色提交、列表聚焦 |
| L3 叙事过场 | 600–1200ms | 进店、章节扉页、录像带进入 CRT；只允许在 Home/PLAY/专题局部出现 |

统一缓动：退出/进入使用 `cubic-bezier(.22,1,.36,1)`；禁止无任务的循环漂移、闪烁、扫光和全卡 3D 倾斜。

首页 4 图 Hero 是唯一允许持续调度的公开页动效例外：只做 6.5–8 秒一次的交叉淡入，任一时刻仅一张活动；首张固定 `assets/hero/zzz-random-play-keyart.webp`。用户暂停、Hero hover、焦点位于 Hero、`document.hidden`、`prefers-reduced-motion: reduce` 任一成立时必须暂停，解除一个原因不得覆盖仍存在的其他暂停原因。

`prefers-reduced-motion: reduce` 下：L1 只保留颜色/边框；L2 近即时完成且无大位移；L3 使用静态海报或直接抵达结果；首页停在首张 Keyart，不自动轮换。不得锁滚动，不得把动画完成作为读取内容的条件。

## 7. 组件语法

组件按“角色 + 状态 + 可选变体”命名和组合，不按页面复制新组件：

```text
Component / role
├─ anatomy：固定组成
├─ state：default | hover | focus-visible | active | selected | disabled | loading | empty | error
├─ variant：最多 2–3 个有业务意义的变体
└─ content contract：必填字段、最大长度、缺失回退
```

核心组件：

- `SiteHeader`：品牌、一级导航、搜索、PLAY；不放重复入口。
- `ArchiveCard`：封面/回退、类型、标题、无剧透摘要、版本/日期、明确动作。
- `RecordRow`：高密度结果；结构与 `ArchiveCard` 共用状态和元数据语法。
- `FilterBar`：可清空、结果计数、移动端可折叠；筛选状态可感知。
- `SourceBlock`：来源类型、名称、核验日期、权利状态；详情页必须出现。
- `SpoilerGate`：默认遮挡，用户明确展开；不能只靠模糊造成不可访问文本。
- `EmptyState`：说明“为什么空”和“可去哪里”，不加假卡补版面。
- `Action`：主按钮每个视区最多一个；次按钮、文字链接层级明确。

斜切、标签角、硬阴影每个组件最多使用一种识别手法；正文容器保持规则矩形。

### 7.1 可验证文字预算与渐进披露

- 每页只允许一个 H1。Hero 首层最多一个导语、一个主动作和一个安静次入口；测试按语义节点数量检查，不按字符总数检查。
- 区块头首层只保留一个 H2 与至多一行说明，不得同时常显中文幕号、英文幕号、状态码和重复入口。
- 记录卡首层结构固定为：标题、至多一个必要分类/版本、一段两行摘要、一个主要来源动作；扩展元数据、关联记录、备用来源、核验状态与长说明进入原生 `<details data-archive-disclosure>`。
- 渐进披露内容必须保留在 DOM；URL Hash、搜索或筛选命中披露内目标时，脚本必须先展开全部祖先 `<details>`，再滚动并聚焦目标。
- 路由要求固定为：`mainline.html`、`stories.html`、`faction.html`、`events.html`、`behind-scenes.html`、`cultivate.html` 因已有扩展资料，必须至少有一个原生 `<details data-archive-disclosure>`；`character.html` 使用第 9.1.2 节的单活动 panel 合同，`index.html` 与 PLAY 不强制。无扩展内容时不得为通过门禁虚构空 `details`。
- 来源动作、非官方、无隶属、版权边界和精确素材署名不得因文字预算折叠、删除或降为仅 hover 可见。稳定节点使用 `[data-source-action]`、`[data-source-section]`、`#source` / `#sources`、`[data-unofficial-boundary]` 或 `.footer-disclaimer`，且声明节点本身必须可见；门禁不得在整页 HTML 中以宽泛 `source` 字样假绿。
- 稳定门禁使用 H1/H2 数量、直接子节点角色、`details[open]` 状态、来源节点与深链可见性等结构断言；禁止以整页字符总数作为通过条件。

## 8. 导航与移动规则

- 一级导航固定语义：主线剧情、角色与阵营、往期活动、养成、幕后·对谈；搜索常驻；PLAY 作为独立可选入口。
- 当前页必须有文本、形状或 `aria-current` 状态，不能只靠颜色。
- 桌面内容宽度上限 `1180px`；宽屏增加留白，不无限拉长正文。
- `<= 880px`：所有左右分屏改为自然纵向流；移除斜切接缝、覆盖式名册和非必要视差；首要操作在首屏可见。
- `<= 640px`：导航折叠为可键盘操作菜单；触控目标至少 `44×44px`；筛选可折叠但结果计数与清空入口可见。
- 不设置仅 hover 可达的信息或动作；Escape 只关闭当前浮层/返回 PLAY 上一状态，不劫持浏览器历史。

## 9. 差异许可与共享底线

### 9.1 每页允许差异

- Home/PLAY：可提高品牌光、使用 Display 字级和 L3 动效。
- 主线/活动：可使用不同路线标识与局部主题辅助色。
- 角色/阵营：可由对象主题色驱动一条高光、背景雾或选中线，但不得重定义全页 token。
- 幕后/专题：可使用更编辑化的图文比例。
- Editor：可提高密度并减少装饰，状态色遵守同一语义。

#### 9.1.0 精确 scope 约束：`home`

首页硬约束与第 4、6、7.1 节同级：

- **首页银幕固定 4 张登记片源。** Hero 稳定容器为 `#homeHeroArt`；顺序固定为 `assets/hero/zzz-random-play-keyart.webp`、`assets/gallery/miyabi/05.webp`、`assets/gallery/harumasa/04.webp`、`assets/gallery/aria/01.webp`。四条路径必须同源并位于 `/assets/`，不得替换为远程地址或未登记素材。普通模式按 6.5–8 秒交叉淡入，任一时刻只允许一张活动。
- **控件只保留页码与暂停。** 稳定目标为 `#heroCarouselIndex` 与 `#heroCarouselPause`；不得存在旧 `#heroCarouselPrev`、`#heroCarouselNext`、`#heroCarouselDots`、大圆点或其他上一张/下一张命中区。暂停按钮触控目标至少 `44×44px`，状态与可访问名称同步。
- **暂停采用原因集合。** `user`、`hover`、`focus`、`hidden`、`reduced-motion` 任一原因存在即停止调度；只移除实际解除的原因，不得因 `mouseleave` 等单一事件误恢复。
- **首页宏结构只有五段。** `Cinematic Marquee → Direct Finder → Featured Agents → Archive Reels → Source / Footer`；Direct Finder 使用稳定锚点 `#finder`。删除 `.home-lane-jump` sticky 分区栏、`.home-lane-card.more`、重复栏目按钮与七幕编号/英文幕号。
- **内部工具不嵌入公开首页。** `.home-page` 不得渲染 `[data-layout-editor-host]` 或把 editor 计入正式公开路线。
- **页面级 token 不得写入 `:root`。** 首页专属颜色只能挂在 `.home-page` 作用域，避免覆盖其他页面共享 token。

首页样式入口必须自包含其实际引用的字体 token；`font:` 简写不得引用未加载变量。

#### 9.1.1 精确 scope 例外：`archive/character-directory`

- `stories.html` 的公开桌面界面固定为图四三段式角色工作台：左列保留现有公开站点侧栏；中列为当前角色舞台，并常显“基础 / 技能 / 装备”三个档案入口；右列为代理人选择区，包含明确标题、当前结果计数与以人物图像为主的大卡网格。不得退回“左舞台 + 右侧 compact roster”两段式构图。
- 桌面三列必须在同一视口内同时可见、互不覆盖；站点侧栏、中部舞台、三个入口、右侧标题/结果计数与人物网格均须可命中。该页是桌面内容宽度上限 `1180px` 的精确例外，但不得以横向溢出或重叠换取同屏。
- 选择代理人后，中部舞台、三个档案入口、右侧选中状态、URL 与主档案动作必须同步；确认状态使用固定 HOOXI 选择色，对象主题色只驱动舞台氛围，不得替代确认语义或重定义全页 token。
- `<= 880px` 时三段改为页面自身的自然纵向流；不得保留内部纵向滚动容器、固定高度名册、覆盖式面板或横向溢出，浏览器文档必须是唯一滚动主体。
- 禁止复制《绝区零》官方 Logo、图标、原始资产、导航文案、完整组件皮肤或官方构图；非官方声明、来源节点与角色档案深链必须保留。本例外不得解释为放宽任何其他 scope。

#### 9.1.2 精确 scope：`archive/character-detail`

- 正式主链统一为 `character.html?id=<id>`；首页、stories 与阵营页不得主动生成 `#art`。Hero 必须直接显示角色背景影画、完整前景 portrait、返回入口、角色名、至多 2–3 个身份字段与档案 CTA；背景影画桌面使用 `cover` 铺满首屏，移动端在自然文档流中使用 `16:9` 容器并以 `cover` 铺满，展示层边缘允许裁切；前景 portrait 始终使用 `contain` 完整展示。该展示规则不改变源素材转换时禁止裁切、拉伸或抠图的合同，也不改变 Stories 舞台及 roster / avatar / headshot 的独立素材链。默认入口与 `#art` 共享同一完整文档，不得添加 `character-art-view` 等隐藏档案模式。
- Hero 后固定为一个 Hash 驱动的单活动档案视图：顶部四个 Tab 顺序为 `media / lore / profile / related`，四个对应 panel 必须全部保留在 DOM，但任一时刻只能有一个 panel 可见、可交互。
- Tab 使用标准可访问状态同步：活动 Tab `aria-selected="true"` 且 `tabindex="0"`，其余 Tab `aria-selected="false"` 且 `tabindex="-1"`；每个 Tab 的 `aria-controls` 必须准确指向 panel。非活动 panel 同时设置 `hidden` 与 `inert`，活动 panel 同时移除二者。
- 默认无 Hash 时活动项为 `media`。点击 `lore / profile / related` 必须更新活动 panel、URL Hash、浏览器历史与焦点；`history.back()` / `history.forward()` 必须恢复同一状态。Tab 键盘支持左右方向键循环移动，并支持 `Home` / `End`；键盘切换后焦点、roving tabindex、Hash 与可见 panel 同步。
- 兼容 Hash 归属固定为：`#art` 与 `#dossier` 激活 `media`，`#story` 激活 `lore`，`#growth`、`#build`、`#combat` 激活 `profile`；兼容 Hash 可以保留原值，但不得把四个 panel 同时展开。`#media / #lore / #profile / #related` 直接激活同名 panel。
- 来源、精确素材署名、权利状态、非官方与无隶属声明必须位于 Tab/panel 之外并持续可见；切换任何 Tab 或通过旧 Hash 进入时均不得隐藏、折叠或移入非活动 panel。
- 影画解析统一为 53 张获准 Steam Workshop `Default` WebP，以及 `norma`、`pyrois`、`velina` 的现有本地 gallery fallback；不得引入 Partial、Full 或其他变体，不得热链。解析结果必须通过稳定的 `data-character-art-source` 暴露实际来源类型/路径；Default 页面显示 Toastertjie 与 Steam Workshop 3491187965 的精确署名，gallery fallback 不得显示 Default 作者署名。
- Hero 前景不得遮挡标题、身份、档案 CTA 或返回按钮，交互控件必须可通过真实命中测试触达；卡图回退不得以大面积不透明矩形覆盖主画面。角色色遵守第 4.1 节，只驱动非语义装饰与状态；正文、来源与权利边界保持中性高对比。触屏与 `prefers-reduced-motion: reduce` 使用静态回退，不把动态效果作为查看影画或档案内容的条件。

### 9.2 必须共享

全站必须共享：颜色语义、字体栈、4pt 间距、字级、焦点样式、按钮层级、卡片/列表状态、来源块、剧透规则、非官方声明、导航名称、移动断点、动效三级和性能/无障碍门槛。

## 10. 反 AI 模板硬规则

1. 禁止“深色底 + 满屏发光渐变 + 每块玻璃胶囊”的默认 AI SaaS 皮肤。
2. 禁止把所有内容做成同尺寸圆角卡片；优先使用路线、列表、模块栈和真实内容比例。
3. 禁止无业务意义的渐变描边、彩色光球、网格背景、随机噪点、持续扫描线和 hover 浮起。
4. 禁止四处使用大圆角、胶囊标签、emoji 图标或同一种斜切；识别符号必须克制。
5. 禁止虚构统计、评价、在线状态、LOCK 模块或占位内容制造“丰富感”。
6. 禁止每段都用 eyebrow + 大标题 + 两行说明的重复模板；页面节奏必须由任务决定。
7. 禁止营销套话和伪技术文案；按钮写用户动作，空状态写真实原因。
8. 禁止为“像游戏”复制官方 UI；HOOXI 必须能在去掉游戏资产后仍被识别。

## 11. 性能与可访问性门槛

- 根地址初始路径不加载完整 GLB、长序列帧或非必要视频；重资产仅在用户选择 PLAY/专题后加载。
- 关键文字、导航、搜索和档案链接必须为 DOM；Canvas/WebGL 不承载唯一内容或唯一操作。
- 首屏目标：移动网络下 LCP ≤ 2.5s、CLS ≤ 0.1、INP ≤ 200ms；未达标不得用视觉效果解释。
- 首屏关键图片提供尺寸与合适格式；非关键图片懒加载；页面不可依赖第三方运行时媒体代理。
- 正文与背景至少 WCAG AA 4.5:1，大字 3:1；交互边界和焦点指示至少 3:1。
- 可交互目标至少 24×24 CSS 像素，或与最近同类目标中心距不小于 24px（WCAG 2.2 SC 2.5.8 间距例外）。
- 全站键盘可达、焦点顺序符合视觉顺序；图像有用途明确的替代文本，纯装饰使用空 `alt`。
- 表单有可见标签与错误说明；状态变化使用适当的 ARIA，不能只用颜色或动效表达。
- 200% 缩放和 320px 宽度下不得横向滚动正文；PLAY/WebGL 失败时必须保留“直接浏览档案”。

## 12. Hallmark app scope 与 stamp 约定

- **Scope**：M0 全站合同使用 `scope: "app"`；后续页面施工使用精确范围，如 `home`、`archive/mainline`、`archive/character-detail`、`play`、`editor`。禁止用模糊的 `global` 掩盖跨页扩张；跨 scope 变更须说明共享 token/组件影响。
- **Stamp 时机**：只有实际落地并通过该 scope 验证后才记录；讨论稿、未实现方案和单纯换色不得盖章。
- **Stamp 最小字段**：`date`、`scope`、`macrostructure`、`theme`、`brief`；`studied-DNA` 另须有 `studied: true`、`source`、`critique`，并写明“借什么/拒绝什么”。
- **命名**：宏结构使用稳定英文名，主题只允许 `custom` 或 `studied-DNA`；不得用“inspired”回避来源记录。
- **权威关系**：stamp 是实施日志，不得覆盖本文；若方案改变合同，必须先更新并批准 `design.md`，再施工和盖章。
- **发布检查**：无 app scope、无 reduced-motion/移动/键盘验证，或 studied-DNA 缺来源与 critique 时，不得视为 Hallmark 完成。

---

# 附录 A：ZZZ 角色页视觉致敬实施记录

> 本附录是第 9.1.1 节「精确 scope 例外」的实施细节与取证记录，不构成第二套规范；与正文冲突时以正文为准。

## 6b. 角色页影画与边界实施记录

本附录保留角色素材、署名与门禁取证；旧版由 `zzz-ui.js` 注入三栏/名录/HUD 的首屏方案已被第 9.1.2 节废止，不再构成实现合同。新结构必须作用域限定 `.archive-character`，并以影画首屏、完整下方档案和角色色层为准。

### 配色来源与限定

**以下色值没有一个是米哈游官方公布的色板。** 两个独立来源互证只能说明与游戏内
渲染一致，不能标注为官方色。若日后拿到官方值，改 `design.css` 第 12 节
的 6 个变量即可。

| 用途 | 取值 | 依据 |
| --- | --- | --- |
| 酸性荧光黄绿 | `#D4E00A` | 截图采样均值 `#B1C00F` + 社区 Wiki `#D7F300`，取中间值 |
| 电 | `#33B6FE` | 社区 Wiki |
| 物理 | `#EDCC2C` | Wiki `#EDCC2C` / 截图实测 `#EDCE1C` |
| 以太 | `#FE427E` | 社区 Wiki |
| 火 | `#FF5623` | Wiki `#FF5623` / 截图实测 `#EC5B25` |
| 冰 | `#95EAE9` | Wiki `#95EAE9` / 截图实测 `#99CAE4` |
| 风 | `#A6C5FD` | 社区 Wiki |

**电是蓝色，物理才是黄色。** 这个映射反直觉，容易按直觉写错。
子属性复用父色：烈霜/霜锋→冰、玄墨→物理。

### 风格定位的边界

官方唯一明确的整体定位是制作人李振宇说的「都市（型）艺术风格」，以及美术团队
先看阵营并排剪影辨识度的方法论。两点不要写错：

- **官方主动否认了《女神异闻录5》参考链**，所以不能写「致敬 P5 风格」。
- 「涂鸦街头/赛博朋克/Y2K」查不到官方来源，是社区与设计师观察。VHS/旧电视有
  实证但支撑点在内容主题（录像店 Random Play 是主枢纽），不是官方美术关键词。

### 不做像素级摹写

图标（属性、rank、星标）全部用内联 SVG 重画的通用符号，不裁贴官方 UI 素材原件。
保留 HOOXI 自己的品牌标识与非官方声明——完整摹写官方界面会削弱非官方边界。

装饰文案必须用本站自己的标识（如 `HOOXI FAN ARCHIVE · UNOFFICIAL`），
**不照抄官方界面上的原文标语**，否则会让访客误认为这是官方界面。

页脚版权归属须覆盖页面上实际出现的全部官方美术类型，措辞按各页实际素材写，
不用一句话套全站。新增其他类型官方素材时要同步扩写。

**注意页面内容多为 JS 渲染，只看静态 HTML 会漏掉素材。** 核验时须在浏览器里
实际统计 `img` 与背景图。9 个正式公开路由按实际渲染素材声明：

| 页面 | 官方素材范围 | 声明须涵盖 |
| --- | --- | --- |
| 首页 | 4 张本地 Hero 片源、精选角色立绘、档案截图 | 立绘、影画与截图 |
| 角色页 | 立绘/头像、阵营徽记、Default 或 gallery 影画 | 立绘、影画与阵营徽记 + 精确素材署名 |
| 阵营页 | 立绘、阵营徽记 | 立绘与阵营徽记 |
| 主线 | wiki 图、视频封面 | 截图与封面 |
| 活动 | wiki 活动图 | 活动图 |
| 幕后 | wiki 图 | 截图 |
| 剧情 | 角色立绘 | 立绘 |
| 培养 | 45 个 `channel=cultivate` 候选页由指南页 `wikiId=698` 与 44 个素材页组成；指南内含 23 条 FAQ，44 个素材封面位于 `wiki/cultivate/`，不以 `materials` 目录名替代实际类型 | 养成图 |
| PLAY | 本地角色立绘与录像店自制界面 | 立绘；同时保留非官方、无隶属与来源声明 |

档案族页面若继续使用 `assets/ui/` 官方 UI 背景素材，该类型也必须计入各页实际素材
声明；PLAY 独立按其真实资产核验，不自动继承档案族声明。

### 分享卡身份

**`og:title` 与 `twitter:title` 必须自带「粉丝非官方」。** 正文页脚声明再完整也
兜不住分享场景：多数平台的预览卡只显示标题与配图，描述常被截断或不显示，而配图
往往是官方立绘——不写身份就会被当成官方页面。

9 个正式公开路由均有 `og:type` / `og:site_name` / `og:title` / `og:description` 四项与
`twitter:card` / `twitter:title` / `twitter:description` 三项，`og:site_name`
统一为「HOOXI 绝区零档案（粉丝非官方）」；PLAY 可使用独立标题，但身份声明不得减负。

角色页与阵营页的 title 由 JS 动态生成，所以 `character.js` / `faction.js` 里
同步更新 og 与 twitter 标签，让分享具体角色时卡片带上角色名而非通用文案。
改这两个文件后须提升 HTML 里的 `?v=` 版本号，否则浏览器会继续用缓存的旧 JS。

### 边界门禁

上述规则已固化为可复运行的检查，不再依赖人工逐页翻：

```
npm run test:boundary            # 等价于 node scripts/check-unofficial-boundary.mjs
```

**它已串入 `npm test`（`test:content`）**，所以标准检查流程会自动跑，不用靠人
记得单独执行。实测注入违规后 `npm test` 退出码为 1 并报出问题页，阻断有效。

检查八项：每页非官方与无隶属表述、来源声明、版权归属覆盖该页实际素材类型、
不得自称官方、`og:title` 与 `twitter:title` 自带非官方、`og:site_name` 含非官方、
装饰文案不抄官方原文标语、零外部媒体热链；另确认公开档案 8 页、PLAY 1 页与 editor 内部工具互不混计。

历史七类缺陷注入验证继续保留；批次 0 新增的来源声明、9 页路由族与 editor `noindex`
属于目标红灯，须在后续产品批次实现后再补通过证据，不得在本批次伪造绿色结论。

`ASSET_EXPECT` 表需要人工维护：页面内容多为 JS 渲染，静态检查读不到，
新增其他类型官方素材时要同步更新该表与对应页脚声明。

**这张表过期时静态门禁会漏判**，已实测确认：给幕后页加一张官方立绘、声明仍
只写「截图」，静态门禁判定 PASS 放过。该盲区由运行时门禁按实际渲染结果反查
补齐（见下），所以两个门禁都要跑。

### 运行时门禁

静态门禁读不到 JS 渲染的内容，这是它的失效面：运行时注入的热链、自称官方文案
都能绕过。实测已证实——在 `zzz-ui.js` 里注入热链图片与「本站为绝区零官方网站」，
静态门禁判定 PASS 放过。

补充脚本在真实浏览器里复验：

```
npm run test:boundary:runtime    # 需本地静态服务在 127.0.0.1:8000 运行
```

它**不串入 `npm test`**：要起浏览器、依赖本地服务，跑一次数分钟。放在发布前
或改动 JS 渲染逻辑后单独跑。

### 全量核查

日常运行时层覆盖 9 个正式公开路由、`#art` 兼容样本、gallery 回退样本与 editor 内部属性；
全量层再遍历 56 个角色和 17 个阵营，逐个确认素材与声明没有个体漏网：

```
npm run test:boundary:all       # 82 个实例：9 公开路由 + 56 角色 + 17 阵营
```

角色页必须同时满足：目标影画可见、四个档案 panel 全部保留在 DOM 且任一时刻仅一个活动 panel 可见/可交互、无 `character-art-view` 独立隐藏模式，且不再显示旧三栏/名录/HUD。
`stories.html` 继续满足全站至少一个真实原生 `details[data-archive-disclosure]` 的要求，落点为名单内现有搜索/筛选披露，不在舞台底部追加内容。
53 人解析 `assets/mindscape/default/<id>.webp`；`norma`、`pyrois`、`velina`
解析本地 gallery 首图回退。

`agent-xray.js` 当前已有 53 人记录并包含上述 3 个 gallery 回退角色；缺的是已有 Default
影画的 `aria`、`sunna`、`nangong-yu` 预计算主题数据。目标合同要求后续为这 3 人补齐
离线主题结果，使全 56 人都能按 `i→l→c` 独立解析；批次 0 只让门禁清晰报红，不伪造数据。

检查渲染完成后的：零外部域名请求、非官方/无隶属/来源/版权表述、无自称官方、
`og:title` 与 `twitter:title`（含 JS 动态更新的）、图片全部本地托管，以及路由族专属结构。

静态与运行时门禁互补：静态层快、能查措辞与路由集合；运行时层慢、能查动态注入、
真实素材使用、角色影画回退和首屏/档案共存。批次 0 不记录未运行的通过结论。

运行时门禁经缺陷注入验证：注入 JS 运行时热链图、运行时写入自称官方文案、
把动态 og 标题的「非官方」去掉，3/3 全部拦下。这三类静态门禁都抓不到。

它还补齐了 `ASSET_EXPECT` 过期这个盲区：从实际渲染的图片路径反推该页用了哪几类
官方素材（`portraits`→立绘、`icons`→徽记、`gallery`→影画、`covers`→封面、
`materials`→材料、`wiki`→截图），再比对页脚声明是否覆盖。这样新增素材类型会被
自动发现，不依赖人工维护表。实测三种场景（幕后页加立绘、剧情页加徽记、
培养页加影画，均不改声明）静态门禁全部漏过、运行时门禁 3/3 抓到并指明缺哪一类。

统计范围含 CSS 背景图，不只是 `img`——角色页的影画是背景层，只扫 `img` 会漏掉。

**双向检查**：除了「声明缺了什么」，还查「声明多了什么」。声明里写着页面上不存在
的官方素材类型，属不准确的版权陈述，也说明改版后忘了更新声明。此前两个门禁都只
查缺少、查不出多余，实测放过了两处真实过期声明：首页声明写「立绘与影画」但只用
`portraits`、培养页写「材料与养成图」但实际是 45 个 `channel=cultivate` 候选页中的指南页 `698` 加 44 个素材页，只有 44 个素材封面位于 `wiki/cultivate/`；指南内的 23 条 FAQ 不另计为素材。
两处均已改正。反向检查经缺陷注入验证 3/3 拦下。

别名词只在其父类型缺席时才算过期，避免把「活动图」这类合法别名误判。

`wiki` 类在各页声明里有合法别名（活动页写「活动图」、培养页写「养成图」），
脚本内 `ALIAS` 表已登记；新增别名措辞时要同步更新，否则会误报。

### Windows 上跑 Playwright 脚本的坑

Windows + MSYS2/Git Bash 下，`playwright-core` 加载时会设置 `process.title`，
触发 libuv 断言并在**加载阶段**就崩溃：

```
Assertion failed: process_title, file src\win\util.c, line 412
```

是否触发取决于父进程 title 长度，所以表现为间歇性——同一脚本有时能跑、有时崩，
容易误判成"启动浏览器失败"。实际连 `require('playwright')` 都到不了。

规避写法（`scripts/` 下三个脚本都已应用）：

```js
process.title = 'pw';
const { chromium } = await import('playwright');
```

必须用动态 `import`。静态 `import` 会被提升到文件顶部，`process.title` 赋值
来不及生效。

### 不凭空造数据

参考图等级条上是玩家等级「60」，但档案站没有等级概念，写死数字等于编造数据。
该位置改放 `specialty`（职业）这个真实字段。
