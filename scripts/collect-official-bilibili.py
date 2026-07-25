#!/usr/bin/env python3
"""可恢复地枚举并核验《绝区零》官方 B 站投稿元数据；不下载视频。"""

import argparse
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

OFFICIAL_UID = "1636034895"
RISK_PATTERNS = (
    re.compile(r"(?:HTTP(?:\s+Error)?|status(?:\s+code)?)[ :=]+412\b", re.IGNORECASE),
    re.compile(r"错误码[：: ]+-?352\b"),
    re.compile(r"\bcode\s*[=:]\s*-352\b", re.IGNORECASE),
    re.compile(r'"code"\s*:\s*-352\b'),
    re.compile(r"\b(?:risk control|风控)\b", re.IGNORECASE),
)


def load_state(path):
    if not path.exists():
        return {"uid": OFFICIAL_UID, "bvids": [], "checked": {}, "pending": [], "stoppedReason": ""}
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(path, state):
    state["updatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def run_ytdlp(url, flat=False):
    command = [
        sys.executable, "-m", "yt_dlp", "--no-download", "--no-warnings",
        "--retries", "0", "--extractor-retries", "0", "--socket-timeout", "15",
        "--dump-single-json",
    ]
    if flat:
        command.append("--flat-playlist")
    command.append(url)
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
    error_text = result.stderr if result.returncode == 0 else f"{result.stderr}\n{result.stdout}"
    risk = next((match.group(0) for pattern in RISK_PATTERNS if (match := pattern.search(error_text))), "")
    if risk:
        raise RuntimeError(f"risk-control:{risk}")
    if result.returncode != 0:
        message = result.stderr.strip().splitlines()[-1] if result.stderr.strip() else f"yt-dlp exit {result.returncode}"
        raise RuntimeError(message)
    return json.loads(result.stdout)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="artifacts/bilibili-official-1636034895.json")
    parser.add_argument("--max-details", type=int, default=12)
    parser.add_argument("--interval", type=float, default=4.0, help="不同详情请求之间的固定低频间隔；不是重试循环")
    args = parser.parse_args()
    output = Path(args.output)
    state = load_state(output)
    state["stoppedReason"] = ""

    try:
        listing = run_ytdlp(f"https://space.bilibili.com/{OFFICIAL_UID}/video", flat=True)
        entries = listing.get("entries") or []
        enumerated_bvids = [str(item.get("id", "")) for item in entries if str(item.get("id", "")).startswith("BV")]
        existing_bvids = [str(bvid) for bvid in state.get("bvids", []) if str(bvid).startswith("BV")]
        existing_pending = [str(bvid) for bvid in state.get("pending", []) if str(bvid).startswith("BV")]
        state["bvids"] = list(dict.fromkeys(existing_bvids + enumerated_bvids))
        state["pending"] = list(dict.fromkeys(
            [bvid for bvid in existing_pending if bvid not in state["checked"]] +
            [bvid for bvid in state["bvids"] if bvid not in state["checked"]]
        ))
        save_state(output, state)
    except Exception as error:
        state["stoppedReason"] = str(error)
        save_state(output, state)
        print(f"STOP: 枚举失败并已保存进度：{error}", file=sys.stderr)
        return 2

    checked_now = 0
    while state["pending"] and checked_now < args.max_details:
        bvid = state["pending"][0]
        if checked_now and args.interval > 0:
            time.sleep(args.interval)
        try:
            detail = run_ytdlp(f"https://www.bilibili.com/video/{bvid}")
        except Exception as error:
            state["stoppedReason"] = f"{bvid}: {error}"
            save_state(output, state)
            print(f"STOP: 详情核验中止并已保存进度：{state['stoppedReason']}", file=sys.stderr)
            return 2
        uploader_id = str(detail.get("uploader_id") or detail.get("channel_id") or "")
        copyright_value = detail.get("copyright")
        no_reprint_value = detail.get("no_reprint")
        if no_reprint_value is None and isinstance(detail.get("rights"), dict):
            no_reprint_value = detail["rights"].get("no_reprint")
        state["checked"][bvid] = {
            "bvid": bvid,
            "title": detail.get("title") or "",
            "description": detail.get("description") or "",
            "uploader": detail.get("uploader") or "",
            "uploaderId": uploader_id,
            "uploadDate": detail.get("upload_date") or "",
            "isReprint": copyright_value == 2 if copyright_value is not None else None,
            "noReprint": bool(no_reprint_value) if no_reprint_value is not None else None,
            "totalDurationSeconds": detail.get("duration"),
            "primaryPartDurationSeconds": (detail.get("entries") or [{}])[0].get("duration") if detail.get("entries") else detail.get("duration"),
            "thumbnail": detail.get("thumbnail") or "",
            "thumbnailWidth": detail.get("width"),
            "thumbnailHeight": detail.get("height"),
            "webpageUrl": detail.get("webpage_url") or f"https://www.bilibili.com/video/{bvid}",
            "verifiedOfficialUid": uploader_id == OFFICIAL_UID,
            "evidenceSource": "yt-dlp-online-detail",
        }
        state["pending"].pop(0)
        checked_now += 1
        save_state(output, state)

    print(f"OK: 枚举 {len(state['bvids'])} 条，本次详情核验 {checked_now} 条，待核验 {len(state['pending'])} 条。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
