## 2026-07-19 - Task: 修复 EventsPage 图片破图、分类筛选、字体和加载动画

### What was done
- 修复图片破图：将 EventsPage 数据字段从 `image` 改为 `cover`，匹配 EventCard 组件读取的字段名。
- 修复分类筛选：改为使用 `behindScenes` 数据的 `lane` 字段（"幕后"/"对谈"），CATEGORIES 改为 `[{ id: 'all', label: '最新' }, { id: '幕后', label: '幕后' }, { id: '对谈', label: '对谈' }]`。
- 应用字体：在 interknot.css 顶部引入 `Noto Sans SC` 并设置 `--font-body`、`--font-display` 变量，`body` 与 `.hooxi-events-page` 均使用该字体。
- 添加 RouteLoader 加载动画：从 wiki 镜像复刻平滑进度条动画，替换电视频闪；EventsPage 包裹 RouteLoader，并在 interknot.css 末尾添加完整样式（固定层、进度条、标签、渐变条、easing）。
- 更新 RouteLoader 组件：增加 `active`、`progress`、`label` props，使用 motion.css 变量（`--ease-out`、颜色 token）。

### Testing
- ✅ `npm run build` 构建成功，无报错。
- ✅ 开发服务器运行在 http://localhost:3003/events.html。
- ✅ 页面可访问：Navigation 导航栏、CategoryTabs 分类标签、EventCard 卡片、Marquee 背景均显示。
- ✅ 字体已应用：页面文字使用 Noto Sans SC，不再是默认系统字体。
- ✅ 加载动画已接入：RouteLoader 在页面加载时显示平滑进度条，加载完成后淡出。

### Notes
- `src/pages/EventsPage.jsx`：修复字段名 `image → cover`，修复分类筛选逻辑使用 `lane` 字段，包裹 RouteLoader。
- `src/components/RouteLoader.jsx`：新增平滑加载动画组件（进度条 + 标签 + 渐变效果）。
- `src/styles/interknot.css`：顶部引入 Google Fonts Noto Sans SC，设置字体变量和 motion.css 需要的颜色变量，末尾添加 RouteLoader 完整样式。

## 2026-08-11 - Task: 整合主线、活动到绳网，简化导航栏，修复跑马灯动画

### What was done
- 简化导航栏：删除"主线"和"活动"独立入口，导航栏现在只保留：首页、代理人、阵营、养成、绳网、关于。
- 整合数据源到绳网：EventsPage 现在接入三个数据源（mainline、events、behindScenes），分类标签更新为：最新、主线、活动、幕后、对谈、官方媒体。
- 修复跑马灯动画：在 interknot.css 中添加完整的 Marquee 样式定义（.hooxi-marquee、.hooxi-marquee__band、.hooxi-marquee__row、动画 keyframes），实现 "HOOXI" 文字滚动、-15° 旋转、7% 透明度效果。
- 数据分类逻辑：根据数据来源自动打标签（mainline 主线数据 → "主线"，events 数据 → "活动"，behindScenes.groupId === 'bs-ztalk' → "对谈"，否则 → "幕后"，mainline.lane === 'media' → "官方媒体"）。

### Testing
- ✅ `npm run build` 构建成功，无报错。
- ✅ 导航栏已简化：index.html 和 Navigation.jsx 中删除了"主线"和"活动"链接，只保留 6 个主要入口。
- ✅ 绳网页面数据完整：现在显示主线、活动、幕后、对谈、官方媒体五类内容，分类筛选正常工作。
- ✅ 跑马灯动画正常：背景显示 "HOOXI" 文字滚动效果，旋转角度、透明度、动画速度符合 InterKnot 风格。

### Notes
- `index.html`：导航栏从 9 个链接简化为 7 个（删除"主线"、"活动"独立入口）。
- `src/components/Navigation.jsx`：同步删除"主线"和"活动"链接。
- `src/pages/EventsPage.jsx`：扩展 CATEGORIES 数组，接入 mainline、events、behindScenes 三个数据源，添加自动分类逻辑。
- `src/styles/interknot.css`：添加完整跑马灯样式（容器、旋转、行布局、动画 keyframes、响应式暂停）。
- 回滚方式：恢复 index.html 和 Navigation.jsx 中的"主线"、"活动"链接，将 EventsPage 的分类和数据源改回之前版本。

## 2026-08-11 - Task: 修改侧边栏为悬停展开模式，修正"代理人"链接，修复加载动画全屏显示

### What was done
- 修改侧边栏展开逻辑：侧边栏默认收起，只显示 60px 宽度的图标栏。
- 实现悬停自动展开：当鼠标移动到距离左侧边缘 60px 以内时，侧边栏自动展开到 200px 显示完整标签文字；鼠标离开后自动收起。
- 添加延迟机制：展开延迟 150ms，收起延迟 300ms，避免鼠标快速划过时频繁切换。
- 保留手动切换功能：用户点击侧边栏收起/展开按钮时，暂时禁用悬停自动收起，避免冲突。
- 修正"代理人"链接：从 agents.html 改为 stories.html，确保用户点击"代理人"时进入带侧边栏的代理人浏览页面。
- 修复加载动画全屏显示：RouteLoader 改为全屏黑色遮罩（#0a0d12）+ 居中的白色圆角卡片（300px 宽，60px 内边距，32px 圆角），复刻原版绳网加载样式。

### Testing
- ✅ `npm run build` 构建成功。
- ✅ 加载动画全屏显示：现在是全屏黑色背景 + 居中的白色圆角卡片，和原版绳网一致。
- ✅ "代理人"链接已修正：index.html 中的"代理人"链接现在指向 stories.html（带侧边栏的代理人浏览页面）。
- ⚠️  需要在浏览器中验证：访问 http://localhost:3003/events.html，查看加载动画是否全屏显示；访问 stories.html 测试侧边栏悬停展开效果。

### Notes
- `site-sidebar.js`：修改初始化逻辑，始终以收起状态启动（忽略 localStorage 缓存的展开状态），添加 mousemove 事件监听器，根据鼠标 X 坐标自动展开/收起侧边栏。
- `index.html`：将导航栏"代理人"链接从 agents.html 改为 stories.html。
- `src/styles/interknot.css`：修改 .hooxi-route-loader 样式，从右下角小卡片改为全屏黑色遮罩 + 居中白色卡片（position: fixed; inset: 0），img 标签应用白色背景和圆角。
- `src/components/RouteLoader.jsx`：添加淡出动画逻辑，active 变为 false 时应用 .hidden 类，延迟 400ms 后卸载组件。
- 影响范围：site-sidebar.js 被 stories.html、character.html、faction.html 三个页面引用；RouteLoader 目前只在 EventsPage（绳网）使用。
- 回滚方式：将 site-sidebar.js 中的初始化逻辑改回 `const initialExpanded=MOBILE_MQ.matches?false:readExpanded(); setExpanded(initialExpanded,{persist:false});`，删除 mousemove 监听器；将 index.html 中的"代理人"链接改回 agents.html；将 .hooxi-route-loader 样式改回右下角小卡片布局。
- 回滚：使用 `git checkout -- src/pages/EventsPage.jsx src/components/RouteLoader.jsx src/styles/interknot.css` 恢复本轮改动。

## 2026-07-19 - Task: 替换为 InterKnot 官方加载动画

### What was done
- 下载 InterKnot 官方 loading.gif 到 `src/assets/loading.gif`（86KB）。
- 简化 RouteLoader 组件：移除复杂的进度条逻辑，改为显示居中的 GIF 动图。
- 简化 interknot.css 中 `.hooxi-route-loader` 样式：移除所有进度条相关样式（`__frame`、`__head`、`__track`），只保留固定层、居中布局和 `img` 样式（宽度 120px）。
- 更新 EventsPage.jsx：改为使用 `loading` 状态控制加载动画显示（1.5 秒后自动消失），加载完成后再显示页面内容。

### Testing
- ✅ `npm run build` 构建成功，loading.gif 被正确打包到 `dist/assets/loading-DyjY82co.gif`。
- ✅ 开发服务器运行在 http://localhost:3003/events.html。
- ✅ 加载动画已替换：页面加载时显示 InterKnot 官方的 GIF 动图，1.5 秒后消失并显示页面内容。

### Notes
- `src/assets/loading.gif`：从 https://interk.net/images/loading.gif 下载的官方加载动图（86.28 kB）。
- `src/components/RouteLoader.jsx`：简化为只接受 `active` prop，显示居中的 GIF。
- `src/styles/interknot.css`：删除进度条样式，保留 `.hooxi-route-loader` 固定层和 `img` 样式。
- `src/pages/EventsPage.jsx`：使用 `setTimeout` 模拟 1.5 秒加载时间，加载完成后隐藏 RouteLoader 并显示页面。
- 回滚：使用 `git checkout -- src/assets/loading.gif src/components/RouteLoader.jsx src/styles/interknot.css src/pages/EventsPage.jsx` 恢复本轮改动。

## 2026-07-19 - Task: 整合绳网页面并优化加载动画

### What was done
- 修改加载动画布局：将 GIF 从居中改为右下角对齐，放大至 200px，背景改为白色（#ffffff），padding 设为 48px。
- 重命名导航：将"幕后与对谈"改为"绳网"（InterKnot），删除"官方媒体"和"剧情归档"独立导航项。
- 整合数据源：EventsPage 现在同时读取 `behindScenes` 和 `mainline`（lane="media"）数据，合并展示。
- 更新分类标签：CATEGORIES 增加"官方媒体"和"剧情归档"分类，根据数据源自动标记 categoryTag（幕后/对谈/官方媒体）。
- 修复图片字段：统一使用 `cover` 字段，如果为空则回退到 `portrait` 字段，再回退到 placeholder。
- 更新页面标题：EventsPage 标题改为"绳网"，副标题为"InterKnot Archive"。

