# Hooxi // 绝区零剧情档案

Hooxi 的《绝区零》剧情视频档案站。当前发布方式是**纯静态网站**：访客只看内容，编辑在本机完成，最后手动推送到 Git 仓库。

## 用户打开哪个网址

当前 GitHub Pages 地址：

`https://pokkan39.github.io/hooxi-zzz/`

如果以后绑定了自定义域名，用户直接打开自定义域名即可。

## 编辑入口

公开页面右上角有黄色 `✦` 入口，点击进入 `editor.html`。

编辑密码：`Hooxi777771`

连续输错 5 次会锁定 10 分钟。

这个密码只是静态页面里的防误入门槛；真正防止别人改线上网站的是 Git 仓库写权限。没有仓库写权限的人，即使打开编辑页，也只能改他自己浏览器里的草稿，不能改线上网站。

## 本地编辑并发布

1. 打开网站，点击右上角 `✦`。
2. 输入编辑密码 `Hooxi777771`。
3. 选择 `data.js` 或 `layout-data.js`。
4. 编辑内容后可点“保存到本机”保存浏览器草稿。
5. 确认无误后点“导出当前文件”。
6. 用导出的文件覆盖仓库根目录里的同名文件。
7. 推送到 GitHub：

```bash
git status
git add data.js layout-data.js
git commit -m "更新剧情档案内容"
git push origin main
```

如果只改了其中一个文件，就只 `git add` 那一个。

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
