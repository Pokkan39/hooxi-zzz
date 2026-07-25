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
- 右上角入口统一跳到独立的 `editor.html`，编辑页当时继续走已轮换的旧静态密码和本机草稿 / 导出 / Git 提交流程。
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

## 2026-07-14 - Task: 旧编辑密码增加本机五次锁十分钟
### What was done
- 当时给 `editor.html` 的已轮换旧密码增加了错误次数锁定：同一浏览器连续输错 5 次后锁 10 分钟。
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
- 线上点击右上角入口成功跳转 `editor.html`；输入 `已轮换的旧密码` 后登录面板隐藏、编辑面板显示。

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
- 本地静态服务 `python -m http.server 4173` 下验证：输入 `已轮换的旧密码` 后默认显示可视化表单，包含阵营、角色、主线剧情、角色故事、往期活动、幕后/对谈六组。
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
- 本地静态服务 `python -m http.server 4175` 下验证：输入 `已轮换的旧密码` 后进入工作台，左侧显示 6 个页面选择，右侧 iframe 默认加载主线预览。
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

## 2026-07-15 - Task: 编写 RandomPlay 模型转换与网站接入计划书
### What was done
- 基于用户提供的 192 MB RandomPlay PMX 压缩包，编写独立模型接入计划，覆盖隔离解压、授权决策、PMX 导入、Blender 场景清理、PBR 材质重建、GLB/KTX2 优化、六段 Scroll World 镜头、网页分层降级和发布审批。
- 将“研究原型”和“可公开发布版本”分为两条路径，明确原始 ZIP、PMX、FX、来源不明贴图和未授权 GLB 不进入公开 Git。
- 为每个里程碑定义输入、产物、验收标准、停止条件和回滚点；M0 完成前不安装工具、不执行模型转换、不修改网站。

### Testing
- 已只读核验原始 ZIP 为有效 Deflate 压缩包，SHA-256 为 `5e1e30188c3594279233d5239b30df7b2a569bd1d675cc9d1709d7ea1fc50164`。
- `unzip -t` 检查 643 项文件全部通过，无 CRC 错误；解压总规模为 207,808,527 字节。
- 已确认主模型为 11,011,415 字节的 `RandomPlay.pmx`，包含约 150 组主要 FX 材质、大量颜色/金属光滑度/法线 PNG 和 `mat/script.py`；未执行任何包内脚本。
- 已检查计划书包含资产基线、安全边界、授权决策、性能预算、测试矩阵、里程碑、Git 规则及下一步最小动作。

### Notes
- `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md`：新增 RandomPlay PMX 到 HOOXI PLAY/Scroll World 的完整转换与接入计划。
- `docs/README.md`：增加模型计划入口和公开仓库边界说明。
- `progress.md`：追加本轮文档与只读核验证据。
- 本轮未解压模型、未安装 Blender/FFmpeg、未运行 `mat/script.py`、未复制模型资产到仓库、未修改网站代码。
- 回滚：删除 `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md`，并定点删除 `docs/README.md` 与 `progress.md` 本轮新增段落；原始 ZIP 与网站无需处理。

## 2026-07-15 - Task: 执行 RandomPlay M0 资产安全审计
### What was done
- 在仓库外创建 `C:\Users\Rage\Documents\Hooxi-Model-Lab\random-play` 隔离区，复制原始 ZIP 后安全解压到独立目录，原下载文件保持不变。
- 生成 ZIP 哈希、CRC、完整文件清单、全部解压文件哈希、纹理清单、重复贴图清单、PMX 元数据、授权决策和 M0 审计报告。
- 将授权状态定为“仅限本地研究原型”；原始 ZIP、PMX、FX、贴图及未授权转换资产不进入公开 Git。

### Testing
- 下载目录源包与隔离副本 SHA-256 均为 `5e1e30188c3594279233d5239b30df7b2a569bd1d675cc9d1709d7ea1fc50164`；ZIP 643 项记录 CRC 全部通过。
- 实际解压 640 个文件、207,808,527 字节，全部位于隔离根目录内；危险路径、伪装 PE/ELF、嵌套 ZIP 均为 0。
- 文件类型为 176 个 FX、1 个 FXSUB、1 个 PMX、461 个 PNG、1 个 Python；未发现许可证、README 或可执行程序。
- 461 张 PNG 全部可解码，最大 2048×2048；发现 17 组共 41 个重复贴图，可供后续去重。
- PMX 文件头有效，版本 2.0、UTF-16 LE，模型名为 RandomPlay；`mat/script.py` 仅做静态只读审查，未执行。

### Notes
- 仓库外 `source/`：保存原始 ZIP 隔离副本。
- 仓库外 `extracted/`：保存 PMX、FX 与 PNG 的隔离解压副本。
- 仓库外 `audit/`：保存 M0 全部审计清单、哈希、元数据和授权结论。
- `progress.md`：追加本轮 M0 执行和验证证据；模型资产未复制到仓库。
- 本轮未安装 PMX 插件、未启动 Blender 导入、未运行包内脚本、未转换 GLB、未修改网站代码。
- 回滚：删除 `C:\Users\Rage\Documents\Hooxi-Model-Lab\random-play` 隔离目录，并定点删除 `progress.md` 本轮段落；下载目录原始 ZIP 和仓库其他文件无需处理。

## 2026-07-15 - Task: 执行 RandomPlay M1 Blender 首次导入诊断
### What was done
- 从 Blender Extensions 官方平台固定并校验 MMD Tools 4.5.13，完成源码静态审查后只在仓库外隔离配置中临时加载。
- 使用 Blender 5.2.0 LTS 离线导入 RandomPlay PMX，保存原始 `.blend`、结构/材质/资源统计和店外、门口、主厅、前台四张诊断图。
- 确认模型空间完整但主体为单一大网格；下一阶段优先制作预渲染镜头验证，不直接把原模型作为网页实时 GLB。

### Testing
- MMD Tools 发布包 SHA-256 为 `261cec171596c79fd204f39cc1227ffada3ced73626f27b5f915fd9dda619a69`，与 Blender 官方扩展平台记录一致；源码未发现网络、子进程、Shell 或模型脚本执行路径。
- Blender 在 `--factory-startup --disable-autoexec`、在线访问关闭、隔离用户目录下完成导入；模型包 `mat/script.py` 未加载，物理导入未启用。
- 导入主体为 228,139 顶点、192,817 三角面、176 材质槽、85 骨骼；150 个图片数据块全部指向隔离模型目录内现存文件，缺失/越界引用为 0。
- 原 PMX 导入前后 SHA-256 均为 `327a1e1e9441b6aae61635e8df5f918758f379f6da0268e453dc4aacda6044b5`。
- 四张最终诊断图均为 960×640 PNG，可完整解码、非空画面，且可识别店外入口、门口、主厅和接待前台；仓库状态确认没有 ZIP、PMX、贴图、`.blend` 或截图进入工作树。

### Notes
- 仓库外 `tools/`：保存固定插件、源码审查副本、离线依赖和可复现诊断脚本。
- 仓库外 `blender/00-import-raw.blend`：保存未经清理和优化的首次导入场景。
- 仓库外 `audit/m1-plugin-review.md`、`audit/blender-scene-report.md`、`audit/m1-*`：保存插件审查、场景统计、对象/材质/资源表和四张诊断图。
- `progress.md`：追加本轮 M1 结论和验证证据；网站代码与公开资产未修改。
- 计划基线为 Blender 5.1.2，但执行前 Steam 已原位升级为 5.2.0 LTS，本机没有独立 5.1.2；报告明确记录版本偏差，不把 5.2 结果冒充 5.1.2 验证。
- 回滚：删除仓库外 `random-play/tools`、`blender-user`、`blender`、`renders/m1`、`logs/m1-*` 与 `audit/m1-*`/四张截图，并定点删除 `progress.md` 本轮段落；保留 M0 的 `source/`、`extracted/` 和既有审计记录即可回到 M0 状态。

## 2026-07-15 - Task: 修复公开静态编辑密码泄露
### What was done
- 移除编辑器中的固定密码、本机失败计数和锁定逻辑，改为通过后端账号会话检查、账号密码登录和带 CSRF 的退出登录。
- 登录页改为输入服务端账号，未登录显示登录面板，已登录显示编辑器，后端不可用时显示明确错误。
- 更新维护说明，并将历史日志中的旧密码字面量替换为不含秘密的历史描述。

### Testing
- `node --check editor.js`：通过。
- `backend/npm test`：15 项认证、限流、Session、CSRF、Origin 与权限测试全部通过。
- `git diff --check`：通过，仅输出既有 LF/CRLF 换行符提示。
- 全仓文本搜索确认旧密码精确字符串为 0 处；静态检查确认编辑器不再包含固定密码、客户端失败计数或锁定逻辑。

### Notes
- `editor.js`：接入 `/api/auth/session`、`/api/auth/login`、`/api/auth/logout`，退出请求携带会话返回的 CSRF token。
- `editor.html`：增加可输入账号，更新服务端登录与退出文案，并刷新脚本缓存版本。
- `README.md`、`docs/README.md`：改为说明账号密码由 `EDITOR_ACCOUNTS_JSON` 在服务端配置，不记录示例秘密。
- `progress.md`：清除历史旧密码字面量并追加本轮实施、验证和回滚信息。
- 回滚：定点还原上述五个文件中本轮认证、文案和日志改动；不要整文件还原，以免覆盖工作区内既有未提交内容。

## 2026-07-15 - Task: 制作 HOOXI PLAY 第一段 Scroll World 动画原型
### What was done
- 基于仓库外 RandomPlay Blender 场景渲染 96 帧连续镜头，覆盖店外待机、入口推进、穿门、主厅和前台停靠。
- 新增与正式首页隔离的 Scroll World 研究原型，使用 Canvas 将滚动进度直接映射到帧序列，并同步驱动门叶、阶段标签、进度条和前台导航。
- 保留减少动态效果、帧服务失败、无 JavaScript 的普通导航降级；模型帧与源资产继续留在仓库外。

### Testing
- Blender 5.2.0 LTS 通过 `--disable-autoexec` 完成 96 帧渲染；Pillow 验证编号连续、全部可解码且尺寸均为 640×360。
- 浏览器验证 0%、25%、50%、75%、100% 滚动位置分别对应夜街、开门、穿门、主厅、前台；门叶进度由 0 变为 1，停止滚动状态不继续变化，向上滚动可逆。
- 默认帧服务请求返回 200/304，控制台无错误；1280px 视口页面宽度与滚动宽度一致，无水平溢出。
- 模拟帧服务断开与 `prefers-reduced-motion: reduce`，页面均显示普通导航且不阻塞访问；`?motion=1` 可在评审时显式覆盖减少动态偏好。
- `node --check scroll-world-prototype.js` 与三个原型文件的 `git diff --check` 均通过。

### Notes
- `scroll-world-prototype.html`：新增五阶段滚动叙事、Canvas、真实 DOM 文案、跳过入口和前台导航。
- `scroll-world-prototype.css`：新增固定舞台、门叶、阶段 HUD、响应式布局和减少动态降级。
- `scroll-world-prototype.js`：新增 96 帧按需缓存、滚动映射、Canvas cover 绘制、可逆状态和失败处理。
- `README.md`、`docs/README.md`：补充本地帧服务、`?motion=1` 评审方式和受限资产边界。
- 仓库外 `renders/scroll-world-m2/`：保存 96 帧、接触表、相机轨迹和验收摘要；未授权模型画面未进入 Git 工作树。
- 当前模型主体为单一大网格，无法真实旋转门体；本原型使用与滚动同步的 CSS 门叶表达开门，后续拆分门体后再替换为真实模型动画。
- 回滚：删除三个 `scroll-world-prototype.*` 文件，定点删除 `README.md`、`docs/README.md` 与 `progress.md` 本轮段落，并删除仓库外 `renders/scroll-world-m2/` 和对应渲染脚本/日志；不要回滚其他既有工作。

## 2026-07-15 - Task: 重做高清正门点击进店与左右分流样板
### What was done
- 将低清长距离滚动原型改为正门点击流程：首屏使用录像店黄色正门高清特写，用户点击后播放短促进店镜头，抵达店内后只显示左右二选一。
- 左侧“随便看看”连接录像带目录，右侧“问问邦布”连接 H-01 接待导航；两个入口均使用真实链接和键盘焦点。
- 在仓库外重新渲染 1920×1080 首屏/终点图和 48 帧 1280×720 进店镜头，受限模型画面没有进入 Git 工作树。

### Testing
- Blender 5.2 Eevee 通过 `--disable-autoexec` 完成高清渲染；Pillow 验证 48 帧编号连续、全部可解码且为 1280×720，首屏和终点图均为 1920×1080。
- 浏览器验证状态按 `outside → entering → choice` 转换：点击后 Canvas 播放约 2.4 秒并显示左右选择；48 帧请求全部返回 200。
- “随便看看”指向 `tape-wall-sample.html#catalog`，“问问邦布”指向 `tape-wall-sample.html#bangboo-desk`；页面控制台无错误，1280px 视口无水平溢出。
- `prefers-reduced-motion: reduce` 下点击直接进入选择；`?motion=1` 可强制评审完整动画；跳过按钮和帧服务失败均能进入可用选择页。
- `node --check scroll-world-prototype.js` 与定点 `git diff --check` 均通过。

### Notes
- `scroll-world-prototype.html`：改为高清正门、点击按钮、进店 Canvas 和左右分流结构。
- `scroll-world-prototype.css`：改为三状态全屏演出、游戏菜单式双卡和原创 CSS H-01 邦布。
- `scroll-world-prototype.js`：改为点击触发的 48 帧定时播放、按需预载、跳过和失败降级。
- `README.md`、`docs/README.md`：更新高清资源规格、8092 本地服务和评审方法。
- 仓库外 `renders/door-entry-hd/`：保存高清首屏、48 帧、终点图、接触表、相机轨迹和验证结果。
- 当前门体仍在单一大网格内，CSS 门叶只用于表达开门；后续完成门体拆分后再替换为真实模型门动画。
- 回滚：恢复三个 `scroll-world-prototype.*` 到上一版滚动原型，定点删除 README/docs/progress 本轮内容，并删除仓库外 `renders/door-entry-hd/` 及对应脚本/日志；不要回滚其他工作。

## 2026-07-15 - Task: 将录像店样板改为游戏式多阶段点击交互
### What was done
- 将店内左右选择从外链改为同页状态机：点击左侧进入分类货架和看片台，点击右侧进入 H-01 邦布接待；滚轮不再推进流程。
- 增加游戏式启动显影、门框准星、左右菜单扫描、分类/磁带错峰入场、磁带抽取翻面与反向放回、CRT 扫描、邦布升入/耳朵回弹/眨眼/回应动作。
- 建立可逆返回和焦点恢复：看片台返回原磁带，货架/邦布返回原路线；Escape 与可见返回按钮使用同一状态路径。

### Testing
- 浏览器完整验证 `boot → outside → entering → choice → browse → tape → browse → choice → concierge → choice`，所有状态由点击或键盘触发，滚动位置保持 0。
- 四类筛选、10 盘磁带数据、看片台详情、正式档案链接、邦布三个推荐问题和“安比”输入匹配均可用；控制台无脚本错误。
- 焦点链验证通过：正门、左右菜单、分类、看片台返回、原磁带和原路线均能正确恢复；重复点击磁带和放回期间不会排队触发动画。
- 减少动态效果下仍保留正门、左右路线、货架、磁带和邦布全部点击步骤；帧服务断开时仍可进入左右选择并完成邦布问路。
- 1280px 视口无水平溢出；`node --check scroll-world-prototype.js` 与定点 `git diff --check` 通过。

### Notes
- `scroll-world-prototype.html`：新增启动、货架、看片台和邦布接待四个同页舞台及无脚本正式导航。
- `scroll-world-prototype.css`：新增游戏 HUD、菜单扫描、磁带/CRT、邦布待机回应、反向转场和移动端布局。
- `scroll-world-prototype.js`：新增统一状态机、10 盘磁带筛选、WAAPI 飞片、确定性问路、输入保护、Escape 与焦点恢复。
- `README.md`、`docs/README.md`：更新为游戏式同页点击探索说明。
- 本轮未加载音效，预留视觉反馈即可；后续只有在提供授权音效并经用户点击后才启用声音。
- 回滚：恢复三个 `scroll-world-prototype.*` 到高清正门与左右外链版本，并定点删除 README/docs/progress 本轮段落；仓库外高清帧无需删除。

## 2026-07-15 - Task: 完成左右书柜浏览闭环与可选场景适配
### What was done
- 将浏览路线改为左右书柜空间总览：左柜承载主线/活动，右柜承载角色/幕后，选择后进入固定柜内聚焦。
- 建立总览、柜内、抽带展示和原位归还的可逆闭环，并让 Escape、返回按钮和键盘焦点按层级恢复。
- 新增可选 Hybrid 场景适配器；只有本地 manifest、许可明确的 GLB、Three.js CDN 和 WebGL 全部可用时增强背景，否则无阻塞使用 DOM/CSS fallback。
- 保留店外进门流程与 H-01 邦布，所有柜体、分类和磁带热点继续使用真实按钮，并遵守减少动态效果偏好。

### Testing
- `node --check scroll-world-prototype.js` 与 `node --check scroll-world-scene-adapter.js` 均通过。
- 已执行本轮定点 `git diff --check`；已跟踪文档和日志无补丁格式错误，未跟踪原型文件另以 `git diff --no-index --check /dev/null <file>` 检查通过，仅有 Git 的 LF/CRLF 提示。
- 浏览器实测完成“进门 → 随便看看 → 左柜 → 抽取第一盘录像 → 放回 → Escape 返回总览”；归位后状态为 `cabinet`、焦点恢复到 `story-launch`，再按 Escape 状态为 `browse`。控制台只有本地静态服务缺少 `favicon.ico` 的 404，与业务无关。
- Blender 5.2 无界面诊断成功，但原网格被拆成 30,521 个无语义连通块；源数据和参考图不足以唯一确认目标左柜及 4 件物品，因此没有猜测生成 GLB。诊断产物保存在仓库外 `audit/rp-semantic`，原 PMX 与 `00-import-raw.blend` 哈希保持不变。
- 用户确认目标为 hall-north 画面最左侧贴墙多层柜后，Blender 已重新拆出正确柜体及中层 4 件物品；校准图人工复核不含蓝色带轮展示架。最终 Blend/GLB 均为 10 个网格、270 三角面，GLB 28,648 字节，GLB SHA-256 为 `a1690c1b8d9bfad20f5161526cdf4dfaa9aad6ac9a350e04185d0888ca1e234f`，回读验证通过。
- Hybrid 适配器现仅在显式 `?assets=<带 CORS 的本地资产根>` 时启用，读取仓库外 `rp-scene-manifest.json` 与 `rp-zone-shelf-l.glb`，隐藏 `HIT_*`，使用 `CAM_shelf_L_focus`，并驱动 `INT_shelf_L_item_001..004` 到展示锚点及归位；左柜其余条目和整个右柜继续使用 DOM fallback。当前自动化浏览器禁用 WebGL，实测正确降级到 fallback；manifest 与 GLB 均成功通过 HTTP 200/CORS 请求，真实 GPU 渲染仍需在可用 WebGL 的浏览器中目视验收。
- Blender 诊断文件：仓库外 `tools/scripts/rp_semantic_diagnose.py` 与 `rp_component_maps.py` 负责可复现几何诊断；`audit/rp-semantic/*` 和 `renders/rp-semantic/component-maps/*` 保存结果，不进入公开 Git。

### Notes
- `scroll-world-prototype.html`：新增左右柜总览、固定柜内舞台、场景模式状态和适配器加载。
- `scroll-world-prototype.css`：新增书柜透视空间、柜体热点、Hybrid 画布和移动端/减少动态效果样式。
- `scroll-world-prototype.js`：扩展浏览状态机、左右柜分类约束、抽带归位与 Escape/焦点恢复。
- `scroll-world-scene-adapter.js`：新增 manifest 探测、Three.js 动态导入、GLB 装饰层和失败降级。
- `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md`、`docs/README.md`：记录 Hybrid/Fallback 接口、授权边界和使用方式。
- `progress.md`：追加本轮实施、验证入口和回滚方式。
- 回滚：删除 `scroll-world-scene-adapter.js`，定点恢复三个 `scroll-world-prototype.*` 的本轮书柜改动，并删除两份 docs 与本段日志新增内容；不要整文件还原，以免覆盖已有未提交修改。

## 2026-07-15 - Task: 设计并制作录像店模型真实交互空间
### What was done
- 将仓库外研究 GLB 接入独立录像店样板的 Hybrid 场景层，支持真实左柜总览、柜内聚焦、看片台展示和物件归位动作。
- 将 GLB 真实物件命中映射到现有四盘左柜录像，保留右柜和所有无模型环境的 DOM/CSS fallback；未复制或公开受限模型资产。
- 修正 Hybrid 画布显示、层级和点击穿透，使模型视觉与现有分类、详情、返回流程并存。

### Testing
- `node --check scroll-world-scene-adapter.js` 通过。
- `node --check scroll-world-prototype.js` 通过。
- 本轮 `git diff --check` 通过；Git 仅提示未跟踪原型文件的 LF/CRLF 转换，不是格式错误。
- 浏览器已验证进门、分流、总览和 DOM fallback 流程；自动化浏览器当前未启用 WebGL，且外置研究资产服务未提供 CORS，因此真实 GLB 渲染与射线点击尚缺可视化证据。

### Notes
- `scroll-world-scene-adapter.js`：新增真实模型相机姿态、物件动作、射线点击和 fallback 适配。
- `scroll-world-prototype.js`：桥接 Hybrid 场景点击、柜体状态、磁带展示和返回总览。
- `scroll-world-prototype.css`：调整 Hybrid canvas 层级、显示条件和 DOM 覆盖关系。
- `progress.md`：追加本轮实现、验证和回滚点。
- 回滚：删除本轮新增的 `scroll-world-scene-adapter.js`，并定点恢复上述 `scroll-world-prototype.js`、`scroll-world-prototype.css`、`progress.md` 的本轮段落；不要使用整仓库回滚。

## 2026-07-15 - Task: 将用户自建左柜模型接入同源公开样板
### What was done
- 按用户明确声明“该 3D 模型由用户自建并拥有上传权”，将指定的左柜 GLB 与 manifest 复制到 `assets/scroll-world/`；未复制 PMX、FX、贴图、Blend、原始压缩包或其他研究文件。
- 将 Hybrid 适配器默认资源根改为同源目录，访客不再需要 `?assets=` 参数或额外 CORS 模型服务。
- 真实模型模式下隐藏蓝色左柜 DOM 占位框；Three.js/WebGL 失败时仍保留 DOM/CSS fallback，并更新样板文档与模型接入计划的发布边界说明。

### Testing
- `node --check scroll-world-scene-adapter.js && node --check scroll-world-prototype.js` 通过。
- 定点 `git diff --check` 通过；Git 仅提示既有文件的 LF/CRLF 转换。
- 同源浏览器验证请求 `assets/scroll-world/rp-scene-manifest.json` 返回 200，Three.js 与 GLTFLoader 均成功加载；当前自动化浏览器禁用 WebGL，故自动降级到 fallback，真实 GPU 画面仍需普通启用 WebGL 的浏览器目视确认。
- GLB 哈希保持 `a1690c1b8d9bfad20f5161526cdf4dfaa9aad6ac9a350e04185d0888ca1e234f`，大小 28,648 字节；manifest 大小 5,073 字节。

### Notes
- `assets/scroll-world/rp-zone-shelf-l.glb`：新增用户指定的左柜 GLB。
- `assets/scroll-world/rp-scene-manifest.json`：新增同源场景 manifest。
- `scroll-world-scene-adapter.js`：无参数时默认从同源资产目录读取 manifest。
- `scroll-world-prototype.js`：将 Hybrid 状态文案改为 HOOXI GLB。
- `scroll-world-prototype.css`：真实 Hybrid 成功时隐藏左柜蓝色占位框。
- `scroll-world-prototype.html`：刷新样板资源缓存版本。
- `README.md`、`docs/README.md`、`docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md`：记录用户上传权声明、同源加载方式和资产边界。
- `progress.md`：追加本轮实施、验证和回滚点。
- 回滚：删除 `assets/scroll-world/`，并定点恢复上述样板、文档和日志改动；不要回滚其他现有工作区文件。

## 2026-07-15 - Task: 确认模板后扩展到正式网站
### What was done
- 检查正式站入口与 Pages 发布边界，确认正式页面没有引用 `scroll-world-prototype.html`，当前真实 3D 只存在于独立样板。
- 未将未完成的右柜模型或左柜 Spike 强行覆盖首页、主线、角色、活动或幕后页面；保持正式站零回归。

### Testing
- 已检索正式 HTML，未发现正式页面引用 Scroll World 模板。
- 已检查 Pages workflow 以仓库根目录静态发布，说明一旦把资产/入口挂入正式页面就会直接面向访客。
- 由于右柜 3D 模板仍被阻塞，无法满足“先确认完整模板再扩展正式网站”的前置条件，因此未做正式站代码改动。

### Notes
- `spec://tasks.json`：将本任务标记为 `blocked`，阻塞原因是右柜模板没有可信校准资产。
- `progress.md`：追加本轮检查、阻塞证据和回滚点。
- 正式页面文件：本轮未修改。
- 回滚：删除本轮新增的 progress 段落，并将 `spec://tasks.json` 本任务恢复为 `doing`；不回滚既有模板或正式站文件。

## 2026-07-15 - Task: 将真实左柜 GLB 设为样板主视觉
### What was done
- 将样板中的真实 GLB Canvas 从隐藏装饰层提升为店内浏览、左柜聚焦和看片阶段的主视觉层。
- 增加真实 3D 场景徽标、明确的 fallback 状态和基础灯光；不伪造不存在的右柜或完整店铺模型。
- 保留 DOM/CSS 降级路径，并保留左柜四个真实物件的命中、抽取和归位逻辑。

### Testing
- `node --check scroll-world-prototype.js` 与 `node --check scroll-world-scene-adapter.js` 通过。
- `git diff --check -- scroll-world-prototype.html scroll-world-prototype.css scroll-world-prototype.js scroll-world-scene-adapter.js` 通过。
- 本地浏览器成功请求同源 GLB 适配器脚本并尝试创建 Three.js WebGL 场景，但当前自动化浏览器禁用 WebGL，控制台明确报告 `Could not create a WebGL context`，因此真实 3D Canvas 可视化、四物件射线命中和截图验收暂缺；页面已明确显示 fallback，不将降级画面冒充 3D 通过。

### Notes
- `scroll-world-prototype.html`：新增真实 3D 场景容器、徽标并刷新资源版本。
- `scroll-world-prototype.css`：将 GLB Canvas 设为店内主视觉，调整 DOM 覆盖关系和 fallback 视觉。
- `scroll-world-scene-adapter.js`：增加场景灯光、manifest/GLB 结果信息和明确 fallback 原因。
- `scroll-world-prototype.js`：显示真实 GLB/fallback 状态和加载失败原因。
- `progress.md`：追加本轮实施、验证证据和回滚点。
- 回滚：恢复上述四个样板文件至本轮修改前内容，并定点删除本段日志；保留 `assets/scroll-world/` 左柜 GLB 与 manifest，不恢复右柜任务。

## 2026-07-15 - Task: 实现录像店游戏式进入、待机与左右书架探索交互
### What was done
- 将样板入口改为同源可运行资源：店外与店内背景使用现有成品图，未指定外部帧服务时不再请求不存在的 poster、choice 和 frame 文件。
- 保留点击大门进入店内的转场，并增加店内循环光照待机效果；左右书架支持悬停缩放、提示“随便看看”和点击进入区域。
- 书架内录像带支持独立悬停抬升、放大、发光和点击进入看片台，左柜分类与返回流程继续可用。

### Testing
- 浏览器验证：`outside → choice → browse → cabinet` 状态链路可由点击完成。
- 浏览器验证：左书架悬停时 `transform` 为 `scale(1.025)` 并显示 `随便看看 →`；左柜录像带悬停时 `transform` 为 `scale(1.06)` 并产生发光阴影。
- `node --check scroll-world-prototype.js` 与 `node --check scroll-world-scene-adapter.js` 通过。
- 定点 `git diff --check` 通过；真实 GLB 仍保留为可选增强层，当前浏览器 WebGL 禁用不影响 DOM/CSS 游戏式交互验收。

### Notes
- `scroll-world-prototype.html`：改用仓库内现有成品图作为默认入口资源并刷新资源版本。
- `scroll-world-prototype.css`：新增店内待机光照、书架选中提示、书架物件悬停放大与发光反馈。
- `scroll-world-prototype.js`：仅在显式指定 `frames` 时加载外部进门帧，默认入口避免资源 404。
- `progress.md`：追加本轮交互实现、验证证据和回滚点。
- 回滚：恢复上述三个样板文件至本轮修改前内容，并定点删除本段日志；保留真实 GLB、manifest 与既有预览图。

## 2026-07-15 - Task: 导出并接入完整 RandomPlay 录像店 3D 场景
### What was done
- 从仓库外 `00-import-raw.blend` 的 `RandomPlay_mesh` 实际导出完整录像店网页 GLB，保留原场景材质与内嵌图片，只选择店铺网格和总览/左柜相机，不带默认 Cube、骨架、灯光或 Blend/PMX/ZIP 源文件。
- 将完整店内场景设为 browse 待机与左右书柜总览主视觉；左柜进入时继续按既有局部 GLB 提供真实物件点击、抽取和归位，右柜没有可信语义节点时保持完整店内总览背景并使用现有 DOM 交互，不伪造模型节点。
- 将完整场景和左柜局部资产拆成独立加载源；局部 manifest 或节点缺失只关闭左柜 3D 增强，不再使完整场景整体 fallback。

### Testing
- Blender 5.2.0 LTS 使用 `--disable-autoexec` 成功导出 `rp-store-complete.glb`；文件大小 8,694,324 字节，SHA-256 为 `4c890edd97d1f52bd7ef931d9d3ec261188bb0f062058ca2773f95af3ec4a57c`。
- `node --check scroll-world-prototype.js` 与 `node --check scroll-world-scene-adapter.js` 通过；定点 `git diff --check` 通过，仅有既有 LF/CRLF 提示。
- 本地 HTTP 服务逐项请求 HTML、JS、CSS、完整场景 manifest/GLB、左柜 manifest/GLB，8 项均返回 200；完整 GLB 下载字节数与磁盘大小一致，未产生重复 404。
- 当前执行环境未提供可用的浏览器 WebGL 可视化验证入口，因此完整场景 GPU 渲染、相机画面和射线点击仍需在启用 WebGL 的普通浏览器中目视验收；资源导出、同源请求和代码接入已完成。

### Notes
- 仓库外 `tools/scripts/rp_export_store_web.py`：新增最小可复现 Blender 导出脚本，创建总览和左柜相机并只导出必要对象。
- `assets/scroll-world/rp-store-complete.glb`：新增完整录像店网页场景。
- `assets/scroll-world/rp-store-complete-manifest.json`：新增完整场景、相机和可选左柜交互资产关系。
- `scroll-world-scene-adapter.js`：改为完整场景主加载、左柜局部可选加载和右柜真实总览降级。
- `scroll-world-prototype.html`、`scroll-world-prototype.js`、`scroll-world-prototype.css`：更新完整场景文案、browse 进入动作、双柜热点覆盖和缓存版本。
- `progress.md`：追加本轮导出、接入、验证和缺口记录。
- 回滚：删除完整场景 GLB/manifest 与仓库外导出脚本，定点恢复四个样板文件的本轮改动并删除本段日志；保留既有左柜 GLB、manifest 和用户其他工作区改动。

## 2026-07-15 - Task: 修复 Edge 进店后真实 3D 场景不可见
### What was done
- 修复 3D 场景仅在 browse/cabinet/tape 状态显示、进店后的 choice 待机阶段被 CSS 隐藏的问题；现在点击大门进入店内后即可直接看到完整录像店 GLB。
- 默认未指定外部进门帧服务时不再预载 `frame-*.jpg`，消除无意义的 404 请求。

### Testing
- 在可见 Chromium/Edge 同类浏览器中确认 WebGL 可用，完整场景和左柜 GLB 请求均返回 200，页面状态为 `sceneMode=hybrid`。
- 点击大门后状态为 `choice`，3D 容器 `visibility=visible`、`opacity=1`，并生成 `complete-3d-edge-check.png` 实际画面证据。
- 控制台新页面加载不再产生默认帧 404；历史控制台旧消息已清除。

### Notes
- `scroll-world-prototype.css`：允许 choice 待机阶段显示完整 3D 场景。
- `scroll-world-prototype.js`：仅在显式传入 `frames` 参数时预载进门帧。
- `scroll-world-prototype.html`：刷新 CSS/JS 缓存版本。
- `complete-3d-edge-check.png`：记录 Edge 同类可见浏览器中的真实 3D 画面。
- `progress.md`：追加根因、验证证据和回滚点。
- 回滚：恢复上述三个样板文件的本轮改动，删除验收截图并定点删除本段日志；保留完整场景 GLB 与 manifest。

## 2026-07-15 - Task: 修复完整场景贴图与默认进店动画
### What was done
- 将 150 个带有效图像的 MMD 材质最小转换为 glTF 可识别的 Principled Base Color 贴图链路，保留原 UV；无图像屏幕材质保留基础色并增加适度自发光。
- 重新导出完整录像店 GLB，并将 poster、choice 和 48 帧进店动画集中放入同源 `assets/scroll-world/door-entry/`。
- 默认启用 48 帧进店动画并保留 `?frames=` 覆盖能力，移除无参数时跳过动画的条件，刷新脚本缓存版本。

### Testing
- Blender 静态抽样确认原 MMD 材质仅通过自定义 Group 输出，虽有图像节点但没有 glTF 可识别的 Principled 路径；转换后导出统计为 150 个带贴图材质。
- GLB 二进制 JSON chunk 解析确认文件为 60,028,928 字节，SHA-256 `924e4cd197d4d5a9d006d9902c736530333b96c8e9d1851a36070a7b522e6f05`，含 148 images、150 textures、150 个 Base Color 贴图材质。
- 可见 Edge 验证点击后 350ms 状态仍为 `entering`，48 个帧请求全部返回 200，最终进入 `browse`；场景模式为 `hybrid` 且显示完整 GLB 徽标。
- `node --check scroll-world-prototype.js`、`node --check scroll-world-scene-adapter.js` 与 `git diff --check` 通过。

### Notes
- 仓库外 `tools/scripts/rp_export_store_web.py`：导出前最小转换 MMD 材质并保留无图像屏幕显示。
- `assets/scroll-world/rp-store-complete.glb`：覆盖为内嵌有效图片和纹理的新完整场景。
- `assets/scroll-world/door-entry/`：新增 poster、choice 与 48 张连续进店帧。
- `scroll-world-prototype.js`：默认同源动画目录并默认播放完整帧序列。
- `scroll-world-prototype.html`：脚本缓存版本递增到 9。
- `docs/README.md`：记录默认动画目录与 `?frames=` 覆盖方式。
- `progress.md`：追加本轮修复、验证和回滚点。
- 回滚：恢复仓库外导出脚本、旧 GLB、两个前端文件和文档，删除 `assets/scroll-world/door-entry/` 与本段日志；不要回滚其他现有工作区改动。
- 补充可视化验收：可见 Edge 中再次完成 `outside → entering → choice`，控制台无错误，动画帧请求返回 200，并生成 `complete-3d-textured-edge.png`；截图可见墙面、设备、纸箱、屏幕和店内构件贴图，不再是统一单色几何体。

