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
      "Explorador de indicadores de México para comparar presidentes y sexenios con datos trazables. Sin ranking por defecto.",
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
    exportDisabled:
      "La exportación CSV estará disponible cuando la vista use datos reales.",
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
    inProgress: "en curso",
    viewDescription: {
      level: "Valor observado en cada periodo.",
      delta: "Diferencia acumulada desde el primer dato del periodo visible.",
      index: "Valor relativo al primer dato del periodo visible, base 100.",
    },
    controlsLegend: "Controles de la gráfica",
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
  },
  footer: {
    note: "Datos sintéticos de desarrollo",
    vintage: "Corte {vintage}",
    methodology: "Metodología y fuentes",
    noRanking: "Sin ranking por defecto: el índice lo construye el usuario.",
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
    compararTitle: "Comparador de sexenios",    compararBody:
      "Aquí se podrán alinear hasta cuatro sexenios por mes de gestión, con tendencia heredada y small multiples.",
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
