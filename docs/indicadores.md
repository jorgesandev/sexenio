# Indicadores núcleo (v0)

Criterios: cobertura larga, fuente verificable, frecuencia al menos anual y relevancia para evaluar una gestión.

| # | Indicador | Unidad | Frecuencia | Fuente | Cobertura | Dirección |
|---|---|---|---|---|---|---|
| 1 | PIB per cápita real | pesos constantes | trimestral | INEGI | 1993– | ↑ mejor |
| 2 | Inversión fija bruta / PIB | % del PIB | anual | Banco Mundial (WDI) | 1990– | ↑ mejor |
| 3 | Inflación anual | % anual | mensual | INEGI (INPC) | 1990– | ↓ mejor (meta 3%) |
| 4 | Remuneraciones medias reales | índice 2018=100 | mensual | INEGI | 2008– | ↑ mejor |
| 5 | Tasa de informalidad laboral | % de ocupados | mensual | INEGI (ENOE) | 2005– | ↓ mejor |
| 6 | Pobreza multidimensional | % de población | bienal | CONEVAL / INEGI | 2008– | ↓ mejor |
| 7 | Coeficiente de Gini | índice 0–1 | bienal | Banco Mundial (WDI) | 1992– | ↓ mejor |
| 8 | Homicidio doloso | por 100 mil hab. | anual / mensual | INEGI y SESNSP | 1990– | ↓ mejor |
| 9 | Extorsión | por 100 mil hab. | mensual | SESNSP | 2015– | ↓ mejor |
| 10 | Deuda amplia (SHRFSP) / PIB | % | trimestral | SHCP | 2000– | ↓ mejor |
| 11 | Ingresos tributarios / PIB | % del PIB | anual | Banco Mundial (WDI) | 1990– | ↑ mejor |
| 12 | Gasto en salud per cápita | USD corrientes por habitante | anual | Banco Mundial (WDI) | 2000– | ↑ mejor |

**Nota M4:** la serie trimestral de inversión de INEGI y el salario base de cotización del IMSS no están disponibles en las APIs abiertas utilizadas. Para no inventar cifras, M4 usa inversión/PIB, Gini, ingresos tributarios y gasto en salud del Banco Mundial, y el índice de remuneraciones medias reales de INEGI como proxy del salario formal. Las sustituciones están declaradas en cada metodología y en la página de metodología.

## Indicadores complementarios (v1)

- Cifra negra y victimización (ENVIPE, 2011–).
- Exceso de mortalidad (OMS / registros administrativos).
- Estado de derecho (WJP, 2012–) y contrapesos (V-Dem).
- Participación electoral y aprobación promedio del sexenio.
- Emisiones y participación de energías limpias.
- Desapariciones y feminicidios.
- Remesas como porcentaje del PIB (contexto, no mérito).

## Reglas de visualización

- Deflactar a pesos de un año base declarado.
- Normalizar por población o PIB según el indicador.
- Marcar quiebres metodológicos con línea punteada y nota.
- Mostrar SESNSP e INEGI en paralelo cuando exista divergencia.
- No empalmar series con metodologías distintas sin declararlo.
