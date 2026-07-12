
## 2026-07-12 - Task: 修复媒体播放并调整档案栏目

### What was done
修复播放器自动启动和非播放器切歌自动播放问题，默认音量调整为 25% 并保存用户音量。移除 EP/PV 独立栏目，新增“系列·幕后 / 对谈”页面和默认资料，更新全站导航、导入导出数据键及旧词条的阵营分支兼容字段。封面保存仍使用已有“保存后立即重新渲染”流程，本地文件明确只作预览，公开页面使用资源路径。

### Testing
- `node --check app.js`：通过。
- `node --check page.js`：通过。
- `node --check data.js`：通过。
- `git diff --check`：通过。
- 静态搜索确认 HTML 中不再引用 `ep-pv.html`，音量控件不再使用 `.55`。
- 未完成：真实浏览器中的封面上传、B 站封面接口和播放器点击回归验证。

### Notes
- `app.js`：取消加载自动播放和切歌自动播放，增加默认音量与本地记忆。
- `page.js`：切换幕后栏目数据键，更新导入导出，并增加阵营 ID、父词条、分支和布局兼容字段。
- `data.js`：新增幕后/对谈默认数据。
- `behind-scenes.html`：新增制作组花絮与访谈档案页。
- `ep-pv.html`：移除重复的 EP/PV 独立页面。
- `index.html`、`mainline.html`、`stories.html`、`events.html`：更新栏目导航与默认音量。
- `docs/README.md`：同步栏目和播放器使用说明。
- 回滚方式：恢复上述文件并恢复 `ep-pv.html`；或回退本轮未提交工作区改动。

## 2026-07-12 - Task: 完善 Wiki 风格词条媒体编辑

### What was done
根据用户提供的两个 Wiki 参考，扩展四个档案页词条字段，支持版本、日期、阵营、角色、地点、类型、来源、封面、角色立绘和附加图片路径。封面有视频链接时可直接点击跳转视频；图片使用完整展示、懒加载和失败占位。编辑器改为基本信息、角色与世界观、媒体与来源三个可折叠分组，并增加本地图片即时预览和封面/立绘资源目录。

### Testing
- `node --check page.js`：通过。
- `node --check app.js`：通过。
- `git diff --check`：通过。
- 未完成：真实浏览器点击封面、选择图片和大规模图片加载验证。

### Notes
- `F:/hooxi-zzz/page.js`：新增词条字段、封面点击跳转、立绘显示、分组编辑器、本地预览和旧数据兼容。
- `F:/hooxi-zzz/multi-page.css`：完整展示图片、元信息标签和编辑器分组样式。
- `F:/hooxi-zzz/assets/covers/README.txt`：视频封面资源说明。
- `F:/hooxi-zzz/assets/portraits/README.txt`：角色立绘资源说明。
- `F:/hooxi-zzz/docs/README.md`：补充 Wiki 字段、封面和立绘发布流程。
- 回滚方式：恢复以上代码、文档和资源说明文件即可撤销本轮改动；用户已放入的图片资源不必删除。

### What was done
区分页面加载时的自动播放失败和用户点击播放失败：页面自动尝试播放时不再弹出“浏览器阻止自动播放”提示；用户明确点击播放器时，只有确实仍被 Edge 拒绝才提示检查网站声音权限或再次点击，避免把正常的自动播放拦截误报成用户操作失败。

### Testing
- `node --check app.js`：待执行。
- 需要在 Edge 中用线上地址点击底部播放按钮验证；浏览器是否允许播放仍由 Edge 的网站声音和媒体自动播放策略决定。

### Notes
- `F:/hooxi-zzz/app.js`：播放函数增加用户操作标记并调整错误提示。
- 回滚方式：恢复 `app.js` 和本段进度记录即可。

### What was done
确认 `assets/audio/` 中已放入 40 个 OGG 音频文件（包含原 32 首以及新增文件），将默认播放器歌单改为读取这些仓库内音频，并保留中文歌名。针对浏览器曾保存的临时 `blob:` 歌单，加入自动恢复公开文件歌单逻辑，避免旧缓存导致线上无法播放。

