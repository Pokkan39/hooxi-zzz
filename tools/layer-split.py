"""
layer-split.py — 使用 rembg (isnet-anime) 将角色影画分割为背景层 + 角色层
输出: assets/gallery/{id}/layers/bg.webp + fg.webp (透明PNG转webp)
"""
import sys, os
from pathlib import Path
from PIL import Image, ImageFilter
from rembg import remove, new_session

# Use isnet-anime model for anime/illustration segmentation
SESSION = new_session('isnet-anime')

def split_layers(src_path, out_dir):
    """Split into foreground (character) and background layers"""
    os.makedirs(out_dir, exist_ok=True)
    
    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    print(f"  src: {w}x{h}")
    
    # 1. Extract foreground with isnet-anime
    print("  segmenting foreground...")
    fg = remove(img, session=SESSION)
    
    # 2. Generate background: fill character region with blurred surroundings
    print("  generating background...")
    alpha = fg.split()[3]
    
    bg_base = img.convert("RGB")
    bg_blurred = bg_base.filter(ImageFilter.GaussianBlur(radius=30))
    
    # mask: where alpha > 128 use blurred version
    mask = alpha.point(lambda x: 255 if x > 128 else 0)
    bg_result = Image.composite(bg_blurred, bg_base, mask)
    
    # 3. Save
    fg_path = Path(out_dir) / "fg.webp"
    bg_path = Path(out_dir) / "bg.webp"
    
    fg.save(str(fg_path), "WEBP", quality=90, lossless=False)
    bg_result.save(str(bg_path), "WEBP", quality=85)
    
    print(f"  OK fg: {fg_path} ({os.path.getsize(fg_path)//1024}KB)")
    print(f"  OK bg: {bg_path} ({os.path.getsize(bg_path)//1024}KB)")
    
    # Stats
    if fg.mode == 'RGBA':
        a = fg.split()[3]
        total = w * h
        visible = sum(1 for i in range(total) if a.getpixel((i % w, i // w)) > 128)
        print(f"  fg visible: {visible/total*100:.1f}%")
    
    return fg_path, bg_path

if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--batch":
        # Batch process key characters
        GALLERY = {
            "miyabi": "assets/gallery/miyabi/05",
            "burnice": "assets/gallery/burnice/04",
            "ellen": "assets/gallery/ellen/02",
            "jane-doe": "assets/gallery/jane-doe/07",
            "anby": "assets/gallery/anby/01",
            "nicole-demara": "assets/gallery/nicole-demara/05",
            "lighter": "assets/gallery/lighter/04",
            "caesar": "assets/gallery/caesar/03",
            "lycaon": "assets/gallery/lycaon/03",
            "koleda": "assets/gallery/koleda/02",
        }
        for char_id, base in GALLERY.items():
            src_path = None
            for ext in ['.png', '.webp']:
                p = Path(base + ext)
                if p.exists():
                    src_path = p
                    break
            if not src_path:
                print(f"  SKIP {char_id}: no source")
                continue
            out = f"assets/gallery/{char_id}/layers"
            print(f"\n[{char_id}]")
            try:
                split_layers(str(src_path), out)
            except Exception as e:
                print(f"  ERROR: {e}")
    elif len(sys.argv) >= 3:
        split_layers(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python layer-split.py <src> <out_dir>")
        print("       python layer-split.py --batch")
