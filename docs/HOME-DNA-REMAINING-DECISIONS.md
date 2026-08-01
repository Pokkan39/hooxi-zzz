# 首页参考 DNA 剩余项拍板清单

用途：把参考 DNA（`F:\website-archives\zzz-official\extracted-dna.md`）逐条比对 HOOXI 首页当前实现后，分成三类，供一次性拍板。
编写日期：2026-07-31
性质：取证、决策与落地状态记录。
口径说明：历史小节保留施工前口径，以文首「当前状态摘要」为准。

前置说明：此前只区分了「已落地」与「与深色方向冲突」两类，遗漏了第三类——既不与深色方向冲突、又尚未落地的安全项。本轮补齐该类。

---

## 已确认 DNA 项的验收结论（2026-07-31 实测）

**结论：「基于确认后的参考首页 DNA 定点替换首页」这项工作的既定验收标准已全部满足。**

需要区分两件事：

- **已确认的 DNA 项**（五项安全手法）在 2026-07-30 就已落地，本轮完成了它的完整验收。
- **C1 / C2 / C3** 是后续逐轮取证时新发现的增量候选，**不属于「已确认」范围**，它们的取舍是独立决策，不构成上述验收的前置条件。

### 响应式实测（三档视口）

| 视口 | 三行导航 | 编号序列 | aria-hidden | Hero 水印 | 悬停缩放 | 横向溢出 | JS 报错 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 4 组 | 02/03/04/05 | 是 | `"01"` | `1.12` | 无（1440/1440） | 0 |
| 1024×768 | 4 组 | 02/03/04/05 | 是 | `"01"` | `1.12` | 无（1024/1024） | 0 |
| 390×844 | 4 组 | 02/03/04/05 | 是 | `"01"` | `1.12` | 无（390/390） | 0 |

三档全部 PASS。

### 功能与正式门禁（规范第 8 节八项全绿）

| 门禁 | 结果 |
| --- | --- |
| `npm test`（档案数据 / 链接完整性 / 非官方边界） | PASS，17 组检查 |
| `npm run test:stories` | PASS，118/118，failures 0 |
| `npm run test:boundary:runtime` | PASS |
| `npm run test:boundary:all` | PASS |
| `npm run test:contrast` | PASS，57 人首屏均达 AA |
| `npm run test:ui` | PASS，77 张截图 |
| `npm run test:formal` | `GATE_OK ALL_FORMAL_UNCHANGED` |
| `git diff --check` | exit 0 |

### 判定

已确认的五项 DNA 手法在多轮后续改动后仍全部生效，三档响应式无回归，八项门禁全绿。该 protected 任务的验收标准已满足。

**唯一遗留的非视觉问题是「18 个文件未入 git」**（见文末附录），它与 DNA 替换本身无关，但会影响线上可用性，需单独授权处理。

---

## 阶段 4 六项完成度核实（2026-07-31 只读实测）

**结论：六项全部已实施并生效；Swiper 方向键缺口已于 2026-07-31 补齐并专项验收通过。**

### 逐项实测结果

| # | 项 | 状态 | 实测证据 |
| --- | --- | --- | --- |
| 04 | 大图气势 | 已生效 | `fetchpriority="high"`、`hero-art-veil` 压暗层在位、片源 1146×717 |
| 02 | 大号半透明编号 | 已生效 | `.hero::before` `content:"01"`、`172.8px`、`font-weight:800`、`rgba(216,250,0,.075)` |
| 01 | 斜切几何 | 已生效 | 全站 43 处 `clip-path` 承担，`--zzz-skew` token 在位 |
| 07 | 文字逐字浮现 | 已生效 | `#heroTitle` 拆 13 个 `.zzz-char`，入场后全部 `opacity:1`；`aria-label` 与可见文案一致 |
| 08 | GSAP 多层视差 | **已生效，达标** | 见下表 |
| 19 | Swiper 轮播 | 已实施并生效 | 实例挂在 `.hero-carousel-viewport`，`slides:4`、`autoplay.running:true`、fade 模式接管调度；焦点内 `ArrowLeft/ArrowRight` 可切换，用户操作后持续暂停；无箭头、圆点、缩略图 |

### 视差层级行程差（规范 5.2 验收标准）

鼠标从 Hero 最左移到最右，各层横向位移：

| 层 | 实测行程 | 规范值 | 判定 |
| --- | --- | --- | --- |
| 背景 `.zzz-hero-backdrop` | 47.8px | 42px | 达标 |
| 光效 `.zzz-hero-glow` | 95.4px | 84px | 达标 |
| 立绘 `.zzz-hero-figure` | 191px | 168px | 达标 |
| 文字 `.hero-copy` | −57.2px | −50px | 达标（方向相反） |