### Testing
- 已核对音频目录文件清单和文件存在情况。
- `node --check app.js`：待执行。
- `git diff --check`：待执行。

### Notes
- `F:/hooxi-zzz/assets/audio/`：用户提供的 OGG 音频文件。
- `F:/hooxi-zzz/app.js`：默认歌单改为 40 个仓库音频路径，并清理旧 `blob:` 配置。
- 五个 HTML 页面：播放器脚本版本更新为 `player-2`，用于刷新浏览器缓存。
- 回滚方式：恢复 `app.js`、五个 HTML 页面及 `progress.md`，并保留或移除 `assets/audio/` 音频文件均可。

### What was done
创建 `assets/audio/` 音频文件目录并放入使用说明，用户后续可将 32 首音频文件复制到该目录。补充阿里云多人编辑方案：对象存储保存音频，数据库保存内容，受保护 API 负责登录、权限、上传和发布，并保留操作日志与备份。

### Testing
- 确认 `assets/audio/README.txt` 已创建。
- 已检查现有本地配置文件中的 32 首歌曲地址为浏览器临时 `blob:` 地址，不能作为线上永久音频地址。
- 未执行阿里云部署验证；当前仅完成目录和方案记录。

### Notes
- `F:/hooxi-zzz/assets/audio/README.txt`：说明音频文件放置位置和文件名建议。
- `F:/hooxi-zzz/docs/README.md`：补充阿里云多人协作的推荐架构。
- 回滚方式：删除 `assets/audio/README.txt`，并移除文档中“阿里云多人协作方向”章节。

### What was done
完成一个独立的绝区零主题静态网站首版：包含 Hooxi 品牌头部、剧情路线图、章节卡片、展开/折叠控制、视频待接入状态、响应式布局与关于本站说明。首版节点明确使用示例数据，并提供真实视频替换说明。

### Testing
- `node --check app.js`：通过，前端脚本无语法错误。
- `python -m http.server 8765` + `curl -I http://127.0.0.1:8765/`：通过，首页返回 HTTP 200。
- `curl` 页面标题检查：通过，返回 `Hooxi // 绝区零剧情档案`。
- 浏览器图形化检查未执行：当前环境未安装 Chrome/Chromium。

### Notes
- `F:/hooxi-zzz/index.html`：网站页面结构与示例内容容器。
- `F:/hooxi-zzz/styles.css`：绝区零风格视觉、路线图样式与响应式规则。
- `F:/hooxi-zzz/app.js`：章节示例数据及展开/折叠交互。
- `F:/hooxi-zzz/docs/README.md`：真实内容替换与本地预览说明。

## 2026-07-11 - Task: 增加小白可视化编辑器、动态背景与音乐播放器

### What was done
将站点升级为站内可视化编辑模式：可编辑首页文字、背景图片与透明度、动态粒子/网点效果；可直接新增、修改、删除主线剧情、角色剧情分支、角色专属 EP/PV、主题活动卡片；增加 JSON 配置导入导出和浏览器本地保存。新增底部歌单播放器，支持播放、暂停、切歌、音量调节和歌单选择，并处理浏览器自动播放限制。根据绝区零官方 Wiki 首页整理了首版内容分类与官方参考入口。

### Testing
- `node --check app.js`：通过。
- `python -m http.server 8766` + `curl -I http://127.0.0.1:8766/`：通过，首页返回 HTTP 200。
- 静态资源检查：`app.js` 可通过 HTTP 读取，编辑器、localStorage、自动播放提示和官方 Wiki 入口代码均已存在。
- 浏览器实际点击与视觉检查未执行：当前环境没有 Chrome/Chromium；动态编辑、播放器和窄屏视觉验证仍需在有浏览器的环境完成。

### Notes
- `F:/hooxi-zzz/index.html`：新增可视化编辑器、歌单播放器、背景/动效控制入口。
- `F:/hooxi-zzz/styles.css`：新增编辑器、动态粒子背景、播放器、弹窗提示及移动端样式。
- `F:/hooxi-zzz/app.js`：新增本地配置模型、内容/歌单编辑、导入导出、播放控制和实时渲染。
- `F:/hooxi-zzz/docs/README.md`：补充小白操作、官方 Wiki 来源、音乐授权与自动播放说明。

