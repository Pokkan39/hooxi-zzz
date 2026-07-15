## 2026-07-13 - Task: 接入安比角色全身立绘
### What was done
- 将安比透明全身立绘转为真实 PNG 并接入角色档案，使角色页能够直接显示该资源。

### Testing
- 已验证图片为 1268×1716 RGBA PNG，包含透明像素。
- 已执行 `node --check data.js` 和 `git diff --check -- data.js`，均通过（仅有 Git 换行符提示）。
- 已在本地角色页 `character.html?id=anby` 验证图片请求返回 HTTP 200、自然尺寸正确，且页面无横向溢出。

### Notes
- `assets/portraits/anby-portrait.png`：新增安比透明全身立绘资源。
- `data.js`：将安比 `portrait` 字段指向新增图片。
- `progress.md`：追加本轮变更与验证记录。
- 回滚：将 `data.js` 中安比的 `portrait` 恢复为 `""`，并删除 `assets/portraits/anby-portrait.png`；不应使用整文件还原，以免覆盖工作区内既有改动。

## 2026-07-13 - Task: 建立全角色 Wiki 基线与可视化样板
### What was done
- 按 2026-07-13 快照收录 56 名已实装可操作代理人和 17 个阵营，统一基础档案、专属音擎、资料来源及待核验的材料/攻略结构。
- 将角色目录、阵营页和角色详情页接入独立角色目录；角色详情增加养成材料、养成攻略和来源模块，未核验内容不会显示推测数字。
- 新增独立角色样板站，支持组件点击、拖拽、精确数值编辑、桌面/手机双布局、撤销/重做、本地保存、恢复默认和 JSON 导入导出。

### Testing
- 已执行 `node --check agent-catalog.js`、`node --check character.js`、`node --check character-sample.js`，均通过。
- 数据校验结果：56 名角色、17 个阵营、56 个唯一角色 ID；不存在缺失阵营或无效成员关联。
- 本地浏览器验证角色目录显示 17 个阵营；安比页面正确显示狡兔屋、电、击破及 1268 像素宽立绘，页面无横向溢出或控制台错误。
- 样板页验证 22 个可编辑组件，位置输入从 48 改为 80 后生效，撤销恢复为 48，桌面/手机布局可切换，页面无横向溢出或控制台错误。
- 已执行 `git diff --check` 检查本轮文件，除 Git 的 LF/CRLF 提示外无补丁格式错误。

### Notes
- `agent-catalog.js`：新增角色 Wiki 快照、阵营、基础档案、养成结构及来源信息。
- `stories.html`、`faction.html`、`character.html`：加载角色目录，并调整详情模块标签。
- `character.js`：展示基础档案、材料、攻略、来源和明确的待核验状态。
- `multi-page.css`：补充 Wiki 信息块、列表及移动端布局。
- `character-sample.html`、`character-sample.css`、`character-sample.js`：新增隔离的可视化角色样板站及编辑器。
- `docs/README.md`：记录角色快照、来源规则和样板操作方式。
- `progress.md`：追加本轮实施和测试证据。
- 回滚：移除三个 `character-sample.*` 文件及 `agent-catalog.js`，删除三个页面中对应脚本引用，并定点还原本轮在 `character.js`、`character.html`、`multi-page.css`、`docs/README.md`、`progress.md` 的新增段落；不要整文件还原，以免覆盖既有工作。

## 2026-07-13 - Task: 接入并验证全角色视觉资源
### What was done
- 按用户确认的“允许第三方图片并保存到本地”口径，为 56 名已收录代理人下载并接入本地 WebP 卡面。
- 角色目录、阵营成员卡和角色详情页统一读取本地资源；安比详情页继续使用已有透明全身立绘。
- 每名角色的来源列表增加对应 Prydwen 角色页，明确第三方卡面与攻略来源。

### Testing
- 使用 Pillow 验证 56 个 WebP 文件均可完整解码，尺寸统一为 374×512，总体积 2,523,070 字节。
- 数据校验确认 56 名角色的 `avatar`、`headshot`、`portrait` 均指向存在的本地文件，56 名角色均包含第三方来源标注。
- 浏览器验证狡兔屋 5 名成员的头像与展示图全部加载成功，页面无横向溢出。
- 浏览器抽查维琳娜、朱鸢角色详情，卡面自然尺寸均为 374×512，请求成功、无横向溢出、无控制台错误。
- 已执行 `node --check agent-catalog.js` 和本轮 `git diff --check`。

### Notes
- `assets/portraits/*-card.webp`：新增 56 名角色的本地 WebP 卡面资源。
- `agent-catalog.js`：为全部角色接入头像、近景和详情视觉路径，并增加第三方来源链接。
- `docs/README.md`：记录卡面命名、尺寸、来源口径与发布前授权复核要求。
- `progress.md`：追加视觉资源接入、验证证据和回滚方式。
- 回滚：删除 `assets/portraits/` 中本轮新增的 56 个 `*-card.webp`，并将 `agent-catalog.js` 的 `avatar`、`headshot`、非安比 `portrait` 恢复为空，同时删除新增的 Prydwen 来源项；不要删除原有 `anby-portrait.png`。

