#!/usr/bin/env python3
"""Localize agent wiki icons from zzz-wiki mirror into HOOXI assets."""

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
ENRICHMENT = ROOT / "agent-enrichment.js"
DEST = ROOT / "assets" / "wiki" / "agents"
OUT = ROOT / "artifacts" / "wiki-migrate" / "batches" / "agents-icon-localize.json"


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
    candidate = ROOT / text.replace("\\", "/")
    return candidate if candidate.is_file() else None


def main() -> int:
    text = ENRICHMENT.read_text(encoding="utf-8")
    match = re.match(r"^window\.agentEnrichment\s*=\s*(.*);\s*$", text, re.S)
    if not match:
        # file may be one line without trailing spaces variance
        raw = text.strip()
        if raw.startswith("window.agentEnrichment="):
            raw = raw[len("window.agentEnrichment=") :]
            if raw.endswith(";"):
                raw = raw[:-1]
            data = json.loads(raw)
        else:
            raise SystemExit("unable to parse agent-enrichment.js")
    else:
        data = json.loads(match.group(1))

    DEST.mkdir(parents=True, exist_ok=True)
    mapping = []
    localized = 0
    missing = []
    for agent_id, agent in (data.get("agents") or {}).items():
        icon = agent.get("iconUrl") or ""
        source = to_local(icon)
        if source is None:
            missing.append({"id": agent_id, "iconUrl": icon})
            continue
        suffix = source.suffix.lower() or ".png"
        dest = DEST / f"{agent_id}{suffix}"
        if not dest.exists() or dest.stat().st_size != source.stat().st_size:
            shutil.copy2(source, dest)
        rel = str(dest.relative_to(ROOT)).replace("\\", "/")
        agent["iconUrl"] = rel
        agent["iconRemote"] = icon if icon.startswith("/") or icon.startswith("http") else agent.get("iconRemote", "")
        agent["wikiUrl"] = f"https://baike.mihoyo.com/zzz/wiki/content/{agent.get('wikiId')}/detail" if agent.get("wikiId") else agent.get("wikiUrl", "")
        mapping.append({"id": agent_id, "from": str(source), "to": rel, "wikiId": agent.get("wikiId")})
        localized += 1

        header = agent.get("headerImgUrl") or ""
        header_source = to_local(header)
        if header_source is not None:
            header_dest = DEST / f"{agent_id}-header{header_source.suffix.lower() or '.png'}"
            if not header_dest.exists() or header_dest.stat().st_size != header_source.stat().st_size:
                shutil.copy2(header_source, header_dest)
            agent["headerImgUrl"] = str(header_dest.relative_to(ROOT)).replace("\\", "/")

    data["snapshotDate"] = utc_now()[:10]
    data["note"] = (
        "结构化摘录用于 HOOXI 角色关系导航；代理人图标已本地化到 assets/wiki/agents/。"
        "非官方 wiki 整站复制；页面不热链外站图片。"
    )
    ENRICHMENT.write_text(
        "window.agentEnrichment=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "generatedAt": utc_now(),
                "localized": localized,
                "missing": missing,
                "mapping": mapping,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"OK localized={localized} missing={len(missing)} dest={DEST}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