## 2026-07-11 - Task: 发布到 GitHub 并补充项目 README

### What was done
已初始化 Git 仓库，新增面向 GitHub 仓库首页的项目说明，并将网站代码提交到 `Pokkan39/hooxi-zzz` 的 `main` 分支。README 包含在线地址预期、本地运行方式、小白编辑流程、官方 Wiki 来源和版权提示。

### Testing
- Git 提交成功：`748521f Add editable Zenless Zone Zero archive site`。
- 推送成功：`main` 已关联 `origin/main`。
- 当前仍未完成真实浏览器交互和响应式视觉验证，原因是本环境无法启动 Chrome/Chromium。

### Notes
- `F:/hooxi-zzz/README.md`：新增 GitHub 项目说明和 Pages 访问提示。
- `.git/`：初始化本地 Git 仓库并配置 `https://github.com/Pokkan39/hooxi-zzz.git`。

## 2026-07-11 - Task: 增加多页面时间轴与音频发布包

### What was done
新增主线、支线/角色故事、代理人 EP/PV、主题活动四个独立页面；使用统一的数据文件提供按顺序排列的时间轴，支持在页面上拖动卡片调整顺序并保存到浏览器。编辑器新增本地音频文件选择与试听入口，并提供生成 `playlist.json` 发布清单的流程，避免在公开 GitHub Pages 中暴露高权限 Token。README 与维护文档已补充多页面使用、排序和音频发布说明。

### Testing
- `node --check app.js`、`node --check page.js`、`node --check data.js`：通过。
- 本地静态服务器检查 `index.html`、`mainline.html`、`stories.html`、`ep-pv.html`、`events.html`、`data.js`、`page.js`、`multi-page.css`：全部 HTTP 200。
- 真实浏览器拖动排序、本地音频播放和移动端视觉检查：依赖用户浏览器，当前执行环境未自动执行。

### Notes
- `F:/hooxi-zzz/data.js`：四类时间轴默认数据。
- `F:/hooxi-zzz/page.js`：多页面渲染与拖动排序逻辑。
- `F:/hooxi-zzz/mainline.html`、`stories.html`、`ep-pv.html`、`events.html`：新增档案页面。
- `F:/hooxi-zzz/multi-page.css`：时间轴页面和发布包控件样式。
- `F:/hooxi-zzz/app.js`、`index.html`：兼容子页面并新增音频选择/发布清单入口。







## 2026-07-11 - Task: 修复线上歌单滚动资源

### What was done
确认用户截图使用的是播放器升级前的线上资源；本地已加入歌单最大高度、鼠标滚轮滚动、触摸滑动和移动端适配，并刷新首页及四个子页面播放器脚本版本参数，准备重新发布以绕过 CDN 旧缓存。

### Testing
- `node --check app.js`、`node --check page.js`：通过。
- `git diff --check`：通过。
- 待完成：推送后用带新版本参数的线上首页验证歌单弹层高度和滚动。

### Notes
- `F:/hooxi-zzz/styles.css`：歌单弹层加入 `max-height`、`overflow-y:auto` 和触摸滚动。
- `F:/hooxi-zzz/index.html`、四个子页面：播放器按钮和脚本版本参数更新。
- 回滚点：恢复本轮播放器相关文件即可撤销。

### What was done
升级首页和四个子页面共用播放器：增加上一首、下一首、顺序播放/随机播放/单曲循环模式切换，模式会保存在当前浏览器并在按钮上显示；歌单弹层增加最大高度、垂直滚动和触摸滚动，移动端同步缩小控制间距以适配屏幕。

### Testing
- `node --check app.js`、`node --check page.js`：通过。
- `git diff --check`：通过。
- 待完成：浏览器验证模式切换和歌单滚动，推送后验证线上资源缓存更新。

### Notes
- `F:/hooxi-zzz/app.js`：增加播放模式状态、随机/单曲逻辑和模式按钮绑定。
- `F:/hooxi-zzz/index.html`、四个子页面：增加播放模式按钮并刷新脚本版本参数。
- `F:/hooxi-zzz/styles.css`：增加歌单滚动和播放器移动端样式。
- 回滚点：恢复本轮修改的上述文件即可撤销播放器升级。

