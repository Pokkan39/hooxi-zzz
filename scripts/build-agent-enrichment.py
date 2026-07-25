# -*- coding: utf-8 -*-
"""Extract agent archive fields from local zzz-wiki mirror into HOOXI enrichment JSON."""
from __future__ import annotations

import html
import json
import pathlib
import re
import shutil
from typing import Any
from urllib.parse import urlparse

ROOT = pathlib.Path(r"F:/website-archives/zzz-wiki/mirror/responses")
WIKI_ROOT = pathlib.Path(r"F:/website-archives/zzz-wiki")
SITE_ROOT = pathlib.Path(r"F:/hooxi-zzz")
CATALOG_JS = SITE_ROOT / "agent-catalog.js"
OUT_PATH = SITE_ROOT / "artifacts" / "agent-enrichment.json"
RUNTIME_JS = SITE_ROOT / "agent-enrichment.js"
MATERIALS_DIR = SITE_ROOT / "assets" / "materials"
GALLERY_DIR = SITE_ROOT / "assets" / "gallery"
ICON_INDEX_PATH = SITE_ROOT / "artifacts" / "_small-icon-pages.json"
BAIKE_ORIGIN = "https://baike.mihoyo.com"
GALLERY_PER_AGENT = 16
# Prefer core showcase tabs so every agent keeps entrance/idle/defeat/portrait slots first.
GALLERY_PRIORITY = (
    "入场特写1", "入场特写2", "入场方式1", "入场方式2", "时装入场1", "时装入场2",
    "待机动画", "待机动画1", "待机动画2", "时装待机", "时装待机1", "时装待机2", "皮肤待机",
    "战败动作", "战败",
    "影画展示1", "影画展示2", "影画展示3",
    "角色卡片", "角色立绘",
    "采访手记1", "采访手记2",
)

def strip_html(value: str) -> str:
    if not value:
        return ""
    text = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"</div\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<li[^>]*>", "• ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def norm_name(value: str) -> str:
    text = str(value or "")
    text = text.replace("・", "·").replace("•", "·").replace(" ", "")
    text = text.replace("「", "").replace("」", "")
    text = text.replace("＆", "&").replace("&", "与")
    return text


def parse_data_field(data: Any) -> Any:
    if isinstance(data, str):
        try:
            return json.loads(data)
        except Exception:
            return data
    return data


def extract_rich_texts(obj: Any, out: list[str] | None = None) -> list[str]:
    if out is None:
        out = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in {"rich_text", "desc", "text", "content"} and isinstance(value, str) and "<" in value:
                cleaned = strip_html(value)
                if cleaned and len(cleaned) > 8:
                    out.append(cleaned)
            else:
                extract_rich_texts(value, out)
    elif isinstance(obj, list):
        for item in obj:
            extract_rich_texts(item, out)
    return out


def normalize_material_url(value: str) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    if text.startswith("//"):
        text = "https:" + text
    if text.startswith("/zzz/wiki/"):
        path = text.split("?", 1)[0]
        return f"{BAIKE_ORIGIN}{path}"
    try:
        parsed = urlparse(text)
    except Exception:
        return text[:500]
    if parsed.netloc.endswith("mihoyo.com") and parsed.path.startswith("/zzz/wiki/"):
        return f"{BAIKE_ORIGIN}{parsed.path}"
    if parsed.scheme in {"http", "https"}:
        return text.split("?", 1)[0][:500]
    return text[:500]


def material_ep_id(value: Any) -> str:
    text = str(value or "").strip()
    return text[:32] if text else ""


