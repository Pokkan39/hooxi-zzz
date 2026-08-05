# HOOXI 全站设计系统合同

> 状态：唯一设计基线
> 生效日期：2026-08-05（初版 2026-07-27）
> 适用范围：9 个正式公开路由（8 个档案页 + HOOXI PLAY）、内部编辑界面及后续专题页
> 权威性：视觉或交互实现与本文冲突时，以本文为准；历史设计稿、样板页与 `.hallmark` 记录仅作证据，不构成第二套规范。
> 事实一致性：本文中的实体数量、素材数量与路由集合必须与门禁断言一致。二者不一致时以门禁实测为准，并立即修正本文，不得让实现去迁就过期的合同数字。
> 运维细节：门禁命令、缺陷注入取证、脚本环境坑位见 `docs/HOOXI-GATE-OPERATIONS.md`。该文件是实施手册，不构成第二套设计规范。

## 1. 定位与边界

HOOXI 是 Hooxi 个人品牌下的《绝区零》资料档案站。主任务有两条：让用户按版本、角色、阵营和内容类型找到影像并理解前后关系；让用户能查到敌人、音擎、材料、地图、委托这类具体条目的实际数据。两条主任务同级，不得以"档案站不是 Wiki"为由拒绝条目查询能力。

- 正式档案是唯一内容真相；HOOXI PLAY 是可跳过的沉浸入口，不是访问门槛。
- 不冒充、不暗示隶属于米哈游、HoYoverse 或《绝区零》官方团队；非官方声明须在页脚与来源区稳定出现。这一条不因任何视觉或内容目标而放宽。
- 官方素材、属性色、信息组织方式与条目结构可以复用，前提是来源可追溯且不违反第 1.1 节。视觉上贴近官方语言不构成冒充，页脚声明才是边界所在。
- 允许覆盖全量条目内容。条目密度不是风险，条目查不到才是问题。

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
| 电影式角色档案 `Cinematic Character Dossier` | 角色详情 | 影画首屏 → 极简身份 → 单活动档案模块；默认 `?id=` 与 `#art` 使用同一完整文档 |
| 模块档案 `Record Stack` | 阵营、单条档案、养成 | 身份/封面 → 无剧透摘要 → 相关影像/资料 → 渐进披露 → 关联记录 |
| 专题放映 `Feature Reel` | 幕后、对谈、版本特辑 | 单一主题扉页 → 内容段落 → 返回档案；不得替代常规档案结构 |
| 可选沉浸 `Optional Immersive PLAY` | 录像店 | 可跳过入口 → 空间/选择 → 真实档案预览 → 稳定档案 URL；失败直接回落档案，不套用档案页侧栏或共享 motion 层合同 |
| 内部工具 `Editor` | 编辑器 | 登录/状态 → 字段编辑 → 真实预览 → 校验/导出；不使用电影式遮挡影响操作 |

正式路由分族固定如下：

- `PUBLIC_ARCHIVE`：`index.html`、`mainline.html`、`stories.html`、`character.html`、`faction.html`、`events.html`、`behind-scenes.html`、`cultivate.html`。
- `PUBLIC_PLAY`：`tape-wall-sample.html`。它属于正式公开发布面，但不继承档案页共享侧栏与 motion 层数量断言。
- `INTERNAL_TOOL`：`editor.html`。它不计入 9 个正式公开路由，必须单独报告环境与鉴权问题。

### 3.1 未定性页面

`agents.html` 与 `gallery.html` 存在于仓库根目录，但不属于上述任何一族：它们不被任何正式路由链接，使用独立数据源（`assets/data/agents.json`、`assets/data/wallpapers.json`），且不加载全站样式与导航。

在产品定性完成前，它们**不计入正式公开路由**，不纳入正式站门禁，也不得从正式导航暴露。定性只有两条合法出路，必须由项目负责人明确选择后才可施工：

- **并入**：接入 `SiteHeader`、共享 token 与主数据链（`data.js` → `agent-enrichment.js` → `agent-catalog.js`），并登记为正式路由，同步扩充门禁实例数与素材声明。
- **降级**：移入 `prototype/`，从公开面移除。

