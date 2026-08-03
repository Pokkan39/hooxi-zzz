# Theme Board — Risk & Reversion

## 风险

- 若 `.hallmark/log.json` 记录与 CSS token 色号偏离，后续"挑出赢家再迁回正式站"时会产生错位。两块都由人手调整时容易漏一边，建议最终修正式站时逐字对照。
- `--tb-text-3` 在 light 主题（zzz-mono / tape-slide）下对比接近 WCAG AA 下限，用于小字号需特别关注。
- `backdrop-filter` 在 Firefox 需手动启用，在低配设备上可能导致切换条闪烁，但切换条为主题独立层，不影响版面本身。

## 回滚

本目录为完整隔离原型，删除整个 `F:\hooxi-zzz\prototype\theme-board\` 即可完全退回。不影响 `F:\hooxi-zzz\index.html`、`styles/site.css` 及任何正式站资产。

```
rm -rf F:/hooxi-zzz/prototype/theme-board
```

## 合并路径（告诉你怎么拿）

挑出胜者后，将对应主题的 token 块搬入 `styles/site.css` 的 `:root`，把 `[data-theme="X"]` 选择器摘掉。六方向不并行入正式站；只能选一个作为下一版本。