def extract_growth_materials(items: Any, row_html: str = "") -> list[dict[str, Any]]:
    materials: list[dict[str, Any]] = []
    if isinstance(items, list):
        for item in items:
            if not isinstance(item, dict) or not item.get("nickname"):
                continue
            materials.append(
                {
                    "name": strip_html(str(item.get("nickname") or ""))[:80],
                    "amount": item.get("amount") or "",
                    "grade": str(item.get("grade") or "")[:8],
                    "url": normalize_material_url(str(item.get("link") or "")),
                    "epId": material_ep_id(item.get("ep_id")),
                    "img": str(item.get("img") or "")[:500],
                }
            )
    for attrs in re.findall(r"<span\b([^>]*\bcustom-entry-wrapper\b[^>]*)>", row_html, flags=re.I):
        values = dict(re.findall(r'data-entry-([\w-]+)="([^"]*)"', attrs, flags=re.I))
        name = strip_html(html.unescape(values.get("name", "")))[:80]
        if name:
            materials.append(
                {
                    "name": name,
                    "amount": values.get("amount") or values.get("desc") or "",
                    "grade": values.get("grade", "")[:8],
                    "url": normalize_material_url(html.unescape(values.get("link", ""))),
                    "epId": material_ep_id(values.get("id")),
                    "img": html.unescape(values.get("img", ""))[:500],
                }
            )
    unique: list[dict[str, Any]] = []
    seen = set()
    for material in materials:
        key = (material["name"], str(material["amount"]), material["url"], material["epId"])
        if key not in seen:
            seen.add(key)
            unique.append(material)
    return unique[:16]


def load_icon_index() -> dict[str, str]:
    """Map material epId / name -> remote or mirrored icon URL."""
    index: dict[str, str] = {}
    if not ICON_INDEX_PATH.exists():
        return index
    try:
        rows = json.loads(ICON_INDEX_PATH.read_text(encoding="utf-8"))
    except Exception:
        return index
    if not isinstance(rows, list):
        return index
    for row in rows:
        if not isinstance(row, (list, tuple)) or len(row) < 4:
            continue
        name = strip_html(str(row[0] or ""))
        ep_id = material_ep_id(row[1])
        img = str(row[3] or "").strip()
        if not img:
            continue
        if ep_id and ep_id not in index:
            index[ep_id] = img
        if name and f"name:{name}" not in index:
            index[f"name:{name}"] = img
    return index


def resolve_mirror_icon(img_url: str) -> pathlib.Path | None:
    text = str(img_url or "").strip()
    if not text:
        return None
    text = text.split("?", 1)[0]
    if text.startswith("//"):
        text = "https:" + text
    if text.startswith("https://act-upload.mihoyo.com/"):
        return WIKI_ROOT / "assets" / "act-upload.mihoyo.com" / text.split("https://act-upload.mihoyo.com/", 1)[1]
    if text.startswith("http://act-upload.mihoyo.com/"):
        return WIKI_ROOT / "assets" / "act-upload.mihoyo.com" / text.split("http://act-upload.mihoyo.com/", 1)[1]
    if text.startswith("/zzz/wiki/assets/"):
        return WIKI_ROOT / "assets" / text.split("/zzz/wiki/assets/", 1)[1]
    if text.startswith("https://baike.mihoyo.com/zzz/wiki/assets/"):
        return WIKI_ROOT / "assets" / text.split("https://baike.mihoyo.com/zzz/wiki/assets/", 1)[1]
    if text.startswith("http://baike.mihoyo.com/zzz/wiki/assets/"):
        return WIKI_ROOT / "assets" / text.split("http://baike.mihoyo.com/zzz/wiki/assets/", 1)[1]
    return None


def material_asset_id(material: dict[str, Any]) -> str:
    ep_id = material_ep_id(material.get("epId"))
    if ep_id:
        return ep_id
    name = strip_html(str(material.get("name") or "material"))
    slug = re.sub(r"[^\w\u4e00-\u9fff-]+", "-", name, flags=re.U).strip("-").lower()
    return slug[:64] or "material"


def localize_material_icons(agents_by_id: dict[str, dict[str, Any]]) -> dict[str, int]:
    icon_index = load_icon_index()
    MATERIALS_DIR.mkdir(parents=True, exist_ok=True)
    unique: dict[str, dict[str, Any]] = {}
    for agent in agents_by_id.values():
        for stage in agent.get("growth") or []:
            for material in stage.get("materials") or []:
                asset_id = material_asset_id(material)
                bucket = unique.setdefault(asset_id, {"material": material, "refs": []})
                bucket["refs"].append(material)
                # Prefer records that already carry an img field.
                if material.get("img") and not bucket["material"].get("img"):
                    bucket["material"] = material

    copied = 0
    missing = 0
    for asset_id, bucket in unique.items():
        sample = bucket["material"]
        img = str(sample.get("img") or "")
        ep_id = material_ep_id(sample.get("epId"))
        if not img and ep_id:
            img = icon_index.get(ep_id, "")
        if not img:
            img = icon_index.get(f"name:{sample.get('name') or ''}", "")
        source = resolve_mirror_icon(img)
        icon_path = ""
        if source and source.is_file():
            ext = source.suffix.lower() or ".png"
            if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
                ext = ".png"
            dest = MATERIALS_DIR / f"{asset_id}{ext}"
            if not dest.exists() or dest.stat().st_size != source.stat().st_size:
                shutil.copy2(source, dest)
            icon_path = f"assets/materials/{asset_id}{ext}"
            copied += 1
        else:
            missing += 1
        for material in bucket["refs"]:
            if icon_path:
                material["icon"] = icon_path
            else:
                material.pop("icon", None)
            # Keep epId; drop remote img from runtime payload to avoid accidental hotlink use.
            material.pop("img", None)
            if material.get("url"):
                material["url"] = normalize_material_url(str(material["url"]))
    return {"unique": len(unique), "withIcon": copied, "missingIcon": missing}