不得让它们长期停留在"公开可访问但不被管理"的第三状态。

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

### 4.1 唯一来源规则

token 的价值只在"改一处、全站生效"。以下三条与第 4 节同级：

- **页面基色只有一个。** 全站页面底统一取 `--color-bg-stage`，不得按页另定近似基色。层次由 `--color-surface-1 / -2 / -raised` 的表面抬升表达，不由"每个区块自带渐变底"表达。
- **区块不自带背景。** `section` 级不得使用 `linear-gradient` / `radial-gradient` / `repeating-linear-gradient` 铺底来制造分区。相邻区块之间靠间距、线条与卡片边界区分，不靠底色切换。这是消除区块硬接缝的硬规则。
- **禁止页内覆盖层。** 页面不得用内联 `<style>` 配合 `!important` 就地改写共享 token 或共享组件外观。页面差异只能走第 9.1 节授权范围。违反这条会使全站调色不可预测，属实现缺陷而非风格选择。

新增语义 token 必须先改本文再落地；实现中出现本文未登记的 token 名，视为违反合同。

### 4.2 布局语义 token

栅格与外壳量纲同属设计合同，不得按页硬编码：

```css
:root {
  --shell-aside: 340px;
  --shell-gap: 24px;
  /* 主栏为派生值：--content-max - --shell-aside - --shell-gap = 816px */
  --shell-main: calc(var(--content-max) - var(--shell-aside) - var(--shell-gap));
}
```

- 三个值均落在第 5.2 节 4pt 阶梯上，且与 `--content-max: 1180px` 严格闭合，不得出现"栏宽相加不等于内容上限"的情况。
- 双栏只允许"主内容 + 低视觉权重高密度辅栏"一种语义。辅栏承载最近更新、状态、核验信息一类内容，不得放主任务动作。
- 圆角只有 `--radius-sm / -md / -lg` 三档。胶囊圆角仅允许用于筛选标签，异形圆角（如 `50% 50% 45% 45%`）一律禁止。
- 桌面内容宽度上限唯一为 `--content-max`；唯一例外是第 9.1.1 节授权的 `stories.html` 三列工作台。

### 4.3 角色页色彩层

- 角色色只在 `body.archive-character` / `archive/character-detail` 作用域生效，不写回 `:root`，不改变其他公开页或 Editor。
- 57 个角色的正常解析优先级固定为预计算 `agentXray[id].i → l → c`；每项须为可用 RGB 三元组，正常路径必须 57/57 覆盖且互不重复。
- `aria`、`sunna`、`nangong-yu` 虽无旧 gallery x-ray 记录，仍必须从已授权 Default 影画的离线结果持久化主题数据；不得以 faction 色代替正常数据。该项已达成，门禁按 57/57 独立正常路径断言，不得回退为"待补"。
- faction 色与固定 HOOXI accent 只允许作为损坏数据的最后安全回退；门禁必须证明 57 人正常路径没有进入该回退。
- 角色作用域变量至少包括 `--character-accent`、`--character-accent-rgb`、`--character-ambient`、`--character-on-accent`、`--character-page-bg`、`--character-surface`、`--character-surface-strong`、`--character-line`、`--character-text`、`--character-text-muted`。
- 角色色可驱动非语义背景、边框、按钮、标签、标题装饰与选中态；正文、错误、成功、警告和焦点可辨识度继续使用中性语义色，不随角色改变。

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

### 7.2 斜切几何

斜切是 HOOXI 自己的识别语法。

斜切保留，但参数必须统一：

```css
:root {
  --skew-angle: -8deg;        /* 唯一斜角值，全站不得另造 */
  --skew-notch: 14px;         /* clip-path 切角边长 */
}
```

