#!/usr/bin/env python3
"""Download the chosen photographs and record where each came from.

    python3 captures/pick.py [key ...]

Reads captures/picks.json (key -> the Commons file chosen from the sheets, and
its alt text), fetches each at a width that leaves at least 1200px on its
short side (and no more than 2400px wide), writes public/assets/s19-<key>-1600.jpg
and -800.jpg, and writes src/photos.json: author, licence, the page the file
is published on, and the alt text. The alt text is the only place a picture
is described.
"""
import json, io, sys, math, time, urllib.parse, urllib.request, re, html
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).parent.parent
OUT = ROOT / "public" / "assets"; OUT.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "golden-grids-study/1.0 (https://github.com/gregoryedgerton; layout study photo research)"}
def get(url, raw=False):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r: b = r.read()
            return b if raw else json.loads(b)
        except Exception as e:
            if attempt == 4: raise
            time.sleep(3 * (attempt + 1))
def strip(s): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()
def info(title, width):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "format": "json", "titles": "File:" + title, "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": width})
    ii = next(iter(get(u)["query"]["pages"].values()))["imageinfo"][0]; m = ii["extmetadata"]
    return {"credit": strip(m.get("Artist", {}).get("value", "")) or "Unknown", "licence": strip(m.get("LicenseShortName", {}).get("value", "")),
            "licenceUrl": strip(m.get("LicenseUrl", {}).get("value", "")), "page": ii["descriptionurl"], "w": ii["width"], "h": ii["height"],
            "url": ii.get("thumburl") or ii["url"], "title": title}
picks = json.loads((ROOT / "captures" / "picks.json").read_text())
meta_path = ROOT / "src" / "photos.json"
meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
meta = {k: v for k, v in meta.items() if k in picks}
for key in (sys.argv[1:] or list(picks)):
    p = picks[key]
    if (OUT / f"s19-{key}-1600.jpg").exists() and key in meta and not sys.argv[1:]:
        meta[key]["alt"] = p["alt"]; meta[key]["credit"] = p.get("credit", meta[key]["credit"]); continue
    first = info(p["title"], 400)
    W = int(min(first["w"], max(1600, math.ceil(1200 * first["w"] / first["h"])), 2400))
    m = info(p["title"], W)
    im = Image.open(io.BytesIO(get(m["url"], raw=True))).convert("RGB")
    for cap in (1600, 800):
        c = im.copy(); c.thumbnail((cap if c.width >= c.height else 10_000, cap if c.height > c.width else 10_000))
        if max(c.size) > cap: c.thumbnail((cap, cap))
        c.save(OUT / f"s19-{key}-{cap}.jpg", quality=84, optimize=True, progressive=True)
    meta[key] = {"credit": p.get("credit", m["credit"])[:140], "licence": m["licence"], "licenceUrl": m["licenceUrl"], "page": m["page"], "source": "Wikimedia Commons",
                 "w": im.width, "h": im.height, "alt": p["alt"]}
    print(key, im.size, m["licence"], m["credit"][:40], flush=True)
    time.sleep(0.5)
meta_path.write_text(json.dumps(meta, indent=1, ensure_ascii=False))
