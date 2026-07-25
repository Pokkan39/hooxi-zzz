# 视觉与技术实现对照结论

> 文档版本：V1.0  
> 更新日期：2026-07-19  
> 项目目录：`F:\hooxi-zzz`  
> 文档用途：汇总官方 wiki、南孚、Active Theory（`F:/web`）三方对照，作为 HOOXI 档案站后续重建/参考依据  
> **施工边界：本文只提供分析与选型建议，不授权自动改动正式站代码。未经用户明确要求，不得把本文结论直接落到 `index.html` / `app.js` / `styles.css` / `data.js` / 角色·阵营·编辑器主链路。**

---

## 0. 先看结论

### 0.1 一句话

**wiki 管信息骨架，南孚管可落地的卷动电影感，Active Theory 管气质上限；HOOXI 三者都借，但都不整站复制。**

### 0.2 HOOXI 是什么 / 不是什么

| 是 | 不是 |
|----|------|
| Hooxi 个人品牌下的《绝区零》剧情视频档案与角色关系导航站 | 官方绳网/百科复刻站 |
| 可搜索、可分享、可长期维护的静态档案 | Active Theory Hydra 引擎整迁 |
| 可选沉浸入口 + 稳定普通档案页 | 南孚品牌官网换皮 |
| 特效服务导航与叙事 | 全站实时 WebGL 秀场 |

正式定位仍以 [`HOOXI-WEBSITE-POSITIONING-PLAN.md`](HOOXI-WEBSITE-POSITIONING-PLAN.md) 为准。

### 0.3 推荐技术配方（待用户拍板后再施工）

1. **信息架构**：沿用「阵营 · 代理人 · 主线 · 幕后 · 活动」；详情用模块拼装（学 wiki 的 modules 思路，字段按 HOOXI 叙事裁剪）。
2. **视觉实现**：CSS + 少量 JS 为默认底座；关键英雄区可用「短视频 / 序列帧 / 2D Canvas + ScrollTrigger 级 scrub」。
3. **WebGL**：仅实验田/样板（`active-theory-sample`、部分 PLAY 原型），不进全局底座。
4. **明确不做**：官方 wiki 整站皮；AT 运行时/Shader/字体/Logo 原样迁移；无明确指令改正式站。

### 0.4 本轮保护结论

| 项 | 状态 |
|----|------|
| 对照分析是否完成 | 是 |
| 是否写入正式站业务代码 | **否** |
| 允许改动的落点 | 本文档、`docs/README.md` 索引、进度日志、隔离实验页、artifacts 参考图 |
| 若需改正式首页/档案主链路 | **必须用户明确说“施工/改正式站”** |

---

## 1. 对照总表

| 维度 | 官方 wiki（绳网情报站镜像） | 南孚 `nanfu.global` | Active Theory `F:/web` | HOOXI 该怎么借 |
|------|---------------------------|---------------------|------------------------|----------------|
| 产品角色 | 综合图鉴/情报库 | 品牌长滚动叙事官网 | 重度 WebGL 作品集 | 剧情视频档案 + 关系导航 |
| 技术底座 | Nuxt/Vue SPA | 自研打包 JS + GSAP | 自研 Hydra WebGL 运行时 | 静态站点；无强制构建链 |
| 主视觉 | 工具站卡片/筛选/详情模块 | 黑底巨物 + 视频 + 帧序列 Canvas | 黑场中心装置 + 粒子 + 3D 卡墙 | 暗场克制 + 档案可读；沉浸可选 |
| 滚动叙事 | 弱（列表/详情） | 强（超长页 + scrub 时间线） | 强（场景/相机参数驱动） | 主线时间轴/章节扉页可中度使用 |
| 3D/WebGL | 基本无 | 可选轻 WebGL 痕迹，主路径 2D Canvas | 全站 WebGL | 默认不做全站；样板隔离 |
| 数据形态 | `page.modules[].components[]` API | 运营向单页区块 | CMS 项目 + UIL 相机参数 | `data.js` + catalog + enrichment |
| 维护成本 | 中高（SPA + 接口） | 中（帧序列资产重） | 很高（引擎/shader/几何） | 必须偏低，便于内容更新 |
| 复制风险 | 整站壳/文案/图 | 品牌物料/产品片 | 引擎/字体/Logo/案例 | 只学结构与方法 |

---

## 2. 官方 wiki（`F:/website-archives/zzz-wiki`）

