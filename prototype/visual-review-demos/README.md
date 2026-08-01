# HOOXI 视觉讨论 Demo（抛砖 · 非正式站）

> **性质**：只为对照审核稿 §3 视觉方向，一次性看几版气质。  
> **不是**施工稿；**不会**也不应并入 `index.html` / `app.js` / `styles.css` / `data.js`。  
> 来源假设：`docs/HOOXI-FUNCTION-VISUAL-REVIEW.md`（你发送的审核稿）§0 + §3。

## 怎么看

```bash
# 在仓库根目录
npx --yes serve prototype/visual-review-demos -p 5179
```

浏览器打开：`http://localhost:5179/`  

- 底栏左右键 / 屏幕底栏切换版本  
- 或 URL：`?v=home-archive` `home-play` `mainline` `roster` `play-shop`

## 五版分别回答什么

| 键 | 名称 | 对照稿 | 讨论点 |
|----|------|--------|--------|
| `home-archive` | 门面 · 档案为主 | §3.4 A + §0.3 主路径 | 冷店外、双 CTA、主按钮是否该是「浏览档案」 |
| `home-play` | 门面 · 进店为主 | 对拍 D2 另一极 | 暖霓虹加重后，还会不会像「查档站」 |
| `mainline` | 主线调查终端 | §3.4 B 工具光 | 版本轨 + 卡片密度是否够用、是否太游戏 HUD |
| `roster` | 角色与阵营墙 | §3.4 C | 选人墙熟悉感 vs 档案库秩序 |
| `play-shop` | PLAY 店内 2D | §3.4 F | 空间是否一眼懂；逃逸「去档案」是否够显眼 |

## 统一基因（五版共用，浓度不同）

- 凌晨录像店：档案编号、标签纸、VHS/CRT 点到为止  
- 店外冷 / 店内暖  
- 大字 + 留白（品牌屏）；工具屏先可读  
- 无自动声音；尊重 `prefers-reduced-motion`

看完直接说：「要 A 的门面 + C 的列表密度」之类即可。