## 2026-07-15 - Task: 完成滚动驱动 3D 录像店体验
### What was done
- 将正门点击或滚轮设为入场起点，48 帧镜头改为由滚轮双向控制，显示当前帧与进度，取消 1.1 秒自动播放并仅在末帧进入店内。
- 完整录像店 GLB 保持持续待机渲染，增加细微镜头漂移与灯光呼吸；左右柜 hover/focus 均驱动真实完整场景镜头轻推，点击仍沿用现有柜内与录像带流程。
- 左柜继续使用局部交互模型完成真实物件命中、抽取和归位；右柜明确只使用完整场景镜头推移及 DOM 交互，不宣称存在右柜交互模型。
- 保留键盘焦点、ARIA 入场进度、跳过入口、WebGL fallback 与 reduced-motion 直接入店降级。

### Testing
- `node --check scroll-world-prototype.js`：通过。
- `node --check scroll-world-scene-adapter.js`：通过。
- `git diff --check`：通过；仅输出工作区既有 LF/CRLF 转换提示，无补丁格式错误。
- 可见 Chromium 浏览器使用 `?motion=1` 实测：一次向下滚动从第 1 帧推进到第 4 帧，反向滚动退回第 2 帧；连续推进后进入 `choice`，场景模式为 `hybrid`。
- 浏览器继续验证 `choice → browse → 左柜 cabinet → 点击录像带 → tape`，左柜显示 3 盘当前分类录像，看片台进入 `is-ready` 并显示正确标题。
- 控制台仅有本地静态服务缺少 `favicon.ico` 的 404，与本轮业务流程无关；未发现脚本或 WebGL 错误。

### Notes
- `scroll-world-prototype.html`：新增入场 progressbar、滚轮引导并刷新资源缓存版本。
- `scroll-world-prototype.css`：新增逐帧进度 UI、由进度驱动的门叶效果，并让右柜阶段保留完整 GLB 场景。
- `scroll-world-prototype.js`：改为可逆滚轮帧控制，接入左右柜 hover/focus 场景预览，保留录像带点击链路。
- `scroll-world-scene-adapter.js`：新增持续渲染、镜头/灯光待机动画及左右柜完整场景轻推；右柜能力标记为无交互模型。
- `docs/README.md`：更新滚动入场、真实 GLB 待机和右柜能力边界。
- `progress.md`：追加本轮实施、验证证据和回滚点。
- 回滚：定点恢复上述四个原型文件与 `docs/README.md` 的本轮改动，并删除本段日志；不要整仓回退或删除既有 GLB/帧资产。

## 2026-07-15 - Task: 重构真实长页滚动叙事
### What was done
- 解锁原生 body 纵向滚动，以 sticky 100dvh 舞台和约 9 屏轨道实现 Gate、Entry、Reveal、Choice、Explore 五段叙事。
- 将 48 帧 Entry、CSS 视觉变量和完整 GLB 相机统一改为 scrollY + requestAnimationFrame 连续双向映射，滚动事件不再拦截默认行为或排队补间。
- 保留完整 GLB、左柜真实物件交互、录像带抽取归位、fallback、Escape、移动端与减少动态效果路径。

### Testing
- 已执行 `node --check scroll-world-prototype.js` 与 `node --check scroll-world-scene-adapter.js`，均通过。
- 已执行 `git diff --check -- scroll-world-prototype.html scroll-world-prototype.css scroll-world-prototype.js scroll-world-scene-adapter.js docs/README.md progress.md`，通过；仅有 Git 的 LF/CRLF 换行提示。
- 本轮未获得浏览器自动化入口，因此未把真实 WebGL 画面或滚动阶段目视检查声明为已验证。

### Notes
- `scroll-world-prototype.html`：新增五段长页轨道标记，更新滚动引导和资源缓存版本。
- `scroll-world-prototype.css`：解锁 body 滚动，建立 sticky 舞台、约 9 屏轨道、连续阶段视觉和 reduced-motion 压缩轨道。
- `scroll-world-prototype.js`：移除 wheel/preventDefault 推进，改为 scrollY + rAF 连续映射帧、CSS 和场景进度。
- `scroll-world-scene-adapter.js`：新增无补间的 `setScrollProgress` 连续相机 API，并为 fallback 提供同名空实现。
- `docs/README.md`：更新五段滚动模型、移动/reduced-motion 行为和适配器接口说明。
- `progress.md`：追加本轮实施、验证证据与回滚点。
- 回滚：定点恢复上述五个实现/文档文件并删除本段日志；不要整文件还原 `progress.md`，也不要删除既有 GLB 或帧资产。
- 浏览器补充验证：原生滚动可从 Gate 依次到 Entry、Reveal、Choice、Explore，并可反向回到 Entry 第 29 帧和 Gate 第 1 帧；`choice → browse → 左柜 cabinet → tape → Escape` 交互闭环通过，控制台无脚本错误。
- 审查后补强：滚动镜头仅在叙事状态更新，避免覆盖柜体/录像带交互镜头；Reveal 控件在可见前设为 inert；resize 会重算进度；live region 仅在阶段变化时播报；无 JavaScript 时 boot 遮罩不再挡住 noscript 导航。
- 当前自动化浏览器命中 WebGL fallback，故本轮未把真实 GLB 画面声明为目视通过；完整 GLB 与清单均能从同源服务正常响应。

## 2026-07-16 - Task: 修复录像店蓝框与实时渲染质感
### What was done
- 让真实 GLB 从 Entry 阶段开始显示，并让 48 帧平面入场画面在门体近景前淡出，移除屏幕中央巨大蓝黑门框。
- 为完整店铺与左柜交互模型启用 ACES 色调映射、软阴影、暖色主光和冷色轮廓光，同时保留原始 PBR 材质与贴图。
- 保持五段原生滚动、左右书柜路线、左柜录像带抽取/归位及 fallback 行为不变。

### Testing
- 可见 Chromium 在 `hybrid` 模式确认 `rp-store-complete.glb` 返回 200，控制台无错误；Entry 末段帧序列透明度为 0、3D 舞台透明度为 1，中央蓝框不再出现。
- 正向与反向遍历 Gate、Entry、Reveal、Choice、Explore，阶段均能恢复；GLB 在 Entry 后持续可见。
- 浏览器验证 `choice → browse → 右柜 → 返回 → 左柜 → tape → 返回/Escape`，左右路线、3 盘录像和录像带归位均正常。
- `node --check scroll-world-prototype.js`、`node --check scroll-world-scene-adapter.js` 与 `git diff --check` 通过；仅有工作区既有 LF/CRLF 提示。

### Notes
- `scroll-world-prototype.css`：让 hybrid 3D 在 Entry 显示，并限制平面帧序列只覆盖入场前段。
- `scroll-world-prototype.html`：刷新 CSS、原型脚本与场景适配器缓存版本。
- `scroll-world-scene-adapter.js`：增加色调映射、曝光、三点式灯光、软阴影与克制的粗糙度下限。
- `docs/README.md`：记录 GLB 提前接管和实时渲染行为。
- `progress.md`：追加本轮实施、验证证据与回滚点。
- 回滚：定点恢复上述三个原型文件和 `docs/README.md` 对应段落，并删除本段日志；不要整仓回退或删除既有 GLB、贴图和入场帧资产。

## 2026-07-16 - Task: 制作 Active Theory 风格独立 WebGL 复刻模板
### What was done
- 新增与正式站完全隔离的沉浸式作品集样板，以原生 WebGL 程序化 shader 实现暗场虹彩玻璃雕塑、鼠标视差和滚动响应，不复制参考站运行时或品牌资产。
- 在同一路由提供 Glass Monolith、Orbital Index、Editorial Signal 三种结构明显不同的构图，并支持 URL/底部切换器、键盘切换、项目详情覆盖层和移动端降级。
- 使用现有本地角色卡面作为临时项目视觉，保留集中配置入口，便于后续按评审结果替换文案、色彩和内容。

### Testing
- `node --check active-theory-sample.js` 与目标文件 `git diff --check` 均通过。
- Playwright Chromium 使用 SwiftShader WebGL 参数验证 WebGL2 顶点/片元 shader `2/2` 编译成功、程序链接成功、`glError = 0`，页面未显示 fallback，控制台和页面错误均为 0。
- glass、orbit、editorial 三种 URL 与面板/切换器状态一致；50% 滚动切换到项目 02，详情打开、焦点约束、Escape 关闭和焦点恢复均通过。
- 390×844 视口下三种变体均为 `scrollWidth = clientWidth = 390`；Editorial 三张项目条完整位于视口内，3 张本地 WebP 均返回 200，无空图片或失败资源请求。
- 补充保留真实 WebGL 桌面评审图；无 GPU 的默认 headless Chromium 可能丢失 WebGL context，此时会按设计显示静态虹彩 fallback。

### Notes
- `active-theory-sample.html`：新增独立原型页面骨架、三种变体面板、切换器和项目详情对话框。
- `active-theory-sample.css`：新增全屏暗场、三套差异化布局、响应式、焦点和 reduced-motion 样式。
- `active-theory-sample.js`：新增集中配置、原生 WebGL shader、滚动/鼠标驱动、变体切换和详情交互。
- `artifacts/active-theory-glass.png`：保留 Glass Monolith 桌面评审图。
- `artifacts/active-theory-orbit.png`：保留 Orbital Index 桌面评审图。
- `artifacts/active-theory-editorial.png`：保留无 GPU 环境下的 Editorial fallback 对照图。
- `artifacts/active-theory-editorial-webgl.png`：保留启用 SwiftShader 后的 Editorial 真实 WebGL 评审图。
- `progress.md`：追加本轮实施、验证证据和回滚点。
- 回滚：删除三个 `active-theory-sample.*` 文件和四张 `artifacts/active-theory-*.png` 评审图，并定点删除本段日志；不要修改正式首页、模块一或其他既有工作区改动。

## 2026-07-16 - Task: 用真实 GLB 与 CSS 卡片复刻 Active Theory 样板
### What was done
- 保留既有暗场全屏、极简 HUD、三变体排版和滚动叙事，将程序化 SDF 形体替换为真实 `rp-zone-shelf-l.glb`。
- 单次加载轻量 GLB 后缓存三套构图：Glass 展示左柜整体，Orbit 环形展示三个 `INT_*` 物件，Editorial 随当前项目切换物件近景；未加载 57MB 完整店铺。
- 强化三套 CSS 卡片的纵深、指针倾斜、媒体显影、悬停/焦点抬升，并补充移动端、横屏矮视口与 reduced-motion 行为。

### Testing
- Playwright Chromium 使用 SwiftShader 参数验证 `modelState=ready`、fallback 隐藏，Three.js、GLTFLoader 与 `rp-zone-shelf-l.glb` 均返回 200；轻量 GLB 仅请求 1 次。
- 1280×900 下 Glass、Orbit、Editorial 的 URL、面板与切换器状态一致，三张真实模型评审图均已生成；Canvas 非暗像素比例约 19.61%，不是空白画面。
- 滚动可切换到项目 02；CSS 卡片 computed transform 生效，hover/focus 后抬升变量变化；项目详情打开、Escape 关闭和焦点恢复通过。
- 390×844 下三变体均无横向溢出；844×390 下九张卡均与视口相交，其中 Editorial 后两张在极矮横屏仍有约 9px/37px 右侧裁切，第三张底部约 24px 裁切，作为当前样板已知限制保留。
- `prefers-reduced-motion: reduce` 下间隔 700ms 的两次 Canvas SHA-256 均为 `b56dbb16e7fbd9bd10bef3a9160a3562fd158569c11d7190f8023d39365fc37d`，画面保持静止，同时变体和项目切换仍可用。
- 浏览器回归 console errors、page errors、failed requests 均为 0；`node --check active-theory-sample.js` 与目标文件 `git diff --check` 通过。

### Notes
- `active-theory-sample.js`：用 Three.js/GLTFLoader 单次加载真实 GLB，增加模型归一化、三构图缓存、PBR 虹彩材质、资源释放和 reduced-motion 接线。
- `active-theory-sample.css`：增强三套 CSS 卡片的空间运动、焦点反馈和横竖屏响应式规则。
- `artifacts/active-theory-glb-glass.png`：新增真实左柜 Glass 构图评审图。
- `artifacts/active-theory-glb-orbit.png`：新增三个真实物件 Orbit 构图评审图。
- `artifacts/active-theory-glb-editorial.png`：新增真实项目物件 Editorial 构图评审图。
- `progress.md`：追加本轮多 Agent 实施、验证证据、已知限制和回滚点。
- 回滚：定点恢复 `active-theory-sample.js` 与 `active-theory-sample.css` 到上一版程序化 shader/CSS 状态，删除三张 `artifacts/active-theory-glb-*.png`，并定点删除本段日志；不要删除共享的 `assets/scroll-world/rp-zone-shelf-l.glb` 或其他既有工作区改动。

## 2026-07-16 - Task: 编写网站定位与详细实施计划书
### What was done
- 将网站正式定位收敛为“Hooxi 的《绝区零》剧情视频档案与角色关系导航站”，明确 HOOXI PLAY 是用户主动进入的可选沉浸层，普通档案承担稳定检索、分享和内容阅读。
- 形成 1100 余行正式计划书，覆盖目标用户、用户路径、双层产品结构、内容边界、视觉与建模、技术架构、数据编辑、AI 接待、八阶段路线、验收指标、风险和责任分工。
- 明确根地址默认显示轻量 DOM 落地页、稳定详情 URL 与无 JavaScript 基线、完整资产授权门禁、可复现性能测试口径，以及当前人工 Git 发布与未来审核 API 的独立边界。

### Testing
- 独立首轮审稿识别默认入口、现状/目标能力、授权范围、性能口径和发布路线 5 项阻断；逐项修正后，第二轮独立复核确认全部通过，无剩余阻断。
- 文档结构检查确认包含 20 个一级编号章节和阶段 0–8 的 9 个三级阶段标题，阶段标题未与“分阶段实施路线”章节同级。
- `docs/README.md` 已包含可解析的相对链接 `HOOXI-WEBSITE-POSITIONING-PLAN.md`。
- `git diff --check -- docs/README.md progress.md` 无 whitespace error，仅有既有 LF/CRLF 提示；新计划书的行尾搜索只命中文档元数据中 4 行有意使用的 Markdown 双空格换行。

### Notes
- `docs/HOOXI-WEBSITE-POSITIONING-PLAN.md`：新增网站定位、范围边界、建模素材规范、技术路线和分阶段验收计划书。
- `docs/README.md`：增加正式定位计划书入口，并声明后续相关施工以该文件为范围基线。
- `progress.md`：追加本轮文档交付、独立审稿、验证证据和回滚方式。
- 回滚：删除 `docs/HOOXI-WEBSITE-POSITIONING-PLAN.md`，定点删除 `docs/README.md` 的“网站定位与正式规划”段落和本段进度记录；不要整文件还原，以免覆盖其他既有文档改动。

## 2026-07-16 - Task: 重写网站定位、效果、功能与进度总计划书 V2
### What was done
- 将上一版定位稿重写为 V2 总计划，统一说明最终想要的视觉效果、网站定位、公开功能、HOOXI PLAY 体验、编辑与 AI、建模素材、技术架构、施工顺序和正式验收。
- 新增“已完成 / 原型完成 / 部分完成 / 未完成”状态矩阵，明确正式内容站、角色资料、编辑器、滚动叙事、完整店铺 GLB、左柜交互和 Active Theory 样板的真实完成度。
- 将模块一当前问题写入主计划：真实 55% 滚动总览仍为 RED，记录中央遮挡的像素指标、候选原因、后续诊断步骤和 GREEN 验收标准，避免继续沿用无效的入口态验收结论。

### Testing
- 文档规模为 1294 行，包含目标效果、定位、功能、当前完成度、进行中模块、建模与素材、技术架构、无障碍、14 个施工阶段、优先级、验收、风险、责任和下一步。
- Markdown 标题层级已规范：18 个一级编号章节使用二级标题，编号子章节使用三级标题；未发现二级编号子章节或三级一级章节残留。
- 关键内容检查确认存在“进入录像店 / 直接浏览档案”双入口、原型与正式状态、`verdict=RED`、性能预算和授权门禁。
- `docs/README.md` 继续通过相对链接指向同一路径；行尾搜索只命中文档元数据中 4 行有意使用的 Markdown 双空格换行。

### Notes
- `docs/HOOXI-WEBSITE-POSITIONING-PLAN.md`：完整重写为 V2 网站定位、目标效果、功能、现状和实施总计划。
- `progress.md`：追加 V2 改写范围、结构检查、事实状态和回滚点。
- 回滚点：本轮改写前的 V1 全文保留在本会话上一条 `Write` 工具调用记录；需要回滚时，用该记录内容覆盖 `docs/HOOXI-WEBSITE-POSITIONING-PLAN.md`，并定点删除本段日志，不要整文件还原其他文档。

## 2026-07-16 - Task: 建立绝区零录像店参考素材接收清单
### What was done
- 新建参考素材接收目录，明确店外正门、店内总览、左右书柜、前台/CRT/邦布区域截图，以及进门和店内环绕视频的最低收集要求。
- 写入素材命名规则、视频拍摄建议和当前阻塞状态，方便后续用户直接把截图或视频放入同一目录。

### Testing
- 已检查项目内现有根目录截图、`assets/scroll-world/` 资源和 `F:/web` 参考站资源；现有内容主要是原型验收图、左柜 GLB、入场帧和参考站资产，不足以替代游戏内录像店参考。
- 已确认 `reference-materials/README.md` 存在并包含必需截图、推荐视频和当前状态三类信息。

### Notes
- `reference-materials/README.md`：新增素材接收清单和命名规则。
- `progress.md`：追加本轮清单建立、检查结果和阻塞说明。
- `spec://tasks.json`：将素材收集任务标记为 blocked，等待用户补充实际截图或视频。
- 回滚：删除 `reference-materials/README.md` 和空目录，并定点删除本段 progress 记录；无需修改网站代码。

## 2026-07-16 - Task: 制作 HOOXI 信号启动与 2.5D 店外视觉样板

### What was done
建立隔离的 THROWAWAY 原型 `prototype/hooxi-rebuild/`，实现物理开关从信号启动进入店外展示：包含三种设备变体（A/B/C 通过 `?variant=` URL 参数选择）、世界观信号序列与 CRT 连续推镜、全屏分层店外视觉、邦布响应与重新连接路线、移动端/reduced-motion/键盘焦点处理；未接入正式站、content 隔离在 prototype 目录。

### Testing
- `node --check prototype/hooxi-rebuild/app.js` 通过。
- 1280×900 视口真实浏览器验证：通过物理开关进入 `body-storefront`，storefront 的 `hidden` 属性正确切换；点击橱窗后邦布过渡到 `bonbu-beckoning`；点击重新连接回到 `body-standby`、storefront 隐藏、active shell 的 `inert` 为 false。
- `?variant=A`、`?variant=B`、`?variant=C` 均成功打开并生成快照。
- 网络请求验证：HTML、CSS、JS、poster 图片均返回 200/304；修复透明 storefront 拦截和 SVGElement.className 属性报错后，控制台无页面脚本错误（favicon 404 不影响功能）。

### Notes
- `prototype/hooxi-rebuild/index.html`：新增 THROWAWAY 原型入口、信号启动 UI、世界观序列和店外展示。
- `prototype/hooxi-rebuild/styles.css`：新增分层店外布局、邦布动画和响应式样式。
- `prototype/hooxi-rebuild/app.js`：新增物理开关状态机、信号序列、CRT 镜头、邦布交互和 reduced-motion 处理。
- `README.md`：新增 `prototype/hooxi-rebuild/index.html` 样板列表条目。
- `progress.md`：追加本轮实施、验证证据和回滚信息。
- `artifacts/hooxi-demo-a-standby.png`、`artifacts/hooxi-demo-a-storefront.png`、`artifacts/hooxi-demo-v2-a-standby.png`、`artifacts/hooxi-demo-v2-a-storefront.png`、`artifacts/hooxi-demo-v2-b-standby.png`、`artifacts/hooxi-demo-v2-c-standby.png`：保留验收快照。
- 回滚方式：删除 `prototype/hooxi-rebuild/` 目录，删除上述六张 artifacts 快照，定点移除 `README.md` 中新增的 HOOXI rebuild 样板条目和本段 progress 日志；不要整文件还原。

## 2026-07-16 - Task: 归档并整理游戏内 Random Play 录像店 3D 模型

### What was done
复制原始 ZIP 到独立 archive 目录、保持原结构完整解压到 extracted、创建 inventory.txt 记录资源身份和 SHA-256、同步更新模型接入文档本地源架构部分；未改动正式首页、HOOXI PLAY 样板或现有网页内容。

### Testing
- ZIP 完整性通过 `unzip -t`，CRC 无错。
- SHA-256 验证：`5e1e30188c3594279233d5239b30df7b2a569bd1d675cc9d1709d7ea1fc50164`。
- 文件清单：640 个文件、207,808,527 字节。
- RandomPlay.pmx 检查：11,011,415 字节、PMX magic `PMX ` 有效。
- 目录结构验证：`mat/` 原 150+ `.fx`、`tex2/` 及 `tex3/` 完整、`material_common_2.0.fxsub` 和顶层 176 个 FX 效果均存在。

### Notes
- `reference-materials/3d-models/random-play/archive/`：保存原始 ZIP 副本和完整性报告。
- `reference-materials/3d-models/random-play/extracted/`：解压后保持完整目录结构，PMX、材质、纹理和效果文件。
- `reference-materials/3d-models/random-play/inventory.txt`：记录 SHA-256、文件总数、大小、来源声明和只读说明。
- `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md`：在第 2 节"已核验资产基线"中增加 2.2 小节"本地源模型归档"，明确源资产位置、内容、大小和授权边界。
- `progress.md`：追加本轮日志。
- 回滚：删除 `reference-materials/3d-models/random-play/` 目录（含 archive、extracted、inventory.txt），定点删除 `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md` 中 2.2 节内容，删除本段进度记录；不整文件还原。

## 2026-07-16 - Task: 归档并分析游戏内 Random Play 录像店参考视频

### What was done
复制用户提供的游戏内录像店 MP4 到 `reference-materials/videos/random-play/archive/`，使用 OpenCV 读取视频参数，生成 5 秒间隔参考帧、全视频联系表、1 秒视觉变化检测和四段高变化区间密集抽帧；创建 `inventory.txt` 记录视频来源、哈希、抽帧目录和分析限制，并同步更新 RandomPlay 模型接入计划中的本地参考视频归档说明。未修改正式网站、原型页面或原始视频内容。

### Testing
- 原视频复制后 SHA-256 为 `418ce68476e311e3a61118294ca89dc4a72db5c3dab64e0ec80feff8755923b4`，大小 416,611,212 字节。
- OpenCV 成功打开视频并读取参数：1920×1080、约 60 FPS、12,190 帧、约 203.17 秒。
- 生成 41 张 5 秒间隔帧和 `analysis/contact-sheets/contact-5s.jpg`。
- 生成 `analysis/shot-diff-1s.json`，定位 26–38 秒、90–93 秒、108–112 秒、155–173 秒等高变化候选区间。
- 生成四段密集抽帧联系表：`entry-motion`、`mid-transition-a`、`mid-transition-b`、`late-route`。

### Notes
- `reference-materials/videos/random-play/archive/`：保存原始 MP4 副本。
- `reference-materials/videos/random-play/inventory.txt`：记录视频参数、抽帧结构、工作标签和分析限制。
- `reference-materials/videos/random-play/analysis/frames-5s/`：保存 41 张 5 秒间隔参考帧。
- `reference-materials/videos/random-play/analysis/contact-sheets/`：保存全视频联系表和帧索引 JSON。
- `reference-materials/videos/random-play/analysis/shot-diff-1s.json`：保存 1 秒视觉变化检测数据。
- `reference-materials/videos/random-play/analysis/dense-segments/`：保存入口、中段和后段路线的密集抽帧与联系表。
- `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md`：新增本地参考视频归档小节，明确用途与限制。
- `progress.md`：追加本轮视频归档、抽帧和验证记录。
- 回滚：删除 `reference-materials/videos/random-play/` 目录，定点删除 `docs/RANDOMPLAY-MODEL-INTEGRATION-PLAN.md` 中本地参考视频归档小节，并删除本段 progress 记录；不整文件还原。

## 2026-07-17 - Task: 修复 HOOXI demo 开屏入口与 Tap to Play
### What was done
- 将 `prototype/hooxi-rebuild/` 首屏改为游戏式 HOOXI 开屏动画，显示 `SIGNAL BOOT / HOOXI / TAP TO PLAY`。
- 将 `TAP TO PLAY` 直接绑定到现有连接状态机，点击全屏开屏即可触发 CRT 连接序列并进入店外，不再要求先找设备下方开关。
- 同步更新样板说明和开屏验收图，避免后续评审打开旧入口说明。

### Testing
- `node --check prototype/hooxi-rebuild/app.js` 通过。
- 目标文件尾随空白检查通过；跟踪文档文件的 `git diff --check` 通过，仅有既有 LF/CRLF 提示。
- 本地服务 `http://127.0.0.1:8766/prototype/hooxi-rebuild/?variant=A` 返回 200。
- 浏览器验证首屏存在 `HOOXI` 与 `TAP TO PLAY`，焦点在 `#boot-splash`；点击后最终进入 `body-storefront`，开屏隐藏，`#storefront.visible` 为 true，焦点落到 `#store-door`。

### Notes
- `prototype/hooxi-rebuild/index.html`：新增全屏 `boot-splash` 开屏按钮并刷新 CSS 缓存版本。
- `prototype/hooxi-rebuild/styles.css`：新增 HOOXI 字样显影、扫描线、`TAP TO PLAY` 闪烁和开屏退场动效。
- `prototype/hooxi-rebuild/app.js`：新增开屏点击/键盘入口，复用现有 `doConnect()` 状态机。
- `README.md`、`docs/README.md`：记录打开 demo 后点击 `TAP TO PLAY` 即可进入流程。
- `artifacts/hooxi-demo-boot-splash.png`：新增开屏验收截图。
- `progress.md`：追加本轮实现、验证和回滚点。
- 回滚：定点删除上述三个原型文件中的 `boot-splash`、开屏样式和 `startFromSplash`/`dismissBootSplash` 绑定，恢复 `index.html` 的 CSS 版本参数，删除 `artifacts/hooxi-demo-boot-splash.png`，并删除 README/docs/progress 本轮新增内容；不要整仓回退。

## 2026-07-17 - Task: 将 HOOXI 纠正为独立游戏厂商闪屏
### What was done
- 废弃“HOOXI 与 TAP TO PLAY 同屏”的加载式入口，将 HOOXI 改为不可点击、自动播放和自动退场的独立厂商 Logo 闪屏。
- 将 `TAP TO PLAY` 移到后续独立游戏标题页 `SIGNAL LINK / CRT-03`；只有标题页点击或键盘确认才会触发原有连接与进场状态机。
- 为减少动态效果环境保留至少 1.4 秒静态 HOOXI 厂商屏，普通环境播放约 3.35 秒闪烁/白闪/退场动画；删除旧错误验收图并生成两张分屏验收图。

### Testing
- `node --check prototype/hooxi-rebuild/app.js` 通过；本地 demo 地址返回 200。
- 浏览器精确定时验证：500ms 时 `#publisher-splash` 可见，标题页仍为 hidden/disabled；减少动态效果环境 1.8s 时厂商屏已退场，标题页显示并启用。
- 浏览器点击标题页后最终进入 `body-storefront`；标题页隐藏、店外场景可见，焦点落到 `#store-door`。
- 目标文件尾随空白检查通过。

### Notes
- `prototype/hooxi-rebuild/index.html`：拆分独立 `publisher-splash` 和 `title-screen`，刷新 CSS/JS 缓存版本。
- `prototype/hooxi-rebuild/styles.css`：新增纯厂商 Logo 闪屏、白闪退场和独立游戏标题页样式；补 reduced-motion 厂商屏保留规则。
- `prototype/hooxi-rebuild/app.js`：移除 `boot-layer` 逻辑，改为厂商屏自动退场后显示标题页，标题页点击再调用 `doConnect()`。
- `README.md`、`docs/README.md`：将入口说明改为“厂商闪屏自动退场 → 标题页 TAP TO PLAY”。
- `artifacts/hooxi-demo-publisher-splash.png`：新增只显示 HOOXI 的厂商闪屏验收图。
- `artifacts/hooxi-demo-title-screen.png`：新增独立标题页验收图。
- `artifacts/hooxi-demo-boot-splash.png`：删除已废弃的 HOOXI+TAP 同屏错误验收图。
- `progress.md`：追加本轮纠正、验证和回滚点。
- 回滚：恢复 `prototype/hooxi-rebuild/` 三个文件到上一版同屏开屏，删除两张新验收图并恢复旧截图，再定点删除 README/docs/progress 本轮新增内容；不要整仓回退。

## 2026-07-17 - Task: 放慢 HOOXI 厂商动画并重做标题页质感
### What was done
- 将 HOOXI 厂商动画从短促硬闪改为约 3.2 秒的连续淡入、停留和淡出，并将厂商层与标题页交叉过渡时间延长到约 1.05 秒。
- 删除高亮白闪、阶梯抖动、红蓝错位和黄色胶囊按钮；标题页改为叠在真实 CRT 设备场景上，`TAP TO PLAY` 改为无按钮底色的游戏式呼吸文字。
- 增加 `?motion=1` 完整动效评审开关；文档明确该页面仍是 2.5D 视觉原型，不代表游戏级成品。

### Testing
- `node --check prototype/hooxi-rebuild/app.js` 通过；目标原型文件尾随空白检查通过；完整动效地址返回 200。
- 完整动效定时验证：500ms 时 Logo 透明度约 0.30 且仍在模糊淡入；1.7s 时透明度为 1 并完整停留；3.0s 时透明度约 0.06 并淡出；3.8s 时厂商层透明度约 0.23、标题页透明度为 1；4.6s 时厂商层隐藏。
- 浏览器点击新版标题页后正常进入 `body-storefront`，店外场景可见，焦点落到 `#store-door`。
- 更新后的厂商闪屏和标题页截图均已生成并可解码。

### Notes
- `prototype/hooxi-rebuild/index.html`：新增完整动效评审标记，刷新 CSS/JS 缓存版本。
- `prototype/hooxi-rebuild/styles.css`：重写厂商 Logo 的连续淡入淡出、柔和光晕和标题页场景叠层；移除网页式黄色按钮视觉。
- `prototype/hooxi-rebuild/app.js`：延长厂商层和标题页退场时长，并支持 `?motion=1` 绕过系统减少动态效果用于评审。
- `README.md`、`docs/README.md`：补充慢淡入淡出、场景叠层、完整动效地址和原型完成度说明。
- `artifacts/hooxi-demo-publisher-splash.png`、`artifacts/hooxi-demo-title-screen.png`：覆盖为新版视觉验收图。
- `progress.md`：追加本轮实现、精确定时验证和完成度边界。
- 当前整体页面仍是 CSS/DOM 原型，与此前讨论的游戏级成片视觉仍有明显差距；本轮不把开场修正冒充全页面完成。
- 回滚：恢复上述三个原型文件到上一版动画，定点恢复 README/docs 本轮说明，使用上一版两张验收图覆盖当前截图，并删除本段 progress；不要整仓回退。

## 2026-07-17 - Task: 生成 0.5 秒复核素材与机器候选清单
### What was done
- 按 shot-diff 峰值选取 6 个互不重叠的关键窗口，生成 0.5 秒抽帧素材、每段联系表和机器候选清单。
- 输出了源视频 SHA、窗口范围、帧数与选择理由；未做图像理解，未回读图片。

### Testing
- 使用 OpenCV 逐窗抽帧并写出 JPG 成功；生成的联系表与抽帧文件均落在目标目录。
- 未对图片内容进行人工/模型读取；仅记录文件生成结果与元数据。

### Notes
- `reference-materials/videos/random-play/analysis/dense-2s-review/`：新增 6 个关键窗口的抽帧素材与联系表。
- `reference-materials/videos/random-play/analysis/scene-review-2s.json`：新增机器候选清单，`machine_candidates=true`，人工结论留空。
- `progress.md`：追加本轮生成与验证记录。
- 回滚：删除本次新增的 `dense-2s-review` 目录、`scene-review-2s.json` 和 `progress.md` 末尾本轮追加段落；不要触碰既有分析文件。

## 2026-07-17 - Task: 完成 Random Play 全片复核、Blender 导入与 HOOXI PLAY Phase 1 重建
### What was done
- 人工查看 5 张 2 秒联系表全部 102 格，并复核 6 个 0.5 秒关键窗口；记录全片连续场景、运动、UI/转场和网页素材候选区间。
- 使用 Steam Blender 5.2.0 导入游戏场景 GLB 与房间 FBX，保存两份可继续编辑的 Blend；FBX 回读为 99 个网格、46 张图像，并生成测试渲染。
- 将旧 A/B/C 重复设备原型重建为单状态机：`publisher → title → connecting → storefront → window-selected → door-entry → interior`；删除滚动驱动、实时 3D、永久循环和鼠标视差，保留按钮、热点、Escape 与分层返回。
- 接入店铺连接和进门两段 H.264 MP4、店外/门口/店内海报；视频仅在用户点击后设置 `src` 与播放，减少动态效果时不请求 MP4，直接使用海报切换。
- 更新 README 与 `docs/README.md`，使 Demo 入口、交互顺序、`?motion=1` 和性能边界与当前实现一致。

### Testing
- Blender 5.2.0 LTS 无界面验证通过；`01-game-model-import.blend`、`02-room-fbx-import.blend` 可保存，房间导入验证为 99 meshes / 46 images，测试图可解码。
- 桌面浏览器完整通过 `title → connecting 视频 → storefront → window-selected → door-entry → door 视频 → interior`；两段 MP4 均 GET 200，控制台 0 错误，最终焦点为 `continue-button`，水平溢出和滚动均为 0。
- 390×844 CDP 移动端 + `prefers-reduced-motion: reduce` 通过：全流程不请求 MP4、无横向溢出、两个店内按钮均在视口内且高度约 45.5px；返回链为 `door-entry → window-selected → storefront → title`，焦点恢复到 `connect-button`。
- `node --check prototype/hooxi-rebuild/app.js`、`scene-review-2s.json` 解析、3 张海报解码、两段视频首尾帧解码与关键页面/媒体 HTTP 200 检查通过。
- 静态非视频资源预算约 1.72 MB；两段点击后延迟加载视频合计约 6.84 MB（4 秒 960×540 与 2 秒 1280×720，均为 24 FPS H.264）。

