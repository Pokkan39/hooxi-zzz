# 角色立绘资源

将角色头像、头部近景和全身立绘放在此目录，并在 `data.js` 的 `characters[]` 中填写相对路径，例如：

- 小头像 `avatar`：`assets/portraits/anby-avatar.webp`，用于角色详情页角标。
- 头部近景 `headshot`：`assets/portraits/anby-headshot.webp`，用于阵营成员卡的默认状态。
- 全身立绘 `portrait`：`assets/portraits/anby-portrait.webp`，用于成员卡悬停/键盘聚焦后显现，以及角色详情页主视觉。

头部近景和全身立绘推荐使用透明 PNG/WebP：头部图以脸部居中构图，全身图让角色主体靠近底部且保留完整身形。成员卡会以不同速度移动两层图片，形成 2.5D 景深；没有 `headshot` 时会回退到 `avatar`，没有图片时会显示文字占位。

阵营图标请放在 `assets/icons/`，详见该目录的 `README.txt`。文件名使用英文、数字、短横线或下划线。图片只保存路径，不会嵌入词条数据。