**立绘/背景比 = 4.00**，规范要求「约 4 倍」，精确吻合；文字方向与其余三层相反（`sign -1` vs `+1`）。景深成立。

实测值略高于规范记录值（约 +13%），因规范数值是在 1280 视口下测的，本轮在 1440 下测，`PX_RANGE_X=96` 相同而 Hero 宽度更大所致，比例关系完全一致，非缺陷。

### 更正此前的两处误报

本轮先前一次测量曾报告「视差四层位移全为 0」与「Hero `aria-label` 与可见文案不一致」，两者均为**测量方法错误，不是页面缺陷**：

- 视差：监听挂在 `.hero` 元素上，而首次测试把 `PointerEvent` 派发到 `window` 与 `document`，未冒泡到 `.hero`。改用真实 `mouse.move` 后四层位移全部正常。
- `aria-label`：首次比对时取的可见文案是 DOM 拆 span 前的快照，与 `aria-label` 比错了对象。实测两者一致，均为「绝区零剧情影像技术档案入口」。

### Swiper 方向键缺口已补齐

方向键缺口已于 2026-07-31 补齐并专项验收通过。最小实现保持 Swiper `keyboard:false`，避免内置键盘模块挂载全局 `document` 监听；仅给 `.hero-carousel-viewport` 增加 `tabindex="0"`、`role="group"`、轮播 ARIA 信息和局部 `keydown`，焦点位于轮播区内时响应 `ArrowLeft/ArrowRight`。

- 方向键切换复用既有 `user` 暂停 reason；用户接管后持续暂停，失焦并等待 7.6 秒仍不续播。
- 外部焦点不响应方向键，不新增箭头、圆点或缩略图等可视控件。
- 专项验收结果：console/page errors 0。
- 媒体 `ERR_ABORTED` 属于既有音频加载行为，实际可播放，单独说明且不计为轮播回归。

该实现同时满足「必须支持方向键」与「不出现箭头、圆点、缩略图」两项合同。

---

## 当前状态摘要（只看这一节即可了解收口状态）

全文很长，是逐轮取证累积的结果。当前落地结论与未决事项看这张表即可；历史取证与施工前判断仍保留在后文。

### 当前状态与未决事项

| # | 事项 | 当前状态 | 已验证到什么程度 | 涉及文件 | 工作量 |
| --- | --- | --- | --- | --- | --- |
| 0 | **18 个文件入 git** | **仍待授权，本轮不擅自改 git** | 已用 `npm run test:deploy` 门禁双向验证；模拟入库后转 PASS | 无（仅 `git add`） | 待授权 |
| C1 | 固定侧栏楼层页码 | **已落地并专项验收通过** | 正式实现已完成；首屏隐藏、进楼层淡入、键盘可达、小屏隐藏与 reduced-motion 均通过 | `zzz-motion.js` + `zzz-motion.css` | 已完成 |
| C2 | 楼层导航补中文行 | **保持不做** | 已用样板截图证明会与 68px `<h2>` 重复 | — | — |
| C3 | 播放按钮播放中心跳 | **已落地并专项验收通过** | 正式实现已完成；纯 CSS、零 JS 改动，播放中光环心跳与 reduced-motion 降级均通过 | `home-neon.css` | 已完成 |
| 19 | Swiper 轮播方向键 | **已落地并专项验收通过** | 焦点内 `ArrowLeft/ArrowRight`、用户持续暂停、外部焦点不响应、无箭头/圆点/缩略图、console/page errors 0 | `zzz-hero-swiper.js` | 已完成 |

### 第 0 项为什么仍未执行

`assets/vendor/`、`zzz-motion.*` 等 18 个文件在本机存在但没入 git。GitHub Pages 部署走 `checkout` 后直接上传，未入库的文件不会上线——8 个正式页会全部缺动效脚本与样式，三个角色页立绘 404。本机所有测试和门禁都是 PASS，看不出异常。

**在入库前不要触发 Pages 部署。** `assets/vendor/` 约 290KB 是否接受入库仍待授权；本轮不执行 `git add`、不暂存、不改 git。

### C1 与 C3 联调状态

不冲突，已联调实测：两者几何间距 73px、播放器仍可点、键盘 Tab 顺序合理、小屏与 reduced-motion 组合场景均正确。两项均已落地并专项验收通过。

### 当前状态

C1、C3 与 Swiper 方向键已完成正式落地并专项验收通过；C2 保持不做；第 0 项 git 跟踪仍待授权，不能擅自改 git。

---

## 第一类：已落地且实测仍生效（无需动作）