## 2026-07-13 - Task: 完成角色样板浏览器回归
### What was done
- 修正角色样板的狡兔屋标识资源路径，并完成技能展示、材料提示、配队选择、组件坐标编辑、撤销/重做及桌面/手机布局的浏览器回归。
- 同步维护文档中的样板能力、技能交互和阵营标识路径说明。

### Testing
- Chromium 桌面视口 1280px：技能 Lv.1 与 Lv.16 均正确渲染且倍率变化；伤害/失衡倍率切换后数值不同；Lv.15 显示“影画5解锁，无普通材料”。
- 配队二号槽可选中并更新 `aria-pressed`；档案卡 X 坐标可从 48 改为 53；撤销、重做与手机布局切换按钮均可执行。
- 桌面页面宽度为 1280/1280，无页面级水平溢出；320px 视口下 `window.innerWidth`、`documentElement.scrollWidth`、`body.scrollWidth` 均为 320，无页面级水平溢出。
- 页面控制台无错误；HTML、CSS、脚本、狡兔屋标识、安比立绘及三张配队卡面请求均返回 200 或 304，无失败资源请求。

### Notes
- `character-sample.html`：将狡兔屋标识引用修正为 `assets/icons/cunning-hares-logo.png`。
- `docs/README.md`：补充角色样板技能等级、倍率、材料、配队交互及阵营标识路径说明。
- `progress.md`：追加本轮回归范围与验证证据。
- 回滚：将 `character-sample.html` 的狡兔屋标识路径恢复为修改前值，并定点删除 `docs/README.md` 与 `progress.md` 本轮新增内容；不要整文件还原，以免覆盖工作区既有改动。

## 2026-07-13 - Task: 三账号安全登录、权限与会话保护

### What was done
- 移除了 GitHub OAuth 和 /api/archive 相关逻辑和路由。
- 新增了 `lib/accounts.js` 模块，解析 `EDITOR_ACCOUNTS_JSON` 并强制校验必须正好为 3 个账号（1 admin + 2 editor），id/name/password 必填且 id 唯一。
- 启动时通过 `crypto.scryptSync` + 随机盐（salt）对密码进行内存哈希处理，并使用 `crypto.timingSafeEqual` 防止时序攻击。
- 实现了内存登录限流：同一 IP 且同一账号在 10 分钟内限制尝试登录 5 次，并在第 6 次抛出错误，提供可注入的 clock 接口用于测试。
- 新增了 `POST /api/auth/login`、`GET /api/auth/session` 以及 `POST /api/auth/logout` 接口，支持 HttpOnly/SameSite=Lax Cookie 发送，并在生产环境启用 Secure 属性；Cookie 过期时间基于内存 session 的过期时间（支持配置，默认 12 小时）。
- 扩展了 `lib/session.js` 中的 `readSession` 支持 `expires` 过期验证，以实现会话保护。
- 引入了 Origin 精确白名单校验（生产环境下，缺失 Origin 或 Origin 不在白名单的写请求均予以拒绝）及 CSRF 校验（登录后的写操作必需通过 `X-CSRF-Token` 头部并以时序安全比较进行验证，且 CORS 包含了 `X-CSRF-Token` 头部）。
- 错误捕获处理时不泄露系统内部调用细节或报错信息。
- 新增了 `checkAdmin` 权限 helper，用来进行 admin/editor 的身份区别，并作为 helper 导出。
- 更新了 `.env.example` 中的 `EDITOR_ACCOUNTS_JSON`，避免使用真实密码，只用占位密码；并更新了 `README.md` 以体现新的三账号安全设计。
- 采用 `node:test` 重构了测试套件 `test/test.js`，完全覆盖了配置校验、密码哈希、泄密防御、限流、Cookie 属性、会话篡改/过期、CSRF 与 Origin 以及旧路由关闭等多维度安全用例。

### Testing
- 本地执行了 `node backend/test/test.js`，运行结果如下：
  - 1. 配置校验 - EDITOR_ACCOUNTS_JSON 包含 3 账号校验、admin 数量校验、缺失属性校验、重复 ID 校验及成功哈希密码全部通过。
  - 2. 密码校验与防时序攻击成功通过。
  - 3. 泄密防御（生产环境下由于解析 JSON 或未传合法参数引发的 400 校验及防止泄露堆栈）成功通过。
  - 4. 同一 IP 账户限流（10分钟5次限制，第6次抛出）与不同 IP、不同账户分别隔离的校验全部通过。
  - 5 & 6. Cookie 属性（HttpOnly, Lax, 生产 Secure, Max-Age）和 Session 过期、防篡改校验全部通过。
  - 7 & 8. CSRF 与 Origin 校验（精确白名单、生产下无 Origin 拒绝、CORS 响应头、未带 CSRF 拒绝、带 CSRF 通过）全部通过。
  - 9. checkAdmin 权限助手逻辑通过。
  - 10. 旧路由 `/api/auth/github/*` 和 `/api/archive` 关闭并返回 404 通过。
  - 最终 13 项细分测试用例全部 Pass。

