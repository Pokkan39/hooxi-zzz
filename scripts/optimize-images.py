#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
图片优化：为超大素材生成适配尺寸的 WebP 副本。

背景：站内素材多为 1920px 原图，而实际展示宽度仅 380-700px，
首页一次传输达 10.5MB。本脚本按展示需求限宽并转 WebP。

原则：
- 不删除、不覆盖原图，只在同目录生成 .webp 副本
- 仅处理体积超阈值的文件，小图不动
- 保留原始宽高比，只缩不放
- 输出清单供页面层引用，不擅自改 HTML

用法：
  python scripts/optimize-images.py            预演（只报告）
  python scripts/optimize-images.py --write    实际生成
"""
import os
import sys
import glob
import json

try:
    from PIL import Image
except ImportError:
    print('需要 Pillow：pip install Pillow')
    sys.exit(1)

WRITE = '--write' in sys.argv

# 展示宽度上限（含 2x 高分屏余量）
MAX_W = 1400
# 仅处理大于此体积的文件
MIN_BYTES = 260 * 1024
QUALITY = 82

TARGET_DIRS = [
    'assets/hero',
    'assets/wiki/media',
    'assets/wiki/events',
    'assets/wiki/behind',
    'assets/covers',
    'assets/gallery',
]
EXTS = ('.png', '.jpg', '.jpeg')


def collect():
    out = []
    for d in TARGET_DIRS:
        if not os.path.isdir(d):
            continue
        for root, _, files in os.walk(d):
            for fn in files:
                if not fn.lower().endswith(EXTS):
                    continue
                p = os.path.join(root, fn)
                try:
                    if os.path.getsize(p) >= MIN_BYTES:
                        out.append(p)
                except OSError:
                    pass
    return sorted(out)


def target_path(src):
    return src.rsplit('.', 1)[0] + '.webp'


def main():
    files = collect()
    if not files:
        print('未找到需要优化的图片')
        return

    manifest = {}
    before_total = after_total = 0
    converted = skipped = failed = 0

    for src in files:
        dst = target_path(src)
        before = os.path.getsize(src)
        # 已有较新的 webp 副本则跳过
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            skipped += 1
            before_total += before
            after_total += os.path.getsize(dst)
            manifest[src.replace('\\', '/')] = dst.replace('\\', '/')
            continue
        try:
            im = Image.open(src)
            im = im.convert('RGBA') if im.mode == 'P' else im.convert('RGB')
            if im.width > MAX_W:
                h = round(im.height * MAX_W / im.width)
                im = im.resize((MAX_W, h), Image.LANCZOS)
            if WRITE:
                im.save(dst, 'WEBP', quality=QUALITY, method=6)
                after = os.path.getsize(dst)
            else:
                # 预演时估算：写入临时文件后删除
                tmp = dst + '.probe'
                im.save(tmp, 'WEBP', quality=QUALITY, method=6)
                after = os.path.getsize(tmp)
                os.remove(tmp)
            before_total += before
            after_total += after
            converted += 1
            manifest[src.replace('\\', '/')] = dst.replace('\\', '/')
        except Exception as e:
            failed += 1
            print('  失败 %s: %s' % (os.path.basename(src), str(e)[:50]))

    print('待优化文件 %d 个（阈值 %dKB，限宽 %dpx）' % (len(files), MIN_BYTES // 1024, MAX_W))
    print('  新生成 %d，已存在跳过 %d，失败 %d' % (converted, skipped, failed))
    print('  体积 %.2fMB -> %.2fMB' % (before_total / 1048576, after_total / 1048576))
    if before_total:
        print('  节省 %d%%' % (100 - after_total * 100 // before_total))

    if WRITE:
        with open('artifacts/image-optimization.json', 'w', encoding='utf-8') as f:
            json.dump({'maxWidth': MAX_W, 'quality': QUALITY, 'map': manifest},
                      f, ensure_ascii=False, indent=2)
        print('\n已写入 WebP 副本，清单：artifacts/image-optimization.json')
        print('原图保留未改动。')
    else:
        print('\n预演模式，未写入。加 --write 生效。')


if __name__ == '__main__':
    main()
