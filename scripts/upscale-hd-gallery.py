"""把能达到 1080p 的图集影画重生成为限宽 1920 的 webp。

背景：image-webp.js 会把所有 png 请求改写成同名 webp，而这些 webp 由
optimize-images.py 按限宽 1400 生成，横图高度只有约 770，达不到 1080p。
同目录的原始 png 尺寸足够（约 2110x1160），但直接改用 png 会让体积从
57MB 涨到 643MB。折中做法是只对「png 达标、webp 不达标」的那批，按
限宽 1920 重新压一版 webp，清晰度过线且体积可控。

只覆盖 artifacts/hd-keep-png.json 列出的文件，原 webp 备份为 .webp.bak1400。
删除备份即视为接受结果；用备份覆盖回去即完整回滚。
"""
import json
import os
import shutil

from PIL import Image

# 按高度 1080 为准而不是宽度 1920：影画是约 1.82:1 的横图，限宽 1920 时
# 高度只有约 1055，达不到「至少 1080p」。按高度定，宽度约 1966 仍在原图内。
TARGET_H = 1080
QUALITY = 82
LIST = 'artifacts/hd-keep-png.json'
# 影画是约 1.8:1 的横图，超出这个范围的是长图或立绘，重压无意义
MAX_RATIO_DEV = 0.5


def main():
    items = json.load(open(LIST, encoding='utf-8'))
    done = skipped = 0
    before = after = 0
    for it in items:
        png = it['p']
        webp = png[:-4] + '.webp'
        if not (os.path.exists(png) and os.path.exists(webp)):
            skipped += 1
            continue
        with Image.open(png) as im:
            w, h = im.size
            ratio = w / h
            if abs(ratio - 1.8) > MAX_RATIO_DEV:
                print(f'  skip 非横图 {png} {w}x{h} ratio={ratio:.2f}')
                skipped += 1
                continue
            bak = webp + '.bak1400'
            if not os.path.exists(bak):
                shutil.copy2(webp, bak)
            before += os.path.getsize(webp)
            out = im.convert('RGB')
            if h > TARGET_H:
                out = out.resize((round(w * TARGET_H / h), TARGET_H), Image.LANCZOS)
            out.save(webp, 'WEBP', quality=QUALITY, method=6)
            after += os.path.getsize(webp)
            done += 1
            print(f'  {os.path.basename(os.path.dirname(png))}/{os.path.basename(webp)} '
                  f"{it['from'][0]}x{it['from'][1]} -> {out.size[0]}x{out.size[1]}")
    print(f'重压 {done} 张，跳过 {skipped} 张')
    print(f'体积 {before/1048576:.1f} MB -> {after/1048576:.1f} MB')


if __name__ == '__main__':
    main()