def gallery_sort_key(item: dict[str, Any]) -> tuple[int, str]:
    title = str(item.get("title") or "").strip()
    try:
        rank = GALLERY_PRIORITY.index(title)
    except ValueError:
        # Fuzzy buckets keep important motion tabs ahead of decorative stills.
        if "入场" in title:
            rank = 50
        elif "待机" in title:
            rank = 60
        elif "战败" in title:
            rank = 70
        elif "影画" in title:
            rank = 80
        elif "卡片" in title or "立绘" in title:
            rank = 90
        else:
            rank = 200
    return (rank, title)


def localize_gallery_images(agents_by_id: dict[str, dict[str, Any]]) -> dict[str, int]:
    """Copy up to GALLERY_PER_AGENT original gallery files per agent from the wiki mirror.

    Keeps original formats (including GIF). Items without a mirror file are dropped so
    the runtime never emits remote image hotlinks. Core motion tabs are prioritized.
    """
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    agents_with = 0
    copied = 0
    missing = 0
    bytes_copied = 0
    for agent_id, agent in agents_by_id.items():
        localized: list[dict[str, str]] = []
        agent_dir = GALLERY_DIR / agent_id
        # Deduplicate by title while preserving priority order.
        ordered = sorted(
            [item for item in (agent.get("gallery") or []) if isinstance(item, dict)],
            key=gallery_sort_key,
        )
        seen_titles: set[str] = set()
        for item in ordered:
            if len(localized) >= GALLERY_PER_AGENT:
                break
            title = str(item.get("title") or "").strip()[:80]
            title_key = title or str(item.get("image") or "")
            if title_key in seen_titles:
                continue
            source = resolve_mirror_icon(str(item.get("image") or item.get("url") or item.get("src") or ""))
            if not source or not source.is_file():
                missing += 1
                continue
            ext = source.suffix.lower() or ".png"
            if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
                ext = ".png"
            agent_dir.mkdir(parents=True, exist_ok=True)
            dest = agent_dir / f"{len(localized):02d}{ext}"
            if not dest.exists() or dest.stat().st_size != source.stat().st_size:
                shutil.copy2(source, dest)
                bytes_copied += dest.stat().st_size
            else:
                bytes_copied += dest.stat().st_size
            localized.append(
                {
                    "title": title or "档案图",
                    "image": f"assets/gallery/{agent_id}/{dest.name}",
                }
            )
            seen_titles.add(title_key)
            copied += 1
        agent["gallery"] = localized
        if localized:
            agents_with += 1
    return {
        "agentsWithGallery": agents_with,
        "copied": copied,
        "missingSkipped": missing,
        "bytes": bytes_copied,
    }


