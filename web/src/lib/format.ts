import { isoToLocalDate } from "@/lib/dates";

export const LOCALE = "es-MX";

const shortMonthFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  year: "numeric",
});

const longMonthFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Cifras tabulares en la UI. Ajusta decimales a la magnitud para no mostrar
 * precisión falsa (PIB per cápita sin decimales, tasas con uno).
 */
export function formatNumber(value: number): string {
  const absolute = Math.abs(value);
  const maximumFractionDigits =
    absolute >= 1000 ? 0 : absolute > 0 && absolute < 1 ? 3 : 1;

  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatSignedNumber(value: number): string {
  if (value === 0) return "0";
  const sign = value > 0 ? "+" : "−";
  return `${sign}${formatNumber(Math.abs(value))}`;
}

/** "dic 1994" */
export function formatPeriodShort(isoDate: string): string {
  return shortMonthFormatter.format(isoToLocalDate(isoDate));
}

/** "diciembre de 1994" */
export function formatPeriodLong(isoDate: string): string {
  return capitalize(longMonthFormatter.format(isoToLocalDate(isoDate)));
}

/** "diciembre de 1994", sin mayúscula inicial (para texto corrido). */
export function formatPeriodInline(isoDate: string): string {
  return longMonthFormatter.format(isoToLocalDate(isoDate));
}

/** "1 de diciembre de 1994" */
export function formatFullDate(isoDate: string): string {
  return fullDateFormatter.format(isoToLocalDate(isoDate));
}

export function formatMonthLabel(month: string): string {
  return formatPeriodShort(`${month}-01`);
}

export function formatMonthRange(fromMonth: string, toMonth: string): string {
  return `${formatMonthLabel(fromMonth)} – ${formatMonthLabel(toMonth)}`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(
    value,
  );
}
