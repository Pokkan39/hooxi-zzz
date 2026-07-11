# Hooxi GitHub 同步 API

这是可部署到阿里云函数计算自定义运行时的 Node.js API。它通过 GitHub OAuth 识别编辑者，并使用该编辑者的 GitHub 访问令牌读取或提交仓库文件。

## 接口

- `GET /api/auth/github/start`：跳转 GitHub OAuth。
- `GET /api/auth/github/callback`：校验 state、权限并建立 HttpOnly 会话。
- `GET /api/auth/session`：读取登录状态。
- `POST /api/auth/logout`：退出。
- `GET /api/archive?file=data.js`：读取 GitHub 最新文件和 blob SHA。
- `PUT /api/archive`：提交 `{file, content, sha}`；远程 SHA 变化时返回 409。
- `GET /health`：健康检查。

只允许写入 `data.js` 和 `layout-data.js`。访问令牌只保存在服务端内存，浏览器 Cookie 只有签名后的随机 session id，并使用 HttpOnly、Secure（生产环境）和 SameSite=None。

## 本地运行

复制 `.env.example` 中的环境变量到运行环境，然后执行：

```bash
npm test
npm start
```

Node.js 本身不会自动读取 `.env`，请由 IDE、PowerShell、容器或阿里云函数计算环境变量注入。

## GitHub OAuth App

OAuth 回调地址填写：

```text
https://你的-api-域名/api/auth/github/callback
```

公开仓库默认 scope 是 `public_repo read:user`；私有仓库将 `OAUTH_SCOPE` 改为 `repo read:user`。只有 GitHub 返回 `write`、`maintain` 或 `admin` 权限的协作者可以发布。

## 阿里云函数计算部署

使用 Node.js 18+ 自定义运行时，将启动命令设置为：

```text
node server.js
```

监听端口由函数计算注入的 `PORT` 决定。配置 `.env.example` 列出的环境变量，`NODE_ENV=production`，并把 `CORS_ORIGINS` 设置为 GitHub Pages 的准确 origin。

当前会话和 OAuth state 存在进程内存中，因此适合单实例初始部署。若开启多实例或实例回收，登录会失效；正式扩容时应将 `sessions` 和 `states` 替换为阿里云 Redis，并保持相同过期时间。令牌不得记录日志或下发给前端。
