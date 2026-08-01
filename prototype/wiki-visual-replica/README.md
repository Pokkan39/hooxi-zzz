# 绳网情报站 · 视觉复刻 Demo（prototype only）

> **性质**：基于本地官方 wiki 镜像、游戏 UI 动作参考与站内档案数据，做高保真**视觉/交互对照**原型。  
> **不是**正式站，**不会**写入 `index.html` / `app.js` / `styles.css` / `data.js`。  
> **不是**整站原样复制；按 HOOXI 讨论需要只做首页骨架 + **游戏式代理人选取 UI**。

## 打开方式

```bash
# 仓库根目录
npx --yes serve prototype/wiki-visual-replica -p 5180
```

浏览器：

- 首页：http://localhost:5180/
- 代理人选取：http://localhost:5180/agents.html

也可直接用文件协议打开，但 `fetch` 数据在部分浏览器会被拦，建议用本地静态服务。

## 页内有什么

| 页面 | 对照点 |
|------|--------|
| `index.html` | 顶栏、英雄 Banner、快捷导航金刚区、右侧关于/日志/活动、代理人精选墙 |
| `agents.html` | **游戏式角色选取**：**默认左大立绘 + 右真机斜切花名册**（3 列近方卡 / 黄框选中 / 霓虹 SELECT）；可切「档案」；底部编队槽 |

### 代理人选取（`agents.html`）

参考 B 站《绝区零》UI 界面动作合集 + 游戏内选角真机帧（`artifacts/bili-ui-dense/`），在原型内实现：

- **默认花名册态（主验收）**：左侧角色大展示 + 右侧**更陡左斜边 parallelogram 花名册**
  - **3 列近方头像卡**（约 1:1.18），下右角轻度斜切
  - 底栏对齐真机：`稀有度 + 等级N + 属性`（名字只作 `title`）
  - 选中为**游戏黄框**（`#ffde00`），不是角色 tone 描边独占
  - 左轨竖签「基础 / 技能 / 装备」可读；点之切到档案子页
  - 筛选压成右上角折叠条；点选只换左图，**不离开花名册**
- **SELECT**：右缘斜切霓虹竖条，底色偏黄绿并混入当前代理人 `--tone`
- **档案态**：右侧详情面板（基础 / 技能 / 装备）；顶部「档案 / 花名册」可切换
- **连贯动作（近似）**：静图卡面做角色分型待机（斩击 / 枪系 / 重击 / 支援 / 异常），切换时入场 pose；动效整体偏慢
- **切人转场**：斜切 `AGENT SELECT` 扫场（色相跟随角色 tone）；`prefers-reduced-motion` 下关闭
- **氛围/视差（保留）**：本地 wiki 底图多层栈 + tone 光晕 + 尘点 + 指针视差 + 左侧英文水印；**不要改成静态底**
- **交互**：底部编队、`↑↓←→` 切换、`1`/`2`/`3` 写入编队、`R` 花名册/档案、`Esc` 回花名册
- **数据**：`data/roster.json` / `data/agents.json` 同源（56 名，含 S/A/I）+ `assets/portraits/*-card.webp` + `assets/agents/` 碎图
- **样式/逻辑**：`css/select.css`、`js/select.js`
- **全动效评审**：`/agents.html?motion=1` 或 `?fx=full`（绕过系统减动效）

### 首页氛围（`index.html`）

- fixed 氛围层：`pc-page-bg` 漂移 + 侧栏底 + grain
- Banner：光晕呼吸、扫描线；立绘/底图跟随指针视差（精指针且非减动效）
- 金刚区：仅「代理人」可进，其余入口诚实标「未开」、禁止假跳转
- 精选墙：与 roster 同源；支持 S/A 筛选，rank「I」正确显示
- 全动效评审：`/?motion=1` 或 `?fx=full`

本地参考帧（artifacts，可不入库浏览）：

- `artifacts/bili-ui-dense/p01-anby/`、`p03-ellen/`、`p19-jane/`
- `artifacts/agent-select-detail.png` / `agent-select-roster.png`
- `artifacts/wiki-v1-home-fullfx.png` / `wiki-v1-agents-fullfx.png` / `wiki-v1-agents-wipe-final.png` / `wiki-v1-agents-rank-I-final.png`

## 视觉 token

- 底：`#000` / 深灰渐变舞台；面板半透明模糊
- 强调：站点黄 `#ffde00`（选中框/左轨激活）+ 角色 tone（氛围/SELECT 混色/属性点）
- 卡片：近方头像格、底栏「稀有度+等级+属性」、下右角小斜切
- 花名册板：更陡左缘 `clip-path` parallelogram + 左轨子页 + 右缘黄绿 SELECT

## 数据来源

- `data/roster.json` 与 `data/agents.json`：**同源统一**（56 名；稀有度含 `S` / `A` / `I`）
- 卡面：`assets/portraits/*-card.webp`（56/56，无缺图）
- 头像碎图：`assets/agents/`（首页精选、花名册小图等）
- 空/错态：卡片与立绘裂图占位；首页金刚区未开入口不假跳转

## 验收快照（本轮 · 对照真机）

- `artifacts/wiki-v1-agents-gameui-roster.png` — 安比：陡斜边 + 3 列近方卡 + 黄框 + 左轨 + 黄绿 SELECT
- `artifacts/wiki-v1-agents-gameui-roster-fire.png` — 般岳：主题色火橙联动，花名册布局不变
- `artifacts/wiki-v1-agents-skew-roster.png` — 上一轮斜切大板（对照）
- `artifacts/wiki-v1-agents-dense-roster.png` — 更早密铺头像墙（对照）
- `artifacts/bili-ui-dense/p01-anby/` 等 — 真机参考帧
- `artifacts/wiki-v1-home-fullfx.png` — 首页强制氛围
- `artifacts/wiki-v1-agents-wipe-final.png` — 切人斜切扫场中帧

## 明确不做

- 不接官方在线 API / 不挂米游社登录
- 不复制完整路由、编辑器、评论
- **不自动改正式站**（`stories.html` / `character.html` 等需用户明确要求才动）

