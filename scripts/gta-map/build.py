"""
Builds the intro's map of the Greater Toronto Area and its five pictures.

    python3 scripts/gta-map/build.py

Needs Python 3 with shapely and Pillow, and Node (mapshaper is run through
npx). Writes src/content/gta-map.ts and public/images/intro/*.webp.

Boundaries: Statistics Canada, 2021 Census cartographic boundary file for
census divisions (layer lcd_000b21s_e of its ArcGIS map service), Open
Government Licence - Canada. The five census divisions are the City of
Toronto (3520) and the regional municipalities of Durham (3518), York
(3519), Peel (3521) and Halton (3524). The cartographic file follows the
Lake Ontario shoreline. The data is kept in Statistics Canada's own Lambert
conformal conic projection (EPSG:3347), north up, and simplified with
mapshaper (Douglas-Peucker, 3.5 km) to a few dozen straight lines, so the
regions read as clean geometric shapes while neighbouring regions keep
sharing exactly the same edge. Islands are dropped, and so are the narrow
spikes the shoreline leaves (the harbour spits), where no other region
shares the corner.

Pictures: each region's picture is cropped from a client rendering to the
region's bounding box, so the house sits as near the middle of the region
as the picture allows. Which rendering goes with which region is a mood
pairing, not a claim that the house is there.
"""

import io
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse

from PIL import Image, ImageCms, ImageEnhance
from shapely.geometry import LineString, Polygon, shape
from shapely.ops import polylabel

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SERVICE = "https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/4/query"
CDUIDS = ["3518", "3519", "3520", "3521", "3524"]
# Simplification tolerance in metres (the map is about 137 km across, drawn 1000 units wide).
INTERVAL_M = 3500
# A corner sharper than this, on the shoreline only, is a spike and is cut.
SPIKE_DEG = 35
WIDTH = 1000

# Reveal order, and each region's picture: the source rendering, the point in
# it to centre on (fractions of its width and height), and how far to zoom
# in past the smallest crop that covers the region.
REGIONS = [
    ("halton", "Halton", "classical-house-dusk", (0.5, 0.52), 1.0),
    ("peel", "Peel", "contemporary-house-dusk", (0.52, 0.5), 1.0),
    ("york", "York", "stone-house", (0.48, 0.6), 1.15),
    ("toronto", "Toronto", "narrow-contemporary-house", (0.5, 0.52), 1.0),
    ("durham", "Durham", "farmhouse-bungalow", (0.58, 0.68), 1.35),
]
# Three widths per picture: phones, larger screens, and the full resolution
# of the crop (capped) for high-density and 4K screens. Never upscaled.
SIZES = [(560, 70), (1100, 74), (2000, 76)]


def fetch():
    query = urllib.parse.urlencode({
        "where": "CDUID IN (%s)" % ",".join("'%s'" % c for c in CDUIDS),
        "outFields": "*",
        "outSR": "3347",
        "f": "geojson",
    })
    return subprocess.run(["curl", "-sSf", "--retry", "3", SERVICE + "?" + query], check=True, capture_output=True).stdout


def mapshaper(src, *args):
    subprocess.run(["npx", "--yes", "mapshaper@0.6.121", src, *args], check=True, capture_output=True)


def dedupe(points):
    out = []
    for p in points:
        if not out or out[-1] != p:
            out.append(p)
    return out


def num(v, digits):
    text = f"{v:.{digits}f}".rstrip("0").rstrip(".")
    return "0" if text in ("", "-0") else text


def path(points, close, digits=1):
    return "M" + " ".join(f"{num(x, digits)} {num(y, digits)}" for x, y in points) + ("Z" if close else "")


def srgb(img):
    profile = img.info.get("icc_profile")
    if profile:
        src = ImageCms.ImageCmsProfile(io.BytesIO(profile))
        img = ImageCms.profileToProfile(img, src, ImageCms.createProfile("sRGB"), outputMode="RGB")
    return img.convert("RGB")


