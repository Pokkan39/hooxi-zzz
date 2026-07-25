# RandomPlay 模型转换与 HOOXI PLAY 接入计划书

## 1. 文档目的

本计划用于把用户提供的 Random Play 场景模型安全转换为可供 HOOXI PLAY 研究原型使用的网页资产，并进一步制作滚动驱动的连续录像店体验。

本计划定义工作流程、风险门槛、产物和验收标准。当前已完成仓库外安全审计、Blender 导入诊断及“最左贴墙书柜 + 4 件物品”的本地研究 GLB Spike，独立网页样板可通过显式 `assets` 参数加载该左柜；其余场景主体尚未实时化。模型仍未获得公开发布授权。

本轮不执行以下操作：

- 不解压原始模型包。
- 不执行压缩包中的 Python 或着色器脚本。
- 不安装 Blender、PMX 插件或其他软件。
- 不把原始 ZIP、PMX、FX 或贴图复制进公开仓库。
- 不修改正式首页或现有 HOOXI PLAY 样板。

## 2. 已核验资产基线

### 2.1 原始文件

```text
C:\Users\Rage\Downloads\RandomPlay_by_给你柠檬椰果养乐多你会跟我玩吗_4998711e9ffb43b0204775ded6439651.zip
```

| 项目 | 核验结果 |
|---|---|
| 压缩格式 | ZIP，Deflate |
| 压缩包大小 | 约 192 MB |
| 解压总规模 | 207,808,527 字节，约 198 MB |
| 文件记录数 | 643 项 |
| SHA-256 | `5e1e30188c3594279233d5239b30df7b2a569bd1d675cc9d1709d7ea1fc50164` |
| 完整性 | `unzip -t` 全部通过，无 CRC 错误 |
| 主模型 | `RandomPlay.pmx`，11,011,415 字节 |
| 材质 | `mat/mat_000.fx` 至 `mat/mat_149.fx`，另有多组屏幕材质 |
| 贴图 | `tex2/` 内大量颜色、金属/光滑度、法线 PNG；`tex3/` 内 3 张额外 PNG |
| 附带脚本 | `mat/script.py`，用于根据贴图生成 MME FX 材质 |
| 可执行程序 | 目录中未发现 EXE、DLL、BAT、CMD 等程序 |

### 2.2 本地源模型归档

原始 ZIP 已按安全处理方案隔离存档于 `reference-materials/3d-models/random-play/`：

| 项目 | 说明 |
|---|---|
| `archive/` | 原始 ZIP 副本，`SHA-256: 5e1e30188c3594279233d5239b30df7b2a569bd1d675cc9d1709d7ea1fc50164` |
| `extracted/RandomPlay.pmx` | 解压主入口，11,011,415 字节，PMX magic `PMX ` 有效 |
| `extracted/mat/` | 150 组 `.fx` MME 材质定义（可参考但不可用于网页） |
| `extracted/tex2/`, `extracted/tex3/` | 461 张 PNG 纹理，法线、金属/光滑度、基础色通道 |
| `extracted/materials_common_2.0.fxsub` 等 | 共 176 个 FX 效果文件 |
| `inventory.txt` | 记录 SHA-256 与来源声明，确认源资产身份 |
| 总规模 | 640 个文件，207,808,527 字节 |

该目录为**只读源和参考资产**：所有原始文件必须保持不变，不得作为网页资源直接加载。任何发布衍生物前必须通过本文第3节授权决策门，确认替换和重制内容。

### 2.3 本地参考视频归档

用户提供的游戏内录像店参考视频已归档于 `reference-materials/videos/random-play/`：

