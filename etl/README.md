# ETL — M4

Construye el dataset oficial de los 12 indicadores de M4. No inventa cifras:
toda observación conserva `source_id`, `source_url`, `status` y `vintage`.

## Requisitos

- Python 3.12+.
- `pip install -r etl/requirements.txt` (solo `openpyxl` para los XLSX de CONEVAL).
- `INEGI_TOKEN` en `.env.local` (raíz del repo) o en el entorno. El token nunca
  se escribe en los datos ni se imprime.
- `curl` disponible para las descargas del Banco Mundial.

## Uso

```bash
# Primera ejecución (descarga y guarda caché en data/raw/)
python3 etl/build_dataset.py --vintage 2026-10-24

# Actualizar todas las fuentes
python3 etl/build_dataset.py --refresh --vintage 2026-10-24
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
| `fbkf_pib` | Banco Mundial `NE.GDI.FTOT.ZS` | anual | Serie de inversión/PIB; la serie trimestral de INEGI no está disponible en la API vigente |
| `inflacion` | INEGI, serie vigente 910406 | mensual | Inflación anual del INPC base 2018 |
| `salario_real_imss` | INEGI, serie 702102 | mensual | Índice de remuneraciones medias reales; proxy de ingreso formal, no SBC del IMSS |
| `informalidad` | INEGI ENOE, serie 444619 | mensual | Tasa de informalidad laboral TIL1 |
| `pobreza_mult` | CONEVAL 2008-2020 + INEGI 2022-2024 | bienal | Quiebre metodológico en 2022; no se empalma |
| `gini` | Banco Mundial `SI.POV.GINI` | anual | Coeficiente de Gini; se transforma de 0-100 a 0-1 |
| `homicidio_100k` | INEGI, tasa anual 6200002200 | anual | Certificados de defunción |
| `homicidio_100k` | SESNSP, víctimas de homicidio doloso | mensual | Denuncias; tasa calculada con CONAPO |
| `extorsion_100k` | SESNSP, denuncias de extorsión | mensual | Tasa calculada con CONAPO |
| `deuda_shrfsp_pib` | SHCP SHRFSP total + INEGI PIB nominal | trimestral | SHRFSP / PIB nominal × 100 |
| `ingresos_trib_pib` | Banco Mundial `GC.TAX.TOTL.GD.ZS` | anual | Ingresos tributarios / PIB |
| `gasto_salud_pc` | Banco Mundial `SH.XPD.CHEX.PC.CD` | anual | Gasto corriente en salud per cápita, USD corrientes |

- **PIB real:** API interna del tabulado de PIBT, serie desestacionalizada base
  2018. La API pública BISE no tenía la serie actualizada a 2026.
- **Población:** CONAPO, “Población a mitad de año, 1950-2070”, recurso del
  DataStore de datos.gob.mx. Los años de proyección se marcan `estimado`.
- **INPC, informalidad y remuneraciones:** se usan las series mensuales vigentes
  de la API interna de INEGI. Las series BISE antiguas de INPC están congeladas.
- **Homicidios:** se conservan dos series separadas. INEGI publica una tasa
  anual; SESNSP publica víctimas mensuales. La tasa SESNSP es mensual (por 100
  mil habitantes por mes) y no se anualiza.
- **Extorsión:** denuncias mensuales del SESNSP, no incidencia real.
- **Pobreza:** CONEVAL 2008-2020; INEGI publicó 2022-2024. El quiebre de 2022
  está declarado en el catálogo y la UI lo muestra.
- **SHRFSP/PIB:** el numerador viene del DataStore de datos.gob.mx (concepto
  `SHRF5000`, SHRFSP total). El denominador es el PIB nominal trimestral del
  tabulado de INEGI, congelado en
  `etl/manual/inegi_pib_nominal_quarterly.csv`.
- **Sustituciones M4:** el Banco Mundial aporta inversión/PIB, Gini, ingresos
  tributarios y gasto en salud; INEGI aporta el índice de remuneraciones medias
  reales. No son las series trimestrales de INEGI, el SBC del IMSS ni el gasto
  en salud en pesos constantes; están declaradas para no inventar cifras.

## Validación

El script valida catálogo, fuentes, unidades, fechas, valores finitos, estatus,
frecuencia, cadencia y duplicados `(indicador, fecha, fuente, vintage)`. Los
huecos se permiten y se documentan en `manifest.json`; no se interpolan.

## Fixtures

`etl/make_fixtures.py` sigue generando el fallback sintético. La app web lo usa
solo si se ejecuta `bun run sync:data --fixtures` o si no existe un dataset
generado.