def main():
    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, "cd.geojson")
        with open(raw, "wb") as f:
            f.write(fetch())
        simp, inner, outer = (os.path.join(tmp, n) for n in ("simp.json", "inner.json", "outer.json"))
        mapshaper(raw, "-filter-islands", "min-area=10000000", "-simplify", "dp", "planar", f"interval={INTERVAL_M}", "keep-shapes", "-clean", "-o", simp, "format=geojson", "force")
        with open(simp) as f:
            cleaned = despike(json.load(f))
        with open(simp, "w") as f:
            json.dump(cleaned, f)
        mapshaper(simp, "-innerlines", "-o", inner, "format=geojson", "force")
        mapshaper(simp, "-dissolve", "-lines", "-o", outer, "format=geojson", "force")
        simp, inner, outer = (json.load(open(p)) for p in (simp, inner, outer))

    bounds = [shape(f["geometry"]).bounds for f in simp["features"]]
    x0, y0 = min(b[0] for b in bounds), min(b[1] for b in bounds)
    x1, y1 = max(b[2] for b in bounds), max(b[3] for b in bounds)
    scale = WIDTH / (x1 - x0)
    height = round((y1 - y0) * scale, 1)

    def pt(c):
        return (round((c[0] - x0) * scale, 1), round((y1 - c[1]) * scale, 1))

    # Regions: a clip path in the units of the region's own box (objectBoundingBox).
    by_name = {f["properties"]["CDNAME"]: f["geometry"] for f in simp["features"]}
    regions = []
    for key, name, picture, focus, zoom in REGIONS:
        geom = by_name[name]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        rings = [dedupe([pt(c) for c in p[0]]) for p in polys]
        xs = [x for r in rings for x, _ in r]
        ys = [y for r in rings for _, y in r]
        bx, by, bw, bh = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
        main_ring = max((Polygon(r) for r in rings), key=lambda p: p.area)
        label = polylabel(main_ring, tolerance=0.5)
        clip = "".join(path([((x - bx) / bw, (y - by) / bh) for x, y in r[:-1]], True, 4) for r in rings)
        regions.append(dict(key=key, picture=picture, box=[round(bx, 1), round(by, 1), round(bw, 1), round(bh, 1)], centre=[round(label.x, 1), round(label.y, 1)], clip=clip, focus=focus, zoom=zoom))

    # The outline: the outer edge as one stroke, starting at the south-west
    # tip and running up the lakeshore first, then any island kept.
    rings = []
    for f in outer["features"]:
        g = f["geometry"]
        for line in g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]:
            if len(line) > 3 and Polygon(line).area > 1e6:
                rings.append(dedupe([pt(c) for c in line]))
    rings.sort(key=lambda r: -Polygon(r).area)
    edge = rings[0][:-1] if rings[0][0] == rings[0][-1] else rings[0]
    start = max(range(len(edge)), key=lambda i: edge[i][1] - 0.3 * edge[i][0])
    edge = edge[start:] + edge[:start]
    if edge[-3][0] > edge[3][0]:
        edge = [edge[0]] + edge[1:][::-1]
    outline = [path(edge + [edge[0]], False)] + [path(r, True) for r in rings[1:]]

    # The boundaries between regions, each drawn from its lakeward end.
    borders = []
    for g in inner["geometries"]:
        line = dedupe([pt(c) for c in g["coordinates"]])
        if line[0][1] < line[-1][1]:
            line = line[::-1]
        borders.append(path(line, False))

    write_pictures(regions)
    write_module(height, regions, outline, borders)


def despike(collection):
    """Cuts shoreline corners sharper than SPIKE_DEG; a corner two regions share is never touched."""
    import math

    def rings(g):
        return [r for p in (g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]) for r in p]

    use = {}
    for f in collection["features"]:
        for r in rings(f["geometry"]):
            for c in set(map(tuple, r)):
                use[c] = use.get(c, 0) + 1

    def angle(a, b, c):
        v1 = (a[0] - b[0], a[1] - b[1])
        v2 = (c[0] - b[0], c[1] - b[1])
        cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (math.hypot(*v1) * math.hypot(*v2))
        return math.degrees(math.acos(max(-1, min(1, cos))))

    for f in collection["features"]:
        for r in rings(f["geometry"]):
            changed = True
            while changed and len(r) > 5:
                changed = False
                pts = r[:-1]
                for i in range(len(pts)):
                    a, b, c = pts[i - 1], pts[i], pts[(i + 1) % len(pts)]
                    if use[tuple(b)] == 1 and angle(a, b, c) < SPIKE_DEG:
                        del pts[i]
                        r[:] = pts + [pts[0]]
                        changed = True
                        break
    return collection