### Notes
- `prototype/hooxi-rebuild/index.html`：重建七状态游戏式单页结构并接入最终媒体路径。
- `prototype/hooxi-rebuild/styles.css`：建立无页面滚动的全屏场景、可见热点、移动端触控目标和 reduced-motion 样式。
- `prototype/hooxi-rebuild/app.js`：实现防重入状态机、点击后视频加载、错误/超时回落、Escape 与焦点恢复。
- `assets/hooxi-rebuild/`：新增连接成片、进门成片和三张最终海报。
- `reference-materials/videos/random-play/analysis/scene-review-2s.json`：新增 5 张/102 格全片人工结论、6 个密集窗口结论和推荐素材区间。
- `README.md`、`docs/README.md`：更新 HOOXI PLAY 重建 Demo 的实际入口和行为说明。
- `progress.md`：追加本轮实现、验证和回滚点。
- 仓库外 `F:\hooxi-asset-lab\blends\`、`audit\`、`renders\`：保存 Blender 导入文件、验证 JSON、测试图和成片源文件；因已有可直接导入的 GLB/FBX，本轮不需要安装 PMX/MMD 插件。
- 回滚：定点恢复 `prototype/hooxi-rebuild/` 三文件与 README/docs 本轮段落，删除 `assets/hooxi-rebuild/`，移除 `scene-review-2s.json` 的 `coarse_full_review`/人工结论字段和本段日志；仓库外产物可按需删除，不要整仓回退。

## 2026-07-17 - Task: 重做 HOOXI PLAY 游戏级视觉层
### What was done
- 在不改七状态流程的前提下推倒重做视觉层：厂商屏改为柔和电影式显影，标题页使用全屏场景、倾斜粗体字标和无卡片式连接提示，店外、门廊和店内统一使用色彩分级、暗角、场景编号、角标热点与斜切操作控件。
- 保留键盘焦点、Escape、返回链和移动端触控目标；橱窗确认后会同步更新可见标签，店内“继续探索”会显示明确的未开放提示并禁用按钮。
- 修复重复进场时重新赋值视频源造成的 `ERR_ABORTED`：取消转场时清理旧监听，已加载视频在同一会话内直接复用并从头播放；增加 data favicon，消除页面 404。
- 更新 Demo 文档说明，并生成标题、店外、门廊和店内四张视觉验收图。

### Testing
- `node --check prototype/hooxi-rebuild/app.js` 通过，三个原型文件尾随空白检查通过。
- 1280×900 桌面端连续完整运行两遍 `title → storefront → window-selected → door-entry → interior`；第二遍两段视频均复用至 `readyState=4`，`requestfailed`、HTTP 4xx/5xx、Console error 和 Page error 均为 0。
- Escape 与页面返回按钮均通过 `interior → door-entry → window-selected → storefront → title` 返回链；“继续探索”点击后可见文案、按钮禁用和 live status 均正确。
- 390×844 移动端完整流程通过，所有状态 `scrollWidth=clientWidth=390`，无页面溢出；最小按钮高度 44px，店内两个按钮完整位于视口内。
- `prefers-reduced-motion: reduce` 下完整流程不请求两段 MP4，资源失败、控制台错误和页面错误均为 0。
- 本地站点已运行于 `http://127.0.0.1:8766/prototype/hooxi-rebuild/?motion=1` 并在可见 Chromium 窗口打开。

### Notes
- `prototype/hooxi-rebuild/index.html`：刷新视觉层缓存版本，补充连接按钮可访问名称、店内状态文案锚点和 data favicon。
- `prototype/hooxi-rebuild/styles.css`：完整重写厂商屏、标题、转场、场景字幕、热点、按钮、移动端和 reduced-motion 视觉。
- `prototype/hooxi-rebuild/app.js`：延长厂商屏节奏，增加热点/店内可见反馈，并复用已加载视频与清理转场监听。
- `docs/README.md`：补充当前视觉语言、重复进场视频复用和未开放状态说明。
- `artifacts/hooxi-premium-title.png`、`artifacts/hooxi-premium-storefront.png`、`artifacts/hooxi-premium-door-entry.png`、`artifacts/hooxi-premium-interior.png`：新增四张桌面视觉验收图。
- `progress.md`：追加本轮实现、验证证据和回滚点。
- 回滚：定点恢复 `prototype/hooxi-rebuild/index.html`、`styles.css`、`app.js` 与 `docs/README.md` 本轮改动，删除四张 `hooxi-premium-*.png` 验收图并删除本段日志；不要整仓或整文件回退其他既有改动。

## 2026-07-18 - Task: 核验首屏切片字体合规
### What was done
- 确认 `cinematic-slice` 首屏切片没有继续引用 NB Architekt、NBArchitektStd 或 Architekt 字体。
- 将切片字体口径固定为 Google Fonts 的 Space Grotesk 与 Space Mono，用于替代 NB Architekt 的建筑感标题和 HUD 等宽文字；两者上游均提供 OFL 许可证，可用于当前粉丝非商用同人站切片。

### Testing
- `cinematic-slice.*` 中搜索 `NBArchitekt|NB Architekt|NBArchitektStd|Architekt`：0 处命中。
- `cinematic-slice.html` 与 `cinematic-slice.css` 中确认仅使用 `Space Grotesk`、`Space Mono`、系统中文字体和等宽 fallback。
- 官方来源核验：Google Fonts 仓库中 `ofl/spacegrotesk/OFL.txt` 与 `ofl/spacemono/OFL.txt` 均为 SIL Open Font License 文本。
- 已执行 `git diff --check -- cinematic-slice.html cinematic-slice.css cinematic-slice.js progress.md`，仅有既有 LF/CRLF 提示，无 whitespace error。

### Notes
- `cinematic-slice.html`：本轮未改动；现有 Google Fonts 链接已使用 Space Grotesk 与 Space Mono。
- `cinematic-slice.css`：本轮未改动；现有字体栈已使用 Space Grotesk 与 Space Mono。
- `progress.md`：追加本轮字体合规核验记录。
- `spec://tasks.json`：将字体合规保护任务标记为完成。
- 回滚：定点删除本段 progress 记录，并将 `spec://tasks.json` 中字体合规任务恢复为 `todo`；切片代码无需回滚。

## 2026-07-18 - Task: 补齐上下文遗漏登记与新起点整理
### What was done
- 复查本轮上下文后确认两个遗漏：`cinematic-slice.html` 没有写入 README/docs 样板入口；用户要求的 F 盘新起点文件夹也尚未落地。
- 已将 Active Theory 氛围首屏切片登记到根 README 和 `docs/README.md`，明确它是隔离验证稿，不替换正式首页。
- 已在 `F:/hooxi-new-start/README.md` 整理本轮重新开始的方向、参考目标、已落地切片、字体合规、遗漏和下一步。

### Testing
- 已检查 `spec://tasks.json`：原切片四项任务均为 done，新增遗漏补齐任务正在收尾。
- 已检索 `README.md` 与 `docs/README.md`，此前没有 `cinematic-slice` 入口；本轮已补入。
- 已创建并写入 `F:/hooxi-new-start/README.md`。

### Notes
- `README.md`：新增 `cinematic-slice.html` 独立视觉样板入口。
- `docs/README.md`：新增 Active Theory 氛围首屏切片说明。
- `F:/hooxi-new-start/README.md`：新增本轮对话的新起点整理文件。
- `progress.md`：追加本轮遗漏修复、验证和回滚点。
- `spec://tasks.json`：新增并收尾上下文遗漏补齐任务。
- 回滚：删除 `F:/hooxi-new-start/`，定点删除 README/docs 中 `cinematic-slice.html` 说明和本段 progress 记录，并从 `spec://tasks.json` 删除遗漏补齐任务；不要回滚切片代码。

## 2026-07-18 - Task: 补看 Nanfu 参考站首屏
### What was done
- 重新打开用户补充的 `https://www.nanfu.global/`，本次已成功读取首页首屏、DOM 和网络资源信息。
- 保存首页首屏参考截图，用于后续比较“黑底巨物产品特写 + 胶囊导航 + 强 CTA”的视觉结构。
- 更新 `F:/hooxi-new-start/README.md`，把 Nanfu 从“尚未成功访问”改为“已看首页首屏，尚未全站深拆”。

### Testing
- 浏览器成功打开 `https://www.nanfu.global/`，页面标题为 `NANFU Group | Leading Battery Manufacturer & Power Solutions Provider`。
- 首页首屏截图已保存为 `artifacts/nanfu-reference-home.png`。
- 网络记录确认首页 HTML、CSS、JS、Logo、首屏 WebM/MP4 和首屏帧序列资源均有成功响应；部分后续帧仍处于 pending，未作为完整全站分析依据。

### Notes
- `artifacts/nanfu-reference-home.png`：新增 Nanfu 首页首屏参考截图。
- `F:/hooxi-new-start/README.md`：更新 Nanfu 参考站状态和可借鉴点。
- `progress.md`：追加本轮补看参考站记录。
- `spec://tasks.json`：新增并收尾 Nanfu 参考站补看任务。
- 回滚：删除 `artifacts/nanfu-reference-home.png`，定点恢复 `F:/hooxi-new-start/README.md` 的 Nanfu 两处状态说明，删除本段 progress 记录，并从 `spec://tasks.json` 删除 Nanfu 任务。

## 2026-07-18 - Task: 制作多个技术方向 demo 用于讨论首页方向
### What was done
- 将首页技术方向对照合集扩展为 5 个方向：巨物首屏、帧序列滚动、信号控制台、点击驱动视频、性能/移动降级。
- 为帧序列补齐进入段落后台预热（48/48）、滚动 scrub 可见性，以及 reduced-motion 下的按钮步进兜底。
- 为点击进店视频补齐用户手势后加载、自然播完落终帧、失败/减动效直达终帧；增加 `?motion=1` 供人工完整动效评审。
- 用浏览器截图与脚本验收五向可讨论性，并刷新 `artifacts/tech-demo-*.png`。

### Testing
- 静态服务 `http://127.0.0.1:8777/tech-direction-demos.html` 返回 200；资源版本 `v=6`。
- Playwright/`motion=1` 验收：
  - matrix 卡片数 = 5
  - giant 视频 `readyState=4` 且可播放
  - scrub 中段 `FRAME 20 / 47`，帧缓存 `48/48`，步进条在完整动效下隐藏，画面非全黑
  - console 切换到 `event` 频道文案正确
  - click 自然播放约 2.8s 后进入店内静帧（`endOn=true`）
  - degrade 高/低模式可切换
  - `prefers-reduced-motion: reduce` 下 scrub 步进条显示，click 直接终帧
- 截图亮度抽查：`tech-demo-02-scrub.png` 均值约 [73,68,55]；`tech-demo-04-clickvid-end.png` 均值约 [44,41,36]，均非全黑素材问题。
- 备注：对该 mp4 强制 seek 近片尾时，浏览器/解码会回落到片头附近，属素材/容器 seek 特性；产品路径依赖自然播完 + watchdog/轮询，已验证可用。

### Notes
- `tech-direction-demos.html`：五向导航/矩阵文案与资源版本 `v=6`。
- `tech-direction-demos.css`：scrub 步进 `[hidden]` 强制隐藏，避免被 flex 规则顶掉。
- `tech-direction-demos.js`：帧预加载、`?motion=1`、click 结束检测（ended/timeupdate/poll/watchdog）与 reset 清理。
- `README.md` / `docs/README.md`：已有五向对照说明（本轮以验收与交互收口为主）。
- `artifacts/tech-demo-00-matrix.png` 等：刷新五向与关键交互截图。
- `progress.md`：追加本轮记录。
- `spec://tasks.json`：将“制作多个技术方向 demo 用于讨论首页方向”标为 done。
- 回滚：恢复 `tech-direction-demos.html/.css/.js` 本轮改动与 `?v=6`，删除/回退对应 artifacts 截图与本段 progress；不回滚正式首页。

## 2026-07-18 - Task: 补看 F:/web Active Theory 本地镜像并回填可借鉴点
### What was done
- 确认用户指出的遗漏参考：`F:/web` 是 Active Theory 官网完整本地下载（含 `server.py` / `assets` / `cms`），此前新起点里有目录说明，但本轮五向 demo 未真正打开细看。
- 本地启动镜像并实机打开首页与 Work：记录纯黑进站、中心发光 Logo 巨物、顶右胶囊导航、粒子场、Work 三维卡墙与左侧品类筛选。
- 保存参考截图到 `artifacts/at-web-*.png`，并把“学结构不学引擎”的映射写回 `F:/hooxi-new-start/README.md`（对应五向 demo）。

### Testing
- `python F:/web/server.py` 在占用端口后落到 `http://127.0.0.1:8083/`，首页与 `app.*.js` 返回 200。
- Playwright 打开首页/Work 成功：WebGL canvas 1 块；可读导航文案含 Work/Contact、品类筛选与项目名（如 Racer）。
- 截图已生成：`at-web-home-0s.png`（近纯黑）、`at-web-home-8s.png` / `at-web-home-move.png`（中心装置）、`at-web-work.png`（卡墙）。
- 同步核了对用户粘贴的加载环、Logo 首屏、Work 卡墙三帧，与本地截图一致。

### Notes
- `F:/hooxi-new-start/README.md`：把 `F:/web` 从“目录级备注”升级为“已实机打开 + 可借鉴结构 + 五向映射 + 不抄引擎/字体/Logo”。
- `artifacts/at-web-home-0s.png`、`at-web-home-8s.png`、`at-web-home-move.png`、`at-web-work.png`：新增 AT 本地镜像参考截图。
- `progress.md`：追加本轮补看记录。
- `spec://tasks.json`：补看任务收尾为 done。
- 回滚：删除上述 4 张 at-web 截图，恢复 `F:/hooxi-new-start/README.md` 参考目标/下一步两段，删除本段 progress；不回滚五向 demo 代码。

## 2026-07-19 - Task: 角色+阵营档案主链路灌入真实数据并可浏览
### What was done
- 从本地 `website-archives/zzz-wiki` 生成的代理人 enrichment 正式挂入站点数据层：角色印象、个人剧情摘要、图集与来源链接进入 `archiveData.characters`。
- 重做角色/阵营目录：`stories.html` 变为可搜索、可筛选的真实档案入口；阵营页成员与角色详情互联；角色详情优先展示印象、个人剧情与来源，而非粗糙占位。
- 首页改为档案主导航：接入 17 阵营 / 56 代理人真实计数、档案入口卡、角色速览与真实数据时间轴；旧 demo/样板页不进入主站导航，并对 `tech-direction-demos.html` 加了“实验页/非默认档案主站”提示条。
- `data.js` 中 factions/characters 占位清空，花名册以 catalog + enrichment 为源；剧情条目仍保留在 `data.js`。

### Testing
- 本地静态服务 `http://127.0.0.1:8791/`。
- JS 语法：`node --check` 通过 `agent-catalog.js`、`agent-enrichment.js`、`app.js`、`stories.js`、`character.js`、`faction.js`、`data.js`。
- 浏览器验证：
  - 首页：`17 阵营 · 56 代理人 · 2 主线条目`；档案入口 4 卡；角色速览 9 卡；intro 为档案站定位文案；主导航无 demo 链接。
  - 角色目录：17 阵营卡 + 56 代理人列表；搜索“安比”得 2 名（安比·德玛拉、零号·安比）及对应 2 阵营。
  - 阵营页 `cunning-hares`：5 名成员与正确 character 链接。
  - 角色页 `anby`：印象文案、肖像、个人剧情 tab 有故事正文，来源含百科/攻略链接。
- 验收截图：`artifacts/verify-home-after.png`、`artifacts/verify-stories.png`、`artifacts/verify-faction-cunning-hares.png`、`artifacts/verify-character-anby.png`。

### Notes
- `agent-enrichment.js` / `artifacts/agent-enrichment.json` / `scripts/build-agent-enrichment.py`：代理人结构化摘要产物与生成脚本（前置已建，本轮消费）。
- `agent-catalog.js`：合并 enrichment、阵营简介与真实花名册注入。
- `data.js`：清空占位 factions/characters，保留主线/故事/活动条目。
- `stories.html` / `stories.js`：目录搜索筛选与阵营/代理人双列表。
- `character.html` / `character.js`：档案模块含印象、剧情、来源。
- `faction.html` / `faction.js`：脚本版本与图片安全 URL。
- `index.html` / `app.js` / `styles.css` / `multi-page.css`：首页档案导航与真实数据渲染。
- `tech-direction-demos.html`：实验页横幅隔离。
- `docs/README.md`：角色数据源与档案目录说明更新。
- `progress.md`：本段记录。
- 回滚：恢复上述前端/数据文件到本轮前版本，删除/回退本段 progress 与本轮 verify 截图；不要删除 wiki 归档与未改原型资产。未匹配 wiki 代理人名（希格莉德·德拉叙尔、蕾米埃尔·丹）仍未入库。

## 2026-07-19 - Task: 固化对照结论且不改正式站主链路
### What was done
- 将官方 wiki / 南孚 / `F:/web` Active Theory 的视觉与技术对照写成只读参考文档，明确「wiki 管骨架、南孚管可落地卷动电影感、AT 管气质上限」，并写死正式站施工闸门：无用户明确施工指令不得改主链路代码。
- 在 `docs/README.md` 与 `F:/hooxi-new-start/README.md` 增加对照文档入口，并回填南孚深拆结论（WebM → 2D Canvas 帧序列 scrub、GSAP ScrollTrigger）。
- 本轮未修改任何正式站业务代码；施工边界以文档闸门形式固定，满足 protected 要求。

### Testing
- 施工前对 15 个正式站主链路文件记录 SHA-256 前 16 位；施工后复测全部一致，输出 `ALL_FORMAL_UNCHANGED`（含 `index.html`、`app.js`、`styles.css`、`data.js`、`multi-page.css`、stories/character/faction/editor 与 agent-catalog/enrichment）。
- `docs/VISUAL-TECH-REFERENCE-COMPARE.md` 存在且含关键闸门文案：`不授权自动改动正式站`、`正式站施工闸门`、`推荐技术配方`。
- `docs/README.md` 可解析相对链接指向该对照文档。

### Notes
- `docs/VISUAL-TECH-REFERENCE-COMPARE.md`：新增三方对照结论、推荐配方、证据索引与正式站施工闸门。
- `docs/README.md`：增加对照文档入口，并声明不构成自动施工授权。
- `F:/hooxi-new-start/README.md`：南孚状态从“首屏快看”升级为已深拆，并指向对照文档。
- `progress.md`：追加本段记录。
- `spec://tasks.json`：对照分析任务保持 done；protected 施工闸门「分析结论不自动改正式站代码，除非用户明确要求施工」保持 `todo`（持续约束，不标 done、不删除）。
- 回滚：删除 `docs/VISUAL-TECH-REFERENCE-COMPARE.md`，定点删除 `docs/README.md` 与 `F:/hooxi-new-start/README.md` 本轮新增段落及本段 progress；不要回滚正式站代码（本轮未改）。

## 2026-07-19 - Task: 加固正式站施工闸门（持续约束，不标 done）
### What was done
- 再次复验 15 个正式站主链路文件相对上一轮指纹全部未变；写入可复跑基线 `artifacts/formal-site-gate-baseline.json`。
- 新增 `scripts/check-formal-site-gate.py`：默认只读比对，输出 `GATE_OK ALL_FORMAL_UNCHANGED`；`--write` 仅用于用户明确授权施工后的基线刷新。
- 在对照文档第 6 节补充闸门校验用法，并写明本 protected 任务是持续行为约束，不得因单次通过就标 done。
- 本轮仍未改任何正式站业务代码；tasks 中该 protected 项保持 `todo`。

### Testing
- `python scripts/check-formal-site-gate.py` → 15 文件均为 `OK`，汇总 `GATE_OK ALL_FORMAL_UNCHANGED`，退出码 0。
- 与上一轮短指纹逐项一致（例：`index.html` `84255ea18866bbe8`，`app.js` `5eaf48d391b919ee`）。

### Notes
- `artifacts/formal-site-gate-baseline.json`：正式站主链路 SHA-256 指纹基线。
- `scripts/check-formal-site-gate.py`：闸门只读校验脚本。
- `docs/VISUAL-TECH-REFERENCE-COMPARE.md`：新增 §6.1 可复跑闸门校验说明。
- `progress.md`：追加本段。
- `spec://tasks.json`：protected 施工闸门保持 `todo`（不 done、不删除、不改文案）。
- 回滚：删除本轮新增的 baseline JSON 与 check 脚本，定点删除对照文档 §6.1 与本段 progress；不要改正式站代码。

## 2026-07-19 - Task: 网站设计重想讨论稿（不施工、不做 demo）
### What was done
- 在用户确认「重新思考网站设计 / 先沟通不做 demo」后，基于 V2 定位书与三方对照，整理设计重想讨论稿：硬锚与张力、用户价值重排、任务柜 IA、双层体验、三层用光、S1/S2/S3 方案、D1–D8 决策清单与定案后建议顺序。
- `docs/README.md` 增加讨论稿入口，并声明不替代定位书、不构成施工授权。
- 正式站施工闸门保持 blocked；本轮未改正式站主链路、未新建 demo。

### Testing
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`。
- 确认存在 `docs/HOOXI-DESIGN-RETHINK.md`，且文首含施工边界声明。

### Notes
- `docs/HOOXI-DESIGN-RETHINK.md`：新增设计重想讨论稿 V0.1。
- `docs/README.md`：增加重想稿入口。
- `progress.md`：追加本段。
- `spec://tasks.json`：设计重想任务可标 done（讨论稿已落盘）；施工闸门 protected 保持 blocked。
- 回滚：删除 `docs/HOOXI-DESIGN-RETHINK.md`，定点删除 `docs/README.md` 入口与本段 progress；不要改正式站代码。

## 2026-07-19 - Task: 功能与视觉设计审核稿（只文档）
### What was done
- 按用户要求「先做出 md 供审核，侧重功能与视觉，看完再提意见」：新增 `docs/HOOXI-FUNCTION-VISUAL-REVIEW.md`。
- 专篇结构：一页纸摘要、产品定义、分功能地图与 P0–P3、分页面视觉说明、三层用光、四条用户旅程、F/V 意见回贴表、审核后流程；明确审核≠施工。
- `docs/README.md` 增加审核稿入口；正式站闸门保持 blocked；未改主链路、未做 demo。

### Testing
- `python scripts/check-formal-site-gate.py` → 期望仍为 `GATE_OK`（本轮只写 docs）。
- 确认审核稿文首含施工边界与审阅方式。

### Notes
- `docs/HOOXI-FUNCTION-VISUAL-REVIEW.md`：新增功能+视觉审核稿 V0.1。
- `docs/README.md`：增加审核稿入口。
- `progress.md`：追加本段。
- `spec://tasks.json`：增加“等待用户审核”类任务为 todo/doing 视情况；施工闸门 protected 保持 blocked。
- 回滚：删除审核稿、定点删除 README 入口与本段 progress；不要改正式站。

## 2026-07-19 - Task: 设计审核稿改短为分步版（先§0）
### What was done
- 用户反馈长稿难读、要一步步改 md：将 `HOOXI-FUNCTION-VISUAL-REVIEW.md` 收为 V0.2-step1 短版（仅展开 §0，其余目录化）。
- 长稿完整备份为 `HOOXI-FUNCTION-VISUAL-REVIEW.v0.1-full.md`。
- README 入口改为短版说明；正式站未改。

### Testing
- 短版含 §0 与改稿进度表；备份文件行数与原长稿一致量级可打开。
- 未跑正式站业务变更；施工闸门仍关闭。

### Notes
- `docs/HOOXI-FUNCTION-VISUAL-REVIEW.md`：短版分步稿。
- `docs/HOOXI-FUNCTION-VISUAL-REVIEW.v0.1-full.md`：V0.1 长稿备份。
- `docs/README.md`：入口文案更新。
- `progress.md`：本段。
- 回滚：用 `.v0.1-full.md` 覆盖回短版文件名，删备份与本段；不要改正式站。

## 2026-07-19 - Task: 批量生成视觉讨论抛砖 Demo（非正式站）
### What was done
- 用户要求结合 skill 与审核稿 md，一次性批量做几个 demo 讨论视觉：在 `prototype/visual-review-demos/` 落地 5 版可切换抛砖页（底部切换条 + `?v=`）。
- 五版对照审核稿 §3：门面·档案为主、门面·进店为主、主线调查终端、角色与阵营墙、PLAY 店内 2D；统一「凌晨录像店」基因，浓度分档。
- 正式站主链路未改；施工闸门保持 blocked。

### Testing
- `node --check prototype/visual-review-demos/demos.js` 通过。
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件指纹未变）。
- 本地 `http://localhost:5179/` 五版浏览器截图：`artifacts/visual-demo-home-archive.png`、`visual-demo-home-play.png`、`visual-demo-mainline.png`、`visual-demo-roster.png`、`visual-demo-play-shop.png`。

### Notes
- `prototype/visual-review-demos/index.html`：抛砖入口与切换条。
- `prototype/visual-review-demos/demos.css`：五版结构差异样式与共用基因 token。
- `prototype/visual-review-demos/demos.js`：五版渲染与 URL/键盘切换。
- `prototype/visual-review-demos/README.md`：怎么看、各版讨论点。
- `docs/README.md`：增加 Demo 入口说明。
- `artifacts/visual-demo-*.png`：五版评审截图。
- `progress.md`：本段。
- `spec://tasks.json`：视觉 demo 任务 done；正式站保护项仍 blocked。
- 回滚：删除整个 `prototype/visual-review-demos/` 目录与五张 `artifacts/visual-demo-*.png`，定点删除 `docs/README.md` 本轮 Demo 入口与本段 progress；不要改正式站代码。

## 2026-07-19 - Task: 搭建绳网情报站视觉复刻原型（首页+代理人）
### What was done
- 在 `prototype/wiki-visual-replica/` 落地官方绳网情报站高保真视觉对照原型：首页（顶栏/英雄Banner/金刚区/侧栏/代理人精选）+ 代理人频道（稀有度/属性/特性/阵营筛选 + 58 人卡片墙 + 预览弹层）。
- 数据与素材来自本地 wiki 镜像抽样，按 HOOXI 对照需求重建信息骨架，**不是**整站复制；正式站主链路未改。
- docs 增加原型入口说明。

### Testing
- 本地静态服务 `http://127.0.0.1:5180/`：首页、`/agents`、`data/agents.json`、`css/wiki.css`、英雄图均 HTTP 200。
- 浏览器：首页代理人精选 16 卡可点开预览；代理人页 58 人列表；筛选 `S + 火` → 8 人（11号/奥菲丝/柏妮思/橘福福/珂蕾妲/般岳/莱特/诺姆）。
- `node --check prototype/wiki-visual-replica/js/wiki.js` 通过。
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`。
- 验收截图：`artifacts/wiki-replica-home.png`、`wiki-replica-agents.png`、`wiki-replica-detail.png`。

### Notes
- `prototype/wiki-visual-replica/index.html`：首页骨架。
- `prototype/wiki-visual-replica/agents.html`：代理人筛选墙。
- `prototype/wiki-visual-replica/css/wiki.css`：wiki 视觉 token 与布局。
- `prototype/wiki-visual-replica/js/wiki.js`：卡片/筛选/弹层。
- `prototype/wiki-visual-replica/data/agents.json`、`filters.json`：58 代理人与筛选项。
- `prototype/wiki-visual-replica/assets/`：背景、角标、活动图与代理人头像。
- `prototype/wiki-visual-replica/README.md`：打开方式与边界。
- `docs/README.md`：增加原型入口。
- `artifacts/wiki-replica-*.png`：评审截图。
- `progress.md`：本段。
- 回滚：删除整个 `prototype/wiki-visual-replica/` 与三张 `artifacts/wiki-replica-*.png`，定点删除 `docs/README.md` 本轮入口与本段 progress；不要改正式站。

## 2026-07-19 - Task: 原型代理人页改为游戏式角色选取 UI
### What was done
- 按最新 B 站《绝区零》UI 动作参考，将 `prototype/wiki-visual-replica/agents.html` 从 wiki 列表墙重写为游戏式选取：顶部编队条、左侧大图舞台、右侧属性面板、底部快捷槽；并支持花名册网格 + 四维筛选。
- 新增 `css/select.css`、`js/select.js` 与 `data/roster.json`（56 名），卡面资源落在原型 `assets/portraits/`。
- 修正详情标题/卡片底栏名字裁切，以及编队条压住右侧面板标题的问题；正式站主链路未改。
- 同步原型 README 与 `docs/README.md` 入口说明。

### Testing
- 本地 `http://127.0.0.1:5180/agents.html`：详情默认安比·德玛拉，统计 56；花名册可筛 `S`、`S+火`（9 人）。
- 出战写入编队后队伍为安比/妮可/比利；键盘右键可切换角色（验收时从安比切到柏妮思·怀特）。
- `node --check`：`js/select.js`、`js/wiki.js` 通过。
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`。
- 截图：`artifacts/agent-select-detail.png`、`artifacts/agent-select-roster.png`；参考帧 `artifacts/bili-ui-ref-anby-*.png`。

### Notes
- `prototype/wiki-visual-replica/agents.html`：改为选取壳页面并引用 select 资源。
- `prototype/wiki-visual-replica/css/select.css`：选取 UI 布局与裁切/叠层修正。
- `prototype/wiki-visual-replica/js/select.js`：编队、筛选、模式切换与快捷键。
- `prototype/wiki-visual-replica/data/roster.json`：选取主数据。
- `prototype/wiki-visual-replica/assets/portraits/`：卡面副本。
- `prototype/wiki-visual-replica/README.md`、`docs/README.md`：原型说明与入口。
- `artifacts/agent-select-*.png`、`artifacts/bili-ui-ref-anby-*.png`：验收与参考。
- `progress.md`：本段；`spec://tasks.json`：本任务 done。
- 回滚：还原/删除本轮 `agents.html`、`css/select.css`、`js/select.js`、`data/roster.json` 与 portraits 副本相关改动，恢复 README/docs 入口文案并删本段 progress；不要动正式站。

## 2026-07-19 - Task: 密采样回写代理人选取动效（切人扫场/分角色待机/分界面）

### What was done
- 根据 B 站 UI 动作合集密采样结论，在原型代理人选取页补上更接近视频的三类差异：切人斜切 `AGENT SELECT` 扫场、按特性/攻击类型分型的待机节奏、基础/技能/装备三套真实面板布局。
- 切换角色时同步角色 tone、入场 pose 与分型待机标签；花名册点选、编队条、键盘左右仍可用；系统减少动态效果时关闭扫场与待机循环。
- 只改 `prototype/wiki-visual-replica/` 与说明文档，正式站主链路未动。

### Testing
- 本地 `http://127.0.0.1:8765/agents.html` 返回可用；状态文案「共 56 名代理人 · 动效对照原型」。
- 浏览器验证：安比 `motion=slash`；比利 `motion=gun` + 技能 6 格；妮可 `support`；简 `anomaly` + 装备 4 行；切面板 `basic/skill/gear` 切换正确。
- `node --check prototype/wiki-visual-replica/js/select.js` 通过。
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`。
- 截图：`artifacts/agent-select-motion-basic.png`、`agent-select-motion-skill-billy.png`、`agent-select-motion-gear-jane.png`。

### Notes
- `prototype/wiki-visual-replica/agents.html`：增加扫场层、立绘 motion 容器、子面板结构、缓存版本。
- `prototype/wiki-visual-replica/css/select.css`：斜切扫场、分型待机 keyframes、技能/装备面板、reduced-motion。
- `prototype/wiki-visual-replica/js/select.js`：motionOf/playWipe/分面板渲染与切人动画编排。
- `prototype/wiki-visual-replica/README.md`、`docs/README.md`：动效对照说明。
- `spec://tasks.json`：游戏式选取 UI 与密采样回写两项 done。
- `artifacts/agent-select-motion-*.png`：验收截图。
- `progress.md`：本段。
- 回滚：恢复上述原型三文件与 README/docs 本轮文案，删除三张 motion 截图与本段 progress；不要改正式站。

## 2026-07-19 - Task: 原型接入现有素材动态背景/视差/氛围层

### What was done
- 仅在 `prototype/wiki-visual-replica/` 接入本地 wiki 美术素材，形成多层动态背景与鼠标视差：代理人选取页加 deep/mid/mesh/ring/dust/grain/vignette；首页加 fixed 氛围栈与 Banner 内层视差/呼吸/扫描线。
- 保留切人扫场、分型待机与分面板；`prefers-reduced-motion` 与非精指针设备下降级关闭尘点与视差循环。
- 正式站主链路未改。

### Testing
- `node --check`：`prototype/wiki-visual-replica/js/select.js`、`js/wiki.js` 通过。
- 资产存在性：`pc-page-bg.png`、`bannerBg.png`、`wiki-menu-bg.png`、`contribution_bg.png`、`home-pc-sidebar-bg.png` 均 OK。
- 结构检查：`agents.html` 含 `sel-fx`/`selDust` 且缓存版本 `20260719h`；`index.html` 含 `page-fx` 与 `bindHomeParallax`；select/wiki CSS 均含 reduced-motion 规则。
- `python scripts/check-formal-site-gate.py`：期望 `GATE_OK ALL_FORMAL_UNCHANGED`（见同轮命令输出）。
- 本地 `http://127.0.0.1:5188/`：首页与资产 200；`agents.html` 可达。
- 浏览器：`agents` 状态文案「共 56 名 · 动态背景/视差已启用」；`.sel-fx` 存在且 deep 层已加载 `pc-page-bg.png`。
- 当前验收环境 `prefers-reduced-motion: reduce=true`，故尘点/视差循环按设计关闭（非回归）。
- 截图：`artifacts/wiki-fx-agents.png`；首页截图 `artifacts/wiki-fx-home.png`。

### Notes
- `prototype/wiki-visual-replica/agents.html`：氛围层结构与缓存版本 h。
- `prototype/wiki-visual-replica/css/select.css`：多层氛围/视差、尘点、hero backplate、reduced-motion。
- `prototype/wiki-visual-replica/js/select.js`：`spawnDust` + `bindParallax`，状态文案提示动态背景已启用。
- `prototype/wiki-visual-replica/index.html`：首页氛围栈 + Banner 视差脚本。
- `prototype/wiki-visual-replica/css/wiki.css`：page-fx 与 hero 动效层。
- `prototype/wiki-visual-replica/README.md`：补充氛围层说明。
- `docs/README.md`：原型入口补充动态背景/视差说明。
- `artifacts/wiki-fx-home.png`、`artifacts/wiki-fx-agents.png`：验收截图。
- `progress.md`：本段；`spec://tasks.json`：本 enrichment 任务 done。
- 回滚：恢复上述 5 个原型文件与 README/docs 本轮文案，删除两张 `wiki-fx-*.png` 与本段 progress；不要改正式站。

## 2026-07-19 - Task: 原型完整成品 v1 收口与自审交付

