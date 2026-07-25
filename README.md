# Hooxi // 绝区零剧情档案

Hooxi 的《绝区零》剧情视频档案站。访客页面按静态网站发布；编辑入口通过后端账号会话认证，编辑在本机完成后手动推送到 Git 仓库。

> **在线访问网址**：[https://pokkan39.github.io/hooxi-zzz/](https://pokkan39.github.io/hooxi-zzz/)

## 最新改动说明 (2026-07-25)

- **首页霓虹视觉与动效（`home-neon.css` / `home-neon.js`）**：高对比黑黄/青撞色、故障切字、贴纸式幕号、鼠标跟随光标、卡片 3D 磁吸倾斜与视差高亮。
- **真数据 HUD 仪表盘（`live-hud.js` / `live-hud.css`）**：移除旧版的假 HUD 氛围词，将数据接上真实档案派生的统计（版本覆盖率环、实际记录数、真实出处计数）。
- **去 AI 感与首屏压缩**：压缩首屏留白，侧栏取消单字截断改为「总览/主线/角色/活动/养成/幕后」横排两字；播放器不压正文。
- **全站检索与深链跳转**：增加全站检索面板（支持标题、摘要、角色、版本）、随机探索入口、活动页多条件筛选；子页记录支持 `#id` 精准平滑定位与高亮。
- **内容扩充与修齐**：补全 55 条占位摘要与章节，补全 27 条角色标注；角色页增加配音（四语）、生日、专武、实装日期与关联档案；缺口如实标注。
- **资源与性能优化**：全站超大图片生成 1400px 限宽 WebP 副本（966MB → 88.9MB），`image-webp.js` 优先请求 WebP；子页支持 skip link；记录卡片响应式自适应防止横向溢出。

<!-- C4-PLAY-ENTRY -->
## 正式进店（PLAY）

- **唯一正式进店页**：[`tape-wall-sample.html`](tape-wall-sample.html)（HOOXI PLAY · 凌晨录像店）
- 正式首页次 CTA「进入录像店」深链到该页；失败/减动效用户可回档案浏览。
- 下列页面为**实验/样板**，非正式进店：`scroll-world-prototype.html`、`cinematic-slice.html`、`active-theory-sample.html`、`tech-direction-demos.html`、`wiki-style-sample.html`、`character-sample.html`。

## 用户打开哪个网址

当前 GitHub Pages 地址：

`https://pokkan39.github.io/hooxi-zzz/`

如果以后绑定了自定义域名，用户直接打开自定义域名即可。

## 编辑入口

公开页面右上角有黄色 `✦` 入口，点击进入 `editor.html`。

编辑页使用服务端账号密码登录。账号由服务端环境变量 `EDITOR_ACCOUNTS_JSON` 配置，仓库和公开页面不保存账号密码。

登录成功后仍只会编辑当前浏览器中的草稿；发布线上内容还需要 Git 仓库写权限。

## 本地编辑并发布

1. 打开网站，点击右上角 `✦`。
<<<<<<< HEAD
2. 输入编辑密码 ``。
=======
2. 输入服务端配置的账号和密码。
>>>>>>> c21b1ac (feat: 首页视觉升级、去AI感真HUD、全站检索与深链修复)
3. 在左侧选择页面，例如主线剧情、角色故事、往期活动或幕后/对谈。
4. 在左侧直接修改标题、简介、图片路径、视频链接、父级分组、父条目和分支名称。
5. 在"内容编辑"模式下，单击右侧模块会自动定位左侧设置；双击标题或简介可直接原地修改。
6. 每个左侧字段后的 `!` 说明按钮会解释用途、填写格式和影响范围。
7. 点击"刷新预览"，右侧真实网页会显示当前浏览器里的草稿效果。
8. 切到"布局拖动"，在右侧真实网页里点击"调整位置"，用鼠标拖动模块并导出 `layout-data.js`。
9. 内容确认后点"导出当前文件"，下载 `data.js`。
10. 用导出的 `data.js` 和 `layout-data.js` 覆盖仓库根目录同名文件。
11. 推送到 GitHub：

```bash
git status
git add data.js layout-data.js
git commit -m "更新剧情档案内容"
git push origin main
```

如果只改了其中一个文件，就只 `git add` 那一个。

## 独立视觉样板

- `cinematic-slice.html`：Active Theory 氛围首屏切片验证稿，使用黑场电影感、店外夜景 2.5D 视差、颗粒扫描线、极简 HUD、Space Grotesk/Space Mono 免费可商用字体和点击进店预渲染视频。
- `tech-direction-demos.html`：首页技术方向对照合集（5 向）：巨物首屏、帧序列滚动、信号控制台、点击驱动视频、性能/移动降级；仅用于讨论方向，不替换正式首页。
- `wiki-style-sample.html`：深色 Wiki 首页结构参考稿。
- `tape-wall-sample.html`：HOOXI PLAY 沉浸式录像店样板，包含店外待机、用户开门、镜头进店、左右分流、VHS 货架、CRT 看片台、邦布导航和 DeepSeek 待接入接待台。
- `scroll-world-prototype.html`：游戏式同页点击探索原型。首屏点击高清正门进店；随后可点击左侧"随便看看"原地浏览分类、磁带与看片台，或点击右侧"问问邦布"原地完成关键词问路。滚轮不推进流程，只有最终档案入口才跳转页面；左柜研究 GLB 已放入同源 `assets/scroll-world/`，访客无需启动额外模型服务即可加载。
- `prototype/hooxi-rebuild/index.html`：隔离的 HOOXI PLAY 游戏式单页 Demo。流程固定为 `HOOXI 厂商屏 → CLICK TO CONNECT 标题页 → 连接成片 → 店铺入口 → 橱窗确认 → 门廊 → 进门成片 → 店内`；仅按钮、热点、返回和 Escape 推进，不使用滚动驱动。两段 MP4 只在用户点击后加载，`?motion=1` 可强制评审完整动效；减少动态效果时直接使用海报进入下一状态。

样板均与正式首页隔离。本地启动仓库服务后，可打开 `scroll-world-prototype.html?motion=1` 强制评审完整进店动画；同时需在仓库外 `renders/door-entry-hd` 目录启动 `8092` 端口的静态服务。2.5D 到 3D 的资产规范、滚动镜头和 AI 接入路线见 `docs/HOOXI-PLAY-BUILD-PLAN.md`。

## 怎么分享源码

推荐直接发仓库地址：

`https://github.com/Pokkan39/hooxi-zzz`

如果打包 zip 发给别人，注意不要包含真实密钥、账号密码或 `backend/.env`。

## 域名安全说明

日常编辑 `data.js`、`layout-data.js`、图片和文案，不会影响域名。域名只会被这些操作影响：

- 修改 DNS 解析。
- 修改托管平台的 Pages / 部署设置。
- 删除或改错 `CNAME` 文件（当前仓库没有 `CNAME`）。
- 删除根目录 `index.html`。

所以让别人帮忙挂域名时，只让他处理域名和托管配置；内容发布仍由你本地编辑后推送到 Git。

## 本地预览

在项目目录执行：

```bash
python -m http.server 8080
```

然后访问 <http://localhost:8080/>。

## 2026-07-23 最终成品预览

独立本地预览位于 `artifacts/final-preview-2026-07-23/`。该目录只包含正式站运行闭包，不包含旧原型、研究截图、后端凭据或整个脏工作树。

```bash
cd artifacts/final-preview-2026-07-23
node serve-preview.mjs
```

然后访问 <http://127.0.0.1:4173/>；Windows 也可双击目录内的 `start-preview.cmd`。预览包未包含约 1.3GB 的可选角色动态图集，副本中对应图库已关闭以避免破图；账号会话与保存仍需原仓库的 `backend/server.js`。