- 斜角值只有 `--skew-angle` 一个。标签栏、卡片切角、区块接缝共用同一角度与同一方向，不得出现一处 -6°、一处 -10° 的情况。
- 斜切只作用于容器边界与装饰层，**不斜切正文文本块**。文本容器保持规则矩形，避免行长不一致影响阅读。
- 硬阴影与标签角可以和斜切并用，这是斜切语法的组成部分，不再限制"每个组件最多一种手法"。
- `<= 880px` 移除斜切接缝（第 8 节已有规定），改为规则矩形纵向流。

### 7.1 可验证文字预算与渐进披露

- 每页只允许一个 H1。Hero 首层最多一个导语、一个主动作和一个安静次入口；测试按语义节点数量检查，不按字符总数检查。
- 区块头首层只保留一个 H2 与至多一行说明，不得同时常显中文幕号、英文幕号、状态码和重复入口。
- 记录卡首层结构固定为：标题、至多一个必要分类/版本、一段两行摘要、一个主要来源动作；扩展元数据、关联记录、备用来源、核验状态与长说明进入原生 `<details data-archive-disclosure>`。
- 渐进披露内容必须保留在 DOM；URL Hash、搜索或筛选命中披露内目标时，脚本必须先展开全部祖先 `<details>`，再滚动并聚焦目标。
- 路由要求固定为：`mainline.html`、`stories.html`、`faction.html`、`events.html`、`behind-scenes.html`、`cultivate.html` 因已有扩展资料，必须至少有一个原生 `<details data-archive-disclosure>`；`character.html` 使用第 9.1.2 节的单活动 panel 合同，`index.html` 与 PLAY 不强制。无扩展内容时不得为通过门禁虚构空 `details`。
- 稳定门禁使用 H1/H2 数量、直接子节点角色、`details[open]` 状态、深链可见性等结构断言；禁止以整页字符总数作为通过条件。

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

#### 9.1.2 精确 scope：`archive/character-detail`

- 正式主链统一为 `character.html?id=<id>`；首页、stories 与阵营页不得主动生成 `#art`。Hero 必须直接显示角色背景影画、完整前景 portrait、返回入口、角色名、至多 2–3 个身份字段与档案 CTA；背景影画桌面使用 `cover` 铺满首屏，移动端在自然文档流中使用 `16:9` 容器并以 `cover` 铺满，展示层边缘允许裁切；前景 portrait 始终使用 `contain` 完整展示。该展示规则不改变源素材转换时禁止裁切、拉伸或抠图的合同，也不改变 Stories 舞台及 roster / avatar / headshot 的独立素材链。默认入口与 `#art` 共享同一完整文档，不得添加 `character-art-view` 等隐藏档案模式。
- Hero 后固定为一个 Hash 驱动的单活动档案视图：顶部四个 Tab 顺序为 `media / lore / profile / related`，四个对应 panel 必须全部保留在 DOM，但任一时刻只能有一个 panel 可见、可交互。
- Tab 使用标准可访问状态同步：活动 Tab `aria-selected="true"` 且 `tabindex="0"`，其余 Tab `aria-selected="false"` 且 `tabindex="-1"`；每个 Tab 的 `aria-controls` 必须准确指向 panel。非活动 panel 同时设置 `hidden` 与 `inert`，活动 panel 同时移除二者。
- 默认无 Hash 时活动项为 `media`。点击 `lore / profile / related` 必须更新活动 panel、URL Hash、浏览器历史与焦点；`history.back()` / `history.forward()` 必须恢复同一状态。Tab 键盘支持左右方向键循环移动，并支持 `Home` / `End`；键盘切换后焦点、roving tabindex、Hash 与可见 panel 同步。
- 兼容 Hash 归属固定为：`#art` 与 `#dossier` 激活 `media`，`#story` 激活 `lore`，`#growth`、`#build`、`#combat` 激活 `profile`；兼容 Hash 可以保留原值，但不得把四个 panel 同时展开。`#media / #lore / #profile / #related` 直接激活同名 panel。
- Hero 前景不得遮挡标题、身份、档案 CTA 或返回按钮，交互控件必须可通过真实命中测试触达；卡图回退不得以大面积不透明矩形覆盖主画面。角色色遵守第 4.1 节，只驱动非语义装饰与状态；保持中性高对比。触屏与 `prefers-reduced-motion: reduce` 使用静态回退，不把动态效果作为查看影画或档案内容的条件。