| 项目 | 说明 |
|---|---|
| `archive/` | 原始 MP4 副本，`SHA-256: 418ce68476e311e3a61118294ca89dc4a72db5c3dab64e0ec80feff8755923b4` |
| `inventory.txt` | 记录视频参数、抽帧目录、工作标签和分析限制 |
| `analysis/frames-5s/` | 41 张 5 秒间隔参考帧 |
| `analysis/contact-sheets/contact-5s.jpg` | 全视频 5 秒抽帧联系表 |
| `analysis/shot-diff-1s.json` | 1 秒间隔视觉变化检测，用于定位需要密集抽帧的区间 |
| `analysis/dense-segments/` | 入口动线、中段过渡和后段路线的密集抽帧联系表 |
| 视频参数 | 1920×1080，约 60 FPS，12,190 帧，约 203.17 秒 |

该视频用于校准入场动线、店内空间关系、货架/前台/CRT 位置和镜头节奏。部分自动/子代理标签基于镜头差异和帧文件名推断，不能替代人工看图复核；最终布局仍需以联系表和关键帧人工确认。

### 2.4 格式判断

`RandomPlay.pmx` 是 MikuMikuDance 使用的 PMX 模型，不是浏览器可直接使用的 glTF/GLB。压缩包里的 `.fx` 和 `.fxsub` 是 MME/HLSL 风格材质定义，Three.js 和标准 glTF PBR 不会直接识别。

要用于网页，必须经过以下转换：

```text
ZIP（隔离解压）
→ PMX（Blender 导入）
→ 材质与贴图重建
→ 场景拆分、减面、合批
→ GLB/KTX2
→ 实时 WebGL 或离线镜头渲染
→ Scroll World 滚动擦洗
```

## 3. 使用边界与授权决策门

### 3.1 当前判断

模型名称、纹理编号、材质结构和 Random Play 场景指向表明，它可能是游戏场景转制或基于游戏资产制作的 PMX 模型。压缩包内没有发现明确许可证文件或 HoYoverse 授权说明。

因此默认采用以下边界：

- 允许：本地研究、模型结构评估、私人镜头测试和不公开的技术原型。
- 暂不允许：把原始模型或贴图提交到公开 GitHub、部署为公开可下载网页资产、商业发布、二次售卖或再分发。
- 公开发布前必须补充：资源原始发布页、作者许可、允许用途、署名方式和 HoYoverse 二创政策核验。

### 3.2 两条实施路径

#### 路径 A：研究原型

直接在本地使用转换后的模型制作镜头测试，但所有源资产、GLB 和视频都保留在未公开目录。该路径用于确认空间、镜头和滚动节奏，不用于正式上线。

#### 路径 B：可公开发布版本

以原模型为比例和空间参考，重制或替换以下内容：

- 店名、Logo、海报、录像封面和屏幕内容。
- 高识别度游戏纹理和品牌标识。
- 来源不明或不能证明授权的贴图。
- 必要时重建建筑、柜台、书架和门体网格。

最终只发布原创 HOOXI PLAY 场景、原创贴图及有明确授权的通用材质。

### 3.3 授权决策记录

进入公开发布阶段前，必须在项目文档中记录：

```text
资源名称：
原始发布页：
作者：
许可证：
允许商用：是 / 否 / 未知
允许修改：是 / 否 / 未知
允许重新分发：是 / 否 / 未知
署名要求：
HoYoverse 二创政策核验日期：
最终决定：仅研究 / 可公开非商用 / 可公开商用
```

没有明确证据时，最终决定只能是“仅研究”。

## 4. 安全处理方案

### 4.1 隔离目录

原始包不得直接解压到仓库。建议使用：

```text
C:\Users\Rage\Documents\Hooxi-Model-Lab\random-play\
├── source\       原始 ZIP，只读保留
├── extracted\    解压后的 PMX、FX、PNG
├── blender\      Blender 工程
├── audit\        检查结果和授权证据
├── exports\      GLB、海报和镜头测试
└── renders\      Scroll World 视频片段
```

该目录必须位于仓库外，避免误提交大型或授权不明资产。

### 4.2 解压规则

