# 设计笔记 / Why Six?

## 为什么 6 套，不是 2 套

之前交付过 `palette-lab`（4 套色板小样）和 `vibe-switchboard`（3 套 vibe 切换器）。用户反馈：色板只是一小片，**真实落地要看整页排版**。这一轮把决策单元从 4 小片色板升到 6 套完整 hero + 卡片 + 档案段，决策颗粒度拉满。

6 套的挑选原则：

- **01 Signal Yellow** — 最接近 Random Play 官网本体，风险最低
- **02 Hollow Terminal** — 长文档场景的工程性选择
- **03 Bellum Poster** — 角色特辑 / 回顾特辑的爆点选择
- **04 Tape Slide** — 打字机档案员反差，可读性最佳
- **05 Proxy Shop** — 唯一双色拼贴，最有"杂货铺"生活气
- **06 ZZZ Mono** — 极端 fallback（打印 / 色弱 / 灰阶阅读）

## 为什么锁定 ZZZ 6 色

前面出现过品红 + 青双色这套被误判为 "AI 配色"。这一轮的所谓"AI 味"本身是歧义 — 重点不是"有没有彩色"，而是**彩色是否被用来大面积铺底**。本项目所有 6 套遵循同一约束：

> accent 小面积高冲击，大面积留黑 / 白 / 墨

因此 Signal Yellow 的黄、Hollow Terminal 的青、Bellum 的红，都是 **1px 边框、角标、眉条级** 的用法，不会出现大面积彩色渐变或彩色底。

## 共享骨架

六套共用同一份 DOM 和同一节 CSS 应用层（`body::before` 噪点、`.tb-hero-ghost` 鬼字、`.tb-card`、`.tb-doc`）。切换逻辑只改 `<html data-theme>` 属性。原因：决策时只比较"皮肤"，不比较"骨架细节"。
