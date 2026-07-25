#!/usr/bin/env python3
"""Check that formal-site mainline files still match the construction-gate baseline.

Standing policy (protected): analysis conclusions must not automatically modify
formal site code unless the user explicitly orders construction.

Usage:
  python scripts/check-formal-site-gate.py
  python scripts/check-formal-site-gate.py --write   # only after explicit user approval
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "artifacts" / "formal-site-gate-baseline.json"
FORMAL = [
    "index.html",
    "app.js",
    "styles.css",
    "theme-zzz.css",
    "wiki-readability.css",
    "tokens.css",
    "assets/fonts/barlow-condensed-400-latin.woff2",
    "assets/fonts/barlow-condensed-500-latin.woff2",
    "assets/fonts/barlow-condensed-600-latin.woff2",
    "assets/fonts/barlow-condensed-700-latin.woff2",
    "assets/fonts/barlow-condensed-800-latin.woff2",
    "assets/fonts/space-mono-400-latin.woff2",
    "assets/fonts/space-mono-700-latin.woff2",
    "assets/fonts/OFL-Barlow-Condensed.txt",
    "assets/fonts/OFL-Space-Mono.txt",
    "data.js",
    "multi-page.css",
    "mainline.html",
    "events.html",
    "behind-scenes.html",
    "media-catalog.js",
    "assets/covers/official/zzz-worldview-pv.webp",
    "assets/covers/official/zzz-launch-pv.webp",
    "assets/covers/official/bilibili/zzz-launch-pv.webp",
    "assets/covers/official/bilibili/zzz-worldview-pv.webp",
    "stories.html",
    "stories.js",
    "character.html",
    "character.js",
    "faction.html",
    "faction.js",
    "editor.html",
    "editor.js",
    "agent-catalog.js",
    "agent-enrichment.js",
]
DIRECT_ASSET_EXTENSIONS = {".css", ".js", ".svg", ".png", ".webp", ".ico"}


def discover_direct_assets() -> list[str]:
    assets = set()
    for rel in FORMAL:
        if not rel.endswith(".html"):
            continue
        source = (ROOT / rel).read_text(encoding="utf-8")
        for ref in re.findall(r'''(?:href|src)=["']([^"']+)["']''', source):
            clean = ref.split("#", 1)[0].split("?", 1)[0]
            if not clean or clean.startswith(("#", "//")) or re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", clean):
                continue
            candidate = (ROOT / clean.lstrip("/")).resolve()
            try:
                normalized = candidate.relative_to(ROOT).as_posix()
            except ValueError as error:
                raise ValueError(f"Formal HTML references a path outside the repository: {rel}: {clean}") from error
            if Path(normalized).suffix.lower() in DIRECT_ASSET_EXTENSIONS:
                assets.add(normalized)
    return sorted(assets)


def sha256_file(path: Path) -> tuple[str, int]:
    raw = path.read_bytes()
    return hashlib.sha256(raw).hexdigest(), len(raw)


def build_rows() -> list[dict]:
    rows = []
    formal_files = list(dict.fromkeys([*FORMAL, *discover_direct_assets()]))
    for rel in formal_files:
        path = ROOT / rel
        if not path.is_file():
            rows.append(
                {
                    "path": rel,
                    "sha256": None,
                    "sha256_16": None,
                    "bytes": None,
                    "missing": True,
                }
            )
            continue
        full, size = sha256_file(path)
        rows.append(
            {
                "path": rel,
                "sha256": full,
                "sha256_16": full[:16],
                "bytes": size,
                "missing": False,
            }
        )
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Rewrite baseline JSON. Use only after explicit user construction approval.",
    )
    args = parser.parse_args()
    rows = build_rows()

    if args.write:
        payload = {
            "purpose": (
                "Formal site construction gate fingerprint. "
                "Analysis/docs must not change these files unless user explicitly orders construction."
            ),
            "policy": "docs/VISUAL-TECH-REFERENCE-COMPARE.md section 6",
            "note": (
                "Baseline is a point-in-time fingerprint for gate checks. "
                "Authorized construction should re-run with --write after explicit user approval."
            ),
            "files": [
                {
                    "path": r["path"],
                    "sha256": r["sha256"],
                    "sha256_16": r["sha256_16"],
                    "bytes": r["bytes"],
                }
                for r in rows
                if not r.get("missing")
            ],
        }
        BASELINE.parent.mkdir(parents=True, exist_ok=True)
        BASELINE.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"WROTE {BASELINE.relative_to(ROOT)} ({len(payload['files'])} files)")
        return 0

    if not BASELINE.is_file():
        print(f"MISSING_BASELINE {BASELINE}")
        print("Run with --write only after explicit construction approval, or restore baseline.")
        return 2

    base = json.loads(BASELINE.read_text(encoding="utf-8"))
    expected = {item["path"]: item for item in base.get("files", [])}
    current_paths = {row["path"] for row in rows}
    changed = []
    missing = []
    untracked = []
    extra_baseline = []

    for row in rows:
        rel = row["path"]
        if row.get("missing"):
            missing.append(rel)
            print(f"MISSING {rel}")
            continue
        exp = expected.get(rel)
        if not exp:
            untracked.append(rel)
            print(f"UNTRACKED {rel} {row['sha256_16']}")
            continue
        if exp.get("sha256") != row["sha256"]:
            changed.append(rel)
            print(
                f"CHANGED {rel} baseline={str(exp.get('sha256_16'))} current={row['sha256_16']}"
            )
        else:
            print(f"OK {rel} {row['sha256_16']}")

    for rel in expected:
        if rel not in current_paths:
            extra_baseline.append(rel)

    if extra_baseline:
        print("BASELINE_EXTRA " + ", ".join(extra_baseline))

    if missing or changed or untracked or extra_baseline:
        print("GATE_FAIL")
        print(
            "Formal mainline differs from gate baseline. "
            "If this was unauthorized, restore files; "
            "if user explicitly ordered construction, re-run with --write after finishing."
        )
        return 1

    print("GATE_OK ALL_FORMAL_UNCHANGED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
