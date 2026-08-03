# HOOXI Theme Board — Build Manifest

## 项目
- **仓库**: `F:\hooxi-zzz`（隔离原型，不影响正式站）
- **交付位置**: `F:\hooxi-zzz\prototype\theme-board\`
- **下游消费**: 正式站 `F:\hooxi-zzz\index.html` / `styles/site.css`（本阶段未动）

## 资产

### Source Files（新增）
| 文件 | 角色 |
|------|------|
| `index.html` | 单页 6 主题切换样板骨架 |
| `tokens.css` | ZZZ 6 色 + 4pt 间距变量 |
| `theme-board.css` | 六主题组件应用层 |
| `theme-board.js` | 主题切换器（按钮 + 键盘 1-6 + hash + localStorage） |
| `.hallmark/manifest.md` | 本文件 |
| `.hallmark/log.json` | Theme Aesthetic 6 条记录 |
| `RISKS.md` / `NOTES.md` / `README.md` | 先行文件 |

### Binary Assets（复用正式站）
| 路径 | 用法 |
|------|------|
| `assets/hero/random-play-keyart.webp` | Hero 主视觉 |
| `assets/portraits/miyabi-card.webp` | 代理人卡片 |
| `assets/portraits/anby-card.webp` | 代理人卡片 |
| `assets/portraits/zhu-yuan-card.webp` | 代理人卡片 |
| `assets/portraits/nicole-demara-card.webp` | 代理人卡片 |

### 生成方式
- Artistic：未生成图像；噪点为内联 SVG `feTurbulence`
- Descriptive：Hero / 卡片引用现成 WebP 资产

## 6 主题技术矩阵
| # | data-theme | 底纹 | 强调 | 第二强调 | rank 权重 |
|---|------------|------|------|----------|----------|
| 01 | signal-yellow | `#0d0d0f` 深黑 | `#ffd60a` 警示黄 | — | S=黄 / A=纸白 |
| 02 | hollow-terminal | `#041014` 墨青黑 | `#00e5d4` 屏幕青 | — | S=青 / A=纸白 |
| 03 | bellum-poster | `#0e0808` 枣红暗底 | `#e62429` 警示红 | — | S=红 / A=纸白 |
| 04 | tape-slide | `#f2efe4` 纸白微黄 | `#e62429` 警示红 | — | S=红 / A=黑 |
| 05 | proxy-shop | `#08040d` 紫黑 | `#ff2e88` 品红 | `#00e5d4` 青 | S=品红 / A=青 |
| 06 | zzz-mono | `#ffffff` 纯白 | `#0d0d0f` 黑 | — | S=黑 / A=黑 |

全部零渐变；`mix-blend-mode` 用于噪点；`clip-path: polygon` 用于 45° 切角；硬阴影 `box-shadow` 影印点画感。

## 已验证
- `node --check theme-board.js` → 语法 OK
- Python AST 解析难度高（CSS 无编译），依赖浏览器渲染
- 结构性自审：6 主题至少各 1 个 token 差异（底/强调/阴影/鬼字/rank）

## 未验证（已知缺口）
- 真机截图（无 playwright/chrome headless 自动化环境，靠人手启动）
- 移动 990px 视口排版（仅 CSS media query 做了宽断）
- 长文 ≥ 40 行 阅读疲劳（只埋了单一段样本）
- 暗色对比 AAA（`--tb-text-3` 在 mono 下可能低于 7:1）

## 已知偏差
- 实际资产要求 `<img>` 路径为 `../../assets/...`，正式站根是 `assets/...` —— 原型层用相对上一级仓储引用
- `_scaffold-readme.md` 未删除（它是 scaffold 自身的 readme，而不是交付页 readme，按 Hallmark 流程保留）
