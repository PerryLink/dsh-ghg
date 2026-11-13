#!/usr/bin/env python3
"""Generate README visuals for dsh-ghg (docs/assets/).

Outputs (idempotent overwrite):
  dsh-ghg-hero-{zh,en}-{light,dark}.webp   1440x576 raster hero (Pillow)
  dsh-ghg-flow-v5-{light,dark}.svg         1100x660 hand-written SVG

Design notes
------------
* Hero: the left column is prose (kicker / title / two value lines / one
  subtitle / one meta line / footer). The right column is this repository's
  own semantic figure: a twelve-month electricity ledger strip above the
  kWh x factor / 1000 = tCO2e equation plate. Every bar is one month of the
  checked-in synthetic 2026 bill
  (samples/quickstart/input/electricity-2026.csv: 120,000 ... 115,000 kWh,
  sum 1,410,000 kWh, mean 117,500 kWh); the plate is the real formula
  kWh x 0.5703 / 1000 = tCO2e; the result is the real golden value 804.123
  tCO2e; the chips name the two real artefacts (3-sheet workpaper, 4-sheet
  partial ESRS E1 pack) and the real zero-diff verification (12/12, diff 0).
  Nothing is invented.
* Flow: a "monthly close ledger board" grammar, not a row of boxes. Twelve
  ledger rows (one per 2026 month, real kWh and real per-line tCO2e) close
  into a total row; a highlighted tCO2e column carries the multiplication;
  a state-gate card states the real rule (recalc = kWh x factor / 1000, only a
  <=1e-9 diff flips calculated -> verified, mismatch keeps line_id and raises
  E_GHG_RECALC_MISMATCH); an export stack names the 3-sheet workpaper, the
  4-sheet partial ESRS E1 pack and the Scope-2-only CSV for period 2026-12;
  two boundary rails close the board (local write boundary / read-only
  coverage + Scope 3 meters). Labels are tool/field/file names plus short
  structural phrases, so all five README languages share the pair.

Run once:  python scripts/gen-readme-assets.py
Requires:  Python 3.10+ with Pillow; Windows fonts msyh.ttc / msyhbd.ttc /
           consola.ttf / segoeui.ttf / segoeuib.ttf.
"""
from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

FONT_CJK = r"C:\Windows\Fonts\msyh.ttc"
FONT_CJK_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"
FONT_EN = r"C:\Windows\Fonts\segoeui.ttf"
FONT_EN_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"

for _path in (FONT_CJK, FONT_CJK_BOLD, FONT_MONO, FONT_EN, FONT_EN_BOLD):
    if not os.path.exists(_path):
        raise SystemExit(f"FATAL: font missing: {_path}")

WARNINGS: list[str] = []

# --------------------------------------------------------------- fixture data
# samples/quickstart/input/electricity-2026.csv (synthetic, not a real meter)
MONTH_KWH = [120000, 110000, 98000, 95000, 102000, 135000,
             148000, 152000, 128000, 108000, 99000, 115000]
FACTOR = 0.5703
TOTAL_KWH = sum(MONTH_KWH)
TOTAL_TCO2E = round(sum(round(kwh * FACTOR / 1000, 6) for kwh in MONTH_KWH), 6)
MEAN_KWH = TOTAL_KWH // 12
MONTH_TCO2E = [round(kwh * FACTOR / 1000, 6) for kwh in MONTH_KWH]

# These must match samples/quickstart/expected/result.json; fail loud otherwise.
assert TOTAL_KWH == 1_410_000, TOTAL_KWH
assert MEAN_KWH == 117_500, MEAN_KWH
assert TOTAL_TCO2E == 804.123, TOTAL_TCO2E
assert MONTH_TCO2E[-1] == 65.5845, MONTH_TCO2E[-1]


def short_number(value: float) -> str:
    text = f"{value:.6f}".rstrip("0").rstrip(".")
    return text


SKIN = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8", card="#ffffff",
        card_edge="#e4e1ee", zone="#f7f4fc", zone_edge="#e5e0f1",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", good="#16a34a", warn="#c2410c",
        pill="#ece7f9", track="#eae6f3", grid="#e7e4f0",
        good_bg="#e9f6ee", warn_bg="#fdf0e7", shadow=(32, 26, 64),
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016", card="#1b2231",
        card_edge="#2e374b", zone="#171e2d", zone_edge="#2b3448",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", good="#3fb950", warn="#e0a85a",
        pill="#242d42", track="#243049", grid="#1e2636",
        good_bg="#16301f", warn_bg="#35271b", shadow=(0, 0, 0),
    ),
}