| DNA 项 | 当前实现 | 实测证据 |
| --- | --- | --- |
| 楼层三行导航结构 | 四组 `.section-nav`（英文名 + 两位编号） | `navGroups=4`，序列 `02,03,04,05`，全部 `aria-hidden=true` |
| 楼层编号连续性 | Hero 的 `01` 由 `.hero::before` 水印承担 | `content:"01"`、`172.8px`、`rgba(216,250,0,.075)`、`z-index:-1` |
| 悬停 `scale(1.12)` | 档案页链接对齐官方倍率 | 实测 `matrix(1.12,0,0,1.12,0,-2)`；reduced-motion 下为 `none` |
| 楼层入场 GSAP 错峰 | 复用既有 ScrollTrigger，未新建监听 | 收口后编号 `opacity=1`、`transform` 归零，无残留 |
| 荧光点睛用量纪律 | 逐屏均不超过 2 处 | 六屏依次 `2/1/2/0/1/2` |
| GSAP + Swiper 技术栈 | 已本地化落地并接入 | GSAP 3.15.0、Swiper 11.2.10，零外联 |
| CSS 斜切 | 全站 43 处 `clip-path` 承担 | 与官方 `skewX(-25.3deg)` 手法同源，实现方式不同 |

---

## 第二类：与已确认方向冲突（建议全部不做）

| DNA 项 | 冲突点 |
| --- | --- |
| 浅灰底 `rgb(239,239,239)` + 近黑字 `rgb(34,33,34)` | 与「深色单方向」直接对立；会让 57 人对比度基线全部重算，`test:contrast` 必然大面积翻红 |
| PNG 切图斜切（官方 `clip-path` 命中为 0） | 需替掉现有 43 处 `clip-path`，属重写而非定点替换 |
| `inpin hongmengti` 中文标题字体 | 规范第 0 节第 4 条明令禁止引用官网字体资产 |
| `Impact` 数字字体 | 同上；本站编号已用 Barlow Condensed 800 |
| 移动端独立路由（`/m/main`） | 本站是响应式断点；且规范 11.1 已定「移动端本轮不考虑」 |
| 官方六楼层命名硬映射 | 本站楼层是自有信息架构，硬映射会让档案站变成官网仿制品（规范第 0 节第 5 条） |
| rem 缩放体系（`html` 50px、`designWidth:1574`） | 本站用 `clamp()` 流式排版，换体系等于重做全站尺寸 |

---

## 第三类：不冲突但尚未落地（需要你拍板）

这三项都不违反深色方向、不引用官网资产、不涉及重写，是真正可选的增量。

### C1 固定侧栏楼层页码

- 官方做法：`aside.sidebar` 右侧固定 41×179，`z-index:99`，内含当前楼层页码，荧光色标记当前项。
- 本站现状：首页**没有**任何固定侧栏。`site-sidebar.css` / `site-sidebar.js` 已存在，但只被 `stories.html` 使用。
- 可行性：可复用既有 sidebar 资产，不需要新建体系。首页已有 01–05 编号序列，天然可映射。
- 代价：新增一个常驻 fixed 元素。
- 我的判断：**建议做**。它给长首页提供了位置感，且是官方 DNA 里少数纯功能性收益项。

#### C1 落位实测结论（原先假设已修正）

此前记为「需处理与磁带机播放器（右下角）的冲突」，实测后该前提不成立：

| 元素 | 实测定位 | 结论 |
| --- | --- | --- |
| 磁带机播放器 `#musicPlayer` | `position:static!important`，宽 `min(1180px,100%-48px)` 居中，随文档流排在 footer 之后 | **不是悬浮件，不占右侧**，与侧栏无冲突 |
| 动效降级提示 `.zzz-motion-notice` | `fixed`，`right:16 bottom:16`，`z-index:60` | 仅在系统开启减少动效时存在，占右下角 |
| 自定义光标 `.zzz-cursor` | `fixed`，`z-index:120`，12×12 跟随鼠标 | 不占固定位置 |
| 提示条 `.toast` | `fixed`，居中偏下，`z-index:30` | 不占右侧 |
| 路由转场层 `.hooxi-route-loader` | `z-index:1000`（全站层级上限） | 侧栏须低于它 |

三档视口（1440 / 1024 / 390）实测 `main` 右边缘余量均为 **0**，即内容区贴视口右边缘，没有天然留白可放侧栏。顶栏高度 1440/1024 档为 70px、390 档为 64px。

**推荐落位方案：**

