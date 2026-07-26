"""用感知哈希把低清图集影画匹配到本地镜像里的高清原图。

迁移脚本没有留下 gallery 到 website-archives 的来源映射，所以无法按路径
对应。改用内容匹配：把两边的图缩到 16x16 灰度算差分哈希，同一张画的
不同尺寸版本哈希距离很小，据此找到镜像里更高清的同图。

只输出候选清单到 artifacts/mirror-hd-candidates.json，不复制也不覆盖任何
文件，替换动作留给后续步骤，便于逐张核对再决定。
"""
import glob
import json
import os

from PIL import Image

MIRROR = 'F:/website-archives/zzz-wiki/assets'
HD_H = 1080
HD_W = 1920
MAX_DIST = 12          # 16x16 dHash 共 240 位，12 位内视为同图
RATIO_TOL = 0.06


def dhash(path, size=16):
    with Image.open(path) as im:
        g = im.convert('L').resize((size + 1, size), Image.LANCZOS)
        px = list(g.getdata())
    bits = []
    for y in range(size):
        row = y * (size + 1)
        for x in range(size):
            bits.append(px[row + x] > px[row + x + 1])
    return bits


def dist(a, b):
    return sum(1 for x, y in zip(a, b) if x != y)


def main():
    targets = []
    for f in sorted(glob.glob('assets/gallery/*/*.webp')):
        try:
            with Image.open(f) as im:
                w, h = im.size
        except Exception:
            continue
        if h >= HD_H or w >= HD_W:
            continue
        try:
            targets.append({'p': f.replace(os.sep, '/'), 'w': w, 'h': h,
                            'r': w / h, 'hash': dhash(f)})
        except Exception:
            continue
    print(f'待补低清图 {len(targets)} 张', flush=True)

    pool = glob.glob(os.path.join(MIRROR, '**', '*.png'), recursive=True)
    pool += glob.glob(os.path.join(MIRROR, '**', '*.jpg'), recursive=True)
    print(f'镜像候选 {len(pool)} 张，开始扫描', flush=True)

    found = {}
    scanned = 0
    for f in pool:
        scanned += 1
        if scanned % 2000 == 0:
            print(f'  已扫 {scanned}/{len(pool)}，命中 {len(found)}', flush=True)
        try:
            with Image.open(f) as im:
                w, h = im.size
        except Exception:
            continue
        if h < HD_H and w < HD_W:
            continue
        ratio = w / h
        cands = [t for t in targets if abs(t['r'] - ratio) <= RATIO_TOL]
        if not cands:
            continue
        try:
            hs = dhash(f)
        except Exception:
            continue
        for t in cands:
            d = dist(t['hash'], hs)
            if d > MAX_DIST:
                continue
            cur = found.get(t['p'])
            if cur is None or w * h > cur['srcSize'][0] * cur['srcSize'][1]:
                found[t['p']] = {'src': f.replace(os.sep, '/'), 'dist': d,
                                 'srcSize': [w, h], 'curSize': [t['w'], t['h']]}

    os.makedirs('artifacts', exist_ok=True)
    with open('artifacts/mirror-hd-candidates.json', 'w', encoding='utf-8') as fh:
        json.dump(found, fh, ensure_ascii=False, indent=1)
    print(f'扫描完成：{len(targets)} 张低清中找到 {len(found)} 张镜像高清源')
    for k, v in list(found.items())[:12]:
        print(f"  {k} {v['curSize']} -> {v['srcSize']} dist={v['dist']}")


if __name__ == '__main__':
    main()