### What was done
为四个子页面的 `data.js`、`app.js`、`page.js` 引用增加版本查询参数，避免 GitHub Pages/CDN 继续返回旧版脚本，确保编辑器修复能被访客加载。

### Testing
- `node --check app.js`、`node --check page.js`：通过。
- `git diff --check`：通过。
- 待完成：推送后验证线上四个页面脚本请求和编辑按钮。

### Notes
- `F:/hooxi-zzz/mainline.html`、`stories.html`、`ep-pv.html`、`events.html`：脚本引用增加版本参数。
- 回滚点：移除四个页面脚本 URL 的 `?v=17861aa` 即可恢复。

### What was done
修复子页面脚本与首页脚本同时加载时的两个问题：补回首页配置读取函数，并避免页面脚本重复声明 `toast` 导致 JavaScript 语法错误。四个子页面的编辑按钮现可正常打开编辑侧栏。

### Testing
- `node --check app.js`、`node --check page.js`：通过。
- 本地无控制台错误加载 `mainline.html`：通过。
- 浏览器点击 `#editorOpen` 后确认编辑器变为 `page-editor open`：通过。
- `git diff --check`：通过。

### Notes
- `F:/hooxi-zzz/app.js`：补充缺失的 `loadConfig` 函数。
- `F:/hooxi-zzz/page.js`：避免 `toast` 重复声明并使用页面级提示函数。
- 回滚点：恢复本轮修改的 `app.js`、`page.js`、`progress.md`。

### What was done
为四个时间轴页面编辑器增加统一的数据导入与导出。编辑者可以导出包含主线、支线/角色、EP/PV、活动全部内容的 `data.js`，覆盖仓库根目录同名文件并发布后，所有访客即可看到相同数据；也可以导入此前导出的 `data.js` 或 JSON 在当前浏览器恢复编辑内容。

### Testing
- `node --check page.js`：通过。
- 待完成：本地页面 HTTP 200 和导出格式验证。
- 未执行：真实浏览器下载、文件选择和 GitHub Pages 部署验证。

### Notes
- `F:/hooxi-zzz/page.js`：增加发布数据导出、数据导入、格式校验和编辑器控件。
- `F:/hooxi-zzz/docs/README.md`：补充导出、覆盖 `data.js`、提交发布流程。
- 回滚点：恢复本轮修改的 `page.js`、`docs/README.md`、`progress.md`。

### What was done
修复主线、支线/角色、EP/PV、活动四个时间轴页面的右上角编辑入口：现在各页面都能打开独立编辑器，可修改、增加、删除条目并保存到当前浏览器。视频字段支持粘贴 B 站完整链接或 BV 号；页面会尝试读取公开视频封面，读取失败时保留降级占位和 B 站跳转链接。

### Testing
- `node --check page.js`、`node --check app.js`、`node --check data.js`：通过。
- 本地静态服务器检查 `index.html`、`mainline.html`、`stories.html`、`ep-pv.html`、`events.html`、`page.js`、`data.js`、`multi-page.css`：全部 HTTP 200。
- `git diff --check`：通过。
- 未执行：真实浏览器点击、B 站接口跨域和封面加载验证，需在可联网浏览器环境确认。

### Notes
- `F:/hooxi-zzz/page.js`：新增子页面编辑器、B 站 BV 号识别、封面读取与缓存。
- `F:/hooxi-zzz/multi-page.css`：新增封面区域、编辑侧栏、编辑字段和移动端样式。
- `F:/hooxi-zzz/docs/README.md`：补充子页面编辑与 B 站封面使用说明。
- 回滚点：恢复以上三个文件即可撤销本轮功能。

## 2026-07-11 - Task: 增加高级动态 UI 交互
- `F:/hooxi-zzz/motion.css`：统一动效系统和响应式降级。
- `F:/hooxi-zzz/app.js`：首页卡片/控件指针跟随动效绑定。
- `F:/hooxi-zzz/page.js`：时间轴卡片和拖拽状态动效绑定。
- 五个 HTML 页面：加载统一 `motion.css`。
- `F:/hooxi-zzz/README.md`：补充动效说明。
- 回滚方式：移除各页面的 `motion.css` 引用并删除 `motion.css`，即可恢复上一版静态交互。