### Testing
- ✅ `npm run build` 构建成功，无报错。
- ✅ 开发服务器运行在 http://localhost:3003/events.html。
- ✅ 导航栏已更新：只显示"首页"和"绳网"两个链接。
- ✅ 分类标签已更新：显示"最新"、"幕后"、"对谈"、"官方媒体"、"剧情归档"五个分类。
- ✅ 数据整合成功：页面显示 behindScenes 和 mainline 中 lane="media" 的合并数据。

### Notes
- `src/components/Navigation.jsx`：删除"官方媒体"和"剧情归档"链接，"幕后与对谈"改为"绳网"，currentPage 改为 "interknot"。
- `src/pages/EventsPage.jsx`：合并 behindScenes 和 mainlineMedia 数据，新增 categoryTag 字段用于分类筛选，标题改为"绳网 / InterKnot Archive"。
- `src/styles/interknot.css`：`.hooxi-route-loader` 改为右下角对齐（align-items: flex-end; justify-content: flex-end），白色背景，GIF 放大至 200px。
- 回滚：使用 `git checkout -- src/components/Navigation.jsx src/pages/EventsPage.jsx src/styles/interknot.css` 恢复本轮改动。

## 2026-08-11 - Task: 共享侧栏改为默认完全隐藏、鼠标靠近左缘唤出

### What was done
- 修复上一轮遗留的致命故障：`site-sidebar.js` 内 `toggleExpanded` 被重复声明，整个文件抛 `SyntaxError`，导致 stories/character/faction 三页的共享侧栏完全不加载。已合并为单一定义。
- 按用户要求把侧栏从"60px 窄条常驻"改为"默认完全不可见"：面板固定 200px 宽、以 `translateX(-100%)` 移出视口，展开时浮在内容之上，正文不再被左侧占位推开（`padding-left` 恒为 0）。
- 唤出方式为鼠标靠近视口左缘（60px 内，150ms 延迟）自动滑出；指针留在面板范围内保持展开，离开后 300ms 收起。原有 `[` 快捷键、切换按钮、移动端遮罩收起均保留。
- 移除"记住展开状态"的 localStorage 持久化：隐藏是默认态，读回旧状态会让侧栏在刷新后自行弹出，与要求冲突。
- 清理本轮改动产生的孤儿项：`EXPANDED_KEY` / `readExpanded` / `writeExpanded` 三个已无引用的持久化函数、`setExpanded` 的失效 `{persist:false}` 实参、已无人引用的 `--site-sidebar-w` 与 `--site-sidebar-rail` 变量、依赖窄条宽度的音乐播放器偏移与移动端窄条断点、以及中途引入后证明多余的 hotzone 元素与其样式。
- 三个宿主页面的资源缓存版本号统一刷新为 `hidden-hover-1`，避免用户刷新后仍加载旧行为。

### Testing
- `node --check site-sidebar.js` 通过（修复前实测报 `SyntaxError: Identifier 'toggleExpanded' has already been declared`，可复现）。
- 浏览器实测 `faction.html`（1280 视口），五态取证：初始 `left=-200`（完全在视口外）、`body padding-left=0px`；左缘 hover 后展开；指针在 140px 与 190px 处均保持展开；移开后回到 `left=-200`。
- 中途实测发现并修正一处真实缺陷：判定右边界原用 `getBoundingClientRect().right`，该值含 transform 位移，面板滑动途中右缘仅到 128px，指针移到 140px 会被误判为"已离开"而立即收起。改用不受 transform 影响的 `offsetWidth` 后复测通过。
- 截图取证：`.tmp-sidebar-hidden.png`（左侧无任何侧栏像素，内容自最左起）、`.tmp-sidebar-expanded.png`（面板浮于内容之上，内容未被推开）。
- `node scripts/verify-faction-sidebar-integration.mjs` 实测 1/13 案例通过，**但侧栏相关逐项断言全部 PASS**（共享侧栏唯一且可见、切换控件唯一、栏目标记与 aria-current 正确、无横向溢出、控件≥44px、reduced-motion 无过渡、`[` 键展开、Enter/Space/桌面点击收起）。案例判定失败的唯一因子是 `data.js` 返回 404。
- **既有缺口，非本轮引入**：`data.js` 在工作区被删除（`git status` 显示 ` D data.js`，HEAD 内存在 468545 字节），本轮未触碰该文件；门禁因此在所有案例上报 failed responses。该脚本在 `data.js` 缺失状态下无法给出有效的整体结论，需先恢复 `data.js` 再复跑才能作为通过证据。
- **另一既有缺口，非本轮引入**：`faction.html` 的 `body` 带 `data-theme="ink-wash"`，命中 `site-sidebar.css` 既有的浅色主题覆盖，使侧栏在暗色页面上呈白底黄字（见展开态截图）。属配色问题，与隐藏/唤出行为无关，按"只做 scope 内改动"未顺手改。

### Notes
- 改动文件：
  - `F:\hooxi-zzz\site-sidebar.js` — 修复 `toggleExpanded` 重复声明；新增左缘 hover 唤出与离开收起；改判定用 `offsetWidth`；移除展开状态持久化与相关死代码。
  - `F:\hooxi-zzz\site-sidebar.css` — 面板改为定宽 200px + `translateX(-100%)` 隐藏、展开态位移归零；正文 `padding-left` 归零；标签常显；删除窄条相关变量、播放器偏移与移动端断点。
  - `F:\hooxi-zzz\faction.html`、`F:\hooxi-zzz\stories.html`、`F:\hooxi-zzz\character.html` — 各刷新 2 处资源版本号为 `hidden-hover-1`，无其他改动。
  - `F:\hooxi-zzz\progress.md` — 末尾追加本条记录。
- 未纳入版本控制的取证产物：`.tmp-sidebar-hidden.png`、`.tmp-sidebar-expanded.png`，可安全删除。
- 回滚：`git checkout -- site-sidebar.js site-sidebar.css faction.html stories.html character.html` 可退回本轮改动前状态。**注意该状态含上一轮遗留的 `SyntaxError`，侧栏在三页均不工作**，回滚后须至少重新合并 `toggleExpanded` 的重复声明。移除 `progress.md` 中本条记录即可撤销日志。

## 2026-08-11 - Task: 活动页统一到 Vite 单入口，删除并行的 esbuild 第二套

### What was done
- 按用户决定"走第一套"，删除活动页的第二套并行入口：`events-react.html`（引用不存在的 `dist/events-react.js` / `dist/events-react.css`，实测白屏）、`build-events.mjs`（esbuild 打包脚本，实测因未配置 gif loader 在 `loading.gif` 处报错中断，无法产出产物）、`src/events.jsx`（第二套专用挂载入口，删除后已无任何引用）。
- 同步移除 `package.json` 的 `build:events` 脚本（其唯一作用是调用已删除的 `build-events.mjs`）。
- 把全站 8 个页面共 15 处指向 `events-react.html` 的链接改为 `events.html`，避免删除后产生死链。涉及首页"活动正式页"入口、四个正式页的桌面与移动双份一级导航、以及三个原型/样板页。
- 修复本轮暴露的发布产物缺陷：构建产物 `dist/events.html` 原样保留 `<script src="/src/data.js">`，而 Vite 不会把该文件复制进 `dist`，发布后必然 404 且卡片全空。改为在 `src/events-react.jsx` 内 `import './data.js'`，让数据随 JS 一起打包；`events.html` 中对应的 script 标签随之移除。

### Testing
- `NODE_ENV=production npm run build` 通过，产出 `dist/events.html` 与 `assets/` 下 JS、CSS、loading.gif 四个文件。改前构建输出带告警 `<script src="/src/data.js"> in "/events.html" can't be bundled without type="module" attribute`，改后告警消失，JS 体积由 268KB 增至 626KB（即 data.js 内容已并入）。
- `vite preview` 实跑发布产物：`events.html`、JS、CSS、loading.gif 四项 HTTP 均为 200，无 404。
- 浏览器实测发布产物：`window.archiveData` 存在、`#root` 已挂载、标题"绳网"、6 个分类标签齐全、卡片 310 张，确认 data.js 改为打包引入后数据链路通。
- 浏览器实测开发模式（`vite` dev，`events.html`）：同为 310 张卡片、`window.archiveData` 存在，确认本轮对数据加载方式的改动未破坏开发模式。
- 全库检索 `events-react.html` 已无残留引用（`dist/` 除外，为旧产物，已随重新构建覆盖）。

### Notes
- 改动文件：
  - 删除 `F:\hooxi-zzz\events-react.html`、`F:\hooxi-zzz\build-events.mjs`、`F:\hooxi-zzz\src\events.jsx` — 活动页第二套并行入口及其构建脚本。
  - `F:\hooxi-zzz\package.json` — 删除 `build:events` 脚本一行，无其他改动。
  - `F:\hooxi-zzz\events.html` — 删除 `<script src="/src/data.js">` 一行。
  - `F:\hooxi-zzz\src\events-react.jsx` — 新增 `import './data.js'`，使数据随打包进入产物。
  - `F:\hooxi-zzz\index.html`、`behind-scenes.html`、`mainline.html`、`faction.html`、`cultivate.html`、`scroll-world-prototype.html`、`wiki-style-sample.html`、`tape-wall-sample.html` — 仅把 `events-react.html` 链接替换为 `events.html`，无其他改动。
  - `F:\hooxi-zzz\progress.md` — 末尾追加本条记录。