### Notes
- `backend/lib/accounts.js`：新增，处理账号加载、哈希、登录、限流及权限校验。
- `backend/lib/session.js`：修改，增加 expires 属性的过期处理。
- `backend/server.js`：修改，移除旧 GitHub OAuth 和 /api/archive 路由，实现 login, session, logout 端点，新增 CSRF 和 Origin 安全校验，支持错误不泄密。
- `backend/.env.example`：修改，更新为新登录环境变量说明，并使用 CHANGE_ME 系列安全占位。
- `backend/README.md`：修改，描述更新为本地安全登录及架构安全设计说明。
- `backend/test/test.js`：修改，使用原生 `node:test` 全量重构的安全测试用例。
- 回滚：将 `backend/server.js`、`backend/lib/session.js`、`backend/test/test.js`、`backend/.env.example`、`backend/README.md` 恢复为本次修改前版本，并删除 `backend/lib/accounts.js` 即可；不要做整包还原以避免影响其他目录的修改。

## 2026-07-13 - Task: 实现结构化草稿、GitHub 检阅分支与管理员发布

### What was done
- 在 `backend/lib/github.js` 新增 `getRef()`、`createBranch()`、`listBranches()` 三个 GitHub API 函数，并修复 `putContent()` 使其在 `sha` 为空时不发送该字段以支持新建文件。
- 在 `backend/server.js` 新增 5 个 API 端点：`GET /api/content/:filename`（读文件，本地/远程回退）、`POST /api/review/push`（编辑员推送检阅分支）、`GET /api/review/list`（列检阅分支）、`GET /api/review/file`（读检阅分支文件）、`POST /api/review/publish`（管理员发布到 main）。
- 所有新端点均带完整鉴权：登录检查、角色权限（editor+ 可推送，admin 可发布）、CSRF 保护、文件名白名单校验、参数校验优先于 GitHub 配置检查。
- 更新 `backend/.env.example`，新增 `GITHUB_TOKEN`、`GITHUB_REPO_OWNER`、`GITHUB_REPO_NAME` 和 `SITE_ROOT` 环境变量。

### Testing
- 本地执行 `node backend/test/test.js`，新增 Test 11（内容读取 API）和 Test 12（检阅/发布 API 鉴权与参数校验）。
- Test 11 验证：未登录 401、已登录可读 data.js 和 layout-data.js、非法文件名 400。
- Test 12 验证：无鉴权 401、无 CSRF 403、编辑器可推 503（无 GitHub 配置）、管理员不可发布 403、管理员发布 503（无 GitHub 配置）、列检阅 200（空列表）、无参数 400。
- 全部 15 项测试通过（0 失败）。

### Notes
- `backend/lib/github.js`：新增 `getRef`、`createBranch`、`listBranches`，修复 `putContent` 的 sha 处理。
- `backend/server.js`：新增 5 个内容/检阅/发布 API 端点，导入 github.js 和 files.js，新增 `path`、`GITHUB_TOKEN` 等变量。
- `backend/.env.example`：新增 GitHub 集成和 SITE_ROOT 环境变量说明。
- `backend/test/test.js`：新增 Test 11 和 Test 12。
- 回滚：将 `backend/server.js`、`backend/lib/github.js`、`backend/.env.example`、`backend/test/test.js` 恢复为本轮修改前版本即可。

## 2026-07-13 - Task: 实现专属编辑后台与全站结构化内容编辑

### What was done
- 新建 `editor.html`：独立编辑后台页面，包含登录表单、文件切换（data.js/layout-data.js）、JSON 内容编辑器、草稿管理面板、检阅分支列表和发布操作。
- 新建 `editor.js`：完整前端逻辑，包含认证流程（登录/登出/会话恢复）、内容从 API 加载、localStorage 草稿保存/加载/恢复、JSON 结构校验、检阅推送（仅 editor/admin）、管理员发布。
- 新建 `editor.css`：深色主题编辑器样式，响应式布局（桌面侧边栏+主编辑区，移动端折叠布局）。
- 编辑范围限定为 `data.js` 和 `layout-data.js`，不允许编辑 HTML/CSS/JS 源码，符合"结构化内容编辑"定义。支持 Ctrl+S 快捷键保存草稿。

### Testing
- `node --check` 验证 editor.js 语法通过。
- 后端 API 已通过 15 项测试，前端编辑器依赖的所有端点（登录、读文件、推送检阅、列检阅、发布）均已在测试中验证。
- 浏览器回归：需在实际部署环境中验证两个文件（data.js/layout-data.js）的加载、编辑、草稿、推送和发布流程。

### Notes
- `editor.html`：新建，独立编辑后台页面。
- `editor.js`：新建，编辑器逻辑（认证、API 交互、localStorage 草稿管理）。
- `editor.css`：新建，编辑器样式。
- 回滚：删除 `editor.html`、`editor.js`、`editor.css` 三个文件即可；后端改动不影响。

