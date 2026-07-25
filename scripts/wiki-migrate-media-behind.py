#!/usr/bin/env python3
"""Extract wiki media/PV and behind-the-scenes index cards into HOOXI data batches."""

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
CATALOG = ROOT / "artifacts" / "wiki-migrate" / "catalog.json"
OUT = ROOT / "artifacts" / "wiki-migrate" / "batches" / "media-behind-index.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def to_local(url: str) -> Path | None:
    text = str(url or "").strip()
    if not text:
        return None
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
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", source.stem).strip("-").lower()[:40] or "cover"
    return f"{prefix}-{stem}-{digest}{source.suffix.lower() or '.png'}"


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


def version_of(name: str) -> str:
    match = re.search(r"(\d+\.\d+)版本", name)
    return match.group(1) if match else ""


def build_items(pages, dest: Path, prefix: str, lane: str, route_type: str, page_index: dict[str, dict]):
    dest.mkdir(parents=True, exist_ok=True)
    items = []
    groups: dict[str, dict] = {}
    asset_map = []
    for page in pages:
        page_id = page["id"]
        name = page["name"]
        body = page_index.get(page_id) or {}
        icon = page.get("iconRemote") or body.get("icon_url") or ""
        local = to_local(icon)
        if local is None and page.get("iconLocalSource"):
            candidate = Path(page["iconLocalSource"])
            local = candidate if candidate.is_file() else None
        cover = ""
        if local is not None:
            filename = stable_name(local, prefix)
            target = dest / filename
            if not target.exists():
                shutil.copy2(local, target)
            cover = str(target.relative_to(ROOT)).replace("\\", "/")
            asset_map.append({"from": str(local), "to": cover})
        version = version_of(name)
        if lane == "mainline":
            group_id = "ml-media"
            group_title = "官方媒体 / 世界观"
        else:
            group_id = "bs-ztalk" if "ZTALK" in name else "bs-misc"
            group_title = "ZTALK 幕后对谈" if group_id == "bs-ztalk" else "制作记录"
        groups.setdefault(
            group_id,
            {
                "id": group_id,
                "title": group_title,
                "label": group_id.upper(),
                "summary": "从本地官方百科镜像迁入的索引卡。",
                "theme": "#ffde00",
                "collapsed": False,
            },
        )
        summary = (page.get("desc") or "").split(",")[0]
        items.append(
            {
                "id": f"{prefix}-{page_id}",
                "order": int(page_id) if str(page_id).isdigit() else 0,
                "title": name,
                "tag": f"{version} · 媒体索引" if version else route_type,
                "summary": summary or f"{name}（百科镜像索引）",
                "cover": cover,
                "version": version or "未标注",
                "chapter": name,
                "type": route_type,
                "routeType": route_type,
                "lane": lane,
                "groupId": group_id,
                "spoilerLevel": "轻度" if ("PV" in name or "幕后" in name) else "无",
                "status": "已迁入",
                "sourceUrl": page["wikiUrl"],
                "wikiUrl": page["wikiUrl"],
                "sourceType": "official-wiki-mirror",
                "rightsStatus": "fan-index-use",
                "rightsNote": "内测资源迁移：封面取自本地 zzz-wiki 镜像；详情外链官方百科，不镜像长文。",
                "sourceCheckedAt": utc_now()[:10],
                "video": "",
                "mediaIds": [],
                "characters": [],
                "relatedIds": [],
                "gallery": [],
                "portrait": "",
                "blocks": [],
                "imagePosition": "center",
                "displayMode": "cover",
            }
        )
    items.sort(key=lambda item: (str(item.get("version") or ""), int(item.get("order") or 0)))
    return list(groups.values()), items, asset_map


def merge_into_data(batch: dict) -> None:
    data_path = ROOT / "data.js"
    text = data_path.read_text(encoding="utf-8")
    payload = text.split("=", 1)[1].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    data = json.loads(payload)

    def merge_lane(lane_key: str, section: dict, preserve_existing_media: bool = False):
        existing = list(data.get(lane_key) or [])
        by_id = {item["id"]: item for item in existing}
        # Keep already-verified official Bilibili mainline media entries.
        for item in section["items"]:
            by_id[item["id"]] = item
        if preserve_existing_media:
            for item in existing:
                if item.get("mediaIds") or item.get("video") or item.get("sourceType") == "official-video":
                    by_id[item["id"]] = item
        items = list(by_id.values())
        items.sort(key=lambda item: (str(item.get("version") or ""), int(item.get("order") or 0), item.get("id") or ""))
        data[lane_key] = items
        meta = data.setdefault("pageMeta", {}).setdefault(lane_key, {})
        groups = {group["id"]: group for group in (meta.get("groups") or [])}
        for group in section["groups"]:
            groups[group["id"]] = group
        # Ensure classic mainline groups remain.
        if lane_key == "mainline":
            groups.setdefault(
                "ml-story",
                {
                    "id": "ml-story",
                    "title": "法厄同纪事 · 主线章节",
                    "label": "MAIN 02",
                    "summary": "主线任务章节位。当前仓库尚未接入完整任务正文，先保留清晰分组。",
                    "theme": "#f3d33b",
                    "collapsed": False,
                },
            )
        meta["groups"] = sorted(groups.values(), key=lambda group: group["id"])

    merge_lane("mainline", batch["mainline"], preserve_existing_media=True)
    merge_lane("behindScenes", batch["behindScenes"], preserve_existing_media=False)
    data_path.write_text("window.archiveData=" + json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    index = build_page_index()
    media_pages = [page for page in catalog["pages"] if page.get("channel") == "media"]
    behind_pages = [page for page in catalog["pages"] if page.get("channel") == "behind"]
    ml_groups, ml_items, ml_assets = build_items(
        media_pages, ROOT / "assets" / "wiki" / "media", "media", "mainline", "官方媒体", index
    )
    bs_groups, bs_items, bs_assets = build_items(
        behind_pages, ROOT / "assets" / "wiki" / "behind", "behind", "behindScenes", "幕后记录", index
    )
    batch = {
        "generatedAt": utc_now(),
        "mainline": {"groups": ml_groups, "items": ml_items, "assetMap": ml_assets},
        "behindScenes": {"groups": bs_groups, "items": bs_items, "assetMap": bs_assets},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(batch, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    merge_into_data(batch)
    print(
        f"OK media={len(ml_items)} covers={sum(1 for item in ml_items if item['cover'])} "
        f"behind={len(bs_items)} covers={sum(1 for item in bs_items if item['cover'])}"
    )