- 解压前复核 SHA-256 是否仍为本文记录值。
- 只使用可信解压工具。
- 检查路径穿越、绝对路径和异常长文件名。
- 不执行包内 `mat/script.py`。
- 不把 `.fx` 当成网页脚本；只作为材质参数参考。
- 首次打开 Blender 文件或导入 PMX 时关闭 Auto Run Python Scripts。

### 4.3 PMX 插件规则

- PMX 导入插件只从官方仓库或 Blender 扩展来源获取。
- 固定插件版本和下载地址。
- 导入前检查插件代码，不使用模型包附带的未知插件。
- 插件只用于导入，不将其打包进网页。

### 4.4 原始文件保护

- 原 ZIP 设置只读或保留哈希副本。
- 所有清理、重命名和材质修改只在 Blender 工程副本中进行。
- 不覆盖 `RandomPlay.pmx` 和原始 PNG。
- 每个阶段保留可回滚的 `.blend` 版本。

## 5. 工具准备

### 5.1 必需工具

| 工具 | 用途 |
|---|---|
| Blender LTS | PMX 导入、场景清理、材质重建、镜头和 GLB 导出 |
| 可信 PMX 导入插件 | 把 PMX 转入 Blender |
| glTF Validator | 检查 GLB 结构和扩展兼容性 |
| gltf-transform | Meshopt/Draco、纹理处理、场景检查 |
| FFmpeg / FFprobe | Scroll World 镜头编码、抽帧和参数核验 |
| KTX-Software | 将纹理压缩为 KTX2/BasisU |

### 5.2 当前环境缺口

本次只读检查未在命令行环境检测到 Blender、FFmpeg 或 FFprobe。后续安装属于正式环境变更，执行前应单独确认安装来源、版本和磁盘空间。

### 5.3 建议版本

- Blender：当前稳定 LTS。
- Node.js：沿用当前项目版本。
- glTF：2.0。
- 视频：H.264 MP4 为基础兼容格式，可补 WebM/AV1。
- 纹理：KTX2 为实时 3D 首选，WebP/JPEG 用于海报和预渲染流程。

## 6. 第一阶段：隔离解压与资产审计

### 输入

- 原始 ZIP。
- 本文记录的 SHA-256。

### 操作

1. 创建工作区外的隔离目录。
2. 复制原 ZIP 到 `source/`，不移动原文件。
3. 再次执行哈希和 ZIP 完整性检查。
4. 解压到 `extracted/`。
5. 统计文件类型、尺寸、贴图分辨率和重复文件。
6. 检查 PMX 模型元数据、作者注释、材质名、骨骼、变形和贴图路径。
7. 收集许可证、说明文件及原始发布页证据。

### 产物

```text
audit/archive-sha256.txt
audit/archive-list.txt
audit/texture-inventory.csv
audit/model-metadata.txt
audit/license-decision.md
```

### 验收标准

- ZIP 哈希和 CRC 与初检一致。
- 解压目录不存在路径逃逸。
- 所有文件类型和来源均有记录。
- 未执行任何包内脚本。
- 授权状态明确标注为“已确认”或“未知”，不得留空。

### 回滚

删除 `extracted/` 与 `audit/` 即可；原 ZIP 和仓库不受影响。

## 7. 第二阶段：PMX 导入与场景诊断

### 输入

- 隔离解压后的 PMX 和贴图。
- 可信 PMX 导入插件。

### 操作

1. 新建空白 Blender 工程。
2. 关闭 Auto Run Python Scripts。
3. 导入 PMX，不加载模型包中的 Python。
4. 检查模型方向、单位、原点、包围盒和法线。
5. 记录对象、网格、顶点、三角面、骨骼、材质槽和纹理数量。
6. 检查是否为整店单网格，以及门、玻璃、灯牌、屏幕、前台和书架能否独立控制。
7. 检查贴图缺失、透明度、双面材质、法线方向和 UV。
8. 输出四张诊断图：店外、门口、主厅、前台。

### 产物

