#!/usr/bin/env python3
"""Extract cultivate FAQ + material index from local zzz-wiki mirror."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
WIKI = Path("F:/website-archives/zzz-wiki")
OUT = ROOT / "artifacts" / "wiki-migrate"
DEST = ROOT / "assets" / "wiki" / "cultivate"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def to_local(url: str) -> Path | None:
    if not url:
        return None
    text = str(url).strip()
    assets = WIKI / "assets"
    if text.startswith("/zzz/wiki/assets/"):
        path = assets / unquote(text[len("/zzz/wiki/assets/") :])
        return path if path.is_file() else None
    if text.startswith("http://") or text.startswith("https://"):
        parsed = urlparse(text)
        path = assets / parsed.netloc / unquote(parsed.path.lstrip("/"))
        return path if path.is_file() else None
    return None


def stable_name(source: Path, prefix: str) -> str:
    digest = hashlib.sha1(str(source).encode("utf-8")).hexdigest()[:12]
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", source.stem).strip("-").lower()[:40] or "icon"
    return f"{prefix}-{stem}-{digest}{source.suffix.lower() or '.bin'}"


def build_page_index() -> dict[str, dict]:
    index: dict[str, dict] = {}
    for path in (WIKI / "mirror" / "responses").glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
        except json.JSONDecodeError:
            continue
        page = (data.get("data") or {}).get("page") or {}
        page_id = str(page.get("id") or "")
        if not page_id:
            continue
        modules = page.get("modules") or []
        previous = index.get(page_id)
        if previous is None or (modules and not (previous.get("modules") or [])):
            index[page_id] = page
    return index


def extract_faqs(page: dict) -> list[dict]:
    faqs = []
    for module in page.get("modules") or []:
        for component in module.get("components") or []:
            if component.get("component_id") != "multi_table":
                continue
            raw = component.get("data")
            payload = json.loads(raw) if isinstance(raw, str) else (raw or {})
            for table in payload.get("tables") or []:
                for row in table.get("row") or []:
                    cell = row[0] if row else ""
                    text = re.sub(r"<[^>]+>", "\n", str(cell))
                    parts = [part.strip() for part in re.sub(r"\n+", "\n", text).split("\n") if part.strip()]
                    if not parts:
                        continue
                    question = re.sub(r"^Q[:：]?\s*", "", parts[0])
                    answer = re.sub(r"\s+", " ", " ".join(parts[1:])).strip()
                    faqs.append({"question": question, "answer": answer})
    return faqs


def main() -> int:
    catalog = json.loads((OUT / "catalog.json").read_text(encoding="utf-8"))
    page_index = build_page_index()
    faq_page = page_index["698"]
    faqs = extract_faqs(faq_page)

    DEST.mkdir(parents=True, exist_ok=True)
    materials = []
    asset_map = []
    for page in catalog["pages"]:
        if page.get("channel") != "cultivate" or page.get("id") == "698":
            continue
        local = Path(page["iconLocalSource"]) if page.get("iconLocalSource") else None
        cover = ""
        if local and local.is_file():
            filename = stable_name(local, "cultivate")
            target = DEST / filename
            if not target.exists():
                shutil.copy2(local, target)
            cover = str(target.relative_to(ROOT)).replace("\\", "/")
            asset_map.append({"from": str(local), "to": cover})
        materials.append(
            {
                "id": f"cultivate-{page['id']}",
                "wikiId": page["id"],
                "title": page["name"],
                "summary": (page.get("desc") or "").split(",")[0],
                "cover": cover,
                "sourceUrl": page["wikiUrl"],
                "sourceType": "official-wiki-mirror",
                "rightsStatus": "fan-index-use",
                "rightsNote": "内测资源迁移：图标取自本地 zzz-wiki 镜像；不镜像词条长文，详情外链官方百科。",
                "sourceCheckedAt": utc_now()[:10],
            }
        )

    batch = {
        "generatedAt": utc_now(),
        "batchId": "cultivate-guide-materials",
        "guide": {
            "id": "698",
            "title": "市民指南：代理人养成",
            "wikiUrl": "https://baike.mihoyo.com/zzz/wiki/content/698/detail",
            "faqs": faqs,
        },
        "materials": materials,
        "assetMap": asset_map,
    }
    out_path = OUT / "batches" / "cultivate-guide-materials.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(batch, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK faqs={len(faqs)} materials={len(materials)} covers={sum(1 for item in materials if item['cover'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