- `position:fixed`，`right:0`，垂直居中（`top:50%` + `translateY(-50%)`），宽 41px 对齐官方比例。
- `z-index:70`——高于动效提示（60）与 toast（30），低于自定义光标（120）与路由转场层（1000）。
- 因右侧余量为 0，侧栏会叠在内容上方。官方也是叠加（`z-index:99` 覆盖楼层），故与 DNA 一致；但需给侧栏半透明深色底以免压住文字。
- 与动效提示的位置关系：**实测无重叠**。按上述参数注入探针后，侧栏与提示条的垂直间距为 1440×900 档 275px、1024×768 档 209px、390×844 档 232px，三档均不相交。
- 小屏必须隐藏：390×844 档实测侧栏会压住正文与可点击元素——首屏压住 `PLAY · 可选进入录像店` 链接（3 个采样点全部命中）、第 2 屏压住 `直接查档` 标题、第 8 屏压住 `来源与边界` 标题。桌面档无此问题（1440×900 六屏采样 `textHits` 全为 0）。故 390px 档一律隐藏侧栏，与官方该档走独立移动路由、本就无侧栏的做法一致。
- reduced-motion 下侧栏当前项切换不做位移动画，仅换色。

**实测修正记录：** 本节初稿有两处推算与实测不符，已更正——原写「1440×900 下侧栏底边距视口底约 360px」，实测侧栏占 `top:361 / bottom:540`，与提示条间距为 275px（非 360px）；原写小屏「需改为隐藏」为预防性建议，实测确认是**必须**隐藏，因为确有正文与按钮遮挡。

**仍需你确认的一点：** 侧栏叠在内容上方是否可接受。桌面档实测不压任何文字（六屏采样命中 0），叠加的只是 Hero 立绘等图像层；若仍不接受，替代方案是把 `main` 右侧留出 41px padding，但那会改动首页栅格，超出「定点替换」范围。

#### C1 可视样板与对照截图

按已定稿参数（fixed / right:0 / 垂直居中 / 41px 宽 / z-index:70 / 当前项荧光高亮）在真实首页上运行时注入侧栏后截图，未改动任何站内文件。截图在 `prototype/side-rail-preview/`：

| 文件 | 视口 | 目视结论 |
| --- | --- | --- |
| `desktop-no-rail.png` | 1440×900 | 对照基准，无侧栏 |
| `desktop-with-rail.png` | 1440×900 | 侧栏落在 Hero keyart 右缘，压住 keyart 边缘图像但不压文字；`01` 荧光高亮清晰可辨 |
| `desktop-with-rail-midpage.png` | 1440×900 中段 | 侧栏落在代理人卡片右侧空白带，**完全不压内容**，是最理想的表现位 |
| `mobile-no-rail.png` | 390×844 | 对照基准，无侧栏 |
| `mobile-with-rail.png` | 390×844 | 侧栏直接压在「开始查档」主按钮上，**确认必须隐藏** |

目视复核后的两点补充：

- 桌面档首屏侧栏叠在 Hero keyart 右缘。数值检测显示不压文字（keyart 是图像层），但目视可见它切进了 keyart 的斜切边框。这是唯一需要你审美判断的地方。
- 中段与其余楼层表现良好，侧栏正好落在栅格右侧留白带内。
- 小屏遮挡已由截图直接印证，与前述数值检测一致，隐藏规则无争议。

#### C1 变体样板：首屏隐藏、进楼层淡入（推荐方案）

针对上述唯一取舍点（首屏侧栏切进 keyart 斜切边框）做了变体样板：Hero 占据超过半屏时侧栏 `opacity:0`，滚过 Hero 后淡入，当前项随可视楼层同步高亮，回到首屏再次隐藏。

实测行为：

| 位置 | 侧栏 opacity | 当前项 |
| --- | --- | --- |
| 首屏 Hero | `0` | — |
| 滚过 Hero（1.2 屏） | `1` | `02` |
| 中段（2.5 屏） | `1` | 索引 3（`04`） |
| 回到首屏 | `0` | — |

截图：

| 文件 | 目视结论 |
| --- | --- |
| `variant-desktop-01-hero-hidden.png` | keyart **完整无遮挡**，右缘那一刀消失，首屏回到干净状态 |
| `variant-desktop-02-floor-shown.png` | 侧栏已淡入，`02` 荧光高亮清晰，落在卡片右侧留白带内，不压任何内容 |
| `variant-desktop-03-midpage.png` | 中段表现与常驻方案一致，位置感良好 |

**三方对比结论：**

| 方案 | 首屏 keyart | 楼层位置感 | 小屏 |
| --- | --- | --- | --- |
| 不做 C1 | 完整 | 无 | — |
| 常驻侧栏 | 右缘被切 41px | 有 | 必须隐藏 |
| 首屏隐藏 + 进楼层淡入 | **完整** | **有** | 必须隐藏 |

**推荐第三方案。** 它同时保住了 keyart 完整性与楼层位置感，代价只是多一个滚动监听——而首页已有 GSAP ScrollTrigger 在跑，可直接复用，不新建第二套监听。小屏隐藏规则三个方案共用，无差异。

#### C1 实现原型与实测（可直接落地）