### What was done
- 在 `prototype/wiki-visual-replica/` 完成完整成品 v1：首页 + 游戏式代理人选取两页内容/素材/动效收口。
- 统一 `agents.json` 与 `roster.json` 同源 56 名（field diffs 0、缺图 0），稀有度含 S/A/I；rank「I」可正确展示（佩洛伊斯）。
- 补齐空/错态：裂图占位、首页金刚区未开入口诚实表达、无假跳转。
- 动效：切人斜切扫场、分型待机、尘点/视差/氛围层；支持 `?motion=1` / `?fx=full` 强制全动效评审，并保留系统减动效降级。
- 修复花名册网格行高塌缩导致的卡片重叠；自审后输出对照截图与说明文档更新。
- 正式站主链路未改。

### Testing
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件指纹未变）。
- `node --check`：`prototype/wiki-visual-replica/js/select.js`、`js/wiki.js` 通过。
- 数据核验脚本：counts 56/56、field diffs 0、missing cards []、ranks 含 `S`(42)/`A`(13)/`I`(1)。
- 浏览器（`http://127.0.0.1:5188/`）：
  - 首页 `?motion=1`：氛围层可见；验收图 `artifacts/wiki-v1-home-fullfx.png`。
  - 选取页 `/agents?motion=1`：状态「共 56 名 · 强制全动效」；`force-fx` 生效；尘点 22；扫场中帧 `artifacts/wiki-v1-agents-wipe-final.png` 可见斜切条纹 + 中央 `AGENT SELECT` 黑条。
  - 花名册网格无叠卡；rank I 卡与详情可达（`artifacts/wiki-v1-agents-rank-I-final.png`）。
  - 减动效环境默认降级符合预期；强制参数可绕过评审。

### Notes
- `prototype/wiki-visual-replica/index.html` / `css/wiki.css` / `js/wiki.js`：首页氛围、金刚区诚实化、同源精选与缓存版本。
- `prototype/wiki-visual-replica/agents.html` / `css/select.css` / `js/select.js`：选取 UI、扫场/尘点/强制动效、网格修复、rank I。
- `prototype/wiki-visual-replica/data/agents.json` / `data/roster.json`：56 名同源收口。
- `prototype/wiki-visual-replica/README.md`：打开方式、数据口径、全动效参数、验收快照。
- `docs/README.md`：原型入口升级为 v1 说明。
- `artifacts/wiki-v1-home-fullfx.png`、`wiki-v1-agents-fullfx.png`、`wiki-v1-agents-wipe-final.png`、`wiki-v1-agents-rank-I-final.png`、`wiki-v1-agents-roster.png` 等：自审验收图。
- `progress.md`：本段；`spec://tasks.json`：完整成品 v1 标 done。
- 回滚：恢复 `prototype/wiki-visual-replica/` 本轮改动文件与 README/docs 入口文案，删除本轮 `artifacts/wiki-v1-*.png`（及 audit json 若需）与本段 progress；将 tasks 中 v1 任务改回 todo；不要改正式站。

## 2026-07-19 - Task: 按网站现况填写需求填空工单

### What was done
- 依据定位书、设计重想、功能视觉 PART-0、三方对照与仓库现状，完整填写通用《网站需求填空工单》，落盘为 `docs/网站需求填空工单-HOOXI-现况填写.md`。
- 区分【现况】/【建议默认】/【待你拍板】；主目标定为档案导航 + 内容/品牌认知；页面范围、气质、素材、动效、禁忌与 HOOXI 专用验收已写清。
- `docs/README.md` 增加工单入口；未改正式站主链路。

### Testing
- 文件可打开，含 §0–§17 与附录 C 依据表；一句话定位与「浏览档案 / 进入录像店」双 CTA 与定位书一致。
- 本轮为文档代填，未跑业务构建；正式站代码未改。

### Notes
- `docs/网站需求填空工单-HOOXI-现况填写.md`：新建现况填写版工单。
- `docs/README.md`：增加工单入口说明。
- `progress.md`：本段。
- 回滚：删除该工单文件，定点删除 docs/README 入口与本段 progress；不要改正式站。

## 2026-07-19 - Task: 路线A 正式站缺口清单 + skill复查落盘

### What was done
- 补跑 ask-matt / code-review（Standards+Spec）/ ponytail-audit / codebase-design 语义，复查 wiki-visual-replica v1 与需求工单。
- 机器自检：原型 56/56、force-fx/wipe/rank I、金刚未开；正式站 `GATE_OK ALL_FORMAL_UNCHANGED`；正式首页无「浏览档案/进入录像店」双 CTA。
- 落盘 `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`：P0–P3 差距表、原型边界、D1–D8 决策板、预拆 C1–C5、用户最短回复句。
- 索引写入 `docs/README.md`、PART-0 §0.6、需求工单附录 C；更新 `spec://tasks.json`。
- **未改正式站主链路；未做原型瘦身 C5。**

### Testing
- `python scripts/check-formal-site-gate.py` → GATE_OK。
- 缺口清单文件可读；docs 入口三处可点到该文。

### Notes
- `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`：新建缺口清单。
- `docs/README.md`：入口。
- `docs/HOOXI-FUNCTION-VISUAL-PART-0.md`：D1–D8 下挂决策进度链。
- `docs/网站需求填空工单-HOOXI-现况填写.md`：附录 C + 签名后续。
- `progress.md` / `spec://tasks.json`：本段与任务状态。
- 回滚：删缺口清单；定点撤 README/PART-0/工单三处链接与本段 progress；tasks 恢复前一版本意图即可。

## 2026-07-19 - Task: 记录 D1-D8 已采纳；C1/C5 暂不动

### What was done
- 用户确认：PART-0 D1–D8 全部采纳建议默认（浏览档案为主、非平权）。
- 用户确认：暂不授权正式站 C1；本阶段不做原型瘦身 C5。
- 已回写 `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md` §0/§4 与 `docs/HOOXI-FUNCTION-VISUAL-PART-0.md` §0.6 决策状态。
- 仍未改正式站主链路代码。

### Testing
- 决策状态可在缺口清单 §4 与 PART-0 表内读到「已采纳 2026-07-19」。
- 正式站本轮无代码 diff 需求；闸门保持未授权不改。

### Notes
- `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`：D1–D8 已采纳；C1/C5 用户立场。
- `docs/HOOXI-FUNCTION-VISUAL-PART-0.md`：决策表加状态列。
- `spec://tasks.json` / `progress.md`：本段。
- 回滚：把两处「已采纳」改回待拍板表述；撤销本段 progress。

## 2026-07-19 - Task: 授权并施工 C1 首页双门面

### What was done
- 用户明确授权：施工正式站 C1（首页双门面；浏览档案为主 / 进入录像店为次）。
- 正式首页 hero 改为双 CTA：主「浏览档案」→ `#archive-nav`；次「进入录像店」→ `tape-wall-sample.html`（隔离样板，非 PLAY 终局）。
- `styles.css` 补 `.button.secondary` 次按钮权重样式。
- 同步缺口清单 / PART-0 / README / 需求工单的 C1 状态；`--write` 刷新正式站闸门基线。
- **未改** PLAY 重资产、角色/阵营/编辑器主链路；**未做** C5。

### Testing
- 内容断言：`index.html` 含主次双 CTA 与目标链接；无旧文案「浏览角色档案」。
- `styles.css` 含 `.button.secondary`。
- `python scripts/check-formal-site-gate.py --write` 后 `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件）。

### Notes
- `index.html`：hero 双门 CTA。
- `styles.css`：secondary 按钮样式。
- `artifacts/formal-site-gate-baseline.json`：C1 后新基线。
- `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`：C1 完成态与差距表。
- `docs/HOOXI-FUNCTION-VISUAL-PART-0.md` / `docs/README.md` / `docs/网站需求填空工单-HOOXI-现况填写.md`：状态同步。
- `spec://tasks.json` / `progress.md`：本段。
- 回滚：恢复 hero 旧双按钮文案与链；去掉 `.button.secondary`；用 gate 脚本 `--write` 指回滚后树，或从 git 还原上述文件与 baseline；撤销本段 progress 与 docs 状态句。

## 2026-07-19 - Task: 授权并施工 C2–C4（导航搜索 / 角色影像首屏 / PLAY 单叙事）

### What was done
- 用户明确「全部授权，要看到成品」：一次性放开正式站 C2、C3、C4。
- **C2**：顶栏「角色」→「角色与阵营」；主链路页增加可见「搜索」入口，链到 `stories.html#agentSearchForm`。
- **C3**：角色页默认「相关影像」；养成材料/方向收入折叠区；未核验数值仍保持待核验文案。
- **C4**：唯一正式进店固定为 `tape-wall-sample.html`（首页次 CTA 已深链）；其余实验原型加顶栏实验横幅；README 补充正式进店说明。
- 文档与闸门基线同步；**未做** C5 原型瘦身。

### Testing
- `node --check character.js` 通过；character.js 花括号配平。
- 内容断言 `ASSERT_OK`：导航文案、搜索入口、角色默认 media tab、growth panel、tape-wall「正式进店」、实验横幅。
- `python scripts/check-formal-site-gate.py --write` 后只读复跑 → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件）。

### Notes
- `index.html` / `stories.html` / `character.html` / `faction.html` / `mainline.html` / `behind-scenes.html` / `events.html`：导航改名 + 搜索入口。
- `styles.css`：`.nav-search`、实验横幅样式。
- `character.html` / `character.js` / `multi-page.css`：媒体优先 tab、养成折叠、媒体卡片样式。
- `tape-wall-sample.html`：正式进店标识；目录文案「角色与阵营」。
- `scroll-world-prototype.html` / `cinematic-slice.html` / `active-theory-sample.html` / `tech-direction-demos.html` / `wiki-style-sample.html` / `character-sample.html`：实验横幅。
- `README.md`：正式进店唯一入口说明。
- `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md` 等：C2–C4 完成态。
- `artifacts/formal-site-gate-baseline.json`：C2–C4 后新基线。
- `progress.md` / `spec://tasks.json`：本段。
- 回滚：从 git 还原上述正式站 HTML/CSS/JS 与 README/docs/baseline；或按文件逐个恢复 C1 后基线再 `--write`；撤销本段 progress。不要整仓盲目 hard reset。

## 2026-07-19 - Task: 成品验收收口（影像误归类 / 进店稳健 / 页脚声明 / 文档 / 浏览器验收）

### What was done
- 角色「相关影像」不再把仅有标题的剧情当影像；仅 `video`/`url`/`cover` 进入影像模块。
- 养成折叠：点击 summary 展开时切到养成材料 tab；收起回到相关影像；默认仍为 media。
- 搜索入口：顶栏「搜索」深链到 `stories.html#agentSearchForm` 后滚动并聚焦输入框（含 hashchange / rAF 兜底）。
- 正式档案页页脚统一补「粉丝非官方档案站 · 与米哈游无隶属」声明。
- 文档状态与施工现实对齐：C1–C4 已落地、C5 不做；缺口清单关键行从弱/偏更新为完成态。
- 浏览器级成品验收 27/27 通过，并输出 `artifacts/accept-final-01`～`08` 截图；闸门基线已刷新。

### Testing
- `node --check character.js` / `stories.js` 通过。
- Playwright 静态服务验收 `ALL_ACCEPT_PASS`（27 pass / 0 fail）：首页双 CTA + 导航/声明、搜索 hash+聚焦+安比=2、角色默认 MEDIA/养成折叠闭环、阵营页、正式进店进店内外、实验页横幅、主线导航。
- `python scripts/check-formal-site-gate.py --write` 后只读复跑 → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件）。

### Notes
- `character.js`：影像过滤去掉 title-only；growth `toggle` 与 `setTab` 联动，避免只展开不切 tab。
- `stories.js`：`#agentSearchForm` / `#agentSearch` 深链聚焦。
- `index.html` / `stories.html` / `character.html` / `faction.html` / `mainline.html` / `behind-scenes.html` / `events.html`：页脚非官方声明。
- `styles.css`：`.footer-disclaimer` 样式。
- `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md` / `docs/HOOXI-FUNCTION-VISUAL-PART-0.md`：C1–C4 完成态与文档一致。
- `artifacts/formal-site-gate-baseline.json`：收口后新基线。
- `artifacts/accept-final-01-home.png` … `accept-final-08-experiment.png`：成品验收截图。
- `progress.md` / `spec://tasks.json`：本段与任务收尾。
- 回滚：定点恢复 `character.js`/`stories.js`/七页 footer/`styles.css` 本轮改动与 docs 状态句；用 gate `--write` 或 git 还原 baseline；删除 `artifacts/accept-final-*.png` 与本段 progress；不要整仓 hard reset。

## 2026-07-19 - Task: 正式站美术增强（wiki图标/头像替换首字母占位）

### What was done
- 正式站角色/阵营目录去掉「首字母代替图标」观感：17 阵营全部接入本地 logo，56 代理人列表统一用本地卡面。
- 修 enrichment 中错误的 `/zzz/wiki/assets/...` 相对路径：经 `mediaUrl` 还原为可访问的 HTTPS，保证角色图集与 wiki 素材能加载；列表头像优先离线卡面，不依赖外网。
- `agent-catalog` 合并策略明确：logo/avatar/headshot/portrait 以 catalog 美术路径为准，避免旧空字段盖掉新图标。
- 文档与闸门同步：缺口清单/README/icons README 写清美术增强完成态；正式站闸门基线已刷新。

### Testing
- 静态页加载校验：关键图片路径 `total 73 / ok 73 / err 0`（先前轮次）。
- 浏览器验收（本轮）：
  - `stories.html`：阵营 logo 17/17、代理人卡面 56/56 均 `naturalWidth>0`；首字占位 span=0。
  - `faction.html?id=cunning-hares`：左侧徽标为真实 logo（右侧大号字母为装饰字标，非缺图回退）。
  - `character.html?id=anby`：本地立绘 + wiki 图集/动图 9 张全部加载成功。
- 抽检徽标缩略图为方形 RGBA 真实阵营标识（含法厄同、白银小队、奥波勒斯等），非误用角色卡。
- `python scripts/check-formal-site-gate.py --write` 后只读复跑 → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件）。
- 截图：`artifacts/art-home-*.png`、`art-stories-*.png`、`art-faction-cunning-hares.png`、`art-character-anby.png`、`art-stories-faction-logos.png`。

### Notes
- `agent-catalog.js`：补齐 `factionLogos` 17 项；列表头像/头图优先本地卡面；`mediaUrl` 修复 wiki 相对路径；merge 保护 logo/avatar 等美术字段。
- `assets/icons/*.png`：落盘 17 个阵营徽标（另保留 `cunning-hares-logo.png` 兼容旧名）。
- `assets/icons/README.txt`：说明注入源改为 catalog，并记录 17 logo 已齐。
- `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`：增补美术增强完成项与验收口径。
- `docs/README.md`：C1–C4 + 美术增强完成态；卡面/logo 使用说明。
- `artifacts/formal-site-gate-baseline.json`：含本轮 catalog 变更的新基线。
- `spec://tasks.json`：美术任务标 done；其余 C1–C4/边界仍为 done。
- 回滚：还原 `agent-catalog.js` 与 `assets/icons/` 本轮新增/替换 PNG；还原 docs 三处与 icons README；gate `--write` 或 git 还原 baseline；删除 `artifacts/art-*.png` 与本段 progress。不要整仓 hard reset。

## 2026-07-19 - Task: 原型选角页按游戏左展右滑重做并放慢动效
### What was done
- 按用户反馈重做原型选角页：默认「左角色大展示 + 右代理人列表可上下滑动」，去掉点选后跳进详情的网页式拆页。
- 右栏改为斜切贴边花名册、筛选条压成横滑芯片、卡面网格可滚动；切人扫场/待机/入场动效整体放慢。
- 仅改 `prototype/wiki-visual-replica/` 与原型说明；正式站主链路未动，闸门仍 `GATE_OK`。

### Testing
- `node --check prototype/wiki-visual-replica/js/select.js` 通过。
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件）。
- 浏览器 `http://127.0.0.1:8796/prototype/wiki-visual-replica/agents.html?motion=1`：
  - 默认 `data-mode=roster`；左 hero 宽约 845、右栏可显示；`#rosterGrid` 56 卡，`scrollHeight > clientHeight` 可上下滑。
  - 点选丽娜后 `mode` 仍为 roster，立绘切到丽娜；状态文案含「动效已放慢」；待机 duration `6.4s`。
- 验收截图：`artifacts/wiki-v1-agents-left-right-roster.png`、`artifacts/wiki-v1-agents-left-right-roster-rina.png`。

### Notes
- `prototype/wiki-visual-replica/agents.html`：默认花名册模式、文案与缓存版本。
- `prototype/wiki-visual-replica/css/select.css`：左展右滑布局、斜切右栏、网格滚动、动效时长放慢、筛选横滑。
- `prototype/wiki-visual-replica/js/select.js`：默认 roster、点选不强制详情、扫场/入场计时放慢、选中卡 scrollIntoView。
- `prototype/wiki-visual-replica/README.md`：默认布局与验收快照说明。
- `docs/README.md`：原型选角页说明改为左展右滑。
- `artifacts/wiki-v1-agents-left-right-roster*.png`：本轮验收图。
- `progress.md`：本段。
- 回滚：恢复上述原型 4 文件与 `docs/README.md` 本轮文案，删除两张 left-right 验收图与本段 progress；不要改正式站业务代码。

## 2026-07-19 - Task: 原型选角右栏密铺 + SELECT 主题色 + 背景动效保留
### What was done
- 原型选角页继续贴近真机：右栏改为密铺头像墙（多列小卡、头像优先），筛选默认折叠，把高度留给列表滑动。
- 右侧 SELECT 竖标、右栏边光、选中描边、滚动条强调色随当前代理人主题色切换；点选仍只切左侧展示，不离开花名册。
- 背景氛围/尘点/待机/扫场动效保留；仅改 prototype，正式站门禁复验通过。

### Testing
- `node --check prototype/wiki-visual-replica/js/select.js` 通过。
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件）。
- 浏览器 `http://127.0.0.1:5180/agents.html?motion=1`：
  - 默认 mode=roster；56 密铺卡；筛选默认关闭。
  - 安比：`--tone=#5B8CFF`，SELECT 背景为电蓝渐变；水印 ANBY。
  - 点般岳：mode 仍 roster；tone 切 `#FE6B2E`，SELECT 变火橙；`sel-fx__deep` 仍为 `sel-bg-drift`，bloom/待机动效在。
  - 点以太系：tone 切 `#C77DFF`，SELECT 变紫。
- 验收截图：`artifacts/wiki-v1-agents-dense-roster.png`、`artifacts/wiki-v1-agents-select-tone-fire.png`。

### Notes
- `prototype/wiki-visual-replica/agents.html`：密铺花名册结构、折叠筛选、SELECT/水印节点、缓存版本。
- `prototype/wiki-visual-replica/css/select.css`：密铺网格、主题色 SELECT/边光/选中、折叠筛选、背景动效保留与减动效兼容。
- `prototype/wiki-visual-replica/js/select.js`：头像密铺渲染、tone 亮度、水印英文、筛选事件绑定。
- `prototype/wiki-visual-replica/README.md`、`docs/README.md`：原型说明同步为本轮形态。
- `artifacts/wiki-v1-agents-dense-roster.png`、`artifacts/wiki-v1-agents-select-tone-fire.png`：验收图。
- `progress.md`：本段。
- 回滚：恢复上述原型三文件 + 两处 README 文案，删除两张 dense/tone 验收图与本段 progress；不要改正式站业务代码。

## 2026-07-19 - Task: 原型选角右栏改为斜切式人物列表

### What was done
- 将花名册右栏从「密铺头像墙」推进为游戏选角式「大斜切人物列表」：整板 parallelogram 斜切、卡身下斜切角、左缘主题色光条、SELECT 贴右缘并随代理人 tone 变色。
- 保留左大立绘展示、筛选折叠、点选不离开花名册、背景氛围动效与切人扫场；未改正式站。

### Testing
- `node --check prototype/wiki-visual-replica/js/select.js` 通过。
- 浏览器打开 `agents.html?motion=1`：默认 roster 态，右栏 `clip-path: polygon(22% 0, 100% 0, 100% 100%, 0 100%)`，56 卡可滑，安比选中时 SELECT 为电蓝 `#5B8CFF`。
- 点选「般岳」：tone / SELECT / 选中描边切为火橙 `#FE6B2E`，仍停在花名册。
- 验收截图：
  - `artifacts/wiki-v1-agents-skew-roster.png`
  - `artifacts/wiki-v1-agents-skew-roster-fire.png`

### Notes
- `prototype/wiki-visual-replica/agents.html`：右栏结构改为 skew 容器 + 内嵌 SELECT；文案与 cache bust。
- `prototype/wiki-visual-replica/css/select.css`：斜切板、边光、网格列/卡比例/clip、SELECT 右缘定位与响应式。
- `prototype/wiki-visual-replica/README.md`、`docs/README.md`：说明从密铺墙同步为斜切花名册。
- `artifacts/wiki-v1-agents-skew-roster.png`、`artifacts/wiki-v1-agents-skew-roster-fire.png`：本轮验收图。
- `progress.md`：本段。
- 回滚：恢复 `prototype/wiki-visual-replica/` 下 agents.html、css/select.css、README.md 与 `docs/README.md` 本轮改动，删除两张 skew 验收图与本段 progress；不要改正式站业务代码。

## 2026-07-19 - Task: 花名册严格对照真机斜切列表再校准

### What was done
- 按真机选角帧重校准原型右栏花名册：更陡左斜边、3 列近方头像卡、底栏改为「稀有度+等级N+属性」、选中黄框、左轨「基础/技能/装备」、右缘黄绿霓虹 SELECT（混当前 tone）。
- 修正左内边距避免首列被 clip 裁切；左轨文字方向改为正向可读；点左轨可进档案子页。
- 仅改 prototype 与说明文档；正式站闸门复验未变。

### Testing
- `node --check prototype/wiki-visual-replica/js/select.js` 通过。
- `python scripts/check-formal-site-gate.py` → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件）。
- 浏览器 `http://127.0.0.1:8765/agents.html`：
  - 默认 roster；clip `polygon(27% 0, 100% 0, 100% 100%, 0 100%)`；网格 3 列；左轨可见「基础/技能/装备」。
  - 安比：tone `#5B8CFF`；底栏 `A 等级60 电`；黄框选中；SELECT 黄绿混蓝。
  - 般岳：tone `#FE6B2E`；SELECT/氛围随火橙；仍停在花名册。
- 验收截图：
  - `artifacts/wiki-v1-agents-gameui-roster.png`
  - `artifacts/wiki-v1-agents-gameui-roster-fire.png`

### Notes
- `prototype/wiki-visual-replica/agents.html`：左轨+工具条结构、文案与 cache bust `gameui1`。
- `prototype/wiki-visual-replica/css/select.css`：陡斜边/左内边距、3 列近方卡、黄框、左轨、霓虹 SELECT。
- `prototype/wiki-visual-replica/js/select.js`：底栏改等级文案；左轨与档案 panel 同步绑定。
- `prototype/wiki-visual-replica/README.md`、`docs/README.md`：对照真机说明与验收图。
- `artifacts/wiki-v1-agents-gameui-roster*.png`：本轮验收图。
- `progress.md`：本段；`spec://tasks.json`：本任务 done。
- 回滚：恢复上述原型三文件 + 两处 README 文案，删除两张 gameui 验收图与本段 progress；不要改正式站业务代码。

## 2026-07-19 - Task: 正式站 P1 收口（统一 SEO TDK + 轻量关于）

### What was done
- 用户解除持续闸门空转并授权开始改正式站后，优先收口缺口清单 P1 弱项：7 个正式档案页统一 title/description/theme-color/robots/favicon；页脚非官方声明补 Hooxi 品牌口径。
- 首页关于区改为轻量「三点说明 + 品牌边界侧栏」，顶栏增加「关于」锚点；角色/阵营页在打开具体 id 时动态写入 description。
- 刷新正式站闸门基线。

### Testing
- 7 页均具备 title、description、favicon、theme-color、页脚 Hooxi 口径；首页含 `about-points` 与 `href="#about"`。
- `node --check character.js` / `faction.js` 通过。
- `python scripts/check-formal-site-gate.py --write` 后只读复跑 → `GATE_OK ALL_FORMAL_UNCHANGED`（15 文件）。

### Notes
- `index.html` / `stories.html` / `character.html` / `faction.html` / `mainline.html` / `behind-scenes.html` / `events.html`：TDK + 页脚；首页关于与导航。
- `styles.css`：关于区列表/侧栏样式。
- `character.js` / `faction.js`：动态 meta description。
- `assets/favicon.svg`：新增站点图标。
- `artifacts/formal-site-gate-baseline.json`：新基线。
- `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md` / `docs/README.md`：P1 状态。
- `progress.md` / `spec://tasks.json`：本段。
- 回滚：恢复上述 7 HTML + styles/character/faction JS 与 favicon、docs、baseline；删除本段 progress。不要整仓 hard reset。

## 2026-07-19 - Task: 修复首页固定音乐栏压遮标题/页脚

### What was done
- 浏览器抽检发现固定音乐播放器在锚点跳转与页尾会压住「档案入口」标题与页脚文案。
- 增加 html scroll-padding-bottom、body 底边距、区块 scroll-margin，并抬高播放器/歌单 z-index，避免遮盖正文与页脚。

### Testing
- `padding-bottom`/`scroll-padding-bottom` = 110px；播放器 z-index=12。
- 跳转 `#archive-nav` 后标题与播放器无重叠；页脚 disclaimer 与播放器无文本矩形重叠。
- 截图：`artifacts/accept-p1-archive-nav-clear.png`、`artifacts/accept-p1-about-section.png`。
- 闸门 `--write` 后复跑 `GATE_OK ALL_FORMAL_UNCHANGED`。

### Notes
- `styles.css`：音乐栏避让与 z-index。
- `artifacts/formal-site-gate-baseline.json`：刷新基线。
- `progress.md`：本段。
- 回滚：去掉 styles.css 末尾 music dock 避让块并恢复 baseline；删除本段。

## 2026-07-19 - Task: 正式站全局视觉大改（theme-zzz 深色游戏气质）

### What was done
- 按用户授权继续改正式站：新增全局主题 `theme-zzz.css`，把正式档案站统一到深色舞台 + 游戏黄 `#ffde00` + 斜切 HUD 体系，贴合游戏/绳网气质，同时保持档案双门、可读性与非官方声明。
- 7 个正式页（首页/角色与阵营/角色/阵营/主线/幕后/活动）挂载主题；favicon 与 theme-color 同步到深色+黄；拷贝氛围底图到 `assets/ui/pc-page-bg.png`。
- 第二/三轮覆盖层收口：目录筛选条等浅色纸岛压暗、子页橙色标题改为游戏黄、黄底徽标对比度（黑字）、首页档案卡/关于/页脚/音乐坞统一。
- 闸门脚本纳入 `theme-zzz.css` 并刷新基线；docs 同步完成态。

### Testing
- 本地静态服务 `http://127.0.0.1:8799/`：`theme-zzz.css` 与 `assets/ui/pc-page-bg.png` HTTP 200。
- 浏览器计算样式：`--yellow=#ffde00`、`--paper=#121412`、`--ink=#0a0a0a`；stories hero status 黄底黑字可读；directory-toolbar 背景 `rgba(12,12,12,.94)`。
- 抽检截图：
  - `artifacts/accept-zzz-home-hero.png`
  - `artifacts/accept-zzz-home-archive.png`
  - `artifacts/accept-zzz-home-about.png`
  - `artifacts/accept-zzz-stories-v3.png`
  - `artifacts/accept-zzz-stories-factions.png`
  - `artifacts/accept-zzz-mainline.png`
  - `artifacts/accept-zzz-character-anby.png`
- `python scripts/check-formal-site-gate.py --write` 后只读复跑 → `GATE_OK ALL_FORMAL_UNCHANGED`（16 文件，含 theme-zzz.css）。

### Notes
- `theme-zzz.css`：新建全局视觉覆盖层（含 pass-2/pass-3 对比度与纸岛收口）。
- `index.html` / `stories.html` / `character.html` / `faction.html` / `mainline.html` / `behind-scenes.html` / `events.html`：引入 theme、theme-color `#0a0a0a`。
- `assets/favicon.svg`：黑底黄标。
- `assets/ui/pc-page-bg.png`：氛围底图副本。
- `scripts/check-formal-site-gate.py`：FORMAL 列表增加 theme-zzz.css。
- `artifacts/formal-site-gate-baseline.json`：本轮新基线。
- `docs/README.md` / `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`：视觉大改完成态。
- `artifacts/accept-zzz-*.png`：验收截图。
- `progress.md`：本段。
- 回滚：去掉 7 页 theme 链接与 theme-color 回退；删除 `theme-zzz.css` 与 `assets/ui/pc-page-bg.png`（可保留 favicon 或还原色值）；gate 列表去掉 theme 后 `--write` 或 git 还原 baseline/docs；删除 `artifacts/accept-zzz-*.png` 与本段 progress。不要整仓 hard reset。


## 2026-07-19 - Task: 正式站大纲重构（金刚区/剧情分栏/提亮/动效）

### What was done
- 按用户授权继续改正式站大纲：对照绳网骨架增加首页顶栏多入口与金刚区 10 大模块（代理人/阵营/主线/角色剧情/活动/幕后为 LIVE，音擎/邦布/驱动盘/地图为 LOCK 诚实占位），不做官方 wiki 整站复制。
- 修复剧情区混乱：路线图按「主线 / 角色剧情 / 活动」分栏；`data.js` 补齐 stories/events 与 pageMeta 分组；主线页增加 STORY LANES 切换（`?lane=stories` 等），角色剧情不再混进主线轴。
- 视觉提亮：`theme-zzz.css` pass-4 降低纯黑压抑，提高黄黑对比与面板亮度；首页模块卡/优先入口/章节轨统一斜切 HUD。
- 动效与交互：`motion.css` 强化模块入场、悬停扫光、点击 press 反馈；保留 `prefers-reduced-motion` 降级。
- 浏览器抽检与闸门基线已刷新；docs 同步完成态。

### Testing
- `node --check`：`app.js` / `page.js` / `data.js` 通过。
- 本地静态服务抽检 `http://127.0.0.1:61074/`：
  - 首页金刚区 10 项（6 LIVE / 4 LOCK），状态文案含 17 阵营 · 56 代理人 · 2 主线 · 3 角色剧情 · 2 活动。
  - `#timeline` 三栏：主线/世界观 2、角色剧情 3、活动/委托 2；章节 lane class 正确。
  - `mainline.html` 默认主线/媒体 + 车道条 1 条；`mainline.html?lane=stories` 标题切换为角色剧情/秘闻支线，分组「代理人秘闻」「城市支线 / 委托」。
  - 点击 press：`is-pressed` 绑定生效；`kk-in` 关键存在；环境若开启减动效则动画按规范降级。
- 截图：
  - `artifacts/shot-home-outline.png`
  - `artifacts/shot-home-modules.png`
  - `artifacts/shot-home-timeline.png`
  - `artifacts/shot-mainline-default.png`
  - `artifacts/shot-mainline-stories-lane.png`
- `python scripts/check-formal-site-gate.py --write` 后只读复跑 → `GATE_OK ALL_FORMAL_UNCHANGED`。

### Notes
- `index.html`：首页大纲骨架（模块区/优先入口/剧情轨）与 cache bust。
- `app.js`：金刚区渲染、剧情分栏、press 绑定。
- `data.js`：stories/events/pageMeta 分栏数据，角色剧情与活动不再空置混排。
- `page.js`：主线页 lane 切换、车道条、空态/英雄文案随车道变化。
- `theme-zzz.css`：pass-4 提亮 + 金刚区/车道/章节样式。
- `motion.css`：入场/悬停/点击反馈，保留减动效。
- 若干子页 HTML：cache bust 至 pass-4。
- `artifacts/formal-site-gate-baseline.json`：本轮新基线。
- `docs/README.md` / `docs/HOOXI-FORMAL-SITE-GAP-CHECKLIST.md`：大纲重构完成态。
- `artifacts/shot-*.png`：抽检截图；`artifacts/_patch_outline.py` / `_check_data.js` 为临时脚本可删。
- `progress.md`：本段。
- 回滚：还原上述文件至上一 git 版本或上一闸门基线对应内容；删除本段 progress 与本轮 shot；勿整仓 hard reset。


## 2026-07-19 - Task: 用户要求 vs 现况对照文档

### What was done
- 根据用户反馈（整体难看、不协调、配色有问题、功能模块偏少、要求按 skill 重构且先写 md），新增对照文档，区分「可执行要求 / 产品既定范围 / 仓库真实现况 / 模块少的两种原因 / 配色诊断 / 待拍板项」。
- 明确本稿不是施工单；重构需用户确认模块策略与视觉方向后再按 Hallmark 等 skill 推进。
- docs 索引已挂到 README。

### Testing
- 只读整理 + 运行时数据计数核对：阵营 17、代理人 56、主线 2、角色剧情 3、活动 2、幕后 0。
- 未改正式站业务代码；无需闸门重写。

### Notes
- `docs/USER-REQ-VS-STATUS-2026-07-19.md`：新建对照文档。
- `docs/README.md`：增加该文档入口。
- `progress.md`：本段。
- 回滚：删除上述新文档段落与文件链接即可。


## 2026-07-19 - Task: S1 视觉与信息架构重构（正式站）

### What was done
- 按对照文档默认策略 **S1 档案纯化**，用 Hallmark 取向落地统一 design token 与首页信息架构：去掉假 LOCK 图鉴墙和重复「优先入口」，改为「三条查档路径 + 次要 chip」。
- 重写 `theme-zzz.css`（依赖 `tokens.css`），统一深色暖纸感表面阶、琥珀强调色克制使用、按钮/路径卡/页眉页脚对比；首屏文案改为任务导向。
- 全站主 HTML 缓存参数升至 s1-1；闸门基线刷新并纳入 `tokens.css`。
- 浏览器抽检：首页路径区 3 卡、LOCK=0、代理人精选可见；主线页车道与黄黑系统一致。

### Testing
- `node --check app.js` 通过。
- `python scripts/check-formal-site-gate.py --write` 已写入 17 文件基线。
- Browser：`http://127.0.0.1:61074/index.html` 路径卡=主线补课/角色与阵营/按名字找人；chip=角色剧情/活动/幕后/录像店；status 显示 17/56/2/3/2。
- 截图：`artifacts/shot-home-s1.png`、`artifacts/shot-home-s1-paths.png`、`artifacts/shot-mainline-s1.png`。

### Notes
- `tokens.css`：新建全局 design tokens。
- `theme-zzz.css`：S1 主题整页重写（非 pass-N 叠层）。
- `index.html`：IA 改为 start paths；导航精简。
- `app.js`：`renderHomeModules`/`renderHomeArchive` 与默认 appearance 文案。
- `motion.css`：路径卡动效，去掉倾斜 kingkong 依赖。
- `mainline.html` 等 6 子页：缓存与 theme-color。
- `scripts/check-formal-site-gate.py` + `artifacts/formal-site-gate-baseline.json`：纳入 tokens。
- `.hallmark/log.json`：记录本次宏结构。
- 回滚：恢复上述文件到上一闸门哈希；可从 git 或基线对照回退。

