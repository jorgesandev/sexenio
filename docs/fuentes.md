# Fuentes de datos

## Primarias (México)

| Fuente | Qué aporta | Acceso | Notas |
|---|---|---|---|
| [INEGI](https://www.inegi.org.mx/) | PIB, ENOE, ENIGH, INPC, población, defunciones, ENVIPE, ENSU | [API BISE](https://www.inegi.org.mx/servicios/api_indicadores.html) con token | Series largas; revisar cambios de base y codificación |
| [Banxico](https://www.banxico.org.mx/) | Tipo de cambio, tasas, reservas, remesas, expectativas | [API SIE](https://www.banxico.org.mx/SieAPIRest/service/v1/) con token | Documentación estable |
| [SHCP](https://www.gob.mx/shcp) | Finanzas públicas, deuda (SHRFSP), déficit, presupuesto | Datos abiertos y PDFs | SHRFSP disponible vía datos.gob.mx; validar cortes |
| [CONAPO](https://www.gob.mx/conapo) | Población a mitad de año y proyecciones | CSV | Denominador de tasas y per cápita; marcar años estimados |
| [SESNSP](https://www.gob.mx/sesnsp/acciones-y-programas/datos-abiertos-de-incidencia-delictiva) | Incidencia delictiva municipal | CSV/XLSX mensual | Denuncias, no hechos; cifra negra |
| [CONEVAL](https://www.coneval.org.mx/) | Pobreza multidimensional, Gini, ingreso | CSV/Excel | Funciones absorbidas por INEGI en 2025; verificar serie vigente |
| [IMSS](https://www.imss.gob.mx/) | Puestos de trabajo, salario base de cotización | Datos abiertos | Solo sector formal |
| [Secretaría de Salud](https://www.gob.mx/salud) | Gasto, cobertura, mortalidad | Datos abiertos/PDFs | Calidad heterogénea |
| [SEP](https://www.gob.mx/sep) | Matrícula, infraestructura educativa | Datos abiertos | — |
| [SENER](https://www.gob.mx/sener) / [CENACE](https://www.gob.mx/cenace) | Energía, matriz eléctrica | CSV/API | Series dispersas |

## Internacionales y comparables

| Fuente | Qué aporta | Acceso |
|---|---|---|
| [Banco Mundial (WDI)](https://data.worldbank.org/) | Serie macro comparable, benchmark LatAm | [API](https://api.worldbank.org/v2) |
| [FMI (WEO)](https://www.imf.org/en/Publications/WEO) | Proyecciones y series fiscales | API/descarga |
| [OCDE](https://data.oecd.org/) | PISA, salud, ingresos tributarios | API SDMX |
| [OMS (GHO)](https://www.who.int/data/gho) | Mortalidad, esperanza de vida, salud | API |
| [Our World in Data](https://ourworldindata.org/) | Emisiones, energía, series armonizadas | CSV/API |

## Instituciones y percepción

| Fuente | Qué aporta | Notas |
|---|---|---|
| [V-Dem](https://v-dem.net/) | Contrapesos, democracia, Estado de derecho | CSV abierto, anual |
| [World Justice Project](https://worldjusticeproject.org/) | Índice de Estado de derecho | Desde 2012 |
| [Transparencia Internacional](https://www.transparency.org/en/cpi) | Índice de percepción de corrupción | Subjetivo, con rezago |
| [Freedom House](https://freedomhouse.org/) / [RSF](https://rsf.org/) | Libertad de prensa y democracia | Metodología cualitativa |
| [Latinobarómetro](https://www.latinobarometro.org/) | Opinión pública regional | Microdatos |
| [LAPOP](https://www.vanderbilt.edu/lapop/) | AmericasBarometer | Microdatos |
| [México ¿Cómo Vamos?](https://mexicocomovamos.mx/) | Semáforos y análisis | Interpretación, no dato primario |
| [IMCO](https://imco.org.mx/) / [CIEP](https://ciep.mx/) | Competencia, energía, finanzas públicas | Análisis |

## Fuentes usadas en M4

| Indicador | Fuente efectiva | Motivo |
|---|---|---|
| Inversión fija / PIB | Banco Mundial, `NE.GDI.FTOT.ZS` | La serie trimestral de INEGI no está disponible en la API vigente. |
| Inflación anual | INEGI, serie mensual 910406 | Serie vigente del INPC; las claves BISE anteriores están congeladas. |
| Remuneraciones reales | INEGI, serie mensual 702102 | Proxy de ingreso formal; no es el salario base de cotización del IMSS. |
| Informalidad | INEGI ENOE, serie mensual 444619 | Tasa TIL1 mensual. |
| Gini | Banco Mundial, `SI.POV.GINI` | Serie anual armonizada; se transforma a 0–1. |
| Extorsión | SESNSP | Denuncias mensuales por 100 mil habitantes. |
| Ingresos tributarios / PIB | Banco Mundial, `GC.TAX.TOTL.GD.ZS` | Serie anual comparable. |
| Gasto en salud per cápita | Banco Mundial, `SH.XPD.CHEX.PC.CD` | USD corrientes; no está deflactado a pesos. |

Estas sustituciones se muestran en la página de metodología y en la nota de cada
observación. No se presentan como si fueran las series originales de IMSS,
SHCP o Secretaría de Salud.

## Reglas de ingestión

1. Guardar el archivo original con hash y fecha de descarga.
2. Registrar URL, licencia, unidad y metodología en `data/metadata/`.
3. Versionar cada corte (`vintage`) y no sobrescribir revisiones.
4. Validar contra una segunda fuente cuando exista (ej. homicidios SESNSP vs. INEGI).
5. Documentar cualquier transformación en el ETL.