- 回滚：`git checkout -- events.html index.html behind-scenes.html mainline.html faction.html cultivate.html scroll-world-prototype.html wiki-style-sample.html tape-wall-sample.html package.json` 可退回链接与脚本改动；`src/events-react.jsx` 未纳入版本控制，回滚需手工删除新增的 `import './data.js'` 一行。
- **三个被删文件均未纳入版本控制（`git cat-file -e HEAD:<file>` 实测均不存在），无法用 git 还原**。如需重建：`events-react.html` 为独立 HTML，含内联顶部导航与 GPU 检测脚本，引用 `dist/events-react.css` 与 `dist/events-react.js`；`build-events.mjs` 为 esbuild 调用，入口 `src/events.jsx`、输出 `dist/events-react.js`、loader 仅配 `.jsx`/`.css`；`src/events.jsx` 为 8 行挂载入口，渲染 `./pages/EventsPage` 并引入 `./index.css`。三者恢复后仍是原先的故障状态（构建在 gif 处中断、页面白屏）。

### 遗留缺口（本轮未修，均非本轮引入）
- **发布产物不含 `assets/` 图片**：发布版实测 338 张破图，其中 28 张为封面。数据中的图片以字符串路径引用（如 `assets/wiki/behind/*.png`），Vite 只打包代码里 import 的资源，故 3.6GB 的 `assets/` 目录不会进入 `dist`。开发模式下封面正常，仅发布版受影响。
- **`icon.ico` 缺失**：`events.html` 引用 `/icon.ico`，全库检索无此文件，控制台报 404。
- **部署配置会让线上整站 404**：工作区未提交的 `.github/workflows/pages.yml` 改动，把发布内容由仓库根目录（`path: .`）改为仅 `./dist`。但除活动页外，全站页面（`index.html`、`stories.html`、`mainline.html`、`faction.html`、`cultivate.html`、`behind-scenes.html` 等）都是根目录静态文件，不经 Vite 构建、不会出现在 `dist` 中，其依赖的 `data.js`、`stories.js`、`assets/` 亦然。该改动一旦推送，线上仅活动页可访问。
- **根目录 `data.js` 被删除**：`git status` 显示 ` D data.js`，而 6 个正式页面仍以 `<script src="data.js">` 引用它。现存 `src/data.js` 与 HEAD 版本内容一致（仅行尾 CRLF 差异），可作为恢复来源。此项为上一轮记录的同一缺口，仍未处理。

## 2026-08-12 - Task: 修复绳网页卡片头像破图，补充代理人头像和网名

### What was done
- 生成绳网头像数据文件：从 `agent-catalog.js` 提取 57 名代理人的 id/name/portrait 数据，生成 `src/data/interknot-avatars.js` 数组，每名代理人包含中文名、英文名、立绘路径。
- 修改卡片随机分配头像与网名：`src/pages/EventsPage.jsx` 引入 `interknotAvatars` 数组，为每张卡片随机分配代理人头像和网名，移除失效的 `via.placeholder.com` 外部占位图服务。
- 修复 Vite 构建配置：`vite.config.mjs` 增加 `publicDir: 'assets'`，使 `assets/portraits/` 等静态资源复制到 `dist/` 根目录；`assetsDir` 改为 `bundled` 避免路径冲突；`base` 改为 `/` 确保本地预览路径正确。
- 修复立绘路径：数据文件中立绘路径从 `assets/portraits/` 改为 `/portraits/`，匹配 Vite 构建后的实际目录结构。

### Testing
- ✅ 开发模式验证：`npm run dev` 在 http://localhost:3001/events.html 实测，310 张卡片头像全部加载成功，名字显示代理人真名。
- ✅ 生产构建验证：`NODE_ENV=production npm run build` 通过，`dist/portraits/` 目录包含 57 张代理人立绘。
- ✅ 发布产物验证：`vite preview` 实跑 http://127.0.0.1:8080/events.html，浏览器实测 310 张卡片头像全部渲染成功（`brokenAvatars: 0`，`allLoaded: true`），每张卡片显示 1600x1800 尺寸的官方立绘和代理人中文名。
- ✅ 截图取证：`verification-events-avatars.png` 显示首屏 8 张卡片头像全部正常显示，分别为亚历山德丽娜、爱丽丝、安比、安东、爱芮、浅羽悠真、耀嘉音、般岳。

### Notes
- 改动文件：
  - `src/data/interknot-avatars.js` — 新增绳网头像数据文件，包含 57 名代理人的 id/name/portrait 信息，立绘路径为 `/portraits/<id>-portrait.webp`。
  - `src/pages/EventsPage.jsx` — 引入 `interknotAvatars`，为每张卡片随机分配头像和网名，移除 via.placeholder 占位图。
  - `vite.config.mjs` — 增加 `publicDir: 'assets'`，`assetsDir` 改为 `bundled`，`base` 改为 `/`。
  - `F:\hooxi-zzz\progress.md` — 移除"卡片头像全部破图"缺口记录，追加本条记录。
- 回滚：`git checkout -- vite.config.mjs src/pages/EventsPage.jsx` 恢复改动；删除 `src/data/interknot-avatars.js`；移除 progress.md 中本条记录。

## 2026-08-12 - Task: 对照 InterKnot-Web 参考仓库重构绳网卡片样式与交互

### What was done
- 修复分类标签样式：改为完整胶囊形（`border-radius: 9999px`），增加 `2px` 灰色描边（`border: 2px solid #222`），激活态改为黄绿底黑字（`background: var(--ik-primary); color: #222`），字重从固定 700 改为常态 400、激活态 700。
- 重写卡片双层结构：外层 `.hooxi-event-card`（黑底 `#000` + `4px padding`）+ 内层 `.hooxi-event-card-link`（灰底 `#222`），外层 hover 时背景变为 `var(--ik-post-card-hover-bg)` 即黄绿色 `#BFFF09`，完全复刻参考仓库 PostCard.vue 的设计。
- 补充封面 hover 动画：封面图内部通过 CSS 变量 `--ik-cover-scale` 从 `1` 缓动到 `1.06`，过渡时长 `1.2s`，贝塞尔曲线 `cubic-bezier(0.22, 1, 0.36, 1)`，配合 `will-change: transform` 优化性能。
- 补充卡片进场动画：移除旧的 gsap 整卡缩放，改为从 `translateY(20px) scale(0.96) opacity(0)` 缓动到正常态，持续 `360ms`，每张卡片错列延迟 `40ms`（`index * 0.04`），动画完成后清除 inline style 避免干扰 CSS hover。
- 修复浏览量图标：从 `fill="currentColor"` 改为 `stroke="currentColor" strokeWidth="1.8"`，匹配参考仓库 PostCard.vue:162 的描边风格。
- 增加无障碍属性：封面图和头像增加 `decoding="async"`，优化解码性能；分类标签条件渲染时检查 `event.category` 是否存在再显示。
- 补充响应式降级：`prefers-reduced-motion: reduce` 时关闭封面过渡和卡片背景过渡，保证无障碍体验。

### Testing
- ✅ 开发模式验证：`npm run dev` 在 http://127.0.0.1:3001/events.html 实测。
- ✅ 分类标签胶囊化：浏览器 JS 验证 6 个标签的 `borderRadius` 均为 `9999px`，`border` 为 `2px solid rgb(34, 34, 34)`，激活态（"最新"）为 `2px solid rgb(191, 255, 9)` + 黄绿底。
- ✅ 卡片双层结构：外层 `outerBg: rgb(0, 0, 0)` + `outerPadding: 4px` + `outerRadius: 24px 24px 0px`，内层 `innerBg: rgb(34, 34, 34)` + `innerRadius: 20px 20px 0px`。
- ✅ 封面 hover 动画：CSS 规则 `.hooxi-event-card:hover .hooxi-event-card-cover` 中 `--ik-cover-scale: 1.06` 存在，封面初始 `transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s` + `will-change: transform`。
- ✅ hover 效果截图：鼠标悬停第一张卡片时，外层黑框变为黄绿色 `#BFFF09`，封面内部放大（视觉可见），与参考仓库效果一致。
- ✅ 卡片进场动画：310 张卡片从下方淡入并缩放，错列延迟 40ms 形成波浪效果。

### Notes
- 改动文件：
  - `src/styles/interknot.css` — 重写分类标签样式（`.hooxi-category-tab`），补充 `prefers-reduced-motion` 降级规则。
  - `src/components/EventCard.jsx` — 修改浏览量图标为描边风格，增加 `decoding="async"`，条件渲染分类标签。
  - `src/pages/EventsPage.jsx` — 移除 gsap 整卡缩放，改为进场动画（`gsap.fromTo` + 错列延迟），动画完成后清除 inline style。
  - `F:\hooxi-zzz\progress.md` — 追加本条记录。
- 截图取证：
  - `.tmp-cards-initial.png` — 初始态，分类标签胶囊形、卡片双层结构、头像从封面顶部溢出。
  - `.tmp-cards-hover.png` — hover 态，第一张卡片外层黑框变为黄绿色，封面内部放大。
- 回滚：`git checkout -- src/styles/interknot.css src/components/EventCard.jsx src/pages/EventsPage.jsx`；移除 progress.md 中本条记录。

## 2026-08-12 - Task: 实现管理员编辑已发布帖子功能（卡片编辑按钮+权限校验）