## 2026-07-19 - Task: S1.1 代理人选人工作台
### What was done
- 将 stories.html 从阵营目录改为左侧当前代理人主舞台、右侧搜索/阵营筛选/56人名单的选人工作台；保留 character.html 完整档案和 faction.html 阵营档案分工。
- 选人/筛选无刷新更新 URL、立绘、角色摘要、主题、ARIA 状态及档案/media/lore/profile/related 深链；补零结果、URL恢复、键盘二维导航、搜索 hash 聚焦、图片回退和编辑预览绑定。
- 收紧动态主题色与自由链接/图片 URL 安全边界；主题色仅作装饰且保证非文本对比，普通链接拒绝 javascript:/非图片 data:。
- 工作台 CSS 限定 .archive-stories，完成移动端重排、320px reflow、减动效和高对比交互；记录 HOOXI 档案站定位与 Hallmark 设计来源。

### Testing
- node --check stories.js 通过；git diff --check 目标文件无空白错误（仅既有 LF/CRLF 提示）。
- 独立 Chromium 覆盖 1440/1280/1024/768/414/375/320：无横向滚动；56 角色、17 阵营、搜索/筛选/零结果/清空/agent+faction冲突、URL replace 与恢复均通过。
- 键盘 Tab/Enter/Space/Arrow/Home/End、aria-pressed、role=status、group 语义、hash 聚焦、阵营和角色深链通过；editorPreview 下 contenteditable="plaintext-only" 方向键不再切换角色。
- 主图 loading=eager + fetchpriority=high，名单 loading=lazy；图片解码、console、page error、request failure、HTTP 4xx/5xx 均为 0。
- safeUrl 通过危险 javascript:/data:text/html 注入验证；动态主题 CSS 注入被颜色校验阻止；最终 Standards/Spec 双轴审查发现项均已修复并定向复验。

### Notes
- stories.html：工作台语义结构、搜索/名单/深链入口与缓存版本。
- stories.js：目录数据渲染、筛选选中状态、URL同步、键盘/无障碍、编辑绑定、图片与URL安全。
- theme-zzz.css：.archive-stories 范围内的 Split Studio 工作台、响应式、对比度与 reduced-motion 样式。
- docs/zzz-archive-positioning.md：新增 HOOXI 代理人工作台稳定定位与内容边界。
- .hallmark/log.json：追加 Split Studio / studied-DNA 设计记录。
- progress.md：本段。
- 回滚点：本轮开始前的未提交工作树状态；回滚时仅逆向上述文件的本轮差异并删除新定位文档/本段记录，不执行整仓 git restore、checkout 或 hard reset，以免覆盖用户既有未提交改动。

## 2026-07-19 - Task: 工作台改为左侧全屏舞台 + 右侧斜切覆盖花名册（Skew Stage）
### What was done
- 将 stories 工作台从普通双栏改为左侧全屏 HD 人物舞台 + 右侧覆盖式大斜切 3 列花名册和 SELECT 竖条；桌面右板 600-640px，clip-path: polygon(25% 0, 100% 0, 100% 100%, 0 100%)。
- 动态主题背景渐变随代理人切换（transition 420ms）；角色肖像轻微待机呼吸。
- 切人 wipe 重构为 commitSelectedAgent + selectAgent 包装：正常切换先启动 480ms wipe，在 ~240ms 中点提交 state/主题/立绘/HUD/链接/ARIA/URL/announce；首次加载、过滤导致自动换人、reduced-motion 立即提交不 wipe；快速连续点击取消旧 timeout/令牌重启动画；clearSelection 取消 pending；animationend 清理 is-wiping class。
- RAF 指针视差：workbench pointermove 计算相对中心目标 x/y（限制 ±2.5%/±2%），pointerleave 回零；RAF 平滑插值 + 小幅自动漂移叠加，更新 --bg-drift-x/--bg-drift-y；reduced-motion 开关时正确 stop/start 不重复 RAF。
- 桌面真实构图安全区：人物可见约 62-68%；`.agent-stage-portrait` 右边界 inset-right 给 roster 留安全区但允许进入斜边少量；`.agent-stage-info` padding-right 为 roster 宽度 + 安全距；881-1180px 专用 roster 宽度约 470-540px，使 1024 仍接近 64% 可见舞台；<=880 恢复正常左右 padding/portrait inset。
- aria/sunna 舞台降级：commit 时给 #selectedAgentPortrait 切换 `is-compact-card` class；clear 时移除；CSS 在桌面和移动端确保该容器内图片 max-width 300px、height auto、contain、带档案框，不按全舞台拉伸。
- CSS Hallmark critique 中 `--px/--py` 说法改为 `--bg-drift-x / --bg-drift-y`，aria/sunna 描述改为真实 ≤300px 档案卡。
- <=880px 上下堆叠、<=375px/320px 两列无横向滚动；prefers-reduced-motion 关闭漂移/待机/wipe 持续运动。
- 肖像路径：anby 保留 `anby-portrait.png`；aria/sunna 回退到 card + compact card 降级；其余统一使用 `<id>-portrait.webp`。
- 保留全部现有 56 人数据、搜索/筛选/URL/键盘/ARIA/editor/deep links。

### Testing
- `node --check stories.js` 通过；`git diff --check stories.js theme-zzz.css` 无空白错误（仅既有 LF/CRLF 提醒）。
- 切人 wipe：`commitSelectedAgent` 正常提交所有 state/主题/立绘/HUD/链接/ARIA/URL/announce；`selectAgent` 首次加载不 wipe（prevId 空）、过滤自动换人传 `wipe:false`、reduced-motion 立即提交；快速连续点击通过 `cancelWipe` + `wipeToken` 取消旧 timeout；`clearSelection` 调用 `cancelWipe` + 移除 `is-compact-card`；`animationend` 正确清理 `is-wiping`。
- RAF 视差：无 workbench 不启动；reduced-motion 不启动；pointermove 计算相对中心 targetX/Y（±2.5%/±2% 钳制）；pointerleave 归零；RAF 平滑插值 lerp 0.08 + 小幅自动漂移叠加；reduced-motion 开关正确 stop/start 不重复 RAF。
- 构图安全区：桌面 portrait `inset-right: calc(var(--roster-width)*.35)`；881-1180px `--roster-width: clamp(470px, 50vw, 540px)`；stage-info `padding-right: calc(var(--roster-width) + 28px)`；<=880 恢复 inset `44px 4% 0 5%` 与 padding `clamp(20px, 3vw, 38px)`。
- compact card：aria/sunna 获得 `is-compact-card` class，图片 max-width 300px + 档案框；普通 54 人不受影响；clear 时移除 class。
- Hallmark critique：`--px/--py` 已改为 `--bg-drift-x / --bg-drift-y` + pointermove 视差；aria/sunna 描述已改为 ≤300px 档案卡。
- `anby-portrait.png` 保留未删除（920KB），`localPortraitUrl` 对全 54 角色返回 WebP。
- 肖像 WebP 资产已从 wiki 镜像 enrollment 数据生成：54 张 `*-portrait.webp`（56 角色中 aria/sunna 无图），全部 1600x1800 RGBA、alpha min=0、总大小 10.12 MB。
- `scripts/map-wiki-portraits.py` 已删除。

### Notes
- `stories.js`：新增 `cancelWipe`/`commitSelectedAgent`；`selectAgent` 重构为 wipe 编排 + 中点提交；`clearSelection` 取消 pending 与移除 is-compact-card；`applyFilters` 传 `wipe:false`；RAF 替换为 pointermove 视差 + 自动漂移 + stop/start 去重。
- `theme-zzz.css`：Hallmark critique 校正；stage-portrait inset-right 安全区；stage-info padding-right 安全区；881-1180px 专用 roster 宽度；compact card 降级样式；<=880 恢复原始 inset/padding。
- `stories.html`：agent-stage-visual 内新增 `#agentWipeOverlay`；缓存版本升至 s1-2-skew-stage。
- `assets/portraits/`：新增 54 个 `<id>-portrait.webp` 高清立绘资产；`anby-portrait.png` 保留。
- `.hallmark/log.json`：最前插入 Workbench studied-DNA stamp（含 critique 字段）。
- `docs/zzz-archive-positioning.md`：追加游戏选角 DNA 校准与非官方边界说明。
- `progress.md`：本段。
- 回滚：还原 stories.js 中函数拆解/wipe/R AF/视差逻辑至旧版；还原 theme-zzz.css 中 portrait inset/info padding/roster 宽度/compact card/critique 文案至旧版；删除新增的 54 个 `*-portrait.webp`；不执行 git reset/hard reset。

## 2026-07-19 - Task: 斜切代理人工作台最终审查与回归收口

### What was done
- 修复桌面斜切边界覆盖花名册首列的问题，名单滚动区整体进入可见与可点击安全区，并让高光 seam 精确跟随斜边。
- 修复 wipe 期间回选当前代理人无法撤销待切换的问题；中点提交改为由不透明扫场完整遮挡，避免内容裸跳。
- 收紧 `aria` / `sunna` 窄屏档案卡尺寸，降低长角色名对矮屏舞台高度的影响；768px 中间宽度顶栏改为单一搜索入口。
- 更新页面资源版本参数与定位文档；既有 Hallmark `Skew Roster Stage` 记录已覆盖最终结构、资源降级与非官方边界。

### Testing
- `node --check stories.js` 通过；`git diff --check -- stories.js theme-zzz.css stories.html` 通过，仅有既有 LF→CRLF 提示。
- 独立定向 Chromium 复核 7/7 通过：1440/1280/1024 首列卡片完整且可点击；快速回选在 116.5ms 取消待提交切换；wipe 中点覆盖率 99.94%；375/320 的 aria/sunna 卡片四边完整；矮屏角色切换最大视觉高度差由约 55px 降至 12.16px 且发生在遮罩下；768 顶栏单行；seam 最大偏差 2px。
- 独立完整浏览器回归 48/48 通过，覆盖 1440/1280/1024/768/414/375/320、54 张 1600×1800 透明 WebP、2 个档案卡降级、搜索/筛选/清空/空状态、鼠标与键盘、URL 深链、wipe/快速取消、指针视差、reduced-motion、焦点与 ARIA。
- 控制台错误、PageError、请求失败、HTTP 4xx/5xx 与 404 均为 0；两路只读回归前后工作区文件集合一致。

### Notes
- `stories.html`：更新工作台 CSS/JS cache-bust，确保最终修复不会命中旧缓存。
- `stories.js`：统一取消 wipe 的 timeout、动画状态与回调；允许回选当前代理人撤销待提交切换；为长角色名切换紧凑标题样式。
- `theme-zzz.css`：补花名册斜切安全区、精确 seam、不透明中点 wipe、窄屏 compact-card 尺寸、长名字与 768px 顶栏规则。
- `docs/zzz-archive-positioning.md`：补充花名册安全区、快速撤销与中间宽度导航定位。
- `progress.md`：追加本轮最终审查、修复与回归证据。
- 回滚：仅逆向以上四个实现/文档文件的本段差异并删除本段 progress；不要还原或删除先前已接入的 54 张立绘、Hallmark 记录及用户其他未提交改动，也不要执行整仓 restore、checkout 或 hard reset。

## 2026-07-19 - Task: R1 M0 设计合同、媒体护栏与正式基线收口

### What was done
- 落地全站唯一设计合同与媒体来源政策，固定 HOOXI 非官方档案站定位、媒体枚举、版权状态、本地封面和发布阻断规则。
- 建立正式档案数据契约，冻结 56 名代理人、17 个阵营、正式集合 ID、路由、查询参数和 Hash 深链；校验按 ID 集合而非展示顺序判断。
- 将两条正式主线媒体样本切换为 HOOXI 本地 fallback，禁止远程/代理兼容封面成为正式资源；有视频的正式条目必须有本地封面。
- 修复三个正式页面的多余 `</main>` 与目录工具栏被截断的 CSS；把 Barlow Condensed、Space Mono Latin 子集及 OFL 许可证本地化，移除运行时 Google Fonts 依赖。
- 正式角色页不再运行时加载未本地化图库；`#growth` 旧深链规范化到 `#story`，保留可用内容入口。
- 生成 8 条正式路由 × 3 种视口/动效变体的 24 张视觉基线，并把意外外联、页面结构、横向溢出和 8 条真实深链纳入阻断。
- 强化正式站指纹门禁：自动发现 8 个正式 HTML 的直接本地 CSS、JS 与图标依赖；新增依赖、缺失文件、内容变化和基线残留项都会硬失败，最终冻结 38 个正式依赖。

### Testing
- `npm run test:content`：8 组媒体与档案契约检查全部通过。
- `npm run test:ui`：24/24 截图、8/8 深链、意外外联 0、阻断 0，报告 `passed: true`。
- `npm run test:formal`：38 个正式文件与直接依赖全部通过，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- `node --check data.js media-catalog.js character.js scripts/validate-archive.mjs scripts/capture-r1-baseline.mjs` 与 `python -m py_compile scripts/check-formal-site-gate.py`：通过。
- `git diff --check` 定点检查通过，仅有既有 LF/CRLF 转换提示。
- 正式门禁负向验证：在新发现的直接依赖未写入基线时输出 `UNTRACKED` + `GATE_FAIL`；授权刷新后才恢复通过。
- Hallmark 的 log、banned、similarity、color-count 四项检查在本轮视觉合同落地后通过；最终字体本地化未改变页面结构或颜色，且双轴独立审查复核通过。
- 独立 Standards 与 Spec 双轴审查最终均为 PASS，无 M0 阻断问题。

### Notes
- `design.md`：新增全站唯一设计系统合同，并记录本地字体资产落点。
- `docs/media-source-policy.md`：新增媒体来源、版权、本地化、fallback 与发布阻断政策。
- `docs/README.md`：补充 R1 合同入口及内容、视觉、外联、深链门禁说明。
- `docs/zzz-archive-positioning.md`：记录 HOOXI 档案站、代理人工作台及非官方边界。
- `data.js`：两条正式主线媒体样本改用 HOOXI 本地封面与统一媒体引用。
- `media-catalog.js`：新增正式媒体目录与统一字段枚举。
- `assets/covers/official/zzz-worldview-pv.webp`：新增世界观 PV 的 HOOXI fallback。
- `assets/covers/official/zzz-launch-pv.webp`：新增公测 PV 的 HOOXI fallback。
- `assets/fonts/barlow-condensed-400-latin.woff2`、`barlow-condensed-500-latin.woff2`、`barlow-condensed-600-latin.woff2`、`barlow-condensed-700-latin.woff2`、`barlow-condensed-800-latin.woff2`：新增 Barlow Condensed 本地 Latin 字重子集。
- `assets/fonts/space-mono-400-latin.woff2`、`space-mono-700-latin.woff2`：新增 Space Mono 本地 Latin 字重子集。
- `assets/fonts/OFL-Barlow-Condensed.txt`、`OFL-Space-Mono.txt`：保留两套字体的 SIL OFL 许可证。
- `styles.css`：移除 Google Fonts 外联并声明本地字体；清理末尾空白。
- `character.js`：正式图片只加载同源/data/blob 资源，过滤未本地化图库并兼容 `#growth` 旧入口。
- `multi-page.css`：修复目录工具栏宽度声明被截断的问题。
- `mainline.html`、`events.html`、`behind-scenes.html`：删除多余 `</main>`，恢复唯一主内容结构。
- `scripts/validate-archive.mjs`：新增正式数据、媒体字段、日期、版权、域名、本地封面和 ID 集合校验。
- `scripts/capture-r1-baseline.mjs`：新增正式路由截图、意外外联硬阻断、页面结构检查和 8 条浏览器深链回归。
- `scripts/check-formal-site-gate.py`：扩展正式文件门禁，自动发现直接依赖并修复 `UNTRACKED` 未失败的问题。
- `artifacts/archive-contract.json`：冻结正式集合计数、ID、路由、查询参数与 Hash 契约。
- `artifacts/formal-site-gate-baseline.json`：记录 38 个正式文件及直接依赖指纹。
- `artifacts/r1-baseline/report.json`：记录 24 张截图、8 条深链、外联与阻断结果。
- `artifacts/r1-baseline/*.png`：新增 24 张正式路由桌面、移动和减动效视觉基线。
- `.hallmark/log.json`：记录本轮 studied-DNA 设计来源、结构与 critique。
- `progress.md`：追加本轮 M0 实施、验证、审查与回滚记录。
- 回滚点：以本条记录开始前的脏工作树为边界，仅定点逆向上述文件中的 M0 hunks，并删除本轮新增的 `design.md`、媒体政策、媒体目录、两张 fallback、`assets/fonts/`、三个 M0 脚本及三个 `artifacts/` 基线；不要回退 S1/S1.1/Skew Stage 既有样式与 54 张立绘，也不要执行整仓 `git restore`、`checkout` 或 `reset --hard`。

## 2026-07-20 - Task: 按游戏参考重做代理人选人工作台斜切视觉

### What was done
- 在现有 HOOXI 代理人工作台上重构右侧花名册视觉：三列卡片采用顶部偏左、底部偏右的平行四边形轮廓，列与行共同形成左上至右下推进的阶梯轨道；保留黑色分隔缝和上下越界构图。
- 卡片只显示头部裁切，头像和文字保持正立；外层轮廓、选中框、背景板斜缝与黄绿色 SELECT 装饰轨统一为同一方向。
- 左下 HUD 接入当前代理人的 S/A/I 等级、生日/好感信息、基础/技能/装备摘要和档案深链；切换角色继续复用已有 wipe、URL、筛选、键盘和 ARIA 联动。
- 修复移动端仍继承桌面右栏立绘安全区的问题，使 320/375/414/768 宽度下主立绘恢复接近整屏展示，同时保持无横向溢出。
- 本轮未改其它正式页面业务文件，也没有复制官方 wiki 页面结构；保持 HOOXI 档案站定位。

### Testing
- `node --check stories.js` 通过；`git diff --check -- stories.html stories.js theme-zzz.css` 无 whitespace error，仅有既有 LF/CRLF 提示。
- 浏览器桌面验证：三列任务栏从左上向右下推进；卡片 `clip-path` 为 `polygon(0 0, 88% 0, 100% 100%, 12% 100%)`；板面斜缝与 SELECT 绿色轨道方向一致。
- 点击 `rina` 后 HUD 显示 `亚历山德丽娜·莎芭丝缇安`、`S`、`BOND September 23rd`、`专属音擎 / Weeping Cradle · 打击`，档案链接为 `character.html?id=rina`。
- 320/375/414/768 响应式复测：`scrollWidth === innerWidth`；立绘宽度分别为 301/353/389/722px，无横向溢出。
- `npm run test:content`：8 组档案媒体校验全部通过。
- `npm run test:ui`：24/24 正式截图、8/8 深链通过，blocking failures 为 0。
- 正式门禁授权刷新后复跑 `npm run test:formal`：38 个正式文件全部 `OK`，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。

### Notes
- `stories.html`：新增/整理左下快捷 HUD，并刷新本轮 CSS/JS 缓存参数。
- `stories.js`：将选中代理人的等级、生日/信赖和装备摘要联动到 HUD，强化花名册选中态数据输出。
- `theme-zzz.css`：新增游戏参考复刻层，完成右下方向斜切卡、三列阶梯轨道、头部裁切、SELECT 装饰轨、HUD 与移动端立绘覆盖。
- `.hallmark/log.json`：记录本轮同一宏结构下的方向、clip 与移动端变化旋钮。
- `artifacts/hooxi-game-select-replica-desktop.png`、`artifacts/hooxi-game-select-direction-fixed.png`、`artifacts/hooxi-game-select-mobile-375.png`、`artifacts/hooxi-game-select-mobile-375-final.png`：本轮视觉验收图。
- `artifacts/r1-baseline/`、`artifacts/formal-site-gate-baseline.json`：刷新正式 UI 与文件指纹基线。
- `progress.md`、`spec://tasks.json`：追加验证记录并将本任务标记完成。
- 回滚：仅定点逆向 `stories.html`、`stories.js`、`theme-zzz.css` 本轮斜切/HUD/移动端覆盖，删除四张 `hooxi-game-select-*.png`，恢复 `.hallmark/log.json` 首条记录和两套基线后删除本段 progress；不要还原其它正式页面或用户既有未提交改动，不执行整仓 `restore`、`checkout` 或 `reset --hard`。

## 2026-07-20 - Task: 打包交付正式网站并复查历史遗漏任务

### What was done
- 生成完整可运行的网站交付包，保留正式页面、进店页、运行时脚本样式、本地字体、图标、角色立绘、封面与完整音乐播放列表，并在包内增加中文使用说明和 Windows 一键启动脚本。
- 从交付包中排除 Git 数据、`node_modules`、后端目录、`.env`、原始参考素材、开发原型、测试产物与账号配置，避免泄露和无关体积。
- 交叉核对历史对话、`progress.md`、`docs/`、Git 记录和 `spec://tasks.json`，将历史事项区分为已完成、已取消/替代、后续可选和真实剩余欠账。
- 复查确认：正式站门禁与本轮交付不再存在阻塞项；真实剩余欠账集中在占位剧情/活动数据、幕后内容为空、角色关系字段未补、少量角色仍使用紧凑回退图，以及本轮最新版尚未部署到远端站点。这些均不阻止本地完整包运行。

### Testing
- `python scripts/check-formal-site-gate.py --write`：此前本轮已通过，正式站指纹与门禁满足。
- `npm run test:formal`：此前本轮已通过，正式站页面与结构测试通过。
- `npm run test:ui`：此前本轮已通过，24 张正式页面截图及 8 条深链全部通过，`blockingFailures: 0`。
- `npm run test:content`：此前本轮已通过，档案 ID、媒体 ID、URL 协议、canonical 域名和本地封面检查通过。
- ZIP 完整性：`ZipFile.testzip()` 返回空；交付包共 219 个文件，大小 114.03 MiB，SHA-256 为 `124f0788dbf3d7a675abca0eb7a8d8d90818815166ec5baeda2b12108840234f`；`start_server.py` 语法检查通过，浏览器会在服务器启动后打开，避免启动竞态。
- 交付包安全扫描：未发现 `backend/`、`.env`、`.git/`、`node_modules/`、`reference-materials/` 或 `prototype/`；首页、代理人工作台、样式、立绘、音频、启动脚本与使用说明均存在。

### Notes
- `artifacts/hooxi-website-full-2026-07-20.zip`：新增正式网站完整交付包。
- `progress.md`：追加本轮打包、验证和历史遗漏复查结论。
- `spec://tasks.json`：交付与历史复查任务均收口为完成。
- 回滚点：删除 `artifacts/hooxi-website-full-2026-07-20.zip`，并删除 `progress.md` 末尾本节；本轮未修改正式站源码。

## 2026-07-20 - Task: 修正代理人斜切名单、主题色与鼠标互动

### What was done
- 将代理人名单从“斜切面板中的矩形卡片墙”收口为统一 18% 裁切的平行斜轨：宽屏三轨按 48/24/0px 高差排列并逐行右移，881–1180px 收敛为双轨，移动端保留卡片斜切但取消桌面覆盖接缝。
- 移除固定荧光绿选中皮肤，SELECT 侧轨、选中卡、舞台信号与滚动条统一跟随当前代理人主题色；Aria 实测为 `#ef8fc0` 粉色，角色切换后颜色同步提交。
- 将永久 RAF 自动漂移替换为输入驱动反馈：正常动效模式下鼠标驱动舞台网格、大字、装饰环、立绘与卡内肖像的小幅位移，角色切换保留主题色 wipe；减少动效模式保留颜色、文本、焦点和轨道位置但取消空间反馈。
- 发现原 `8000` 端口由失效旧目录进程提供过期 `s1-6/s1-5` 文件，已停止旧服务并从 `F:\hooxi-zzz` 正式源目录重启，因此现有预览地址直接加载本轮 `s1-7`。

### Testing
- `node --check stories.js`：通过。
- `npm run test:content`：本轮首次执行通过，8 组档案媒体与 URL 契约检查全部 PASS；收口阶段未再修改数据或校验逻辑，未重复执行包装命令。
- `node scripts/regression.mjs`：38/38 通过；覆盖 1920、1440、1180、881、768、414、375、320 宽度，验证无横向溢出、统一斜切、桌面平行轨、主题 SELECT、鼠标舞台/卡片反馈、切换 wipe 与 reduced-motion。
- `python scripts/check-formal-site-gate.py --write && python scripts/check-formal-site-gate.py`：正式站 38 个文件指纹刷新后全部 `OK`，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- `http://127.0.0.1:8000/stories.html?agent=aria` 独立浏览器复测：加载 `theme-zzz.css?v=s1-7-roster-input` 与 `stories.js?v=s1-7-roster-input`；SELECT、选中卡均为 `rgb(239, 143, 192)`，卡片裁切为 `polygon(0 0, 82% 0, 100% 100%, 18% 100%)`，控制台零错误，`scrollWidth === innerWidth`。
- `.hallmark/log.json` 与 `artifacts/formal-site-gate-baseline.json` 均通过 JSON 解析；`git diff --check` 未发现 whitespace error，仅报告既有 LF/CRLF 提示。

### Notes
- `stories.html`：刷新角色页 CSS/JS 缓存版本为 `s1-7-roster-input`。
- `stories.js`：名单逐行轨道偏移改为封顶 48px；新增事件驱动舞台与卡内肖像反馈，删除永久自动漂移。
- `theme-zzz.css`：强化统一斜切轮廓、平行轨道、动态主题 SELECT/选中态、正常/减少动效状态及响应式双轨/移动规则。
- `scripts/regression.mjs`：改为角色名单专用 38 项 Playwright 回归入口。
- `docs/HOOXI-S1-REFACTOR-NOTE.md`：追加 S1.7 行为、响应式和预览服务说明。
- `.hallmark/log.json`：追加 `archive/character-directory` 范围的 Hallmark 实施记录。
- `artifacts/agent-select-roster.png`：更新 1440×900 正常动效视觉基线。
- `artifacts/formal-site-gate-baseline.json`：按本次明确施工授权刷新正式站指纹。
- `progress.md`、`spec://tasks.json`：追加本轮验证证据并收口任务状态。
- 回滚点：仅定点恢复 `stories.html` 的 `s1-7` 缓存参数、`stories.js` 的 `trackShift` 与 Pointer input IIFE、`theme-zzz.css` 的 S1.7 段和本轮 reduced-motion 修正；恢复 `scripts/regression.mjs`、`docs/HOOXI-S1-REFACTOR-NOTE.md`、`.hallmark/log.json`、`artifacts/agent-select-roster.png`、`artifacts/formal-site-gate-baseline.json` 到本轮前版本，并删除本段 progress。不要还原其它用户既有未提交改动，不执行整仓 `restore`、`checkout` 或 `reset --hard`。

## 2026-07-21 - Task: 实施并验证全屏游戏客户端式角色选择界面

### What was done
- 将正式 `stories.html` 收敛为 React 挂载入口，以 `src/stories.jsx` 统一管理 56 名代理人的选择、搜索、阵营筛选、收藏、键盘导航、URL 深链、切换 wipe 与减动效状态，并构建为正式 `stories.js`。
- 保留 HOOXI Parallel Skew Roster Stage：桌面左侧全身人物舞台、基础/技能/装备轨和档案信息，右侧主题色斜切三列花名册；移除重复头像和残留 SELECT 文本，筛选改为按需展开。
- 修复移动端初次渲染会自动滚到选中卡、跳过舞台和档案信息的问题；仅在用户后续主动切换时滚动名单。
- 将选角回归改为自启临时静态服务；UI 回归默认写入带时间戳的新目录，不再删除既有基线；测试不再隐式覆盖正式 `stories.js`，同时提供显式正式构建和安全草稿构建命令。
- 同步定位文档、Hallmark 记录和正式文件门禁基线。

### Testing
- `npm run test:content`：8 组档案媒体与 URL 契约全部通过。
- `npm run test:stories`：38/38 通过，覆盖 1920/1440/1180/881/768/414/375/320、斜切卡、平行轨、动态主题、指针反馈、角色切换和 reduced-motion。
- `npm run test:ui`：最终 24/24 截图、8/8 深链、`blockingFailures: 0`、`passed: true`；输出 `artifacts/r1-baseline-20260721-084620/`。
- 桌面、移动与 reduced-motion 截图人工复核：桌面左舞台/左分类轨/右斜切名单完整；移动端首屏从舞台开始，不再跳到名单中段；无横向溢出。
- `python scripts/check-formal-site-gate.py --write && npm run test:formal`：38 个正式文件全部 `OK`，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- `npm run build:stories:draft`：成功生成 `artifacts/stories-draft.js`，不覆盖正式脚本。
- `.hallmark/log.json` 与最终 UI `report.json` JSON 解析通过；目标文件 `git diff --check` 无 whitespace error，仅有既有 LF/CRLF 提示。

### Notes
- `src/stories.jsx`：React 选角应用源，负责筛选、收藏、键盘、深链、wipe、响应式滚动与编辑绑定。
- `stories.html`：改为 `#storiesRoot` 正式挂载点并刷新脚本缓存参数。
- `stories.js`：由 React 源构建的正式浏览器产物。
- `theme-zzz.css`：补 React 客户端控件、左侧分类轨、收藏/筛选状态、档案标题与移动端规则。
- `package.json`：新增显式正式/草稿构建命令，测试入口保持非破坏性。
- `scripts/regression.mjs`：选角回归自启临时静态服务，并确保截图目录存在。
- `scripts/capture-r1-baseline.mjs`：UI 回归改为时间戳输出目录，不再清空既有证据。
- `docs/README.md`、`docs/zzz-archive-positioning.md`：同步 React 构建入口、回归输出和移动端行为。
- `.hallmark/log.json`：记录正式 React 全屏工作台的宏结构、来源边界与审查结论。
- `artifacts/r1-baseline-20260721-084620/`：最终 24 张视觉证据与回归报告。
- `artifacts/stories-draft.js`：安全草稿构建产物。
- `artifacts/formal-site-gate-baseline.json`：按本轮明确施工刷新正式站 38 文件指纹。
- `progress.md`：本段；`spec://tasks.json`：当前任务标记完成。
- 回滚：定点恢复 `src/stories.jsx`、`stories.html`、`stories.js`、`theme-zzz.css`、`package.json`、两个回归脚本、两份 docs、Hallmark 记录和正式门禁基线到本轮前状态，删除本轮两个 `r1-baseline-20260721-*` 目录与 `artifacts/stories-draft.js`，再删除本段 progress；不要执行整仓 `restore`、`checkout` 或 `reset --hard`，避免覆盖用户其它未提交工作。

## 2026-07-21 - Task: 修复选角验收的立绘、切线、互动与等级徽章问题

### What was done
- 根据用户验收截图重建可判红的浏览器几何回归，确认旧 hover transform 覆盖轨道、伪内框斜率不等距、等级徽章进入切角裁剪区和舞台立绘透入信息层四个根因。
- 舞台使用共享信息层高度，将桌面透明立绘硬裁切在档案信息层上方；移动端保持流式布局和完整人物展示。
- 花名册卡片改为单一外层多边形主题框 + 平行内缩图面，删除 `border + clip-path: inherit` 伪描边；1440 三列和 881 双列均检查 selected/未选卡的切线平行与边框距离。
- 互动拆分为选中基态与 hover/focus/active 临时增量，接通舞台指针变量并收敛移动幅度，避免卡片脱轨、突然放大和按压反向跳动。
- 等级回归覆盖所有可见卡片，徽章文本必须与源数据一致且四角全部位于斜切 polygon 内；不把特殊等级强行改写成 S/A。

### Testing
- 新回归首次运行稳定抓到 `hover-retains-track-and-consumes-pan`、`grades-stay-inside-cut-polygon`、`compact-stage-branch-is-independent` 等失败；修复后 `npm run test:stories` → 46/46 通过。
- 代表角色安比、艾莲、星见雅通过同源 alpha bbox 检查：可见人物高度/宽度达标，底边不越过信息层顶边；compact 卡面分支独立。
- `npm run test:content`：8 组档案媒体与 URL 契约全部通过。
- `npm run test:ui`：最终 24/24 截图、8/8 深链、阻断 0、`passed: true`；输出 `artifacts/r1-baseline-20260721-093115/`。
- 人工复核最终桌面、移动与 reduced-motion 截图：立绘不再透入信息层，S/A 徽章完整，内外切线平行，移动端舞台顺序正常。
- `python scripts/check-formal-site-gate.py --write && npm run test:formal`：38 个正式文件全部 `OK`，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- `git diff --check`：目标实现文件无 whitespace error，仅有既有 LF/CRLF 提示。

### Notes
- `scripts/regression.mjs`：选角回归从 38 项扩展至 46 项，新增轨道/pan、全等级徽章、两断点边框几何、alpha bbox 与信息层边界检查。
- `src/stories.jsx`：接通并收敛舞台/卡片指针反馈。
- `theme-zzz.css`：共享舞台信息层高度、单一多边形边框、等级安全区和连续互动变量。
- `stories.js`：由修复后的 React 源重新构建。
- `docs/zzz-archive-positioning.md`：记录本轮正式视觉行为和等级边界。
- `.hallmark/log.json`：更新本轮验收问题与修复审查。
- `artifacts/r1-baseline-20260721-093115/`：最终全站视觉证据与报告。
- `artifacts/agent-select-roster.png`：更新 1440 选角交互截图。
- `artifacts/formal-site-gate-baseline.json`：刷新本轮授权修改后的正式指纹。
- `progress.md`：本段；`spec://tasks.json`：本任务完成。
- 回滚：定点恢复上述 4 个实现文件、定位文档、Hallmark 记录与正式门禁基线到本轮前状态，删除 `artifacts/r1-baseline-20260721-093115/` 并恢复 `artifacts/agent-select-roster.png`，再删除本段 progress；不要执行整仓 `restore`、`checkout` 或 `reset --hard`。

## 2026-07-21 - Task: 将左侧角色舞台统一为腰部近景并修正爱芮降级图

### What was done
- 按用户新验收口径将普通透明立绘从全身小人放大为头部至腰/髋部近景，桌面与移动端分别控制源图显示下缘、纵向跨度和头顶安全区。
- 安比、艾莲、星见雅等普通角色继续使用透明立绘，放大后仍硬裁切在信息层上方，不透入姓名和按钮区域。
- 爱芮、千夏缺少可信透明全身图时继续诚实使用现有卡面，但删除小档案框和满屏 `cover` 巨幅脸部裁切，改为无边框 `contain` 腰部近景。
- 收紧 Playwright 回归：普通代表角色在 1440×900 与 390×844 均要求源图下缘约 55%–72%、纵向跨度不超过 68%；特殊卡面角色要求显示源图上部至约 69%、桌面宽度占比合理、移动端不横向溢出。

