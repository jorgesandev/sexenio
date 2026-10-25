# Modelo de datos

## Archivos

```
data/
├── metadata/
│   ├── indicators.json   # catálogo de indicadores
│   ├── sources.json      # catálogo de fuentes
│   ├── terms.json        # sexenios
│   └── events.json       # eventos históricos
├── fixtures/
│   └── observations.sample.csv
├── raw/                  # descargas originales (no versionado)
└── processed/            # normalizado (no versionado)
```

## Entidades

### Indicador

```json
{
  "id": "homicidio_100k",
  "name": "Homicidio doloso",
  "shortName": "Homicidios",
  "dimension": "seguridad",
  "unit": "por 100 mil habitantes",
  "frequency": "annual",
  "direction": "down",
  "sourceId": "inegi",
  "alternateSourceId": "sesnsp",
  "coverageStart": "1990-01",
  "description": "Muertes por agresión intencional por cada 100 mil habitantes.",
  "methodologyNote": "INEGI usa certificados de defunción; SESNSP usa denuncias. No son intercambiables.",
  "breaks": []
}
```

Enums:

- `dimension`: `economia`, `empleo`, `social`, `seguridad`, `fiscal`, `instituciones`, `energia`, `democracia`.
- `frequency`: `monthly`, `quarterly`, `annual`, `biennial`.
- La frecuencia del catálogo es la de la fuente principal. Una misma observación
  puede declarar su propia `frequency` cuando la fuente alterna tiene otra
  cadencia (caso de homicidios: INEGI anual, SESNSP mensual).
- `direction`: `up` (más es mejor) o `down` (más es peor).

### Observación

Formato largo, una fila por indicador-fecha-fuente.

| Columna | Tipo | Regla |
|---|---|---|
| `indicator_id` | string | Debe existir en `indicators.json` |
| `date` | ISO date | Primer día del periodo (`2024-01-01`) |
| `value` | number | Sin nulos; si no hay dato, no hay fila |
| `unit` | string | Debe coincidir con el catálogo |
| `geography` | string | `MX` en v0 |
| `status` | enum | `preliminar`, `revisado`, `estimado`, `disputado`, `fixture` |
| `vintage` | ISO date | Fecha de descarga o corte |
| `source_id` | string | Debe existir en `sources.json` |
| `source_url` | string | URL exacta del dato |
| `frequency` | enum | Cadencia real de la fuente; puede diferir entre fuentes |
| `note` | string | Opcional; obligatorio si `status=fixture` |

Ejemplo:

```csv
indicator_id,date,value,unit,geography,status,vintage,source_id,source_url,frequency,note
homicidio_100k,2024-01-01,26.1,por 100 mil habitantes,MX,revisado,2025-02-10,inegi,https://www.inegi.org.mx/,annual,
```

### Sexenio

```json
{
  "id": "amlo",
  "name": "Andrés Manuel López Obrador",
  "party": "MORENA",
  "start": "2018-12-01",
  "end": "2024-09-30",
  "color": "#E69F00",
  "inProgress": false,
  "note": "Transición adelantada por reforma constitucional"
}
```

`end` es el último día del mandato. Para Sheinbaum, `end` es `2030-09-30` e `inProgress` es `true`.

### Evento

```json
{
  "id": "covid-2020",
  "date": "2020-03-23",
  "title": "Emergencia sanitaria por COVID-19",
  "type": "salud",
  "description": "Inicio de la Jornada Nacional de Sana Distancia.",
  "sourceUrl": "https://www.gob.mx/salud"
}
```

## Catálogo de indicadores v0

| ID | Nombre | Frecuencia | Dirección | Fuente | Desde |
|---|---|---|---|---|---|
| `pib_pc_real` | PIB per cápita real | trimestral | up | INEGI | 1993 |
| `fbkf_pib` | Inversión fija bruta / PIB | anual | up | Banco Mundial | 1990 |
| `inflacion` | Inflación anual | mensual | down | INEGI (INPC) | 1990 |
| `salario_real_imss` | Remuneraciones medias reales | mensual | up | INEGI | 2008 |
| `informalidad` | Tasa de informalidad laboral | mensual | down | INEGI (ENOE) | 2005 |
| `pobreza_mult` | Pobreza multidimensional | bienal | down | CONEVAL/INEGI | 2008 |
| `gini` | Coeficiente de Gini | bienal | down | Banco Mundial | 1992 |
| `homicidio_100k` | Homicidio doloso por 100 mil | anual / mensual | down | INEGI/SESNSP | 1990 |
| `extorsion_100k` | Extorsión por 100 mil | mensual | down | SESNSP | 2015 |
| `deuda_shrfsp_pib` | Deuda amplia / PIB | trimestral | down | SHCP | 2000 |
| `ingresos_trib_pib` | Ingresos tributarios / PIB | anual | up | Banco Mundial | 1990 |
| `gasto_salud_pc` | Gasto en salud per cápita | anual | up | Banco Mundial | 2000 |