代码在 `prototype/side-rail-preview/rail-impl.js` 与 `rail-impl.css`，落地时分别追加到 `zzz-motion.js`（由 `isHome` 分支调用）与 `zzz-motion.css`（作用域挂 `body.home-page`）。

**「不新建滚动监听」已验证成立。** 此前这只是推荐理由，本轮实测：注入原型前后页面 `scroll` 事件监听数均为 4，`delta = 0`；显隐与当前项全部走 `ScrollTrigger.create`，实例数 9（原有 4 + 侧栏新增 5：1 个显隐 + 4 个楼层）。共用库的统一 ticker，未引入第二套滚动循环。

需要说明一处与原推荐的差异：既有 `initSignalLock` 里的 ScrollTrigger 是 `once:true` 一次性入场触发，**无法直接挂载持续跟踪逻辑**，所以侧栏是新建 ScrollTrigger 实例、复用同一个库与 ticker，而不是复用同一个触发点。「不新建滚动监听」成立，「复用同一触发点」不成立。

实测结果：

| 项 | 结果 |
| --- | --- |
| 新增 scroll 监听 | `0`（前后均为 4） |
| 首屏隐藏 | `opacity:0` |
| 滚过 Hero | `opacity:1`，当前项 `02`，`aria-current="true"` |
| 回到首屏 | `opacity:0` |
| 键盘可达 | 真实 `button`，可聚焦，`aria-label="跳到精选代理人"` |
| 点击目标 | 41×44px，达 44px 高度要求 |
| 点击跳转 | 生效（scrollY 1170 → 4237） |
| 小屏 390px | `display:none` |
| reduced-motion | 过渡时长归零，功能仍可用，当前项正常 |
| JS 报错 | 0 |

**实测中修正的一处真实缺陷：** 焦点环初版写 `outline:2px solid var(--signal)`，实测被站内全局规则覆盖成 `rgba(232,236,241,.42)` 的低对比度灰。已改为提高特异性 + `!important` 并显式锁 `color`，修正后焦点环实测 `rgb(62,199,214)`、对比度 **9.75:1**，远超规范 9.2 的 3:1 要求。当前项荧光 16.59:1。

**结论：C1 已具备直接落地条件**，无技术未知项，只等你放行。

### C2 楼层导航补中文行

- 官方做法：`.section-nav` 是三行——中文名 + 英文名 + 编号。
- 本站现状：只有**两行**（英文名 + 编号）。中文名在下方的 `<h2>` 里，未进 `.section-nav`。
- 可行性：纯 DOM 与样式改动，零风险。
- 代价：会与下方 `<h2>` 的中文标题重复。官方之所以不重复，是因为它的楼层没有独立 `<h2>`。
- 我的判断：**建议不做**。照搬会产生视觉重复，本站两行结构更干净。这是官方结构与本站结构差异导致的，不是缺失。

#### C2 取证结论（已用样板截图验证）

四个楼层实测结构：

| 英文行 | 编号 | 下方 h2 | h2 字号 |
| --- | --- | --- | --- |
| Direct Finder | 02 | 直接查档 | 68px |
| Featured Agents | 03 | 精选代理人 | 68px |
| Archive Reels | 04 | 档案卷轴 | 68px |
| Sources / Boundary | 05 | 来源与边界 | 68px |

关键事实：本站 `<h2>` 中文标题是 **68px 大字**，且与导航行紧贴（三处实测垂直间距为负值，即视觉上属同一组）。官方三行结构里的中文行是**小字标签**，它承担的就是本站 `<h2>` 的角色。

截图对照 `c2-with-cn-row.png` 与 `c2-without-cn-row.png`：注入中文行后，同一屏内「精选代理人」以 15px 小字与 68px 大标题两次出现，重复非常直观。

**结论：维持不做。** 本站已经有中文行，只是它以 68px `<h2>` 的形式存在，而非小字标签。再加一行是重复而非补齐。

---

#### C3 取证结论（已实测可行性）

播放器现状：按钮为 `▶` 字符 + `aria-label="播放音乐"`，`animation-name` 为 `none`，播放中无任何持续视觉反馈。

首轮可行性样板（直接对按钮做 `scale(1)` → `scale(1.04)`，周期 `.8s`）：

- 连续 5 帧采样 transform 值全部不同（`1.00709 / 1 / 1.00926 / 1.02828 / 1.03987`），动画真实跑动。
- `prefers-reduced-motion: reduce` 下 `animation-name` 正确回退为 `none`，符合规范 9.1。

**注意：这个首轮做法已被否决。** 后续实测发现直接对按钮做 animation 会吃掉既有 hover/active 反馈，最终方案改为在 `::before` 光环伪元素上做心跳。以下一节的实现原型才是应落地的版本，本节仅留作可行性判断的过程记录。

