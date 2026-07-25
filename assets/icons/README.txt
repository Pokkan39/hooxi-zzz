# 阵营图标资源

将阵营图标放在此目录。正式站当前由 `agent-catalog.js` 的 `factionLogos` 注入
`archiveData.factions[].logo`；`data.js` 仅在需要本地覆盖时填写。

示例：

`assets/icons/cunning-hares.png`

建议使用透明 PNG/WebP，文件名使用英文、数字、短横线或下划线。

当前（2026-07-19）17 个阵营均已落盘本地 PNG，目录页不再依赖首字占位。
图标缺失时，角色阵营目录会显示阵营名称首字占位，页面仍可正常访问。