## 2026-07-12 - Task: 接入独立阿里云多人在线协作编辑

### What was done
为绝区零档案站接入独立云端多人协作能力，与菜谱网站完全隔离。编辑者输入共享密码后即可在线编辑首页外观、剧情卡片、歌单元数据及主线/支线/幕后/活动四类档案；输入过程当前页面即时预览，点击保存后写入共享云端，其他在线访客通过秒级轮询自动看到更新。并发保存基于版本号，后保存者会被冲突拦截，云端内容不会被静默覆盖。图片和视频仅同步公开链接或仓库相对路径。新增独立阿里云函数提供 `/site-data` 接口，共享密码只存于函数环境变量并用恒定时间比较，默认对象键为 `hooxi-zzz/site-data.json`，不触碰菜谱 `/recipes` 或 `recipe-site/recipes.json`。播放器 41 首默认歌曲、播放模式和音量偏好保持不变。

### Testing
- `node --check sync.js`、`app.js`、`page.js`、`data.js`、`aliyun/site-data-api/index.js`、`aliyun/site-data-api/index.test.js`：通过。
- `git diff --check`：通过。
- 独立函数 `node --test`：7/7 通过，覆盖首次 GET、错误密码 401、有效保存与版本递增、非法结构 400、OPTIONS/CORS，以及双客户端读取同版后 A 保存成功、B 旧版保存被 409 拦截、重新 GET 读到 A 内容的冲突场景。
- 本地静态服务器 + 无头浏览器实测：首页同步模块加载、41 首默认歌单与完整 archive 键正常；mainline/stories/behind-scenes/events 分别渲染 3/3/2/2 条记录、编辑器挂载且无控制台错误。
- 即时预览实测：首页改标题后 `#heroTitle` 立即更新、状态转为“有未保存修改”；主线改条目标题后卡片立即更新、状态转为 dirty。
- 静态搜索确认游戏站代码未引用 `/recipes`、`recipes.json` 或 `recipe-site`。
- 未完成：真实阿里云函数与 OSS 的线上部署验证（需配置独立函数公网地址、`EDIT_PASSWORD` 和执行角色后按 `docs/aliyun-collaboration.md` 执行）；真实跨浏览器 5 秒轮询的端到端同步需在部署后确认。

### Notes
- `sync.js`：新增统一共享数据同步模块（home/archive 模型、5 秒轮询、会话级共享密码、离线缓存、未保存保护、`expectedVersion` 保存与 409 冲突提示、`hooxi:data` 广播）。
- `aliyun/site-data-api/index.js`：新增独立函数，`/site-data` 的 GET/PUT/OPTIONS、`EDIT_PASSWORD` 恒定时间校验、默认对象键 `hooxi-zzz/site-data.json`、结构与体积校验、版本冲突保护、CORS 含 `X-Edit-Password`。
- `aliyun/site-data-api/package.json`、`index.test.js`、`node_modules/`：函数依赖 `ali-oss` 与可无 OSS 运行的注入式测试。
- `app.js`：接入共享保存、`hooxi:data` 应用、`hooxiCollectData` 汇总，内容/歌单/外观编辑改为即时预览并标记未保存，内容编辑保持输入焦点。
- `page.js`：档案编辑改为即时预览并接入共享保存、远端数据应用与 `hooxiArchiveState` 维护。
- `data.js`：`archiveData` 挂到 `window`，供同步模块读取。
- `index.html`、`mainline.html`、`stories.html`、`behind-scenes.html`、`events.html`：引入 `sync.js`、更新脚本版本参数为 `collab-1`、顶栏加入同步状态位。
- `styles.css`：新增同步状态颜色样式。
- `README.md`、`docs/README.md`、`docs/aliyun-collaboration.md`：更新协作说明并新增独立阿里云部署文档。
- 回滚方式：恢复 `app.js`、`page.js`、`data.js`、`styles.css` 和五个 HTML 页面，删除 `sync.js`、`aliyun/` 目录与 `docs/aliyun-collaboration.md`，还原 `README.md`/`docs/README.md` 协作段落即可撤销本轮改动；线上回退只需将 `sync.js` 的 `HOOXI_API_BASE_URL` 置空，不改动菜谱函数或菜谱 OSS 对象。