HERO = {
    "zh": dict(
        kicker="DeepSeek Harness · 范围二核算插件",
        title="dsh-ghg",
        value=["全年电费，逐行算成范围二", "复算到零差异，再交底稿与 ESRS 包"],
        sub="CSV / 文本 PDF → 本地折算 → 3+4 表工作簿",
        meta="R0 只读 / R1 本地写 · 无网络 · 不调模型",
        foot="Apache-2.0 · PerryLink DSH plugin family",
        foot2="13 个 ghg_* 工具 · storage domain ghg v1 · v0.2.0",
        card_kicker="SCOPE 2 · LOCATION-BASED",
        card_meta="CN-SUZ-01 · 2026",
        card_title="12 期电费，逐行折算",
        covered="12/12 covered",
        chart_note="kWh / 月 · 虚线 = 年均 117,500",
        chart_total="Σ 1,410,000 kWh · 12 行 · 缺失 0",
        numerator="1,410,000 kWh × 0.5703 kgCO2e/kWh",
        denominator="1,000",
        factor_note="kgCO2e/kWh · electricity-location-cn-2022-v1 · 公开参考",
        result_unit="tCO2e",
        result_lines="12 行明细",
        verify="verify 12/12 · diff 0",
        tab1="底稿 3 sheet",
        tab2="ESRS E1 包 4 sheet",
        file_line="CN-SUZ-01-2026-12.xlsx · esrs-e1-pack-2026-12.xlsx",
        foot_line="exports/ · 原文件只读 · 无网络",
    ),
    "en": dict(
        kicker="DeepSeek Harness · Scope 2 accounting plugin",
        title="dsh-ghg",
        value=["Bills → Scope 2, row by row",
               "Zero-diff recalc, workpaper + ESRS pack"],
        sub="CSV / text PDF → local calc → 3 + 4 sheet xlsx",
        meta="R0 read-only / R1 local write · no network · no model",
        foot="Apache-2.0 · PerryLink DSH plugin family",
        foot2="13 ghg_* tools · storage domain ghg v1 · v0.2.0",
        card_kicker="SCOPE 2 · LOCATION-BASED",
        card_meta="CN-SUZ-01 · 2026",
        card_title="12 monthly bills, line by line",
        covered="12/12 covered",
        chart_note="kWh / month · dashed = yearly avg 117,500",
        chart_total="Σ 1,410,000 kWh · 12 rows · missing 0",
        numerator="1,410,000 kWh × 0.5703 kgCO2e/kWh",
        denominator="1,000",
        factor_note="kgCO2e/kWh · electricity-location-cn-2022-v1 · public reference",
        result_unit="tCO2e",
        result_lines="12 lines",
        verify="verify 12/12 · diff 0",
        tab1="workpaper 3 sheets",
        tab2="ESRS E1 pack 4 sheets",
        file_line="CN-SUZ-01-2026-12.xlsx · esrs-e1-pack-2026-12.xlsx",
        foot_line="exports/ · originals untouched · no network",
    ),
}


def font(size, kind="cjk"):
    return ImageFont.truetype(
        {"cjk": FONT_CJK, "cjk_bold": FONT_CJK_BOLD, "mono": FONT_MONO,
         "en": FONT_EN, "en_bold": FONT_EN_BOLD}[kind], max(8, int(size)))


def hx(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w, h, c1, c2):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = 0.25 * (y / h) + 0.75 * (y / h) ** 1.6
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(hx(c1), hx(c2))))
    return img