### 2.1 视觉效果

- 典型**情报/图鉴工具站**：多栏导航、频道筛选、卡片栅格、详情模块纵向堆叠。
- 强调信息密度与可检索性，而非品牌电影感。
- 本地占位 `index.html` 极简；真实体验在 Nuxt `app.html` + `_nuxt` 资源中。

### 2.2 技术实现

| 项 | 事实 |
|----|------|
| 框架 | Nuxt / Vue SPA（`_nuxt` 大包，主 chunk 可达数 MB 级） |
| 路由 | `routes.json`：`home` / `channels` / `details`；约 14 个 `channel_ids`，约 1920 个 `content_ids` |
| 索引 | `entry-index.json`：`pages` 为 id→元数据字典（name/desc/icon 等） |
| 详情 API | `mirror/responses/*.json`：`{ retcode, message, data.page }` |
| 页面模型 | `page.modules[]` → 每模块 `components[]` → `{ component_id, layout, data, style }` |
| 前端信号 | 大量 filter / swiper / lazy；几乎无 WebGL 品牌秀 |

### 2.3 代理人详情可复用模块（示例：妮可·德玛拉）

模块并不总有可读 `name`，更多靠 component `data` 形态区分：

1. 阵营/立绘相关（如 `role_faction`）
2. 角色 TAG + 短详情 rich_text
3. 技能/能力 list（含动画图标）
4. 影画 tables
5. 待机/展示动画 list
6. **角色印象** rich_text
7. 素材/养成 tables
8. 影画/立绘展示 list
9. 养成节点 list
10. 攻略合集入口 list
11. 角色卡片资源 list
12. **角色 CV** rich_text
13. **角色故事** rich_text
14. **录像店经营留言** rich_text（强世界观彩蛋，贴近 HOOXI 气质）

### 2.4 HOOXI 借鉴 / 禁止

**借鉴**

- 频道式信息架构：阵营、角色、内容类型分离。
- 详情「模块拼装」而不是一张超长自由 HTML。
- 结构化字段 + 来源链接；短摘要优于长攻略搬运。
- 已落地路径：`agent-enrichment.js` 从归档抽取印象/故事/图集/来源（摘要，不是整站复制）。

**禁止**

- 原样复制绳网壳、导航 IA、视觉皮肤、长篇原文。
- 把 HOOXI 做成全量数值/材料养成百科。
- 无授权 bulk 镜像官方图床作为唯一资源策略（发布前需许可复核）。

---

## 3. 南孚（`https://www.nanfu.global/`）

### 3.1 视觉效果

- 首屏：**纯黑底 + 超大居中字标 `NANFU`**，弱文案，强留白。
- 顶栏：多语言 + 极简导航 + 触点 CTA（Get in touch）。
- 整体是**品牌长页叙事**，不是资料库。
- 参考截图：
  - `artifacts/nanfu-reference-home.png`
  - `artifacts/nanfu-analyze-home.png`
  - `artifacts/nanfu-analyze-scrolled.png`

### 3.2 技术实现（已实机验证）

| 项 | 事实 |
|----|------|
| 框架指纹 | 非 Next / Nuxt / Webflow / WP 主架构 |
| 脚本 | `templates/assets/index.*.js`（约 0.5MB 级，双包近似） |
| 样式 | 自研 CSS + 响应式 sheet；Noto Sans SC |
| 开场 | `home/media.webm`（约 1920×1000，muted；播完后淡出） |
| 英雄主路径 | `canvas.bannerCv`（视口尺寸 2D Canvas） |
| 帧序列 | `home/bannerFm/000xx.jpg.webp`，会话内约 **120** 帧资源 |
| 绘帧 | `getContext('2d')` + `drawImage` 封面裁切；`createFrame` + rAF，约 3.33ms 节流 |
| 辅助 Canvas | `batteryCv` 小尺寸进度/电池向动效 |
| 动效库 | **GSAP** 明显；`timeline` + **scrollTrigger scrub** |
| 交互 | scroll / wheel / touch 计数高；有 IntersectionObserver |
| 页长 | 桌面约 2 万 px 量级超长滚动 |
| 减动效 | 未见 `prefers-reduced-motion` 显式分支（HOOXI 不可照抄此缺口） |

关键时间线（从脚本片段还原）：