## 2026-07-12 - Task: 上传最新导出的档案数据并检查历史功能差异

### What was done
同步远程最新阿里云共享协作版本后，将用户提供的导出数据上传为站点根目录 `data.js`，保留当前前端要求的 `window.archiveData` 全局挂载形式，避免同步模块无法读取默认档案数据。同时检查了远程历史变更：阿里云共享密码方案已新增 `sync.js`、`aliyun/site-data-api/` 和独立协作文档；相比上一版协作基础设施，GitHub OAuth 后端被替换，阵营专属页和全站位置编辑器曾在用户上传提交中被删除，随后合并提交又恢复了 `faction.html`、`faction.js`、`layout-editor.js` 及相关样式。

### Testing
- `git pull --ff-only origin main`：通过，本地快进到远程最新提交 `a6c8838`。
- `node --check data.js`：通过。
- `node --check sync.js`、`app.js`、`page.js`、`aliyun/site-data-api/index.js`、`aliyun/site-data-api/index.test.js`：通过。
- `npm test`（`aliyun/site-data-api/`）：受阻，当前本地未安装 `ali-oss` 依赖，Node 报错 `Cannot find module 'ali-oss'`；未按工具安全提示继续安装外部依赖。
- `git diff --check`：通过。
- 历史差异检查：`6c7fbfc` 删除了 OAuth 后端、阵营专属页、全站位置编辑器等文件；`a6c8838` 合并提交恢复了 OAuth 后端、阵营页、布局编辑器与相关样式，同时保留阿里云同步入口。

### Notes
- `data.js`：替换为用户提供的最新导出档案数据，新增两条主线 PV 数据，保留支线和活动数据，幕后记录为空；将导出文件的 `const archiveData` 调整为当前站点需要的 `window.archiveData`。
- `progress.md`：记录本轮上传、验证结果和历史功能差异检查结论。
- 回滚方式：使用 `git restore data.js progress.md` 可撤销本轮未提交改动；提交后可使用 `git revert <本轮提交>` 回退本次数据上传。

## 2026-07-12 - Task: 恢复全站布局编辑入口和阵营基础能力

### What was done
恢复首页、主线、支线、幕后和活动页对 `layout-editor.js` 的加载，让左下角“调整位置”工具重新出现在主站页面，并保留桌面、平板、手机独立布局、拖动、宽度、层级、当前设备恢复和 `window.hooxiLayout` 接口。检查本地备份分支 `backup/aliyun-collab-6c7fbfc` 后确认该分支本身不包含 `layout-editor.js`、`faction.html`、`faction.js`，因此布局编辑器与阵营页恢复以当前主线和已验收历史提交为准。恢复 `data.js` 中的基础阵营定义，并给“安比的午后”补回狡兔屋关联，让阵营页有可验证入口；同时让 `faction.js` 显式读取 `window.archiveData`。

### Testing
- `node --check data.js`、`faction.js`、`layout-editor.js`、`app.js`、`page.js`：通过。
- `git diff --check`：通过。
- 浏览器验证：首页、主线、支线、幕后、活动页均出现“调整位置”；点击后均进入 `layout-editing`，且 `window.hooxiLayout.getData()` 可用。
- 浏览器验证：主线、支线、活动页动态卡片区域重新获得布局目标；幕后页当前数据为空，因此卡片目标数量为 0，但页面级目标和布局工具正常。
- 浏览器验证：`faction.html?id=cunning-hares` 正确识别“狡兔屋”，显示 1 条关联记录“安比的午后”，布局工具可用。
- 控制台仅有缺失 `favicon.ico` 的 404，不属于本轮功能错误。

### Notes
- `index.html`、`mainline.html`、`stories.html`、`behind-scenes.html`、`events.html`：补回 `layout-editor.js` 引用。
- `data.js`：补回 `factions` 集合，并恢复“安比的午后”的 `cunning-hares` 阵营关联。
- `faction.js`：改为通过 `window.archiveData` 读取阵营和档案数据。
- `progress.md`：记录本轮恢复范围、备份分支检查和待验证项。
- 回滚方式：使用 `git restore index.html mainline.html stories.html behind-scenes.html events.html data.js faction.js progress.md` 可撤销本轮未提交改动；提交后可使用 `git revert <本轮提交>` 回退。

