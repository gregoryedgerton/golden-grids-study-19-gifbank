#!/usr/bin/env python3
"""Search Wikimedia Commons for photographs of each piece and lay the candidates out.

    python3 captures/hunt.py [key ...]

Reads captures/pieces.json (key -> list of search phrases). For each piece it
keeps the files under an open licence (CC BY, CC BY-SA, CC0, public domain)
whose short side is at least 900px, writes captures/find/<key>.json, and
draws captures/find/sheet-<n>.jpg, four pieces to a sheet, eight candidates
to a row, each numbered, so the choice is made by eye. Nothing here ships.
"""
import sys, json, re, html, io, time, urllib.parse, urllib.request, concurrent.futures as cf
from pathlib import Path
from PIL import Image, ImageDraw

UA = {"User-Agent": "golden-grids-study/1.0 (https://github.com/gregoryedgerton; layout study photo research)"}
HERE = Path(__file__).parent / "find"
OPEN = re.compile(r"^(CC BY(-SA)? ?\d|CC0|Public domain|PD|No restrictions)", re.I)

def get(url, raw=False):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                b = r.read()
            return b if raw else json.loads(b)
        except Exception as e:
            if "429" in str(e): time.sleep(4 * (attempt + 1)); continue
            if attempt == 3: raise
            time.sleep(1)

def strip(s): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()

def search(q, n=30):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrsearch": f"filetype:bitmap {q}", "gsrnamespace": 6, "gsrlimit": n,
        "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": 400})
    pages = sorted(get(u).get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    out = []
    for p in pages:
        ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
        out.append({"title": p["title"][5:], "credit": strip(m.get("Artist", {}).get("value", ""))[:90],
                    "licence": strip(m.get("LicenseShortName", {}).get("value", "")), "page": ii["descriptionurl"],
                    "thumb": ii.get("thumburl"), "w": ii["width"], "h": ii["height"],
                    "desc": strip(m.get("ImageDescription", {}).get("value", ""))[:200]})
    return out

def candidates(phrases):
    seen, keep = set(), []
    for q in phrases:
        for it in search(q):
            if it["title"] in seen: continue
            seen.add(it["title"])
            if not OPEN.match(it["licence"]) or min(it["w"], it["h"]) < 900: continue
            if re.search(r"logo|linkedin|poster|stamp|drawing|patent|\.svg|plan\b|diagram|screenshot|still from|trailer|tarantino", it["title"], re.I): continue
            keep.append(it)
    return keep[:8]

def thumb(it):
    try: return Image.open(io.BytesIO(get(it["thumb"], raw=True))).convert("RGB")
    except Exception: return None

def sheet(n, rows):
    cw, ch = 210, 170
    S = Image.new("RGB", (8 * cw + 160, len(rows) * (ch + 20)), "white"); d = ImageDraw.Draw(S)
    for r, (key, items) in enumerate(rows):
        y = r * (ch + 20)
        d.text((4, y + 70), key[:22], fill="black")
        with cf.ThreadPoolExecutor(4) as ex: imgs = list(ex.map(thumb, items))
        for i, (it, im) in enumerate(zip(items, imgs)):
            x = 160 + i * cw
            if im: im.thumbnail((cw - 6, ch)); S.paste(im, (x, y))
            d.text((x + 2, y + ch + 3), f"{i} {it['licence'][:10]} {min(it['w'], it['h'])}".encode("ascii", "ignore").decode(), fill="black")
    S.save(HERE / f"sheet-{n}.jpg", quality=82)

if __name__ == "__main__":
    pieces = json.loads((Path(__file__).parent / "pieces.json").read_text())
    keys = sys.argv[1:] or list(pieces)
    HERE.mkdir(exist_ok=True)
    rows = []
    for k in keys:
        items = candidates(pieces[k]["q"])
        (HERE / f"{k}.json").write_text(json.dumps(items, indent=1))
        rows.append((k, items)); print(k, len(items), flush=True)
    for i in range(0, len(rows), 4): sheet(i // 4, rows[i:i + 4])
