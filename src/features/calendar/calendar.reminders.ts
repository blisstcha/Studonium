import type { CalendarEvent } from './calendar.types';

export function getEventStart(event: CalendarEvent): number {
  const time = event.allDay ? '00:00' : event.startTime;

  return new Date(`${event.date}T${time}:00`).getTime();
}

export function getReminderTime(event: CalendarEvent): number | null {
  if (event.reminderSeconds == null) return null;

  const start = getEventStart(event);
  if (!Number.isFinite(start)) return null;

  return start - event.reminderSeconds * 1000;
}

export function formatReminder(seconds: number | null | undefined): string {
  if (seconds == null) return 'Sin recordatorio';
  if (seconds === 0) return 'Al empezar';

  let remaining = seconds;

  const days = Math.floor(remaining / 86400);
  remaining %= 86400;

  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;

  const minutes = Math.floor(remaining / 60);
  const rest = remaining % 60;

  const parts: string[] = [];

  if (days) parts.push(`${days} d`);
  if (hours) parts.push(`${hours} h`);
  if (minutes) parts.push(`${minutes} min`);
  if (rest) parts.push(`${rest} s`);

  return `${parts.join(' ')} antes`;
}

export function formatReminderDate(event: CalendarEvent): string {
  const timestamp = getReminderTime(event);
  if (timestamp === null) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}