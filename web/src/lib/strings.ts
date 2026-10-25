import type {
  AccessType,
  DataStatus,
  Dimension,
  Frequency,
} from "@/lib/types";
import type { MovingAverage } from "@/lib/url-state";

export const strings = {
  meta: {
    title: "Sexenio — Indicadores de México",
    description:
      "Explorador de indicadores de México para comparar presidentes y sexenios con datos trazables. El índice compuesto lo construye el usuario.",
  },
  root: {
    body: "Redirigiendo al explorador…",
    action: "Ir a Explorar",
  },
  nav: {
    ariaLabel: "Secciones del sitio",
    explorar: "Explorar",
    comparar: "Comparar",
    constructor: "Constructor",
    metodologia: "Metodología",
  },
  header: {
    brand: "Sexenio",
    tagline: "México en perspectiva",
    export: "Exportar CSV",
    exportReady: "Exportar la vista actual a CSV",
    exportDisabled: "No hay una vista con datos para exportar.",
    exportWithState: "Exportar CSV: {state}",
    skip: "Saltar al contenido",
  },
  fixture: {
    title: "Datos sintéticos de desarrollo",
    body: "Las cifras de esta vista no son reales. Sirven para construir la interfaz antes de la ingesta de fuentes oficiales.",
    bodyShort: "Las cifras no son reales.",
    vintage: "Corte {vintage}",
    origin: "Origen: {origin}",
  },
  sidebar: {
    title: "Indicadores",
    subtitle: "Catálogo v0",
    searchLabel: "Buscar indicadores",
    searchPlaceholder: "Nombre o tema",
    dimensionLabel: "Dimensión",
    allDimensions: "Todas las dimensiones",
    count: "{available} con datos · {total} en catálogo",
    mobileCount: "{available} con datos",
    results: "{count} indicadores visibles",
    emptyTitle: "Ningún indicador coincide",
    emptyBody: "Prueba con otra búsqueda o cambia la dimensión.",
    clearFilters: "Limpiar filtros",
    available: "Fixture",
    upcoming: "Sin datos",
    upcomingHint:
      "El indicador está en el catálogo; sus datos se incorporan en una siguiente entrega.",
    active: "Indicador activo",
    open: "Indicadores",
    close: "Cerrar catálogo",
    sheetTitle: "Catálogo de indicadores",
    note: "Solo los indicadores con datos se pueden explorar.",
  },
  explorer: {
    sourceTrigger: "Fuente y metodología",
    lastValue: "Último valor: {value} · {period}",
    viewLabel: "Vista",
    viewLevel: "Nivel",
    viewDelta: "Cambio acumulado",
    viewIndex: "Índice 100",
    rangeLabel: "Periodo",
    fromLabel: "Desde",
    toLabel: "Hasta",
    scaleLabel: "Escala",
    scaleLinear: "Lineal",
    scaleLog: "Logarítmica",
    maLabel: "Suavizado",
    maNone: "Ninguno",
    ma3: "Media móvil 3 meses",
    ma12: "Media móvil 12 meses",
    sourceLabel: "Fuente",
    invalidUrl:
      "Se ignoraron parámetros no válidos de la URL: {keys}. Se usaron los valores predeterminados.",
    cleanUrl: "Limpiar URL",
    maNotApplicable:
      "El suavizado no aplica a una serie {frequency}; se muestra la serie original.",
    logFallback:
      "La escala logarítmica requiere valores positivos. Se muestra en escala lineal.",
    preliminaryNote:
      "La serie incluye cifras preliminares; revisa el estatus en la tabla.",
    estimatedNote:
      "La serie incluye valores estimados; revisa el estatus en la tabla.",
    inProgress: "en curso",
    viewDescription: {
      level: "Valor observado en cada periodo.",
      delta: "Diferencia acumulada desde el primer dato del periodo visible.",
      index: "Valor relativo al primer dato del periodo visible, base 100.",
    },
    controlsLegend: "Controles de la gráfica",
  },
  comparator: {
    eyebrow: "Comparador",
    title: "Sexenios en perspectiva",
    subtitle:
      "Compara cómo evolucionó un indicador dentro de cada gestión. Puedes alinear por mes de sexenio o por fecha calendario; la tendencia heredada es una referencia, no una proyección.",
    termsLegend: "Sexenios",
    termsHelp:
      "Elige uno o varios. Hasta cuatro se superponen; con más de cuatro se muestran small multiples.",
    keepOneTerm: "Debe quedar al menos un sexenio seleccionado.",
    indicatorsLegend: "Indicadores",
    indicatorsHelp:
      "Puedes comparar más de un indicador; cada uno se muestra en su propia gráfica para no mezclar unidades.",
    keepOneIndicator: "Debe quedar al menos un indicador seleccionado.",
    alignLabel: "Alinear por",
    alignTerm: "Mes de sexenio",
    alignCalendar: "Fecha calendario",
    sourceLabel: "Fuente de homicidios",
    sourceHelp:
      "La fuente solo aplica a homicidios; las demás series conservan su fuente primaria.",
    sourceDiscrepancy:
      "INEGI publica certificados de defunción anuales; SESNSP, denuncias mensuales. No son intercambiables ni se empalman al cambiar de fuente.",
    reset: "Restablecer comparación",
    smallMultiplesTerms:
      "Small multiples por sexenio: hay más de cuatro series seleccionadas.",
    smallMultiplesIndicators:
      "Small multiples por indicador: hay más de un indicador seleccionado.",
    smallMultiplesBoth:
      "Small multiples por indicador y por sexenio: la selección excede cuatro series y un indicador.",
    trendNote:
      "Línea punteada de color: tendencia heredada, extrapolación lineal de los 36 meses previos al inicio del sexenio. No es una proyección. La escala prioriza los datos observados; una tendencia muy alejada puede quedar fuera del área visible.",
    inProgressNote:
      "La prolongación punteada de un sexenio en curso solo indica que el periodo continúa; no estima valores faltantes.",
    trendHidden:
      "La tendencia heredada de {terms} queda fuera del rango visible para no comprimir los datos observados; la columna Tendencia del resumen indica que está disponible.",
    breakNote:
      "La línea vertical roja marca un quiebre metodológico; no se promedian periodos a través de él.",
    noSeries:
      "No hay observaciones ni tendencia heredada para este indicador en los sexenios seleccionados.",
    trendOnly:
      "Sin datos observados en el sexenio; solo se muestra la tendencia heredada como referencia.",
    axisTerm: "Eje X: meses desde el inicio del sexenio.",
    axisCalendar: "Eje X: fechas calendario.",
    source: "Fuente",
    sourceLink: "Consultar fuente",
    tableTitle: "Resumen por sexenio",
    tableRows: "{count} combinaciones indicador–sexenio",
    tableRowOne: "{count} combinación indicador–sexenio",
    tableCaption:
      "Resumen de {count} combinaciones indicador–sexenio, alineación por {align}. Promedios solo para sexenios cerrados con cobertura suficiente.",
    tableCaptionOne:
      "Resumen de {count} combinación indicador–sexenio, alineación por {align}. Promedios solo para sexenios cerrados con cobertura suficiente.",
    indicator: "Indicador",
    status: "Estatus",
    average: "Promedio",
    change: "Cambio acumulado",
    min: "Mínimo",
    max: "Máximo",
    coverage: "Cobertura",
    observations: "Obs.",
    trend: "Tendencia",
    yes: "Sí",
    no: "No",
    closed: "Cerrado",
    noData: "Sin datos",
    break: "Quiebre",
    averageInProgress:
      "El sexenio está en curso; no se promedia como si estuviera cerrado.",
    averageBreak:
      "El sexenio cruza un quiebre metodológico; no se promedia a través de él.",
    averageOutside:
      "El sexenio queda fuera del periodo con cobertura de la fuente.",
    averageCoverage:
      "La cobertura del sexenio es menor a 80%; no se muestra promedio.",
    averageNoData: "No hay observaciones en el sexenio.",
    averageUnavailable: "Promedio no disponible.",
    coverageTitle:
      "{observed} de {expected} periodos {frequency} esperados en el sexenio.",
    trendTitle:
      "Observaciones en los 36 meses previos: {count}. Se requieren al menos 3 para estimar la tendencia.",
    tableNoteAverages:
      "Promedio y cambio acumulado solo se calculan para sexenios cerrados, con cobertura de al menos 80% y sin quiebres metodológicos. El sexenio en curso nunca se promedia como cerrado.",
    tableNoteCoverage:
      "Cobertura = observaciones disponibles / periodos esperados según la frecuencia de la fuente, hasta el corte o el fin del sexenio.",
    tableNoteTrend:
      "La tendencia heredada se estima con las observaciones de los 36 meses previos al inicio de cada sexenio.",
    dataTitle: "Datos de la comparación",
    dataSummary:
      "{count} observaciones alineadas. Abre la tabla para revisar cada punto.",
    dataSummaryOne:
      "{count} observación alineada. Abre la tabla para revisar el punto.",
    dataCaption:
      "Datos observados de {indicators}. {count} observaciones; Mes cuenta desde el inicio de cada sexenio.",
    dataCaptionOne:
      "Datos observados de {indicators}. {count} observación; Mes cuenta desde el inicio del sexenio.",
    dataMonth: "Mes",
    dataDate: "Fecha",
    dataSource: "Fuente",
    notesTitle: "Cómo leer esta comparación",
    notesTerms:
      "En la alineación por mes de sexenio, el mes 1 es el primer mes de cada gestión; el eje llega hasta el mes 72. En la alineación calendario, cada línea conserva sus fechas reales.",
    notesInProgress:
      "Sheinbaum aparece como sexenio en curso. Su línea sólida llega hasta el último dato publicado; la extensión punteada no es una estimación.",
    notesBreak:
      "Los quiebres metodológicos se señalan en la gráfica y bloquean el promedio del sexenio afectado. Las series con distinta metodología no se empalman.",
    sourcesTitle: "Fuentes de esta vista",
    sourcesBody:
      "Cada gráfica y cada fila del resumen remiten a la fuente primaria. La fecha de corte y el estatus de cada observación están en el tooltip y en la tabla.",
  },
  metodologia: {
    eyebrow: "Metodología",
    title: "Cobertura, fuentes y límites",
    subtitle:
      "Esta página reúne la matriz de cobertura indicador × año y las fuentes que alimentan el explorador. Los huecos y quiebres se muestran tal como están en los datos; no se interpolan.",
    sourcesTitle: "Fuentes utilizadas",
    sourcesDescription:
      "Cada indicador conserva su fuente principal y, cuando existe, su fuente alternativa. Las licencias y notas son responsabilidad de la fuente original.",
    indicatorCatalogTitle: "Indicadores y metadatos",
    indicatorCatalogDescription:
      "Ficha generada desde el catálogo de indicadores: unidad, frecuencia, dirección, cobertura, fuente y quiebres declarados.",
    unit: "Unidad",
    license: "Licencia",
    notesTitle: "Notas de lectura",
    noteOfficial:
      "Todas las series son datos publicados por instituciones oficiales o por organismos internacionales que armonizan información de México. Los fixtures nunca se presentan como datos reales.",
    noteComparability:
      "Una celda con dato no implica comparabilidad perfecta: pueden existir cambios de base, cobertura, frecuencia o metodología. Los quiebres declarados se marcan en la matriz y en las gráficas.",
    noteSources:
      "SESNSP mide denuncias; INEGI mide defunciones registradas. Son series relacionadas, no intercambiables. Las fuentes alternativas se muestran en paralelo en el explorador.",
    noteM4:
      "Para completar los 12 indicadores se usaron series anuales del Banco Mundial en inversión/PIB, Gini, ingresos tributarios y gasto en salud, y el índice de remuneraciones medias reales de INEGI como proxy del salario formal. Estas decisiones están declaradas en la metodología de cada indicador.",
  },
  builder: {
    eyebrow: "Constructor",
    title: "Construye tu índice",
    subtitle:
      "Elige al menos tres indicadores, ajusta sus pesos y observa cómo cambia el orden. El índice es tuyo: no es un ranking oficial ni una recomendación.",
    startNote:
      "Punto de partida editable: tres indicadores de cobertura amplia y pesos iguales. Agrega o quita indicadores para construir tu propia comparación.",
    exampleBadge: "Ejemplo editable",
    inProgressExcluded:
      "Sexenio en curso; no se incluye en el ranking ni se promedia contra periodos cerrados.",
    vintage: "Corte {vintage}",
    indicatorsLegend: "Indicadores",
    indicatorsHelp:
      "Selecciona al menos tres. La cobertura se evalúa por sexenio; si un indicador falta, ese sexenio se excluye del ranking.",
    selectedCount: "{selected} de {total} seleccionados",
    minIndicators:
      "Elige al menos {count} indicadores para calcular el índice.",
    weightsLegend: "Pesos",
    weightsHelp:
      "Los controles van de 0 a 100. El índice normaliza automáticamente la suma a 100%.",
    weightLabel: "Peso de {indicator}",
    weightShort: "Peso",
    weightShare: "{share}% del índice",
    equalWeights: "Igualar pesos",
    normalizationLegend: "Normalización",
    normalizationZscore: "Z-score",
    normalizationMinmax: "Min-max",
    normalizationZHelp:
      "Cada indicador se centra en su media y se divide por su desviación estándar. Los valores pueden ser negativos.",
    normalizationMinmaxHelp:
      "Cada indicador se escala de 0 a 100 entre el mínimo y el máximo de los sexenios incluidos.",
    directionUp: "Más es mejor",
    directionDown: "Más es peor",
    reset: "Restablecer constructor",
    rankingTitle: "Ranking construido",
    rankingDescriptionZ:
      "El puntaje es la suma ponderada de los valores z. Solo se rankean sexenios cerrados con todos los indicadores seleccionados.",
    rankingDescriptionMinmax:
      "El puntaje es la suma ponderada de los valores normalizados de 0 a 100. Solo se rankean sexenios cerrados con todos los indicadores seleccionados.",
    rankingNote:
      "El orden depende de los indicadores y pesos elegidos. Cambia un peso para ver cómo se mueve.",
    rankingBarNote:
      "La barra compara el puntaje con el resto de los sexenios incluidos; no es un porcentaje de cumplimiento.",
    position: "Pos.",
    term: "Sexenio",
    indexScore: "Índice",
    noRankingTitle: "Faltan indicadores",
    noRankingBody:
      "El constructor requiere al menos tres indicadores para formar un índice. Agrega uno o dos más para ver el ranking.",
    noEligibleTitle: "No hay sexenios comparables",
    noEligibleBody:
      "Ningún sexenio cerrado tiene datos para todos los indicadores seleccionados. Revisa la cobertura o quita un indicador.",
    excludedTitle: "Sexenios excluidos",
    excludedNote:
      "No se rellenan huecos con cero. Un sexenio entra al ranking solo si todos los indicadores seleccionados tienen promedio comparable.",
    reasonInProgress: "En curso",
    reasonBreak: "Quiebre metodológico",
    reasonOutside: "Fuera de cobertura",
    reasonLow: "Cobertura insuficiente",
    reasonNoData: "Sin datos",
    reasonUnavailable: "Promedio no disponible",
    breakdownTitle: "Desglose por indicador",
    breakdownDescription:
      "Cada celda muestra el valor normalizado por indicador. El puntaje final es la suma ponderada; el detalle de promedio, peso y aporte está en el título de cada celda.",
    normalized: "Normalizado",
    contribution: "Aporte",
    score: "Puntaje",
    rawAverage: "Promedio",
    sourceTitle: "Fuentes del índice",
    sourceNote:
      "Cada indicador conserva su fuente y frecuencia. Las series del Banco Mundial son anuales; las de INEGI y SESNSP tienen la cadencia indicada en el explorador.",
    sensitivityTitle: "Sensibilidad ±10 puntos",
    sensitivityDescription:
      "Para cada indicador se prueba subir y bajar 10 puntos de peso, renormalizando el resto. Si el orden cambia, se advierte.",
    sensitivityNoChanges:
      "Ninguna de las combinaciones probadas cambió el orden del ranking.",
    sensitivityChanged:
      "El orden cambia en {count} combinaciones de pesos. Revisa la sensibilidad antes de concluir.",
    sensitivityCase: "{indicator}: {delta} puntos",
    sensitivityOrder: "Orden resultante: {order}",
    sensitivityRangeTitle: "Rango de posiciones",
    sensitivityRangeColumn: "Rango",
    sensitivityRangeHelp:
      "Posición base y rango observado al mover cada peso ±10 puntos.",
    baseline: "Base",
    positionRange: "{min}–{max}",
    allZeroWeights:
      "Todos los pesos están en cero. Para calcular el índice se usa una ponderación igual; ajusta al menos un peso.",
    coverage: "Cobertura",
    termCount: "{available} de {total} sexenios cerrados",
  },
  sourceComparison: {
    title: "Fuentes en paralelo",
    description:
      "Las series disputadas se muestran una al lado de la otra. No se empalman: pueden diferir en unidad, frecuencia, cobertura y metodología.",
    observations: "{count} observaciones",
    active: "En gráfica",
    coverage: "Cobertura",
    vintage: "Corte",
    noData: "Sin datos",
    note:
      "La gráfica y la tabla usan la fuente seleccionada arriba. Esta comparación es informativa y no convierte una serie en la otra.",
  },
  events: {
    title: "Eventos en el periodo",
    count: "{count} eventos",
    description:
      "Los puntos negros de la gráfica marcan eventos históricos. Pasa el cursor sobre uno para ver su descripción y fuente; aquí están todos los del periodo.",
    source: "Consultar fuente del evento",
  },
  chart: {
    loading: "Cargando gráfica",
    sectionTitle: "Gráfica de la serie",
    aria: "Serie de {indicator} ({unit}), {count} observaciones entre {from} y {to}. Mínimo {min}, máximo {max}, último valor {last}. Vista: {view}. Suavizado: {ma}. Fuente: {source}. Estatus: {status}.",
    ariaEmpty: "Serie de {indicator} sin datos en el periodo seleccionado.",
    missing: "Sin dato",
    termRailLabel: "Sexenios en el periodo",
    indexBase: "índice (base 100)",
  },
  coverage: {
    title: "Cobertura anual",
    description: "Años con dato, huecos y quiebres metodológicos.",
    complete: "Con dato",
    partial: "Parcial",
    gap: "Sin dato",
    na: "No aplica",
    outside: "Fuera de cobertura",
    break: "Quiebre",
    yearAria: "{year}: {state}{breakNote}",
    breakNote: "; quiebre metodológico",
    breakTitle: "Quiebre: {note}",
    yearsWithData: "{withData} de {total} años con dato",
    range: "1994–2026",
    legendLabel: "Leyenda de cobertura",
    matrixTitle: "Matriz de cobertura por indicador y año",
    matrixDescription:
      "Cada celda indica si el indicador tiene datos para ese año con su fuente principal. Los huecos no se rellenan; los quiebres se marcan con una línea roja.",
    matrixCaption:
      "Cobertura anual de {indicators} indicadores con datos, de {from} a {to}.",
    matrixIndicator: "Indicador / fuente",
    matrixNote:
      "La matriz usa la fuente principal de cada indicador. Las series disputadas se muestran en paralelo en el explorador; la cobertura de la fuente alternativa puede diferir.",
  },
  table: {
    title: "Tabla de datos",
    caption:
      "{indicator} · {view}. Unidad: {unit}. {count} observaciones. Periodo {from} a {to}.",
    date: "Periodo",
    value: "Valor",
    term: "Sexenio",
    source: "Fuente",
    status: "Estatus",
    sortBy: "Ordenar por {column}",
    empty: "No hay observaciones que mostrar en este periodo.",
    scrollHint: "Desplázate horizontalmente para ver todas las columnas.",
    rows: "{count} filas",
  },
  drawer: {
    title: "Fuente y metodología",
    close: "Cerrar",
    definition: "Definición",
    methodology: "Metodología",
    coverage: "Cobertura",
    source: "Fuente",
    status: "Estatus de los datos",
    breaks: "Quiebres metodológicos",
    noBreaks: "Sin quiebres declarados en el periodo.",
    alternates: "Fuentes alternativas",
    license: "Licencia",
    access: "Acceso",
    name: "Nombre",
    direction: "Dirección",
    yearsWithData: "Años con dato",
    alternateCount: "{count} observaciones",
    dataUrl: "URL del dato",
    lastVintage: "Última descarga",
    frequency: "Frecuencia",
    observationCount: "Observaciones",
    coveragePeriod: "Periodo con datos",
    openSource: "Consultar fuente",
    fixtureNote:
      "Datos sintéticos de desarrollo. No son cifras reales ni provienen de la fuente.",
    notAvailable: "Sin datos en esta vista",
    directionUp: "Más es mejor",
    directionDown: "Más es peor",
  },
  states: {
    emptyTitle: "Sin datos en este periodo",
    emptyBody:
      "No hay observaciones de {indicator} entre {from} y {to}. La cobertura disponible va de {coverageFrom} a {coverageTo}.",
    emptyNoCoverage:
      "No hay observaciones disponibles de {indicator} en esta fuente.",
    widen: "Ampliar el periodo",
    sourceEmptyTitle: "La fuente seleccionada no tiene datos",
    sourceEmptyBody:
      "No hay observaciones de {indicator} con {source}. La fuente {primary} sí tiene datos disponibles.",
    usePrimary: "Ver {source}",
    indexTitle: "No se puede calcular el índice",
    indexBody:
      "El primer valor del periodo visible es cero o negativo. Elige otro periodo o vuelve a la vista de nivel.",
    backToLevel: "Volver a nivel",
    errorEyebrow: "Aviso",
    errorTitle: "No se pudo cargar la vista",
    errorBody:
      "Ocurrió un error al preparar los datos. Puedes reintentar o volver al explorador.",
    errorRetry: "Reintentar",
    errorDetail: "Detalle técnico",
    errorBack: "Volver a Explorar",
    errorBackComparator: "Volver a Comparar",
    errorBackConstructor: "Volver al Constructor",
  },
  footer: {
    note: "Datos sintéticos de desarrollo",
    officialNote: "Fuentes oficiales",
    vintage: "Corte {vintage}",
    methodology: "Metodología y fuentes",
    noRanking:
      "El índice lo construye el usuario; no hay un ranking único.",
  },
  notFound: {
    eyebrow: "404",
    title: "Página no encontrada",
    body: "La ruta solicitada no existe o cambió de lugar.",
    action: "Ir a Explorar",
  },
  ui: {
    month: "mes",
    year: "año",
  },
  placeholders: {
    constructorTitle: "Constructor de índice",
    constructorBody:
      "Aquí se podrá construir un índice propio con pesos ajustables, normalización declarada y análisis de sensibilidad.",
    metodologiaTitle: "Metodología y fuentes",
    metodologiaBody:
      "Aquí se reunirán las fichas de indicadores, fuentes, sexenios, licencias y limitaciones conocidas.",
    status: "En preparación",
    note: "Esta sección se construye después de cerrar el explorador. Mientras tanto, el catálogo y los datos disponibles están en Explorar.",
    back: "Ir a Explorar",
  },
} as const;