```text
blender/00-import-raw.blend
audit/blender-scene-report.md
audit/screenshots/storefront.png
audit/screenshots/doorway.png
audit/screenshots/main-hall.png
audit/screenshots/front-desk.png
```

### 验收标准

- 模型可在 Blender 中打开，无崩溃。
- 主要空间和物体可识别。
- 缺失贴图和错误材质有明确清单。
- 场景面数、材质数和内存占用已记录。
- 未对原 PMX 和原贴图做写入。

### 停止条件

出现以下任一情况时暂停：

- PMX 无法稳定导入。
- 模型只包含局部场景，无法支持既定镜头。
- 主要 UV 或几何损坏严重。
- 发现未知可执行依赖。
- 授权风险被确认不可接受。

## 8. 第三阶段：场景整理与 HOOXI PLAY 改造

### 8.1 坐标与尺度

- 统一为 Blender 米制。
- 地面中心设为世界原点附近。
- 前门朝向统一轴向，便于相机轨迹和网页坐标控制。
- 应用必要的旋转和缩放，但在操作前保留导入原始版本。

### 8.2 对象拆分

至少拆分并稳定命名：

```text
ENV_Building
ENV_Street
DOOR_Left
DOOR_Right
SIGN_HooxiPlay
WINDOW_Left
WINDOW_Right
INTERIOR_Counter
INTERIOR_Shelves
INTERIOR_CRT
INTERIOR_Backroom
LIGHT_Sign
LIGHT_Interior
SCREEN_Concierge
```

门、灯牌、屏幕和镜头会参与动画，必须是独立对象。纯静态小物件可合并。

### 8.3 品牌改造

- 店名改为原创 `HOOXI PLAY`。
- 替换 Random Play、游戏 Logo 和来源不明标牌。
- 录像盒统一使用 HOOXI 原创封套或无版权风险的抽象图形。
- 邦布接待区使用原创 H-01 设计，不直接分发游戏角色模型。
- 屏幕画面使用 HOOXI 自有 UI。

### 8.4 材质重建

PMX/FX 材质映射到 glTF PBR：

| 原资源 | glTF 目标 |
|---|---|
| `Tex_###.png` | Base Color |
| `Tex_###_N.png` | Normal |
| `Tex_###_M.png` | 依据通道检查后拆分为 Metallic/Roughness/Emissive |
| 屏幕 FX | Emissive + 独立视频/图片层 |
| 玻璃 FX | Alpha Blend/Transmission，按兼容性降级 |

不能假设 `_M` 的通道语义；必须抽样检查并通过渲染对比确认。

### 产物

```text
blender/01-clean-scene.blend
blender/02-hooxi-branding.blend
audit/material-map.csv
audit/replaced-assets.md
```

### 验收标准

- 所有可动画对象有稳定名称。
- HOOXI PLAY 门头与关键 UI 已替换。
- 材质不依赖 MME FX。
- 法线、透明和发光效果在 Blender Eevee 中可正确预览。
- 所有替换资产有来源和授权记录。

## 9. 第四阶段：网页性能优化

### 9.1 优化目标

原始场景约 150 个主要材质，不适合直接部署。目标如下：

| 项目 | 桌面目标 | 移动目标 |
|---|---:|---:|
| 场景 GLB | ≤ 12 MB | ≤ 5 MB |
| 材质数量 | 15–30 | 8–16 |
| 主纹理 | 2048 上限 | 1024 上限 |
| 普通小物件纹理 | 1024/512 | 512 |
| 首屏加载 | ≤ 3 MB | ≤ 1.5 MB |
| 动画帧率 | 50–60 FPS | 30–60 FPS |
| 主线程长任务 | < 50 ms | < 50 ms |

### 9.2 网格优化

- 删除镜头永远不可见的背面和封闭内部几何。
- 合并静态小物件，保留门、灯、屏幕等交互节点。
- 对高密度装饰执行受控减面，避免破坏轮廓。
- 相同录像盒和小物件使用实例化。
- 删除不参与动画的骨骼、刚体、Morph 和 MMD 辅助数据。
- 导出前三角化并检查法线。