def glow(img, cx, cy, r, color, alpha=40):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(10, 0, -1):
        rr = r * i / 10
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 11)),))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def card(img, box, skin, radius=22, shadow=26):
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i in range(shadow, 0, -3):
        sd.rounded_rectangle([x0 - i // 5, y0 + i // 2, x1 + i // 5, y1 + i],
                             radius=radius + i // 5,
                             fill=skin["shadow"] + (int(7 * (1 - i / shadow)),))
    base = Image.alpha_composite(
        img.convert("RGBA"), sh.filter(ImageFilter.GaussianBlur(13)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(skin["card"]),
                        outline=hx(skin["card_edge"]), width=2)
    return base.convert("RGB")


def fit(d, text, kind, max_w, size, min_size=14):
    size = int(size)
    while size > min_size:
        if d.textlength(text, font=font(size, kind)) <= max_w:
            return size
        size -= 2
    return max(min_size, size)


def write(img, xy, text, skin, size, kind="cjk", color="text",
          max_w=None, min_size=14, tag="", anchor=None):
    d = ImageDraw.Draw(img)
    if max_w is not None:
        size = fit(d, text, kind, max_w, size, min_size)
        if d.textlength(text, font=font(size, kind)) > max_w:
            WARNINGS.append(f"{tag}: {text!r} exceeds {max_w}px at {size}px")
    d.text(xy, text, font=font(size, kind), fill=hx(skin[color]), anchor=anchor)
    return size


def pill(img, xy, text, skin, size=19, kind="cjk_bold",
         fg="accent", bg="pill", pad_x=18, pad_y=10):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + pad_y * 2
    d.rounded_rectangle([x, y, x + tw + pad_x * 2, y + h], radius=h // 2,
                        fill=hx(skin[bg]))
    d.text((x + pad_x, y + pad_y - 1), text, font=f, fill=hx(skin[fg]))
    return img, x + tw + pad_x * 2


def chip(img, xy, text, skin, size=15, kind="mono", fg="accent", bg="pill",
         pad_x=15, pad_y=7):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + pad_y * 2
    d.rounded_rectangle([x, y, x + tw + pad_x * 2, y + h], radius=h // 2,
                        fill=hx(skin[bg]))
    d.text((x + pad_x, y + pad_y - 1), text, font=f, fill=hx(skin[fg]))
    return img, x + tw + pad_x * 2


def chip_right(img, x_right, y, text, skin, size=15, kind="mono",
               fg="accent", bg="pill", pad_x=15, pad_y=7):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x = x_right - tw - pad_x * 2
    h = size + pad_y * 2
    d.rounded_rectangle([x, y, x_right, y + h], radius=h // 2,
                        fill=hx(skin[bg]))
    d.text((x + pad_x, y + pad_y - 1), text, font=f, fill=hx(skin[fg]))
    return img, x


def dashed_hline(d, x0, x1, y, color, dash=7, gap=6, width=2):
    x = x0
    while x < x1:
        d.line([x, y, min(x + dash, x1), y], fill=color, width=width)
        x += dash + gap


def hero(lang, skin_name):
    s = SKIN[skin_name]
    m = HERO[lang]
    w, h = 1440, 576
    img = gradient(w, h, s["bg_from"], s["bg_to"])
    img = glow(img, 1210, 34, 430, hx(s["accent"]),
               20 if skin_name == "light" else 38)
    img = glow(img, 120, 570, 300, hx(s["accent"]),
               8 if skin_name == "light" else 14)

    # ------------------------------------------------------------- left copy
    img, _ = pill(img, (60, 54), m["kicker"], s,
                  size=20 if lang == "zh" else 18,
                  kind="cjk_bold" if lang == "zh" else "en_bold")

    d = ImageDraw.Draw(img)
    tsize = fit(d, m["title"], "mono", 560, 84, 64)
    d.text((60, 112), m["title"], font=font(tsize, "mono"), fill=hx(s["text"]))
    if tsize * 880 / 1440 < 48:
        WARNINGS.append(f"hero.{lang}.title below 48px displayed")

    vkind = "cjk_bold" if lang == "zh" else "en_bold"
    vsize = 34 if lang == "zh" else 30
    for line in m["value"]:
        vsize = min(vsize, fit(d, line, vkind, 582, vsize, 24))
    for i, line in enumerate(m["value"]):
        write(img, (60, 240 + i * (vsize + 18)), line, s, vsize, vkind,
              "text", 582, 24, f"hero.{lang}.value{i}")

    sub_size = write(img, (60, 366), m["sub"], s, 26,
                     "cjk" if lang == "zh" else "en", "sub", 582, 22,
                     f"hero.{lang}.sub")
    if sub_size * 880 / 1440 < 15:
        WARNINGS.append(f"hero.{lang}.sub below 15px displayed")

    meta_size = write(img, (60, 420), m["meta"], s, 20,
                      "cjk" if lang == "zh" else "en", "sub", 582, 17,
                      f"hero.{lang}.meta")
    if meta_size * 880 / 1440 < 12:
        WARNINGS.append(f"hero.{lang}.meta below 12px displayed")

    d = ImageDraw.Draw(img)
    d.line([60, 458, 640, 458], fill=hx(s["grid"]), width=2)
    write(img, (60, 472), m["foot"], s, 17, "en", "faint", 580, 14,
          f"hero.{lang}.foot")
    write(img, (60, 496), m["foot2"], s, 14, "cjk", "faint", 580, 12,
          f"hero.{lang}.foot2")

    # --------------------------------------------------- ledger + equation
    img = card(img, (652, 44, 1392, 552), s, radius=22)
    d = ImageDraw.Draw(img)
    write(img, (678, 66), m["card_kicker"], s, 17, "mono", "accent", 470, 13,
          f"hero.{lang}.card_kicker")
    d.text((1366, 66), m["card_meta"], font=font(17, "mono"),
           fill=hx(s["faint"]), anchor="ra")

    write(img, (678, 92), m["card_title"], s, 28,
          "cjk_bold" if lang == "zh" else "en_bold", "text", 540, 21,
          f"hero.{lang}.card_title")
    img, _ = chip_right(img, 1366, 92, m["covered"], s, 15, "mono",
                        "good", "good_bg")

    # twelve months of the checked-in synthetic bill, one bar per month
    write(img, (678, 138), m["chart_note"], s, 14,
          "cjk" if lang == "zh" else "en", "faint", 500, 11,
          f"hero.{lang}.chart_note")
    chart_x0, chart_x1 = 678, 1366
    baseline, max_h = 276, 120
    slot = (chart_x1 - chart_x0) / 12
    bar_w = 30
    d = ImageDraw.Draw(img)
    for i, kwh in enumerate(MONTH_KWH):
        bh = round(kwh / max(MONTH_KWH) * max_h)
        x = chart_x0 + i * slot + (slot - bar_w) / 2
        y = baseline - bh
        d.rounded_rectangle([x, y, x + bar_w, y + 18], radius=7,
                            fill=hx(s["accent"]))
        d.rectangle([x, y + 9, x + bar_w, baseline], fill=hx(s["accent"]))
        d.text((x + bar_w / 2, 284), f"{i + 1:02d}", font=font(14, "mono"),
               fill=hx(s["faint"]), anchor="ma")
    avg_y = baseline - round(MEAN_KWH / max(MONTH_KWH) * max_h)
    dashed_hline(d, chart_x0, chart_x1, avg_y, hx(s["faint"]),
                 dash=5, gap=7, width=1)
    write(img, (678, 310), m["chart_total"], s, 15,
          "cjk" if lang == "zh" else "en", "sub", 660, 12,
          f"hero.{lang}.chart_total")

    d = ImageDraw.Draw(img)
    d.line([678, 338, 1366, 338], fill=hx(s["grid"]), width=2)

    # equation strip: total kWh x factor / 1000 = tCO2e (all fixture numbers)
    eq_y, eq_h = 350, 44
    token_kind = "mono"
    token_size = 18
    op_size = 20
    pad_x = 14
    tokens = ["1,410,000 kWh", "0.5703", "1,000"]
    ops = ["×", "÷", "="]
    token_w = [int(round(d.textlength(tok, font=font(token_size, token_kind))
                         + pad_x * 2)) for tok in tokens]
    op_w = [d.textlength(op, font=font(op_size if i < 2 else 22, "mono"))
            for i, op in enumerate(ops)]
    result_num = f"{TOTAL_TCO2E:.3f}"
    res_size, unit_size = 34, 17
    res_w = d.textlength(result_num, font=font(res_size, "mono"))
    unit_w = d.textlength(m["result_unit"], font=font(unit_size, "mono"))
    result_w = res_w + 8 + unit_w
    widths = [token_w[0], op_w[0], token_w[1], op_w[1],
              token_w[2], op_w[2], result_w]
    gap = (688 - sum(widths)) / 6
    if gap < 6:
        WARNINGS.append(f"hero.{lang}: equation gap {gap:.1f}px")

    x = 678
    for index, width in enumerate(widths):
        xi = int(round(x))
        if index in (0, 2, 4):
            tok = tokens[index // 2]
            d.rounded_rectangle([xi, eq_y, xi + token_w[index // 2],
                                 eq_y + eq_h], radius=12,
                                fill=hx(s["zone"]),
                                outline=hx(s["zone_edge"]), width=1)
            d.text((xi + token_w[index // 2] / 2, eq_y + 12), tok,
                   font=font(token_size, token_kind), fill=hx(s["text"]),
                   anchor="ma")
        elif index in (1, 3, 5):
            op = ops[index // 2]
            d.text((xi, eq_y + 13), op,
                   font=font(op_size if index < 5 else 22, "mono"),
                   fill=hx(s["faint"] if index < 5 else s["sub"]))
        else:
            d.text((xi, eq_y - 2), result_num, font=font(res_size, "mono"),
                   fill=hx(s["accent"]))
            d.text((xi + res_w + 8, eq_y + 16), m["result_unit"],
                   font=font(unit_size, "mono"), fill=hx(s["sub"]))
        x += width + gap

    write(img, (678, 410), m["factor_note"], s, 13.5,
          "cjk" if lang == "zh" else "en", "faint", 688, 11,
          f"hero.{lang}.factor_note")

    img, _ = chip(img, (678, 432), m["verify"], s, 15, "mono",
                  "good", "good_bg")

    d = ImageDraw.Draw(img)
    d.line([678, 468, 1366, 468], fill=hx(s["grid"]), width=2)

    tab_y = 476
    tab_kind = "cjk" if lang == "zh" else "mono"
    img, tx = chip(img, (678, tab_y), m["tab1"], s, 14.5, tab_kind,
                   "accent", "pill")
    img, tx = chip(img, (tx + 12, tab_y), m["tab2"], s, 14.5, tab_kind,
                   "accent", "pill")
    if tx > 1366:
        WARNINGS.append(f"hero.{lang}: artefact tabs overflow to {tx}px")

    write(img, (678, 506), m["file_line"], s, 13.5, "mono", "faint", 688, 11,
          f"hero.{lang}.file_line")
    write(img, (678, 524), m["foot_line"], s, 12.5,
          "cjk" if lang == "zh" else "en", "faint", 688, 10,
          f"hero.{lang}.foot_line")

    path = os.path.join(OUT, f"dsh-ghg-hero-{lang}-{skin_name}.webp")
    img.save(path, "WEBP", quality=92, method=6)
    print(f"wrote dsh-ghg-hero-{lang}-{skin_name}.webp")


# --------------------------------------------------------------- flow (SVG)
FLOW = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8", card="#ffffff",
        edge="#e4e1ee", zone="#f5f2fb", zone_edge="#e3def1",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", good="#16a34a", warn="#c2410c",
        pill="#ece7f9", track="#eae6f3", grid="#e7e4f0", dot="#d9d3ea",
        colband="#4B67B4",
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016", card="#1b2231",
        edge="#2e374b", zone="#171e2d", zone_edge="#2b3448",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", good="#3fb950", warn="#d9a03c",
        pill="#242d42", track="#243049", grid="#1e2636", dot="#26314a",
        colband="#8496f5",
    ),
}

MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
SANS = ("ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', "
        "sans-serif")


def esc(text):
    return (text.replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;"))


def flow_svg(skin_name):
    s = FLOW[skin_name]
    p: list[str] = []
    shadow_op = "0.10" if skin_name == "light" else "0.55"
    shadow_col = "#1b1735" if skin_name == "light" else "#000000"

    def t(x, y, text, size, color="text", family=MONO, weight=400,
          anchor="start", opacity=None, spacing=None):
        extra = f' opacity="{opacity}"' if opacity else ""
        extra += f' letter-spacing="{spacing}"' if spacing else ""
        p.append(
            f'<text x="{x}" y="{y}" fill="{s[color]}" font-family="{family}" '
            f'font-size="{size}" font-weight="{weight}" '
            f'text-anchor="{anchor}"{extra}>{esc(text)}</text>')

    def box(x, y, w, h, fill="card", stroke="edge", r=18, sw=1.5, extra=""):
        p.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
            f'fill="{s[fill]}" stroke="{s[stroke]}" stroke-width="{sw}"{extra}/>')

    def line(x1, y1, x2, y2, color="grid", width=1.5, dash=None, opacity=None):
        extra = f' stroke-dasharray="{dash}"' if dash else ""
        extra += f' opacity="{opacity}"' if opacity else ""
        p.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{s[color]}" stroke-width="{width}"{extra}/>')

    def chip(x, y, w, h, label, fg="accent", bg="pill", size=13.5,
             family=MONO):
        p.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" '
            f'fill="{s[bg]}"/>')
        t(x + w / 2, y + h / 2 + size * 0.36, label, size, fg, family,
          anchor="middle")

    p.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="660" '
        f'viewBox="0 0 1100 660" role="img" aria-label="dsh-ghg structure: a '
        f'twelve-row monthly close ledger (one 2026 month per row, real kWh '
        f'and real per-line tCO2e); the tCO2e column is kWh times the public '
        f'factor 0.5703 divided by 1000; a state gate turns calculated lines '
        f'into verified only when the recalculation diff is at most 1e-9, and '
        f'a mismatch keeps the line id and raises E_GHG_RECALC_MISMATCH; '
        f'exports for period 2026-12 are a 3-sheet workpaper, a 4-sheet '
        f'partial ESRS E1 pack and a Scope-2-only CSV; two boundary rails note '
        f'local writes and read-only coverage / Scope 3 meters">\n'
        f'<title>dsh-ghg: twelve-month close ledger, one verify gate, '
        f'three local exports</title>\n'
        f'<defs>\n'
        f'  <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">\n'
        f'    <stop offset="0" stop-color="{s["bg_from"]}"/>\n'
        f'    <stop offset="1" stop-color="{s["bg_to"]}"/>\n'
        f'  </linearGradient>\n'
        f'  <filter id="soft" x="-30%" y="-30%" width="160%" height="180%">\n'
        f'    <feDropShadow dx="0" dy="8" stdDeviation="11" '
        f'flood-color="{shadow_col}" flood-opacity="{shadow_op}"/>\n'
        f'  </filter>\n'
        f'  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">\n'
        f'    <circle cx="1.4" cy="1.4" r="1.4" fill="{s["dot"]}"/>\n'
        f'  </pattern>\n'
        f'</defs>\n'
        f'<rect width="1100" height="660" fill="url(#bg)"/>\n'
        f'<rect width="1100" height="660" fill="url(#dots)" opacity=".42"/>')

    # header
    t(44, 60, "dsh-ghg", 34, "text", MONO, 700)
    t(44, 86, "monthly close ledger · one row per month · local only", 15,
      "sub", SANS)
    p.append(f'<rect x="788" y="38" width="268" height="34" rx="17" '
             f'fill="{s["pill"]}"/>')
    t(922, 60, "2026 · CN-SUZ-01 · 12/12", 14, "accent", MONO,
      anchor="middle")
    line(44, 104, 1056, 104, "grid", 1.5)

    # ------------------------------------------------ left: 12-row ledger
    p.append('<g filter="url(#soft)">')
    box(40, 116, 628, 444, "card", "edge", 20)
    p.append('</g>')
    t(60, 146, "MONTHLY CLOSE · 2026", 17, "accent", MONO, 700)
    t(648, 146, "12/12 · missing 0", 13, "faint", MONO, anchor="end")
    t(60, 168, "facility_import · ingest ×12 · CSV / text PDF · evidence_sha256",
      13, "sub", MONO)

    # highlighted multiplication column (kWh -> tCO2e)
    p.append(f'<rect x="352" y="204" width="112" height="294" rx="10" '
             f'fill="{s["colband"]}" opacity=".055"/>')

    t(60, 196, "MONTH", 12.5, "faint", MONO)
    t(300, 196, "kWh", 12.5, "faint", MONO, anchor="end")
    t(456, 196, "tCO2e", 12.5, "accent", MONO, 700, anchor="end")
    t(640, 196, "state", 12.5, "faint", MONO, anchor="end")
    line(60, 204, 648, 204, "grid", 1.3)

    row_top = 210
    row_h = 24
    for i, (kwh, tco2e) in enumerate(zip(MONTH_KWH, MONTH_TCO2E)):
        y = row_top + i * row_h
        if i:
            line(60, y, 648, y, "grid", 1, opacity=".55")
        t(60, y + 16, f"2026-{i + 1:02d}", 14, "sub", MONO)
        t(300, y + 16, f"{kwh:,}", 14, "text", MONO, anchor="end")
        t(456, y + 16, short_number(tco2e), 14, "text", MONO, 600,
          anchor="end")
        p.append(f'<circle cx="572" cy="{y + 11}" r="3.4" fill="{s["good"]}"/>')
        t(582, y + 16, "verified", 12, "good", MONO)

    total_y = row_top + 12 * row_h
    line(60, total_y + 4, 648, total_y + 4, "grid", 1.6)
    t(60, total_y + 30, "Σ 12 rows", 15, "text", MONO, 700)
    t(300, total_y + 30, f"{TOTAL_KWH:,}", 15, "text", MONO, 700,
      anchor="end")
    t(456, total_y + 30, f"{TOTAL_TCO2E:.3f}", 15, "accent", MONO, 700,
      anchor="end")
    t(640, total_y + 30, "12/12", 13, "good", MONO, 700, anchor="end")
    t(60, total_y + 48, "period = YYYY-MM · deterministic activity_id · no duplicates",
      12, "faint", MONO)

    # ------------------------------------------------ right: factor + gate
    p.append('<g filter="url(#soft)">')
    box(692, 116, 368, 110, "card", "edge", 18)
    p.append('</g>')
    t(712, 138, "FACTOR · R0", 15.5, "accent", MONO, 700)
    t(1040, 138, "match_factor / factor_import", 12, "faint", MONO,
      anchor="end")
    t(712, 162, "0.5703 kgCO2e/kWh", 21, "text", MONO, 700)
    t(712, 190, "electricity-location-cn-2022-v1", 13, "sub", MONO)
    t(712, 209, "public reference · not assurance-grade", 12, "faint", SANS)

    p.append('<g filter="url(#soft)">')
    box(692, 238, 368, 140, "card", "edge", 18)
    p.append('</g>')
    t(712, 260, "STATE GATE · verify_row", 15.5, "accent", MONO, 700)
    t(712, 284, "calculated → verified", 18, "text", MONO, 700)
    t(712, 308, "recalc = kWh × factor ÷ 1000", 12.5, "sub", MONO)
    t(712, 326, "|recalc − stored| ≤ 1e-9 → verified", 12.5, "sub", MONO)
    t(712, 348, "mismatch keeps line_id + diff", 12, "warn", MONO)
    t(712, 364, "E_GHG_RECALC_MISMATCH", 12, "warn", MONO)

    # ------------------------------------------------ right: export stack
    p.append('<g filter="url(#soft)">')
    box(692, 390, 368, 170, "card", "edge", 18)
    p.append('</g>')
    t(712, 412, "EXPORTS · period 2026-12", 15.5, "accent", MONO, 700)
    t(712, 437, "workpaper · 3 sheets", 16, "text", MONO, 700)
    t(712, 455, "Facilities / Activities / Emissions", 12, "sub", MONO)
    t(712, 477, "ESRS E1 pack · 4 sheets", 16, "text", MONO, 700)
    t(712, 495, "Summary / Methodology / Data Quality / Lines", 12, "sub", MONO)
    t(712, 517, "ESRS E1 CSV · Scope 2 only", 13.5, "text", MONO)
    t(712, 538, "safeExportPath · exports/ · R1 write", 12, "faint", MONO)

    # ------------------------------------------------ boundary rails
    p.append('<g filter="url(#soft)">')
    box(40, 574, 620, 52, "card", "edge", 16)
    p.append('</g>')
    t(60, 596, "LOCAL BOUNDARY · R1", 14, "accent", MONO, 700)
    t(60, 615, "no network · no model · originals untouched · storage ghg + exports/",
      12, "sub", SANS)

    p.append('<g filter="url(#soft)">')
    box(692, 574, 368, 52, "card", "edge", 16)
    p.append('</g>')
    t(712, 596, "READ-ONLY METERS · R0", 14, "accent", MONO, 700)
    t(712, 615, "coverage 12/12 · scope3 6/15 · 2 issues", 12, "sub", MONO)

    # footer rules
    t(44, 646, "ingest_pdf: text PDF only, no OCR · storage domain ghg v1 "
      "(5 tables) · 13 ghg_* tools", 13, "sub", MONO)

    p.append('</svg>')

    path = os.path.join(OUT, f"dsh-ghg-flow-v5-{skin_name}.svg")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(p) + "\n")
    print(f"wrote dsh-ghg-flow-v5-{skin_name}.svg")


def main():
    os.makedirs(OUT, exist_ok=True)
    for skin_name in ("light", "dark"):
        for lang in ("zh", "en"):
            hero(lang, skin_name)
        flow_svg(skin_name)
    if WARNINGS:
        print(f"{len(WARNINGS)} layout warning(s)")
        for warning in WARNINGS:
            print("WARN", warning)
    else:
        print("no layout warnings")


if __name__ == "__main__":
    main()
