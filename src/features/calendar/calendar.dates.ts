export const WEEKDAYS = [
  'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom',
];

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function moveMonth(date: Date, amount: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
    12,
  );
}

export function getMonthDays(month: Date): Date[] {
  const firstDay = startOfMonth(month);

  // En JavaScript, domingo es 0. Aquí la semana empieza en lunes.
  const mondayOffset = (firstDay.getDay() + 6) % 7;

  return Array.from({ length: 42 }, (_, index) =>
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1 - mondayOffset + index,
      12,
    ),
  );
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}