1. 首屏视频播放；
2. ~1.7s 级：header / 导航激活，`bannerCv` active；
3. ~2.0s 级：后续 MV/段落启动；
4. 多段 `setImg` 绑定 ScrollTrigger，滚动 scrub 驱动帧或区块。

### 3.3 HOOXI 借鉴 / 禁止

**借鉴（性价比最高的“高级感”路径）**

- 黑场 + 单一巨物主体 + 稀疏 HUD。
- 「短视频开场 → 序列帧 Canvas 接管 → 长滚动分段」链路。
- 用 **2D Canvas 抽帧**代替全站 Three.js，仍能做出卷轴电影感。
- 适合：主线时间轴扉页、章节过场、活动纪念页英雄区。

**禁止 / 风险**

- 不要每页上百帧 webp（体积与首屏会爆）；**限制在 1～2 个英雄段**。
- 不复制南孚 Logo、产品渲染、文案、多语言壳。
- 必须补 HOOXI 已坚持的：`prefers-reduced-motion`、移动降级、失败兜底。

**与现有隔离实验的关系**

- `tech-direction-demos.html` 方向 01/02/04/05 已覆盖南孚方法族。
- `cinematic-slice.html` 已用预渲染视频验证黑场进店。
- 这些都是讨论稿，**尚未**也**不应在无指令时**替换正式 `index.html`。

---

## 4. Active Theory（`F:/web`）

### 4.1 视觉效果

- 进站近纯黑 → 中心发光 Logo 装置 + 粒子雾。
- 顶右胶囊导航，字重细、不抢主视觉。
- Work：三维/纵深项目卡墙 + 左侧品类筛选。
- 参考截图：`artifacts/at-web-home-0s.png`、`at-web-home-8s.png`、`at-web-home-move.png`、`at-web-work.png`。

### 4.2 技术实现

| 项 | 事实 |
|----|------|
| 本地服 | `python F:/web/server.py` / `start.bat`（可落到 8083 等空口） |
| 主包 | `assets/js/app.*.js` 约 **1.8MB** |
| 渲染 | WebGL；`assets/js/hydra/` 分层；`assets/shaders/compiled.vs` 等 |
| 几何 | `assets/geometry`：`.bin` / `.json` |
| 参数 | `assets/data/uil*.json`：home/work/particle 相机 FOV、lerp、moveXY、lookAt 等 |
| 内容 | `cms/projects-dev.json` 约 **65** 个项目 |
| 贴图 | jpg/png 等；完整复刻还涉及 KTX2/PBR 类重资产习惯 |

这是**配置驱动的 3D 舞台引擎**，不是普通官网切图站。

### 4.3 HOOXI 借鉴 / 禁止

**借鉴**

- 暗场全屏舞台、大标题、极简 HUD。
- 低信息密度首屏，先气氛后路径。
- 列表→详情的聚焦感、背景退后感。
- 目录「左侧筛选 + 中央悬浮卡」的信息排版语言（可用 CSS 2.5D 近似，不必真 3D）。

**禁止**

- 名称、标志、项目案例、原站字体（含 NB Architekt 路线）。
- 压缩运行时、Hydra、Shader、几何原样搬迁。
- 把正式档案站绑死在 WebGL 是否成功上（与定位计划 0.4 根地址策略冲突）。

**与现有隔离实验的关系**

- `active-theory-sample.*`：独立 WebGL/GLB 气质样板。
- `cinematic-slice.*`：用 2.5D + 视频追 AT 氛围，规避引擎迁徙。
- 定位计划 1.2 节已写明 AT 参考边界，本文与之对齐。

---

## 5. 映射到 HOOXI 双层产品

```text
轻量品牌落地 / 档案首页
├─ 学 AT：黑场、稀疏 HUD、中心单一主体
├─ 学南孚：可选短视频或少量帧序列英雄段（非全站）
└─ 学 wiki：入口直达可搜索档案，不挡内容

正式档案（主链路）
├─ 学 wiki：目录、筛选、模块化详情、来源
├─ 学南孚：章节/时间轴的中度滚动叙事（克制）
└─ 不学 AT 全站引擎

HOOXI PLAY（可选沉浸）
├─ 学 AT 气质 + 南孚时序影像
├─ 现有隔离原型优先（prototype / cinematic-slice / scroll-world）
└─ 失败必须回落普通档案
```

### 5.1 成本档位建议

