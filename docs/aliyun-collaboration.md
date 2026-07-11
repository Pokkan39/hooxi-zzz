# Hooxi 独立阿里云多人同步部署

## 架构与隔离边界

```text
GitHub Pages / 浏览器
    ↓ GET、PUT /site-data
独立 Hooxi 函数计算函数
    ↓ 读写单一 JSON 对象
私有 OSS：hooxi-zzz/site-data.json
```

该函数必须作为独立游戏函数部署。不要修改或复用菜谱函数的 `/recipes` 路由，也不要把 `OBJECT_KEY` 设置为 `recipe-site/recipes.json`。可以复用同一个阿里云账号或 Bucket，但函数、接口路径和对象键必须保持独立。

## 1. 创建函数

1. 在阿里云函数计算创建 Node.js 18 或更新版本的事件函数，并添加 HTTP 触发器。
2. 上传目录 `aliyun/site-data-api/` 的完整内容。部署包需要包含执行 `npm install` 后生成的 `node_modules/`。
3. 函数入口设置为：

```text
index.handler
```

4. 允许 HTTP 方法：`GET`、`PUT`、`OPTIONS`。
5. 对外接口路径必须能以 `/site-data` 命中函数。

## 2. OSS 与执行角色

- Bucket 保持私有，不要设置为公开写入。
- 给函数绑定执行角色，最小权限只需读取、创建和覆盖目标对象。
- 默认对象键为 `hooxi-zzz/site-data.json`。首次 GET 会返回版本 0 和空数据；编辑者第一次保存后自动创建对象。
- 不要在代码或 GitHub Pages 中填写长期 AccessKey。

## 3. 环境变量

| 变量 | 示例 | 说明 |
|---|---|---|
| `BUCKET_NAME` | `my-site-data` | 私有 OSS Bucket 名称 |
| `OSS_REGION` | `oss-cn-shanghai` | Bucket 所在地域 |
| `OBJECT_KEY` | `hooxi-zzz/site-data.json` | 可省略，默认即为该值 |
| `EDIT_PASSWORD` | 使用长随机密码 | 共享编辑密码，只保存在函数环境变量中 |
| `ALLOWED_ORIGIN` | `https://pokkan39.github.io` | 允许访问的前端来源；多个来源以逗号分隔 |

内测排查 CORS 时可以暂用 `ALLOWED_ORIGIN=*`，正式使用应限制为 GitHub Pages 来源。共享密码适用于小团队，不提供独立账号、撤销单个成员或操作审计。

## 4. 填写前端 API 地址

部署完成后，将函数 HTTP 触发器公网地址填入根目录 `sync.js` 顶部：

```js
const HOOXI_API_BASE_URL="https://你的独立游戏函数公网地址";
```

代码会自动请求：

```text
GET  https://你的地址/site-data
PUT  https://你的地址/site-data
```

如果触发器地址包含路径前缀，需要确保最终拼接出的 `/site-data` 能命中游戏函数。不要填写菜谱函数地址。

## 5. 编辑和同步行为

- 普通访客只执行 GET，不需要密码。
- 点击右上角 `✦` 后可编辑；输入过程会在当前页面即时预览。
- 首次保存会要求共享密码，密码仅保存在当前标签页会话的 `sessionStorage` 中。
- 保存成功后版本号递增，其他在线页面按 5 秒轮询获取新版本。
- 如果两人从同一版本开始编辑，先保存者成功；后保存者收到 `409` 冲突提示，云端内容不会被静默覆盖。
- 正在编辑且存在未保存内容时，远端新版本不会覆盖当前表单。
- 图片和视频只同步公开 URL 或仓库相对路径，不上传媒体文件。
- 全站“调整位置”产生的桌面、平板、手机布局数据会随站点数据一起保存；拖动只会标记未保存，点击“保存布局到云端”或现有保存按钮后才写入云端。
- 音量和播放模式仍是每位访客的本地偏好；共享数据只包含歌曲名称、URL 和顺序。

## 6. 验证步骤

### 函数本地检查

```bash
cd aliyun/site-data-api
npm install
npm test
node --check index.js
```

测试应覆盖错误密码、首次保存、版本递增、非法结构、CORS 和双客户端旧版本冲突。

### 线上验证

1. 浏览器直接访问独立函数的 `/site-data`，应得到 JSON 和版本字段。
2. 打开网站，状态应从“正在连接”变为“云端尚未初始化”或“已同步”。
3. 浏览器 A 打开编辑器，修改标题并保存。
4. 浏览器 B 或手机保持页面打开，5 秒左右应自动看到 A 的更新。
5. A、B 同时基于同一版本修改：A 先保存，B 再保存；B 必须看到版本冲突，A 的内容应保留。
6. 在 OSS 控制台确认只创建或修改 `hooxi-zzz/site-data.json`，菜谱对象没有变化。
7. 回归首页及四个档案页，并确认播放器仍显示 41 首默认歌曲。

## 7. 故障与回滚

- API 不可用时，页面会使用最近一次有效缓存或仓库默认数据，并显示离线状态。
- 如需临时停用云端同步，把 `sync.js` 中 `HOOXI_API_BASE_URL` 改为空字符串；访客仍可浏览默认数据，但共享保存会被阻止。
- 如需恢复云端内容，先备份 OSS 对象，再将 `hooxi-zzz/site-data.json` 恢复到所需版本。
- 如需完整撤销本功能，恢复五个 HTML、`app.js`、`page.js`、`data.js`、`styles.css`，删除 `sync.js` 和 `aliyun/site-data-api/`。
- 不要通过修改菜谱函数或菜谱 OSS 对象来回滚游戏站。