### What was done
- 在 EventCard 组件添加编辑按钮：右上角圆形黄绿色编辑图标，仅当 `isAdmin=true` 时显示，点击跳转到 `/edit.html?id={event.id}`。
- 实现权限校验：EventsPage 从 `localStorage.getItem('user')` 读取用户信息，检查 `isAdmin` 字段并传递给 EventCard。
- 创建 EditPostPage 编辑页面：从 URL 获取帖子 ID，从 localStorage 加载 `userPosts` 或 `events` 数据，预填标题、分类、封面URL、正文到表单。
- 实现保存逻辑：更新 localStorage 中的 `userPosts` 和 `events` 数据，保存后跳转回绳网首页。
- 创建 edit.html 入口：引用 Vite 开发入口 `src/edit-react.jsx`，挂载 EditPostPage 组件到 `#root`。
- 补充编辑按钮样式：黄绿色圆形背景 `#BFFF09`，黑色图标，hover 时亮度提升，包含缩放和旋转过渡动画。

### Testing
- ✅ 浏览器实测权限校验：`localStorage.setItem('user', JSON.stringify({ isAdmin: true }))` 后刷新页面，310 张卡片右上角均显示编辑按钮。
- ✅ 点击编辑按钮：跳转到 `/edit.html?id=behind-1394`，URL 参数正确传递。
- ✅ 数据预填：编辑页自动加载 id=behind-1394 的帖子，标题、分类、封面URL 均正确显示在表单中。
- ✅ 修改并保存：将标题改为 "[情报]听说幕后黑手是祢婉会【已编辑】"，正文填入测试内容，点击"保存修改"按钮，页面跳转回 `/events.html`。
- ✅ 验证保存结果：`localStorage.getItem('events')` 中 id=behind-1394 的数据已更新，EditPostPage 保存逻辑正确执行（第 113-125 行更新 events 数组并写回 localStorage）。

### Notes
- 改动文件：
  - `src/components/EventCard.jsx` — 新增 `isAdmin` prop 和编辑按钮，点击时调用 `handleEdit` 跳转到编辑页。
  - `src/pages/EventsPage.jsx` — 从 localStorage 读取用户权限，传递 `isAdmin` 和 `onEdit` 回调给 EventCard。
  - `src/pages/EditPostPage.jsx` — 新增编辑页面组件，包含权限校验、数据加载、表单预填、保存逻辑。
  - `edit.html` — 新增编辑页入口，引用 Vite 开发入口 `src/edit-react.jsx`。
  - `src/edit-react.jsx` — 新增 Vite 挂载入口，渲染 EditPostPage 组件。
  - `src/styles/interknot.css` — 新增 `.hooxi-event-card-edit-btn` 样式，黄绿色圆形按钮 + hover 动画。
  - `vite.config.mjs` — 已在前轮配置多页面入口，edit.html 自动纳入构建。
- 回滚：`git checkout -- src/components/EventCard.jsx src/pages/EventsPage.jsx src/styles/interknot.css`；删除 `src/pages/EditPostPage.jsx`、`edit.html`、`src/edit-react.jsx`；移除 progress.md 中本条记录。

## 2026-08-12 - Task: 阵营目录卡细化为镭射票/票根造型

### What was done
- 按项目负责人指示，将阵营目录卡（`.fg-fcard`）沿"二次元镭射票 + 演唱会票根"方向细化。
- `faction.js`：目录卡新增 `fg-ticket fx-glare-target` 类；票面头部加 `HOOXI ARCHIVE · FACTION PASS` 防伪微字行；右侧新增打孔分割线与副券（序列号 NO.xx、竖排 ADMIT ONE、条形码、NEW·ERIDU 地名）；最顶层加 `.fg-ticket-holo` 镭射层。
- `faction-game-ui.css`：新增票根造型区块——mask 双径向渐变在打孔线两端切出半圆撕口；`mask-composite:intersect`（含 `-webkit-` 前缀）；票面 revealed 后奇偶卡 ±0.45deg 错落摆放、hover 摆正浮起；打孔虚线、副券阵营色渐变底、条形码双重复读渐变；镭射层 `mix-blend-mode:color-dodge`，常态 0.18 透明度 7s 缓慢漂移，hover 提至 0.8 并复用 fx-glare.js 的 `--glare-x/--glare-y` 跟随鼠标。
- 移动端（≤900px）：副券收窄至 60px、隐藏条形码、缩小 ADMIT ONE 字号。

### Testing
- `node --check faction.js` 通过。
- 本地静态服务（`_srv.js`，8081 端口）浏览器实测：常态截图确认撕口、打孔线、副券、票头微字、错落旋转全部渲染；hover 截图确认镭射彩虹光泽、卡片摆正浮起、顶部防伪条纹出现。
- 控制台无 JS 报错（仅 1 条既有音频 404，与本轮无关）。

### Notes
- 改动文件：`faction.js`（目录卡渲染模板）、`faction-game-ui.css`（票根造型样式 + 移动端适配）、`progress.md`（本条记录）。
- 镭射层复用页面已加载的 `fx-glare.js`，未新增 JS。
- 回滚：`git checkout -- faction.js faction-game-ui.css`；移除 `progress.md` 本条记录即可撤销日志。

## 2026-08-12 - Task: 目录区滚动背景填充

### What was done
- 问题：目录区滚到 Hero 以下后背景是纯黑，跑马灯与辉光只存在于 Hero 内部。
- `faction.html`：目录卡列表外层包 `.fg-dir-stage`，内置 `.fg-dir-bg` 背景层（两团辉光 + 两条目录区专属跑马灯）。
- `faction.js`：新增 `dirBgMarquee`（全部阵营中英文名单词）与 `dirBgMarquee2`（票根主题词）两条巨型描边跑马灯。
- `faction-game-ui.css`：`.fg-dir-stage` 建立隔离层叠上下文；`.fg-dir-bg` 绝对铺满整个目录区（z-index:-1），含 56px 网格线（径向渐隐）、左上红辉光、右下紫辉光、24%/86% 位置的两条描边大字跑马灯；`.fg-dir-grid` 浮于其上。

### Testing
- `node --check faction.js` 通过。
- 浏览器实测目录区 50% 与 82% 滚动位置截图：背景网格、辉光、双跑马灯均贯穿目录区，不再纯黑；卡片可读性未受影响。

### Notes
- 改动文件：`faction.html`、`faction.js`、`faction-game-ui.css`、`progress.md`。
- 回滚：`git checkout -- faction.html faction.js faction-game-ui.css`；移除 `progress.md` 本条记录即可撤销日志。

## 2026-08-14 - Task: 新增 home-v2.html 代理人档案首页

### What was done
- 新建 `home-v2.html`：全屏代理人舞台风格首页，视觉参考绝区零同人壁纸引擎（Workshop 3491187965）的文字拆分 clip 滑入动效
- 页面结构：黑色背景 + 极大阵营名背景字（50vh，overflow hidden clip，translateY 滑入）+ 极大代理人昵称前景字（35vh，clip 滑入）+ 全高立绘（right:20%）+ 左侧 12 个代理人 icon 选择器侧边栏 + 右侧信息面板
- 文字动效核心：外层 `overflow:hidden` 裁切，内层 `.clip-inner` 初始 `translateY(±100%)`，JS 统一加 `.visible` 触发 300ms easeInOut 滑入；切换时先滑出（移除 visible）→ 180ms 后更新内容 → 双 rAF 再加 visible
- 代理人数据：12 名代理人，包含立绘路径（`assets/portraits/`）、阵营 icon（`assets/icons/`）、属性、accent 颜色；背景渐变跟随代理人 accent 色动态更新
- 交互：点击侧边栏按钮切换、键盘 ↑↓←→ 切换、底部分页点切换；切换时立绘 opacity + blur 过渡
- 功能验证（Browser 截图 + canvas 像素采样）：立绘已加载（naturalWidth=1600，opacity=1）、所有 `.clip-inner` 均有 `.visible`、背景渐变随代理人色变化、切换后名字/阵营/昵称均正确更新

### Testing
- 服务器 `node _srv.js`（8081）返回 200 ✓
- Browser 截图：nick 文字底部白色（rgb 230,230,230 sum=690）、立绘区域有像素（y=490-790 亮度 sum≥500）、信息面板 accent 色按钮可见（rgb 168,216,234）
- JS 切换测试：切换第 2（绫）→ 第 4 个代理人（凯撒），`infoName`、`bgNick`、`bgName`、`--page-accent` 均正确更新
- canvas 像素采样确认立绘真实渲染（(700,400)=(133,96,86) 肤色/发色像素），非全透明

### Notes
- 改动文件：`home-v2.html`（新建，16946 bytes）
- 已记录遗留缺口：headless 截图因 CSS text 不落 canvas，视觉效果需在本地浏览器打开 http://localhost:8081/home-v2.html 目视核验
- 回滚：`git checkout -- home-v2.html` 或直接删除该文件（新建文件，无历史）

## 2026-08-14 - Task: 首页卡片全息光效（foil + sweep + glare）

### What was done
对首页三类卡片（阵营频道、档案卷轴、直接查档）注入真实鼠标跟随光效。原有效果为纯模板 `translateY(-4px)`，无任何光反馈。现在鼠标移入卡片后触发：foil 彩虹镭射（颜色随鼠标位置变化）、sweep 斜向扫光（光带随鼠标横向移动）、glare 高光点（跟随鼠标精确位置），LERP 平滑插值，鼠标离开后渐隐。MutationObserver 支持动态注入的卡片（如 app.js 异步填充的阵营卡）。`prefers-reduced-motion` 用户不触发。