### 9.3 材质与纹理优化

- 合并同类材质和重复纹理。
- 为静态小物件制作纹理图集。
- Base Color 使用 KTX2 ETC1S；法线和质量敏感贴图评估 UASTC。
- 删除未使用贴图和无效 74 字节占位 PNG。
- 对屏幕画面使用独立小纹理或视频，不嵌入大型图集。
- 使用 Meshopt 压缩；Draco 只在兼容性与加载收益明确时启用。

### 9.4 输出分层

```text
exports/random-play-research-desktop.glb
exports/random-play-research-mobile.glb
exports/random-play-poster.webp
exports/random-play-manifest.json
```

研究路径的输出不得进入公开仓库。公开版本应使用 `hooxi-play-*.glb` 并确认资产均已替换或获授权。

### 验收标准

- glTF Validator 无 Error。
- GLB 在 Three.js GLTFLoader 中正确显示。
- 不依赖外部绝对路径。
- 材质、透明、法线和发光无明显错误。
- 桌面和移动资产满足体积预算，或有明确超标说明和降级方案。

## 10. 第五阶段：镜头与 Scroll World 资产

### 10.1 技术选择

目标效果参考 Scroll World：滚动位置控制预渲染视频时间轴，不要求浏览器实时渲染完整高精度场景。

模型主要用于：

- 保持场景空间一致。
- 自由设计相机轨迹。
- 渲染锚点静帧和连接镜头。
- 为低端设备生成海报。

实时 GLB 只作为可选增强，不作为首屏唯一方案。

### 10.2 六段场景

#### 场景 1：夜街待机

- 远景可见 HOOXI PLAY 门头。
- 灯牌微弱闪烁，街道保持低运动量。
- 页面显示“滚动或点击进入”。

#### 场景 2：门头点亮与开门

- 镜头缓慢靠近门口。
- 门头点亮，左右门体打开。
- 下一段首帧必须与本段尾帧一致。

#### 场景 3：进入前台

- 镜头穿过门洞进入主厅。
- 右侧邦布接待台成为视觉中心。
- DOM 显示“自己翻看 / 问问邦布”两种入口。

#### 场景 4：左侧书架

- 镜头从前台转向 VHS 货架。
- 剧情、角色、活动、幕后分类以 DOM 热区覆盖。
- 不把可读文字烘焙进视频。

#### 场景 5：看片台

- 镜头靠近 CRT 或录像机。
- 抽出的磁带进入设备。
- 画面衔接站内剧情档案预览。

#### 场景 6：接待终端

- 镜头回到邦布终端或屏幕。
- 展示站内搜索和 DeepSeek 待接入入口。
- 最后过渡到普通网页内容，停止视频擦洗。

### 10.3 镜头规则

- 不使用突兀切镜，优先连续相机轨迹。
- 每段生成真实锚点静帧。
- 相邻视频使用上一段真实尾帧和下一段真实首帧作为连接条件。
- 接缝采用 SSIM 或像素差检查，不只依赖肉眼。
- 滚动只控制视频时间，不在每个滚轮事件中触发网络请求。
- 滚动过快时直接映射目标时间，不排队播放动画。

### 10.4 视频输出

建议输出：

```text
renders/desktop/scene-01.mp4
renders/desktop/scene-01-to-02.mp4
renders/desktop/scene-02.mp4
...
renders/mobile/scene-01.mp4
renders/posters/scene-01.webp
```

编码建议：

- 桌面基础版：H.264，1080p，24/30 FPS。
- 可选增强：WebM/AV1。
- 移动版：720p，减少片段数量和码率。
- 每段视频设置快速启动元数据，支持 Blob 加载和定位。

### 验收标准

