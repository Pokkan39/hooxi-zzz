"""
深度估计三层分割脚本
使用 Depth-Anything-V2-Small 对活动横幅做 远景/中景/近景 分层
"""
import json
import sys
import os
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter
import cv2

# === 配置 ===
WORK_DIR = Path("F:/hooxi-zzz")
MAPPING_FILE = WORK_DIR / "artifacts/card-carve-recut/originals/mapping.json"
OUTPUT_BASE = WORK_DIR / "assets/hero/acts"
DEPTH_VIS_DIR = WORK_DIR / "artifacts/card-carve-recut/depth-maps"
TARGET_SIZE = (2200, 928)
WEBP_QUALITY = 90

# 深度分位数阈值（可调）
FAR_PERCENTILE = 33   # 深度值 < 33% 分位 -> 远景
NEAR_PERCENTILE = 67  # 深度值 > 67% 分位 -> 近景

def load_depth_model():
    """加载深度估计模型"""
    from transformers import pipeline
    print("[INFO] 加载 Depth-Anything-V2-Small 模型...")
    pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
    print("[INFO] 模型加载完成")
    return pipe


def estimate_depth(pipe, img_path: Path) -> np.ndarray:
    """估计深度图，返回 float32 ndarray (H, W)，值域 0~1，越大越近"""
    img = Image.open(img_path).convert("RGB")
    result = pipe(img)
    depth_pil = result["depth"]  # PIL Image
    depth = np.array(depth_pil, dtype=np.float32)
    # 归一化到 0~1
    dmin, dmax = depth.min(), depth.max()
    if dmax - dmin > 0:
        depth = (depth - dmin) / (dmax - dmin)
    return depth


def get_rembg_mask(img_path: Path) -> np.ndarray:
    """用 rembg isnet-anime 获取前景 alpha mask"""
    from rembg import remove, new_session
    session = new_session("isnet-anime")
    img = Image.open(img_path).convert("RGBA")
    result = remove(img, session=session, only_mask=True)
    mask = np.array(result, dtype=np.float32) / 255.0
    return mask


