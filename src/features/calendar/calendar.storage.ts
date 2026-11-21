import type { CalendarEvent } from './calendar.types';

const STORAGE_KEY = 'studonium.calendar.v1';

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (value < '1900-01-01' || value > '2100-12-31') return false;

  const date = new Date(`${value}T12:00:00`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10))
  );
}

function isValidTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

export function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (typeof value !== 'object' || value === null) return false;

  const event = value as Record<string, unknown>;

  return (
    typeof event.id === 'string' &&
    event.id.length > 0 &&
    typeof event.title === 'string' &&
    event.title.trim().length > 0 &&
    event.title.length <= 100 &&
    typeof event.description === 'string' &&
    event.description.length <= 2000 &&
    ['task', 'exam', 'event'].includes(String(event.type)) &&
    isValidDate(event.date) &&
    isValidTime(event.startTime) &&
    isValidTime(event.endTime) &&
    typeof event.allDay === 'boolean' &&
    (event.allDay || event.endTime > event.startTime) &&
    typeof event.color === 'string' &&
    /^#[0-9a-f]{6}$/i.test(event.color) &&
    (
      event.reminderSeconds === undefined ||
      event.reminderSeconds === null ||
      (
        typeof event.reminderSeconds === 'number' &&
        Number.isInteger(event.reminderSeconds) &&
        event.reminderSeconds >= 0 &&
        event.reminderSeconds <= 2678399
      )
    ) &&
    typeof event.completed === 'boolean' &&
    (event.type === 'task' || event.completed === false)
  );
}

export function readEvents(): {
  events: CalendarEvent[];
  error: string;
} {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return { events: [], error: '' };
    }

    const parsed: unknown = JSON.parse(saved);

    if (
      !Array.isArray(parsed) ||
      !parsed.every(isCalendarEvent) ||
      new Set(parsed.map((event) => event.id)).size !== parsed.length
    ) {
      throw new Error('Invalid saved calendar');
    }

    return { events: parsed, error: '' };
  } catch {
    return {
      events: [],
      error:
        'No hemos podido recuperar la agenda guardada. No se ha borrado ni sobrescrito. Comprueba que el navegador permite el almacenamiento; si ya tenías eventos, evita guardar cambios hasta revisar el problema.',
    };
  }
}

export function writeEvents(events: CalendarEvent[]): void {
  if (
    !events.every(isCalendarEvent) ||
    new Set(events.map((event) => event.id)).size !== events.length
  ) {
    throw new Error('Invalid calendar data');
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event('studonium:calendar-changed'));
}