### Testing
- 收紧普通角色近景断言后，旧构图因源图下缘约 86.2%、仍接近全身而判红；修复后桌面下缘约 67.6%–70.5%，移动端约 61.7%–70.4%。
- 爱芮旧 compact 构图首次判红：小档案框仅约 22.6% 舞台宽、带 1px 边框；改为 `cover` 后人工复核发现脸部过裁，再改为 `contain` 145% 高度，源图显示下缘约 68.97%。
- `npm run test:stories`：48/48 通过，覆盖普通与 compact 角色的桌面/移动腰部近景、无边框、等级、斜切、互动及 reduced-motion。
- `npm run test:ui`：24/24 截图、8/8 深链、阻断 0、`passed: true`；最终报告 `artifacts/r1-baseline-20260721-102634/report.json`。
- 人工复核 `artifacts/accept-aria-waist-final-v2.png`、`accept-sunna-waist-final-v2.png` 及对应 mobile 图：头部完整、下缘到腰部附近，无小框、无巨幅裁脸。
- `python scripts/check-formal-site-gate.py --write && npm run test:formal`：38 个正式文件全部 `OK`，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- Hallmark JSON 解析与目标文件 `git diff --check` 通过，仅有既有 LF/CRLF 提示。

### Notes
- `theme-zzz.css`：普通透明立绘桌面/移动端近景缩放；compact 卡面无边框 `contain` 头到腰构图。
- `scripts/regression.mjs`：选角回归增至 48 项，新增普通/compact 桌面移动端源图裁切约束。
- `src/stories.jsx`：保留角色模式和舞台 ID 数据供构图分支及回归使用。
- `stories.js`：由最终 React 源重新构建。
- `docs/zzz-archive-positioning.md`：记录统一腰部近景和特殊卡面诚实降级规则。
- `.hallmark/log.json`：更新腰部舞台构图的设计审查记录。
- `artifacts/r1-baseline-20260721-102634/`：最终全站视觉证据与报告。
- `artifacts/accept-aria-waist-final-v2.png`、`accept-sunna-waist-final-v2.png`、`accept-aria-waist-mobile-v2.png`、`accept-sunna-waist-mobile-v2.png`：特殊角色验收截图。
- `artifacts/formal-site-gate-baseline.json`：刷新本轮授权修改后的正式指纹。
- `progress.md`：本段；`spec://tasks.json`：本任务完成。
- 回滚：定点恢复上述 4 个实现文件、定位文档、Hallmark 记录与正式门禁基线，删除本轮 waist/compact 验收图及 `artifacts/r1-baseline-20260721-102634/`，再删除本段 progress；不要执行整仓 `restore`、`checkout` 或 `reset --hard`。

## 2026-07-21 - Task: 优化全站 UI 可读性、动态背景与 HOOXI 页面加载转场

### What was done
- 为 `index.html`、`mainline.html`、`stories.html`、`character.html`、`faction.html`、`events.html`、`behind-scenes.html` 7 个核心公开页接入共享 `site-motion.js`；角色/选角页未强行挂载依赖音乐控件的 `app.js`，编辑器也未增加电影式遮挡。
- 公共脚本注入 pointer / scroll 响应的克制信号背景和 `HOOXI // LOADING` 同源页面转场；普通左键同源页面链接进入短暂 handoff 状态后导航，排除外链、hash-only、target、download、修饰键和非页面资源，并在 `pageshow` / BFCache 后恢复隐藏。
- `motion.css` 完成信号背景、进度轨和路由状态层，新增动效只使用 transform / opacity；移动端降低景深强度，`prefers-reduced-motion` 下停止空间位移，内容读取、历史和页面滚动不依赖动画。
- `theme-zzz.css` 修复角色详情资料卡、标签、长文和模块导航的深色可读性及移动端溢出，同时强化选角页左侧人物/信息层与右侧名单、标题和控件的层级；保留腰部近景、compact 分支、斜切和等级徽章几何。
- `scripts/capture-r1-baseline.mjs` 增加 7 页公共层存在性、角色 profile 资料单元计算样式/正文可见性，以及同源点击期间 loader `leaving` 状态和最终导航的最小回归；相关静态资源查询参数已更新以规避旧缓存。

### Testing
- `npm run test:content`：8 组档案媒体、URL 与内容契约全部通过。
- `npm run test:stories`：48/48 通过，既有腰部近景、compact、斜切、等级、互动与 reduced-motion 回归保持通过。
- `npm run test:ui`：24/24 正式页面截图、8/8 深链、1/1 同源 route-loader 交互检查通过，`blockingFailures: 0`。
- 无产物定向浏览器复核：7 个公开页均存在且仅存在 1 个 signal field 与 route loader；角色资料单元 computed background 为 `rgb(21, 25, 34)`、正文为 `rgb(244, 241, 234)` / 16px 且可见；390px 角色页横向溢出为 0；reduced-motion 信号层无空间变换；同源点击期间 loader 为 `leaving` 并完成导航。
- `python scripts/check-formal-site-gate.py --write` 后正式门禁基线包含 39 个文件，并确认直接引用发现的 `site-motion.js` 已纳入。
- 人工验收图：`artifacts/accept-hooxi-loading.png`、`artifacts/accept-character-readable.png`、`artifacts/accept-stories-dynamic-ui.png`。
- `site-motion.js`、`scripts/capture-r1-baseline.mjs` 通过 `node --check`；目标差异 `git diff --check` 无 whitespace error，仅有既有 LF/CRLF 提示。

### Notes
- `site-motion.js`：新增 7 个核心公开页共享的动态信号背景、同源路由 handoff、ARIA 状态与 BFCache 恢复逻辑。
- `motion.css`：新增 signal field、HOOXI route loader、移动端和 reduced-motion 样式。
- `theme-zzz.css`：新增角色详情深色可读性和选角页层级强化覆盖。
- `index.html`、`mainline.html`、`stories.html`、`character.html`、`faction.html`、`events.html`、`behind-scenes.html`：挂载公共脚本并刷新相关 motion / theme / site-motion 缓存参数。
- `scripts/capture-r1-baseline.mjs`：增加公共动效层、角色资料可读性和同源转场交互回归；保持时间戳非破坏性输出。
- `artifacts/formal-site-gate-baseline.json`：按明确授权刷新为 39 个正式文件，并包含 `site-motion.js`。
- `artifacts/accept-hooxi-loading.png`、`artifacts/accept-character-readable.png`、`artifacts/accept-stories-dynamic-ui.png`：本轮加载层、角色可读性和选角层级人工验收图。
- `docs/zzz-archive-positioning.md`：追加全站动态、可读性、减动效与编辑器边界。
- `docs/README.md`：补充 `site-motion.js` 的 7 页共享关系和发布门禁要求。
- `.hallmark/log.json`：在数组首部记录 Signal Workbench 路由转场与角色详情设计审查。
- `progress.md`：追加本轮实现、验证、正式门禁、验收图和回滚记录。
- 定点回滚：删除 `site-motion.js`；从 7 个公开 HTML 定点移除 `site-motion.js` 引用并恢复本轮 motion/theme 查询参数；从 `motion.css` 删除 shared signal/route handoff 段，从 `theme-zzz.css` 删除角色详情与 stories 层级收口段，从 `scripts/capture-r1-baseline.mjs` 删除 `public-motion-layers`、profile computed-style 和 `same-origin-route-loader` 回归；删除三张 `accept-*.png` 验收图及本节 docs/progress 和 Hallmark 首条记录；完成代码定点回退后执行 `python scripts/check-formal-site-gate.py --write` 重建对应正式指纹。不要整仓 `restore`、`checkout` 或 `reset --hard`，不要覆盖用户其它未提交改动。

## 2026-07-21 - Task: 修复花名册姓名裁切并收紧卡片视觉缝隙

### What was done
- 将角色姓名移入 18% 斜切底部安全区，取消省略号与隐藏裁切；仅对全站最长姓名做定点字号收敛，其他角色保持原有可读尺度。
- 将桌面三列卡片改为按 0/-18%/-36% 横向咬合，行列间距收紧为游戏式细缝；同步收紧桌面、双列和移动端的递减轨道错位。
- 增加姓名完整可见与平行斜边视觉缝隙的 Playwright 几何回归，防止后续样式再次出现截名或卡片间大块空隙。

### Testing
- 新增断言首次执行稳定判红：56 张卡均命中既有 ellipsis 规则，桌面相邻斜边水平缝隙约 38.07px、纵向缝隙 10px。
- 修复后执行 `npm run test:stories`：52/52 通过，`failures: []`；姓名完整显示、水平可见缝隙 0–8px、纵向缝隙 0–6px及既有斜切、等级、互动、响应式和 reduced-motion 检查全部通过。

### Notes
- `theme-zzz.css`：调整花名册列咬合、行列间距、轨道错位、姓名安全区和最长姓名字号。
- `scripts/regression.mjs`：新增姓名完整可见与卡片视觉缝隙几何回归。
- `docs/zzz-archive-positioning.md`：记录花名册姓名安全区和紧凑缝隙的稳定约束。
- `progress.md`：追加本轮实现、判红证据、验证与回滚记录。
- 回滚：仅定点移除 `theme-zzz.css` 本轮姓名安全区、列偏移与小错位规则，移除 `scripts/regression.mjs` 的两项新增检查及定位文档本节，再删除本段日志；不要整仓还原或覆盖工作区其它既有改动。

## 2026-07-20 - Task: 接入代理人职级晋升成长数据
### What was done
- 扩展本地 Wiki enrichment 抽取，仅识别含“职级晋升”和“滑动滑块”的真实成长组件，生成最多 8 阶段的纯文本属性与有限材料字段，不向浏览器透传原始 HTML。
- 将成长数据接入角色目录合并层并设为 enrichment 优先；角色页养成材料页签改为可切换的真实阶段、属性块和材料列表，保留无数据占位与 `#growth` 到 `#story` 的兼容行为。
- 材料图标仅允许同源或 mihoyo/miyoushe 可信图床，材料链接仅允许 http/https；补充最小响应式样式和既有 Playwright 回归断言。

### Testing
- `python scripts/build-agent-enrichment.py`：扫描 59 个代理人页面、匹配 56 个 catalog 角色，56/56 均生成成长数据；安比、雨果、青衣样本均为 8 阶段，生成的 growth JSON 不含 HTML 标签。
- `node --check agent-catalog.js`、`node --check character.js`：通过。
- `node scripts/validate-archive.mjs`：8 组档案媒体校验全部通过。
- `node scripts/capture-r1-baseline.mjs`：24 张截图完成，新增成长内容、阶段切换及 `#growth` 深链断言均通过（deep links 9/9、interaction 1/1）；全量结果因角色页可信米哈游外部图标请求被既有“任何外部请求即阻断”规则记为 24 个阻断，页面错误、控制台错误、本地请求失败和横向溢出均为 0。
- 定向 Playwright（1440×900、375×812）：安比显示“总计/初始/10/20/30/40/50/满级”8 阶段，总计 11 项材料；切换满级后对应面板和材料可见；两视口 `scrollWidth - innerWidth = 0`，console/page errors 均为 0；`#growth` 最终为 `#story` 且 STORY 状态正确。

### Notes
- `scripts/build-agent-enrichment.py`：新增真实职级晋升识别、纯文本属性/材料抽取、数量限制与 growth 评分。
- `artifacts/agent-enrichment.json`、`agent-enrichment.js`：由脚本重新生成含成长字段的离线与运行时产物。
- `agent-catalog.js`：映射成长材料媒体 URL，并确保 enrichment-backed growth 不被旧数据覆盖。
- `character.js`：新增可信图片策略、成长阶段切换、属性与材料渲染。
- `theme-zzz.css`：新增成长阶段、属性、材料及窄屏最小样式。
- `scripts/capture-r1-baseline.mjs`：在既有角色页回归中增加安比成长内容与阶段切换断言。
- `docs/README.md`：更新 enrichment 字段边界、成长展示与 hash 兼容维护说明。
- `progress.md`：追加本轮实施与验证记录。
- 回滚：定点还原上述脚本、catalog、角色页、主题、测试和文档改动后重新执行 `python scripts/build-agent-enrichment.py` 生成旧结构产物，并删除本段日志；不要整文件或整仓还原，以免覆盖工作区既有改动。

## 2026-07-20 - Task: 修复正式门禁与键盘交互

### What was done
- 检查 `F:/website-archives/zzz-wiki/mirror` 后确认镜像仅保存响应 JSON，没有可可靠定位并复制的材料图标文件；采用正式站离线策略的无图降级，不下载网络资源，也不放宽零外联门禁。
- enrichment 不再输出材料图标字段；`agent-catalog.js` 不再把 Wiki 镜像相对路径还原为外部媒体 URL；`character.js` 撤销 mihoyo/miyoushe 图片域名放行。材料名称、数量、稀有度和点击详情外链保留，页面使用本地 CSS 等级标记，未声称图标可见。
- 职级晋升阶段补齐标准 ARIA tabs：tab/panel 唯一 ID 与双向关联、roving tabindex、方向键、Home、End 切换并聚焦；点击切换保持可用。
- 更新既有 R1 Playwright 深链检查，覆盖键盘切换、焦点、ARIA 关联和唯一活动 tabindex；同步最终文档策略。

### Testing
- `python scripts/build-agent-enrichment.py`：退出码 0；扫描 59、匹配 56、56/56 含成长数据，重写 `agent-enrichment.js`（582337 bytes）与 JSON 产物。
- `python -m py_compile scripts/build-agent-enrichment.py`：通过。
- `node --check agent-catalog.js && node --check character.js`：通过；另执行 `node --check scripts/capture-r1-baseline.mjs` 通过。
- `node scripts/validate-archive.mjs`：8/8 组档案媒体检查通过。
- `node scripts/capture-r1-baseline.mjs`：退出码 0；24/24 截图、9/9 深链、1/1 交互通过，`blockingFailures: 0`、`passed: true`，正式零外联门禁全绿。
- 定向 Playwright：1440×900 与 375×812 均为横向溢出 0、console errors 0、page errors 0、外部请求 0；8 个成长 tabs、单一可见 panel；`#growth` 均规范化为 `#story` 且状态为 STORY。
- `git diff --check -- scripts/build-agent-enrichment.py agent-enrichment.js artifacts/agent-enrichment.json agent-catalog.js character.js theme-zzz.css scripts/capture-r1-baseline.mjs docs/README.md progress.md`：通过，无 whitespace error；仅有既有 LF→CRLF 提示。

### Notes
- `scripts/build-agent-enrichment.py`：停止从镜像响应抽取材料图标 URL，保留材料事实和外部详情链接。
- `agent-enrichment.js`：重新生成的运行时成长数据，不含材料图标字段。
- `artifacts/agent-enrichment.json`：重新生成的离线 enrichment 产物，不含材料图标字段。
- `agent-catalog.js`：媒体映射仅保留同源路径，不还原 Wiki 相对路径为外部图床；材料详情链接保持点击外跳。
- `character.js`：图片只允许同源/data/blob；材料改为本地等级标记；成长 tabs 补齐 ARIA 与键盘模型。
- `theme-zzz.css`：新增材料无图等级标记样式。
- `scripts/capture-r1-baseline.mjs`：扩展现有成长检查，验证 ArrowRight、End、焦点、roving tabindex 和 tab/panel ARIA 关联。
- `docs/README.md`：记录材料图标无法可靠本地化后的真实无图策略及 tabs 键盘行为。
- `progress.md`：追加本轮正式门禁与键盘交互修复记录。
- 回滚：定点恢复以上文件的本节差异，再执行 `python scripts/build-agent-enrichment.py` 生成恢复后的产物；删除本节 progress。不要执行整仓 restore、checkout 或 reset，也不要放宽正式零外联门禁。

## 2026-07-22 - Task: 角色与阵营页视觉精调
### What was done
- 将右侧代理人名册收敛为有无 `backdrop-filter` 均可读的半透明深色层，保留既有斜切、平行卡片、姓名安全区、视觉缝隙与等级徽章几何。
- 加入两条由正式角色总数驱动、`aria-hidden` 的低对比真实 DOM 滚字；仅变换 `transform`，减动效静止，中小屏减弱并在窄屏隐藏第二条。
- 统一分类、筛选/收藏、档案深链、输入/下拉/清空控件的 4pt 间距、44px 目标、细边框、微内高光及 hover/focus/active/disabled 状态；主操作保持 HOOXI 黄色，未套用白色大圆角玻璃模板。
- 将桌面工作台高度从错误的 68px 顶栏扣除改为真实 78px 顶栏扣除，并移除角色目录页全局 110px 音乐坞预留，页脚紧跟工作台；移动端继续自然流且不裁名册。

### Testing
- `npm run build:stories`：通过，生成正式 `stories.js`（209.7kb）。
- `node scripts/validate-archive.mjs`：8/8 组档案媒体校验通过。
- `node scripts/regression.mjs`：85/85 通过；覆盖 1920×1080、1440×900、1180×800、881×800、768×900、414×896、375×812、320×700，无横溢、console/page error；新增滚字 DOM/ARIA、半透明面板、44px 控件、页脚贴合及 reduced-motion 静止门禁。
- `node scripts/capture-r1-baseline.mjs`：24/24 截图、9/9 深链、1/1 交互通过，`blockingFailures: 0`；报告位于 `artifacts/r1-baseline-20260722-065529/report.json`。
- `git diff --check -- src/stories.jsx stories.js theme-zzz.css scripts/regression.mjs .hallmark/log.json`：通过，仅有既有 LF→CRLF 提示。

### Notes
- `src/stories.jsx`：新增动态角色总数驱动的双层真实 DOM 滚字。
- `stories.js`：由本轮 React 源重新构建的正式产物。
- `theme-zzz.css`：新增本 scope Hallmark stamp、半透明名册、滚字、控件状态和紧凑页脚规则。
- `scripts/regression.mjs`：增加滚字、透明层、控件目标、页脚空白与减动效断言。
- `.hallmark/log.json`：前置追加 2026-07-22 `archive/character-directory` studied-DNA 记录。
- `artifacts/agent-select-roster.png`：角色目录回归更新的 1440×900 视觉截图。
- `artifacts/r1-baseline-20260722-065529/`：本轮 24 张全站回归截图与报告。
- `progress.md`：追加本轮实施与验证记录。
- 回滚：定点删除 `src/stories.jsx` 的 `agent-roster-tickers` 节点、`theme-zzz.css` 末尾 2026-07-22 scope 段、`scripts/regression.mjs` 本轮新增断言和 `.hallmark/log.json` 首条记录后重新执行 `npm run build:stories`；恢复 `artifacts/agent-select-roster.png` 并删除 `artifacts/r1-baseline-20260722-065529/` 与本段日志。不要整仓 restore、checkout 或 reset。

## 2026-07-22 - Task: 修复视觉验收缺陷
### What was done
- 修复花名册负向轨道造成的跨卡姓名挤压：保持平行斜切卡几何，恢复紧凑但不侵入文字安全区的轨道幅度，姓名在卡内允许最多两行，最长姓名使用可读的定点规则且不省略、不截断。
- 将筛选/收藏从单字方块改为带线性图形和完整中文的 44px HOOXI 控制条；分类改为细长索引与短高亮线，保留中文语义、ARIA 和键盘行为。
- 降低右栏黑层到可感知舞台色雾的半透明层，滚字改为选中主题与正文混色、低对比的小一档字幕；资料区顶部加入透明渐变并压缩信息节奏，1440×900 下四个档案入口完整显示。
- 强化 Playwright 验收：逐行检查 56 个姓名位于卡片可见安全多边形内、最多两行且不截断，任意相邻姓名矩形不得相交；同时约束 panel alpha、ticker 可见度、桌面主要按钮完整位于 viewport/工作台内及多视口无横溢、错误和 reduced-motion。
- 更新 1440×900 `artifacts/agent-select-roster.png` 并人工审图，确认首屏可见姓名不再跨卡叠字、按钮完整、右栏可见克制色雾和背景字幕、底部档案按钮未贴边截断。

### Testing
- `npm run build:stories`：通过，生成正式 `stories.js`（209.9kb）。
- `node scripts/validate-archive.mjs`：8/8 组档案媒体校验通过。
- `node scripts/regression.mjs`：95/95 通过，`failures: []`；覆盖 1920×1080、1440×900、1180×800、881×800、768×900、414×896、375×812、320×700，以及姓名互斥/安全多边形/完整长名、控件边界、panel alpha、ticker、footer、无横溢、console/page error 和 reduced-motion。
- `node scripts/capture-r1-baseline.mjs`：24/24 截图、9/9 深链、1/1 交互通过，`blockingFailures: 0`、`passed: true`；报告位于 `artifacts/r1-baseline-20260722-070959/report.json`。
- 人工视觉复核 `artifacts/agent-select-roster.png`：1440×900 首屏姓名均在各自卡内，长名两行可读，筛选/收藏与分类控件不再呈调试方块，档案按钮完整，工作台正好落到视口底边且无空黑。

### Notes
- `src/stories.jsx`：筛选/收藏改为线性图形加完整中文可见文本，保留原 aria-label、expanded/pressed 与禁用语义。
- `stories.js`：由本轮 React 源重新构建的正式产物。
- `theme-zzz.css`：追加本 scope 的姓名安全区、轨道、精细控制条、透明右栏、主题滚字、资料渐变与 900px 底部布局修复。
- `scripts/regression.mjs`：新增姓名相邻矩形互斥、两行/完整文本、安全多边形、panel alpha、ticker opacity 与按钮 viewport/工作台边界断言。
- `.hallmark/log.json`：前置本轮视觉验收修复记录与 critique。
- `artifacts/agent-select-roster.png`：更新后的 1440×900 角色工作台视觉验收图。
- `artifacts/r1-baseline-20260722-070959/`：本轮全站 UI 回归截图和报告。
- `progress.md`：本段。
- 回滚：定点移除 `src/stories.jsx` 本轮两个控制按钮内部图文节点，删除 `theme-zzz.css` 末尾“visual acceptance repair”段和 `scripts/regression.mjs` 本轮增强断言，重新执行 `npm run build:stories`；移除 `.hallmark/log.json` 首条记录，恢复 `artifacts/agent-select-roster.png` 并删除 `artifacts/r1-baseline-20260722-070959/` 与本段日志。不要执行整仓 restore、checkout、reset 或覆盖其它未提交改动。

## 2026-07-22 - Task: 收口花名册短显示名
### What was done
- 为确实过长或带正式全名的卡片加入显式常用短称，丽娜卡片由正式全名改为“丽娜”；没有使用算法截断、ellipsis 或继续单独缩小字号。
- 卡片短称仅属于显示层，不再标记为角色姓名编辑字段；角色目录数据、卡片 aria-label、选中详情与正式编辑字段继续使用完整姓名。
- 统一卡名为最多两行、稳定行高和更充足的底部高度及斜切安全内边距，并强化可读性、裁切、相交和完整姓名语义回归。
- 更新 1440×900 视觉验收图并人工复核：第一、二排姓名分别为“丽娜 / 爱丽丝 / 安比·德玛拉”和“安东·伊万诺夫 / 爱芮 / 浅羽悠真”，均可一眼辨认且不贴边。

### Testing
- `npm run build:stories`：通过，生成正式 `stories.js`（210.5kb）。
- `node scripts/validate-archive.mjs`：8/8 组档案媒体校验通过。
- `node scripts/regression.mjs`：98/98 通过，`failures: []`；新增短显示名非空与合理长度、最多两行、无裁切、无 ellipsis、相邻不相交、全名 aria-label、丽娜短称及选中详情完整姓名断言。
- `node scripts/capture-r1-baseline.mjs`：24/24 截图、9/9 深链、1/1 交互通过，`blockingFailures: 0`、`passed: true`。
- 人工视觉复核 `artifacts/agent-select-roster.png`：第一排和第二排所有卡名清楚、未贴斜切边，丽娜不再出现多行乱码感。

### Notes
- `src/stories.jsx`：新增最小显式短称映射与 `rosterDisplayName`，卡片显示短称且移除姓名编辑绑定，完整 aria-label 与详情姓名保持不变。
- `stories.js`：由本轮 React 源重新构建的正式产物。
- `theme-zzz.css`：统一卡名两行高度、行高与斜切安全内边距，移除丽娜专门缩字规则。
- `scripts/regression.mjs`：新增显示名可读性、完整 aria 姓名、丽娜短称和详情完整姓名回归。
- `.hallmark/log.json`：前置追加短显示层实施记录，明确 catalog 完整数据不变。
- `artifacts/agent-select-roster.png`：更新后的 1440×900 花名册视觉验收图。
- `artifacts/r1-baseline-20260722-071707/`：本轮全站 UI 回归截图与报告。
- `progress.md`：追加本轮实施、测试与回滚记录。
- 回滚：定点删除 `src/stories.jsx` 的 `ROSTER_DISPLAY_NAMES`、`rosterDisplayName` 与卡片短称调用并恢复卡名编辑属性；恢复 `theme-zzz.css` 本轮卡名区域规则；删除 `scripts/regression.mjs` 本轮四类短称/完整姓名断言和 `.hallmark/log.json` 首条记录，再执行 `npm run build:stories`；恢复 `artifacts/agent-select-roster.png` 并删除 `artifacts/r1-baseline-20260722-071707/` 与本段日志。不要整仓 restore、checkout 或 reset。

## 2026-07-22 - Task: 材料图标本地化与零外联门禁

### What was done
- 扩展 `scripts/build-agent-enrichment.py`：成长材料抽取补齐 `epId`/`img`（结构化对象与 HTML `data-entry-id`/`data-entry-img` 兜底），详情链接规范化为 `https://baike.mihoyo.com/zzz/wiki/...`。
- build 结束后按 `epId`（缺省则按名称 slug）把 wiki 镜像图标复制到 `assets/materials/<id>.<ext>`，enrichment 写入同源相对路径 `icon`；运行时产物不保留远程 `img`，避免热链误用。
- `agent-catalog.js` 对 growth materials 的 `icon` 经 `mediaUrl` 校验后保留本地路径；`character.js` 有同源 icon 时渲染 `character-growth-icon` 图片，否则降级等级字母；底部 note 改为图标已本地化说明。
- `theme-zzz.css` 为 48x48 槽位补最小 icon 样式；`character.html` 缓存参数 bump 到 `materials-icon-1`。`docs/README.md` 同步材料图标本地化与零外联策略。

### Testing
- `python scripts/build-agent-enrichment.py`：扫描 59、匹配 56、56/56 含成长；unique materials 64/64 均有本地 icon（missingIcon=0）；`assets/materials/` 共 64 个文件。
- `node --check agent-catalog.js`、`node --check character.js`、`python -m py_compile scripts/build-agent-enrichment.py`：通过。
- Playwright `http://127.0.0.1:4173/character.html?id=anby#story`：晋升材料出现同源 `assets/materials/*.png` 的 `character-growth-icon` 图片；无 `act-upload.mihoyo.com` 图片请求、无外部图片请求；材料详情 href 为 `https://baike.mihoyo.com/zzz/wiki/content/<id>/detail`；阶段 Tab 切换后仅当前 panel 可见（visibleCount=1）。

### Notes
- `scripts/build-agent-enrichment.py`：材料字段/URL 规范化与图标本地化。
- `artifacts/agent-enrichment.json`、`agent-enrichment.js`：重生含本地 `icon`/`epId`。
- `assets/materials/`：64 个本地材料图标。
- `agent-catalog.js`、`character.js`、`theme-zzz.css`、`character.html`、`docs/README.md`、`progress.md`：本轮实现与记录。
- 剩余缺口：档案图集 gallery 远程图仍未本地化（`mediaUrl` 会丢弃外链，页面不热链，但图集可能为空）；不阻塞本任务。
- 回滚：删除 `assets/materials/`，定点恢复本轮改动文件后执行 `python scripts/build-agent-enrichment.py` 生成旧结构产物，并删除本段 progress；不要整仓 restore/checkout/reset。

## 2026-07-22 - Task: 档案图集 gallery 图片本地化并接入角色页展示

### What was done
- 扩展 `scripts/build-agent-enrichment.py`：从白名单 wiki 镜像按原顺序复制每角色最多 8 张档案图集原图（含 GIF）到 `assets/gallery/<agentId>/<nn>.<ext>`；镜像缺失项跳过，运行时只保留同源路径。
- `agent-catalog.js` 去掉图集外链回退，避免远程 URL 经 `||item.image` 重回页面；`character.html` 缓存 bump 到 `gallery-local-1`。
- `docs/README.md` 同步图集本地化与零外联说明。角色页“相关影像 / 档案图集”直接消费 enrichment 本地图。

### Testing
- `python scripts/build-agent-enrichment.py`：56 角色匹配；gallery `agents=56 copied=424 missingSkipped=91 mb=1328.5`；材料图标仍 64/64。
- `python -m py_compile scripts/build-agent-enrichment.py`、`node --check agent-catalog.js`、`node --check character.js`：通过；本地 gallery 路径 424、远程 0、缺文件 0。
- Browser `http://127.0.0.1:4173/character.html?id=anby#media`：档案图集显示 6 张同源 `assets/gallery/anby/*`，naturalWidth 正常，无 `act-upload.mihoyo.com` / 外部图片请求。

### Notes
- `scripts/build-agent-enrichment.py`：新增 `localize_gallery_images`。
- `artifacts/agent-enrichment.json`、`agent-enrichment.js`：重生含本地 gallery。
- `assets/gallery/`：424 个原图文件，约 1.33GB（按用户确认的原图含 GIF 策略）。
- `agent-catalog.js`、`character.html`、`docs/README.md`、`progress.md`：本轮接入与记录。
- 风险：图集体积显著增大交付包；后续若要瘦身需另开压缩缩略图任务。
- 回滚：删除 `assets/gallery/`，定点恢复本轮改动文件后执行 `python scripts/build-agent-enrichment.py` 生成旧结构产物，并删除本段 progress；不要整仓 restore/checkout/reset。

## 2026-07-23 - Task: 冷灰档案站可读性改版（角色滑块 + 活动目录跳转）

### What was done
- 配色收敛为冷灰档案站：`tokens.css` 主色改为冷炭灰阶 + 单一哑光琥珀强调，去掉刺眼多色霓虹。
- 角色页图二：职级晋升改为 wiki 滑块（range + 刻度按钮），档案图集改为左右滑动查看。
- 活动页图四：新增 wiki 风格目录跳转（分组/条目锚点），并压低活动页英雄区与卡片的高饱和排版噪音。
- 新增 `wiki-readability.css`，由 `theme-zzz.css` 引入；角色/活动页缓存参数已 bump。

### Testing
- `node --check character.js`、`node --check page.js`：通过。
- Playwright `http://127.0.0.1:4173/events.html`：出现 `wiki-page-toc`，可跳到 `#event-group-ev-theme` / `#event-item-e02`；`--amber=#c9a227`。
- Playwright `http://127.0.0.1:4173/character.html?id=anby#media`：档案图集 6 张滑块，下一张索引变为 2；养成材料面板出现 range 滑块，滑到 3 时标签「20」且仅对应 panel 可见。
- 截图：`artifacts/preview-events-toc.png`、`artifacts/preview-character-gallery-slider.png`、`artifacts/preview-character-growth-slider.png`。

### Notes
- `tokens.css`：冷灰底 + 单一琥珀强调。
- `wiki-readability.css`：图集/职级滑块与活动目录、活动页可读排版。
- `theme-zzz.css`：引入 readability 样式并弱化全局霓虹背景。
- `character.js` / `character.html`：图集滑块与职级 range 交互。
- `page.js` / `events.html`：活动目录 TOC、分组/条目锚点、布局 class 与缓存 bump。
- `artifacts/preview-*.png`：本轮成品截图。
- 剩余：职级「总计」原始数据仍是超长连写，已强制换行但未改数据结构；主线/其他子页仍可能沿用旧 multi-page 浅色块，本轮只收活动页与角色相关模块。
- 回滚：删除 `wiki-readability.css`，并定点恢复 `tokens.css`、`theme-zzz.css`、`character.js`、`character.html`、`page.js`、`events.html` 与本段 progress；不要整仓 restore/checkout/reset。

## 2026-07-23 - Task: 冷灰档案站美术扩展到全部正式页

### What was done
- 将冷灰档案站样式从活动/角色页扩展到首页、主线、角色与阵营、阵营详情、幕后等正式页。
- 在 `wiki-readability.css` 增加全局子页覆盖：压掉 `multi-page.css` 的奶油纸顶栏、浅色时间轴底、黄底分组头与多色霓虹频道色，统一为冷炭灰底 + 单一琥珀强调。
- 正式 HTML 缓存参数统一 bump 到 `cold-gray-2`。

### Testing
- Playwright 抽样：`index/mainline/stories/events/behind-scenes/faction`。
- 实测 `--amber=#c9a227`；顶栏背景 `rgba(11,14,19,.94)`；卡片/条目背景 `rgba(18,24,32,.96)`；未见奶油纸 `#d7d4ca/#e8e5dc` 主表面。
- 截图：`artifacts/preview-cold-index.png`、`artifacts/preview-cold-mainline.png`、`artifacts/preview-cold-stories.png`、`artifacts/preview-cold-events.png`。

### Notes
- `wiki-readability.css`：新增全正式子页冷灰覆盖。
- `index.html` / `mainline.html` / `stories.html` / `faction.html` / `behind-scenes.html` / `events.html` / `character.html`：缓存 bump。
- `artifacts/preview-cold-*.png`、`artifacts/_cold-gray-expansion.css`：预览与中间片段。
- 剩余：`multi-page.css` 源文件仍保留旧奶油规则，靠后加载覆盖；角色工作台（stories）大舞台仍是既有暗色 workbench，未重做信息架构。
- 回滚：从 `wiki-readability.css` 删除 “Cold-gray archive expansion” 段，恢复各 HTML 的 css/js 版本号与本段 progress；不要整仓 restore。

## 2026-07-23 - Task: P0 视觉层级（首页主角 + 主线降噪）

### What was done
- 首页引入视觉主角：`hero-art` 改为录像店 `store-poster` 实图，去掉空装饰 sun/ring。
- 收黄字：主标题改为白字 + 次行 text-2；琥珀只留给 eyebrow / 主 CTA / 小标签。
- 文字透明度层级：正文/注释/装饰坐标按 text-2/3/4 分层。
- 主线 HUD 装饰降到 0.38 透明度，避免抢“时间轴”主角。
- 底栏播放器暗化为冷灰轨，降低舞台抢戏。
- 修复 app.js 标题两行被 max-width 挤成「段」单独掉行的问题。

### Testing
- Playwright `index.html`：`hero-star` naturalWidth>0；h1 白、span 约 78% 灰白；播放器背景 `rgba(11,14,19,.94)`；标题 HTML 为「先找到片 / 再决定看哪段」两行且 span 宽 514 < 容器 560（不再孤字断行）。
- Playwright `mainline.html`：`.hero-hud` opacity=0.38；主标题白 + 次行柔和琥珀灰。
- 截图：`artifacts/preview-hierarchy-home.png`、`artifacts/preview-hierarchy-mainline.png`。

### Notes
- `index.html`：hero 结构改 star 图。
- `wiki-readability.css`：Hierarchy pass + 标题断行修复；此前误写的 `# =====` 注释已改回 `/* */`。
- 正式页 theme 缓存 `hierarchy-2`。
- `artifacts/_hierarchy-pass.css`：中间片段。
- 剩余：主线「时间轴」仍带柔和琥珀色（有意保留关键词强调）；about 区「气氛可选」仍可用 span 次级色。
- 回滚：去掉 Hierarchy pass CSS 段，恢复 index hero 旧结构与 theme 版本号，删除本段 progress。