## 2026-07-12 - Task: 接入布局编辑器云端共享同步

### What was done
将全站位置编辑器的桌面、平板、手机布局数据纳入阿里云共享数据模型。布局拖动、前移、后移和恢复当前设备仍先写入浏览器本地，并标记为未保存；用户点击现有保存按钮后，`window.hooxiCollectData()` 会把 `layout` 与首页、档案数据一起提交到 `/site-data`。云端或缓存数据加载后，如果包含 `layout`，布局编辑器会自动调用 `window.hooxiLayout.setData()` 应用；旧云端数据没有 `layout` 时仍保持兼容。阿里云函数结构校验同步允许可选 `layout` 对象，并拒绝数组或字符串等无效布局。

### Testing
- `node --check sync.js`、`layout-editor.js`、`app.js`、`aliyun/site-data-api/index.js`、`aliyun/site-data-api/index.test.js`：通过。
- 阿里云函数 `npm test` 未执行：本地此前已确认缺少 `ali-oss` 依赖，且未获得安装依赖授权；本轮已用 `node --check` 和测试文件静态校验覆盖语法层面。
- 浏览器验证：拖动布局后同步状态变为“有未保存修改”，`window.hooxiCollectData().layout` 包含当前断点布局数据。
- 浏览器验证：触发带 `layout` 的 `hooxi:data` 事件后，`window.hooxiLayout.getData()` 和 `localStorage['hooxi:layout:v1']` 均更新为事件中的布局数据。
- 控制台仅有缺失 `favicon.ico` 的 404，不属于本轮功能错误。
- `git diff --check`：通过。

### Notes
- `sync.js`：共享数据结构新增可选 `layout`，并兼容旧数据。
- `layout-editor.js`：布局变更标记未保存，支持从 `hooxi:data` 应用云端布局。
- `app.js`：共享保存时带上 `window.hooxiLayout.getData()`。
- `aliyun/site-data-api/index.js`、`index.test.js`：校验并测试可选布局对象。
- `docs/README.md`、`docs/aliyun-collaboration.md`：补充布局数据随阿里云共享同步的说明。
- `progress.md`：记录本轮变更、验证和回滚方式。
- 回滚方式：使用 `git restore sync.js layout-editor.js app.js aliyun/site-data-api/index.js aliyun/site-data-api/index.test.js docs/README.md docs/aliyun-collaboration.md progress.md` 可撤销本轮未提交改动；提交后可使用 `git revert <本轮提交>` 回退。

## 2026-07-12 - Task: 增加布局云端保存按钮

### What was done
在全站位置编辑工具条中新增“保存布局到云端”按钮。用户调整布局后不必再回到首页或页面编辑器寻找保存入口，可直接在布局工具条内触发现有阿里云共享保存流程；该按钮复用 `HooxiSync.save()`，因此仍沿用共享密码、版本号冲突保护和已有 `layout` 数据模型，不新增额外接口。

### Testing
- `node --check layout-editor.js`：通过。
- 浏览器验证：工具条出现“保存布局到云端”，点击后调用 `HooxiSync.save()`，状态文本更新为“布局已同步到云端”。
- `git diff --check`：通过。
- 控制台仅有缺失 `favicon.ico` 的 404，不属于本轮功能错误。

### Notes
- `layout-editor.js`：新增布局工具条保存按钮，并在保存中、成功、失败时更新布局状态文本。
- `docs/README.md`、`docs/aliyun-collaboration.md`：同步说明布局可通过专用按钮或现有保存按钮写入云端。
- `progress.md`：记录本轮按钮增强、验证和回滚方式。
- 回滚方式：使用 `git restore layout-editor.js docs/README.md docs/aliyun-collaboration.md progress.md` 可撤销本轮未提交改动；提交后可使用 `git revert <本轮提交>` 回退。

## 2026-07-12 - Task: 避免未配置云端时编辑闪屏

