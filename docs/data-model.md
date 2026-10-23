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
  "frequency": "monthly",
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
| `note` | string | Opcional; obligatorio si `status=fixture` |

Ejemplo:

```csv
indicator_id,date,value,unit,geography,status,vintage,source_id,source_url,note
homicidio_100k,2024-01-01,26.1,por 100 mil habitantes,MX,revisado,2025-02-10,inegi,https://www.inegi.org.mx/,
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
| `fbkf_pib` | Inversión fija bruta / PIB | trimestral | up | INEGI | 1993 |
| `inflacion` | Inflación anual | mensual | down | INEGI/Banxico | 1969 |
| `salario_real_imss` | Salario real IMSS | mensual | up | IMSS | 1997 |
| `informalidad` | Tasa de informalidad laboral | trimestral | down | INEGI (ENOE) | 2005 |
| `pobreza_mult` | Pobreza multidimensional | bienal | down | CONEVAL/INEGI | 2008 |
| `gini` | Coeficiente de Gini | bienal | down | CONEVAL/INEGI | 2008 |
| `homicidio_100k` | Homicidio doloso por 100 mil | mensual | down | INEGI/SESNSP | 1990 |
| `extorsion_100k` | Extorsión por 100 mil | mensual | down | SESNSP | 2015 |
| `deuda_shrfsp_pib` | Deuda amplia / PIB | trimestral | down | SHCP | 1994 |
| `ingresos_trib_pib` | Ingresos tributarios / PIB | anual | up | SHCP | 1990 |
| `gasto_salud_pc` | Gasto en salud per cápita real | anual | up | Salud/SHCP | 2000 |

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