## 2026-07-23 - Task: 录像店视觉主角替换 + 编辑器图片/字号

### What was done
- 首页视觉主角从图暗的 store-poster 换成 HOOXI PLAY 正门插画 `assets/hooxi-rebuild/hooxi-play-storefront.png`（对齐录像店影/音/画：霓虹招牌、REC 条、青框点缀）。
- 扩展首页 appearance：`heroImage` / `titleScale` / `bodyScale`，运行时写到 CSS 变量 `--hero-title-scale`、`--body-text-scale`。
- 编辑器「页面外观」对首页增加：主角图路径、本地文件预览替换、标题/正文字号百分比；帮助文案同步。
- editorPreview 预览会带上 image 与字号字段。

### Testing
- `node --check app.js`、`node --check editor.js` 通过。
- Playwright `index.html`：主角图 naturalWidth=1280，src 指向 hooxi-play-storefront.png；默认字号变量 1 / 1。
- 截图：`artifacts/preview-play-ui-home.png`。
- 编辑器页可打开登录壳（完整字段需登录后在首页 tab 的页面外观中操作）。

### Notes
- `index.html`、`app.js`、`editor.js`、`editor.css`、`wiki-readability.css`、`assets/hooxi-rebuild/hooxi-play-storefront.png`。
- 缓存：`theme-zzz.css?v=play-ui-1`、`app.js?v=play-ui-1`、`editor.*\?v=play-ui-1`。
- 本地 blob 预览不会进仓库；发布需把图片拷到 assets 并改回相对路径。
- 回滚：恢复主角图路径为 store-poster，去掉 heroImage/titleScale/bodyScale 相关字段与本段 progress。

## 2026-07-23 - Task: 首页主角图替换为 ZZZ Random Play 主视觉

### What was done
- 将用户提供的官方主视觉保存为 `assets/hero/zzz-random-play-keyart.png`。
- 首页 `#heroStarImg` 改为该图；去掉「有货再开」黄条贴纸与 REC 装饰条。
- 默认路径同步到 `app.js` / `editor.js` 的 home hero.image；主角区改为 cover 裁切展示。

### Testing
- 资源 HTTP 200；Playwright 确认 naturalWidth=1146，sticker 已不在 DOM。
- 截图：`artifacts/preview-keyart-home.png`。

### Notes
- `assets/hero/zzz-random-play-keyart.png`、`index.html`、`app.js`、`editor.js`、`wiki-readability.css`。
- 缓存 `keyart-1`。若浏览器 localStorage 里旧 heroImage 仍指向店面图，清除 `hooxiZZZConfig` 或在编辑器改路径。
- 回滚：改回旧路径并删除 assets/hero 与本段 progress。

## 2026-07-23 - Task: ZZZ 美术语言强化（复古×潮流）

### What was done
- 对照 kit《art has so much soul》与《复古和潮流碰撞》的共通点，落地一版可维护的网页图形语言（非整站抄 UI）。
- tokens：琥珀提亮为 `#e0b41c`，新增稀有信号青 `--signal:#3ec7d6`（LIVE 点、坐标、路径次强调）。
- 首页英雄区：主视觉海报硬边+切角+硬阴影；eyebrow 做成铭牌；主 CTA 切角；坐标加半透明底提升对比。
- 查档路径卡：更硬的色块与 6px 黑投影，主路径琥珀条 / 次路径信号青条。
- 播放器：缩成卡带轨条（更窄、更低不透明、悬停再抬起），减少挡内容。

### Testing
- Playwright `index.html`：`--amber=#e0b41c`、`--signal=#3ec7d6`；播放器 opacity=0.92 width=720；主角图仍为 keyart；坐标底 `rgba(0,0,0,.62)`。
- 截图：`artifacts/preview-zzz-art-home.png`、`artifacts/preview-zzz-art-paths.png`。

### Notes
- `tokens.css`、`wiki-readability.css`、`index.html`（缓存 `zzz-art-1`）。
- 本轮只强化首页为主；子页仍沿冷灰档案面，未整站套游戏 UI 组件。
- 回滚：删除 art language pass 段并恢复 tokens 旧琥珀/无 signal，回退 index 缓存版本与本段 progress。

## 2026-07-23 - Task: 播放器左下坞 + 防遮挡查档路径

### What was done
- 底栏播放器从居中悬浮改为左下角卡带坞（宽约 300px，不再横贯路径卡）。
- 首屏若与路径卡几何重叠，自动收成仅播放键的 compact 坞；悬停/聚焦展开。
- 首页 main 增加底部安全间距，避免内容贴底。

### Testing
- Playwright：首屏 compact=true、width≈50、三路径 overlap=false；滚到 #start 后 overlap 仍为 false。
- 截图：`artifacts/preview-player-dock-home.png`、`artifacts/preview-player-dock-paths.png`。

### Notes
- `wiki-readability.css`、`app.js`（bindPlayerDockGuard）、`index.html` 缓存 `player-dock-2`。
- 回滚：恢复居中播放器规则并删除 guard 与本段 progress。

## 2026-07-23 - Task: 播放器最终坞（不挡路径/代理人卡）

### What was done
- 播放器固定左下角 mini-deck：默认只保留播放键（约 52px 宽），悬停/聚焦再展开曲名与控制。
- 默认 compact，避让路径卡、代理人卡、chip；不再横贯页面中部。
- 首页底部保留安全间距。

### Testing
- Playwright 首屏 / #start / #featured-agents：left=12, width≈52, compact=true, overlaps=[]。
- 截图：`artifacts/preview-player-dock3-home.png`、`preview-player-dock3-paths.png`、`preview-player-dock3-agents.png`。

### Notes
- `wiki-readability.css` player final 段、`app.js` bindPlayerDockGuard、`index.html` 缓存 `player-dock-3`。
- 回滚：删除 final player 段与 guard，恢复旧居中播放器规则与本段 progress。

## 2026-07-23 - Task: 磁带播放器 + 全屏悬浮磁带机

### What was done
- 底栏播放器改为磁带坞：左侧小磁带按钮（C60 双卷轴）+ 播放键；默认仍紧凑不挡内容。
- 新增全屏悬浮磁带机（`#cassetteStage`）：大磁带壳、卷轴旋转、SIDE A 标签、曲名、走带控制、音量、歌单、Esc/遮罩关闭。
- `app.js` 同步曲目名/模式/播放状态到坞与全屏层；播放时卷轴旋转。

### Testing
- `node --check app.js` 通过。
- Playwright：坞宽约 114px、左下；点磁带打开全屏（body.cassette-open、曲名同步）；Esc 关闭。
- 截图：`artifacts/preview-cassette-dock.png`、`artifacts/preview-cassette-stage.png`。

### Notes
- `index.html`、`app.js`、`wiki-readability.css`；缓存 `cassette-1`。
- 未改音频数据源；全屏与底栏共用同一 `#audio`。
- 回滚：恢复旧 music-player 结构，删除 cassette stage/CSS/JS 与本段 progress。

## 2026-07-23 - Task: 磁带机曲名清洗与标签可读性

### What was done
- 新增 `formatTrackName`：去掉扩展名与 HOYO/三Z 制作方噪声，显示为「歌手 - 曲名」或纯曲名。
- 全屏磁带标签支持两行截断；歌单行改为编号 + 清洗后曲名。

### Testing
- Playwright 打开磁带机歌单：前几项如 `ChiliChill乐团 - pinKing`、`60%的日常`，无 `.ogg`。
- 截图：`artifacts/preview-cassette-clean-names.png`。

### Notes
- `app.js`、`wiki-readability.css`、`index.html` 缓存 `cassette-2`。
- 回滚：删除 formatTrackName 及相关样式与本段 progress。

## 2026-07-23 - Task: 磁带机走带/SIDE面 + 首页硬色块

### What was done
- 全屏磁带机新增：走带进度条（可拖动 seek）+ 当前/总时长；SIDE A/B 切换（B 面视觉翻面、歌单倒序展示、上一首/下一首方向对调）；播放时卷轴转速与磁带高光更明显。
- 首页代理人卡、剧情分栏/条目改为 ZZZ 硬色块：切角、硬阴影、左色条、mono 角标/编号；主线琥珀 / 角色信号青 / 活动珊瑚。

### Testing
- Playwright：打开磁带机有 seek，默认 SIDE A，点 SIDE B 徽章与 hint 更新；代理人卡 clip-path 切角 + 6px 硬阴影；章节硬块 + 琥珀编号底。
- 截图：`artifacts/preview-cassette-transport.png`、`preview-cassette-side-b.png`、`preview-hardblock-agents.png`、`preview-hardblock-chapters.png`。

### Notes
- `index.html`、`app.js`、`wiki-readability.css`；缓存 `cassette-hard-1`。
- SIDE B 不改真实音轨数据，只改展示顺序与走带方向语义。
- 回滚：去掉 transport/side 结构与 hard-block CSS/JS，恢复 cassette-2 并删本段 progress。

## 2026-07-23 - Task: 磁带坞默认可见 + 代理人卡降密度

### What was done
- 播放器默认展开为左下「TAPE DECK」磁带坞：小磁带 + 播放键 + 曲名，不再默认收成隐形小按钮。
- 取消自动 compact 隐藏；仅保留悬停展开更多控制。
- 代理人卡简介截断到约 28 字 / 1 行，属性行去空字段，降低密度。

### Testing
- Playwright 首屏坞：left=16, width=320, height=76, compact=false, 曲名可见, ::before=TAPE DECK。
- 截图：`artifacts/preview-deck-visible-home.png`、`preview-deck-visible-crop.png`、`preview-deck-visible-stage.png`、`preview-agents-dense.png`。

### Notes
- `app.js`、`wiki-readability.css`、`index.html` 缓存 `deck-visible-2`。
- 点左下小磁带可开全屏磁带机。
- 回滚：恢复 compact 默认策略与旧 agent 全文摘要，删本段 progress。

## 2026-07-23 - Task: 磁带坞可见且不挡 PATH 卡

### What was done
- 磁带坞改为不透明实心底（#120f0b），去掉毛玻璃透字导致的「乱码感」。
- 固定左下 TAPE DECK：磁带键 + 播放 + 曲名默认可见。
- 路径区增加底部留白；Playwright 校验与三张 PATH 卡几何重叠为 false。

### Testing
- 路径区 anyOverlap=false；坞 300x78、opacity=1、曲名 ChiliChill乐团 - pinKing。
- 截图：`artifacts/preview-deck-fix-home.png`、`preview-deck-fix-paths.png`、`preview-deck-fix-crop.png`。

### Notes
- `wiki-readability.css` deck no-overlap final；`index.html` 缓存 `deck-fix-1`。
- 点小磁带打开全屏磁带机；点播放键直接播放。
- 回滚：删除 deck no-overlap final 段并回退缓存与本段 progress。

## 2026-07-23 - Task: 底栏全宽磁带轨（彻底不挡字）

### What was done
- 播放器改为页面最底部全宽不透明「TAPE DECK」轨条，不再用角落悬浮压住卡片。
- 首页预留 `--deck-rail-h: 88px` 底部空间；轨上永远是播放器控件，卡片滚到下方会被轨盖住但不透字。
- 轨上默认显示：小磁带、播放、曲名、切歌、模式、音量、歌单。

### Testing
- elementsFromPoint 轨中心最上层为 `#musicToggle` / `#musicPlayer`。
- 截图：`artifacts/preview-deck-rail-home.png`、`preview-deck-rail-paths.png`、`preview-deck-rail-crop.png`。

### Notes
- `wiki-readability.css` deck rail final；`app.js` 取消 auto-compact；缓存 `deck-rail-1`。
- 点小磁带 = 全屏磁带机；点 ▶ = 播放。
- 回滚：删除 rail final 段，恢复角落坞并删本段 progress。

## 2026-07-23 - Task: 底栏磁带轨左右分区布局

### What was done
- 底栏改为全宽磁带轨：左侧 `deck-left`（磁带键 + 播放 + 曲名），右侧 `deck-right`（上一首/下一首/模式/音量/歌单）。
- 提高 `--deck-rail-h` 与首页底部留白，代理人卡滚到轨上时不被视觉“裁半”。
- 取消轨上控件默认隐藏，右区控制常显。

### Testing
- Playwright：轨宽 1440、高 96；右区 left≈1097；`#prevTrack/#nextTrack/#playMode/#volume/#playlistOpen` 均 visible；代理人卡 anyClipped=false。
- 截图：`artifacts/preview-deck-rail2-home.png`、`preview-deck-rail2-crop.png`、`preview-deck-rail2-agents.png`、`preview-deck-rail2-stage.png`。

### Notes
- `index.html`、`wiki-readability.css`；缓存 `deck-rail-2`。
- 点 TAPE 开全屏磁带机；点 ▶ 播放。
- 回滚：恢复旧 music-player 单行结构与 rail 旧 CSS，删本段 progress。

## 2026-07-23 - Task: 全站动效验收收口与降动效修复

### What was done
- 阵营成员卡在 `prefers-reduced-motion: reduce` 初始加载时不再挂载 pointer 深度监听；运行中切换为降动效后也停止写入视差变量。
- 共享动效层统一关闭旧 ambient drift 与代理人工作台 ticker 的持续循环，并清除对应 `will-change`，不新增装饰动效。
- 7 个正式公开页统一提升共享动效资源缓存到 `signal-ui-r3`；阵营页脚本提升到 `archive-3`。
- 同步动效验收文档，并刷新正式站门禁基线。

### Testing
- `node --check faction.js && node --check site-motion.js`：通过。
- `git diff --check -- faction.js motion.css index.html mainline.html stories.html character.html faction.html events.html behind-scenes.html docs/zzz-archive-positioning.md progress.md artifacts/formal-site-gate-baseline.json`：无空白错误；仅有工作区 LF/CRLF 提示。
- 1280×800 Playwright smoke：`index`、`stories?agent=anby`、`character?id=anby`、`faction?id=cunning-hares` 的普通与 reduced-motion 共 8 组通过；无横向溢出、loader 残留、控制台/页面/失败请求、破图或 ambient/ticker 无限动画；每页仅加载 1 份 `motion.css?v=signal-ui-r3` 与 1 份 `site-motion.js?v=signal-ui-r3`；reduced-motion 下运行中动画为 0，阵营页 `.agent-entry` pointermove 绑定数为 0。
- `npm run test:content`：通过，共 8 组检查。
- `npm run test:stories`：未全通过；失败集中于既有切角几何、footer gap、平行轨道/卡框、hover 与 reduced-input 断言；本轮相关 `tickerAnimation: none` 与 reduced-motion ticker 停止检查通过，未在本任务扩修既有布局断言。
- `python scripts/check-formal-site-gate.py --write && npm run test:formal`：门禁基线刷新后 `GATE_OK ALL_FORMAL_UNCHANGED`，共 40 个正式文件。

### Notes
- `faction.js`：为成员卡 pointer 深度交互增加统一 reduced-motion 门禁与运行时保护。
- `motion.css`：覆盖并停止旧 ambient/ticker 持续循环及其 `will-change`。
- `index.html`：共享动效 CSS/JS 缓存参数更新为 `signal-ui-r3`。
- `mainline.html`：共享动效 CSS/JS 缓存参数更新为 `signal-ui-r3`。
- `stories.html`：共享动效 CSS/JS 缓存参数更新为 `signal-ui-r3`。
- `character.html`：共享动效 CSS/JS 缓存参数更新为 `signal-ui-r3`。
- `faction.html`：共享动效缓存更新为 `signal-ui-r3`，阵营脚本更新为 `archive-3`。
- `events.html`：共享动效 CSS/JS 缓存参数更新为 `signal-ui-r3`。
- `behind-scenes.html`：共享动效 CSS/JS 缓存参数更新为 `signal-ui-r3`。
- `docs/zzz-archive-positioning.md`：追加 2026-07-23 动效验收收口约束。
- `artifacts/formal-site-gate-baseline.json`：刷新为当前已授权正式站状态的 40 文件指纹。
- `progress.md`：追加本轮实现、验证与风险记录。
- 回滚点：本轮开始前的 `signal-ui-r2` / `faction.js?v=archive-2` 工作树；因当前仓库包含大量其他未提交改动，回滚时只反向应用上述文件中的本轮定点差异，禁止整仓 `restore/checkout/reset`。反向完成后执行 `python scripts/check-formal-site-gate.py --write && npm run test:formal` 重建并验证门禁。

## 2026-07-23 - Task: 最终成品收口、独立预览与验收门禁

### What was done
- 将首页播放器从全宽底轨收为左下 136px 磁带小坞，悬停或键盘聚焦时才展开完整控制；手机子页播放器定点收为 220px，避免遮挡主线赛道控件。
- 将代理人工作台回归改为匹配当前真实错位轨道、可见斜边间距、单层平行卡框与 hover 行为，并收紧指针断言，空 CSS 变量或零位移不再误报通过。
- 全站 UI 验收兼容原生跨文档 View Transition 与旧 route-loader 两条路径；原生路径现在实际监听 `pageswap.viewTransition`，不再只凭 CSS 支持推断。
- 正式门禁显式纳入由 `theme-zzz.css` 间接导入的 `wiki-readability.css`，并拒绝 HTML 直链越出仓库根目录；编辑器离线白名单收紧为 `http://localhost:3001/api/auth/*`。
- 生成可独立启动的轻量最终预览 `artifacts/final-preview-2026-07-23/`：包含 8 个正式入口的运行闭包，不依赖仓库根目录，不含后端凭据、无关原型或约 1.3GB 可选角色动态图集；预览副本仅清空可选图库引用，原始数据与图库未改写。
- 同步根 README 与 docs 维护说明，保留“当前只有 2 条已核验官方 PV / 世界观媒体”的内容真实性边界，不用推测材料填空。

### Testing
- `npm run test:content`：8/8 内容、媒体、URL 与版权状态契约通过。
- `npm run test:stories`：98/98 通过；覆盖 8 个响应式视口、姓名安全区、斜切几何、错位轨道、交互、腰部近景、compact 分支和 reduced-motion。
- `npm run test:ui`：8 个页面 × 3 个视口，24/24 截图、9/9 深链接、1/1 跨页交互，阻断 0；最终报告 `artifacts/r1-baseline-20260723-193743/report.json`，其中原生 `pageswap.viewTransition` 为 `observed`。
- 独立预览闭包：8 个入口 × 桌面/手机共 16/16 通过；无横向溢出、破图、页面错误或本地 HTTP 错误。编码路径穿越 3/3 返回 403/404、无文件泄露；证据写入 `artifacts/final-preview-2026-07-23/validation-report.json`。
- `node --check scripts/regression.mjs`、`node --check scripts/capture-r1-baseline.mjs`、`node --check artifacts/final-preview-2026-07-23/serve-preview.mjs` 与 `python -m py_compile scripts/check-formal-site-gate.py`：通过。
- `python scripts/check-formal-site-gate.py --write && npm run test:formal`：41/41 正式文件通过，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- `git diff --check`：目标跟踪文件无 whitespace error；仅有工作区既有 LF/CRLF 提示。用户取消了重复串联四项验收；上述各项均已在最终修补后分别通过。

### Notes
- `wiki-readability.css`：播放器最终小坞、展开态、手机子页 220px 避让与底部安全区。
- `scripts/regression.mjs`：更新真实花名册几何/互动口径，并消除空指针变量假阳性。
- `scripts/capture-r1-baseline.mjs`：原生 View Transition 实际观测、编辑器后端白名单收紧和当前视觉验收。
- `scripts/check-formal-site-gate.py`：正式文件加入 `wiki-readability.css`，直链资产规范化并阻断越界路径。
- `artifacts/formal-site-gate-baseline.json`：刷新为 41 个正式文件的授权指纹。
- `artifacts/final-preview-2026-07-23/`：独立预览闭包、启动脚本、清单、说明和最终验证报告；服务器使用 canonical realpath 限制根目录。
- `README.md`、`docs/README.md`：记录最终预览启动方式、资源边界和发布门禁。
- `progress.md`：本段最终实施、审查、验证和回滚记录。
- 回滚：仅定点恢复 `wiki-readability.css`、3 个验证/门禁脚本、正式基线、两份 README 与本段 progress；删除 `artifacts/final-preview-2026-07-23/` 和 `artifacts/r1-baseline-20260723-193743/`。不要执行整仓 `restore`、`checkout` 或 `reset --hard`，避免覆盖用户其它未提交工作；回滚后重新执行 `python scripts/check-formal-site-gate.py --write && npm run test:formal`。

## 2026-07-23 - Task: 纠正并完成已批准批次A官方 B 站媒体

### What was done
- 依据主代理已核验的官方详情 API 证据，纠正公测 PV 与世界观 PV 的发布日期、原创/禁止转载标记、总时长与中文 P1 时长；世界观发布日期由错误的 2024-07-03 修正为 2024-07-06。
- 下载两条官方 pic 原缩略图并原比例转换为 1920×1080 本地 WebP，不复制 fallback、不去水印；媒体目录保留 HTTPS 原图 URL。
- 将 B 站 `copyright` 对应的 `isReprint` 与 `rights.no_reprint` 对应的 `noReprint` 拆分建模，并逐条记录授权边界：公测未设置 no_reprint 仍不等于授权，世界观明确存在未经作者授权禁止转载与撤下风险。
- 修复离线采集脚本的 352 文本风险识别和可恢复状态合并；重新枚举不会清空既有 BVID/pending，详情产物可记录原创、禁止转载、总/P1 时长与缩略图尺寸。当前清单继续保留 412 停止原因，两条 checked 标明 `manualVerifiedApiEvidence`，未声称脚本本轮在线成功。
- 更新媒体政策、维护说明与内容校验，并重新生成 archive contract；未改首页、未刷新 formal baseline、未运行 UI、未提交 Git。

### Testing
- `python -m py_compile scripts/collect-official-bilibili.py`：通过。
- `node --check media-catalog.js`、`node --check data.js`、`node --check scripts/validate-archive.mjs`：通过。
- `node scripts/validate-archive.mjs --write-contract`：10/10 组通过，已生成并严格匹配 `artifacts/archive-contract.json`。
- `npm run test:content`：9/9 组通过。
- 封面复核：`zzz-launch-pv.webp` 1920×1080、398730 bytes、SHA-256 `239bcf0519c79fc0a00d126ea0d751bbfb37d61335affe977fcc2e7de7444097`；`zzz-worldview-pv.webp` 1920×1080、210652 bytes、SHA-256 `4965a46578c851e2f1669a986f777e6f61688983f5dc613e617f226ba025bd1f`。

### Notes
- `scripts/collect-official-bilibili.py`：补 352 风险文本、保留既有状态并扩展详情字段。
- `media-catalog.js`：批次A两条官方媒体的准确事实、权利字段、时长、封面来源与尺寸。
- `data.js`：两条发布日期与 B 站官方详情来源链接。
- `scripts/validate-archive.mjs`：校验 `noReprint`、总/P1 时长及逐条权利说明。
- `docs/media-source-policy.md`：明确 `isReprint` 与 `noReprint` 的独立语义和本地缩略例外边界。
- `docs/README.md`：纠正批次A的 412、人工证据、正式封面和时长维护现况。
- `artifacts/bilibili-official-1636034895.json`：保留 412 并人工种入两条已核验证据状态。
- `assets/covers/official/bilibili/zzz-launch-pv.webp`、`assets/covers/official/bilibili/zzz-worldview-pv.webp`：由官方原缩略图转换的本地 WebP。
- `artifacts/archive-contract.json`：由当前正式档案数据重新生成的契约快照。
- `progress.md`：追加本轮纠正、验证与回滚记录；历史条目未改写。
- 回滚：仅定点反向应用上述文件本轮差异，并将两张 WebP 恢复到本轮前版本；随后运行 `node scripts/validate-archive.mjs --write-contract` 与 `npm run test:content`。禁止整仓 restore/checkout/reset，避免覆盖其它未提交改动。

## 2026-07-23 - Task: 修复批次A审查的证据自证假阳性

### What was done
- 内容 validator 现强制读取官方 B 站证据 JSON，对每条官方 B 站媒体逐字段交叉核对 BVID、标题、发布者/UID、日期、总/P1 时长、转载状态、原缩略图、官方 UID 验证与详情页；缺证据或不可信 evidenceSource 会失败。
- 使用 Node 标准库实现最小 WebP VP8/VP8L/VP8X 尺寸解析，核对本地实际尺寸、目录尺寸、证据缩略图尺寸及 SHA-256；fallback 替换无法再沿用旧证据通过。
- 为两张当前 WebP 写入 `coverSha256`；对两张原 JPEG 各执行一次精确下载，均成功并写入 `sourceImageSha256`，未请求列表/详情、未重试。
- 收紧采集脚本风控识别：正常 JSON stdout 不再裸匹配 412/352，仅检查 stderr 错误文本；非零退出时才额外检查 stdout 中明确的 HTTP 412、错误码/code=-352 或风控模式，命中仍立即保存停止且 retries=0。
- 同步维护说明；未改首页、未改媒体目录、未提交 Git、未运行 UI/formal。

### Testing
- `python -m py_compile scripts/collect-official-bilibili.py`：通过。
- `node --check scripts/validate-archive.mjs`：通过。
- `npm run test:content`：10/10 组通过，新增“官方 B 站证据逐字段交叉核验”通过。
- 本地 WebP：公测 PV 1920×1080、398730 bytes、SHA-256 `239bcf0519c79fc0a00d126ea0d751bbfb37d61335affe977fcc2e7de7444097`；世界观 PV 1920×1080、210652 bytes、SHA-256 `4965a46578c851e2f1669a986f777e6f61688983f5dc613e617f226ba025bd1f`。
- 单次原图下载：公测 JPEG 374088 bytes、SHA-256 `9e4244cad0ae773151ee3cee3b309ae110e58dc620513c334c5dd9f93a98777a`；世界观 JPEG 237972 bytes、SHA-256 `c89b47ca0cac39c2ddd16656a2bbb5249d2a799768dc292dc9cfa84a99acd1ef`。

### Notes
- `scripts/collect-official-bilibili.py`：将风控识别限定为明确错误上下文，消除正常 JSON 数字误报。
- `scripts/validate-archive.mjs`：新增证据文件逐字段交叉核验、可信来源门禁、WebP 尺寸解析与 SHA-256 核验。
- `artifacts/bilibili-official-1636034895.json`：为两条 checked 证据补充本地封面与一次性原图下载哈希及说明。
- `docs/README.md`：记录风控识别边界、证据交叉核验和封面哈希门禁。
- `progress.md`：仅在历史末尾追加本轮纠正记录。
- 回滚：定点反向移除上述四个业务文件的本轮差异并删除本段日志；不要整仓 restore/checkout/reset，以免覆盖其它未提交改动。

## 2026-07-23 - Task: 接通统一媒体目录渲染与最终门禁

### What was done
- 修复正式子页只读取 `data.js` 旧 `video/cover` 字段、未消费 `mediaIds` 的根因：主线、活动、幕后页现先加载统一媒体目录，`page.js` 在规范化条目时解析首个有效媒体并派生视频、封面和官方来源链接。
- 保留旧字段与浏览器本地编辑覆盖的兼容优先级，但正式数据不再抄回 `video/cover` 形成双真相；导出状态不保存运行时媒体对象。
- 移除公开页面运行时请求 B 站 API 抓封面的路径；正式页面仅加载同源本地封面并使用普通官方详情外链。
- 将两张 B 站原缩略封面纳入正式文件指纹，门禁由 41 项扩展为 43 项；同步独立最终预览的数据、脚本、页面和封面。

### Testing
- 定向篡改测试：临时把公测 PV 证据标题改为“篡改标题”，`validate-archive.mjs` 稳定以 title 不一致判红，随后 trap 自动恢复证据文件，证明新增校验不是自证假阳性。
- `node --check page.js`、`node --check scripts/capture-r1-baseline.mjs`：通过。
- `npm run test:ui`：8 个页面 × 3 个视口，24/24 截图、9/9 深链接、1/1 交互、阻断 0；新增主线两张本地官方封面、1920×1080 尺寸、封面/视频/来源 BVID 与零外联断言通过。
- 独立预览 `mainline.html`：2/2 官方媒体封面显示，封面/按钮/来源均直达对应 BVID，外部运行时请求 0、页面错误 0；证据 `artifacts/final-preview-2026-07-23/media-validation-report.json`。
- `python scripts/check-formal-site-gate.py --write` 后再只读运行 `python scripts/check-formal-site-gate.py`：43/43 正式文件 `OK`，含两张新 B 站原缩略 WebP，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- `git diff --check`：目标跟踪文件无 whitespace error，仅有既有 LF/CRLF 提示。

### Notes
- `page.js`：统一媒体目录 Map 与 `mediaIds` 派生解析；移除公开运行时 B 站封面抓取。
- `mainline.html`、`events.html`、`behind-scenes.html`：在 `data.js` 后加载 `media-catalog.js`，并更新 `page.js` 缓存参数。
- `scripts/capture-r1-baseline.mjs`：新增主线官方媒体本地封面、BVID、尺寸与同源断言。
- `scripts/check-formal-site-gate.py`、`artifacts/formal-site-gate-baseline.json`：将两张 B 站原缩略封面纳入 43 项正式门禁并刷新授权指纹。
- `artifacts/final-preview-2026-07-23/`：同步最终媒体数据、页面、渲染脚本、封面及媒体验证报告。
- `docs/README.md`：记录统一媒体目录消费关系和零外联维护边界。
- `progress.md`：本段。
- 回滚：定点恢复 `page.js`、三个子页 HTML、两项验证/门禁脚本、正式基线、docs 与本段日志；从独立预览恢复对应文件。不要整仓 restore/checkout/reset。回滚后重新刷新并验证正式门禁。

## 2026-07-23 - Task: 低频续跑官方 B 站剩余公开视频采集

### What was done
- 按既定风控边界执行一次最小续跑：最多核验 1 条、请求间隔 4 秒、不下载视频。
- 官方空间列表请求再次被 B 站 HTTP 412 拦截；采集器立即保存停止原因并以退出码 2 结束，未重试、未绕过风控、未进入详情抓取。
- 现有两条人工核验证据保持完整，未新增 BVID，任务因外部平台匿名访问风控标记为受阻。

### Testing
- `python scripts/collect-official-bilibili.py --max-details 1 --interval 4`：按预期命中 HTTP 412 后立即停止；退出码 2。
- 状态复核：`bvids=2`、`checked=2`、`pending=0`；`stoppedReason` 明确记录 BilibiliSpaceVideo 412，既有证据字段与哈希未丢失。

### Notes
- `artifacts/bilibili-official-1636034895.json`：仅刷新本次 412 停止原因与更新时间，保留两条已核验证据。
- `progress.md`：追加本次低频续跑及阻塞记录。
- 回滚：无需回滚业务代码；如需撤销本次状态写入，仅定点恢复证据 JSON 的上一个 `stoppedReason`/`updatedAt` 与删除本段日志，不要整仓 restore/checkout/reset。

## 2026-07-23 - Task: 重构总览首页为电影化技术档案入口

### What was done
- 按 Dual Gate 将首页收敛为电影化技术档案扉页、单一“开始查档”主门、三条真实路径、代理人精选与声明；Random Play 本地主视觉改为带真实索引信息的技术档案封面。
- 删除首页重复的剧情分栏、时间线及展开/折叠控件，并移除 `app.js` 仅服务该 DOM 的渲染与交互；保留配置编辑、预览、音乐/磁带机及 localStorage 兼容，旧默认首页文案会定点迁移到新文案。
- 顶栏状态改为诚实的 `ARCHIVE INDEX`，档案计数继续由运行时数据派生；PLAY 明确降为可跳过次行动，移动端改为自然纵向流并保留磁带坞安全区。
- 扩展既有 UI 回归：首页专项验证主/次 CTA 层级、三条路径、无 timeline/展开控件、本地主视觉成功加载、无横向溢出、页面错误及外部请求为零；同步独立预览闭包、定位文档与 Hallmark 记录。

### Testing
- `node --check app.js`、`node --check scripts/capture-r1-baseline.mjs`：通过。
- `npm run test:content`：10/10 组档案媒体检查通过。
- `npm run test:ui`：8 个页面 × 3 个视口，24/24 截图、9/9 深链接、1/1 跨页交互，`blockingFailures: 0`、`passed: true`；报告位于 `artifacts/r1-baseline-20260723-215113/report.json`。
- `npm run test:formal`：按预期只报告本轮已授权的 `index.html`、`app.js`、`theme-zzz.css` 与既有基线不同并退出 1；未刷新 formal baseline。
- `git diff --check -- index.html app.js theme-zzz.css scripts/capture-r1-baseline.mjs`：通过，无 whitespace error。
- 人工目视复核最终桌面与 390px 手机截图：标题两行完整、不再裁字；主 CTA 层级清楚，封面位于行动与真实索引之后，手机端保持自然流。

### Notes
- `index.html`：重组电影化首页扉页与行动层级，删除剧情分栏 DOM，保留编辑器锚点、导航、声明和磁带机。
- `app.js`：更新默认文案与旧默认配置兼容，删除首页时间线渲染及展开/折叠逻辑。
- `theme-zzz.css`：新增 `.home-page` 限定的 Dual Gate 封面、行动层级与响应式自然流样式。
- `scripts/capture-r1-baseline.mjs`：新增首页专项断言且保留全部既有门禁。
- `artifacts/final-preview-2026-07-23/index.html`、`app.js`、`theme-zzz.css`、`capture-r1-baseline.mjs`：同步本轮独立预览运行闭包与对应测试脚本。
- `docs/zzz-archive-positioning.md`：记录首页当前职责、真实索引和内容下沉边界。
- `.hallmark/log.json`：前置 `home / Dual Gate / custom` 实施记录并保持不超过 20 项。
- `progress.md`：本段实施、验证与回滚记录。
- 回滚：仅定点反向应用上述首页、脚本、样式、测试、预览、文档和 Hallmark 差异，并删除本段日志；不要执行整仓 `restore`、`checkout` 或 `reset`，避免覆盖其它未提交工作。回滚后重新执行 `node --check app.js && npm run test:content && npm run test:ui`。

## 2026-07-23 - Task: 修复首页最终验收缺口

### What was done
- 在根级 token 中补齐 `design.md` 语义颜色、内容宽度与圆角别名，使 Dual Gate 主 CTA 恢复琥珀背景和深色高对比文字，视觉权重明确高于 PLAY；组件未新增硬编码颜色。
- 为首页新增 `<=640px` 真实按钮控制的键盘折叠菜单，支持原生 Enter/Space、Escape 关闭与焦点返回、点击入口关闭；菜单及入口满足 `44×44px`，展开后采用纵向自然流且无内部横向滚动，不影响编辑入口。
- 首页专项发布矩阵扩展到 320、375、390、414、768、1280×800、1440×900，并覆盖 390 与桌面 reduced-motion；自动门禁涵盖导航、CTA、封面、三路径、无 timeline、无横溢、磁带坞避让、文案不换行、零错误/外联和 1280×800 首屏关键内容。
- 同步独立预览运行闭包，定点补充定位文档与同一条 Hallmark 首页记录；未刷新 formal baseline。

