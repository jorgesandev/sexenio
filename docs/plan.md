# Plan de trabajo

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Periodo | 1994-12 a hoy; 6 sexenios |
| Sheinbaum | Se muestra como "en curso"; nunca se promedia contra sexenios cerrados |
| Idioma | Español en v0; strings centralizados |
| Alcance inicial | 4 indicadores: homicidio, PIB per cápita, pobreza, deuda SHRFSP |
| Datos de desarrollo | Fixtures sintéticos marcados; nunca se presentan como reales |
| Ranking | Solo lo construye el usuario; sin score por defecto |
| Deploy | Cloudflare Pages (estático) |
| Backend | Ninguno en v0; estado en URL |

## Hitos

### M0 — Repo y documentación (hecho)

- [x] Estructura, README, licencia.
- [x] Visión, indicadores, fuentes.
- [x] AGENTS.md, spec, plan, modelo de datos, diseño.
- [x] Metadatos y fixtures sintéticos.

### M1 — Shell y sistema de diseño (hecho)

Depende de: nada. No requiere tokens.

- [x] Scaffold Next.js + TypeScript + Tailwind v4 en `web/`.
- [x] Tokens de color y tipografía de `docs/design.md`.
- [x] Header, tabs, sidebar, drawer y layout responsive.
- [x] Estado de URL con defaults y validación.
- [x] Componente `TimeSeriesChart` con ECharts y datos fixture.
- [x] Tabla accesible y franja de cobertura.
- [x] Banner de datos sintéticos.

**Terminado cuando:** `/explorar` muestra los 4 indicadores fixture, cambia de rango y vista, y la URL reproduce el estado.

### M2 — Explorador con datos reales (4 indicadores) (hecho)

Depende de: M1 y tokens de INEGI/Banxico (o CSV manual trazable).

- [x] `etl/` con descarga, normalización y validación.
- [x] Ingesta de homicidios (SESNSP e INEGI), PIB per cápita, pobreza y deuda SHRFSP.
- [x] Metadatos de procedencia y `vintage` por observación.
- [x] Quiebres metodológicos visibles.
- [x] Exportación CSV de la vista.

**Terminado cuando:** los 4 indicadores salen de fuente real, con fuente y fecha visibles, y los fixtures quedan solo como fallback de desarrollo.

### M3 — Comparador (hecho)

Depende de: M2.

- [x] Alineación por mes de sexenio.
- [x] Superposición de hasta 4 sexenios.
- [x] Tendencia heredada (36 meses previos) con nota.
- [x] Small multiples.
- [x] Tabla resumen por sexenio.
- [x] Tratamiento de sexenio en curso.
- [x] Fuente alternativa de homicidios y tabla de datos alineados.

**Terminado cuando:** comparar Fox vs. AMLO en homicidios y en PIB per cápita es posible en dos clics.

**Nota de producto:** `/comparar` abre con Fox vs. AMLO, homicidios y alineación por mes de sexenio. La URL vacía reproduce esa comparación; los valores globales del explorador siguen siendo todos los sexenios y calendario.

### M4 — Cobertura completa (12 indicadores) (hecho)

Depende de: M2.

- [x] Inflación, inversión fija, remuneraciones reales, informalidad, Gini, extorsión, ingresos tributarios, gasto en salud.
- [x] Series disputadas en paralelo (SESNSP/INEGI) en el explorador.
- [x] Capa de eventos con puntos en la gráfica y lista accesible.
- [x] Matriz de cobertura indicador × año en `/metodologia`.

**Terminado cuando:** los 12 indicadores están disponibles y la matriz de cobertura refleja la realidad de las fuentes.

**Nota de fuentes M4:** por disponibilidad de APIs abiertas, inversión/PIB, Gini, ingresos tributarios y gasto en salud usan series anuales del Banco Mundial; remuneraciones reales usa el índice de INEGI como proxy del salario formal. Las sustituciones están declaradas en la UI y en `docs/fuentes.md`.

### M5 — Constructor de índice (hecho)

Depende de: M4.

- [x] Selección de indicadores y pesos.
- [x] Normalización z-score y min-max.
- [x] Inversión automática según dirección.
- [x] Ranking con desglose.
- [x] Análisis de sensibilidad ±10 puntos.
- [x] Permalink con pesos.

**Terminado cuando:** cambiar un peso actualiza el ranking y la advertencia de sensibilidad sin recargar.

**Nota de producto:** `/constructor` abre con un ejemplo editable de tres indicadores y pesos iguales. No es un ranking oficial; el usuario elige indicadores, pesos y normalización. El sexenio en curso y los sexenios sin cobertura completa se excluyen con su motivo; nunca se rellenan con cero. El siguiente hito es M6.

### M6 — Pulido y despliegue

Depende de: M5.

- [ ] Accesibilidad AA y navegación por teclado.
- [ ] Performance y lazy loading de ECharts.
- [ ] Metadatos SEO y Open Graph.
- [ ] Página de metodología generada desde metadatos.
- [ ] Deploy en Cloudflare Pages.
- [ ] Smoke tests.

**Terminado cuando:** el sitio público cumple los criterios de aceptación de `docs/spec-v0.md`.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Falta de tokens INEGI/Banxico | Bloquea ETL | Fixtures para UI; descarga manual documentada |
| SHCP publica PDFs | Ingesta frágil | CSV manual versionado con URL y fecha |
| CONEVAL absorbido por INEGI | Serie de pobreza incierta | Verificar fuente vigente antes de M2 |
| Discrepancia SESNSP/INEGI | Datos "contradictorios" | Mostrar ambas series, nunca elegir una |
| Sexenio incompleto | Comparación injusta | Badge "en curso" y exclusión del ranking |
| Scope creep | Retraso | 4 indicadores primero; el resto en M4 |

## Orden recomendado para una sesión nueva

1. Leer `AGENTS.md` y `docs/spec-v0.md`.
2. Verificar M2, M3, M4 y M5 con `bun test`, `bun run lint` y `bun run build`.
3. Avanzar a M6 (pulido y despliegue) solo después de revisar el constructor con datos oficiales.