- 六段场景顺序与交互文案一致。
- 相邻片段无明显跳帧、亮度突变和透视跳变。
- 停止滚动时画面稳定。
- 快速滚动不会积累动画或卡死。
- 视频加载失败时显示对应海报和 DOM 导航。

## 11. 第六阶段：网页接入

### 11.1 独立原型优先

先创建独立的 Scroll World 原型，不直接替换 `index.html`：

```text
scroll-world-sample.html
scroll-world-sample.css
scroll-world-sample.js
assets/scroll-world/
```

原型通过验收后，才讨论正式首页迁移。

### 11.2 前端结构

```text
main.scroll-world
├── canvas/video 视觉层
├── section.scene-anchor × 6 滚动区间
├── DOM 文案和交互热区
├── 加载/错误/低性能降级
└── 普通档案内容入口
```

### 11.3 状态机

页面至少包含：

```text
idle
loading
ready
scrubbing
fallback
error
```

所有状态必须可恢复，不能因视频或 GLB 加载失败阻塞访问。

### 11.4 设备分层

| 设备能力 | 输出 |
|---|---|
| 桌面高性能 | 全六段 1080p 擦洗 + 可选实时 GLB 增强 |
| 普通桌面/平板 | 精简视频片段 + DOM 内容 |
| 手机 | 720p 精简视频或关键帧序列 |
| 省流量/低电量 | 静态海报 + 淡入转场 |
| 减少动态效果 | 直接进入店内导航，不擦洗镜头 |

### 11.5 可访问性

- 视频或 Canvas 标记为装饰，不承载唯一信息。
- 提供“跳过沉浸式动画”链接。
- 所有内容入口保留真实链接或按钮。
- 键盘可完成进入、选择分类、看片和返回。
- `prefers-reduced-motion` 自动跳过强动画。
- 加载提示使用 `aria-live`，但避免频繁播报滚动进度。

## 12. 第七阶段：测试矩阵

### 12.1 模型测试

- PMX 导入完整性。
- 对象和材质数量。
- 缺失纹理。
- 法线、透明和 UV。
- 门、灯牌、屏幕是否独立。

### 12.2 GLB 测试

- glTF Validator。
- Three.js 加载。
- 无 404 或绝对路径。
- 桌面/移动文件体积。
- WebGL 内存和首帧时间。

### 12.3 视频测试

- FFprobe 参数正确。
- 快速开始元数据存在。
- 首尾锚点和接缝一致。
- Safari/Chrome/Edge 视频定位可用。
- Blob 加载和 Range 不可用环境均有方案。

### 12.4 浏览器回归

至少覆盖：

- Chromium 桌面 1280×720。
- Edge 桌面。
- 390×844 移动视口。
- `prefers-reduced-motion: reduce`。
- `Save-Data: on` 或模拟低带宽。
- WebGL 不可用、视频加载失败、JavaScript 禁用。

### 12.5 性能测试

- Lighthouse 与 Performance trace。
- LCP、CLS、INP。
- 长任务与帧率。
- 视频内存和 GPU 占用。
- 首屏总传输量。

## 13. 里程碑与决策点

### M0：资产安全通过

通过条件：哈希、CRC、文件清单、脚本审查和授权状态完成。

未通过：停止处理，不进入 Blender。

### M1：PMX 可稳定导入

通过条件：模型空间完整，四张诊断图可生成，关键场景存在。

未通过：评估其他模型或仅采用通用录像店资产。

### M2：HOOXI PLAY 场景定稿

通过条件：品牌替换、关键对象拆分、材质重建完成。

未通过：不进入批量优化和镜头渲染。

### M3：网页资产达标

通过条件：GLB、纹理和海报满足体积预算，验证器无错误。

未通过：继续减面、合批或改为完全预渲染方案。

### M4：第一段镜头原型

通过条件：夜街到前台的滚动擦洗在桌面和手机降级模式可用。

未通过：不批量制作后续片段。

### M5：六段原型验收

通过条件：六段连续、无明显接缝、所有 DOM 导航可用。