**M4:** las series anuales del Banco Mundial y el índice de remuneraciones de INEGI sustituyen series no disponibles en APIs abiertas; ver `docs/fuentes.md`.

## Reglas de transformación

1. **Fechas:** normalizar todo al primer día del periodo. Nunca usar el último.
2. **Deflactación:** pesos constantes con año base declarado en `note` o en la ficha.
3. **Per cápita:** población del mismo año; si no existe, no calcular.
4. **Tasas:** por 100 mil habitantes con población anual interpolada solo si se declara.
5. **Porcentaje del PIB:** PIB nominal anual o trimestral consistente con la serie.
6. **Promedios de sexenio:** solo con sexenios cerrados y cobertura ≥ 80% de los periodos.
7. **Huecos:** no interpolar. Si hace falta continuidad visual, línea discontinua y nota.

## Versionado

- `vintage` identifica el corte, no la fecha del hecho.
- Una revisión de la fuente genera filas nuevas con `vintage` distinto; no se sobrescribe.
- La UI usa el `vintage` más reciente por defecto y permite ver el anterior en la ficha.
- Los archivos publicados se nombran `observations-YYYY-MM-DD.parquet` o `.json`.

## Validación (obligatoria en ETL)

- `indicator_id`, `source_id` y `geography` existen en catálogo.
- `date` es válido y coincide con la frecuencia del indicador.
- `value` es numérico y finito.
- `unit` coincide con la del indicador.
- No hay duplicados `(indicator_id, date, source_id, vintage)`.
- `status=fixture` solo aparece en `data/fixtures/`.
- Cobertura declarada coincide con los datos reales (test automático).

## Fixtures

`data/fixtures/observations.sample.csv` se genera con `etl/make_fixtures.py`.

- Todos los valores son sintéticos y deterministas.
- `status` siempre es `fixture`.
- `note` siempre dice `DATO SINTÉTICO — solo desarrollo`.
- La UI debe mostrar un banner mientras haya fixtures en pantalla.
- Nunca se despliegan a producción.

## Datos oficiales (M4)

`etl/build_dataset.py` genera `data/processed/observations.json` y
`data/processed/manifest.json` (ignorados por Git). La web empaqueta una copia
tipada en `web/src/data/generated/dataset.ts`, que sí se versiona para permitir
builds aislados.

| Indicador | Fuente | Frecuencia | Transformación |
|---|---|---|---|
| `pib_pc_real` | INEGI PIBT base 2018 + CONAPO | trimestral | PIB desestacionalizado / población a mitad de año |
| `fbkf_pib` | Banco Mundial `NE.GDI.FTOT.ZS` | anual | porcentaje del PIB |
| `inflacion` | INEGI INPC 910406 | mensual | variación anual del INPC |
| `salario_real_imss` | INEGI 702102 | mensual | índice de remuneraciones medias reales; proxy |
| `informalidad` | INEGI ENOE 444619 | mensual | tasa TIL1 |
| `homicidio_100k` | INEGI (defunciones) | anual | tasa publicada por INEGI |
| `homicidio_100k` | SESNSP (víctimas) | mensual | víctimas de homicidio doloso / población × 100 mil |
| `extorsion_100k` | SESNSP | mensual | denuncias / población × 100 mil |
| `pobreza_mult` | CONEVAL 2008-2020 + INEGI 2022-2024 | bienal | porcentaje nacional; quiebre 2022 |
| `gini` | Banco Mundial `SI.POV.GINI` | anual | coeficiente 0–1 |
| `deuda_shrfsp_pib` | SHCP SHRFSP + INEGI PIB nominal | trimestral | SHRFSP / PIB nominal × 100 |
| `ingresos_trib_pib` | Banco Mundial `GC.TAX.TOTL.GD.ZS` | anual | porcentaje del PIB |
| `gasto_salud_pc` | Banco Mundial `SH.XPD.CHEX.PC.CD` | anual | USD corrientes por habitante |

Reglas específicas:

- Homicidios INEGI y SESNSP se conservan como series separadas; el explorador
  permite alternar la fuente. La tasa SESNSP es mensual y la de INEGI anual.
- La población usada como denominador es la población a mitad de año de
  CONAPO; los años de proyección se marcan como `estimado`.
- La pobreza no se empalma: 2008-2020 es CONEVAL y 2022-2024 fue publicada por
  INEGI con cambio metodológico.
- El PIB nominal usado para SHRFSP/PIB se congela en
  `etl/manual/inegi_pib_nominal_quarterly.csv` porque el tabulado oficial se
  renderiza en el navegador y no ofrece un CSV estable.
- El token de INEGI vive en `.env.local` y nunca se escribe en los datos,
  metadatos ni URLs publicadas.