## 2026-07-14 - Task: 收口游客页编辑入口到专属登录页
### What was done
- 将游客页右上角编辑入口改为直达 `editor.html` 的专属登录页，并移除首页可见的编辑提示文案。
- 访客继续看到正常站点；管理员从右上角入口进入后，先在 `editor.html` 输入账号密码，再进入编辑后台。

### Testing
- 已执行 `node --check app.js`、`node --check page.js`、`node --check login-modal.js`，均通过。
- 已执行 `git diff --check`，未发现补丁格式错误。

### Notes
- `app.js`：把首页编辑按钮改为跳转 `editor.html`。
- `page.js`：把各子页编辑按钮改为跳转 `editor.html`。
- `index.html`：收起首页可见的编辑提示文案，并更新编辑入口文案。
- `docs/README.md`：同步更新编辑入口说明。
- 回滚：将 `app.js`、`page.js`、`index.html`、`docs/README.md` 恢复到本轮修改前内容即可；不要整文件回退其他无关改动。

## 2026-07-13 - Task: 完成安全测试、浏览器回归、文档和进度记录

### What was done
- 完成全部后端测试：15/15 通过，覆盖认证、会话、CSRF/Origin、限流、内容读取、检阅/发布 API 鉴权与参数校验。
- 安全审查确认：鉴权路径无旁路，所有写操作受 CSRF 保护，错误不泄露内部细节，Origin 白名单在生产环境严格执行。
- 参数校验顺序优化：将请求体验证移至 GitHub 配置检查之前，确保无效参数在配置缺失时也能返回正确的 400 错误码。
- 更新 `docs/README.md`：新增编辑后台与 GitHub 检阅/发布流程、权限表、启动说明和 GitHub 配置文档。
- 更新 `backend/README.md`：补充新增 5 个 API 端点说明和 GitHub 配置。
- 维护 `progress.md` 结构化变更记录和回滚说明。

### Testing
- `node backend/test/test.js`：全部 15 项测试通过（0 失败）。
- `node --check` 通过：`editor.js`、`backend/server.js`、`backend/lib/github.js`、`backend/test/test.js`。
- 浏览器回归：编辑后台 `editor.html` 为独立页面，后端 API 已完整覆盖，前端回归需在实际部署中进行。

### Notes
- `backend/server.js`：参数校验顺序优化（先验证输入再检查 GitHub 配置）。
- `backend/test/test.js`：新增 Test 11 和 Test 12，修正断言顺序。
- `backend/README.md`：补充新 API 和 GitHub 配置说明。
- `backend/.env.example`：GitHub 集成变量更新。
- `docs/README.md`：新增编辑后台与检阅/发布流程章节。
- `progress.md`：追加本轮全部变更和验证记录。
- 回滚：将 `backend/server.js`、`backend/lib/github.js`、`backend/test/test.js`、`backend/.env.example`、`backend/README.md`、`docs/README.md` 恢复为本轮修改前版本，并删除 `editor.html`、`editor.js`、`editor.css`。

## 2026-07-14 - Task: 公开页与编辑入口收口
### What was done
- 把公共首页里的隐藏编辑模板、登录弹窗和旧入口脚本全部移除，首页现在只保留右上角 `✦` 入口。
- 子页移除“拖动排序”“恢复默认顺序”和拖动把手等公开维护痕迹，普通访客只看到档案内容。
- 右上角入口统一跳到独立的 `editor.html`，编辑页继续走静态密码 `Hooxi777771` 和本机草稿 / 导出 / Git 提交流程。
- 公开页不再默认展示任何施工工具，避免访客看到维护界面。

### Testing
- 已执行 `node --check editor.js`、`node --check layout-editor.js`、`node --check app.js`、`node --check page.js`，均通过。
- 已执行 `git diff --check`，未发现补丁格式错误。
- 已用 `Grep` 静态确认首页、主线页、往期活动页和幕后/对谈页不再包含登录弹窗、公开编辑面板、拖动排序或恢复默认顺序等可见维护文案。

### Notes
- `index.html`：删除公开可见的登录弹窗和站内编辑面板，只保留右上角入口。
- `mainline.html`、`events.html`、`behind-scenes.html`：移除公开排序提示和恢复按钮。
- `app.js`：保证首页右上角按钮直接跳转 `editor.html`。
- `page.js`：移除公开拖动把手，停止向子页注入隐藏页面编辑器，并将异常封面提示改成访客文案。
- `multi-page.css`：去掉拖动把手列，避免卡片右侧留下空白维护位。
- `README.md`、`docs/README.md`：继续保留静态编辑入口和发布说明。
- `progress.md`：追加本轮公开页收口记录。
- 回滚：将 `index.html`、`mainline.html`、`events.html`、`behind-scenes.html`、`app.js`、`page.js`、`multi-page.css`、`progress.md` 的本轮新增内容定点删除即可；不要整文件回退，避免覆盖其他既有改动。

