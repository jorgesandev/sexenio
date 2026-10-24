# web

Aplicación Next.js (App Router) del explorador, comparador y constructor de sexenios. Implementa **M5**: 12 indicadores, series disputadas en paralelo, eventos históricos, matriz de cobertura, comparador alineado con small multiples, exportación CSV y constructor de índice con z-score/min-max, exclusión por cobertura y sensibilidad ±10 puntos.

## Comandos

```bash
bun install
bun dev          # http://localhost:3000/explorar
bun run build    # sitio estático en out/
bun run lint
bun test
bun run typecheck
```

`dev`, `build` y `test` ejecutan antes `bun run sync:data`.

## Arquitectura

```
src/
├── app/                     # rutas: /explorar, /comparar, /constructor, /metodologia
├── components/
│   ├── shell/               # header, sidebar, drawer, banner, layout
│   ├── explorer/            # controles, gráfica, tabla, cobertura, fuentes y eventos
│   ├── comparator/          # controles, gráficas, resumen y datos alineados
│   ├── constructor/         # selección, pesos, ranking, desglose y sensibilidad
│   ├── methodology/         # matriz de cobertura
│   └── ui/                  # controles segmentados, month picker, badges
├── data/generated/          # dataset tipado, generado; no editar
└── lib/
    ├── url-state.ts         # parseo, validación y serialización de la URL
    ├── constructor.ts       # normalización, ranking, exclusiones y sensibilidad
    ├── constructor-context.ts # defaults del constructor
    ├── series.ts            # filtros, media móvil, vistas, huecos
    ├── coverage.ts          # cobertura anual y quiebres
    ├── chart-option.ts      # opciones ECharts del explorador
    ├── comparison-chart-option.ts # opciones ECharts del comparador
    ├── comparator.ts        # alineación, tendencia, cobertura y resumen
    ├── comparator-csv.ts    # exportación del resumen comparado
    ├── explorer-model.ts    # modelo derivado de la vista
    ├── csv.ts               # exportación de la vista
    └── strings.ts           # textos de UI en español
```

## Datos oficiales

- `../etl/build_dataset.py` descarga y normaliza las fuentes oficiales; escribe `../data/processed/observations.json` (ignorado) y un manifiesto de cobertura.
- `scripts/sync-data.mjs` prefiere `../data/processed/observations.json`, valida catálogo, unidades, fechas, estatus y cadencia, y genera `src/data/generated/dataset.ts`. Si no hay datos procesados, conserva el dataset generado versionado.
- El dataset generado se versiona para que `web/` compile de forma aislada (Cloudflare Pages). `bun run sync:data --fixtures` fuerza el fallback sintético.
- M5 cubre los 12 indicadores del catálogo. El explorador y el comparador se habilitan a partir de las observaciones disponibles; el constructor excluye los sexenios sin cobertura completa para los indicadores elegidos.
- Homicidios tiene dos fuentes: INEGI anual y SESNSP mensual. La frecuencia se guarda por observación, no solo por indicador. La sección “Fuentes en paralelo” muestra ambas sin empalmarlas.
- Inversión/PIB, Gini, ingresos tributarios y gasto en salud usan series anuales del Banco Mundial; remuneraciones reales usa el índice mensual de INEGI como proxy del salario formal. Las sustituciones están declaradas en la UI, `docs/fuentes.md` y `/metodologia`.
- Los eventos históricos se dibujan como puntos y se listan con fecha, descripción y fuente.
- La matriz de cobertura indicador × año vive en `/metodologia` y usa la fuente principal de cada indicador.
- Los fixtures siguen existiendo como fallback; la UI solo muestra el banner sintético cuando el dataset generado tiene `kind: "fixture"`.
- Cada observación conserva `status`, `vintage`, `source_id` y `source_url`; el drawer y la tabla los muestran.

## Exportación CSV

En el explorador, la vista actual (indicador, fuente, rango, vista, suavizado) se exporta desde el botón del header o desde la tabla en móvil. El CSV incluye valor mostrado, valor crudo, unidad, frecuencia, estatus, `vintage`, fuente y URL del dato. Se genera en el navegador; no hay backend.

En el comparador, el botón exporta el resumen por indicador y sexenio (promedio, cambio, mínimo, máximo, cobertura, observaciones, tendencia, fuente y corte). La tabla de datos alineados está disponible en la página.

## Estado en URL

La URL es la única fuente de verdad de la vista. Defaults y validación viven en `lib/url-state.ts`; cualquier valor inválido cae al default y se reporta en la UI.

| Parámetro | M5 |
|---|---|
| `i` | indicadores activos (lista separada por comas); el explorador usa el primero y el constructor parte de tres |
| `t` | sexenios seleccionados; todos en el explorador, Fox y AMLO por defecto en el comparador |
| `align` | `calendar`, `term`; el comparador usa `term` por defecto |
| `view` | `level`, `delta`, `index` |
| `from`, `to` | rango `YYYY-MM` |
| `scale` | `linear`, `log` |
| `ma` | `0`, `3`, `12` meses; no aplica a series anuales/bienales |
| `norm` | `zscore`, `minmax`; `zscore` por defecto |
| `src` | `inegi`, `sesnsp` (homicidios; INEGI anual, SESNSP mensual) |
| `w` | `id:peso` separados por coma; pesos iguales por defecto |

Las comas y los dos puntos no se escapan en la query para mantener la URL legible.

## Notas de implementación

- Sitio estático: `output: "export"` y `trailingSlash: true`. No hay backend ni rutas dinámicas.
- ECharts se carga en un chunk diferido (`next/dynamic`, `ssr: false`); el primer render muestra un skeleton con la altura final.
- Las gráficas tienen resumen textual y tabla accesible. Los huecos se insertan como `null`; nunca se interpola en silencio.
- El quiebre metodológico de pobreza (2022) se marca en la franja de cobertura y con una línea vertical en las gráficas; en el comparador la línea se corta y el promedio del sexenio afectado no se calcula.
- El sexenio en curso se marca con badge, se dibuja sólido hasta el último dato y no se promedia; la prolongación punteada solo indica continuidad.
- La tendencia heredada usa los 36 meses previos al inicio del sexenio y requiere al menos 3 observaciones. La escala del comparador prioriza los datos observados.
- Los eventos se dibujan solo dentro de la cobertura de la serie y se listan completos en el periodo.
- Las tablas anchas viven en contenedores con scroll propio; el documento no se desplaza horizontalmente en móvil.
- El constructor abre con un ejemplo editable de tres indicadores. No es un ranking oficial: el usuario elige indicadores, pesos y normalización; la URL reproduce la selección.
- El constructor usa la fuente principal de cada indicador, excluye sexenios en curso y con cobertura insuficiente, y muestra el motivo. La sensibilidad recalcula ±10 puntos de peso por indicador y advierte si cambia el orden.
- Las cifras preliminares/estimadas se señalan con badges y avisos; el detalle está en la tabla y el drawer.
- `prefers-reduced-motion` desactiva transiciones; ECharts no anima.
- El sitio no impone un ranking único; el constructor no sustituye el juicio del usuario ni oculta la fuente o el corte de datos.