### 9.2 必须共享

全站必须共享：颜色语义、字体栈、4pt 间距、字级、焦点样式、按钮层级、卡片/列表状态、剧透规则、导航名称、移动断点、动效三级和性能/无障碍门槛。

## 10. 反 AI 模板硬规则

1. 禁止“深色底 + 满屏发光渐变 + 每块玻璃胶囊”的默认 AI SaaS 皮肤。
2. 禁止把所有内容做成同尺寸圆角卡片；优先使用路线、列表、模块栈和真实内容比例。
3. 禁止无业务意义的渐变描边、彩色光球、网格背景、随机噪点、持续扫描线和 hover 浮起。
4. 禁止四处使用大圆角、胶囊标签或 emoji 图标；识别符号必须克制。斜切是本站登记的识别语法，不在此禁列，但须遵守第 7 节的统一参数与正文可读性要求。
5. 禁止虚构统计、评价、在线状态、LOCK 模块或占位内容制造“丰富感”。
6. 禁止每段都用 eyebrow + 大标题 + 两行说明的重复模板；页面节奏必须由任务决定。
7. 禁止营销套话和伪技术文案；按钮写用户动作，空状态写真实原因。

## 11. 性能与可访问性门槛

- 根地址初始路径不加载完整 GLB、长序列帧或非必要视频；重资产仅在用户选择 PLAY/专题后加载。
- 关键文字、导航、搜索和档案链接必须为 DOM；Canvas/WebGL 不承载唯一内容或唯一操作。
- 首屏目标：移动网络下 LCP ≤ 2.5s、CLS ≤ 0.1、INP ≤ 200ms；未达标不得用视觉效果解释。
- 首屏关键图片提供尺寸与合适格式；非关键图片懒加载。
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

## 13. 图鉴模板层

站点当前的结构性缺陷是**每类内容各自手搓一套版面**，导致新增内容必然新增设计语言。本节是硬约束：条目型内容一律由模板驱动，不允许为单类内容新建页面级布局。

### 13.1 模板契约

一个内容类型对应一个模板，一个模板驱动该类型全部条目。模板只声明区块顺序与字段映射，不声明视觉：

```text
EntryTemplate / <type>
├─ identity：封面/图标、名称、类型标签、稀有度或等级
├─ primary：该类型最被查询的结构化数据（表格或键值对）
├─ secondary：次级数据，进入 <details data-archive-disclosure>
├─ relations：关联条目（掉落来源、适配角色、所属地图等）
└─ source：来源、核验日期
```

- 五个区块顺序固定，缺数据的区块整段不渲染，不留空壳、不补占位。
- `primary` 是该类型的存在理由：敌人是弱点与抗性，音擎是面板与被动，材料是获取途径与用途。选错 `primary` 等于这一类没做。
- 视觉全部来自第 4 节 token 与第 7 节组件，模板不得自带颜色、圆角或间距。
- 新增内容类型时只允许新增一份字段映射；出现第二套页面级布局即违反本节。

### 13.2 检索契约

条目型内容必须同时可达三条路径，缺一条视为未完成：

- **筛选**：该类型的结构化字段至少暴露一个筛选轴，带结果计数与清空入口，复用 `FilterBar`。
- **深链**：单条目有稳定 URL，可直接分享与被搜索命中。
- **反向关联**：从关联对象能走回来。材料页列出用它的角色，角色页列出需要的材料，两端必须互指。

单向可达不算接通。只能从索引页点进去、无法从相关对象走到的条目，等于没有接入。

## 14. 卡雕分层系统

卡雕是全站唯一的核心视觉机制，不是首页装饰。以下参数取自 `card-carve-demo.html` 实测实现，是精细化的基线而非重新发明的起点。

### 14.1 分层几何

素材按远/中/近三层切分，同一舞台内共享 `perspective`：

