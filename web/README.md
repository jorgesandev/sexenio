# web

Aplicación Next.js (App Router) del explorador de sexenios. Implementa el hito **M1**: shell, sistema de diseño, estado en URL y explorador con datos sintéticos.

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
│   ├── explorer/            # controles, gráfica, tabla, cobertura
│   └── ui/                  # controles segmentados, month picker, badges
├── data/generated/          # dataset tipado, generado; no editar
└── lib/
    ├── url-state.ts         # parseo, validación y serialización de la URL
    ├── series.ts            # filtros, media móvil, vistas, huecos
    ├── coverage.ts          # cobertura anual y quiebres
    ├── chart-option.ts      # opciones ECharts puras
    ├── explorer-model.ts    # modelo derivado de la vista
    └── strings.ts           # textos de UI en español
```

## Datos de M1

- `scripts/sync-data.mjs` lee `../data/metadata/*.json` y `../data/fixtures/observations.sample.csv`, valida columnas, catálogo, unidades, cadencia y estatus, y genera `src/data/generated/dataset.ts`.
- El dataset generado se versiona para que `web/` pueda compilarse de forma aislada. Se regenera en cada `dev`/`build`/`test` cuando existe `../data`.
- Solo se empaquetan observaciones de los cuatro indicadores M1: `homicidio_100k`, `pib_pc_real`, `pobreza_mult`, `deuda_shrfsp_pib`.
- Todas las observaciones llevan `status: "fixture"`. La UI muestra el banner y el estatus por fila. No hay datos reales en M1.
- El catálogo muestra los 12 indicadores del modelo; los 8 sin fixtures aparecen como “Sin datos” y no son seleccionables.

## Estado en URL

La URL es la única fuente de verdad de la vista. Defaults y validación viven en `lib/url-state.ts`; cualquier valor inválido cae al default y se reporta en la UI.

| Parámetro | M1 |
|---|---|
| `i` | indicador activo (lista separada por comas; el explorador usa el primero) |
| `view` | `level`, `delta`, `index` |
| `from`, `to` | rango `YYYY-MM` |
| `scale` | `linear`, `log` |
| `ma` | `0`, `3`, `12` meses |
| `src` | `inegi`, `sesnsp` (homicidios; sin datos SESNSP en fixtures) |
| `t`, `align`, `w` | validados y preservados; reservados para M3/M5 |

Las comas y los dos puntos no se escapan en la query para mantener la URL legible.

## Notas de implementación

- Sitio estático: `output: "export"` y `trailingSlash: true`. No hay backend ni rutas dinámicas.
- ECharts se carga en un chunk diferido (`next/dynamic`, `ssr: false`); el primer render muestra un skeleton con la altura final.
- Las gráficas tienen resumen textual y tabla accesible. Los huecos se insertan como `null`; nunca se interpola en silencio.
- El quiebre metodológico se marca en la franja de cobertura y con una línea punteada en la gráfica.
- El sexenio en curso se marca con badge y no se promedia.
- `prefers-reduced-motion` desactiva transiciones; ECharts no anima.
- No hay ranking ni índice compuesto en M1.
