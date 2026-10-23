# Spec funcional v0

## Alcance

- 6 sexenios: Zedillo (1994–2000), Fox (2000–2006), Calderón (2006–2012), Peña (2012–2018), AMLO (2018–2024) y Sheinbaum (2024–, en curso).
- 4 indicadores en la primera entrega: `homicidio_100k`, `pib_pc_real`, `pobreza_mult`, `deuda_shrfsp_pib`.
- 12 indicadores al cerrar v0.
- Español únicamente; arquitectura lista para i18n.
- Sin login, sin backend. Estado en URL.

## Rutas

| Ruta | Contenido |
|---|---|
| `/` | Redirige a `/explorar` |
| `/explorar` | Serie completa con sexenios y eventos |
| `/comparar` | Sexenios alineados y small multiples |
| `/constructor` | Índice personalizado y sensibilidad |
| `/metodologia` | Fuentes, definiciones, quiebres y licencias |

## Estado en URL

Parámetros legibles, con defaults. Cualquier valor inválido cae al default sin romper la página.

| Parámetro | Valores | Default |
|---|---|---|
| `i` | IDs separados por coma | `homicidio_100k` |
| `t` | sexenios separados por coma | todos |
| `view` | `level` \| `delta` \| `index` | `level` |
| `align` | `calendar` \| `term` | `calendar` |
| `from`, `to` | `YYYY-MM` | 1994-12 a hoy |
| `scale` | `linear` \| `log` | `linear` |
| `ma` | `0` \| `3` \| `12` (meses) | `0` |
| `w` | `id:peso` separados por coma | pesos iguales |
| `src` | `inegi` \| `sesnsp` (solo homicidios) | `inegi` |

Reglas:

- La URL es la única fuente de verdad de la vista.
- Copiar la URL debe reproducir exactamente gráfica, filtros y pesos.
- No usar base64: los parámetros deben ser legibles y editables.

## Shell

- Header fijo de 64 px: marca, tabs (`Explorar`, `Comparar`, `Constructor`, `Metodología`), botón de exportar.
- Sidebar izquierdo de 280 px en desktop: catálogo de indicadores con búsqueda y filtros por dimensión.
- Área principal: título del indicador, subtítulo con unidad y fuente, controles, gráfica, tabla.
- Drawer derecho (320 px) al hacer clic en "Fuente": definición, metodología, cobertura, estatus, licencia.
- En móvil: sidebar como bottom sheet; tabs en scroll horizontal; drawer a pantalla completa.

## Explorador

**Controles sobre la gráfica**

- Selector de vista: nivel, cambio acumulado, índice = 100 al inicio.
- Rango de fechas.
- Escala lineal/logarítmica.
- Suavizado: ninguno, media móvil 3 o 12 meses (siempre etiquetado).
- Fuente alternativa cuando exista (`src`).

**Gráfica**

- Línea de 2 px, sin área de relleno.
- Sexenios como bandas alternas muy tenues, con etiqueta en el borde superior.
- Línea vertical punteada en cada transmisión de poder.
- Eventos como puntos anotados; tooltip con descripción y fuente.
- Tooltip: indicador, fecha, valor, sexenio, fuente y estatus.
- Etiqueta directa al final de cada serie; sin leyenda separada si hay una sola serie.
- Cero en el eje Y cuando la unidad sea tasa o porcentaje; no forzarlo en índices.
- Nunca ejes duales.

**Debajo de la gráfica**

- Franja de cobertura: mini barra 1994–2026 que marca años con dato, huecos y quiebres.
- Tabla: fecha, valor, sexenio, fuente, estatus. Ordenable y exportable a CSV.
- Chips de "series relacionadas" (ej. homicidios SESNSP/INEGI).

## Comparador

- Chips multi-select de sexenios (máximo 4 superpuestos).
- `align=term`: eje X de 1 a 72 meses; `align=calendar`: fechas reales.
- Línea de tendencia heredada: extrapolación lineal de los 36 meses previos al inicio del sexenio. Se dibuja punteada y con nota metodológica.
- Small multiples cuando hay más de 4 sexenios o más de un indicador.
- Sexenio en curso: línea sólida hasta el último dato y luego punteada; badge "en curso". Nunca se promedia como si estuviera cerrado.
- Tabla resumen por sexenio: promedio, cambio acumulado, mínimo, máximo, cobertura y número de observaciones.

## Constructor

- Selección de al menos 3 indicadores con cobertura suficiente.
- Pesos con sliders de 0 a 100; se normalizan a suma 100.
- Normalización: z-score (default) o min-max, declarada en la UI.
- Dirección: los indicadores "más es peor" se invierten automáticamente.
- Resultado: ranking y barras por sexenio, más desglose por indicador.
- **Sensibilidad obligatoria:** recalcular con ±10 puntos de peso por indicador y mostrar el rango de posiciones. Si el orden cambia, advertirlo en texto.
- Si falta cobertura, excluir el sexenio del ranking con una nota, no rellenar con cero.

## Metodología

Generada desde `data/metadata/`:

- Ficha por indicador: definición, unidad, fuente, cobertura, frecuencia, quiebres.
- Ficha por fuente: URL, licencia, tipo de acceso, fecha de última descarga.
- Ficha por sexenio: fechas, partido, particularidades.
- Sección de limitaciones conocidas (atribución, rezagos, cifra negra, cambios metodológicos).

## Estados

- **Cargando:** skeleton con la altura final de la gráfica (sin layout shift).
- **Sin datos para el filtro:** mensaje con la cobertura disponible y acción para ampliar el rango.
- **Error de datos:** mensaje, detalle técnico colapsado y enlace a la fuente.
- **Fixture:** banner visible "Datos sintéticos de desarrollo" cuando `status=fixture`.

## Accesibilidad

- Contraste AA mínimo.
- Foco visible en todos los controles.
- Navegación completa por teclado; `Esc` cierra drawer y bottom sheet.
- Gráficas con `role="img"` y resumen textual; tabla equivalente siempre presente.
- Respetar `prefers-reduced-motion`.
- No usar color como único canal: patrones o etiquetas directas.

## Performance

- La primera vista debe pesar menos de 250 KB de JS (sin contar ECharts, cargado en diferido).
- Datos de v0 en JSON/CSV estáticos; cache inmutable por `vintage`.
- Sin layout shift en la carga inicial.

## Criterios de aceptación de v0

- [ ] Un usuario puede comparar dos sexenios en menos de 30 segundos sin instrucciones.
- [ ] Copiar la URL reproduce exactamente la vista.
- [ ] Toda cifra tiene fuente, estatus y fecha a un clic.
- [ ] Los huecos de cobertura son visibles; no hay interpolación silenciosa.
- [ ] Sheinbaum aparece marcada como "en curso".
- [ ] La tabla existe para cada gráfica.
- [ ] Funciona a 375 px y 1440 px.
- [ ] `bun run build` y `bun run lint` pasan.
- [ ] Lighthouse de accesibilidad ≥ 95.
- [ ] Cero errores de consola.

## Fuera de alcance v0

- Desagregación estatal y municipal.
- Comparación internacional.
- Cuentas de usuario y guardado en servidor.
- Inglés.
- Modo oscuro.
- API pública.
- Predicciones o proyecciones.