**结论：可做，优先级低。** 技术上无风险、无障碍降级已验证。它解决的是「播放中缺乏反馈」这个真实小缺口。若你希望页面绝对静止则不做——这是唯一的取舍，与技术无关。

#### C3 实现原型与实测（纯 CSS，零 JS 改动）

代码在 `prototype/side-rail-preview/c3-heartbeat.css`，落地时追加到 `home-neon.css` 现有 `#musicPlayer` 规则之后。

**两个关键实测发现，都改变了原先的做法：**

1. **不需要任何 JS 改动。** `app.js` 的 `syncCassettePlaying()` 已经在 `.music-player` 上维护 `.is-playing` class，播放与暂停都会同步（含 `aria-label` 切换）。C3 只需挂 CSS 选择器即可，无需新增状态管理。此前评估时未发现这个现成挂钩点。
2. **心跳不能做在按钮自身上。** 既有规则 `home-neon.css:648/649` 已用 `transform` 做 hover 上移与 active 下压。`animation` 与 `transition` 争同一个 `transform` 时 animation 优先级更高，会把 hover/active 反馈整个吃掉。故改为在 `::before` 光环伪元素上做心跳，按钮自身 `transform` 不动。

实测结果：

| 项 | 结果 |
| --- | --- |
| 未播放 | 光环 `content:none`，`animation:none`，完全不存在 |
| 播放中 | 光环出现，`animation:zzz-deck-pulse` |
| 动画真实跑动 | 4 帧采样 `1.05918 / 1.05225 / 1.01757 / 1.0002`，distinct 4 |
| hover 是否被吃掉 | **未被吃掉**：按钮 `translateY(-2px)` 与光环心跳同时生效 |
| 暂停后 | 光环消失，`animation:none` |
| 真实点击路径 | `is-playing` 由既有逻辑自动驱动（`false → true`），`aria-label` 同步为「暂停音乐」 |
| reduced-motion | `animation:none` 但光环保留（`opacity:.42`）仍指示播放中，按钮未 disabled、功能可用 |
| JS 报错 | 0 |

reduced-motion 下的处理符合规范 9.1「磁带机轮盘与律动静止但播放功能必须仍可用」：光环不动但保留，仍然传达「正在播放」这个状态。

**结论：C3 也已具备直接落地条件**，且比预估更简单——纯 CSS、零 JS 改动、不碰任何既有 transform。

---

## C1 + C3 联调实测（两项同时启用）

两个原型此前各自单独验过。因 C1 侧栏是 `z-index:70` 的 fixed 元素、C3 光环在播放器上，两者位置可能相交，故补一次同时启用的联调。

**桌面 1440×900、播放中状态：**

| 项 | 结果 |
| --- | --- |
| 几何相交 | 侧栏与播放按钮、与播放器整体**均不相交**；侧栏左边缘 1399px，播放器右边缘 1326px，间距 73px |
| 播放器可操作性 | 播放按钮仍是命中点最上层元素（`elementFromPoint` 返回 `play-button`），侧栏未挡住点击 |
| 两效果并存 | 光环 `zzz-deck-pulse` 与侧栏 `opacity:1` 同时活跃，侧栏当前项正确显示 `05` |
| 键盘 Tab 顺序 | 45 个可聚焦元素中侧栏 4 个按钮位于索引 41 起，紧随播放器的 `playlistOpen` 之后，未插进主内容中间 |
| JS 报错 | 0 |

**组合场景：**

| 场景 | 侧栏 | C3 光环 | 按钮可用 | 横向溢出 |
| --- | --- | --- | --- | --- |
| 390px 小屏 + 正常动效 | `display:none`（按预期隐藏） | 正常跑动 `opacity:.55` | 是 | 无 |
| 1440px + reduced-motion | 保留 `grid`，过渡归零 | `animation:none`，`opacity:.42` 静止保留 | 是 | 无 |

小屏下侧栏隐藏但 C3 仍正常工作，两项互不依赖；reduced-motion 下两项各自正确降级且播放功能不受影响。

**结论：C1 与 C3 可同时落地，无相互干扰。** 三项决策的技术验证至此全部完成。

### C3 播放按钮激活态心跳动画

- 官方做法：BGM 按钮激活时 `animation: heartbeat .8s infinite`。
- 本站现状：播放按钮有荧光边框与 hover/active 位移，但**没有播放中的持续状态动画**。
- 可行性：一条 keyframes，需挂在 reduced-motion 降级下。
- 代价：常驻循环动画，与规范「鼠标不动时页面静止」的克制原则有轻微张力。
- 我的判断：**可做但优先级低**。它确实解决了「播放中」缺乏视觉反馈的问题，但循环动画容易显廉价，故最终方案把心跳做在 `::before` 光环上而非按钮本身（见前文 C3 实现原型小节，那里是应落地的版本）。