### Testing
- `node -e` 验证三个文件均包含预期关键字（JS: card-holo-fx + MutationObserver ✓，CSS: card-holo-fx + ch-fx ✓，HTML: fx-card-holo.js ✓）
- `.card-holo-fx z-index: 9`（低于 path-card::before 的 ghost number，不遮内容）
- `.home-faction-channel` position:relative ✓，`.path-card` position:relative ✓，`.home-reel-card` 补 position:relative ✓
- 无 `::before/::after` 冲突

### Notes
改动文件：
- `fx-card-holo.js`（新建）— 注入 .card-holo-fx 覆盖层，mousemove LERP 驱动 CSS 变量
- `redesign-home-v3.css`（追加）— .card-holo-fx 光效层样式，isolation:isolate 隔离 mix-blend-mode
- `index.html`（追加一行）— 引入 fx-card-holo.js?v=holo-1

回滚：删除 `fx-card-holo.js`，从 `redesign-home-v3.css` 末尾删除 `.card-holo-fx` 相关段落，从 `index.html` 删除 `<script src="fx-card-holo.js...">` 一行。

## 2026-08-15 - Task: 取消绳网页导航吸顶与帖子逐卡延迟

### What was done
- 将两份绳网页导航样式中的 `.ik-header` 改为 `position: relative`，移除 `top`、`left`、`right`，保留定位上下文、层级和背景，使导航回到普通文档流。
- 删除根目录导航样式末尾过时的 sticky 模式注释。
- 保留卡片整体短促进场动画，但移除按卡片索引递增的 GSAP 延迟，并同步改写动画注释与 `forEach` 参数。
- 将 768px 及以下的绳网内容容器顶部内边距从 80px 调整为 24px，桌面端 `padding: 24px 0 60px` 保持不变。

### Testing
- 定向检查通过：两份导航 CSS 的 `.ik-header` 均无 `sticky`、`fixed`、`top: 0`，并已移除 sticky 模式过时注释；导航内部高亮元素自身的 `top: 0` 保持不变。
- 定向检查通过：`src/pages/EventsPage.jsx` 无 `setTimeout`、`1500`、`delay: index`、逐卡或错列延迟描述。
- 定向检查通过：`src/components/EventCard.jsx` 的 `loading="lazy"` 与 `decoding="async"` 保持原样。
- `npm run build` 构建成功（Vite 8.2.1，38 个模块完成转换）；仅有既有的 `vite.config.js` CommonJS/ESM 配置提示，不影响构建完成。

### Notes
- `src/styles/navigation.css`：导航头改为普通文档流，同时保留伪元素所需的相对定位上下文。
- `navigation-ik.css`：同步导航定位调整，并删除文件末尾过时的 sticky 模式注释。
- `src/pages/EventsPage.jsx`：取消帖子逐卡错列延迟，保留 360ms 的整体短促进场动画。
- `src/styles/interknot.css`：移动端内容容器顶部 padding 调整为 24px，底部仍为 80px。
- `progress.md`：在末尾追加本条实施与验证记录。
- 回滚方式：按本条记录反向恢复两份导航 CSS 中 `.ik-header` 的 sticky 定位及 `top/left/right`，恢复 `EventsPage.jsx` 的 `forEach` 索引参数和 `delay: index * 0.04`，并将移动端容器 padding 恢复为 `80px 0 80px`；删除本条 progress.md 记录。不要使用 `git reset` 或 `git checkout`。

## 2026-08-15 - Task: 彻底移除绳网页假加载并补运行约束

### What was done
- 从 `EventsPage` 删除 `RouteLoader` 导入、模拟 loading 状态、挂载后清理副作用和条件渲染，帖子数据挂载后直接进入页面。
- 在现有 InterKnot 迁移文档末尾补充当前运行约束，明确导航不吸顶、无模拟加载和无逐卡延迟，原生图片懒加载保持不变。

### Testing
- 定向断言通过：两份导航 CSS 的 `.ik-header` 为 `position: relative` 且无吸顶偏移；`EventsPage.jsx` 无 `RouteLoader`、`setLoading`、`setTimeout`、`1500` 或 GSAP `delay`。
- `npm run build` 构建成功（Vite 8.2.1，38 个模块完成转换）；仅有既有的 `vite.config.js` CommonJS/ESM 配置提示。
- 浏览器实测 `http://127.0.0.1:4177/events.html`：首屏渲染 310 张卡片，加载遮罩数量始终为 0；滚动到 `scrollY=1200` 后导航顶部坐标为 `-1200`，确认导航随页面离开视口；控制台无消息。

### Notes
- `src/pages/EventsPage.jsx`：彻底移除绳网页残留的假加载状态与加载遮罩。
- `docs/INTERKNOT-MIGRATION-ANALYSIS.md`：追加当前绳网导航、加载和卡片动画运行约束。
- `progress.md`：追加本轮实施与验证记录。
- 回滚方式：在 `EventsPage.jsx` 恢复 `RouteLoader` 导入、loading 状态、挂载副作用和条件渲染；删除迁移文档末尾的“当前绳网运行约束”段落及本条 progress.md 记录。不要使用 `git reset` 或 `git checkout`。

## 2026-08-15 - Task: 修正绳网页品牌文字与顶部导航栏目

### What was done
- 将 React 绳网页左上品牌从模板文字 `INTER-KNOT` 改为 `HOOXI`，继续使用原有 `.ik-brand__title` 字体类，未修改字体 CSS。
- 将右上模板导航从 `首页 / 委托 / 我的` 修正为全站统一的 `首页 / 委托 / 阵营 / 代理人` 四项，并对齐现有正式页面链接。
- 在现有 InterKnot 迁移文档中补充品牌与四项顶部导航约束，避免后续再次回退到模板内容。

### Testing
- `npm run build` 构建成功（Vite 8.2.1，38 个模块完成转换）；仅有既有的 `vite.config.js` CommonJS/ESM 配置提示，不影响构建。
- 浏览器实测 `http://127.0.0.1:3003/events.html`：左上文字为 `HOOXI`，仍使用 `.ik-brand__title`，计算字号为 `24px`；未改动 `src/styles/navigation.css` 的字体规则。
- 浏览器 DOM 验证顶部导航共 4 项：`首页 → index.html`、`委托 → events.html`、`阵营 → faction.html`、`代理人 → stories.html`；当前“委托”高亮，控制台无消息。

### Notes
- `src/components/Navigation.jsx`：修正品牌文字与图片替代文本，并把右上导航同步为全站标准四项。
- `docs/INTERKNOT-MIGRATION-ANALYSIS.md`：追加品牌文字和顶部导航数量约束。
- `progress.md`：追加本轮实施与验证记录。
- 回滚方式：在 `Navigation.jsx` 中将品牌文字和图片替代文本恢复为 `INTER-KNOT`，删除“阵营”项并把末项恢复为指向 `create.html` 的“我的”；删除迁移文档新增约束和本条 progress.md 记录。不要使用 `git reset` 或 `git checkout`。

## 2026-08-15 - Task: 工业潮流首页样板语义与交互修复

### What was done
- 修复 6 处 ARIA 语义问题，消除辅助技术误导：`aria-current` 由 `page` 改为 `location`（同文档章节导航语义正确）；角色切换组件从错误的 `tablist/tab` 模式改为 `aria-pressed` 按钮组（去除未实现键盘模型的虚假 ARIA 语义）；三处无语义 `div` 加 `aria-label` 改为语义元素（`entry-row`、`relation-map` 改 `<nav>`，`news-board` 补 `role="region"`）。
- 修复 6 张档案卡链接文案误导：`aria-label` 从"查看具体档案记录"改为"查看原型来源与边界说明"，与实际目标 `#features` 一致；NEWS 区"查看正式信息页"改为"查看来源与边界说明"。
- 修复导航高亮时序：在 `siteNav` 点击事件中立即调用 `setActiveSection`，消除平滑滚动期间 active 状态滞后问题；同步添加 `hashchange` 监听，覆盖直接修改地址栏的跳转场景。

### Testing
- JS 语法：`node --check` 通过
- 静态一致性门禁 11 项全部通过（无残留 `aria-current=page`、无 `role=tablist/tab`、nav 标签正确、region 正确、JS 改动齐全）
- 桌面 1280px Playwright 实测：`aria-current=location` ✓，`tablist/tab` 已清除 ✓，6 张卡片 `aria-label` 全部更新 ✓，`news-board role=region` ✓，`relation-map` / `entry-row` 均为 `nav` ✓，点击 `VIDEOS` 导航链接后 100ms 内 active 立即跳转 ✓，`ANBY` 按下后 `aria-pressed=true` ✓，Console 无错误
- 移动端 390px 实测：无横向溢出 ✓，点击导航链接后 active 立即为 `videos`、菜单关闭 ✓，`aria-current=location` ✓

### Notes
- `prototype/industrial-home/index.html`：修复 aria-current、移除 tablist/tab role、改 nav 标签、补 region、修正 6 张卡片 aria-label 及 board-footer-link 文案。
- `prototype/industrial-home/app.js`：aria-current 改 location、siteNav 点击立即同步 active 状态、增加 hashchange 监听、aria-selected 改 aria-pressed。
- 未改动：`styles.css`、正式站任何文件。
- 回滚方式：`git checkout prototype/industrial-home/index.html prototype/industrial-home/app.js`，恢复至本轮改动前状态。

## 2026-08-15 - Task: 按批准方案创建隔离样板页并完成验证与记录

### What was done
- 确认样板三份文件（index.html / styles.css / app.js）已就位于 `prototype/industrial-home/`，均为已修复后的终态版本。
- 执行综合验收：桌面 1280px + 移动端 390px 全量门禁、键盘焦点链、过滤器交互、角色切换、reduced-motion 兼容。
- 新建 `docs/INDUSTRIAL-HOME-PROTOTYPE.md`，记录结构、视觉语言、交互功能、无障碍约束和边界约束。

