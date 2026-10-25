# sexenio

> Seis años, sin el ruido.

Explorador interactivo de indicadores de México para comparar presidentes y sexenios con datos trazables. No produce un ranking único: permite elegir indicadores, ajustar pesos y ver cómo cambia el resultado.

## Estado

**M6 completado.** El explorador, el comparador y el constructor cubren los 12 indicadores, con fuente, estatus y `vintage` por observación. El constructor permite elegir al menos tres indicadores, ajustar pesos, alternar normalización z-score/min-max, excluir sexenios sin cobertura y revisar la sensibilidad del orden a ±10 puntos. La v0 está desplegada con metadatos SEO/Open Graph, `robots.txt`, sitemap, contenido inicial renderizado y auditoría de accesibilidad.

Por disponibilidad de APIs abiertas, M4 usa series anuales del Banco Mundial para inversión/PIB, Gini, ingresos tributarios y gasto en salud, y el índice de remuneraciones medias reales de INEGI como proxy del salario formal. Las sustituciones están declaradas en la UI y en la metodología.

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
- **Sin score por defecto.** El constructor abre con un ejemplo editable; el índice compuesto es una herramienta del usuario, con análisis de sensibilidad.

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
└── web/                   # aplicación Next.js (M6)
```

## Inicio rápido

Requisitos: bun y Python 3.12+.

```bash
# Fixtures de desarrollo (fallback)
python3 etl/make_fixtures.py

# Datos oficiales (requiere INEGI_TOKEN en .env.local)
python3 etl/build_dataset.py --refresh --vintage 2026-10-23

# Frontend
cd web
bun install
bun dev
```

El explorador abre en <http://localhost:3000/explorar>, el comparador en <http://localhost:3000/comparar> y el constructor en <http://localhost:3000/constructor>. El ETL escribe en `data/processed/` (ignorado) y `web/scripts/sync-data.mjs` empaqueta el dataset tipado que consume la aplicación.

Copia `.env.example` a `.env.local` y completa los tokens cuando vayas a conectar datos reales:

- `INEGI_TOKEN`
- `BANXICO_TOKEN`

## Demo pública y despliegue

Explorador, comparador, constructor y metodología: <https://sexenio-demo.jorgesandev.workers.dev/explorar/>, <https://sexenio-demo.jorgesandev.workers.dev/comparar/>, <https://sexenio-demo.jorgesandev.workers.dev/constructor/> y <https://sexenio-demo.jorgesandev.workers.dev/metodologia/>.
Publica el dataset oficial generado.

El demo se publica mediante Cloudflare Workers Static Assets con `web/wrangler.jsonc`.
Para reconstruir y desplegar con una sesión de Cloudflare autorizada:

```bash
cd web
bun install --frozen-lockfile
bun run deploy
```

Wrangler ejecuta el build y publica únicamente `web/out/`. Este despliegue es manual; no configura despliegues automáticos desde GitHub.

`INEGI_TOKEN` se usa únicamente al ejecutar el ETL local. No hace falta añadirlo al Worker: el build aislado conserva `web/src/data/generated/dataset.ts`, que se versiona sin credenciales. Para actualizar los datos, ejecuta el ETL, `bun run sync:data` desde `web/`, revisa y versiona el dataset generado, y vuelve a desplegar.

## Stack

- Next.js (App Router) + TypeScript estricto + Tailwind CSS v4
- ECharts para series de tiempo
- JSON/CSV estáticos en v0; Parquet + DuckDB-WASM se evalúa en v2
- ETL en Python + Polars
- Despliegue: Cloudflare Workers Static Assets

## Licencia

MIT. Ver [LICENSE](LICENSE). Los datos de terceros conservan sus propias licencias.