export const dimensionLabels: Record<Dimension, string> = {
  economia: "Economía",
  empleo: "Empleo",
  social: "Social",
  seguridad: "Seguridad",
  fiscal: "Fiscal",
  instituciones: "Instituciones",
  energia: "Energía",
  democracia: "Democracia",
};

export const frequencyLabels: Record<Frequency, string> = {
  monthly: "mensual",
  quarterly: "trimestral",
  annual: "anual",
  biennial: "bienal",
};

export const monthShortLabels = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export const eventTypeLabels: Record<string, string> = {
  economia: "Economía",
  empleo: "Empleo",
  social: "Social",
  seguridad: "Seguridad",
  fiscal: "Fiscal",
  instituciones: "Instituciones",
  energia: "Energía",
  democracia: "Democracia",
  salud: "Salud",
  desastre: "Desastre",
};

export const statusLabels: Record<DataStatus, string> = {
  revisado: "Revisado",
  preliminar: "Preliminar",
  estimado: "Estimado",
  disputado: "Disputado",
  fixture: "Fixture",
};

export const viewLabels = {
  level: strings.explorer.viewLevel,
  delta: strings.explorer.viewDelta,
  index: strings.explorer.viewIndex,
} as const;

export const accessLabels: Record<AccessType, string> = {
  api: "API",
  csv: "CSV",
  mixed: "Mixta",
};

const SOURCE_SHORT_NAMES: Record<string, string> = {
  inegi: "INEGI",
  sesnsp: "SESNSP",
  shcp: "SHCP",
  coneval: "CONEVAL",
  conapo: "CONAPO",
  banxico: "Banxico",
  imss: "IMSS",
  salud: "Salud",
  oms: "OMS",
  wb: "Banco Mundial",
  imf: "FMI",
  oecd: "OCDE",
  vdem: "V-Dem",
  wjp: "WJP",
  transparency: "TI",
};

export function sourceShortName(id: string, fallback: string): string {
  return SOURCE_SHORT_NAMES[id] ?? fallback;
}

export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export function movingAverageLabel(ma: MovingAverage): string {
  if (ma === 3) return strings.explorer.ma3;
  if (ma === 12) return strings.explorer.ma12;
  return strings.explorer.maNone;
}