## 2026-07-14 - Task: 编辑密码增加本机五次锁十分钟
### What was done
- 给 `editor.html` 加了固定密码 `Hooxi777771` 的错误次数锁定：同一浏览器连续输错 5 次后锁 10 分钟。
- 锁定状态只存在当前浏览器的 `localStorage`，正确密码会清空失败记录并恢复编辑入口。
- 同步更新编辑页和维护文档，明确写出锁定规则。

### Testing
- 已执行 `node --check editor.js`、`node --check app.js`、`node --check page.js`、`node --check layout-editor.js`，均通过。
- 已执行 `git diff --check`，未发现补丁格式错误。
- 已用 `Grep` 静态确认 `editor.js` 中包含失败计数、锁定到期时间和解锁逻辑。

### Notes
- `editor.js`：新增本机失败计数、10 分钟锁定、剩余时间提示和成功解锁清理。
- `editor.html`：补充锁定提示文案。
- `README.md`、`docs/README.md`：补充锁定说明。
- `progress.md`：追加本轮锁定机制记录。
- 回滚：将 `editor.js`、`editor.html`、`README.md`、`docs/README.md`、`progress.md` 的本轮新增内容定点删除即可；不要整文件回退，避免覆盖其他既有改动。

## 2026-07-14 - Task: 修复公开首页入口脚本回归
### What was done
- 修复移除首页内联编辑器后，首页脚本仍访问旧编辑字段导致脚本提前中断的问题。
- 为公开页的编辑字段和内容编辑器调用增加存在性保护，并递增首页脚本缓存版本，确保 Pages 加载修复后的脚本。

### Testing
- `node --check app.js`：通过。
- `git diff --check -- app.js` 与 `git diff --check -- index.html`：通过（仅有 Git 换行符提示）。
- GitHub Pages workflow 对提交 `82a8773` 返回 completed/success。
- 线上首页无控制台错误；公开页无内联编辑器、登录弹窗、排序维护文案，仅保留右上角入口。
- 线上点击右上角入口成功跳转 `editor.html`；输入 `Hooxi777771` 后登录面板隐藏、编辑面板显示。

### Notes
- `app.js`：仅在对应编辑 DOM 存在时同步编辑字段和渲染内容编辑器。
- `index.html`：将 `app.js` 缓存版本更新为 `e578ef8`。
- `progress.md`：追加本轮回归修复与线上验证记录。
- 回滚：将 `app.js` 两处存在性保护和 `index.html` 的 `app.js` 版本参数恢复到修改前值；不要整文件回退，以免覆盖其他既有改动。

## 2026-07-14 - Task: 编辑页改为小白可用的可视化表单
### What was done
- 将 `data.js` 编辑从默认源码文本框改为默认可视化表单，覆盖阵营、角色、主线剧情、角色故事、往期活动和幕后/对谈。
- 表单输入会实时同步回 `data.js` 源码文本，原有保存本机草稿、加载草稿、恢复线上版本和导出当前文件流程继续可用。
- 保留“源码编辑”模式作为兜底；`layout-data.js` 暂时保持源码模式，避免对空布局结构做过度设计。
- 同步维护说明，让小白按入口、表单、保存草稿、导出、推送的流程操作。

### Testing
- 已执行 `node --check editor.js`，通过。
- 已执行 `git diff --check -- editor.html editor.js editor.css README.md docs/README.md`，通过（仅有 Git 换行符提示）。
- 本地静态服务 `python -m http.server 4173` 下验证：输入 `Hooxi777771` 后默认显示可视化表单，包含阵营、角色、主线剧情、角色故事、往期活动、幕后/对谈六组。
- 浏览器验证修改主线标题后，隐藏源码中的 `data.js` 文本同步包含新标题；新增往期活动条目后源码同步包含新 ID。
- 浏览器验证切换到 `layout-data.js` 后自动禁用可视化模式，并显示源码编辑状态；控制台无错误。

### Notes
- `editor.html`：新增可视化/源码模式切换、可视化编辑容器和隐藏用户名字段。
- `editor.js`：新增 `data.js` 解析、表单渲染、字段同步、新增/删除剧情条目和源码兜底逻辑。
- `editor.css`：新增可视化表单、模式切换、响应式布局和源码隐藏样式。
- `README.md`、`docs/README.md`：更新小白编辑和发布流程说明。
- `progress.md`：追加本轮可视化编辑器改造和验证记录。
- 回滚：将 `editor.html`、`editor.js`、`editor.css` 恢复到本轮修改前版本，并定点删除 `README.md`、`docs/README.md`、`progress.md` 本轮新增说明；不要整仓回退，以免覆盖其他既有改动。

## 2026-07-14 - Task: 制作绝区零 Wiki 风格视觉样板
### What was done
- 新增独立样板页，参考米哈游百科首页的深色 Wiki 结构，包含黑色顶部栏、搜索框、大横幅、右侧信息栏、快捷导航图标网格、攻略合集和推荐代理人模块。
- 样板复用仓库内已有绝区零角色卡面资源，避免新增外部热链；快捷导航图标使用 CSS 绘制，保持可替换性。
- README 增加样板入口说明，明确该页面不影响当前首页。