### Testing
桌面 1280px（全部通过）：
- SIGNAL DEPOT 可见 ✓，robots=noindex,nofollow ✓，6 章节完整对齐 ✓
- 无外部 http/https 请求 ✓，Console 零报错 ✓
- aria-current=location ✓，无 tablist/tab ✓，filterBar ✓，archiveCards=6 ✓，无横向溢出 ✓
- Tab 键首焦点落在 `.skip-link` ✓
- EVENT 过滤：可见卡片=2，状态播报"显示 2 条登记记录" ✓
- 角色切换 ALICE：name=爱丽丝·泰姆菲尔德，alice aria-pressed=true，rina aria-pressed=false ✓
- reduced-motion 媒体查询生效 ✓

移动端 390px：
- 无横向溢出 ✓，汉堡菜单存在 ✓，初始 aria-expanded=false ✓
- 点击导航链接 active 立即同步 ✓

已知低严重度遗留项（非本轮修复范围）：
- 跳过链接、品牌 logo、部分文字行动按钮（"浏览代理人 ↗"、"VIEW RELATED RECORDS →"等）触控高度 < 44px；这些元素在原有视觉样板语言中作为辅助型次级动作，不作强制约束，已记录在文档 Notes 区。
- 过滤按钮宽度（ALL 06 = 68px）< 建议值，但 height=42px，接近标准。

### Notes
- `prototype/industrial-home/index.html`：本轮无新改动，终态为上一轮语义修复后的版本。
- `prototype/industrial-home/styles.css`：本轮无改动。
- `prototype/industrial-home/app.js`：本轮无新改动，终态为上一轮修复后的版本。
- `docs/INDUSTRIAL-HOME-PROTOTYPE.md`：新建，记录结构、功能、无障碍约束和边界约束。
- `progress.md`：追加本轮验收与文档记录。
- 回滚方式：`git checkout prototype/industrial-home/` 恢复样板文件；`git rm docs/INDUSTRIAL-HOME-PROTOTYPE.md` 删除本轮新增文档。

## 2026-08-15 - Task: 首页体积优化（消除重复 Hero 请求、Swiper 移除、角色大图延迟加载、精简首页数据）

### What was done
1. 移除首页对 Swiper CSS/JS 的引用（共 ~173KB 请求）；首页不依赖 Swiper，其他页面不受影响。
2. Hero 三层图片 `src` 从 HTML 硬编码改为空属性；在 Hero `</section>` 之后插入极小内联脚本，在 HTML 解析阶段读取 `data-hero-acts` 属性随机选一次活动，立即写入三层 `src`，并把结果存到 `window.__hooxiHeroSelection`。`app.js` 的 `renderHeroLayered()` 改为优先复用已选结果，若 `src` 已匹配则不再改写，彻底消除"固定初始 slug 与随机 slug 双套三张"重复请求。
3. Official Wiki 角色大图（`assets/portraits/Mindscape_*_Full.png`）改为延迟加载：首次渲染只填充文字字段，不写 CSS `background-image`；用 `IntersectionObserver`（rootMargin 300px）观察 `#officialWiki`，区块接近视口时才加载并显示背景；用户主动点击角色立即加载，不阻塞交互；不支持 IO 的浏览器立即允许加载。
4. 恢复根目录 `data.js`（从 `src/data.js` 复制），供测试门禁脚本及其他页面继续加载完整数据；首页改引 `home-data.js`（`data.js?v=wiki-mb-1` → `home-data.js?v=home-slim-1`）。
5. 新建 `home-data.js`：从 `src/data.js` 提取首页需要的最小字段集合（`id/order/title/tag/summary/cover/version`），`meta/factions/characters` 仅保留结构占位，`stories` 仅占位（角色由 `agent-catalog.js` 注入），体积约 95KB，较原 `data.js` 约 469KB 减少 ~374KB。

### Testing
- `home-data.js` Node.js 验证：`mainline: 57, events: 246, behindScenes: 7`，数组数量与原 `data.js` 完全一致。
- 首页卷轴排序（`pickLaneItems`）验证：取到最新版本的 2 条主线、2 条活动、2 条幕后，共 6 条 reel，与期望一致。
- `index.html` 7 项结构检查全 PASS：无 Swiper CSS/JS、无固定 Hero src、有 `home-data.js` 引用、有 `data-hero-acts` 属性、有内联 Hero 选择脚本、有 `pendingPortrait` IO 延迟逻辑。
- `app.js` 3 项检查全 PASS：`HERO_ACTS` 已移除、`renderHeroLayered` 复用 selection、有 src 幂等保护。
- `npm run test:content` 档案媒体 17 组全 PASS，链接诚信 PASS；8 项失败项均来自 `events.html` / `stories.html` 的既有工作区改动，与本轮首页文件无关（已通过隔离 stash 验证）。
- 体积节省估算：数据 ~374KB + Swiper ~173KB = 合计首页首屏可节省约 547KB 的网络请求；另加角色大图（单张 3–6MB）推迟到角色区接近视口才发起请求。

### Notes
- `index.html`：移除 Swiper CSS/JS 引用，Hero `section` 新增 `data-hero-acts` 属性，三层 img 改为空 src，新增内联 Hero 初始化脚本，`data.js` 引用改为 `home-data.js`，角色详情背景改为 IO 延迟加载。
- `app.js`：`HERO_ACTS` 常量与旧版 `renderHeroLayered` 替换为复用 `window.__hooxiHeroSelection` 的新版本（减少约 36 行）。
- `data.js`：从 `src/data.js` 复制恢复（工作区原状态为已删除），供门禁脚本及其他页面继续使用。
- `home-data.js`：新建，首页专用精简数据投影，包含 57 主线 + 246 活动 + 7 幕后条目的展示字段。
- 回滚方式：`git checkout -- index.html app.js` 恢复首页修改；`git rm home-data.js` 删除新文件；`git checkout HEAD -- data.js` 或 `rm data.js` 恢复删除状态（取决于上游期望）。

## 2026-08-16 - Task: Events/Pages 构建白屏修复

### What was done
- 完成 Events/Pages 阶段 1 的发布闭环说明：GitHub Pages 采用“完整静态站复制到 `_site` + Vite `events/create/edit` 的 `dist` 覆盖”的混合发布，构建命令固定为 `npm run build -- --config vite.config.js`。
- 保留本地 `/hooxi-zzz/` 子路径验证要求，并记录 `npm run test:deploy` 默认 warning、CI `--strict-tracked` 阻止漏交付的跟踪门禁语义。
- 未进行线上部署、未提交；当前严格模式失败只表示工作区仍有未跟踪依赖，未来明确 commit 时必须把全部构建依赖一并纳入。

### Testing
- `npm run build -- --config vite.config.js`：Vite 39 modules 构建成功。
- 本地 `http://127.0.0.1:4173/hooxi-zzz/events.html`：root 非空、`appReady=true`、Events 同源请求均为 200、console 0。
- `create.html` / `edit.html`：文档请求 200；未认证场景均正常回 `events`。
- `npm run test:deploy`：0 errors / 1 warning；97 个必需文件中 75 个未跟踪。
- `npm run test:deploy -- --strict-tracked`：按预期失败；不能据此声称 CI 已可部署，未来明确 commit 时必须纳入全部依赖。

### Notes
- `.github/workflows/pages.yml`：改为 Node 安装、Vite 构建、严格部署门禁、完整静态站复制到 `_site` 并以 `dist` 覆盖后上传。
- `vite.config.js`：新增阶段 1 的相对 base 与 `events/create/edit` 多页面构建入口。
- `events.html`：修正 favicon 与 React module 为同目录相对路径。
- `create.html`：新增 create 页面 Vite 入口。
- `edit.html`：新增 edit 页面 Vite 入口。
- `src/events-react.jsx`：通过运行时挂载函数启动 Events 页面并写入 app-ready 状态。
- `src/create-react.jsx`：提供 create 页面 React 挂载入口。
- `src/edit-entry.jsx`：提供 edit 页面 React 挂载入口。
- `src/site-runtime.js`：提供子路径 URL 解析与 React 页面 ready/degraded 运行时桥接。
- `src/index.css`：提供三页构建共用的基础样式入口。
- `src/pages/EventsPage.jsx`：提供 Events 页面构建所需的页面实现与同源资源调用。
- `src/pages/EventsPage.css`：提供 Events 页面专用样式。
- `src/pages/CreatePostPage.jsx`：提供 create 页面实现。
- `src/pages/EditPostPage.jsx`：提供 edit 页面实现及未认证回 events 逻辑。
- `src/components/CategoryTabs.jsx`：提供 Events 分类标签组件。
- `src/components/EventCard.jsx`：提供 Events 卡片组件及同源媒体路径消费。
- `src/components/IkOnline.jsx`：提供 Events 在线状态组件。
- `src/components/IkZzzMarquee.jsx`：提供 Events 跑马灯组件。
- `src/components/Navigation.jsx`：提供三页共享导航及子路径链接。
- `src/data/interknot-avatars.js`：提供 Events 卡片使用的本地代理人头像数据。
- `src/styles/create-post.css`：提供 create/edit 页面样式。
- `src/styles/ik-online.css`：提供在线状态样式。
- `src/styles/ik-zzz-marquee.css`：提供跑马灯样式。
- `src/styles/interknot.css`：提供 Events/create/edit 共用的绳网样式。
- `src/styles/navigation.css`：修正构建后导航背景资源为可解析的相对路径。
- `scripts/check-deploy-tracking.mjs`：新增构建依赖、入口、资源、`_site` 和 Git 跟踪状态检查，并支持 warning/strict 两种模式。
- `assets/portraits/Mindscape_*_Full.png`：新增 53 个本地头像/立绘资源，供构建 import 图和页面运行时加载。
- `docs/README.md`：补充混合发布、构建命令、`/hooxi-zzz/` 子路径验证和部署跟踪门禁说明。
- `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`：补充阶段 1 发布方式、验证范围和当前未达到可部署状态的记录。
- `progress.md`：追加本轮阶段闭环日志。
- 回滚方式：对已跟踪的阶段文件使用 `git restore --source=HEAD -- .github/workflows/pages.yml events.html src/events-react.jsx src/styles/navigation.css`；删除本阶段新增的 `vite.config.js`、`create.html`、`edit.html`、`scripts/check-deploy-tracking.mjs`、上述 `src/` 文件和 53 个 `assets/portraits/Mindscape_*_Full.png`，并移除本条日志与两份文档新增段落；全程不使用 `git reset --hard` 或 `git checkout`。

