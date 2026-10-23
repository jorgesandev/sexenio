# Sistema de diseño

## Concepto

Editorial, no dashboard corporativo. Referencias: FT Visual Stories, The Economist, Pudding. Papel cálido, tinta oscura, una sola familia serif para titulares y una sans para interfaz y datos.

## Tipografía

| Uso | Fuente | Tamaño / peso |
|---|---|---|
| Titular de página | Source Serif 4 | 40/44, 600 |
| Título de gráfica | Source Serif 4 | 24/30, 600 |
| Cuerpo | Inter | 16/24, 400 |
| UI y controles | Inter | 14/20, 500 |
| Ejes y notas | Inter | 12/16, 400 |
| Cifras | Inter tabular | `font-variant-numeric: tabular-nums` |

Cargar con `next/font` y `display: swap`. Solo pesos 400, 500 y 600.

## Color

### Base

| Token | Hex | Uso |
|---|---|---|
| `paper` | `#FAF9F6` | Fondo |
| `surface` | `#FFFFFF` | Tarjetas y drawer |
| `ink` | `#17181C` | Texto principal |
| `muted` | `#5E6168` | Texto secundario |
| `rule` | `#E2DFD6` | Bordes y grid |
| `accent` | `#1F4E79` | Enlaces y foco |
| `danger` | `#A3232B` | Alertas y datos en curso |

### Sexenios (paleta Okabe-Ito, segura para daltonismo)

| Sexenio | Hex |
|---|---|
| Zedillo | `#0072B2` |
| Fox | `#009E73` |
| Calderón | `#D55E00` |
| Peña | `#CC79A7` |
| AMLO | `#E69F00` |
| Sheinbaum | `#56B4E9` |

Modo "colorear por partido" (v1): PRI `#1B7F4B`, PAN `#1F5FA8`, MORENA `#A3232B`. No usar ambos modos a la vez.

### Estados de dato

| Estatus | Tratamiento |
|---|---|
| `revisado` | Sólido |
| `preliminar` | 70% opacidad + badge |
| `estimado` | Punteado |
| `disputado` | Dos series, una punteada |
| `fixture` | Banner global + badge |

## Layout

- Ancho máximo de contenido: 1440 px.
- Sidebar: 280 px fijo; colapsa a bottom sheet en `< 1024 px`.
- Header: 64 px, fondo `paper` con borde inferior `rule`.
- Gráfica principal: alto mínimo 420 px en desktop, 300 px en móvil.
- Grid de 8 px; márgenes internos de 24 px en desktop y 16 px en móvil.
- Sin sombras ni radios mayores a 4 px. Bordes de 1 px.

## Gráficas

- Línea de 2 px; sin relleno salvo una sola serie (10% opacidad).
- Grid horizontal únicamente, color `rule`, 1 px.
- Eje Y sin línea; eje X con línea `rule`.
- Etiquetas de eje en `muted`, 12 px.
- Etiqueta directa al final de la línea; la leyenda se elimina cuando hay una serie.
- Bandas de sexenio: alternancia de `ink` al 3% de opacidad.
- Transiciones de poder: vertical punteada `muted` al 40%.
- Eventos: punto de 6 px con anillo `paper`; tooltip con fecha y fuente.
- Tooltip: fondo `ink`, texto `paper`, 12 px, sin flechas.
- Nunca ejes duales, nunca 3D, nunca gradientes.
- Máximo 4 series superpuestas; más allá, small multiples.

## Componentes

- **Chip de sexenio:** borde 1 px, punto de color, nombre; activo con fondo del color al 12%.
- **Badge de estatus:** mayúsculas, 10 px, tracking 0.08em.
- **Botón primario:** `ink` de fondo, `paper` de texto; sin sombra.
- **Control segmentado:** borde 1 px, opción activa con fondo `ink` y texto `paper`.
- **Drawer:** 320 px, borde izquierdo `rule`, cierre con `Esc`.
- **Tabla:** filas de 40 px, borde inferior `rule`, cifras tabulares a la derecha.

## Movimiento

- Duración 150 ms, easing `ease-out`.
- Solo para cambios de estado y apertura de drawer.
- Respetar `prefers-reduced-motion`; en ese caso, sin transición.

## Accesibilidad

- Contraste mínimo AA en texto y controles.
- Foco visible: anillo de 2 px `accent` con offset de 2 px.
- No transmitir información solo por color; usar patrón, badge o etiqueta.
- Área táctil mínima de 44 × 44 px.
- Texto redimensionable hasta 200% sin pérdida de contenido.

## Qué evitar

- Fondo oscuro en v0.
- Iconos decorativos o emojis en la UI.
- Sombras, glassmorphism, gradientes.
- Colores de partido como codificación principal.
- Animaciones de entrada de gráficas.