| 层 | z-index | translateZ | scale | 投影 |
|---|---:|---:|---:|---|
| 远景 `--far` | 0 | `0px` | `1.18` | 无 |
| 中景 `--mid` | 1 | `25px` | `1.14` | `drop-shadow(0 6px 14px rgba(0,0,0,.5))` |
| 近景 `--near` | 2 | `50px` | `1.12` | `drop-shadow(0 10px 22px rgba(0,0,0,.6))` |

舞台 `perspective: 900px` + `transform-style: preserve-3d`。`scale` 必须大于 1 且随层深递减，用于位移时不露边——这是硬要求，改小会出黑边。

### 14.2 运动

- **视差**：三层速率固定 `-0.04 / 0.10 / 0.22`，最大位移 `18px` 横向、`10px` 纵向。远景取负值形成反向运动，这是景深错觉的来源，不得改为同向。
- **呼吸**：三层周期 `9s / 7s / 4.5s`，`ease-in-out infinite`。幅度限于 `scale` ±0.02、位移 ≤2px、旋转 ≤0.2deg。
- **叠加方式**：呼吸走 `transform`，鼠标视差走 `translate` 独立属性，由浏览器自动叠加。不得把两者合并进同一 `transform`。
- 视差属第 6 节 L1；`prefers-reduced-motion: reduce` 下呼吸与视差全部停止，保留静态分层与投影。

### 14.3 名字板与立绘

角色页首屏的三件事必须同时成立，缺一件则构图退化为分段堆叠：

- **名字板**：巨型罗马名作为背景层，位于立绘之下。深度靠多层投影与内阴影表达，不靠单纯降低不透明度。
- **立绘破面**：前景立绘必须与名字板有可见边缘分离（描边或投影），不得平贴。
- **阵营色泛光**：色彩铺满整个舞台且分级渐变，不得均匀平铺。角色色遵守第 4.3 节，只驱动装饰层。

名字板不得遮挡标题、身份字段、CTA 或返回入口，约束同第 9.1.2 节。

### 14.4 斜切几何

斜切是 HOOXI 自有识别手法，保留斜切属主动设计选择，因此必须自证一致：

- 斜角参数全站统一，登记为 token 后引用，不得按组件各自取值。
- 斜切用于导航标签、区块接缝与卡片角，不用于正文容器。
- `<= 880px` 时移除斜切接缝，与第 8 节一致。

## 15. 镜像内容接入

本地镜像 `F:\website-archives\zzz-wiki` 已归档 1920 条结构化条目，当前站点仅覆盖其中极小部分。这是"玩家查不到东西"的直接原因，属内容覆盖缺口，不由视觉改动解决。

### 15.1 接入顺序

按玩家查询价值排序，逐类完成第 13 节两个契约后再进入下一类：

| 顺序 | 类型 | 镜像条目数 | `primary` 必须承载 |
|---:|---|---:|---|
| 1 | 音擎 | 93 | 面板数值、被动效果、适配角色 |
| 2 | 敌人 | 210 | 弱点、抗性、招式 |
| 3 | 材料 | 155 | 获取途径、用途去向 |
| 4 | 地图 / 委托 | 69 / 183 | 收集物与关联委托 / 触发条件与奖励 |

一类未接通检索契约不得开下一类。批量灌入而不接筛选与反向关联，等于把碎片化翻倍。

### 15.2 官方属性色

以下为游戏属性色值：

| 属性 | 色值 |
|---|---|---|
| 电 | `#2CACF1` | `#33B6FE` |
| 火 | `#FB5421` | `#FF5623` |
| 冰 | `#98EFF0` | `#95EAE9` |
| 以太 | `#FF4483` | `#FE427E` |
| 物理 | `#FFDE00` | `#EDCC2C` |

子属性复用父色的映射关系不变（烈霜/霜锋→冰、玄墨→物理）。**电是蓝色、物理是黄色**这个反直觉映射同样不变。

属性色属功能性色彩，用于弱点、抗性、伤害类型这类必须靠颜色区分的语义，登记为 token 后引用。稀有度渐变同源可用。

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