未通过：保持为独立实验，不替换正式首页。

### M6：公开发布审批

通过条件：授权、性能、无障碍、移动端和安全检查全部通过。

未通过：保留本地研究原型。

## 14. 预计工作量与成本控制

以下是技术阶段估算，不包含等待授权和素材重制时间：

| 阶段 | 预计工作量 |
|---|---:|
| 隔离解压与审计 | 0.5–1 天 |
| PMX 导入与诊断 | 0.5–1.5 天 |
| 场景清理与材质重建 | 2–5 天 |
| 品牌和版权资产替换 | 2–7 天 |
| 网页优化与 GLB 输出 | 1–3 天 |
| 第一段 Scroll World 原型 | 1–3 天 |
| 六段镜头与接缝调整 | 3–8 天 |
| 浏览器、性能和无障碍回归 | 1–3 天 |

若使用外部生成式视频服务，还需单独核算生成额度。建议先制作一个低成本预演和第一段正式镜头，通过后再批量生成其余片段。

## 15. Git 与发布规则

### 禁止提交

- 原始 ZIP。
- 原始 PMX。
- 未确认授权的完整贴图。
- Blender 缓存、临时文件和中间渲染。
- 研究路径生成的未授权 GLB。

### 可以提交

- 不含受限资产的检查报告。
- 转换脚本和参数说明。
- 原创 HOOXI PLAY 贴图。
- 许可证明确的最终 GLB。
- 经批准的视频片段、海报和网页代码。

大于 GitHub 常规限制的最终资产应使用专门对象存储或 Git LFS；在采用前必须确认部署环境支持，不应直接把大文件推入普通 Git 历史。

## 16. 回滚策略

- 模型处理始终在仓库外进行，删除模型实验目录即可回滚。
- 网页接入先保持为独立样板，删除 `scroll-world-sample.*` 和对应资产即可回滚。
- 不在原型阶段替换 `index.html`。
- 正式首页迁移前创建明确提交点；回滚使用新提交反向恢复，不强制改写 Git 历史。
- 所有资源替换保留清单，可定位到具体模型、材质和纹理。

## 17. 下一步最小动作

M0、M1 和左柜 4 物件研究 Spike 已完成。用户已明确声明该左柜模型由其自建并拥有上传权；本轮将指定的轻量左柜 GLB 与 manifest 放入同源公开资产目录。右柜、门、CRT、前台和邦布仍按同一语义拆分与校准流程处理；每完成一个 actor 都要同时补真实动作、内容结果和 fallback。

## 18. 独立原型 Hybrid/Fallback 接口（已实现）

`scroll-world-prototype.html` 当前只实现不含受限资产的前端适配层，不代表 RandomPlay 模型已获准进入仓库。浏览闭环为“店外/进门 → 店内分流 → 左右书柜总览 → 固定聚焦单柜 → 抽带展示 → 原位归还”，Escape 按相同层级逆向返回。

默认使用 DOM/CSS 书柜场景。仅当 `assets/scroll-world/scene-manifest.json` 可读取、其中 `glb` 指向可用本地 GLB，并且 Three.js CDN 与 WebGL 均成功时，`scroll-world-scene-adapter.js` 才启用 Hybrid 装饰层；任何一步失败都静默保留 DOM/CSS 按钮和完整导航，不阻塞交互。减少动态效果环境直接使用 fallback。

manifest 最小格式：

```json
{ "glb": "hooxi-play-store.glb" }
```

GLB 必须是原创、许可明确或已通过本文授权门槛的 HOOXI PLAY 网页资产。本轮根据用户明确声明“该模型由用户自建并拥有上传权”，将指定的 `rp-zone-shelf-l.glb` 与 manifest 放入同源目录；原始 PMX、FX、贴图、Blend 和压缩包仍不进入仓库。启用前仍需完成 glTF Validator、体积预算、浏览器和 WebGL 失败回归。