### Testing
- `node --check app.js`、`node --check scripts/capture-r1-baseline.mjs`：通过。
- `npm run test:content`：10/10 组档案媒体检查通过。
- `HOOXI_UI_OUTPUT_DIR="artifacts/home-final-review-final" npm run test:ui`：24 个既有页面截图 + 9 个首页专项截图全部生成，9/9 深链接、10/10 交互、9/9 首页发布检查通过，`blockingFailures: 0`、`passed: true`；报告 `artifacts/home-final-review-final/report.json`。
- 人工读取 `home-320.png`、`home-390.png`、`home-768.png`、`home-1280x800.png`、`home-1440x900.png`：移动端标题、intro、双 CTA、索引未被磁带坞遮挡；封面关键人物区域可见；桌面 1280×800 首屏同时包含关键文案、双 CTA、索引与足够封面区域。
- `git diff --check -- <本轮目标文件>`：通过，无 whitespace error；仅输出既有 LF/CRLF 提示及环境附加的 `undefined` 文本。

### Notes
- `tokens.css`：新增 design.md 对应语义别名。
- `index.html`：为首页主导航增加稳定 ID 与无障碍菜单按钮。
- `app.js`：绑定首页菜单开关、Escape、焦点返回及入口关闭行为。
- `theme-zzz.css`：增加 `.home-page` 限定的桌面隐藏与移动纵向菜单样式。
- `scripts/capture-r1-baseline.mjs`：增加首页 9 档发布矩阵及最终验收断言。
- `artifacts/final-preview-2026-07-23/tokens.css`、`index.html`、`app.js`、`theme-zzz.css`、`capture-r1-baseline.mjs`：同步独立预览对应实现与门禁脚本。
- `docs/zzz-archive-positioning.md`：补充移动导航和语义 token 维护边界。
- `.hallmark/log.json`：定点增强最新 home 记录 critique，未新增重复条目。
- `progress.md`：追加本轮实施、验证、文件与回滚记录。
- 回滚：按上述文件逐项反向应用本任务差异，删除本段新增日志与 `artifacts/home-final-review*` 验证产物；不要整仓 restore/checkout/reset，也不要刷新 formal baseline。回滚后执行 `node --check app.js && node --check scripts/capture-r1-baseline.mjs && npm run test:content && npm run test:ui`。

## 2026-07-23 - Task: 发布电影化技术档案首页

### What was done
- 在多宽度、键盘菜单、降动效、磁带坞避让和语义 token 缺口全部修复后，将本轮已授权首页状态写入正式发布指纹。
- 随后只读重跑正式门禁，确认 43 个正式文件全部与新基线一致；其余正式页面与两张官方 B 站原缩略封面仍保持受控。

### Testing
- `python scripts/check-formal-site-gate.py --write && python scripts/check-formal-site-gate.py`：43/43 正式文件 `OK`，输出 `GATE_OK ALL_FORMAL_UNCHANGED`。
- 最终首页 UI 证据沿用 `artifacts/home-final-review-final/report.json`：33 张截图、9/9 深链接、10/10 交互、9/9 首页发布检查，阻断 0。

### Notes
- `artifacts/formal-site-gate-baseline.json`：刷新 `index.html`、`app.js`、`theme-zzz.css`、`tokens.css` 等当前 43 项正式发布指纹。
- `progress.md`：追加最终发布门禁记录。
- 回滚：先定点恢复首页实现、测试、文档、预览与 Hallmark 差异，再执行 `python scripts/check-formal-site-gate.py --write && python scripts/check-formal-site-gate.py` 重建回滚后的正式基线；禁止整仓 restore/checkout/reset。

## 2026-07-24 - Task: Wiki 全量迁移管线与活动 Batch A

### What was done
- 以 `F:/website-archives/zzz-wiki` 为源，新增可重复迁移脚本 `scripts/wiki-migrate-extract.py`，生成全量 catalog（1920 词条，missingBodies=0）与分批活动数据。
- 完成活动 Batch A（1.1–1.4）：93 条策略索引卡 + 93 张本地封面拷贝到 `assets/wiki/events/`，并写入 `data.js` / `pageMeta.events.groups`。
- `page.js` 支持活动页优先读取迁移数据、封面点击外链，以及“打开攻略原文 / 百科词条”文案；同步独立预览闭包。
- 本轮按内测资源接入，不刷新 formal baseline；B 站全量采集仍因 412 保持 blocked。

### Testing
- `python scripts/wiki-migrate-extract.py --phase all --event-versions 1.1,1.2,1.3,1.4 --copy-assets`：catalog 1920；events 4 groups / 93 items / 93 assets。
- `node --check page.js`、`node --check data.js`：通过。
- 预览 `http://127.0.0.1:4173/events.html`：页面计数 93，四个版本分组可见，封面与“打开攻略原文”链接正常；截图 `artifacts/wiki-migrate/events-batch-a-preview.png`。

### Notes
- `scripts/wiki-migrate-extract.py`、`artifacts/wiki-migrate/**`、`assets/wiki/events/**`、`data.js`、`page.js`、`events.html`、预览同步文件、`progress.md`。
- 下一批：活动 1.5–2.2，然后养成页。
- 回滚：删除本批 wiki 资产与 migrate 产物，恢复 `data.js`/`page.js`/`events.html` 差异；不要整仓 restore。

## 2026-07-24 - Task: 活动全量迁入与养成页上线

### What was done
- 活动索引完成 1.1–2.6 / 2.8 共 15 个版本组、246 条策略卡与本地封面；镜像中无 2.7 活动页，已如实空缺。
- 新增 `cultivate.html` / `cultivate.js` / `cultivate-data.js`：迁入市民指南 23 条问答与 44 个养成素材索引卡；总览次级入口与子页导航加入「养成」。
- 同步独立预览闭包；仍按内测资源接入，不刷新 formal baseline。

### Testing
- 活动页预览计数 246，15 个版本分组可见。
- 养成页预览：问答 23、素材 44；截图 `artifacts/wiki-migrate/cultivate-preview.png`。
- `node --check`：`data.js` / `page.js` / `app.js` / `cultivate.js` / `cultivate-data.js` 通过。

### Notes
- 新增/更新：`scripts/wiki-migrate-cultivate.py`、`cultivate.*`、`assets/wiki/cultivate/**`、活动 Batch B/C 产物、`multi-page.css`、`index.html`、`app.js`、相关导航、`progress.md`。
- 下一批：角色/阵营补强与剧情 PV/幕后索引。
- 回滚：删除养成页与对应资产，恢复活动/data/导航差异；勿整仓 restore。

## 2026-07-24 - Task: 角色 wiki 图标本地化与阵营词条挂接

### What was done
- 将 56 个代理人 enrichment 图标从本地 `zzz-wiki` 镜像拷贝到 `assets/wiki/agents/`，并改写 `agent-enrichment.js` 的 `iconUrl` / `wikiUrl`；站点不再因过滤 `/zzz/wiki/` 前缀而丢掉图标。
- `agent-catalog.js` 百科来源改为指向具体词条详情；为狡兔屋、维多利亚家政挂接 wikiId/wikiUrl。
- 同步独立预览；不刷新 formal baseline。

### Testing
- `python scripts/wiki-migrate-agent-icons.py`：localized=56 missing=0。
- `node --check agent-enrichment.js` / `agent-catalog.js`：通过；56/56 本地图标，56/56 词条外链。

### Notes
- `scripts/wiki-migrate-agent-icons.py`、`assets/wiki/agents/**`、`agent-enrichment.js`、`agent-catalog.js`、预览同步、`progress.md`。
- 下一批建议：剧情 PV / 幕后索引，或继续补齐其余阵营 wiki 映射。
- 回滚：恢复 enrichment/catalog，删除 `assets/wiki/agents`；勿整仓 restore。

## 2026-07-24 - Task: 迁入剧情 PV 与幕后索引

### What was done
- 从 wiki 镜像迁入 media 频道 55 条（版本 PV / 世界观 / EP 等）到主线 `ml-media`，保留原有 2 条已核验官方 B 站媒体。
- 迁入 behind 频道 7 条（ZTALK / 制作记录）到幕后页，本地封面齐全。
- `page.js` 对 mainline/behind/events 统一优先读取 wiki 迁移数据，并支持百科外链文案。

### Testing
- `python scripts/wiki-migrate-media-behind.py`：media 55/55 封面，behind 7/7 封面。
- 预览主线计数 57；幕后计数 7，分组与百科外链正常。
- `node --check data.js` / `page.js`：通过。

### Notes
- `scripts/wiki-migrate-media-behind.py`、`assets/wiki/media/**`、`assets/wiki/behind/**`、`data.js`、`page.js`、主线/幕后 HTML 缓存、预览同步、`progress.md`。
- B 站全量封面跳转仍 blocked（412）。
- 回滚：删除本批媒体/幕后资产并恢复 data/page；勿整仓 restore。

## 2026-07-24 - Task: 迁入剧情 PV 与幕后索引

### What was done
- 从 wiki `media` / `behind` 频道迁入索引卡：主线媒体 55 + 原有 2 条已核验 B 站 PV = 57；幕后 7（含 ZTALK）。
- 本地封面分别落到 `assets/wiki/media/` 与 `assets/wiki/behind/`；`page.js` 对 mainline/behind/events 迁移数据优先覆盖陈旧 localStorage。
- 同步独立预览；B 站全量仍 blocked（412）。

### Testing
- `python scripts/wiki-migrate-media-behind.py`：media=55/55，behind=7/7。
- 预览 `mainline.html` 计数 57；`behind-scenes.html` 计数 7，分组与百科外链正常。
- `node --check data.js` / `page.js`：通过。

### Notes
- `scripts/wiki-migrate-media-behind.py`、`data.js`、`page.js`、相关资产与预览同步、`progress.md`。
- 回滚：恢复 data/page，删除 media/behind 资产；勿整仓 restore。

## 2026-07-24 - Task: 总览页长滚动接入主线活动幕后分区

### What was done
- 首页改为长滚动：在代理人精选后新增主线 / 活动 / 幕后三个预览分区与分区跳转条。
- 各区从 `data.js` 取近期封面卡（每区 6 + “进入完整栏目”），只做索引导向，不复制栏目正文。
- 次级入口改为页内锚点；同步独立预览；未刷新 formal baseline。

### Testing
- `node --check app.js`：通过。
- 预览 `index.html?v=home-lanes-1`：三区标题齐全；主线/活动/幕后卡各 7；封面图 18；状态文案含 57 主线 / 246 活动 / 7 幕后；控制台无报错。
- 截图：`artifacts/home-lanes-preview.png`。

### Notes
- `index.html`、`app.js`、`styles.css`、`theme-zzz.css`、`site-motion.js`、预览同步、`artifacts/home-lanes-preview.png`、`progress.md`。
- 官方 B 站封面跳转仍 blocked（412）。
- 回滚：恢复上述首页相关文件并删除截图；勿整仓 restore。

## 2026-07-24 - Task: 首页大图轮播统一尺寸与动画效果

### What was done
- 首页右侧大图改为固定 16:10 裁切轮播框，不再随文案列被栅格拉高；统一 object-fit:cover 居中裁切。
- 轮播图源使用站内已有资源：主角 keyart + 主线/活动/幕后近期封面，最多 5 张。
- 统一淡入缩放切换；支持圆点/左右键、悬停暂停、减动效关闭自动轮播。
- 同步独立预览闭包；未刷新 formal baseline。

### Testing
- `node --check app.js`：通过。
- Playwright `index.html?v=home-hero-carousel-1`：5 张幻灯 / 5 圆点；首帧 RANDOM PLAY；下一张切到档案封面；内容框约 16:10；桌面/手机截图已存；控制台无报错。
- 截图：`artifacts/home-hero-carousel-preview.png`、`artifacts/home-hero-carousel-mobile.png`。

### Notes
- `index.html`、`app.js`、`theme-zzz.css`、预览同步、`artifacts/home-hero-carousel-preview.png`、`artifacts/home-hero-carousel-mobile.png`、`progress.md`。
- B 站封面跳转仍 blocked（412）。
- 回滚：恢复上述首页相关文件并删除本轮截图；勿整仓 restore。

## 2026-07-24 - Task: 填充主线活动幕后内容并接入官方B站封面跳转

### What was done
- 按用户确认采用本地封面兜底：主线 / 活动 / 幕后继续用已迁入本地封面与栏目页跳转，暂不接官方 B 站直达。
- 更新首页幕后说明文案与 `docs/media-source-policy.md` 临时口径；同步独立预览。
- 未猜测 BVID，未刷新 formal baseline。

### Testing
- `node --check app.js`：通过。
- 数据抽查：`mainline` 57（封面 55）/ `events` 246（封面 246）/ `behindScenes` 7（封面 7）；外链均为既有 source/wiki，video=0。
- 文案核验：首页幕后 note 改为“本地封面进幕后页，暂不接官方 B 站直达”；政策文档含 2026-07-24 临时口径。

### Notes
- `index.html`、`docs/media-source-policy.md`、预览同步、`progress.md`。
- 官方 B 站直达仍因 412 未恢复，仅改为已接受的本地兜底口径。
- 回滚：恢复上述文件到本轮前版本；勿整仓 restore。

## 2026-07-24 - Task: 非总览页窄条侧边栏 + 前进后退

### What was done
- 正式子页（主线/角色与阵营/活动/养成/幕后/角色档案/阵营档案）顶栏改为瘦身版，横向长目录迁入左侧窄条侧栏。
- 新增共享 `site-sidebar.js` / `site-sidebar.css`：默认 60px 窄条常驻，可展开 200px；栏目顺序 总览→主线→角色→活动→养成→幕后；同时提供栏目上一页/下一页与浏览器历史后退/前进。
- 总览 `index.html` 不加侧栏；角色/阵营页高亮归属「角色与阵营」，并与角色模块左轨并存；移动端展开为遮罩 overlay。
- 同步独立预览闭包；未刷新 formal baseline。

### Testing
- `node --check site-sidebar.js` / `node --check site-motion.js`：通过。
- 静态断言：7 个子页含 `site-sidebar` 引用；`index.html` 不含；预览包 10 文件与根目录 SYNC。
- Playwright/浏览器抽检：7 子页 has-sidebar、当前高亮正确；character/faction 高亮 stories；栏目翻页端点禁用；主线→下一栏目可达 events；总览无侧栏；桌面/手机无横向溢出、控制台无报错。
- 截图：`artifacts/sidebar-mainline-rail.png`、`artifacts/sidebar-mainline-expanded.png`、`artifacts/sidebar-character-dual-rail.png`、`artifacts/sidebar-mainline-mobile.png`。

### Notes
- `site-sidebar.js`、`site-sidebar.css`：新建共享侧栏注入与样式。
- `site-motion.js`：active 高亮扩展到 `.site-sidebar a[href]`。
- `mainline.html`、`stories.html`、`events.html`、`cultivate.html`、`behind-scenes.html`、`character.html`、`faction.html`：顶栏瘦身并挂载侧栏资源。
- `artifacts/final-preview-2026-07-23/`：同步上述正式文件。
- `artifacts/sidebar-*.png`：本轮验收截图。
- `progress.md`：本段。
- 官方 B 站直达仍因 412 暂缓。
- 回滚：删除 `site-sidebar.js/css` 与本轮截图，恢复 7 个子页与 `site-motion.js` 及预览同步差异，删除本段日志；勿整仓 restore。

## 2026-07-24 - Task: 官方B站空间直达复探（仍 blocked）

### What was done
- 按既定风控边界对官方 UID `1636034895` 执行最小续跑：`--max-details 1 --interval 4`，不下载视频、不重试、不绕过。
- 空间列表枚举再次被 B 站 HTTP 412 拦截；采集器立即保存停止原因并以退出码 2 结束。
- 未新增已核验官方 BVID；公开页继续维持本地封面兜底口径。protected 项因此保持 **blocked**，不标 done。

### Testing
- `python scripts/collect-official-bilibili.py --max-details 1 --interval 4`：预期失败，命中 `[BilibiliSpaceVideo] 1636034895 ... 412`，退出码 2。
- 状态复核：既有官方已核验仍为 2 条（公测 PV / 世界观 PV）；`stoppedReason` 记录空间列表 412；未改正式页渲染逻辑。

### Notes
- `artifacts/bilibili-official-1636034895.json`：仅刷新本次 412 停止原因与更新时间。
- `progress.md`：追加本段阻塞证据。
- 回滚：无需回滚业务代码；如需撤销状态写入，仅定点恢复证据 JSON 的 `stoppedReason`/`updatedAt` 与删除本段日志，勿整仓 restore。

## 2026-07-24 - Task: 确认本地封面兜底为当前交付口径

### What was done
- 用户确认：暂时放弃官方 B 站空间/封面直达；公开站以本地封面兜底为当前交付口径。
- 更新 `docs/media-source-policy.md` 与首页幕后说明文案；同步独立预览政策文档与首页。
- 证据 JSON 写入 `stateNote` 记录该决策；最新 412 停止原因保留。
- protected 项 **官方 B 站空间直达** 仍保持 `blocked`，**不标 done**（无新增可核验官方直达证据）。

### Testing
- 文案核验：政策文档含“当前交付口径（2026-07-24，用户确认暂时放弃官方直达）”；首页幕后 note 含“本地封面兜底”。
- 证据核验：官方已核验仍为 2 条；`stoppedReason` 仍为空间列表 412；未改媒体渲染逻辑。

### Notes
- `docs/media-source-policy.md`、`index.html`、预览同步、`artifacts/bilibili-official-1636034895.json`（仅 stateNote）、`progress.md`。
- 回滚：恢复上述文案/政策与 stateNote，删除本段日志；勿整仓 restore。

## 2026-07-24 - Task: 修复侧栏改造截断业务脚本导致空页

### What was done
- 定位养成页（及主线/活动/幕后/角色等）“空空如也”根因：侧栏接入时 7 个正式子页 HTML 尾部被截断，丢失 `data.js`/`page.js`/`cultivate-data.js` 等业务脚本，页面只剩壳与侧栏。
- 按改造前脚本清单逐页补回完整 script 链，并保留 `site-sidebar.js`；同步独立预览闭包。

### Testing
- Playwright `127.0.0.1:4178`：
  - `cultivate.html`：23 问答 / 44 素材，状态 INDEX READY，样例问句正常中文，侧栏在。
  - `mainline.html`：计数 57；`events.html`：246；`behind-scenes.html`：7；`stories.html`：56 代理人卡。
  - 控制台无报错。
- 截图：`artifacts/cultivate-fixed-preview.png`。

### Notes
- `mainline.html`、`events.html`、`behind-scenes.html`、`stories.html`、`character.html`、`faction.html`、`cultivate.html`：补回被截断的业务脚本尾部。
- `artifacts/final-preview-2026-07-23/`：同步上述 7 页。
- `artifacts/cultivate-fixed-preview.png`、`progress.md`。
- 回滚：若需回到截断前状态，用本轮前备份/历史差异恢复 7 个 HTML；勿整仓 restore。

## 2026-07-24 - Task: 养成页与浅色块文字对比度修复

### What was done
- 用户反馈养成问答“字体无法看清”。根因：全站深色主题把正文继承成浅色字，而养成 FAQ/素材卡仍是浅纸色底，形成浅字叠浅底。
- 将养成区改为深色档案块：标题/题干近白、正文浅灰、编号琥珀青底深字；素材卡同步高对比。
- 刷新 `multi-page.css` 缓存参数，并同步独立预览。

### Testing
- Playwright `cultivate.html?v=contrast-1`：23/44 内容在；题干与正文对比度显著高于 4.5:1（实测题干约 21:1 量级，正文约 15:1 量级，相对实际绘制深色底）。
- 截图：`artifacts/cultivate-contrast-fix.png`。

### Notes
- `multi-page.css`：重写 cultivate 可读性样式。
- `cultivate.html`：`multi-page.css?v=contrast-1`。
- 预览同步、`artifacts/cultivate-contrast-fix.png`、`progress.md`。
- 回滚：恢复 multi-page cultivate 段与缓存版本号，删除本段日志与截图；勿整仓 restore。

## 2026-07-24 - Task: 活动页目录改侧栏 + 取消官方B站直达任务

### What was done
- 活动页版本目录从正文上方整块改为左侧粘性侧栏：`wiki-events-shell` 双栏布局（目录 180–220px + 正文）。
- 目录只保留版本组跳转（1.1–2.8 共 15 组），滚动时高亮当前版本；桌面并排，窄屏自动改回上下堆叠。
- 按用户确认取消 protected 任务「官方 B 站空间直达」：不再自动续跑；公开站继续本地封面兜底。
- 同步独立预览闭包。

### Testing
- `node --check page.js`：通过。
- Playwright `events.html?v=events-toc-side-1`：计数 246；shell/toc/main 齐全；桌面 grid=`220px + main`，toc 与 main 并排；15 个版本链接；手机单列无横向溢出；控制台无报错。
- 截图：`artifacts/events-toc-side.png`、`artifacts/events-toc-side-mobile.png`。

### Notes
- `page.js`：活动页渲染壳 `wiki-events-shell`、侧栏目录、滚动高亮。
- `wiki-readability.css`：活动目录侧栏与响应式。
- `events.html`：`page.js?v=events-toc-side-1`。
- `artifacts/final-preview-2026-07-23/` 同步；`progress.md` 本段。
- 回滚：恢复 page.js/wiki-readability.css/events.html 本轮差异并删除截图与本段日志；勿整仓 restore。

## 2026-07-24 - Task: 补齐角色剧情车道并修复主线/幕后跳转

### What was done
- 角色剧情车道原先仅 3 条占位且无封面；现从代理人 enrichment 迁入 54 条「代理人档案」索引卡（含封面、摘要、百科外链）。
- `loadPageState` 将 stories 纳入 wiki 迁移覆盖，避免空 localStorage 盖掉正式数据。
- 剧情车道切换条扩展到主线 / 幕后 / 活动页，幕后与主线可互相跳转并正确高亮。
- 同步 `data.js` / `page.js` 与独立预览闭包。

### Testing
- `node --check page.js`：通过。
- Playwright：
  - 主线 57 / 角色剧情 54 / 幕后 7 / 活动 246，均有封面。
  - 点击「角色剧情」→ `mainline.html?lane=stories`，高亮正确。
  - 点击「幕后」→ `behind-scenes.html` 且仍有车道条；再回「主线 / 媒体」→ 57。
  - 控制台无报错。

### Notes
- `data.js`：stories 54 条 + pageMeta.stories 分组。
- `page.js`：stories 迁移覆盖；laneSwitcher 跨页。
- `mainline.html` / `behind-scenes.html` / `events.html`：缓存 `lane-stories-1`。
- 预览同步、`progress.md` 本段。
- 回滚：恢复 data.js/page.js/三页 HTML 本轮差异；勿整仓 restore。

## 2026-07-24 - Task: 统一角色页媒体展示项（入场/待机/战败等）

### What was done
- 用户指出角色页媒体项不一致（如耀嘉音缺入场动画）。根因：wiki 镜像对各角色收录的图集 tab 本来就不齐；旧逻辑只把“有什么显示什么”，所以页面骨架看起来不统一。
- 角色页「相关影像」改为固定 6 槽：入场动画 / 待机动画 / 战败动作 / 影画展示 / 角色卡片 / 时装展示。有本地文件就显示，没有就显示“镜像未收录”空态，不热链、不伪造。
- 重跑 `scripts/build-agent-enrichment.py`：优先保留入场/待机/战败/影画 tab，图集上限提到 16；本地可复制资产已尽量搬入。
- 同步预览闭包。

### Testing
- `node --check character.js` / `agent-catalog.js`：通过。
- Playwright `character.html?id=astra-yao`：固定 6 槽；耀嘉音为 2/6（待机+影画有货，入场/战败等镜像缺文件显示空态）；`anby` 为 3/6；控制台无报错。
- 截图：`artifacts/character-astra-media-slots.png`。

### Notes
- `character.js`：统一媒体槽位渲染。
- `wiki-readability.css`：媒体槽位样式。
- `scripts/build-agent-enrichment.py`、`agent-enrichment.js`、`assets/gallery/**`：优先拷贝核心动画面板。
- `character.html` 缓存 `media-slots-1`；预览同步。
- **缺口说明**：耀嘉音百科页其实有入场/战败 GIF，但本地 `zzz-wiki` 镜像缺这些文件（只抓到部分 png/gif），所以目前只能空态。若要“搬全”，需授权从镜像源补抓/补拷这些 GIF 到本地，再重跑 enrichment。
- 回滚：恢复 character.js/css/enrichment 相关差异；勿整仓 restore。

## 2026-07-24 - Task: 电影放映档案 3 套视觉方向板
### What was done
- 新建独立原型页，展示三套全站视觉方向板（A 午夜放映室 / B 录像带索引柜 / C 章节银幕长卷），支持并排对比与单套聚焦切换（URL hash + 按钮）。
- 每套包含：首页/列表/详情三张微缩构图（使用仓库本地图片）、色板色块、字体/节奏/适合场景/风险/明确拒绝规格。
- 页面顶部包含选择指南与推荐混搭方案（A 首页 + C 节奏 + B 内页密度）。

### Testing
- `node --check film-archive-directions.js` → 通过，无语法错误。
- Python 静态检查 HTML 中 11 处本地资源引用（src/href）→ 全部文件存在。
- `git diff --check -- film-archive-directions.html film-archive-directions.css film-archive-directions.js` → 无空白问题。
- CSS 使用本地 @font-face（assets/fonts/*.woff2），无 Google Fonts 外联。
- 可访问性：语义按钮 + aria-pressed + focus-visible + 触控目标 >=44px + prefers-reduced-motion + 320px 无横向滚动。

### Notes
- `film-archive-directions.html`：新建方向板页面。
- `film-archive-directions.css`：新建独立实验样式（Hallmark stamp 首行）。
- `film-archive-directions.js`：新建最小原生 JS 切换控制器。
- `.hallmark/log.json`：在最前方新增 scope=prototype/film-archive-directions 记录。
- 回滚：删除 film-archive-directions.{html,css,js} 三个文件，并移除 .hallmark/log.json 第一条记录。

## 2026-07-25 - Task: 实施已批准的“午夜放映档案”首页首刀

### What was done
- 将正式首页从旧 Dual Gate 扩展为“午夜放映档案”七幕长卷：序幕·今晚放映、第一幕·选片、第二幕·演员表、第三幕·正片、第四幕·加映、第五幕·片后谈、片尾·关于档案；查档仍是主任务，PLAY 保持可跳过次行动。
- 首图继续使用本地 Random Play 主视觉，并以放映银幕、章节标识和场次节奏统一首页；桌面、平板、手机与 reduced-motion 均保持自然长卷阅读，不以视频或 3D 作为内容前置条件。
- 明确动效边界与 CSS 职责：伪元素单一职责，第二视觉职责使用具名节点；`motion.css` 不定义最终几何；首页样式限定在 `.home-page` / `.home-act` 作用域，避免向正式子页泄漏。
- 保留原有稳定 ID、动态内容宿主、栏目深链、编辑锚点与播放入口，未改数据契约、正式内容数据或 formal baseline。

### Testing
- `node --check scripts/capture-r1-baseline.mjs`：通过。
- `git diff --check -- design.md index.html theme-zzz.css motion.css scripts/capture-r1-baseline.mjs`：通过，无 whitespace error。
- `HOOXI_UI_OUTPUT_DIR="artifacts/home-midnight-screening-r2" npm run test:ui`：通过；59/59 截图、9/9 深链、10/10 交互、9/9 首页发布视口、21/21 七幕截图、5/5 全页截图、8/8 首页专项检查，`blockingFailures=0`、报告 `passed=true`。
- `npm run test:content`：失败 313 项；已确认均为 2026-07-24 内容迁移遗留，包括 1 项契约快照、4 项 ID 集合和 308 项 `updatedAt`，不由本轮 `design.md`、`index.html`、`theme-zzz.css`、`motion.css`、`scripts/capture-r1-baseline.mjs` 五个核心文件导致；本轮未改 `data.js` 或内容契约。
- `npm run test:formal`：按预期失败；报告本轮 `index.html`、`theme-zzz.css`、`motion.css` 漂移及 18 项既有其它漂移。为避免把内容迁移和无关工作树变化误写为正式发布状态，本轮未刷新 formal baseline。
- 人工检查 1440、768、390 三档 normal / reduced 截图：无标题裁切，无 topbar、nav 或 dock 遮挡，无缺图，放映黄未过量。

### Notes
- `design.md`：记录“午夜放映档案”首页设计合同、七幕节奏、配色、字体例外及 CSS / motion 边界。
- `index.html`：落实七幕语义结构、首图具名视觉节点，并保留稳定 ID、动态宿主和既有链接。
- `theme-zzz.css`：实现首页作用域内的放映配色、银幕章节构图和 1440 / 768 / 390 响应式最终几何。
- `motion.css`：实现首页克制入场、滚动状态与 reduced-motion 退化，不承担最终布局几何。
- `scripts/capture-r1-baseline.mjs`：扩展首页发布视口、七幕、全页、专项、深链和交互门禁。
- `docs/README.md`：更新正式首页七幕事实、CSS 长期约定与简短验证入口，移除过时模块墙口径。
- `docs/zzz-archive-positioning.md`：记录 A 首页 + C 节奏 + B 内页后续、精确配色、字体例外、七幕职责与明确不做范围。
- `.hallmark/log.json`：在数组最前新增 2026-07-25 home / Seven-Act Midnight Screening Scroll / custom 记录，保留旧 home 历史。
- `progress.md`：仅在历史末尾追加本轮实施、验证、文件与回滚记录。
- 测试产物：`artifacts/home-midnight-screening-r2/`，最终汇总为 `artifacts/home-midnight-screening-r2/report.json`。
- 回滚：只定点反向应用上述九个文件的本轮差异，并删除 `artifacts/home-midnight-screening-r2/`；禁止整仓 `restore`、`checkout` 或 `reset`，避免覆盖工作树中其他未提交改动。

## 2026-07-25 - Task: 修正首页首刀双轴审查问题

### What was done
- 将 Home 权威宏结构收敛为固定顺序的 `Seven-Act Midnight Screening Scroll`：序幕保留 Dual Gate，正式查档为主行动、PLAY 为可跳过次行动；导航合同同步加入养成。
- 首页批准 token、中文展示标题权重、直接 DOM 标题渲染、4pt 关键间距、一次性首屏入场和尾部文档流播放器面板已定点修正。
- 原 8 项首页专项中的 `home-animation-none-content-visible` 已扩展为测试态关闭动画、阴影、圆角和装饰伪元素后，验证七幕幕号/标题/主入口可见，并采集七幕主要内容布局签名（至少 6 种）。

### Testing
- `node --check scripts/capture-r1-baseline.mjs`：通过。
- `git diff --check -- design.md index.html theme-zzz.css motion.css scripts/capture-r1-baseline.mjs docs/README.md docs/zzz-archive-positioning.md progress.md`：通过；仅报告既有 CRLF 转换提示。
- 未运行完整 UI：`artifacts/home-midnight-screening-r2` 的 59 张截图与 8 项专项（含扩展后的去装饰检查）待复验。

### Notes
- `design.md`：替换 Home 宏结构表中的 `Seven-Act Midnight Screening Scroll` 段落，并在“一级导航固定语义”加入养成；回滚时仅回置这两个段落。
- `index.html`：替换 `#heroTitle` 开始标签，删除 `data-display-title` 与冗余 `aria-label`；回滚时仅恢复这两个属性。
- `theme-zzz.css`：替换 `.home-page` OKLCH token、`.home-page :is(.hero h1,.route-section h2,.about h2)`、`.home-page .hero h1`、`.hero-actions`、`.path-card .path-kicker`，删除 `.hero::before` 与所有 `.hero h1::after` 规则，并替换 `.music-player.cassette-dock` 面板规则；回滚时仅回置这些选择器。
- `motion.css`：新增 `home-hero-copy-in`、`home-hero-art-in`、`home-hero-curtain-in` 及对应 Home 首屏选择器，并更新 reduced-motion 选择器；回滚时删除这三组 keyframes/选择器并恢复原首屏动画规则。
- `scripts/capture-r1-baseline.mjs`：替换 `collectHomeHeroGeometry` 的标题断言数据，并扩展 `inspectAnimationDisabledVisibility` 与检查名 `home-animation-none-content-visible`；回滚时仅回置这两个函数和该检查条件。
- `docs/README.md`：替换“正式首页现在是”段落；`docs/zzz-archive-positioning.md`：替换“2026-07-23 的 Dual Gate”与“首页保留稳定 ID”段落；回滚时仅回置对应段落。
- `progress.md`：本条为本轮唯一追加记录；回滚时仅删除本条。
- 测试产物定点删除：`rm -rf "artifacts/home-midnight-screening-r2"`。禁止整仓 `restore`、`checkout` 或 `reset`；Hallmark 未改。

## 2026-07-26 - Task: 光栅影画推广到阵营页

### What was done
把角色页已验证的 X-ray 光栅影画推广到阵营页成员卡：5 张（不同阵营按实际成员数 4-5 张）立绘由整体黑白改为鼠标位置透出彩色，各卡独立感应，同一时刻只点亮指针所在那张。原先写死在角色页的注入逻辑抽成表驱动的通用函数，新增页面只需在 XRAY_TARGETS 登记宿主与感应区。

首页经排查只有 1 张立绘且已接入光栅，没有第二个可用位，未硬加图片凑数。主线/活动/幕后/剧情/培养五页以文字与截图为主，无整幅立绘，明确不接入并写入设计文档。

### Testing
全站回归 18 项（9 页 x 桌面/移动）全部 PASS：零 JS 报错、零横向溢出、时间轴无隐形项、非官方声明在位、黑白副本无残留 alt。
阵营页交互专项：5 张卡全部挂载（mounted 5 / veils 5），悬停第 2 张时 liveIdx 为 [1] 且 --mx/--my 正确写入，移开后复位为空，确认无互相干扰。
两个阵营对照：cunning-hares 挂 5 张、victoria-housekeeping 挂 4 张，按成员数正确适配。
截图证据 artifacts/faction-xray.png：AGENT 02 透出彩色、相邻 AGENT 03 保持黑白。

### Notes
改动文件清单：
- archive-tools.js — 角色页专用的 injectPortraitXray 重写为表驱动 mountXray + XRAY_TARGETS 配置表，新增阵营页目标项
- faction.html — 引入 design.css（光栅样式来源）
- DESIGN.md — 第 6 节标题由"角色页背景"改为"立绘交互"，补适用范围表、感应区选择原理、不接入页面的理由、黑白副本清空 alt 的无障碍要求

排查记录：阵营页首次接入悬停无反应，根因是 .agent-entry-head 自身 pointer-events:none 且被兄弟层 .agent-entry-glow 覆盖，事件改挂外层 .agent-entry 后正常。此坑已写入 DESIGN.md 避免复现。

回滚方式：git revert 本次 commit 即可。若只想关掉阵营页光栅而保留角色页，删除 archive-tools.js 中 XRAY_TARGETS 里 .agent-entry-head 那一项。上一稳定点 dd80e34。