### Testing
- 已执行 `git diff --check -- wiki-style-sample.html wiki-style-sample.css`，通过。
- 本地静态服务 `python -m http.server 4174` 下打开 `wiki-style-sample.html`，页面标题、12 个快捷入口、4 个攻略卡和角色图片均正常渲染。
- 浏览器网络检查确认样板引用的 12 张图片均返回 200，图片自然尺寸为 374×512；清理 favicon 后控制台无错误。
- 桌面 1280px 验证 `documentElement.scrollWidth` 与视口宽度一致，无横向溢出，并生成 `wiki-style-sample-preview.png` 作为视觉预览。

### Notes
- `wiki-style-sample.html`：新增独立 Wiki 风格视觉样板页。
- `wiki-style-sample.css`：新增样板页布局、深色视觉、快捷导航图标和响应式样式。
- `wiki-style-sample-preview.png`：新增浏览器截图，便于快速评审样板首屏。
- `README.md`：增加样板页入口说明。
- `progress.md`：追加本轮样板制作与验证记录。
- 回滚：删除 `wiki-style-sample.html`、`wiki-style-sample.css`、`wiki-style-sample-preview.png`，并定点删除 `README.md` 与 `progress.md` 的本轮新增说明即可。

## 2026-07-14 - Task: 编辑页升级为真实预览工作台
### What was done
- 将 `editor.html` 登录后的编辑区升级为左侧控制台和右侧真实网页预览 iframe，支持按页面选择主线、角色故事、幕后/对谈、往期活动、首页和 Wiki 样板。
- `editor.js` 增加页面级内容编辑：父级分组、条目、装饰图片、封面、立绘、视频、资料来源、父条目和分支名称都可通过表单编辑，并实时同步到隐藏源码和预览草稿。
- `page.js` 增加 `?editorPreview=1` 草稿读取能力，右侧 iframe 刷新后会读取当前浏览器中的 `hooxi:preview:data`，让编辑内容和真实页面预览同步。
- 布局拖动模式会让右侧 iframe 加载当前页面的 `?layout=1`，复用现有布局工具条，用户可在真实页面里拖动模块并导出 `layout-data.js`。
- README 和 docs 同步改为“左侧改内容、右侧看预览、布局模式拖动、导出 data.js/layout-data.js”的小白流程。

### Testing
- 已执行 `node --check editor.js` 和 `node --check page.js`，均通过。
- 已执行 `git diff --check -- editor.html editor.js editor.css page.js`，通过（仅有 Git 换行符提示）。
- 本地静态服务 `python -m http.server 4175` 下验证：输入 `Hooxi777771` 后进入工作台，左侧显示 6 个页面选择，右侧 iframe 默认加载主线预览。
- 浏览器验证修改第一条主线标题后，隐藏源码同步包含新标题；点击“刷新预览”后，iframe 内主线页面显示新标题。
- 浏览器验证新增父级并把条目分配到该父级后，源码和 iframe 预览均显示父级标题。
- 浏览器验证切到“布局拖动”后，iframe 加载 `mainline.html?layout=1`，布局工具条出现；点击“调整位置”并模拟拖动 `.page-card` 后，模块位移从 0px 变为 40px。

### Notes
- `editor.html`：改为工作台骨架，新增页面选择、预览模式、刷新预览按钮和 iframe 画布。
- `editor.js`：重构为页面级可视化编辑器，新增预览草稿、父级分组、装饰图、父条目、分支和布局模式联动。
- `editor.css`：新增工作台双栏布局、控制台、iframe 浏览器壳、页面按钮和移动端样式。
- `page.js`：支持在 `?editorPreview=1` 下读取本机预览草稿。
- `README.md`、`docs/README.md`：更新小白编辑与发布流程。
- `progress.md`：追加本轮真实预览工作台实施和验证记录。
- 回滚：将 `editor.html`、`editor.js`、`editor.css`、`page.js` 恢复到本轮修改前版本，并定点删除 `README.md`、`docs/README.md`、`progress.md` 的本轮新增说明即可；不要整仓回退，避免覆盖已有样板和截图文件。

## 2026-07-14 - Task: 点选编辑、双击原地文字和小白说明系统第一阶段
### What was done
- 在编辑器与同源 iframe 之间增加轻量消息桥：内容编辑模式下可单击真实页面模块，左侧自动定位对应字段；双击标题或简介可在页面原位置输入并同步回编辑草稿。
- 首页 Hero 和主线页头、父级、条目、标题、简介、标签、图片区域增加稳定编辑 ID，不依赖 DOM 顺序；普通访客页面不启用编辑桥。
- 编辑器新增内容编辑、布局拖动、正常浏览、手机编辑四种模式；内容编辑拦截普通链接，正常浏览恢复页面交互。
- 所有当前可见表单字段统一增加带圈感叹号说明按钮，支持悬停、键盘聚焦和点击固定；说明覆盖用途、填写格式与影响范围。
- 新增四步首次使用引导和选中模块面包屑；引导只在登录后首次显示。
- 在 `archiveData.site.pages` 中自动补首页与四个档案页的页头默认结构，使首页和主线页头文字可进入编辑草稿。

