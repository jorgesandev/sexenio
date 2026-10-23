# sexenio

> Seis años, sin el ruido.

Explorador interactivo de indicadores de México para comparar presidentes y sexenios con datos trazables. No produce un ranking único: permite elegir indicadores, ajustar pesos y ver cómo cambia el resultado.

## Estado

Documentación y estructura listas para iniciar el hito **M1** (shell y sistema de diseño). La aplicación en `web/` todavía no existe. Los datos de desarrollo son sintéticos y están marcados como tales.

## Documentación

| Documento | Contenido |
|---|---|
| [AGENTS.md](AGENTS.md) | Convenciones, comandos y reglas para agentes |
| [Visión](docs/vision.md) | Propósito, no objetivos, modelo y roadmap |
| [Spec v0](docs/spec-v0.md) | Rutas, estado en URL, pantallas y criterios de aceptación |
| [Plan](docs/plan.md) | Hitos M1–M6, dependencias y riesgos |
| [Modelo de datos](docs/data-model.md) | Esquema, IDs, validación y versionado |
| [Diseño](docs/design.md) | Tipografía, color, layout y specs de gráficas |
| [Indicadores](docs/indicadores.md) | 12 indicadores núcleo y reglas de visualización |
| [Fuentes](docs/fuentes.md) | Fuentes primarias, internacionales y de percepción |

## Principios

- **Ritmo, no nivel.** Cada sexenio se compara contra la tendencia heredada, no contra cero.
- **Tasas y per cápita.** Nunca conteos absolutos sin población o PIB de referencia.
- **Procedencia visible.** Cada punto enlaza a su fuente, definición, `vintage` y estatus.
- **Comparabilidad honesta.** Los huecos y quiebres metodológicos se muestran, no se rellenan.
- **Sin score por defecto.** El índice compuesto es una herramienta del usuario, con análisis de sensibilidad.

## Modos

1. **Explorador** — serie completa 1994–2026 con sexenios y eventos.
2. **Comparador** — sexenios alineados por mes de gestión (t = 1…72).
3. **Constructor** — índice personalizado con pesos ajustables y advertencia de sensibilidad.

## Estructura

```
.
├── AGENTS.md
├── docs/                  # visión, spec, plan, datos y diseño
├── data/
│   ├── metadata/          # catálogo de indicadores, fuentes, sexenios y eventos
│   ├── fixtures/          # observaciones sintéticas para desarrollo
│   ├── raw/               # descargas originales (no versionadas)
│   └── processed/         # datasets normalizados (no versionados)
├── etl/                   # ingestión y generación de fixtures
└── web/                   # aplicación Next.js (pendiente)
```

## Inicio rápido

Requisitos: bun y Python 3.12+.

```bash
# Fixtures de desarrollo (sin tokens)
python3 etl/make_fixtures.py

# Frontend (cuando exista web/)
cd web
bun install
bun dev
```

Copia `.env.example` a `.env.local` y completa los tokens cuando vayas a conectar datos reales:

- `INEGI_TOKEN`
- `BANXICO_TOKEN`

## Stack

- Next.js (App Router) + TypeScript estricto + Tailwind CSS v4
- ECharts para series de tiempo
- JSON/CSV estáticos en v0; Parquet + DuckDB-WASM se evalúa en v2
- ETL en Python + Polars
- Despliegue previsto: Cloudflare Pages

## Licencia

MIT. Ver [LICENSE](LICENSE). Los datos de terceros conservan sus propias licencias.