> 本节是最初的方向评估，保留作过程记录。实际结论与代码见前文「C3 取证结论」与「C3 实现原型与实测」两节。

---

## 拍板项

见文首「拍板摘要」一节，那里是唯一的决策入口，含四件事的建议、验证程度、落地文件与工作量。

补充一句：三项都不做也是合理选择——那样这条 DNA 定点替换任务即可就此收口。但**第 0 项（18 个文件入 git）与三项决策独立，无论如何都要做**，否则线上会缺文件。

---

## 附：C1 施工前必须先处理的 git 隐患（本轮查证，与三项决策独立）

C1 要改的正是视觉换血这批文件，施工前查了它们的 git 状态，发现一个**比无回滚保护更严重的问题**。

### 事实

八个视觉换血文件全部处于「未跟踪且未被 .gitignore 排除」状态，即**纯粹漏了 `git add`**，不是有意排除：

| 文件 | git 状态 | 已进门禁基线 | 被几个页面引用 |
| --- | --- | --- | --- |
| `zzz-motion.css` | 未跟踪 | 是 | 8 |
| `zzz-motion.js` | 未跟踪 | 是 | 8 |
| `zzz-motion-notice.js` | 未跟踪 | 是 | 8 |
| `zzz-tv-transition.css` | 未跟踪 | 是 | 8 |
| `zzz-tv-transition.js` | 未跟踪 | 是 | 8 |
| `zzz-hero-parallax.css` | 未跟踪 | 是 | 1 |
| `zzz-hero-parallax.js` | 未跟踪 | 是 | 1 |
| `zzz-hero-swiper.js` | 未跟踪 | 是 | 1 |

`assets/vendor/`（GSAP 3.15.0 + Swiper 11.2.10 本地库）同样未跟踪、未被忽略。

门禁基线共 81 个文件，上述八个全部在内——**门禁认为它们是正式站组成部分，git 却完全不知道它们存在**。

### 风险

`.github/workflows/pages.yml` 的部署逻辑是 `actions/checkout@v4` 之后直接 `upload-pages-artifact` 整个仓库目录。这意味着：

- 未入 git 的文件**不会出现在 checkout 结果里**，因此不会部署到线上。
- 8 个正式页都在引用这些文件。一旦触发 Pages 部署，线上会得到 8 个页面全部 404 缺失动效脚本与样式、首页缺 GSAP/Swiper 库的结果。
- 本机看不出问题，因为本机文件齐全，门禁与所有测试全部 PASS。这正是 `.gitignore` 注释里记过的同类陷阱：「本地有文件所以 PASS、CI 检出后缺文件而 FAIL」。

严重程度：这不是「缺回滚保护」这种预防性问题，而是**线上功能会实际缺失**。

### 建议

施工 C1 之前先把这批文件入库。这属于 git 操作，需要你明确授权，我不自行执行：

```
git add zzz-motion.css zzz-motion.js zzz-motion-notice.js \
        zzz-tv-transition.css zzz-tv-transition.js \
        zzz-hero-parallax.css zzz-hero-parallax.js zzz-hero-swiper.js \
        assets/vendor/ \
        assets/portraits/aria-portrait.webp \
        assets/portraits/sunna-portrait.webp \
        assets/portraits/remielle-portrait.webp \
        assets/portraits/remielle-card.webp \
        assets/mindscape/default/remielle.webp \
        assets/icons/covenant-of-dayat.png
```

（此命令已按下一段的全量复查结果补全至 18 个文件，覆盖 A/B/C 三级。）

需要你确认两点：

1. 是否同意把这八个文件与 `assets/vendor/` 入库。
2. `assets/vendor/` 约 290KB（GSAP + Swiper + 两份许可证），是否接受入库；若不接受，则必须改用 CDN——但那会违反本站零外联约定，`test:boundary` 会失败。

在你授权前，C1 可以照常施工（本机验证不受影响），但**不要触发 Pages 部署**，否则线上会缺文件。

### 全量复查：缺口不止八个（本轮补查）

上一段只查了视觉换血这一批。把门禁基线 81 个文件与 8 个正式页的全部 48 个引用资源逐一比对 git 跟踪状态后，实际缺口是 **18 个文件**，全部属于「未跟踪且未被忽略」，即都是漏 `git add`：

**A 级：8 个页面共用，缺失即全站动效失效**

| 文件 | 引用页数 |
| --- | --- |
| `zzz-motion.css` | 8 |
| `zzz-motion.js` | 8 |
| `zzz-motion-notice.js` | 8 |
| `zzz-tv-transition.css` | 8 |
| `zzz-tv-transition.js` | 8 |
| `assets/vendor/gsap/gsap.min.js` | 8 |

