# AGENTS.md — sexenio

## Qué es este proyecto

Explorador interactivo de indicadores de México para comparar presidentes y sexenios con datos trazables. No emite un ranking único: permite elegir indicadores, ajustar pesos y ver cómo cambia el resultado.

Lee antes de trabajar:

1. `docs/vision.md` — propósito y no objetivos.
2. `docs/spec-v0.md` — qué se construye y cómo se comporta.
3. `docs/plan.md` — orden de trabajo y criterios de terminado.
4. `docs/data-model.md` — esquema, IDs y reglas de datos.
5. `docs/design.md` — tipografía, color y specs de gráficas.

## Estado actual

M5 completado: el explorador, el comparador y el constructor cubren los 12 indicadores, con fuente, estatus y `vintage` por observación. El constructor permite elegir al menos tres indicadores, ajustar pesos, alternar normalización z-score/min-max, excluir sexenios sin cobertura y revisar la sensibilidad del orden a ±10 puntos. El siguiente hito es M6 (pulido y despliegue). Inversión/PIB, Gini, ingresos tributarios y gasto en salud usan series anuales del Banco Mundial; remuneraciones reales usa un índice de INEGI como proxy del salario formal.

El ETL escribe `data/processed/` (ignorado). La web empaqueta una copia tipada en `web/src/data/generated/dataset.ts`, que se versiona para builds aislados. Sin datos procesados, `sync:data` conserva el dataset generado; `--fixtures` fuerza el fallback sintético.

## Comandos

Todo el frontend vive en `web/`. Usa **bun**, nunca npm/yarn/pnpm.

```bash
cd web
bun install
bun dev          # http://localhost:3000
bun run build
bun run lint
bun test
```

ETL (requiere `INEGI_TOKEN` en `.env.local`):

```bash
python3 etl/build_dataset.py --refresh --vintage 2026-10-23
python3 etl/make_fixtures.py   # regenera fixtures sintéticos de fallback
```

No hay backend. El sitio es estático y el estado vive en la URL.

## Stack

- Next.js (App Router) + TypeScript estricto.
- Tailwind CSS v4.
- ECharts para series de tiempo.
- Datos servidos como JSON/CSV en v0; Parquet + DuckDB-WASM se evalúa en v2.
- ETL en Python 3.12 + Polars (los fixtures actuales usan solo stdlib).
- Despliegue actual: Cloudflare Workers Static Assets (`web/wrangler.jsonc`).

No agregues dependencias sin justificar que el stack existente no cubre el caso.

## Convenciones de código

- UI en español. Strings en `web/src/lib/strings.ts` para facilitar i18n futuro.
- Fechas en ISO (`YYYY-MM-DD`); al mostrar, `Intl.DateTimeFormat("es-MX")`.
- Números con `Intl.NumberFormat("es-MX")` y cifras tabulares en gráficas.
- Componentes de servidor por defecto; `"use client"` solo para charts e interacción.
- IDs de indicadores en `snake_case` y estables (ver `docs/data-model.md`).
- Sin `any`. Sin lógica de transformación de datos dentro de componentes.
- Un color estable por presidente, definido en `data/metadata/terms.json`.
- Una gráfica = un componente con props tipadas; nada de JS ad hoc en el JSX.

## Reglas de datos (no negociables)

- **Nunca inventar cifras.** Los datos sintéticos solo viven en `data/fixtures/` y llevan `status: "fixture"`.
- Toda observación requiere `source_id`, `status` y `vintage`.
- No editar `data/processed/` a mano: se regenera desde `etl/`.
- No commitear `data/raw/` ni `data/processed/`.
- Mostrar cobertura y quiebres metodológicos; no interpolar ni empalmar en silencio.
- Si dos fuentes discrepan (SESNSP vs. INEGI), mostrar ambas como series separadas.

## Reglas de producto

- Sin ranking por defecto. El índice compuesto lo construye el usuario.
- Toda cifra visible debe tener fuente y fecha a un clic.
- No agregar un indicador al índice si la cobertura del periodo es insuficiente.
- La tabla accesible no es opcional: toda gráfica tiene su versión tabular.
- Móvil y teclado son requisito, no extra.

## Definition of done

Una tarea termina cuando:

- `bun run build` y `bun run lint` pasan.
- Funciona a 375 px y 1440 px.
- Navegación por teclado y foco visible.
- Sin errores en consola.
- Estados vacío, cargando y error implementados.
- Si toca datos: fuente, `status` y `vintage` visibles.

## Git

- No hacer commit, amend, push ni PR salvo que se pida explícitamente.
- Mensajes en imperativo y en inglés (`feat: add term-aligned comparison`).
- No commitear secretos. Usa `.env.local` (ignorado) a partir de `.env.example`.

## Trampas conocidas

- El desempleo abierto en México es engañoso; la válvula es la informalidad.
- La deuda externa no es la medida correcta: usa SHRFSP/PIB.
- CONEVAL fue absorbido por INEGI en 2025; verifica la serie vigente antes de ingerir pobreza.
- Los homicidios de SESNSP son denuncias; los de INEGI, certificados de defunción.
- El sexenio de Sheinbaum está incompleto: no comparar su promedio contra sexenios cerrados sin advertencia.
