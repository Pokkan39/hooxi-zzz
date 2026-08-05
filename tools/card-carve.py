"""
card-carve.py — 卡雕分层 v2：BiRefNet 语义近景 + 色彩中景 + 形态学硬边
输出: assets/hero/acts/<slug>/far.webp, mid.webp, near.webp
"""
import cv2
import numpy as np
import os
import sys
from pathlib import Path

def get_birefnet_mask(img_bgr):
    """用 BiRefNet 拿到前景语义 mask（0-255 灰度）"""
    from PIL import Image
    from rembg import remove, new_session
    session = new_session('birefnet-general')
    # cv2 BGR -> PIL RGBA
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(rgb).convert('RGBA')
    result = remove(pil, session=session)
    # 提取 alpha 通道
    alpha = np.array(result)[:, :, 3]
    return alpha

def harden_mask(soft, erode_k=3, thresh=180, dilate_k=2):
    """把柔性 alpha 转为干净硬边二值 mask"""
    kern_e = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (erode_k, erode_k))
    kern_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilate_k, dilate_k))
    m = cv2.erode(soft, kern_e, iterations=1)
    _, m = cv2.threshold(m, thresh, 255, cv2.THRESH_BINARY)
    m = cv2.dilate(m, kern_d, iterations=1)
    return m

def extract_far_mask(img_bgr, near_mask):
    """远景：画面边缘暗区 + 红色装饰花纹 + 低亮度底色"""
    h, w = img_bgr.shape[:2]
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h_chan, s_chan, v_chan = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    # 1. 红色花纹（H<12 或 H>165，饱和度足够）
    red = (((h_chan < 12) | (h_chan > 165)) & (s_chan > 70) & (v_chan > 30)).astype(np.uint8) * 255

    # 2. 边缘暗区（亮度低于阈值的暗色区域）
    dark = (gray < 45).astype(np.uint8) * 255

    # 3. 边缘权重：离中心越远越可能是远景
    cy, cx = h // 2, w // 2
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt(((X - cx) / (w * 0.5)) ** 2 + ((Y - cy) / (h * 0.5)) ** 2)
    edge_weight = (dist > 0.6).astype(np.uint8) * 255

    # 合并：红色 + (暗区 AND 边缘)
    far_raw = cv2.bitwise_or(red, cv2.bitwise_and(dark, edge_weight))
    # 形态学闭合
    kern = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    far_mask = cv2.morphologyEx(far_raw, cv2.MORPH_CLOSE, kern)
    far_mask = cv2.dilate(far_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)), iterations=1)
    _, far_mask = cv2.threshold(far_mask, 127, 255, cv2.THRESH_BINARY)
    # 排除近景
    far_mask = cv2.bitwise_and(far_mask, cv2.bitwise_not(near_mask))
    return far_mask

def save_layer(img_bgr, mask, path):
    """保存带 alpha 的 webp"""
    bgra = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2BGRA)
    bgra[:, :, 3] = mask
    cv2.imwrite(str(path), bgra, [cv2.IMWRITE_WEBP_QUALITY, 90])
    kb = os.path.getsize(str(path)) // 1024
    pct = (mask > 127).sum() / mask.size * 100
    return kb, pct

def card_carve(src_path, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    img = cv2.imread(str(src_path), cv2.IMREAD_COLOR)
    if img is None:
        print(f'  ERROR: cannot read {src_path}')
        return False
    h, w = img.shape[:2]
    print(f'  src: {w}x{h}')

    # 1. 近景：BiRefNet 语义分割 + 硬边化
    print('  BiRefNet segmenting...')
    soft_alpha = get_birefnet_mask(img)
    near_mask = harden_mask(soft_alpha, erode_k=2, thresh=160, dilate_k=3)
    print(f'  near mask: {(near_mask>127).sum()/near_mask.size*100:.1f}% visible')

    # 2. 远景：边缘暗区 + 红色花纹
    far_mask = extract_far_mask(img, near_mask)

    # 3. 中景 = 全画面 - 近景 - 远景（boss 剪影 + 蓝色能量自然归此）
    mid_mask = cv2.bitwise_not(cv2.bitwise_or(near_mask, far_mask))

    # 保存
    for name, mask in [('far', far_mask), ('mid', mid_mask), ('near', near_mask)]:
        kb, pct = save_layer(img, mask, out / f'{name}.webp')
        print(f'  {name}: {pct:.1f}% visible, {kb}KB')

    return True


if __name__ == '__main__':
    if len(sys.argv) >= 3:
        card_carve(sys.argv[1], sys.argv[2])
    else:
        # 默认：对拟境湮灭战做样张
        SRC = 'assets/hero/acts/simulated-annihilation.webp'
        OUT = 'assets/hero/acts/simulated-annihilation'
        card_carve(SRC, OUT)