**B 级：首页专属，缺失即首页视差与轮播失效**

| 文件 | 引用页数 |
| --- | --- |
| `zzz-hero-parallax.css` | 1 |
| `zzz-hero-parallax.js` | 1 |
| `zzz-hero-swiper.js` | 1 |
| `assets/vendor/gsap/ScrollTrigger.min.js` | 1 |
| `assets/vendor/swiper/swiper-bundle.min.css` | 1 |
| `assets/vendor/swiper/swiper-bundle.min.js` | 1 |

**C 级：媒体素材，缺失即对应角色页图片 404**

| 文件 | 说明 |
| --- | --- |
| `assets/portraits/aria-portrait.webp` | 爱芮立绘 |
| `assets/portraits/sunna-portrait.webp` | 苏娜立绘 |
| `assets/portraits/remielle-portrait.webp` | 蕾米埃尔立绘 |
| `assets/portraits/remielle-card.webp` | 蕾米埃尔卡图 |
| `assets/mindscape/default/remielle.webp` | 蕾米埃尔影画 |
| `assets/icons/covenant-of-dayat.png` | 阵营徽记 |

C 级这六个是本轮新查出来的，上一段完全没覆盖。它们都在门禁基线里，也都被正式页使用，同样不会部署到线上。

注：`assets/mindscape/` 有 `.gitignore` 白名单规则（只放行 `default/*.webp`），`remielle.webp` 符合白名单、未被忽略，属于漏 add 而非有意排除。

### 附带查出的一处真实不一致（非部署问题）

`zzz-motion.js` 在 8 个页面都会执行、内部会用到 `ScrollTrigger`，但 `ScrollTrigger.min.js` **只有 `index.html` 引入**。实测非首页 `typeof window.ScrollTrigger === 'undefined'`。

目前**没有造成故障**，原因有两个：代码里有 `if(!ScrollTrigger){run();return;}` 兜底会直接执行终态；且非首页没有 `.section-nav-num` 目标（实测为 0），本就不需要滚动触发。四页实测零 JS 报错。

结论：不是缺陷，但属于「引入清单与实际用法不一致」。若将来给非首页加需要滚动触发的效果，会静默退化成无动画。建议记录备查，本轮不动。

### 已补自动检测：`npm run test:deploy`

上述缺口之所以能积累到 18 个，根因是**没有任何门禁检查 git 跟踪状态**——`check-formal-site-gate.py` 只比对内容指纹，文件在本机存在就 PASS。

已新增 `scripts/check-deploy-tracking.mjs` 填这个盲区：

- 检查门禁基线纳管的全部文件与 8 个正式页引用的全部本地资源是否都已入 git。
- 输出按影响面分级（A 全站 / B 页面数 / C 仅基线），与本文档分级一致。
- 被 `.gitignore` 有意排除的文件单独报出，与「漏 add」区分，不混为一谈。
- 有缺口时 `exit 1`，可直接进 CI 或本地门禁串。

双向实测：当前状态下正确报出 18 个缺口并 `exit 1`；用 `git add --intent-to-add` 模拟入库后转为 `PASS` 且 `exit 0`；随后已 `git reset` 完全还原为未跟踪状态，git 索引干净，入库决定权仍在你手上。

建议把它加入常规门禁串，避免同类问题再次积累。

#### 扫描范围已从 8 页扩到全部会部署的页面

首版只扫 8 个正式页，但仓库根目录另有 9 个 HTML（样板页与 editor 工具页），需确认它们是否藏有同类缺口。逐页查证后的判定规则：

- **页面本身未入 git 的**（`active-theory-sample`、`cinematic-slice`、`film-archive-directions`、`scroll-world-prototype`、`tech-direction-demos` 共 5 个）：部署时页面自己就不存在，它引用的 14 个未入库资源缺不缺都不影响线上，**不该报**。实测这些资源的 `byTrackedPage` 全为 `False`，即没有任何已入库页面引用它们，确认可安全排除。
- **页面已入 git 的**（`character-sample`、`editor`、`tape-wall-sample`、`wiki-style-sample` 共 4 个）：会真实部署，其引用资源必须入库。实测四页 `untrackedRefs` 全为 **0**，当前干净。

据此把扫描范围改为「8 个正式页 + 全部已跟踪的根目录 HTML」，共 12 页。扩围后检查项从 81 个增至 94 个，缺口数仍为 **18 个**，与扩围前完全一致——证明扩围既没有漏报，也没有把样板页的资源误报进来。

分级口径不变：`A 全站` 仍以 8 个正式页为基准，已跟踪样板页的引用计入引用数但不改变分级含义。
