# Visión y alcance

## Problema

La conversación pública sobre presidentes en México se apoya en datos aislados, series no comparables y conteos absolutos. No existe una herramienta abierta que permita explorar la evidencia, ajustar supuestos y ver cómo cambia el veredicto.

## Propuesta

Un sitio estático, sin login, que:

1. Reúne indicadores oficiales e independientes con procedencia completa.
2. Permite filtrar, comparar y construir índices personalizados.
3. Hace visible la cobertura real y los quiebres metodológicos.
4. Comparte vistas mediante URL, sin backend.

## No objetivos

- Emitir un veredicto único sobre quién fue "mejor".
- Predecir resultados electorales.
- Reemplazar el análisis cualitativo o histórico.
- Competir por velocidad de actualización con las fuentes primarias.

## Usuarios

- **Ciudadano informado:** quiere ver la serie y entender el contexto.
- **Periodista/analista:** necesita comparar rápido y citar la fuente.
- **Académico/estudiante:** requiere series descargables y metodología.

## Modos

| Modo | Pregunta que responde |
|---|---|
| Explorador | ¿Cómo evolucionó este indicador entre 1988 y hoy? |
| Comparador | ¿Cómo se ve este sexenio contra los anteriores? |
| Constructor | ¿Qué pasa con el ranking si cambio los pesos? |

## Modelo de datos

- `indicador`: definición, unidad, frecuencia, dirección, metodología, cobertura, licencia.
- `observacion`: valor, fecha, geografía, estatus (preliminar/revisado/estimado/disputado), vintage, fuente.
- `sexenio`: presidente, partido, inicio, fin, notas de transición.
- `evento`: fecha, tipo, título, fuente.
- `vista`: estado serializable de la interfaz.

## Principios de interfaz

- Estética editorial, no dashboard corporativo.
- Un color estable por presidente; alternativa por partido.
- Tooltip con valor, fecha, fuente y estatus.
- Tabla accesible como alternativa a cada gráfica.
- Permalink que codifica indicadores, pesos, rango y modo.

## Roadmap

- **v0:** 12 indicadores núcleo, sexenios 1994–2026, explorador, comparador y tabla.
- **v1:** constructor de índice con sensibilidad, eventos, procedencia completa, permalinks.
- **v2:** desagregación estatal, API pública, embeds y actualización automatizada.

## Métricas de éxito

- Un usuario puede responder "¿cómo se compara X indicador entre dos sexenios?" en menos de 30 segundos.
- Toda cifra visible tiene fuente y fecha a un clic.
- Las vistas compartidas reproducen exactamente el estado del autor.
