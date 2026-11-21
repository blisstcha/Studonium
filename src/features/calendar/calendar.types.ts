export type EventType = 'task' | 'exam' | 'event';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  completed: boolean;
  reminderSeconds?: number | null;
}

export const EVENT_LABELS: Record<EventType, string> = {
  task: 'Tarea',
  exam: 'Examen',
  event: 'Evento',
};

export const EVENT_COLORS = [
  { name: 'Lila', value: '#A78BCC' },
  { name: 'Rosa', value: '#D99AAF' },
  { name: 'Azul', value: '#86ABD3' },
  { name: 'Verde', value: '#85B39A' },
  { name: 'Amarillo', value: '#D6B65F' },
  { name: 'Coral', value: '#DB927A' },
];