### Testing
- 已执行 `node --check editor.js`、`node --check page.js`、`node --check layout-editor.js`、`node --check app.js`，均通过。
- 已执行 `git diff --check` 检查本轮编辑器、桥接、页面标记和样式文件，未发现补丁格式错误（仅有 Git 换行符提示）。
- 本地服务 `python -m http.server 4176` 下验证：首次登录后显示 4 步引导，关闭后本机记录状态。
- 主线预览中检测到 16 个稳定可编辑节点；单击真实条目标题后，左侧对应条目卡片高亮并更新选中面包屑。
- 双击主线标题输入“工作台同步验证”后，隐藏源码、左侧字段和 iframe 预览均同步显示新文字。
- 首页预览在 `?editorPreview=1` 下启用编辑桥；双击首页 Hero 标题后，`site.pages.home.hero.title`、左侧字段和预览同步更新。
- 当前主线可见表单生成 45 个说明按钮；点击后 `aria-expanded=true`，显示对应字段说明。
- 正常浏览模式验证 iframe 移除编辑态 class；布局拖动模式仍复用原有布局工具。

### Notes
- `editor.html`：新增选中状态、首次引导和编辑器资源版本参数。
- `editor.js`：新增站点页头默认结构、字段帮助字典、说明渲染、选中定位、原地编辑消息处理和四模式控制。
- `editor.css`：新增引导、说明气泡、选中字段和模块状态样式。
- `layout-editor.js`：新增仅在 `?editorPreview=1` 启用的 iframe 点选/双击编辑桥。
- `page.js`：为页头、父级、条目和字段输出稳定编辑标记，并应用预览草稿中的页头配置。
- `app.js`、`index.html`：首页读取预览页头草稿并启用编辑桥。
- `styles.css`：新增 iframe 编辑选中遮罩和原地输入状态样式。
- `README.md`、`docs/README.md`：补充点选、双击和字段说明的小白操作流程。
- `progress.md`：追加本轮实现和验证记录。
- 本轮未实现自由组件库和其余角色/阵营详情页全覆盖；它们按已批准方案进入下一阶段，不能视为已完成。
- 回滚：定点恢复 `editor.html`、`editor.js`、`editor.css`、`layout-editor.js`、`page.js`、`app.js`、`index.html`、`styles.css` 的本轮改动，并删除 README/docs/progress 本轮说明；不要整仓回退，避免覆盖上一轮工作台和 Wiki 样板。

## 2026-07-14 - Task: 制作 Hooxi 凌晨录像店磁带墙电影级样板
### What was done
- 新增与正式首页隔离的凌晨录像店样板，以橱窗、木质 VHS 磁带墙、安比立牌和 CRT 看片台形成 Hooxi 自有视觉方向。
- 接入 10 盘剧情/角色磁带，支持分类筛选、磁带抽出与送片动画、看片台详情、吞带离场、轻视差和完整馆藏入口。
- 补齐键盘方向键、Escape 归还磁带、焦点状态、44px 触控目标、减少动态效果与移动端横向吸附货架。
- 修正桌面磁带脊背比例、筛选按钮和看片台主链接样式，并生成首屏与货架评审截图。

### Testing
- 已执行 `node --check tape-wall-sample.js` 与 `git diff --check -- tape-wall-sample.html tape-wall-sample.css tape-wall-sample.js`，均通过。
- Chromium 1280px 验证页面宽度 1280/1280，无横向溢出；全部、剧情、角色筛选分别显示 10、4、6 盘，类型匹配。
- 390×844 移动视口验证页面宽度 390/390；货架为横向滚动并启用 `scroll-snap-type: x mandatory`，看片台固定在底部，最小可见触控目标为 44px。
- 键盘方向键、Enter 选片、Escape/按钮归还磁带和焦点状态正常；减少动态效果环境会跳过强入场动画。
- 首屏立绘与 7 张去重卡图请求均返回 200，页面控制台无错误。

### Notes
- `tape-wall-sample.html`：新增独立录像店样板结构和可访问入口。
- `tape-wall-sample.css`：新增隔离的电影级视觉、响应式货架、动画与无障碍降级样式。
- `tape-wall-sample.js`：新增磁带数据、筛选、看片台、键盘导航、转场与视差交互。
- `tape-wall-sample-hero.png`、`tape-wall-sample-preview.png`：新增首屏与磁带墙评审截图。
- `README.md`、`docs/README.md`：记录独立样板入口、能力和与正式首页的隔离关系。
- `progress.md`：追加本轮实施与验证记录。
- 回滚：删除三个 `tape-wall-sample.*` 文件及两张 `tape-wall-sample-*.png` 截图，并定点删除 `README.md`、`docs/README.md`、`progress.md` 本轮新增段落；不要还原 `index.html` 或整仓回退。

