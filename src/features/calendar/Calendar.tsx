import { useEffect, useState } from 'react';
import {
  WEEKDAYS,
  dateKey,
  formatFullDate,
  formatMonth,
  getMonthDays,
  moveMonth,
  startOfMonth,
} from './calendar.dates';
import { EVENT_LABELS } from './calendar.types';
import type { CalendarEvent } from './calendar.types';
import { readEvents, writeEvents } from './calendar.storage';
import EventEditor from './EventEditor';
import './calendar.css';
import {
  formatReminder,
  formatReminderDate,
} from './calendar.reminders';

function sortEvents(first: CalendarEvent, second: CalendarEvent): number {
  if (first.allDay !== second.allDay) {
    return first.allDay ? -1 : 1;
  }

  if (!first.allDay) {
    const byTime = first.startTime.localeCompare(second.startTime);
    if (byTime !== 0) return byTime;
  }

  return first.title.localeCompare(second.title, 'es');
}

function eventSchedule(event: CalendarEvent): string {
  return event.allDay
    ? 'Todo el día'
    : `${event.startTime}–${event.endTime}`;
}

export default function Calendar() {
  const [today, setToday] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [loaded] = useState(readEvents);
  const [events, setEvents] = useState<CalendarEvent[]>(loaded.events);
  const [storageBlocked] = useState(Boolean(loaded.error));
  const [message, setMessage] = useState(loaded.error);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [quickDeleteId, setQuickDeleteId] = useState<string | null>(null);

  const days = getMonthDays(visibleMonth);
  const todayKey = dateKey(today);
  const selectedKey = dateKey(selectedDate);

  const selectedEvents = events
    .filter((event) => event.date === selectedKey)
    .sort(sortEvents);

  useEffect(() => {
    const updateToday = () => setToday(new Date());
    const interval = window.setInterval(updateToday, 30_000);

    window.addEventListener('focus', updateToday);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateToday);
    };
  }, []);

  function navigateMonth(amount: number) {
    const nextMonth = moveMonth(visibleMonth, amount);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
  }

  function goToToday() {
    const now = new Date();
    setToday(now);
    setVisibleMonth(startOfMonth(now));
    setSelectedDate(now);
  }

  function selectDay(date: Date) {
    setSelectedDate(date);
    setVisibleMonth(startOfMonth(date));
  }

  function persistEvents(nextEvents: CalendarEvent[]): boolean {
    if (storageBlocked) {
      setMessage(
        'El guardado está bloqueado porque no se pudo recuperar la agenda anterior. No sobrescribiremos los datos. Revisa el almacenamiento y recarga la página.',
      );
      return false;
    }

    try {
      // Actualizamos la pantalla solo si el guardado ha funcionado.
      writeEvents(nextEvents);
      setEvents(nextEvents);
      return true;
    } catch {
      setMessage(
        'No se ha podido guardar el cambio. El almacenamiento puede estar bloqueado o lleno. Los datos anteriores se conservan.',
      );
      return false;
    }
  }

  function openNewEvent() {
    setEditingEvent(null);
    setEditorOpen(true);
  }

  function openExistingEvent(event: CalendarEvent) {
    setEditingEvent(event);
    setEditorOpen(true);
  }

  function saveEvent(event: CalendarEvent): boolean {
    const exists = events.some((item) => item.id === event.id);

    const nextEvents = exists
      ? events.map((item) => item.id === event.id ? event : item)
      : [...events, event];

    if (!persistEvents(nextEvents)) return false;

    const eventDate = new Date(`${event.date}T12:00:00`);
    setSelectedDate(eventDate);
    setVisibleMonth(startOfMonth(eventDate));
    setEditorOpen(false);
    setEditingEvent(null);
    setMessage(exists ? 'Cambios guardados en tu agenda.' : 'Nuevo plan guardado.');
    return true;
  }

  function deleteEvent(id: string): boolean {
    if (!persistEvents(events.filter((event) => event.id !== id))) {
      return false;
    }
  
    setEditorOpen(false);
    setEditingEvent(null);
    setQuickDeleteId(null);
    setMessage('Plan eliminado de tu agenda.');
    return true;
  }
  
  function cancelQuickDelete(id: string) {
    setQuickDeleteId(null);
    document.getElementById(`calendar-delete-${id}`)?.focus();
  }
  function toggleTask(event: CalendarEvent) {
    if (event.type !== 'task') return;

    const nextEvents = events.map((item) =>
      item.id === event.id
        ? { ...item, completed: !item.completed }
        : item,
    );

    if (persistEvents(nextEvents)) {
      setMessage(
        event.completed
          ? 'Tarea marcada como pendiente.'
          : '¡Un paso más! Tarea completada.',
      );
    }
  }

  return (
    <section
      className="studonium-calendar"
      aria-labelledby="calendar-title"
    >
      <header className="studonium-calendar-intro">
        <div>
          <p className="studonium-calendar-eyebrow">
            HAZ ESPACIO PARA LO QUE IMPORTA
          </p>
          <h1 id="calendar-title">
            Tu agenda <span aria-hidden="true">✷</span>
          </h1>
          <p>Un lugar para tus planes, tus metas y tus ratitos libres.</p>
        </div>

        <button
          type="button"
          className="studonium-calendar-primary"
          onClick={openNewEvent}
          disabled={storageBlocked}
        >
          <span aria-hidden="true">＋</span> Nuevo plan
        </button>
      </header>

      {message && (
        <p className="studonium-calendar-message" role="status">
          {message}
        </p>
      )}

      <div className="studonium-calendar-layout">
        <section
          className="studonium-calendar-month"
          aria-labelledby="calendar-month-title"
        >
          <div className="studonium-calendar-toolbar">
            <h2
              id="calendar-month-title"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatMonth(visibleMonth)}
            </h2>

            <div className="studonium-calendar-controls">
              <button type="button" onClick={goToToday}>
                Hoy
              </button>

              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                aria-label="Mes anterior"
              >
                <span aria-hidden="true">←</span>
              </button>

              <button
                type="button"
                onClick={() => navigateMonth(1)}
                aria-label="Mes siguiente"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          <div className="studonium-calendar-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div
            className="studonium-calendar-days"
            role="group"
            aria-label={`Días de ${formatMonth(visibleMonth)}`}
          >
            {days.map((day) => {
              const key = dateKey(day);
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              const isOutside =
                day.getMonth() !== visibleMonth.getMonth() ||
                day.getFullYear() !== visibleMonth.getFullYear();

              const dayEvents = events
                .filter((event) => event.date === key)
                .sort(sortEvents);

              const classes = [
                'studonium-calendar-day',
                isToday ? 'is-today' : '',
                isSelected ? 'is-selected' : '',
                isOutside ? 'is-outside' : '',
              ].filter(Boolean).join(' ');

              return (
                <button
                  key={key}
                  type="button"
                  className={classes}
                  aria-label={`${formatFullDate(day)}. ${dayEvents.length} planes`}
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  onClick={() => selectDay(day)}
                >
                  <span className="studonium-calendar-number">
                    {day.getDate()}
                  </span>

                  {isToday && (
                    <span
                      className="studonium-calendar-today-dot"
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className="studonium-calendar-day-events"
                    aria-hidden="true"
                  >
                    {dayEvents.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className={`studonium-calendar-event-chip ${
                          event.completed ? 'is-completed' : ''
                        }`}
                        style={{ borderLeftColor: event.color }}
                      >
                        <span
                          className="studonium-calendar-event-dot"
                          style={{ backgroundColor: event.color }}
                        />
                        <span>{event.title}</span>
                      </span>
                    ))}

                    {dayEvents.length > 2 && (
                      <span className="studonium-calendar-more">
                        +{dayEvents.length - 2} más
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="studonium-calendar-legend">
            <span>
              <i className="studonium-calendar-legend-today" />
              Hoy
            </span>
            <span>
              <i className="studonium-calendar-legend-selected" />
              Día seleccionado
            </span>
          </div>
        </section>

        <aside
          className="studonium-calendar-details"
          aria-labelledby="calendar-selected-title"
        >
          <p className="studonium-calendar-eyebrow">UN VISTAZO A TU DÍA</p>

          <div aria-live="polite" aria-atomic="true">
            <h2 id="calendar-selected-title">
              {formatFullDate(selectedDate)}
            </h2>
            <p className="studonium-calendar-day-count">
              {selectedEvents.length === 1
                ? '1 plan en tu agenda'
                : `${selectedEvents.length} planes en tu agenda`}
            </p>
          </div>

          <button
            type="button"
            className="studonium-calendar-add-day"
            onClick={openNewEvent}
            disabled={storageBlocked}
          >
            ＋ Añadir a este día
          </button>

          {selectedEvents.length === 0 ? (
            <div className="studonium-calendar-empty">
              <span
                className="studonium-calendar-empty-art"
                aria-hidden="true"
              >
                ✧
              </span>
              <h3>Un espacio para tus planes</h3>
              <p>
                Añade una tarea, un examen o algo que te haga ilusión.
                También hay espacio para descansar.
              </p>
            </div>
          ) : (
            <ul className="studonium-calendar-event-list">
              {selectedEvents.map((event) => (
                <li
                  key={event.id}
                  className={`studonium-calendar-event-detail ${
                    event.completed ? 'is-completed' : ''
                  }`}
                  style={{ borderLeftColor: event.color }}
                >
                  <div className="studonium-calendar-event-top">
  <span>
    <i
      className="studonium-calendar-event-dot"
      style={{ backgroundColor: event.color }}
    />
    {EVENT_LABELS[event.type]}
  </span>

  <div className="studonium-calendar-event-tools">
    <button
      type="button"
      className="studonium-calendar-edit-button"
      onClick={() => openExistingEvent(event)}
      aria-label={`Editar ${event.title}`}
      disabled={storageBlocked}
    >
      Editar
    </button>

    <button
      id={`calendar-delete-${event.id}`}
      type="button"
      className="studonium-calendar-quick-trash"
      aria-label={`Eliminar ${event.title}`}
      aria-expanded={quickDeleteId === event.id}
      aria-controls={
        quickDeleteId === event.id
          ? `calendar-confirm-${event.id}`
          : undefined
      }
      title="Eliminar plan"
      disabled={storageBlocked}
      onClick={() =>
        setQuickDeleteId((current) =>
          current === event.id ? null : event.id,
        )
      }
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
      </svg>
    </button>
  </div>
</div>

{quickDeleteId === event.id && (
  <div
    id={`calendar-confirm-${event.id}`}
    className="studonium-calendar-quick-confirm"
    role="group"
    aria-label={`Confirmar eliminación de ${event.title}`}
    onKeyDown={(keyEvent) => {
      if (keyEvent.key === 'Escape') {
        keyEvent.preventDefault();
        cancelQuickDelete(event.id);
      }
    }}
  >
    <p>¿Eliminar este plan? No se podrá recuperar.</p>

    <div className="studonium-calendar-quick-confirm-actions">
      <button
        type="button"
        className="studonium-calendar-quick-cancel"
        onClick={() => cancelQuickDelete(event.id)}
      >
        Cancelar
      </button>

      <button
        type="button"
        className="studonium-calendar-quick-remove"
        onClick={() => deleteEvent(event.id)}
      >
        Sí, eliminar
      </button>
    </div>
  </div>
)}

                  <h3>{event.title}</h3>

                  <p className="studonium-calendar-event-time">
                    {eventSchedule(event)}
                  </p>
                  {event.reminderSeconds != null && (
  <p className="studonium-calendar-event-reminder">
    Aviso: {formatReminder(event.reminderSeconds)}
    <span>{formatReminderDate(event)}</span>
  </p>
)}

                  {event.description && (
                    <p className="studonium-calendar-event-description">
                      {event.description}
                    </p>
                  )}

                  {event.type === 'task' && (
                    <label className="studonium-calendar-check">
                      <input
                        type="checkbox"
                        checked={event.completed}
                        onChange={() => toggleTask(event)}
                        disabled={storageBlocked}
                      />
                      {event.completed ? 'Completada' : 'Marcar como completada'}
                    </label>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <p className="studonium-calendar-caption">
        Guardado en este navegador · Sin sincronización entre dispositivos.
        Borrar los datos del sitio también borra tu agenda.
      </p>

      {editorOpen && (
        <EventEditor
          event={editingEvent}
          selectedDate={selectedKey}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => {
            setEditorOpen(false);
            setEditingEvent(null);
          }}
        />
      )}
    </section>
  );
}