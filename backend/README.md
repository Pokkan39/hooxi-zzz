# Hooxi 安全登录与会话 API

这是可部署到阿里云函数计算自定义运行时的 Node.js API。它采用三账号（1 个 admin 账号 + 2 个 editor 账号）安全登录机制，并提供 CSRF/Origin 验证、会话保护和权限控制。

## 接口

- `POST /api/auth/login`：登录接口。接受 JSON 载荷 `{ id, password }`，成功后生成 HttpOnly Session Cookie 并返回用户信息与 CSRF Token。
- `GET /api/auth/session`：读取当前登录状态。
- `POST /api/auth/logout`：退出。清除会话并删除 Cookie。
- `GET /health`：健康检查。
- `GET /api/content/:filename`：读取 `data.js` 或 `layout-data.js` 的当前内容（需登录）。
- `POST /api/review/push`：编辑员推送草稿到 GitHub 检阅分支（需 editor+ 角色，需 GitHub 配置）。
- `GET /api/review/list`：列出 `review/` 前缀的检阅分支（需登录，admin 可见完整列表）。
- `GET /api/review/file?branch=<b>&file=<f>`：读取检阅分支上的指定文件（需登录，需 GitHub 配置）。
- `POST /api/review/publish`：管理员将检阅分支文件发布到 `main`（需 admin 角色，需 GitHub 配置）。

## 安全性设计

1. **三账号机制**：配置环境变量 `EDITOR_ACCOUNTS_JSON` 必须包含且仅包含 3 个账号（1 admin，2 editor），均需有唯一的 id、name、password 和 role（admin 或 editor）。
2. **密码存储**：启动时使用 `crypto.scryptSync` 配合随机生成的盐（salt）对密码进行哈希处理并存入内存。
3. **时序攻击防御**：在校验密码和 HMAC 签名时使用 `crypto.timingSafeEqual`。
4. **限流保护**：同一 IP 和账号在 10 分钟内限流最多尝试登录 5 次。
5. **CSRF 与 Origin 验证**：
   - 所有写操作（POST, PUT 等）都需要验证 `X-CSRF-Token`。
   - 生产环境下，未带有合法 CORS Origin 的请求或缺失 Origin 的写请求均会被拒绝。
6. **Cookie 安全**：使用 `HttpOnly`，`SameSite=Lax`，以及生产环境下的 `Secure`。

## 本地运行

复制 `.env.example` 中的环境变量到运行环境，设置 `EDITOR_ACCOUNTS_JSON`（测试环境的密码请使用占位符，避免在仓库泄露真实密码）。

如需使用 GitHub 检阅/发布功能，还需配置：

```
GITHUB_TOKEN=ghp_xxxxxxxx    # GitHub 细粒度 PAT，需 Contents 读写权限
GITHUB_REPO_OWNER=pokkan39
GITHUB_REPO_NAME=hooxi-zzz
```

然后执行：

```bash
npm test
npm start
```

Node.js 本身不会自动读取 `.env`，请由 IDE、PowerShell、容器或部署平台注入环境变量。真实初始密码只能放在部署环境中，不得提交到 GitHub；内测交付后应立即轮换三个账号的密码。

当前阶段不提供持久化改密或找回密码。需要轮换密码时，修改 `EDITOR_ACCOUNTS_JSON` 并重启服务。会话存放在单实例内存中，服务重启或实例回收后所有账号需要重新登录；正式多实例部署时应替换为公司统一身份系统和共享会话存储。
