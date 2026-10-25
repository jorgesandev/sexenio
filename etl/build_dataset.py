#!/usr/bin/env python3
"""Construye el dataset de M4 desde fuentes oficiales.

Uso:
    python3 etl/build_dataset.py
    python3 etl/build_dataset.py --refresh
    python3 etl/build_dataset.py --vintage 2026-10-23

Las descargas originales se guardan en data/raw/ (ignorado por Git). El
resultado normalizado se escribe en data/processed/ (también ignorado); la
aplicación web empaqueta ese resultado como dataset estático.

Este ETL no inventa cifras: toda observación proviene de una fuente oficial y
lleva source_id, source_url, status y vintage.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import math
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
MANUAL_DIR = Path(__file__).resolve().parent / "manual"

INEGI_TOKEN = ""
VINTAGE = dt.date.today().isoformat()
REFRESH = False

INEGI_BASE = "https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml"
INEGI_INTERNAL = "https://www.inegi.org.mx/app/api/indicadores/interna_v1_3"
INEGI_APP_API = f"{INEGI_INTERNAL}/API.svc"
SESNSP_RESOURCE = "386f17d2-a488-4da2-9c85-99765b5a9cdc"
SHRFSP_RESOURCE = "6cef78df-9b29-4581-9a0b-e7553baa5cf1"
WORLD_BANK_BASE = "https://api.worldbank.org/v2/country/MEX/indicator"
WORLD_BANK_BULK_BASE = "https://api.worldbank.org/v2/en/indicator"

MESES = {
    "Enero": 1,
    "Febrero": 2,
    "Marzo": 3,
    "Abril": 4,
    "Mayo": 5,
    "Junio": 6,
    "Julio": 7,
    "Agosto": 8,
    "Septiembre": 9,
    "Octubre": 10,
    "Noviembre": 11,
    "Diciembre": 12,
}

M4_INDICATORS = {
    "pib_pc_real",
    "fbkf_pib",
    "inflacion",
    "salario_real_imss",
    "informalidad",
    "pobreza_mult",
    "gini",
    "homicidio_100k",
    "extorsion_100k",
    "deuda_shrfsp_pib",
    "ingresos_trib_pib",
    "gasto_salud_pc",
}

STATUS_MAP = {
    "1": "preliminar",
    "2": "preliminar",
    "3": "revisado",
    "4": "estimado",
}

FREQUENCY_MONTHS = {
    "monthly": 1,
    "quarterly": 3,
    "annual": 12,
    "biennial": 24,
}


class SourceError(RuntimeError):
    pass


def log(message: str) -> None:
    print(f"[etl] {message}", flush=True)


def load_environment() -> None:
    """Carga .env.local sin imprimir valores."""
    global INEGI_TOKEN

    token = os.environ.get("INEGI_TOKEN", "").strip()
    env_path = ROOT / ".env.local"

    if not token and env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            if key.strip() == "INEGI_TOKEN":
                token = value.strip().strip('"').strip("'")
                break

    if not token:
        raise SystemExit(
            "Falta INEGI_TOKEN. Colócalo en .env.local o en el entorno. "
            "No lo imprimas ni lo commitees."
        )
    INEGI_TOKEN = token


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(
    url: str,
    cache_name: str,
    *,
    store_url: bool = True,
    timeout: int = 90,
) -> bytes:
    """Descarga con caché en data/raw y reintentos."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = RAW_DIR / cache_name

    if cache_path.exists() and not REFRESH:
        return cache_path.read_bytes()

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        ),
        "Accept": "*/*",
    }

    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = response.read()
            if not data:
                raise SourceError(f"Respuesta vacía para {cache_name}")

            cache_path.write_bytes(data)
            meta = {
                "cache": cache_name,
                "bytes": len(data),
                "sha256": sha256(data),
                "fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            }
            if store_url:
                meta["url"] = url
            (RAW_DIR / f"{cache_name}.meta.json").write_text(
                json.dumps(meta, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            return data
        except Exception as error:  # noqa: BLE001 - se reintenta y se reporta
            last_error = error
            if attempt < 3:
                time.sleep(1.5 * attempt)

    raise SourceError(f"No se pudo descargar {cache_name}: {last_error}")


def fetch_json(
    url: str,
    cache_name: str,
    *,
    store_url: bool = True,
) -> Any:
    data = fetch(url, cache_name, store_url=store_url)
    try:
        return json.loads(data)
    except json.JSONDecodeError as error:
        raise SourceError(f"JSON inválido en {cache_name}: {error}") from error


def month_index(year: int, month: int) -> int:
    return year * 12 + (month - 1)


def period_to_date(period: str, frequency: str) -> str:
    if "/" in period:
        year_text, part_text = period.split("/", 1)
        year = int(year_text)
        if frequency == "monthly":
            month = int(part_text)
            return f"{year:04d}-{month:02d}-01"
        quarter = int(part_text)
        month = (quarter - 1) * 3 + 1
        return f"{year:04d}-{month:02d}-01"

    year = int(period[:4])
    month = 1
    if frequency == "monthly" and len(period) >= 7:
        match = re.match(r"^(\d{4})[-/](\d{1,2})", period)
        if match:
            year, month = int(match.group(1)), int(match.group(2))
    return f"{year:04d}-{month:02d}-01"


def bise_observations(series_id: str, cache_name: str) -> list[dict[str, Any]]:
    url = f"{INEGI_BASE}/INDICATOR/{series_id}/es/00/false/BISE/2.0/{INEGI_TOKEN}?type=json"
    data = fetch_json(url, cache_name, store_url=False)

    if isinstance(data, list):
        raise SourceError(f"BISE sin resultados para {series_id}: {data[:1]}")

    series = (data.get("Series") or [None])[0]
    if not series:
        raise SourceError(f"BISE sin serie para {series_id}")

    observations = []
    for item in series.get("OBSERVATIONS", []):
        raw_value = item.get("OBS_VALUE")
        if raw_value in (None, "", "N/E"):
            continue
        value = float(raw_value)
        if not math.isfinite(value):
            continue
        observations.append(
            {
                "period": item.get("TIME_PERIOD"),
                "value": value,
                "status_code": item.get("OBS_STATUS"),
                "source_note": item.get("OBS_NOTE") or "",
            }
        )
    return observations


def observation(
    indicator_id: str,
    date: str,
    value: float,
    unit: str,
    source_id: str,
    source_url: str,
    note: str,
    frequency: str,
    status: str = "revisado",
) -> dict[str, Any]:
    return {
        "indicator_id": indicator_id,
        "date": date,
        "value": round(float(value), 6),
        "unit": unit,
        "geography": "MX",
        "status": status,
        "vintage": VINTAGE,
        "source_id": source_id,
        "source_url": source_url,
        "note": note,
        "frequency": frequency,
    }


def load_metadata() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    indicators = json.loads(
        (DATA_DIR / "metadata" / "indicators.json").read_text(encoding="utf-8")
    )["indicators"]
    sources = json.loads(
        (DATA_DIR / "metadata" / "sources.json").read_text(encoding="utf-8")
    )["sources"]
    return indicators, sources


def population_series() -> list[dict[str, Any]]:
    """Población a mitad de año, nacional, CONAPO 1950-2070."""
    query = urllib.parse.urlencode(
        {
            "resource_id": "b4fe49a8-c86a-4c32-8450-8f3c4cc83125",
            "limit": 1000,
            "filters": json.dumps({"CVE_GEO": 0}),
        }
    )
    data = fetch_json(
        f"https://datos.gob.mx/api/3/action/datastore_search?{query}",
        "conapo_poblacion_mitad_anio.json",
    )
    records = data["result"]["records"]
    if not records:
        raise SourceError("CONAPO no devolvió la población nacional.")

    population = []
    for record in records:
        year = int(record["ANIO"])
        raw_value = record.get("POB_MIT_ANIO")
        if raw_value in (None, ""):
            continue
        value = float(raw_value)
        if not math.isfinite(value) or value <= 0:
            continue
        if year < 1990 or year > 2070:
            continue
        population.append(
            {
                "year": year,
                "value": value,
                "status": "estimado" if year >= 2021 else "revisado",
            }
        )
    population.sort(key=lambda row: row["year"])
    return population


def inegi_homicide() -> list[dict[str, Any]]:
    raw = bise_observations("6200002200", "inegi_homicide_6200002200.json")
    result = []
    for item in raw:
        date = period_to_date(str(item["period"]), "annual")
        year = int(date[:4])
        if year < 1990 or year > 2025:
            continue
        result.append(
            observation(
                "homicidio_100k",
                date,
                item["value"],
                "por 100 mil habitantes",
                "inegi",
                "https://www.inegi.org.mx/sistemas/olap/proyectos/bd/continuas/mortalidad/defuncioneshom.asp",
                "Tasa anual de defunciones por homicidio por cada 100 mil habitantes; INEGI usa certificados de defunción.",
                "annual",
                STATUS_MAP.get(str(item["status_code"]), "revisado"),
            )
        )
    return result


def inegi_app_series(
    series_id: str,
    cache_name: str,
    *,
    start_year: int,
) -> list[dict[str, Any]]:
    """Serie mensual de la API interna vigente de INEGI (API.svc)."""
    url = (
        f"{INEGI_APP_API}/ValorIndicador/{series_id}/00/null/es/null/null/3/null/"
        f"0/null/{start_year}/null/1/3/json/{INEGI_TOKEN}"
    )
    data = fetch_json(url, cache_name, store_url=False)
    periods = (data.get("dimension") or {}).get("periods", {}).get("category", {}).get("label", [])
    values = data.get("value", [])
    if len(periods) != len(values):
        raise SourceError(f"Dimensiones inconsistentes en la serie INEGI {series_id}.")
    return [
        {
            "period": str(item["Value"]),
            "value": float(str(raw).replace(",", "")),
            "status_code": None,
            "source_note": "",
        }
        for item, raw in zip(periods, values)
        if raw not in (None, "", "N/E")
    ]


def fetch_world_bank_bulk(url: str, cache_name: str) -> bytes:
    """Descarga el CSV masivo del Banco Mundial con curl."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = RAW_DIR / cache_name
    if cache_path.exists() and not REFRESH:
        return cache_path.read_bytes()

    last_error = ""
    for attempt in range(1, 4):
        completed = subprocess.run(
            [
                "curl",
                "-LsS",
                "--http1.1",
                "--max-time",
                "90",
                "-A",
                "Mozilla/5.0",
                url,
            ],
            capture_output=True,
            timeout=120,
        )
        if completed.returncode == 0 and completed.stdout and not completed.stdout.lstrip().startswith(b"<"):
            cache_path.write_bytes(completed.stdout)
            meta = {
                "cache": cache_name,
                "bytes": len(completed.stdout),
                "sha256": sha256(completed.stdout),
                "fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
                "url": url,
            }
            (RAW_DIR / f"{cache_name}.meta.json").write_text(
                json.dumps(meta, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            return completed.stdout
        last_error = completed.stderr.decode("utf-8", "replace")
        if attempt < 3:
            time.sleep(1.5 * attempt)

    raise SourceError(f"No se pudo descargar {cache_name}: {last_error}")


def world_bank_series(
    code: str,
    cache_name: str,
    *,
    start_year: int,
) -> list[dict[str, Any]]:
    """Serie anual del Banco Mundial para México, desde su CSV masivo."""
    url = f"{WORLD_BANK_BULK_BASE}/{code}?downloadformat=csv"
    data = fetch_world_bank_bulk(url, cache_name)
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        csv_names = [name for name in archive.namelist() if name.startswith("API_") and name.endswith(".csv")]
        if not csv_names:
            raise SourceError(f"El CSV del Banco Mundial no contiene datos para {code}.")
        text = archive.read(csv_names[0]).decode("utf-8-sig")

    lines = text.splitlines()
    header_index = next(
        (index for index, line in enumerate(lines) if line.startswith('"Country Name"')),
        None,
    )
    if header_index is None:
        raise SourceError(f"Encabezado inesperado del Banco Mundial para {code}.")

    reader = csv.DictReader(lines[header_index:])
    row = next((item for item in reader if item.get("Country Code") == "MEX"), None)
    if not row:
        raise SourceError(f"El Banco Mundial no devolvió México para {code}.")

    result = []
    for year_text, raw_value in row.items():
        if not year_text or not year_text.isdigit() or not raw_value:
            continue
        year = int(year_text)
        if year < start_year:
            continue
        result.append({"year": year, "value": float(raw_value)})
    result.sort(key=lambda item: item["year"])
    if not result:
        raise SourceError(f"El Banco Mundial no devolvió valores para {code}.")
    return result


def pib_per_capita(population: list[dict[str, Any]]) -> list[dict[str, Any]]:
    url = (
        f"{INEGI_INTERNAL}/ValorIndicador/736181/00/null/es/null/null/3/null/"
        f"0/null/1990/null/null/3/json/{INEGI_TOKEN}"
    )
    data = fetch_json(url, "inegi_pib_real_736181.json", store_url=False)

    periods = data["dimension"]["periods"]["category"]["label"]
    values = data["value"]
    if len(periods) != len(values):
        raise SourceError("El JSON de PIB real tiene dimensiones inconsistentes.")

    population_by_year = {row["year"]: row for row in population}
    result = []

    for period_item, raw_value in zip(periods, values):
        period = period_item["Value"]
        date = period_to_date(period, "quarterly")
        year = int(date[:4])
        if year < 1993:
            continue

        population_row = population_by_year.get(year)
        if not population_row or population_row["value"] <= 0:
            raise SourceError(f"Sin población para {year}; no se puede calcular PIB per cápita.")

        gdp_millions = float(raw_value.replace(",", ""))
        value = (gdp_millions * 1_000_000) / population_row["value"]
        pib_status = "preliminar" if date >= "2026-04-01" else "revisado"
        if pib_status == "preliminar":
            status = "preliminar"
        elif population_row["status"] == "estimado":
            status = "estimado"
        else:
            status = "revisado"

        result.append(
            observation(
                "pib_pc_real",
                date,
                value,
                "pesos constantes",
                "inegi",
                "https://www.inegi.org.mx/temas/pib/",
                (
                    "PIB trimestral desestacionalizado, base 2018, dividido entre "
                    "la población a mitad de año de CONAPO. Población estimada "
                    "para los años de proyección."
                ),
                "quarterly",
                status,
            )
        )
    return result


def sesnsp_crime_rate(
    population: list[dict[str, Any]],
    *,
    subtype: str,
    indicator_id: str,
    cache_name: str,
    note: str,
    min_year: int,
) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode(
        {
            "resource_id": SESNSP_RESOURCE,
            "limit": 100000,
            "filters": json.dumps(
                {"Subtipo de delito": subtype},
                ensure_ascii=False,
            ),
        }
    )
    data = fetch_json(
        f"https://datos.gob.mx/api/3/action/datastore_search?{query}",
        cache_name,
    )
    records = data["result"]["records"]
    if not records:
        raise SourceError(f"SESNSP no devolvió registros de {subtype}.")

    months = list(MESES.keys())
    monthly_totals: dict[tuple[int, int], float] = {}
    for record in records:
        year = int(record["Ano"])
        for month_name in months:
            raw = record.get(month_name) or "0"
            try:
                count = float(raw)
            except ValueError:
                continue
            key = (year, MESES[month_name])
            monthly_totals[key] = monthly_totals.get(key, 0.0) + count

    population_by_year = {row["year"]: row for row in population}
    result = []
    for (year, month), count in sorted(monthly_totals.items()):
        if year < min_year:
            continue
        population_row = population_by_year.get(year)
        if not population_row or population_row["value"] <= 0:
            raise SourceError(f"Sin población para {year}; no se puede calcular la tasa SESNSP.")
        date = f"{year:04d}-{month:02d}-01"
        value = (count / population_row["value"]) * 100_000
        status = "preliminar" if year >= 2025 else "revisado"
        result.append(
            observation(
                indicator_id,
                date,
                value,
                "por 100 mil habitantes",
                "sesnsp",
                "https://datos.gob.mx/busca/dataset/incidencia_delictiva",
                note,
                "monthly",
                status,
            )
        )
    return result


def sesnsp_homicide(population: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sesnsp_crime_rate(
        population,
        subtype="Homicidio doloso",
        indicator_id="homicidio_100k",
        cache_name="sesnsp_homicidio_doloso.json",
        note=(
            "Tasa calculada con víctimas mensuales de homicidio doloso "
            "del SESNSP y población a mitad de año de CONAPO. Mide denuncias, "
            "no el total de hechos."
        ),
        min_year=2015,
    )


def sesnsp_extortion(population: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sesnsp_crime_rate(
        population,
        subtype="Extorsión",
        indicator_id="extorsion_100k",
        cache_name="sesnsp_extorsion.json",
        note=(
            "Denuncias mensuales de extorsión del SESNSP por cada 100 mil "
            "habitantes, usando población a mitad de año de CONAPO. Mide "
            "denuncias, no la incidencia real; la cifra negra es alta."
        ),
        min_year=2015,
    )


def extract_coneval_zip(data: bytes, sheet_name: str, years: list[int], value_start: int) -> dict[int, float]:
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        excel_files = [name for name in archive.namelist() if name.lower().endswith(".xlsx")]
        if not excel_files:
            raise SourceError("El ZIP de CONEVAL no contiene un XLSX.")
        workbook = load_workbook(io.BytesIO(archive.read(excel_files[0])), read_only=True, data_only=True)

    if sheet_name not in workbook.sheetnames:
        raise SourceError(f"No existe la hoja {sheet_name} en el archivo de CONEVAL.")
    sheet = workbook[sheet_name]

    national = None
    for row in sheet.iter_rows(values_only=True):
        if any(
            isinstance(value, str) and value.strip() == "Estados Unidos Mexicanos"
            for value in row
        ):
            national = row
            break

    if national is None:
        raise SourceError("No se encontró la fila nacional de CONEVAL.")
    if len(national) < value_start + len(years):
        raise SourceError("La fila nacional de CONEVAL no tiene las columnas esperadas.")

    result = {}
    for index, year in enumerate(years):
        value = national[value_start + index]
        if value is None:
            continue
        numeric = float(value)
        if not 0 <= numeric <= 100:
            raise SourceError(f"Porcentaje de pobreza fuera de rango para {year}: {numeric}")
        result[year] = numeric
    return result


def poverty() -> list[dict[str, Any]]:
    url_2018 = (
        "https://www.coneval.org.mx/Medicion/MP/Documents/Pobreza_18/"
        "Cambios_pobreza_pobreza_extrema_2008_2018.zip"
    )
    url_2020 = (
        "https://www.coneval.org.mx/Medicion/MP/Documents/MMP_2018_2020/"
        "Evol_pob_pob_ext_nac_ent_2016_2020.zip"
    )

    data_2018 = fetch(url_2018, "coneval_pobreza_2008_2018.zip")
    data_2020 = fetch(url_2020, "coneval_pobreza_2016_2020.zip")

    values_2008_2014 = extract_coneval_zip(
        data_2018,
        "Evolución 2008-2018",
        [2008, 2010, 2012, 2014],
        2,
    )
    values_2016_2020 = extract_coneval_zip(
        data_2020,
        "Evolución 2016-2020",
        [2016, 2018, 2020],
        3,
    )

    recent = bise_observations("8999998769", "inegi_pobreza_8999998769.json")
    values_2022_2024 = {}
    for item in recent:
        year = int(str(item["period"])[:4])
        if year in (2022, 2024):
            values_2022_2024[year] = item["value"]

    if not values_2022_2024:
        raise SourceError("No se encontraron los valores de pobreza 2022/2024 en INEGI.")

    result = []
    for year, value in sorted({**values_2008_2014, **values_2016_2020}.items()):
        source_url = url_2018 if year <= 2014 else url_2020
        result.append(
            observation(
                "pobreza_mult",
                f"{year}-01-01",
                value,
                "% de la población",
                "coneval",
                source_url,
                (
                    "Pobreza multidimensional nacional. CONEVAL para 2008-2020; "
                    "la serie 2022-2024 fue publicada por INEGI. Quiebre "
                    "metodológico en 2022; no empalmar."
                ),
                "biennial",
                "revisado",
            )
        )

    for year, value in sorted(values_2022_2024.items()):
        result.append(
            observation(
                "pobreza_mult",
                f"{year}-01-01",
                value,
                "% de la población",
                "coneval",
                "https://www.inegi.org.mx/app/indicadores/",
                (
                    "Pobreza multidimensional nacional publicada por INEGI. "
                    "Quiebre metodológico en 2022; no comparable con 2008-2020."
                ),
                "biennial",
                "revisado",
            )
        )
    return result


def load_nominal_gdp() -> dict[tuple[int, int], float]:
    path = MANUAL_DIR / "inegi_pib_nominal_quarterly.csv"
    if not path.exists():
        raise SourceError(f"No existe {path}")
    result = {}
    with path.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            year = int(row["year"])
            quarter = int(row["quarter"])
            value = float(row["value_millions_mxn"])
            if not math.isfinite(value) or value <= 0:
                raise SourceError(f"PIB nominal inválido en {year}Q{quarter}: {value}")
            result[(year, quarter)] = value
    return result


def debt_shrfsp_pib(nominal_gdp: dict[tuple[int, int], float]) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode(
        {
            "resource_id": SHRFSP_RESOURCE,
            "limit": 10000,
            "filters": json.dumps({"clave_concepto": "SHRF5000"}),
        }
    )
    data = fetch_json(
        f"https://datos.gob.mx/api/3/action/datastore_search?{query}",
        "shcp_shrfsp_total.json",
    )
    records = data["result"]["records"]
    if not records:
        raise SourceError("SHCP no devolvió registros de SHRFSP.")

    quarterly: dict[tuple[int, int], float] = {}
    for record in records:
        year = int(record["ciclo"])
        month = MESES.get(record["mes"])
        if month not in (3, 6, 9, 12):
            continue
        quarter = month // 3
        raw = record.get("monto")
        if raw is None:
            continue
        amount = float(raw)
        if not math.isfinite(amount) or amount < 0:
            raise SourceError(f"SHRFSP inválido en {year}Q{quarter}: {amount}")
        quarterly[(year, quarter)] = amount

    result = []
    for (year, quarter), amount in sorted(quarterly.items()):
        gdp = nominal_gdp.get((year, quarter))
        if not gdp:
            continue
        # amount: miles de pesos; gdp: millones de pesos.
        ratio = amount / (gdp * 1_000) * 100
        if not 0 < ratio < 200:
            raise SourceError(f"SHRFSP/PIB fuera de rango en {year}Q{quarter}: {ratio}")
        month = (quarter - 1) * 3 + 1
        result.append(
            observation(
                "deuda_shrfsp_pib",
                f"{year:04d}-{month:02d}-01",
                ratio,
                "% del PIB",
                "shcp",
                (
                    "https://datos.gob.mx/busca/dataset/"
                    "saldo_historico_requerimientos_financieros_sector_publico_"
                    "shrfsp_deuda_amplia_2014_a_fecha"
                ),
                (
                    "SHRFSP total (SHCP) dividido entre el PIB nominal trimestral "
                    "de INEGI. El PIB nominal se toma del tabulado de valores "
                    "corrientes en niveles anualizados."
                ),
                "quarterly",
                "preliminar" if year >= 2026 else "revisado",
            )
        )
    return result


def inflation() -> list[dict[str, Any]]:
    raw = inegi_app_series(
        "910406",
        "inegi_inflacion_910406_1990.json",
        start_year=1990,
    )
    result = []
    for item in raw:
        date = period_to_date(item["period"], "monthly")
        result.append(
            observation(
                "inflacion",
                date,
                item["value"],
                "% anual",
                "inegi",
                "https://www.inegi.org.mx/temas/inpc/",
                "Tasa de inflación anual del INPC, base 2018=100. Serie mensual vigente del INEGI.",
                "monthly",
                "revisado",
            )
        )
    return result


def informality() -> list[dict[str, Any]]:
    raw = inegi_app_series(
        "444610",
        "inegi_informalidad_444610.json",
        start_year=2005,
    )
    result = []
    for item in raw:
        date = period_to_date(item["period"], "monthly")
        result.append(
            observation(
                "informalidad",
                date,
                item["value"],
                "% de la población ocupada",
                "inegi",
                "https://www.inegi.org.mx/programas/enoe/15ymas/",
                "Tasa de informalidad laboral TIL1 nacional de la ENOE (serie 444610). Serie mensual; comparable desde 2005.",
                "monthly",
                "revisado",
            )
        )
    return result


def real_remuneration() -> list[dict[str, Any]]:
    raw = inegi_app_series(
        "702134",
        "inegi_remuneraciones_702134.json",
        start_year=2008,
    )
    result = []
    for item in raw:
        date = period_to_date(item["period"], "monthly")
        result.append(
            observation(
                "salario_real_imss",
                date,
                item["value"],
                "índice base 2018=100",
                "inegi",
                "https://www.inegi.org.mx/temas/remuneraciones/",
                (
                    "Índice global de remuneraciones medias reales por persona "
                    "ocupada (serie desestacionalizada 702134, base 2018=100). "
                    "Es un proxy de ingreso laboral formal; no es el salario "
                    "base de cotización del IMSS."
                ),
                "monthly",
                "revisado",
            )
        )
    return result


def world_bank_indicators() -> list[dict[str, Any]]:
    definitions = [
        {
            "indicator_id": "fbkf_pib",
            "code": "NE.GDI.FTOT.ZS",
            "unit": "% del PIB",
            "frequency": "annual",
            "start_year": 1990,
            "filter_year": None,
            "transform": lambda value: value,
            "note": (
                "Formación bruta de capital fijo como porcentaje del PIB. "
                "Serie anual del Banco Mundial; la serie trimestral de INEGI "
                "no está disponible en la API vigente."
            ),
        },
        {
            "indicator_id": "gini",
            "code": "SI.POV.GINI",
            "unit": "índice 0-1",
            "frequency": "biennial",
            "start_year": 1992,
            "filter_year": lambda year: year % 2 == 0,
            "transform": lambda value: value / 100,
            "note": (
                "Coeficiente de Gini del Banco Mundial, calculado a partir de "
                "la ENIGH bienal (años pares desde 1992). Se transforma de "
                "0-100 a 0-1."
            ),
        },
        {
            "indicator_id": "ingresos_trib_pib",
            "code": "GC.TAX.TOTL.GD.ZS",
            "unit": "% del PIB",
            "frequency": "annual",
            "start_year": 1990,
            "filter_year": None,
            "transform": lambda value: value,
            "note": (
                "Ingresos tributarios como porcentaje del PIB. Serie anual "
                "del Banco Mundial."
            ),
        },
        {
            "indicator_id": "gasto_salud_pc",
            "code": "SH.XPD.CHEX.PC.CD",
            "unit": "USD corrientes por habitante",
            "frequency": "annual",
            "start_year": 2000,
            "filter_year": None,
            "transform": lambda value: value,
            "note": (
                "Gasto corriente en salud per cápita del Banco Mundial, en "
                "USD corrientes. No está deflactado a pesos mexicanos."
            ),
        },
    ]

    result = []
    for definition in definitions:
        rows = world_bank_series(
            definition["code"],
            f"world_bank_{definition['code'].lower().replace('.', '_')}.zip",
            start_year=definition["start_year"],
        )
        filter_year = definition["filter_year"]
        for row in rows:
            if filter_year and not filter_year(row["year"]):
                continue
            result.append(
                observation(
                    definition["indicator_id"],
                    f"{row['year']:04d}-01-01",
                    definition["transform"](row["value"]),
                    definition["unit"],
                    "wb",
                    f"https://data.worldbank.org/indicator/{definition['code']}?locations=MX",
                    definition["note"],
                    definition["frequency"],
                    "revisado",
                )
            )
    return result


def validate(
    observations: list[dict[str, Any]],
    indicators: list[dict[str, Any]],
    sources: list[dict[str, Any]],
) -> None:
    indicators_by_id = {item["id"]: item for item in indicators}
    sources_by_id = {item["id"]: item for item in sources}
    valid_status = {"preliminar", "revisado", "estimado", "disputado", "fixture"}
    valid_frequency = set(FREQUENCY_MONTHS)
    seen = set()

    for row in observations:
        indicator = indicators_by_id.get(row["indicator_id"])
        if not indicator:
            raise SourceError(f"Indicador desconocido: {row['indicator_id']}")
        if row["source_id"] not in sources_by_id:
            raise SourceError(f"Fuente desconocida: {row['source_id']}")
        if row["unit"] != indicator["unit"]:
            raise SourceError(
                f"Unidad inconsistente para {row['indicator_id']}: {row['unit']}"
            )
        if row["status"] not in valid_status:
            raise SourceError(f"Estatus inválido: {row['status']}")
        if row["frequency"] not in valid_frequency:
            raise SourceError(f"Frecuencia inválida: {row['frequency']}")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", row["date"]):
            raise SourceError(f"Fecha inválida: {row['date']}")
        if not row["date"].endswith("-01"):
            raise SourceError(f"La fecha debe ser el primer día del periodo: {row['date']}")
        if not math.isfinite(row["value"]):
            raise SourceError(f"Valor no finito: {row}")
        key = (row["indicator_id"], row["date"], row["source_id"], row["vintage"])
        if key in seen:
            raise SourceError(f"Observación duplicada: {key}")
        seen.add(key)

    for indicator in indicators:
        if indicator["id"] not in M4_INDICATORS:
            continue
        rows = [row for row in observations if row["indicator_id"] == indicator["id"]]
        if not rows:
            raise SourceError(f"El indicador {indicator['id']} no tiene datos.")

    # Verifica que cada serie respete su cadencia, permitiendo huecos.
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for row in observations:
        grouped.setdefault((row["indicator_id"], row["source_id"]), []).append(row)

    for (indicator_id, source_id), rows in grouped.items():
        rows.sort(key=lambda item: item["date"])
        frequency = rows[0]["frequency"]
        if any(row["frequency"] != frequency for row in rows):
            raise SourceError(f"Frecuencias mezcladas en {indicator_id}/{source_id}")
        step = FREQUENCY_MONTHS[frequency]
        for previous, current in zip(rows, rows[1:]):
            prev_year, prev_month = map(int, previous["date"][:7].split("-"))
            curr_year, curr_month = map(int, current["date"][:7].split("-"))
            difference = month_index(curr_year, curr_month) - month_index(prev_year, prev_month)
            if difference <= 0 or difference % step != 0:
                raise SourceError(
                    f"Cadencia inválida en {indicator_id}/{source_id}: "
                    f"{previous['date']} -> {current['date']}"
                )


def write_outputs(observations: list[dict[str, Any]], indicators: list[dict[str, Any]]) -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    observations.sort(
        key=lambda item: (
            item["indicator_id"],
            item["date"],
            item["source_id"],
        )
    )

    provenance = {
        "kind": "official",
        "vintage": VINTAGE,
        "referenceDate": VINTAGE,
        "generatedFrom": "etl/build_dataset.py",
        "note": "Datos oficiales. Cada observación conserva fuente, estatus y vintage.",
    }

    payload = {"provenance": provenance, "observations": observations}
    (PROCESSED_DIR / "observations.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    fields = [
        "indicator_id",
        "date",
        "value",
        "unit",
        "geography",
        "status",
        "vintage",
        "source_id",
        "source_url",
        "note",
        "frequency",
    ]
    with (PROCESSED_DIR / "observations.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(observations)

    coverage = []
    for indicator in indicators:
        for source_id in sorted(
            {row["source_id"] for row in observations if row["indicator_id"] == indicator["id"]}
        ):
            rows = [
                row
                for row in observations
                if row["indicator_id"] == indicator["id"] and row["source_id"] == source_id
            ]
            coverage.append(
                {
                    "indicator_id": indicator["id"],
                    "source_id": source_id,
                    "frequency": rows[0]["frequency"],
                    "count": len(rows),
                    "from": rows[0]["date"],
                    "to": rows[-1]["date"],
                }
            )

    manifest = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "vintage": VINTAGE,
        "provenance": provenance,
        "counts": {
            "indicators": len({row["indicator_id"] for row in observations}),
            "observations": len(observations),
            "sources": len({row["source_id"] for row in observations}),
        },
        "coverage": coverage,
        "rawCache": str(RAW_DIR.relative_to(ROOT)),
        "notes": [
            "SESNSP mide denuncias; INEGI mide defunciones registradas. No son intercambiables.",
            "La pobreza 2008-2020 es CONEVAL; 2022-2024 fue publicada por INEGI con quiebre metodológico en 2022.",
            "El PIB nominal usado como denominador de SHRFSP proviene del tabulado manual de INEGI.",
            "Inflación, informalidad y remuneraciones usan series mensuales vigentes de INEGI.",
            "Inversión/GDP, Gini, ingresos tributarios y gasto en salud usan series anuales del Banco Mundial; no son series trimestrales de INEGI/SHCP.",
            "Remuneraciones medias reales es un proxy de ingreso laboral formal; no es el salario base de cotización del IMSS.",
        ],
    }
    (PROCESSED_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    log("Dataset oficial generado:")
    for item in coverage:
        log(
            f"  {item['indicator_id']}/{item['source_id']}: "
            f"{item['count']} obs · {item['from']} → {item['to']} · {item['frequency']}"
        )
    log(f"  Total: {len(observations)} observaciones")
    log(f"  Salida: {PROCESSED_DIR / 'observations.json'}")


def main() -> None:
    global VINTAGE, REFRESH

    parser = argparse.ArgumentParser(description="Construye el dataset oficial de M4.")
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Ignora la caché de data/raw y vuelve a descargar.",
    )
    parser.add_argument(
        "--vintage",
        default=dt.date.today().isoformat(),
        help="Fecha de corte del dataset (YYYY-MM-DD).",
    )
    args = parser.parse_args()
    VINTAGE = args.vintage
    REFRESH = args.refresh

    load_environment()
    indicators, sources = load_metadata()

    log("Cargando población a mitad de año…")
    population = population_series()

    log("Cargando PIB real y calculando PIB per cápita…")
    pib = pib_per_capita(population)

    log("Cargando homicidios INEGI…")
    homicides_inegi = inegi_homicide()

    log("Cargando homicidios SESNSP…")
    homicides_sesnsp = sesnsp_homicide(population)

    log("Cargando extorsión SESNSP…")
    extortion = sesnsp_extortion(population)

    log("Cargando inflación, informalidad y remuneraciones…")
    inflation_rows = inflation()
    informality_rows = informality()
    remuneration_rows = real_remuneration()

    log("Cargando pobreza multidimensional…")
    poverty_rows = poverty()

    log("Cargando SHRFSP y calculando deuda/PIB…")
    nominal_gdp = load_nominal_gdp()
    debt_rows = debt_shrfsp_pib(nominal_gdp)

    log("Cargando series del Banco Mundial…")
    world_bank_rows = world_bank_indicators()

    observations = (
        pib
        + homicides_inegi
        + homicides_sesnsp
        + extortion
        + inflation_rows
        + informality_rows
        + remuneration_rows
        + poverty_rows
        + debt_rows
        + world_bank_rows
    )
    validate(observations, indicators, sources)
    write_outputs(observations, indicators)


if __name__ == "__main__":
    try:
        main()
    except SourceError as error:
        log(f"ERROR: {error}")
        sys.exit(1)