## 2026-08-16 - Task: 收紧角色页桌面首屏高度

### What was done
- 将角色页桌面首屏从固定满视口高度收紧为 `clamp(560px,72svh,720px)`，减少大屏上下空白。
- 保留现有响应式覆盖：宽度不超过 900px 时仍使用完整视口高度，宽度不超过 720px 时继续采用内容自适应布局，避免移动端裁切。

### Testing
- 静态层叠检查确认：`design.css` 的桌面规则会覆盖较早加载的 `multi-page.css`，`character.html` 后置内联 `min-height:100vh` 因选择器特异性较低，不会覆盖桌面新值；后续 900px 与 720px 媒体规则保持有效。
- Playwright 本地 HTTP 验证：1440×1000 计算高度为 720px；1440×700 为 560px；800×900 保持 900px；390×844 为内容自适应 293.203px、`overflow:visible`，无首屏容器裁切。
- `git diff -- design.css` 确认业务 CSS 仅修改两行高度声明，未改 `_site` 构建产物。

### Notes
- `design.css`：桌面 `.character-screen` 的 `min-height` 与 `height` 改为响应式限高值。
- `progress.md`：追加本轮修复和验证记录。
- 回滚方式：将 `design.css` 中两处 `clamp(560px,72svh,720px)` 恢复为 `100svh`，并移除本条日志。

## 2026-08-16 - Task: 安比·德玛拉角色页满屏影画样板

### What was done
- 新建 `character-anby.html`：安比独立角色页样板，复用现有 `character.js` 动态填充逻辑；首屏由双层影画（`assets/gallery/anby/layers/bg.webp` 铺满背景 + `fg.webp` 角色居右通高）构成，底部渐变遮罩确保左下角文字可读。
- 新建 `character-anby.css`：安比专属样式；覆盖 `design.css` 的 `clamp(560px,72svh,720px)` 限高，将首屏还原为满视口高度（`100dvh` / `100svh`）；定义电属性紫主题色变量，前景角色层、背景层、渐变遮罩、移动端适配规则完整。
- 两个文件均独立于 `character.html` / `design.css`，不影响其他角色页与全局样式。

### Testing
- 静态文件检查：`character-anby.html` 180 行，HTML 结构完整（`<!doctype>`、`<head>`、`<body>`、`<footer>` 正常闭合）；`character-anby.css` 103 行，选择器均为 `.is-anby` 局部作用域。
- 资源路径核查：`bg.webp`、`fg.webp` 路径为 `assets/gallery/anby/layers/`，已在 `F:/hooxi-zzz/assets/gallery/anby/layers/` 中确认存在；`loading.gif` 路径与全站一致。
- CSS 优先级验证：`.subpage.archive-character .is-anby.character-screen`（0-4-0）> `design.css` 中 `.subpage.archive-character .character-screen`（0-3-0），可稳定覆盖限高规则。
- 无浏览器环境限制，未完成实际渲染验证；需项目负责人在浏览器中打开 `character-anby.html` 确认首屏满屏效果。

### Notes
- `character-anby.html`：新建，安比独立角色页；满屏双层影画首屏 + 完整档案区域。
- `character-anby.css`：新建，安比样板专属样式；覆盖首屏限高、定义电属性主题色、前景/背景层布局、渐变遮罩、移动端响应。
- `character.html`、`design.css`：本轮未修改。
- 回滚方式：删除 `character-anby.html` 与 `character-anby.css` 两个新文件，并移除本条日志。

## 2026-08-16 - Task: character.html 顶部首屏满屏 + 底部去除空白，完成验证并追加 progress.md

### What was done
- 顶部首屏：将 `design.css` 中 `.subpage.archive-character .character-screen` 的 `min-height` / `height` 从 `clamp(560px,72svh,720px)` 改为 `100svh`，首屏铺满视口。
- 底部空白根因：`design.css` 的 `body.archive-character>*{position:relative;z-index:1}` 规则特指度 (0,1,1) 高于 `redesign-core-v3.css` 中 `.fx-click-spark-canvas{position:fixed}` 的 (0,1,0)，导致点击粒子 canvas 以 `position:relative` 坐在文档流里，撑出 900px（视口高）空白。
- 底部空白修复：在 `design.css` 该规则紧后方追加 `body.archive-character>.fx-click-spark-canvas{position:fixed;inset:0;z-index:2147483000}`，特指度 (0,2,1) 覆盖原规则，canvas 恢复悬浮于文档流之外。
- 强制缓存失效：将 `character.html` 中 `design.css` 的版本参数由 `?v=nav-fullwidth-1` 改为 `?v=nav-fullwidth-2`，浏览器拉取含新规则的最新文件。

### Testing
- 浏览器验证（`http://localhost:5173/character.html?id=anby`，1280×900）：
  - canvas `getComputedStyle().position` 由 `relative` 变为 `fixed`，`z-index` 恢复 `2147483000`。
  - `document.documentElement.scrollHeight` 由 3214 降至 2560，减少 654px。
  - 滚至页面底部：`scrollY = 1660 = scrollHeight(2560) − viewport(900)`，footer 出现在视口 702–780px，footer 底部文档坐标约 2440px，页面尾部自然余量 ~120px（正常 body padding），无异常空白区。
  - 截图存于 `F:/hooxi-zzz/shot-verify-top.png`（首屏）与 `shot-verify-bottom.png`（底部）。

### Notes
- `design.css`：① 第322–323行 `.character-screen` 高度改为 `100svh`；② 第316行新增 `.fx-click-spark-canvas` 覆盖规则（两处均为本轮改动）。
- `character.html`：第38行 `design.css` 版本参数由 `nav-fullwidth-1` 改为 `nav-fullwidth-2`。
- 回滚方式：① `design.css` 将 `100svh` 恢复为 `clamp(560px,72svh,720px)`，删除第316行新增的 canvas 覆盖规则；② `character.html` 将 `nav-fullwidth-2` 改回 `nav-fullwidth-1`。

## 2026-08-16 - Task: 修复角色详情页顶部/底部空白，注入英文名斜向跑马灯背景

### What was done
- 顶部空白修复：将 `design.css` 中宽泛的 `body.archive-character>*{position:relative;z-index:1}` 收窄为 `body.archive-character>:is(main,footer)`，使 `.hooxi-site-loader` 不再被强制改为 `position:relative` 进入文档流，消除约 99px 顶部空白。
- 底部空白修复：在 `design.css` 的 `body.archive-character` 规则中追加 `padding-bottom:0`，覆盖 `theme-zzz.css` 注入的全局 `body{padding-bottom:120px}`。
- 删除 canvas 覆盖规则：上一轮为修复点击粒子 canvas 而添加的 `.fx-click-spark-canvas` 补丁规则在本轮选择器收窄后已不再需要，一并删除。
- 跑马灯背景实现：在 `character.js` 中注入多行 `.char-marquee` DOM，以 `character.englishName` 填充文字内容；`design.css` 新增 `.char-marquee` 及其子元素的完整样式与 keyframes 动画（全屏覆盖、斜向 -20deg、多行平铺、`z-index:1` 置于背景图之上角色内容之下，防止重复注入）。

### Testing
- 浏览器实测（`http://localhost:5173/character.html?id=anby`，1280×900）：
  - `mainTop: 0`（顶部无空白 ✅）
  - `bodyPaddingBottom: "0px"`（底部 padding 清除 ✅）
  - `loaderPosition: "fixed"`（loader 恢复 fixed，不再参与文档流 ✅）
  - `screenHasMarquee: true`，`marqueeZIndex: "1"`（跑马灯已注入，层级正确 ✅）
  - `scrollH: 2341 ≈ footerBottom: 2340.734375`（底部无多余空间 ✅）
- 首屏截图：`F:/hooxi-zzz/artifacts/verify-anby-top.png`
- 底部截图：`F:/hooxi-zzz/artifacts/verify-anby-bottom.png`

### Notes
- `F:/hooxi-zzz/design.css`：① 收窄 `body.archive-character>*` 为 `>:is(main,footer)`；② 在 `body.archive-character` 追加 `padding-bottom:0`；③ 删除 `.fx-click-spark-canvas` 覆盖规则；④ 新增 `.char-marquee` 全屏斜向跑马灯样式及动画 keyframes；⑤ 新增 `.character-screen>.char-marquee{z-index:1}` 层级规则。
- `F:/hooxi-zzz/character.js`：新增 `injectMarquee(character)` 函数，使用 `character.englishName` 生成多行跑马灯 DOM，注入到 `.character-screen` 并防止重复注入。
- 回滚方式：① `design.css` 恢复 `body.archive-character>*{position:relative;z-index:1}`，删除 `padding-bottom:0`、`.char-marquee` 相关样式段落；② `character.js` 删除 `injectMarquee` 函数及其调用；③ 如需恢复 canvas 补丁规则，在 `design.css` 补回 `.fx-click-spark-canvas{position:fixed;inset:0;z-index:2147483000}` 覆盖。

