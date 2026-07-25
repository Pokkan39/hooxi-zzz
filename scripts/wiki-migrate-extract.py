#!/usr/bin/env python3
"""Extract ZZZ wiki mirror entries into HOOXI migration batches.

Source of truth: F:/website-archives/zzz-wiki
Does not fetch the network. Copies only files that already exist locally.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WIKI = Path("F:/website-archives/zzz-wiki")
OUT_DIR = ROOT / "artifacts" / "wiki-migrate"
ASSET_ROOT = ROOT / "assets" / "wiki"

ACTIVITY_NAME_RE = re.compile(r"^\d+\.\d+版本活动(?:指南|攻略)$")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_component_data(raw):
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"_unparsed": raw[:500]}
    return {}


def remote_to_local_asset(wiki_root: Path, url: str) -> Path | None:
    if not url:
        return None
    text = str(url).strip()
    assets = wiki_root / "assets"
    if text.startswith("/zzz/wiki/assets/"):
        rel = unquote(text[len("/zzz/wiki/assets/") :])
        path = assets / rel
        return path if path.is_file() else None
    if text.startswith("https://") or text.startswith("http://"):
        parsed = urlparse(text)
        path = assets / parsed.netloc / unquote(parsed.path.lstrip("/"))
        return path if path.is_file() else None
    return None


def stable_asset_name(source: Path, prefix: str) -> str:
    digest = hashlib.sha1(str(source).encode("utf-8")).hexdigest()[:12]
    suffix = source.suffix.lower() or ".bin"
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", source.stem).strip("-").lower()[:40] or "cover"
    return f"{prefix}-{stem}-{digest}{suffix}"


def build_page_index(responses_dir: Path) -> dict[str, tuple[Path, dict]]:
    index: dict[str, tuple[Path, dict]] = {}
    for path in responses_dir.glob("*.json"):
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
        # Prefer the payload that actually contains module bodies.
        if previous is None or (modules and not (previous[1].get("modules") or [])):
            index[page_id] = (path, page)
    return index


def find_page_payload(page_index: dict[str, tuple[Path, dict]], page_id: str):
    return page_index.get(str(page_id), (None, None))


def classify_page(name: str, desc: str) -> str:
    blob = f"{name} {desc}"
    if ACTIVITY_NAME_RE.match(name or ""):
        return "events"
    if name == "市民指南：代理人养成" or "代理人养成" in desc or "角色养成" in desc:
        return "cultivate"
    if "ZTALK" in name or "幕后" in name:
        return "behind"
    if "PV" in name or "世界观" in name:
        return "media"
    if "攻略合集" in name:
        return "guides"
    return "other"


def extract_strategy_entries(page: dict, wiki_root: Path):
    entries = []
    for module in page.get("modules") or []:
        for component in module.get("components") or []:
            if component.get("component_id") != "strategy":
                continue
            data = parse_component_data(component.get("data"))
            for row in data.get("list") or []:
                title = str(row.get("tab_name") or "").strip()
                link = str(row.get("link") or "").strip()
                cover = str(row.get("cover") or "").strip()
                if not title or title == "默认标题" or not link:
                    continue
                local = remote_to_local_asset(wiki_root, cover)
                entries.append(
                    {
                        "title": title,
                        "sourceUrl": link,
                        "summary": str(row.get("primary_summary") or "").strip(),
                        "author": str(row.get("secondary_summary") or "").strip(),
                        "coverRemote": cover,
                        "coverLocalSource": str(local) if local else "",
                        "coverLocalExists": bool(local),
                    }
                )
    return entries


def extract_faq_tables(page: dict):
    faqs = []
    for module in page.get("modules") or []:
        for component in module.get("components") or []:
            if component.get("component_id") != "multi_table":
                continue
            data = parse_component_data(component.get("data"))
            for table in data.get("tables") or []:
                for row in table.get("row") or []:
                    cell = row[0] if row else ""
                    text = re.sub(r"<[^>]+>", "\n", str(cell))
                    text = re.sub(r"\n+", "\n", text).strip()
                    if not text:
                        continue
                    parts = [part.strip() for part in text.split("\n") if part.strip()]
                    if not parts:
                        continue
                    question = re.sub(r"^Q[:：]?\s*", "", parts[0])
                    answer = " ".join(parts[1:]) if len(parts) > 1 else ""
                    faqs.append({"question": question, "answer": answer, "rawText": text})
    return faqs


def build_catalog(wiki_root: Path, page_index: dict[str, tuple[Path, dict]]):
    pages = load_json(wiki_root / "entry-index.json")["pages"]
    catalog = []
    component_counter = Counter()
    missing_bodies = 0
    for page_id, meta in pages.items():
        name = meta.get("name") or ""
        desc = meta.get("desc") or ""
        icon = meta.get("icon_url") or ""
        icon_local = remote_to_local_asset(wiki_root, icon)
        channel = classify_page(name, desc)
        _, body = find_page_payload(page_index, str(page_id))
        module_count = 0
        if body:
            module_count = len(body.get("modules") or [])
            for module in body.get("modules") or []:
                for component in module.get("components") or []:
                    component_counter[component.get("component_id") or "unknown"] += 1
        else:
            missing_bodies += 1
        catalog.append(
            {
                "id": str(page_id),
                "name": name,
                "desc": desc,
                "channel": channel,
                "iconRemote": icon,
                "iconLocalExists": bool(icon_local),
                "iconLocalSource": str(icon_local) if icon_local else "",
                "hasBody": bool(body),
                "moduleCount": module_count,
                "wikiUrl": f"https://baike.mihoyo.com/zzz/wiki/content/{page_id}/detail",
            }
        )
    catalog.sort(key=lambda item: int(item["id"]) if item["id"].isdigit() else item["id"])
    return catalog, component_counter, missing_bodies


def copy_mapped_assets(entries, dest_dir: Path, prefix: str):
    dest_dir.mkdir(parents=True, exist_ok=True)
    mapping = []
    for entry in entries:
        source = entry.get("coverLocalSource") or entry.get("iconLocalSource") or ""
        if not source:
            entry["cover"] = ""
            continue
        source_path = Path(source)
        if not source_path.is_file():
            entry["cover"] = ""
            continue
        filename = stable_asset_name(source_path, prefix)
        dest = dest_dir / filename
        if not dest.exists():
            shutil.copy2(source_path, dest)
        rel = str(dest.relative_to(ROOT)).replace("\\", "/")
        entry["cover"] = rel
        mapping.append({"from": str(source_path), "to": rel})
    return mapping


def extract_activity_batch(wiki_root: Path, page_index: dict[str, tuple[Path, dict]], versions: list[str]):
    pages = load_json(wiki_root / "entry-index.json")["pages"]
    wanted = set(versions)
    groups = []
    items = []
    for page_id, meta in pages.items():
        name = meta.get("name") or ""
        match = re.match(r"^(\d+\.\d+)版本活动(?:指南|攻略)$", name)
        if not match:
            continue
        version = match.group(1)
        if version not in wanted:
            continue
        _, page = find_page_payload(page_index, str(page_id))
        if not page:
            continue
        group_id = f"ev-{version.replace('.', '')}"
        groups.append(
            {
                "id": group_id,
                "title": name,
                "label": f"VER {version}",
                "summary": f"从本地官方百科镜像迁入的 {version} 版本活动索引。",
                "theme": "#ffde00",
                "collapsed": False,
            }
        )
        for index, entry in enumerate(extract_strategy_entries(page, wiki_root), start=1):
            item_id = f"event-{version.replace('.', '')}-{index:03d}"
            summary_bits = [bit for bit in [entry.get("summary"), entry.get("author")] if bit]
            summary = " · ".join(summary_bits) or f"{version} 版本活动攻略索引（来源：米游社/官方百科镜像）。"
            items.append(
                {
                    "id": item_id,
                    "order": index,
                    "title": entry["title"],
                    "tag": f"{version} · 活动索引",
                    "summary": summary,
                    "version": version,
                    "chapter": name,
                    "type": "活动攻略索引",
                    "routeType": "限时活动",
                    "lane": "events",
                    "groupId": group_id,
                    "spoilerLevel": "无",
                    "status": "已迁入",
                    "sourceUrl": entry["sourceUrl"],
                    "wikiUrl": f"https://baike.mihoyo.com/zzz/wiki/content/{page_id}/detail",
                    "coverRemote": entry["coverRemote"],
                    "coverLocalSource": entry["coverLocalSource"],
                    "coverLocalExists": entry["coverLocalExists"],
                    "sourceType": "official-wiki-mirror",
                    "rightsStatus": "fan-index-use",
                    "rightsNote": "内测资源迁移：封面取自本地 zzz-wiki 镜像已有文件，仅作非官方活动索引缩略展示；正文仍外链米游社原文，不镜像攻略长文。",
                    "sourceCheckedAt": utc_now()[:10],
                }
            )
    groups.sort(key=lambda g: g["id"])
    items.sort(key=lambda i: (i["version"], i["order"]))
    return groups, items


def write_report(out_dir: Path, catalog, component_counter: Counter, missing_bodies: int):
    channel_counts = Counter(item["channel"] for item in catalog)
    lines = [
        "# Wiki migrate report",
        "",
        f"- generatedAt: `{utc_now()}`",
        f"- catalogEntries: `{len(catalog)}`",
        f"- missingBodies: `{missing_bodies}`",
        "",
        "## Channels",
    ]
    for key, value in channel_counts.most_common():
        lines.append(f"- {key}: {value}")
    lines.extend(["", "## Component types"])
    for key, value in component_counter.most_common():
        lines.append(f"- {key}: {value}")
    (out_dir / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wiki-root", default=str(DEFAULT_WIKI))
    parser.add_argument("--phase", choices=["catalog", "events", "all"], default="all")
    parser.add_argument("--event-versions", default="1.1,1.2,1.3,1.4")
    parser.add_argument("--copy-assets", action="store_true")
    args = parser.parse_args()

    wiki_root = Path(args.wiki_root)
    out_dir = OUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    print("Indexing wiki response payloads...")
    page_index = build_page_index(wiki_root / "mirror" / "responses")
    print(f"OK page_index {len(page_index)}")

    if args.phase in {"catalog", "all"}:
        catalog, component_counter, missing_bodies = build_catalog(wiki_root, page_index)
        write_json(out_dir / "catalog.json", {
            "generatedAt": utc_now(),
            "wikiRoot": str(wiki_root),
            "count": len(catalog),
            "missingBodies": missing_bodies,
            "pages": catalog,
        })
        write_report(out_dir, catalog, component_counter, missing_bodies)
        print(f"OK catalog {len(catalog)} missingBodies={missing_bodies}")

    if args.phase in {"events", "all"}:
        versions = [part.strip() for part in args.event_versions.split(",") if part.strip()]
        groups, items = extract_activity_batch(wiki_root, page_index, versions)
        asset_map = []
        if args.copy_assets:
            asset_map = copy_mapped_assets(items, ASSET_ROOT / "events", "event")
        batch = {
            "generatedAt": utc_now(),
            "batchId": f"events-{'-'.join(versions)}",
            "versions": versions,
            "groups": groups,
            "items": items,
            "assetMap": asset_map,
        }
        batch_name = f"events-{versions[0].replace('.', '')}-{versions[-1].replace('.', '')}.json"
        write_json(out_dir / "batches" / batch_name, batch)
        write_json(out_dir / "asset-map-events-batch-a.json", asset_map)
        print(f"OK events batch versions={versions} groups={len(groups)} items={len(items)} assets={len(asset_map)}")


if __name__ == "__main__":
    raise SystemExit(main())