### What was done
修复云端 API 未配置或编辑中轮询导致的页面反复应用数据问题。同步模块现在只在 API 为空时首次应用默认或缓存数据，不再启动 5 秒轮询；当用户正在编辑或已有未保存修改时，非保存来源的远端/缓存数据不会自动派发到页面，避免重渲染打断输入、造成闪屏或影响保存。保存成功仍允许应用服务端返回的数据，保持版本号与云端状态一致。

### Testing
- `node --check sync.js`：通过。
- 浏览器验证：API 地址为空时 `window.HooxiSync.load()` 不再重复派发 `hooxi:data`，页面标题未被重渲染覆盖。
- 浏览器验证：dirty 状态下手动触发加载后仍保留未保存提示，不再被“云端 API 待配置”覆盖。
- `git diff --check`：通过。

### Notes
- `sync.js`：新增离线首次应用标记；编辑中或 dirty 状态下阻止自动 apply；API 未配置时不启动轮询。
- `progress.md`：记录本轮闪屏修复、验证和回滚方式。
- 回滚方式：使用 `git restore sync.js progress.md` 可撤销本轮未提交改动；提交后可使用 `git revert <本轮提交>` 回退。

## 2026-07-12 - Task: 回退为单人本地编辑模式

### What was done
移除阿里云共享同步入口和站点页面中的远程协作调用，将首页、档案页、播放器歌单和全站位置布局保存恢复为当前浏览器本地 `localStorage`。保留全站位置编辑器、阵营专属页、播放器和首页/档案页编辑器；发布流程改为由维护者导出发布数据、覆盖仓库文件后手动提交并推送 GitHub Pages。

### Testing
- `node --check app.js`、`page.js`、`layout-editor.js`、`faction.js`、`data.js`：通过。
- 全仓检查：当前代码与文档中不再存在 `sync.js` 页面引用、`HooxiSync` 调用、`data-sync-status` 状态位、`hooxi:data` 监听或阿里云函数文档入口；匹配项仅保留在历史 `progress.md` 记录中。
- 浏览器验证：首页未加载 `sync.js`，`window.HooxiSync` 不存在，编辑保存写入 `hooxiZZZConfig`，全站“调整位置”入口存在。
- 浏览器验证：`mainline.html` 未加载 `sync.js`，页面保存写入 `hooxi:mainline` / `hooxi:archive-updated`，全站布局编辑器仍可用。
- 浏览器验证：`faction.html?id=cunning-hares` 可打开“狡兔屋阵营档案”，展示 1 条关联记录，并只加载 `data.js`、`faction.js`、`layout-editor.js`。

### Notes
- `app.js`：首页编辑器保存恢复为本地写入，移除云端保存、脏标记、远端数据应用和同步事件汇总逻辑。
- `page.js`：档案页编辑器保存恢复为本地写入，移除云端同步和远端事件应用逻辑，提示文字改为当前浏览器语义。
- `layout-editor.js`：全站位置编辑器只保存到本地，移除“保存布局到云端”按钮和远端布局应用逻辑。
- `index.html`、`mainline.html`、`stories.html`、`behind-scenes.html`、`events.html`：移除 `sync.js` 引用和同步状态位，保留 `layout-editor.js`。
- `styles.css`：移除同步状态颜色规则。
- `README.md`、`docs/README.md`：发布和维护说明改为单人本地编辑、手动 `git push` 到 `https://pokkan39.github.io/hooxi-zzz/`。
- `sync.js`、`aliyun/site-data-api/`、`docs/aliyun-collaboration.md`：删除阿里云共享同步模块、函数和部署文档。
- `progress.md`：记录本轮回退范围、验证和回滚方式。
- 回滚方式：本轮未提交前可使用 `git restore README.md app.js page.js layout-editor.js index.html mainline.html stories.html behind-scenes.html events.html styles.css docs/README.md progress.md sync.js docs/aliyun-collaboration.md aliyun/site-data-api/index.js aliyun/site-data-api/index.test.js aliyun/site-data-api/package.json aliyun/site-data-api/package-lock.json` 恢复；提交后可使用 `git revert <本轮提交>` 回退。