| 档位 | 手段 | 适用 |
|------|------|------|
| 低 | CSS 暗场、大标题、卡片、2.5D 视差 | 全站默认 |
| 中 | 短 MP4、≤48～120 帧局部序列、2D Canvas scrub、GSAP 级时间线 | 1～2 个英雄/过场 |
| 高 | 实时 WebGL / 完整 GLB 场景 | 仅 PLAY 或实验路由，可关可跳 |

### 5.2 与五向 demo 的冻结映射

| 参考站特征 | demo 方向 |
|------------|-----------|
| AT/南孚中心巨物 + 黑场 | 01 巨物首屏 |
| 南孚帧序列 / AT 滚动空间感 | 02 预渲染帧序列滚动 |
| AT Work 筛选 / wiki 频道 | 03 信号控制台 |
| 南孚开场视频 / AT 分段进入 | 04 点击才加载视频 |
| 全站必须可访问 | 05 高配/移动弱网降级 |

拍板建议（讨论用，**非施工指令**）：  
**01 气质 + 04 点击进店 + 05 降级为默认骨架；02/03 作增强段。**

---

## 6. 正式站施工闸门（保护条款）

在用户给出明确施工指令之前，以下文件视为**正式站主链路**，分析结果不得自动改写：

- `index.html`、`app.js`、`styles.css`、`multi-page.css`
- `data.js`、`agent-catalog.js`、`agent-enrichment.js`
- `stories.html` / `stories.js`
- `character.html` / `character.js`
- `faction.html` / `faction.js`
- `editor.html` / `editor.js`
- 其他已挂入主导航的公开档案页

**允许**在未另作指示时继续维护的内容：

- `docs/**` 规划与对照文档
- `progress.md` 日志
- `artifacts/**` 参考/验收图
- `prototype/**`、`*-sample.*`、`cinematic-slice.*`、`tech-direction-demos.*` 等已声明隔离物
- `F:/hooxi-new-start/**` 新起点笔记

**解除闸门的合格用户表述示例**：「按对照结论改正式首页」「施工正式档案站视觉」「把南孚卷动做到 index」。  
仅说「继续分析 / 写文档 / 做 demo」**不**构成解除。

### 6.1 可复跑闸门校验

| 项 | 路径 |
|----|------|
| 指纹基线 | `artifacts/formal-site-gate-baseline.json` |
| 校验脚本 | `scripts/check-formal-site-gate.py` |

```bash
python scripts/check-formal-site-gate.py
```

- 期望输出含：`GATE_OK ALL_FORMAL_UNCHANGED`
- 若 `GATE_FAIL`：说明主链路相对基线已变化；无施工授权应回滚，有明确授权则完工后用 `python scripts/check-formal-site-gate.py --write` 刷新基线
- **禁止**在“只做分析/文档/demo”的回合里对主链路跑 `--write` 来掩盖改动

本 protected 任务是**持续行为约束**：可反复验收“当前是否仍遵守”，**不**因单次 GATE_OK 就标 done 或移出队列。

---

## 7. 证据索引

| 类别 | 路径 |
|------|------|
| Wiki 镜像 | `F:/website-archives/zzz-wiki/`（`routes.json`、`entry-index.json`、`mirror/responses/`、`_nuxt/`） |
| AT 本地站 | `F:/web/`（`server.py`、`assets/js/app.*.js`、`uil*.json`、`cms/`、`hydra/`、`shaders/`） |
| 南孚线上 | `https://www.nanfu.global/` |
| 南孚截图 | `artifacts/nanfu-reference-home.png`、`nanfu-analyze-home.png`、`nanfu-analyze-scrolled.png` |
| AT 截图 | `artifacts/at-web-home-0s.png`、`at-web-home-8s.png`、`at-web-home-move.png`、`at-web-work.png` |
| 定位主计划 | `docs/HOOXI-WEBSITE-POSITIONING-PLAN.md` |
| 五向讨论稿 | `tech-direction-demos.html` |
| 氛围切片 | `cinematic-slice.html` |

---

## 8. 下一步（需用户选择，默认不改正式站）

1. **只固化文档（本状态）**：对照结论以本文为准，正式站冻结。  
2. **出视觉草图**：首页/角色页线框（文档或隔离 HTML），仍不改正式站。  
3. **指定页静态原型**：新建隔离页验证南孚卷动 + wiki 模块信息。  
4. **明确施工**：用户点名正式站文件与范围后再改主链路。
