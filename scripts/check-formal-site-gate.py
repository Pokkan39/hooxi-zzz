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
PUBLIC_ARCHIVE_ROUTES = [
    "index.html",
    "mainline.html",
    "stories.html",
    "character.html",
    "faction.html",
    "events.html",
    "behind-scenes.html",
    "cultivate.html",
]
PUBLIC_PLAY_ROUTES = ["tape-wall-sample.html"]
INTERNAL_TOOL_ROUTES = ["editor.html"]
PUBLIC_ROUTES = [*PUBLIC_ARCHIVE_ROUTES, *PUBLIC_PLAY_ROUTES]
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
    "cultivate.html",
    "tape-wall-sample.html",
    "media-catalog.js",
    "assets/covers/official/zzz-worldview-pv.webp",
    "assets/covers/official/zzz-launch-pv.webp",
    "assets/covers/official/bilibili/zzz-launch-pv.webp",
    "assets/covers/official/bilibili/zzz-worldview-pv.webp",
    "stories.html",
    "stories.js",
    "assets/portraits/aria-portrait.webp",
    "assets/portraits/sunna-portrait.webp",
    "assets/portraits/remielle-portrait.webp",
    "assets/portraits/remielle-card.webp",
    "assets/mindscape/default/remielle.webp",
    "assets/icons/covenant-of-dayat.png",
    "character.html",
    "character.js",
    "faction.html",
    "faction.js",
    "editor.html",
    "editor.js",
    "agent-catalog.js",
    "agent-enrichment.js",
    "agent-xray.js",
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


STABLE_BOUNDARY_ATTR = re.compile(
    r'\bdata-(?:source-action|source-section|unofficial-boundary)\b|'
    r'\bid\s*=\s*["\']sources?["\']|'
    r'\bclass\s*=\s*["\'][^"\']*\bfooter-disclaimer\b[^"\']*["\']',
    re.IGNORECASE,
)


def stable_boundary_text(source: str) -> str:
    texts: list[str] = []
    for opening in re.finditer(r'<(?P<tag>[a-z][\w:-]*)\b(?P<attrs>[^>]*)>', source, re.IGNORECASE):
        if not STABLE_BOUNDARY_ATTR.search(opening.group("attrs")):
            continue
        closing = re.search(
            rf'</{re.escape(opening.group("tag"))}\s*>',
            source[opening.end():],
            re.IGNORECASE,
        )
        if not closing:
            continue
        body = source[opening.end():opening.end() + closing.start()]
        texts.append(re.sub(r'<[^>]+>', ' ', body))
    return re.sub(r'\s+', ' ', ' '.join(texts)).strip()


def has_robots_noindex(source: str) -> bool:
    for tag in re.findall(r'<meta\b[^>]*>', source, re.IGNORECASE):
        has_name = re.search(r'\bname\s*=\s*["\']robots["\']', tag, re.IGNORECASE)
        has_content = re.search(r'\bcontent\s*=\s*["\'][^"\']*\bnoindex\b[^"\']*["\']', tag, re.IGNORECASE)
        if has_name and has_content:
            return True
    return False


def check_route_contract() -> list[str]:
    errors: list[str] = []
    if len(PUBLIC_ROUTES) != 9:
        errors.append(f"正式公开路由数量错误：期望 9，实际 {len(PUBLIC_ROUTES)}")
    if len(PUBLIC_ARCHIVE_ROUTES) != 8:
        errors.append(f"公开档案族数量错误：期望 8，实际 {len(PUBLIC_ARCHIVE_ROUTES)}")
    if len(PUBLIC_PLAY_ROUTES) != 1:
        errors.append(f"PLAY 族数量错误：期望 1，实际 {len(PUBLIC_PLAY_ROUTES)}")

    families = [set(PUBLIC_ARCHIVE_ROUTES), set(PUBLIC_PLAY_ROUTES), set(INTERNAL_TOOL_ROUTES)]
    if any(families[left] & families[right] for left in range(len(families)) for right in range(left + 1, len(families))):
        errors.append("公开档案、PLAY 与内部工具路由不得重叠")
    if INTERNAL_TOOL_ROUTES != ["editor.html"]:
        errors.append("editor.html 必须是唯一内部工具路由")

    for rel in PUBLIC_ROUTES:
        path = ROOT / rel
        if not path.is_file():
            errors.append(f"正式公开路由不存在：{rel}")
            continue
        source = path.read_text(encoding="utf-8").lower()
        boundary_text = stable_boundary_text(source)
        if "<main" not in source:
            errors.append(f"正式公开路由缺少 main：{rel}")
        if "非官方" not in boundary_text or "无隶属" not in boundary_text:
            errors.append(f"正式公开路由稳定边界节点缺少非官方/无隶属声明：{rel}")
        if not any(marker in boundary_text for marker in ("来源", "资料源", "source")):
            errors.append(f"正式公开路由稳定来源节点缺少来源声明：{rel}")
        if "data-layout-editor-host" in source or re.search(r'href=["\'][^"\']*editor\.html', source):
            errors.append(f"正式公开路由不得嵌入或导航到 editor 内部工具：{rel}")

    play_source = (ROOT / PUBLIC_PLAY_ROUTES[0]).read_text(encoding="utf-8").lower() if (ROOT / PUBLIC_PLAY_ROUTES[0]).is_file() else ""
    if "hooxi play" not in play_source or "tape-wall-page" not in play_source:
        errors.append("PLAY 路由必须保持独立录像店页面族")

    editor_path = ROOT / INTERNAL_TOOL_ROUTES[0]
    if not editor_path.is_file():
        errors.append("内部工具路由不存在：editor.html")
    else:
        editor_source = editor_path.read_text(encoding="utf-8").lower()
        if not has_robots_noindex(editor_source):
            errors.append("editor.html 必须声明 noindex，避免被视为公开页")
    return errors


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
    route_contract_errors = check_route_contract()
    for error in route_contract_errors:
        print(f"ROUTE_CONTRACT_FAIL {error}")

    if args.write:
        if route_contract_errors:
            print("GATE_FAIL")
            print("Route-family and public disclosure contracts must pass before rewriting the baseline.")
            return 1
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
        with BASELINE.open("w", encoding="utf-8", newline="\r\n") as baseline_file:
            baseline_file.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
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

    if route_contract_errors or missing or changed or untracked or extra_baseline:
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