def extract_growth(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, dict):
        return []
    for item in data.get("list") or []:
        if not isinstance(item, dict):
            continue
        for child in item.get("children") or []:
            if not isinstance(child, dict):
                continue
            desc = strip_html(str(child.get("desc") or ""))
            stages = child.get("growth")
            if not isinstance(stages, list) or "职级晋升" not in desc or "滑动滑块" not in desc:
                continue
            growth: list[dict[str, Any]] = []
            for stage in stages[:8]:
                if not isinstance(stage, dict):
                    continue
                sections: list[dict[str, Any]] = []
                row_html = ""
                for section in (stage.get("children") or [])[:6]:
                    if not isinstance(section, dict):
                        continue
                    headers = [strip_html(str(value))[:120] for value in (section.get("header") or [])[:8]]
                    rows: list[list[str]] = []
                    for row in (section.get("row") or [])[:12]:
                        if not isinstance(row, list):
                            continue
                        row_html += "".join(str(cell or "") for cell in row)
                        cells = [strip_html(str(cell or ""))[:2000] for cell in row[:8]]
                        if any(cells):
                            rows.append(cells)
                    if headers or rows:
                        sections.append({"name": strip_html(str(section.get("name") or ""))[:120], "header": headers, "rows": rows})
                materials = extract_growth_materials(stage.get("materials"), row_html)
                if sections or materials:
                    growth.append({"name": strip_html(str(stage.get("name") or "阶段"))[:40], "sections": sections, "materials": materials})
            return growth
    return []


def extract_story_entries(data: Any) -> list[dict[str, str]]:
    stories: list[dict[str, str]] = []
    if not isinstance(data, dict):
        return stories
    if isinstance(data.get("rich_text"), str):
        cleaned = strip_html(data["rich_text"])
        if cleaned:
            stories.append({"title": "", "summary": cleaned})
    for key in ("list", "tables", "tabs"):
        values = data.get(key)
        if not isinstance(values, list):
            continue
        for item in values:
            if not isinstance(item, dict):
                continue
            title = item.get("title") or item.get("tab_name") or item.get("name") or ""
            desc = item.get("desc") or item.get("rich_text") or item.get("text") or ""
            if isinstance(desc, str) and desc.strip():
                stories.append({"title": strip_html(str(title)), "summary": strip_html(desc)})
            for child in item.get("children") or []:
                if not isinstance(child, dict):
                    continue
                child_title = child.get("title") or child.get("tab_name") or ""
                child_desc = child.get("desc") or child.get("rich_text") or ""
                if isinstance(child_desc, str) and child_desc.strip():
                    stories.append({"title": strip_html(str(child_title)), "summary": strip_html(child_desc)})
    return stories


def load_catalog() -> list[dict[str, str]]:
    source = CATALOG_JS.read_text(encoding="utf-8")
    row_re = re.compile(r"\['([^']+)','([^']+)','([^']+)','([^']+)'")
    return [
        {"id": match.group(1), "name": match.group(2), "englishName": match.group(3), "factionId": match.group(4)}
        for match in row_re.finditer(source)
    ]


def walk_menus(menus: Any, names: list[str]) -> None:
    if not isinstance(menus, list):
        return
    for item in menus:
        if isinstance(item, dict):
            names.append(item.get("name") or "")
            walk_menus(item.get("sub_menus") or [], names)


def score_record(record: dict[str, Any]) -> int:
    return (
        len(record.get("impression") or "")
        + sum(len(item.get("summary") or "") for item in record.get("personalStories") or [])
        + len(record.get("gallery") or [])
        + sum(len(stage.get("sections") or []) * 20 + len(stage.get("materials") or []) * 10 for stage in record.get("growth") or [])
    )


