# HOOXI Theme Board

## 用法

```
start F:\hooxi-zzz\prototype\theme-board\index.html
```

左上角导航条有 6 套方向按钮，键盘 `1`–`6` 直接切换。切换只改 `<html data-theme>` 属性，DOM 不动，刷新后保留上次主题（localStorage）。

分享特定主题的链接：`#signal-yellow` / `#hollow-terminal` / `#bellum-poster` / `#tape-slide` / `#proxy-shop` / `#zzz-mono`。

## 六方向速览

| # | 名称 | 直译 | 适合 |
|---|------|------|------|
| 01 | Signal Yellow | Random Play 本体 — 深渊黑+帝释天警示黄 | 默认主页、放大 logo、品牌主体 |
| 02 | Hollow Terminal | HDD / 故障控制台 — 墨底+屏幕青 | 文档、终端、归档长文 |
| 03 | Bellum Poster | 反乌托邦宣传海报 — 炭黑底+警示红 | 角色特辑、战役回顾 |
| 04 | Tape Slide | 打字机+微黄旧纸 — 纸白底+警示红 | 长文阅读、用户投稿 |
| 05 | Proxy Shop | 杂货霓虹 — 深紫黑+品红+青双色 | 娱乐视频、活动单页 |
| 06 | ZZZ Mono | 极端黑白 — 全去色+灰阶 | Fallback、Print、色弱模式 |

## 判定标准

1. 读长文是否闷
2. 是否有"AI 味儿"（渐变/脏蓝/脏紫）
3. 像不像"米哈游官网搬出来的页面"
4. 标题与正文权重是否撕裂 / 脱节
5. 在低亮度能否撑住信息密度

## 与正式站关系

本目录为隔离原型，正式站 `index.html` + `site.css` 未动。挑选方向后再合入正式流程。
