# ETL — M2

Construye el dataset oficial de los cuatro indicadores de M2. No inventa
cifras: toda observación conserva `source_id`, `source_url`, `status` y
`vintage`.

## Requisitos

- Python 3.12+.
- `pip install -r etl/requirements.txt` (solo `openpyxl` para los XLSX de CONEVAL).
- `INEGI_TOKEN` en `.env.local` (raíz del repo) o en el entorno. El token nunca
  se escribe en los datos ni se imprime.

## Uso

```bash
# Primera ejecución (descarga y guarda caché en data/raw/)
python3 etl/build_dataset.py --vintage 2026-10-23

# Actualizar todas las fuentes
python3 etl/build_dataset.py --refresh --vintage 2026-10-23
```

Salidas:

- `data/processed/observations.json` — dataset normalizado.
- `data/processed/observations.csv` — misma información para inspección.
- `data/processed/manifest.json` — conteos, cobertura y notas.

`data/raw/` y `data/processed/` están ignorados por Git. La copia que consume la
web se genera con `cd web && bun run sync:data` en
`web/src/data/generated/dataset.ts`, y esa copia sí se versiona para builds
aislados.

## Fuentes y decisiones

| Indicador | Fuente | Frecuencia | Nota |
|---|---|---|---|
| `pib_pc_real` | INEGI PIBT base 2018 (serie 736181) + CONAPO | trimestral | PIB desestacionalizado / población a mitad de año |
| `homicidio_100k` | INEGI, tasa anual 6200002200 | anual | certificados de defunción |
| `homicidio_100k` | SESNSP, víctimas de homicidio doloso | mensual | denuncias; tasa calculada con CONAPO |
| `pobreza_mult` | CONEVAL 2008-2020 + INEGI 2022-2024 | bienal | quiebre metodológico en 2022; no se empalma |
| `deuda_shrfsp_pib` | SHCP SHRFSP total + INEGI PIB nominal | trimestral | SHRFSP / PIB nominal × 100 |

- **PIB real:** API interna del tabulado de PIBT, serie desestacionalizada base
  2018. La API pública BISE no tenía la serie actualizada a 2026.
- **Población:** CONAPO, “Población a mitad de año, 1950-2070”, recurso del
  DataStore de datos.gob.mx. Los años de proyección se marcan `estimado`.
- **Homicidios:** se conservan dos series separadas. INEGI publica una tasa
  anual; SESNSP publica víctimas mensuales. La tasa SESNSP es mensual (por 100
  mil habitantes por mes) y no se anualiza.
- **Pobreza:** CONEVAL 2008-2020; INEGI publicó 2022-2024. El quiebre de 2022
  está declarado en el catálogo y la UI lo muestra.
- **SHRFSP/PIB:** el numerador viene del DataStore de datos.gob.mx (concepto
  `SHRF5000`, SHRFSP total). El denominador es el PIB nominal trimestral del
  tabulado de INEGI. Ese tabulado se renderiza en el navegador y no tiene un CSV
  estable, por lo que se congela en
  `etl/manual/inegi_pib_nominal_quarterly.csv` con su README y fecha.

## Validación

El script valida catálogo, fuentes, unidades, fechas, valores finitos, estatus,
frecuencia, cadencia y duplicados `(indicador, fecha, fuente, vintage)`. Los
huecos se permiten y se documentan en `manifest.json`; no se interpolan.

## Fixtures

`etl/make_fixtures.py` sigue generando el fallback sintético. La app web lo usa
solo si se ejecuta `bun run sync:data --fixtures` o si no existe un dataset
generado.