def grade(img):
    """One quiet grade for all five, so daylight and dusk renderings sit together on the charcoal."""
    img = ImageEnhance.Color(img).enhance(0.78)
    img = ImageEnhance.Brightness(img).enhance(0.86)
    return ImageEnhance.Contrast(img).enhance(1.05)


def write_pictures(regions):
    out = os.path.join(ROOT, "public", "images", "intro")
    os.makedirs(out, exist_ok=True)
    for r in regions:
        img = srgb(Image.open(os.path.join(ROOT, "public", "images", "projects", r["picture"] + ".jpg")))
        iw, ih = img.size
        _, _, bw, bh = r["box"]
        aspect = bw / bh
        if iw / ih > aspect:
            ch = ih / r["zoom"]
            cw = ch * aspect
        else:
            cw = iw / r["zoom"]
            ch = cw / aspect
        # The picture's focus lands on the region's centre, as far as the picture reaches.
        lx = (r["centre"][0] - r["box"][0]) / bw
        ly = (r["centre"][1] - r["box"][1]) / bh
        left = min(max(r["focus"][0] * iw - lx * cw, 0), iw - cw)
        top = min(max(r["focus"][1] * ih - ly * ch, 0), ih - ch)
        crop = grade(img.crop((round(left), round(top), round(left + cw), round(top + ch))))
        r["sizes"] = []
        for width, quality in SIZES:
            # The long edge, never past the crop's own pixels.
            long_edge = min(width, round(max(cw, ch)))
            w = long_edge if aspect >= 1 else round(long_edge * aspect)
            h = round(w / aspect)
            name = f"{r['picture']}-{w}.webp"
            crop.resize((w, h), Image.LANCZOS).save(os.path.join(out, name), "WEBP", quality=quality, method=6)
            r["sizes"].append((f"/images/intro/{name}", w, h))


def write_module(height, regions, outline, borders):
    lines = [
        "/**",
        " * The Greater Toronto Area for the intro (Preloader.tsx), as SVG path data",
        f" * in a {WIDTH}×{num(height, 1)} box, north up. Generated by scripts/gta-map/build.py: do",
        " * not edit by hand.",
        " *",
        " * Boundaries: Statistics Canada, 2021 Census cartographic boundary file,",
        " * census divisions (Durham 3518, York 3519, Toronto 3520, Peel 3521,",
        " * Halton 3524), Open Government Licence - Canada. Simplified with",
        " * mapshaper to straight lines (3.5 km), keeping shared edges shared; islands and shoreline spikes dropped.",
        " */",
        "",
        "export interface GtaRegion {",
        "  key: \"halton\" | \"peel\" | \"york\" | \"toronto\" | \"durham\";",
        "  /** The region's bounding box in map units: x, y, width, height. */",
        "  box: [number, number, number, number];",
        "  /** The point deepest inside the region, in map units: where its house is centred. */",
        "  centre: [number, number];",
        "  /** The region's shape in the units of its own box (clipPathUnits=objectBoundingBox). */",
        "  clip: string;",
        "  /** The region's picture, cropped to its box, at three widths: phones, larger screens, and full resolution for high-density and 4K screens. */",
        "  picture: { small: string; medium: string; full: string; width: number; height: number };",
        "}",
        "",
        f"export const GTA_WIDTH = {WIDTH};",
        f"export const GTA_HEIGHT = {num(height, 1)};",
        "",
        "/** The outer edge: the mainland as one stroke from the south-west tip, up the lakeshore first; then any island kept. */",
        f"export const GTA_OUTLINE = {json.dumps(outline, indent=2)};",
        "",
        "/** The boundaries between the five regions, each from its lakeward end. */",
        f"export const GTA_BORDERS = {json.dumps(borders, indent=2)};",
        "",
        "/** In reveal order, west to east. */",
        "export const GTA_REGIONS: GtaRegion[] = [",
    ]
    for r in regions:
        small, medium, full = r["sizes"]
        lines += [
            "  {",
            f'    key: "{r["key"]}",',
            f"    box: {json.dumps(r['box'])},",
            f"    centre: {json.dumps(r['centre'])},",
            f'    clip: "{r["clip"]}",',
            f'    picture: {{ small: "{small[0]}", medium: "{medium[0]}", full: "{full[0]}", width: {full[1]}, height: {full[2]} }},',
            "  },",
        ]
    lines += ["];", ""]
    with open(os.path.join(ROOT, "src", "content", "gta-map.ts"), "w") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    sys.exit(main())
