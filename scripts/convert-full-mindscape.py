"""
Convert Toastertjie Full mindscape PNGs to WebP,
matching the filename convention in assets/mindscape/default/
"""
import os, sys
from pathlib import Path
from PIL import Image

SRC = Path(r"E:\SteamLibrary\steamapps\workshop\content\431960\3491187965\images")
DST = Path(r"F:\hooxi-zzz\assets\mindscape\full")
# Reference: existing default names
REF = Path(r"F:\hooxi-zzz\assets\mindscape\default")

DST.mkdir(parents=True, exist_ok=True)

# Build name mapping: Full filename -> target slug
# Source: Mindscape_Anby_Demara_Full.png -> anby.webp
# We match by comparing against existing default slugs

existing_slugs = [f.stem for f in REF.glob("*.webp")]
print(f"Found {len(existing_slugs)} existing slugs in default/")

# Manual mapping for tricky names
MANUAL_MAP = {
    "Mindscape_Alexandrina_Sebastiane_Full.png": "rina",
    "Mindscape_Alice_Thymefield_Full.png": "alice",
    "Mindscape_Anby_Demara_Full.png": "anby",
    "Mindscape_Anton_Ivanov_Full.png": "anton",
    "Mindscape_Aria_Full.png": "aria",
    "Mindscape_Asaba_Harumasa_Full.png": "harumasa",
    "Mindscape_Astra_Yao_Full.png": "astra-yao",
    "Mindscape_Banyue_Full.png": "banyue",
    "Mindscape_Ben_Bigger_Full.png": "ben",
    "Mindscape_Billy_Kid_Full.png": "billy-kid",
    "Mindscape_Burnice_White_Full.png": "burnice",
    "Mindscape_Caesar_King_Full.png": "caesar",
    "Mindscape_Cissia_Full.png": "cissia",
    "Mindscape_Corin_Wickes_Full.png": "corin",
    "Mindscape_Dialyn_Full.png": "dialyn",
    "Mindscape_Ellen_Joe_Full.png": "ellen",
    "Mindscape_Evelyn_Chevalier_Full.png": "evelyn",
    "Mindscape_Grace_Howard_Full.png": "grace-howard",
    "Mindscape_Hoshimi_Miyabi_Full.png": "miyabi",
    "Mindscape_Hugo_Vlad_Full.png": "hugo",
    "Mindscape_Jane_Doe_Full.png": "jane-doe",
    "Mindscape_Ju_Fufu_Full.png": "ju-fufu",
    "Mindscape_Koleda_Belobog_Full.png": "koleda",
    "Mindscape_Komano_Manato_Full.png": "manato",
    "Mindscape_Lighter_Full.png": "lighter",
    "Mindscape_Lucia_Elowen_Full.png": "lucia",
    "Mindscape_Luciana_de_Montefio_Full.png": "lucy",
    "Mindscape_Nangong_Yu_Full.png": "nangong-yu",
    "Mindscape_Nekomiya_Mana_Full.png": "nekomata",
    "Mindscape_Nicole_Demara_Full.png": "nicole-demara",
    "Mindscape_Orphie_Magnusson_&_Magus_Full.png": "orphie-and-magus",
    "Mindscape_Pan_Yinhu_Full.png": "pan-yinhu",
    "Mindscape_Piper_Wheel_Full.png": "piper",
    "Mindscape_Promeia_Full.png": "promeia",
    "Mindscape_Pulchra_Fellini_Full.png": "pulchra",
    "Mindscape_Qingyi_Full.png": "qingyi",
    "Mindscape_Seed_Full.png": "seed",
    "Mindscape_Seth_Lowell_Full.png": "seth",
    "Mindscape_Soldier_0_-_Anby_Full.png": "soldier-0-anby",
    "Mindscape_Soldier_11_Full.png": "soldier-11",
    "Mindscape_Soukaku_Full.png": "soukaku",
    "Mindscape_Starlight_-_Billy_Kid_Full.png": "starlight-billy",
    "Mindscape_Sunna_Full.png": "sunna",
    "Mindscape_Trigger_Full.png": "trigger",
    "Mindscape_Tsukishiro_Yanagi_Full.png": "yanagi",
    "Mindscape_Ukinami_Yuzuha_Full.png": "ukinami-yuzuha",
    "Mindscape_Vivian_Banshee_Full.png": "vivian",
    "Mindscape_Von_Lycaon_Full.png": "lycaon",
    "Mindscape_Ye_Shunguang_Full.png": "ye-shunguang",
    "Mindscape_Yidhari_Murphy_Full.png": "yidhari",
    "Mindscape_Yixuan_Full.png": "yixuan",
    "Mindscape_Zhao_Full.png": "zhao",
    "Mindscape_Zhu_Yuan_Full.png": "zhu-yuan",
}

# Process all Full images
converted = 0
skipped = 0
missing = []

for src_name, slug in MANUAL_MAP.items():
    src_path = SRC / src_name
    if not src_path.exists():
        missing.append(src_name)
        continue
    dst_path = DST / f"{slug}.webp"
    if dst_path.exists():
        skipped += 1
        continue
    try:
        img = Image.open(src_path)
        img.save(dst_path, "WEBP", quality=82, method=4)
        converted += 1
        print(f"  OK: {src_name} -> {slug}.webp")
    except Exception as e:
        print(f"  FAIL: {src_name} -> {e}")

print(f"\nDone: {converted} converted, {skipped} skipped, {len(missing)} missing")
if missing:
    print("Missing source files:", missing)

# Check for default slugs without a Full version
covered = set(MANUAL_MAP.values())
uncovered = [s for s in existing_slugs if s not in covered]
if uncovered:
    print(f"\nDefault slugs without Full mapping: {uncovered}")
