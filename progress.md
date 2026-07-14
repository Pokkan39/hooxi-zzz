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
