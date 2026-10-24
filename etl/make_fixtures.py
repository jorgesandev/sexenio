#!/usr/bin/env python3
"""Genera observaciones sintéticas para desarrollo.

Ningún valor de este archivo es real. Todos llevan status="fixture"
y una nota explícita. El objetivo es ejercitar la UI y la alineación
por sexenio antes de conectar las fuentes oficiales.

Uso:
    python3 etl/make_fixtures.py
"""

from __future__ import annotations

import csv
import json
import math
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDICATORS_PATH = ROOT / "data" / "metadata" / "indicators.json"
SOURCES_PATH = ROOT / "data" / "metadata" / "sources.json"
OUT_PATH = ROOT / "data" / "fixtures" / "observations.sample.csv"
VINTAGE = "2026-10-24"
END = date(2026, 9, 1)

# start, base, tendencia anual, amplitud, decimales, mínimo, máximo, periodo de onda (meses)
PARAMS: dict[str, dict] = {
    "pib_pc_real": {"start": "1993-01-01", "base": 18500, "trend": 250, "amp": 600, "decimals": 0, "clamp": None, "period": 60},
    "fbkf_pib": {"start": "1993-01-01", "base": 21.0, "trend": 0.05, "amp": 1.5, "decimals": 1, "clamp": (12, 32), "period": 48},
    "inflacion": {"start": "1994-12-01", "base": 4.5, "trend": -0.05, "amp": 3.5, "decimals": 2, "clamp": (2, 18), "period": 36},
    "salario_real_imss": {"start": "1997-01-01", "base": 350, "trend": 6, "amp": 10, "decimals": 1, "clamp": (250, 900), "period": 54},
    "informalidad": {"start": "2005-01-01", "base": 58.0, "trend": -0.25, "amp": 1.5, "decimals": 1, "clamp": (40, 65), "period": 40},
    "pobreza_mult": {"start": "2008-01-01", "base": 44.0, "trend": -0.6, "amp": 2.5, "decimals": 1, "clamp": (20, 55), "period": 24},
    "gini": {"start": "2008-01-01", "base": 0.48, "trend": -0.002, "amp": 0.012, "decimals": 3, "clamp": (0.38, 0.55), "period": 24},
    "homicidio_100k": {"start": "1995-01-01", "base": 17.0, "trend": 0.7, "amp": 5.0, "decimals": 1, "clamp": (5, 35), "period": 42},
    "extorsion_100k": {"start": "2015-01-01", "base": 4.5, "trend": 0.15, "amp": 1.2, "decimals": 1, "clamp": (1, 12), "period": 30},
    "deuda_shrfsp_pib": {"start": "1994-12-01", "base": 38.0, "trend": 0.6, "amp": 2.5, "decimals": 1, "clamp": (20, 62), "period": 56},
    "ingresos_trib_pib": {"start": "1994-01-01", "base": 11.0, "trend": 0.12, "amp": 0.4, "decimals": 1, "clamp": (8, 16), "period": 12},
    "gasto_salud_pc": {"start": "2000-01-01", "base": 3200, "trend": 110, "amp": 150, "decimals": 0, "clamp": (2000, 7500), "period": 36},
}

STEP_MONTHS = {"monthly": 1, "quarterly": 3, "annual": 12, "biennial": 24}


def month_index(d: date) -> int:
    return d.year * 12 + (d.month - 1)


def iter_dates(start: str, frequency: str) -> list[date]:
    y, m = (int(part) for part in start.split("-")[:2])
    step = STEP_MONTHS[frequency]
    cur = y * 12 + (m - 1)
    last = month_index(END)
    out: list[date] = []
    while cur <= last:
        out.append(date(cur // 12, cur % 12 + 1, 1))
        cur += step
    return out


def noise(seed: int, idx: int) -> float:
    raw = math.sin((idx + 1) * 12.9898 + seed * 78.233) * 43758.5453
    frac = raw - math.floor(raw)
    return frac * 2 - 1


def make_value(seed: int, idx: int, start_idx: int, p: dict) -> float:
    t = (idx - start_idx) / 12
    wave = math.sin((idx - start_idx) / p["period"] * 2 * math.pi)
    value = p["base"] + p["trend"] * t + p["amp"] * wave + noise(seed, idx) * p["amp"] * 0.35
    if p["clamp"]:
        low, high = p["clamp"]
        value = min(max(value, low), high)
    return round(value, p["decimals"])


def main() -> None:
    indicators = json.loads(INDICATORS_PATH.read_text(encoding="utf-8"))["indicators"]
    sources = {s["id"]: s for s in json.loads(SOURCES_PATH.read_text(encoding="utf-8"))["sources"]}
    by_id = {i["id"]: i for i in indicators}

    rows = []
    for seed, (indicator_id, p) in enumerate(PARAMS.items(), start=1):
        meta = by_id[indicator_id]
        dates = iter_dates(p["start"], meta["frequency"])
        start_idx = month_index(dates[0])
        source = sources[meta["sourceId"]]
        for d in dates:
            idx = month_index(d)
            rows.append(
                {
                    "indicator_id": indicator_id,
                    "date": d.isoformat(),
                    "value": f"{make_value(seed, idx, start_idx, p):.{p['decimals']}f}",
                    "unit": meta["unit"],
                    "geography": "MX",
                    "status": "fixture",
                    "vintage": VINTAGE,
                    "source_id": meta["sourceId"],
                    "source_url": source["url"],
                    "note": "DATO SINTÉTICO — solo desarrollo",
                }
            )

    rows.sort(key=lambda r: (r["indicator_id"], r["date"]))
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=list(rows[0].keys()),
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"{OUT_PATH.relative_to(ROOT)}: {len(rows)} filas, {len(PARAMS)} indicadores")
    print(f"rango: {rows[0]['date']} a {rows[-1]['date']}")


if __name__ == "__main__":
    main()