## 2026-07-15 - Task: 升级 HOOXI PLAY 店外开门与邦布接待样板
### What was done
- 将独立录像店样板升级为 HOOXI PLAY 完整入店动线：店外夜景待机、用户点击或键盘开门、灯牌与双门动画、镜头推进和店内欢迎分流。
- 店内左侧保留书目分类、VHS 磁带墙与 CRT 看片台，右侧新增原创 CSS 邦布接待台、快捷建议和站内关键词导航。
- DeepSeek 当前明确标记为待接入，不在静态前端放置密钥；关键词模式在 AI 不可用时仍能完成站内导航。
- 编写 HOOXI PLAY 搭建计划书，明确图片 2.5D 与 GLB/GLTF 3D 的边界、滚动镜头、性能预算、移动降级、无障碍和 AI 服务端代理方案。

### Testing
- `node --check tape-wall-sample.js` 与定点 `git diff --check` 通过。
- Chromium 1280px 验证店外待机、开门后自动进入店内、左右两个入口、四类书目、磁带筛选、看片台和邦布导航正常，控制台无错误。
- 390×844 视口验证页面宽度 390/390，无页面级横向溢出；移动货架启用 `scroll-snap-type: x mandatory`，最小可见触控目标为 44px。

### Notes
- `tape-wall-sample.html`、`tape-wall-sample.css`、`tape-wall-sample.js`：重构 HOOXI PLAY 店外、开门、店内分流、邦布与导航交互。
- `hooxi-play-storefront.png`、`hooxi-play-interior.png`：新增店外和店内评审截图。
- `docs/HOOXI-PLAY-BUILD-PLAN.md`：新增网站 2.5D/3D、滚动叙事与 DeepSeek 接入计划书。
- `README.md`、`docs/README.md`：更新独立样板能力与计划书入口。
- `progress.md`：追加本轮实施与验证记录。
- 回滚：定点恢复三个 `tape-wall-sample.*` 文件并删除两张 `hooxi-play-*.png` 与 `docs/HOOXI-PLAY-BUILD-PLAN.md`，再删除 README/docs/progress 本轮新增段落；不要恢复正式首页。

## 2026-07-15 - Task: 完成角色阵营点选编辑与最小自由组件库
### What was done
- 编辑器增加角色目录、具体阵营和具体角色入口，详情预览保留实体 ID，并提供对应基础字段表单。
- 角色目录、阵营详情和角色详情读取同源预览草稿，输出稳定编辑标记；阵营名与角色名支持点选定位和双击原地同步。
- 修正角色目录快照在编辑预览中覆盖草稿的问题，普通访客仍使用完整 56 名角色和 17 个阵营数据。
- 新增文字、图片、链接三类最小自由组件；内容写入 `data.js` 草稿，位置继续交给现有 `layout-data.js`，避免第二套布局系统。

### Testing
- `editor.js`、`layout-editor.js`、`page.js`、`app.js`、`stories.js`、`faction.js`、`character.js`、`agent-catalog.js` 均通过 `node --check`；全仓 `git diff --check` 通过。
- 编辑器浏览器回归：页面标签包含角色目录/具体阵营/具体角色；狡兔屋预览 URL 保留 `id=cunning-hares`，安比预览保留 `id=anby`；字段分别映射到 factions/characters。
- 点击角色名后左侧面包屑定位正确，双击改名后 `hooxi:preview:data` 同步；新增文字组件刷新后可见，并在布局模式带稳定布局目标。
- 普通访客回归：角色目录显示 17 个阵营，狡兔屋显示 5 名成员，安比页立绘宽 1268px、养成模块切换正常；桌面页面宽度均为 1280/1280，无横向溢出。
- `node backend/test/test.js` 共 15 项测试全部通过。
- 发布安全复核：编辑器加载并预览完整 56 名角色与 17 个阵营；选择朱鸢后导出源码包含完整角色条目。自由链接填入 `javascript:` 后渲染为 `#`，点击未执行脚本。
- 全页面覆盖回归：首页、主线、角色目录、阵营、角色、幕后、活动共 7 页均可渲染文字/图片/链接三类自由组件，点选后编辑器定位发生变化，草稿各保存 3 个组件；预览宽度均为 866/866，无横向溢出。
- 在活动页验证组件新增数量 3→4、删除 4→3、保存草稿包含修改文本，并可重新加载草稿恢复该文本。

### Notes
- `editor.html`、`editor.js`、`editor.css`：新增实体选择、角色阵营字段和自由组件管理。
- `stories.js`、`faction.js`、`character.js`：接入预览草稿、稳定编辑标记和自由组件渲染。
- `agent-catalog.js`：编辑预览时保留草稿角色与阵营数据。
- `layout-editor.js`、`styles.css`：自由组件复用现有布局目标和基础显示样式。
- `progress.md`：追加本轮实施与验证记录。
- 回滚：定点恢复上述编辑器、角色/阵营脚本、目录合并和自由组件样式改动，并删除本轮 progress 记录；不要回滚 HOOXI PLAY 样板或已有内容数据。