def compute_layer_masks(depth: np.ndarray, rembg_mask: np.ndarray):
    """
    基于深度图+rembg计算三层 mask (改进版)
    策略：
    1. 近景 = rembg角色区域 ∪ 深度最高的前景区域
    2. 在剩余背景中用 Otsu 分出远景/中景
    返回 (far_mask, mid_mask, near_mask)，均为 float32 (0~1)
    """
    from scipy.ndimage import gaussian_filter

    h, w = depth.shape

    # === 近景：rembg + 深度高值区域 ===
    rembg_strong = (rembg_mask > 0.4).astype(np.float32)

    # 找深度的自然断点：用 Otsu 在整图深度上找前景/背景分界
    depth_uint8 = (depth * 255).astype(np.uint8)
    otsu_thresh, _ = cv2.threshold(depth_uint8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    otsu_norm = otsu_thresh / 255.0
    print(f"  Otsu 前景/背景分界: {otsu_norm:.3f}")

    # 深度 > otsu_thresh 的区域视为前景候选
    depth_foreground = (depth > otsu_norm).astype(np.float32)

    # 近景 = rembg ∪ 深度前景
    near_mask = np.maximum(rembg_strong, depth_foreground)

    # === 在背景区域(非近景)中分出远景/中景 ===
    bg_region = (near_mask < 0.5)
    bg_depth = depth[bg_region]

    if len(bg_depth) > 100:
        # 对背景深度再用分位数分出远/中
        # 背景中深度较低=更远，深度较高=中景
        bg_median = np.median(bg_depth)
        print(f"  背景中位深度: {bg_median:.3f}")

        # 远景：背景中深度 < 中位数
        far_mask = np.zeros((h, w), dtype=np.float32)
        far_mask[bg_region & (depth <= bg_median)] = 1.0

        # 中景：背景中深度 > 中位数
        mid_mask = np.zeros((h, w), dtype=np.float32)
        mid_mask[bg_region & (depth > bg_median)] = 1.0
    else:
        # 几乎全是前景，背景极少
        far_mask = np.zeros((h, w), dtype=np.float32)
        mid_mask = (1.0 - near_mask)

    # === 边缘平滑 ===
    near_mask = gaussian_filter(near_mask, sigma=2.0)
    mid_mask = gaussian_filter(mid_mask, sigma=2.0)
    # 保证三层之和=1
    total = near_mask + mid_mask
    far_mask = np.clip(1.0 - total, 0, 1)

    # 打印覆盖率
    print(f"  覆盖率: far={far_mask.mean()*100:.1f}% mid={mid_mask.mean()*100:.1f}% near={near_mask.mean()*100:.1f}%")

    return far_mask, mid_mask, near_mask


def inpaint_background(img_rgb: np.ndarray, hole_mask: np.ndarray) -> np.ndarray:
    """
    对远景层的空洞区域做 inpainting 补全
    img_rgb: (H, W, 3) uint8
    hole_mask: (H, W) float32, >0.5 的区域需要补全
    """
    # 二值化 mask 并扩展几像素避免边缘残影
    mask_bin = (hole_mask > 0.3).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask_dilated = cv2.dilate(mask_bin, kernel, iterations=1)

    # 使用 TELEA 算法 inpaint
    inpainted = cv2.inpaint(img_rgb, mask_dilated, inpaintRadius=7, flags=cv2.INPAINT_TELEA)
    return inpainted


def process_single(slug: str, img_path: str, depth_pipe):
    """处理单张图的完整流程"""
    print(f"\n{'='*60}")
    print(f"[处理] {slug}")
    print(f"  源文件: {img_path}")

    src_path = Path(img_path)
    if not src_path.exists():
        print(f"  [错误] 文件不存在，跳过")
        return False

    # 1. 加载原图
    img_pil = Image.open(src_path).convert("RGB")
    img_rgb = np.array(img_pil)
    h, w = img_rgb.shape[:2]
    print(f"  原图尺寸: {w}x{h}")

    # 2. 深度估计
    print("  [步骤1] 深度估计...")
    depth = estimate_depth(depth_pipe, src_path)
    print(f"  深度图范围: {depth.min():.3f} ~ {depth.max():.3f}")

    # 保存深度可视化
    DEPTH_VIS_DIR.mkdir(parents=True, exist_ok=True)
    depth_vis = (depth * 255).astype(np.uint8)
    depth_vis_colored = cv2.applyColorMap(depth_vis, cv2.COLORMAP_INFERNO)
    cv2.imwrite(str(DEPTH_VIS_DIR / f"{slug}_depth.png"), depth_vis_colored)
    print(f"  深度图已保存: {DEPTH_VIS_DIR / f'{slug}_depth.png'}")

    # 3. rembg 前景检测
    print("  [步骤2] rembg 前景检测...")
    rembg_mask = get_rembg_mask(src_path)
    # 保存 rembg mask 可视化
    rembg_vis = (rembg_mask * 255).astype(np.uint8)
    cv2.imwrite(str(DEPTH_VIS_DIR / f"{slug}_rembg.png"), rembg_vis)

    # 4. 计算三层 mask
    print("  [步骤3] 计算分层 mask...")
    far_mask, mid_mask, near_mask = compute_layer_masks(depth, rembg_mask)

    # 保存 mask 可视化
    for name, mask in [("far", far_mask), ("mid", mid_mask), ("near", near_mask)]:
        vis = (mask * 255).astype(np.uint8)
        cv2.imwrite(str(DEPTH_VIS_DIR / f"{slug}_{name}_mask.png"), vis)

    # 5. 生成三层图像
    print("  [步骤4] 生成分层图像...")

    # 近景层：RGB + alpha
    near_alpha = (near_mask * 255).astype(np.uint8)
    near_rgba = np.dstack([img_rgb, near_alpha])

    # 中景层：RGB + alpha
    mid_alpha = (mid_mask * 255).astype(np.uint8)
    mid_rgba = np.dstack([img_rgb, mid_alpha])

    # 远景层：inpaint 补全被遮挡区域
    print("  [步骤5] 远景 inpainting...")
    hole_mask = np.maximum(near_mask, mid_mask)
    far_rgb = inpaint_background(img_rgb, hole_mask)
    # 远景不透明，但存为 RGBA 保持一致
    far_alpha = np.full((h, w), 255, dtype=np.uint8)
    far_rgba = np.dstack([far_rgb, far_alpha])

    # 6. 缩放并保存
    print("  [步骤6] 缩放并保存...")
    out_dir = OUTPUT_BASE / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    for name, data in [("far", far_rgba), ("mid", mid_rgba), ("near", near_rgba)]:
        pil_img = Image.fromarray(data, "RGBA")
        pil_img = pil_img.resize(TARGET_SIZE, Image.LANCZOS)
        out_path = out_dir / f"{name}.webp"
        pil_img.save(str(out_path), "WEBP", quality=WEBP_QUALITY)
        print(f"  已保存: {out_path}")

    print(f"[完成] {slug}")
    return True


def main():
    # 加载映射
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        mapping = json.load(f)

    # 命令行参数：指定处理哪些 slug，默认全部
    if len(sys.argv) > 1:
        slugs = sys.argv[1:]
    else:
        slugs = list(mapping.keys())

    # 加载深度模型
    depth_pipe = load_depth_model()

    # 处理
    success = 0
    failed = []
    for i, slug in enumerate(slugs):
        if slug not in mapping:
            print(f"[跳过] {slug} 不在映射中")
            continue
        info = mapping[slug]
        print(f"\n[{i+1}/{len(slugs)}] {slug} ({info['name']})")
        try:
            ok = process_single(slug, info["path"], depth_pipe)
            if ok:
                success += 1
            else:
                failed.append(slug)
        except Exception as e:
            print(f"  [错误] {e}")
            import traceback
            traceback.print_exc()
            failed.append(slug)

    print(f"\n{'='*60}")
    print(f"完成: {success}/{len(slugs)} 成功")
    if failed:
        print(f"失败: {failed}")


if __name__ == "__main__":
    main()