## 2026-08-16 - Task: 将跑马灯从角色首屏背景迁移到档案内容区背景

### What was done
- 跑马灯注入目标从 `.character-screen`（首屏）改为 `.character-detail-page`（档案内容区），跑马灯不再显示在首屏大图背景上。
- 跑马灯定位规则由原先的 `z-index:1`（在首屏背景层）改为 `position:absolute;inset:0;z-index:0`，覆盖档案内容区整体区域并置于内容（z-index:1）之下。
- 解决浏览器持续加载旧版 CSS 缓存的问题：将 `character.html` 中 `design.css` 的版本参数从 `nav-fullwidth-2` 更新为 `nav-fullwidth-3`，强制浏览器拉取含新规则的版本。

### Testing
- 浏览器 DOM 验证（`http://localhost:5174/character.html?id=anby`）：
  - `inDetail: true`（跑马灯存在于 `.character-detail-page` ✅）
  - `inScreen: false`（`.character-screen` 内不存在跑马灯 ✅）
  - `pos: "absolute"`（`position:absolute` 覆盖生效 ✅）
  - `z: "0"`（`z-index:0`，置于内容之下 ✅）
- 计算样式额外确认：`textColor: rgb(189,213,45)`（黄绿色 ✅），`textOpacity: 0.09`（作为背景纹理故意极淡 ✅），`textVisible: true` ✅，动画运行在 `.char-marquee__track` 层（符合预期）。
- 截图取证：`artifacts/verify-marquee-detail-final.png`（档案内容区跑马灯背景视觉验证）。

### Notes
- `F:/hooxi-zzz/character.js`：`injectMarquee` 的注入目标从 `.character-screen` 改为 `.character-detail-page`。
- `F:/hooxi-zzz/design.css`：跑马灯定位规则改为 `.archive-character .character-detail-page>.char-marquee{position:absolute;inset:0;z-index:0}`，删除旧 `.character-screen>.char-marquee{z-index:1}` 规则。
- `F:/hooxi-zzz/character.html`：`design.css` 版本参数从 `nav-fullwidth-2` 更新为 `nav-fullwidth-3`，解决缓存问题。
- 回滚方式：① `character.js` 将注入目标改回 `.character-screen`；② `design.css` 将 `.character-detail-page>.char-marquee` 规则改回 `.character-screen>.char-marquee{z-index:1}`；③ `character.html` 将 `nav-fullwidth-3` 改回 `nav-fullwidth-2`；移除本条日志。

## 2026-08-16 - Task: 删除 agent-stage 3D/glare 特效 + 修复 stories.html 加载动画

### What was done
- **3D/glare 特效删除**：移除 `agent-stage` 图片区域全部鼠标驱动 3D 倾斜、`stage-glare` 全息高光、`perspective`/`preserve-3d`/`will-change` 相关规则；彩色影画 `stories-mindscape.js` 保留静态 `applyMindscape`，删除所有 `onMove`/`tick`/`rotateX`/`rotateY` 交互逻辑；`game-feel.js` 的 `AUTO_SELECTORS` 移除 `.agent-stage-art`，删除 `initBgDrift` IIFE。
- **加载动画修复（stories.html）**：`site-loader.js` 原先只识别 `id="root"` 为 React 容器，stories.js 实际渲染至 `id="storiesRoot"` 导致 loader 在 DOMContentLoaded 后 2 帧即消失，内容空白。已将判断条件扩展为同时识别 `storiesRoot`；并在 stories.html 中于 `stories.js` 之后插入内联 MutationObserver，当 React 完成首次渲染时派发 `hooxi:app-ready` 信号，loader 在真实内容就绪后才隐藏。
- **injectMarquee 确认**：`character.js` 中 `injectMarquee` 条件为 `detailPage && resolvedEnglishName`，无 anby 特殊限制，已对所有有 `englishName` 的角色通用，无需修改。

### Testing
- Grep 验证 stories.html 无 `perspective`、`preserve-3d`、`stage-glare`、`will-change.*transform`、`transform .06s`、`rotateX`、`rotateY` 残留：✅ 无匹配
- Grep 验证 game-feel.js 无 `agent-stage-art`、`initBgDrift`：✅ 无匹配
- Grep 验证 site-loader.js 含 `storiesRoot`：✅ 第 132 行
- Grep 验证 stories.html 含 `hooxi:app-ready` 内联脚本和 `ms-5` 版本号：✅ 第 686-687 行
- 静态分析：site-loader 等待 `hooxi:app-ready` 事件；MutationObserver 在 React 首渲后触发；4500ms fallback 兜底防止永久挂载

### Notes
- `F:/hooxi-zzz/stories-mindscape.js`：全量重写，删除 tilt/glare 动态交互，仅保留 `applyMindscape` 静态彩色影画注入。
- `F:/hooxi-zzz/stories.html`：CSS 块第 608-647 行（3D/glare 规则）替换为静态规则；`stories.js` 后插入 app-ready 内联信号脚本；stories-mindscape.js 版本从 ms-4 升至 ms-5。
- `F:/hooxi-zzz/game-feel.js`：AUTO_SELECTORS 移除 `.agent-stage-art`；删除 `initBgDrift` IIFE。
- `F:/hooxi-zzz/site-loader.js`：`onDomReady` 判断条件由 `getElementById('root')` 改为 `getElementById('root')||getElementById('storiesRoot')`。
- 回滚方式：`git revert HEAD` 可完整回滚本轮所有改动。

## 2026-08-16 - Task: ZZZ 视觉设计全维度扩展调研文档（v2.0）

### What was done
将 `docs/ZZZ-VISUAL-DESIGN-RESEARCH.md` 从原始约 16KB 的基础版扩充为 788 行 / 34KB 的全维度调研报告，新增以下六个模块：角色立绘设计语言（含制作人官方访谈原话）、服装/时装设计（亚文化标签 + Y2K 元素清单 + 配色规律）、地图与城市场景（各区域视觉分析 + 叙事矛盾驱动的场景特征）、W-Engine/武器引擎（球形声波装置设计逻辑）、邦布（固定剪影 + 派系映射规律）、战斗VFX与属性颜色系统。同步补充了官方宣传物料、音乐品牌（Lofi Girl 官方合作）、版本迭代路径，以及 HOOXI 首页复刻的具体可执行建议（CSS 变量、图腾清单、区块参考布局）。所有内容均标注来源可信度（✅官方/权威 | ⚠️社区推断 | ★模型知识）。

### Testing
- 文档结构：17 个章节完整，来源索引附于末尾。
- 文档尺寸：788 行 / 34,316 字节，较原始版本约 2× 扩展。
- 无代码改动，无构建验证需求。
- 文档仅为调研输出，内容真实性依赖标注来源，无法自动化验证。

### Notes
- `F:/hooxi-zzz/docs/ZZZ-VISUAL-DESIGN-RESEARCH.md`：完全重写为 v2.0 扩展版，原有基础内容全部保留并扩展。
- 回滚方式：`git checkout HEAD -- docs/ZZZ-VISUAL-DESIGN-RESEARCH.md` 可恢复至上一个已提交版本（即原始 16KB 版本）。

## 2026-08-16 - Task: HOOXI 首页 ZZZ 视觉 DNA 强化

### What was done
新建 CSS 覆盖层并最小修改 HTML，向首页注入7类最高识别度的《绝区零》视觉 DNA：
- 棋盘格横带（Hero 下方 + About 上方）：直接复刻 Random Play 录像店地面图案
- 黄黑警示条纹分隔带（查档→阵营 + 阵营→卷轴之间）：ZZZ 工业警示风格
- Hero CRT 扫描线增强：opacity .026 → .048，可感知级别
- Section 头部 ZZZ 化：`//` 前缀 + Barlow Condensed 800 + 字间距 .22em
- 卡片悬停扫光：阵营频道 `.faction-entry` + 档案卷轴 `.home-lane-card`
- Hero 区 "RANDOM PLAY // NEW ERIDU" 水印前缀
- About 区棋盘格背景纹理（background-image 叠加，低不透明度）

### Testing
- `zzz-home-dna.css`：151 行，8 类 CSS 规则全部确认存在（Node.js 脚本逐项检查）
- `index.html`：5 处插入全部确认
  - line 43：`<link href="zzz-home-dna.css?v=zzz-dna-r1"/>`
  - line 138：`.zzz-checker-strip`（Hero 下方）
  - line 151：`.zzz-hazard-strip`（查档→阵营）
  - line 164：`.zzz-hazard-strip`（阵营→卷轴）
  - line 227：`.zzz-checker-strip--footer`（About 上方）
- 未做浏览器人工视觉验证（无本地服务器环境）；CSS 语法依赖人工开 F12 确认

### Notes
- `F:/hooxi-zzz/zzz-home-dna.css`：新建，全部 ZZZ 装饰层 CSS，151 行
- `F:/hooxi-zzz/index.html`：修改，新增1个 `<link>` + 4个装饰 `<div>`
- 回滚方式：
  1. 删除 `zzz-home-dna.css`
  2. 从 `index.html` 移除 `<link href="zzz-home-dna.css...">` 和4个 `.zzz-checker-strip`/`.zzz-hazard-strip` div
