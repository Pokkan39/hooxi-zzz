"""批量卡雕分层：对 assets/hero/acts/*.webp 逐个执行三层切割"""
import sys, os, importlib.util
from pathlib import Path

os.chdir(str(Path(__file__).resolve().parent.parent))

spec = importlib.util.spec_from_file_location("card_carve", "tools/card-carve.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

SRC_DIR = Path('assets/hero/acts')
ok = 0
fail = 0

for f in sorted(SRC_DIR.glob('*.webp')):
    slug = f.stem
    out_dir = SRC_DIR / slug
    if (out_dir / 'far.webp').exists() and (out_dir / 'mid.webp').exists() and (out_dir / 'near.webp').exists():
        print(f'[SKIP] {slug} (already done)')
        ok += 1
        continue
    print(f'\n[{slug}]')
    try:
        result = mod.card_carve(str(f), str(out_dir))
        if result:
            ok += 1
        else:
            fail += 1
    except Exception as e:
        print(f'  ERROR: {type(e).__name__}: {e}')
        fail += 1

print(f'\n=== 完成: {ok} 成功, {fail} 失败 ===')
