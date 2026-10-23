export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const ISO_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isMonthString(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

export function isIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value);
}

/** Índice absoluto del mes, útil para aritmética y comparaciones. */
export function monthIndex(month: string): number {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  return year * 12 + (monthNumber - 1);
}

export function monthFromIndex(index: number): string {
  const year = Math.floor(index / 12);
  const monthNumber = (index % 12) + 1;
  return `${String(year).padStart(4, "0")}-${String(monthNumber).padStart(2, "0")}`;
}

export function addMonths(month: string, amount: number): string {
  return monthFromIndex(monthIndex(month) + amount);
}

export function monthsBetween(fromMonth: string, toMonth: string): number {
  return monthIndex(toMonth) - monthIndex(fromMonth);
}

export function isoMonthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function startOfMonthIso(month: string): string {
  return `${month}-01`;
}

export function endOfMonthIso(month: string): string {
  const index = monthIndex(month);
  const year = Math.floor(index / 12);
  const monthNumber = (index % 12) + 1;
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

/** Mediodía local para evitar corrimientos de zona horaria al mostrar. */
export function isoToLocalDate(isoDate: string): Date {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function isoToTimestamp(isoDate: string): number {
  return isoToLocalDate(isoDate).getTime();
}

export function monthStartTimestamp(month: string): number {
  return isoToTimestamp(startOfMonthIso(month));
}

export function monthEndTimestamp(month: string): number {
  return isoToTimestamp(endOfMonthIso(month));
}

export function timestampToMonth(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function clampMonth(
  month: string,
  minimum: string,
  maximum: string,
): string {
  if (month < minimum) return minimum;
  if (month > maximum) return maximum;
  return month;
}