def main() -> None:
    catalog = load_catalog()
    aliases: dict[str, str] = {
        "11号": "soldier-11",
        "席德": "seed",
        "扳机": "trigger",
        "亚历山德丽娜·莎芭丝缇安": "rina",
        "仪玄": "yixuan",
        "伊德海莉·墨菲": "yidhari",
        "伊芙琳·舒瓦利耶": "evelyn",
        "佩洛伊斯": "pyrois",
        "冯·莱卡恩": "lycaon",
        "凯撒·金": "caesar",
        "千夏": "sunna",
        "南宫羽": "nangong-yu",
        "卢西娅·艾洛温": "lucia",
        "可琳·威克斯": "corin",
        "叶瞬光": "ye-shunguang",
        "奥菲丝·马格努森与鬼火": "orphie-and-magus",
        "奥菲丝与鬼火": "orphie-and-magus",
        "妮可·德玛拉": "nicole-demara",
        "安东·伊万诺夫": "anton",
        "安比·德玛拉": "anby",
        "希希芙": "cissia",
        "星徽·比利·奇德": "starlight-billy",
        "星见雅": "miyabi",
        "普罗米娅": "promeia",
        "月城柳": "yanagi",
        "本·比格": "ben",
        "朱鸢": "zhu-yuan",
        "柏妮思·怀特": "burnice",
        "格莉丝·霍华德": "grace-howard",
        "橘福福": "ju-fufu",
        "比利·奇德": "billy-kid",
        "波可娜·费雷尼": "pulchra",
        "派派·韦尔": "piper",
        "浅羽悠真": "harumasa",
        "浮波柚叶": "ukinami-yuzuha",
        "潘引壶": "pan-yinhu",
        "照": "zhao",
        "爱丽丝·泰姆菲尔德": "alice",
        "爱芮": "aria",
        "狛野真斗": "manato",
        "猫宫又奈": "nekomata",
        "珂蕾妲·贝洛伯格": "koleda",
        "琉音": "dialyn",
        "简·杜": "jane-doe",
        "维琳娜·艾嘉德": "velina",
        "耀嘉音": "astra-yao",
        "般岳": "banyue",
        "艾莲·乔": "ellen",
        "苍角": "soukaku",
        "莱特": "lighter",
        "薇薇安·班希": "vivian",
        "诺姆·霍洛维尔": "norma",
        "赛斯·洛威尔": "seth",
        "雨果·维拉德": "hugo",
        "零号·安比": "soldier-0-anby",
        "露西亚娜·德·蒙特夫": "lucy",
        "青衣": "qingyi",
    }
    for character in catalog:
        aliases[norm_name(character["name"])] = character["id"]

    agents_by_id: dict[str, dict[str, Any]] = {}
    unmatched: list[str] = []
    scanned = 0

    for path in ROOT.glob("*.json"):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        page = (payload.get("data") or {}).get("page") if isinstance(payload, dict) else None
        if not isinstance(page, dict):
            continue
        menu_names: list[str] = []
        walk_menus(page.get("menus") or [], menu_names)
        if "代理人" not in menu_names:
            continue
        scanned += 1
        wiki_name = page.get("name") or ""
        agent_id = aliases.get(norm_name(wiki_name))
        if not agent_id:
            normalized = norm_name(wiki_name)
            for character in catalog:
                candidate = norm_name(character["name"])
                if normalized == candidate or normalized in candidate or candidate in normalized:
                    agent_id = character["id"]
                    break
        if not agent_id:
            unmatched.append(wiki_name)
            continue

        impression = ""
        cv_text = ""
        personal_stories: list[dict[str, str]] = []
        shop_notes: list[str] = []
        gallery: list[dict[str, str]] = []
        strategy_links: list[dict[str, str]] = []
        growth: list[dict[str, Any]] = []
        abstract = ""

        ext = page.get("ext") or {}
        front_ext = ext.get("fe_ext")
        if isinstance(front_ext, str):
            try:
                front_ext = json.loads(front_ext)
            except Exception:
                front_ext = {}
        if isinstance(front_ext, dict):
            for value in front_ext.values():
                if isinstance(value, dict) and isinstance(value.get("abstract"), dict):
                    abstract = strip_html(value["abstract"].get("text") or "") or abstract

        for module in page.get("modules") or []:
            if not isinstance(module, dict):
                continue
            module_name = module.get("name") or ""
            for component in module.get("components") or []:
                if not isinstance(component, dict):
                    continue
                data = parse_data_field(component.get("data"))
                component_id = component.get("component_id") or ""
                if component_id == "role_talent":
                    candidate_growth = extract_growth(data)
                    if len(candidate_growth) > len(growth):
                        growth = candidate_growth
                if module_name == "角色印象":
                    texts = extract_rich_texts(data)
                    if texts:
                        impression = max(texts, key=len)
                elif module_name == "角色CV":
                    texts = extract_rich_texts(data)
                    if texts:
                        cv_text = max(texts, key=len)
                elif module_name == "角色故事":
                    entries = extract_story_entries(data)
                    for entry in entries:
                        if entry.get("summary"):
                            personal_stories.append(entry)
                    if not entries:
                        for text in extract_rich_texts(data):
                            personal_stories.append({"title": "角色故事", "summary": text})
                elif module_name == "录像店经营留言信息":
                    shop_notes.extend(extract_rich_texts(data))
                elif component_id == "map_desc" and isinstance(data, dict):
                    for item in data.get("list") or []:
                        if isinstance(item, dict) and item.get("image"):
                            gallery.append(
                                {
                                    "title": item.get("tab_name") or "",
                                    "image": item.get("image") or "",
                                }
                            )
                elif component_id == "strategy" and isinstance(data, dict):
                    for item in data.get("list") or []:
                        if isinstance(item, dict) and item.get("link"):
                            strategy_links.append(
                                {
                                    "title": item.get("tab_name") or "资料",
                                    "url": item.get("link") or "",
                                    "cover": item.get("cover") or "",
                                }
                            )

        # keep unique story summaries
        unique_stories: list[dict[str, str]] = []
        seen = set()
        for entry in personal_stories:
            key = (entry.get("title") or "", entry.get("summary") or "")
            if key in seen or not entry.get("summary"):
                continue
            seen.add(key)
            unique_stories.append(entry)

        record = {
            "id": agent_id,
            "wikiId": page.get("id"),
            "wikiName": wiki_name,
            "iconUrl": page.get("icon_url") or "",
            "headerImgUrl": page.get("header_img_url") or "",
            "abstract": abstract,
            "impression": impression,
            "cv": cv_text,
            "personalStories": unique_stories[:8],
            "shopNotes": shop_notes[:4],
            "gallery": gallery[:12],
            "strategyLinks": strategy_links[:6],
            "growth": growth,
            "sourceUrl": f"https://baike.mihoyo.com/zzz/wiki/content/{page.get('id')}/detail",
        }
        previous = agents_by_id.get(agent_id)
        if not previous or score_record(record) > score_record(previous):
            agents_by_id[agent_id] = record

    catalog_ids = {item["id"] for item in catalog}
    missing = sorted(catalog_ids - set(agents_by_id))
    icon_stats = localize_material_icons(agents_by_id)
    gallery_stats = localize_gallery_images(agents_by_id)
    payload = {
        "snapshotDate": "2026-07-18",
        "source": "F:/website-archives/zzz-wiki mirror",
        "note": "结构化摘录用于 HOOXI 角色关系导航；非官方 wiki 整站复制。材料图标与档案图集已复制到 assets/materials/、assets/gallery/，页面零外联热链。",
        "matched": len(agents_by_id),
        "scannedAgentPages": scanned,
        "unmatched": unmatched,
        "missingCatalogIds": missing,
        "materialIcons": icon_stats,
        "galleryImages": gallery_stats,
        "agents": agents_by_id,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # runtime browser bundle
    runtime = (
        "window.agentEnrichment="
        + json.dumps(
            {
                "snapshotDate": payload["snapshotDate"],
                "source": payload["source"],
                "note": payload["note"],
                "agents": agents_by_id,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )
        + ";\n"
    )
    RUNTIME_JS.write_text(runtime, encoding="utf-8")

    print(f"scanned={scanned}")
    print(f"matched={len(agents_by_id)}")
    print(f"unmatched={unmatched}")
    print(f"missing={missing}")
    print(f"withImpression={sum(1 for item in agents_by_id.values() if item.get('impression'))}")
    print(f"withStories={sum(1 for item in agents_by_id.values() if item.get('personalStories'))}")
    print(f"withGrowth={sum(1 for item in agents_by_id.values() if item.get('growth'))}")
    print(
        f"materialIcons unique={icon_stats['unique']} withIcon={icon_stats['withIcon']} missingIcon={icon_stats['missingIcon']}"
    )
    print(
        "galleryImages"
        f" agents={gallery_stats['agentsWithGallery']}"
        f" copied={gallery_stats['copied']}"
        f" missingSkipped={gallery_stats['missingSkipped']}"
        f" mb={gallery_stats['bytes'] / (1024 * 1024):.1f}"
    )
    print(f"wrote {OUT_PATH}")
    print(f"wrote {RUNTIME_JS} bytes={RUNTIME_JS.stat().st_size}")
    for key in ("anby", "nicole-demara", "miyabi", "ellen"):
        row = agents_by_id.get(key) or {}
        materials = []
        for stage in row.get("growth") or []:
            materials.extend(stage.get("materials") or [])
        with_icon = sum(1 for item in materials if item.get("icon"))
        gallery = row.get("gallery") or []
        print(
            key,
            "imp",
            (row.get("impression") or "")[:48].replace("\n", " "),
            "stories",
            len(row.get("personalStories") or []),
            "materials",
            len(materials),
            "icons",
            with_icon,
            "gallery",
            len(gallery),
        )


if __name__ == "__main__":
    main()
