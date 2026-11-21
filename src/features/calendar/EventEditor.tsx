import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  EVENT_COLORS,
  EVENT_LABELS,
} from './calendar.types';
import type {
  CalendarEvent,
  EventType,
} from './calendar.types';
import { isValidDate } from './calendar.storage';
import ReminderPicker from './ReminderPicker';
import {
  formatReminderDate,
  getReminderTime,
} from './calendar.reminders';

interface EventEditorProps {
  event: CalendarEvent | null;
  selectedDate: string;
  onSave: (event: CalendarEvent) => boolean;
  onDelete: (id: string) => boolean;
  onClose: () => void;
}

function createId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function EventEditor({
  event,
  selectedDate,
  onSave,
  onDelete,
  onClose,
}: EventEditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [type, setType] = useState<EventType>(event?.type ?? 'task');
  const [date, setDate] = useState(event?.date ?? selectedDate);
  const [startTime, setStartTime] = useState(event?.startTime ?? '17:00');
  const [endTime, setEndTime] = useState(event?.endTime ?? '18:00');
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [color, setColor] = useState(event?.color ?? EVENT_COLORS[0].value);
  const [completed, setCompleted] = useState(event?.completed ?? false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderSeconds, setReminderSeconds] = useState<number | null>(
    event?.reminderSeconds ?? null,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Escribe un título para tu plan.');
      return;
    }

    if (!isValidDate(date)) {
      setError('Elige una fecha válida entre 1900 y 2100.');
      return;
    }

    if (!allDay && (!startTime || !endTime || endTime <= startTime)) {
      setError('La hora de finalización debe ser posterior a la de inicio.');
      return;
    }

    const nextEvent: CalendarEvent = {
      id: event?.id ?? createId(),
      title: title.trim(),
      description: description.trim(),
      type,
      date,
      startTime,
      endTime,
      allDay,
      color,
      completed: type === 'task' ? completed : false,
      reminderSeconds,
    };

    if (!onSave(nextEvent)) {
      setError(
        'No se ha podido guardar. Comprueba que el navegador permite el almacenamiento local. Tu formulario sigue aquí.',
      );
    }
  }

  function handleDelete() {
    if (!event) return;

    if (!onDelete(event.id)) {
      setError('No se ha podido guardar la eliminación. Inténtalo de nuevo.');
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="studonium-calendar-editor"
      aria-labelledby="calendar-editor-title"
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        onClose();
      }}
    >
      <div className="studonium-calendar-editor-heading">
        <div>
          <p className="studonium-calendar-eyebrow">
            UN HUEQUITO PARA TUS PLANES
          </p>
          <h2 id="calendar-editor-title">
            {event ? 'Editar tu plan' : 'Algo nuevo en tu agenda'}
          </h2>
        </div>

        <button
          type="button"
          className="studonium-calendar-close"
          aria-label="Cerrar editor"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <form
        className="studonium-calendar-form"
        onSubmit={handleSubmit}
      >
        <label className="studonium-calendar-field">
          <span>Título</span>
          <input
            autoFocus
            required
            maxLength={100}
            placeholder="Por ejemplo: repasar biología"
            value={title}
            onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          />
        </label>

        <label className="studonium-calendar-field">
          <span>Descripción <small>opcional</small></span>
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="¿Qué te gustaría recordar?"
            value={description}
            onChange={(changeEvent) =>
              setDescription(changeEvent.target.value)
            }
          />
        </label>

        <div className="studonium-calendar-form-row">
          <label className="studonium-calendar-field">
            <span>Tipo</span>
            <select
              value={type}
              onChange={(changeEvent) =>
                setType(changeEvent.target.value as EventType)
              }
            >
              <option value="task">{EVENT_LABELS.task}</option>
              <option value="exam">{EVENT_LABELS.exam}</option>
              <option value="event">{EVENT_LABELS.event}</option>
            </select>
          </label>

          <label className="studonium-calendar-field">
            <span>Fecha</span>
            <input
              required
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={date}
              onChange={(changeEvent) => setDate(changeEvent.target.value)}
            />
          </label>
        </div>

        <label className="studonium-calendar-check">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(changeEvent) => setAllDay(changeEvent.target.checked)}
          />
          Todo el día
        </label>

        {!allDay && (
          <div className="studonium-calendar-form-row">
            <label className="studonium-calendar-field">
              <span>Hora de inicio</span>
              <input
                required
                type="time"
                value={startTime}
                onChange={(changeEvent) =>
                  setStartTime(changeEvent.target.value)
                }
              />
            </label>

            <label className="studonium-calendar-field">
              <span>Hora de finalización</span>
              <input
                required
                type="time"
                value={endTime}
                onChange={(changeEvent) =>
                  setEndTime(changeEvent.target.value)
                }
              />
            </label>
          </div>
        )}

        <fieldset className="studonium-calendar-color-field">
          <legend>Un color para este plan</legend>

          <div className="studonium-calendar-colors">
            {EVENT_COLORS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="studonium-calendar-color-option"
                style={{ backgroundColor: option.value }}
                aria-label={option.name}
                aria-pressed={color.toLowerCase() === option.value.toLowerCase()}
                onClick={() => setColor(option.value)}
              >
                {color.toLowerCase() === option.value.toLowerCase() ? '✓' : ''}
              </button>
            ))}

            <label className="studonium-calendar-custom-color">
              <input
                type="color"
                value={color}
                aria-label="Elegir un color personalizado"
                onChange={(changeEvent) => setColor(changeEvent.target.value)}
              />
              Otro color
            </label>
          </div>
        </fieldset>

        {type === 'task' && (
          <label className="studonium-calendar-check">
            <input
              type="checkbox"
              checked={completed}
              onChange={(changeEvent) =>
                setCompleted(changeEvent.target.checked)
              }
            />
            Tarea completada
          </label>
        )}

<ReminderPicker
  value={reminderSeconds}
  onChange={setReminderSeconds}
/>

{reminderSeconds !== null && date && (allDay || startTime) && (() => {
  const preview: CalendarEvent = {
    id: 'preview',
    title,
    description,
    type,
    date,
    startTime,
    endTime,
    allDay,
    color,
    completed: false,
    reminderSeconds,
  };

  const timestamp = getReminderTime(preview);

  if (timestamp === null) return null;

  return (
    <p className="studonium-reminder-preview">
      Aviso previsto: <strong>{formatReminderDate(preview)}</strong>.
      {timestamp < Date.now() && (
        <span>
          {' '}Esa hora ya ha pasado. Si el plan todavía no ha empezado,
          el aviso aparecerá al guardar.
        </span>
      )}
    </p>
  );
})()}

<p className="studonium-calendar-form-help">
  Los horarios corresponden a la hora local de tu dispositivo.
  Cada plan empieza y termina el mismo día. Para los planes de día
  completo, el inicio se considera a las 00:00.
  Los recordatorios requieren que Studonium esté abierta.
</p>

        {error && (
          <p className="studonium-calendar-error" role="alert">
            {error}
          </p>
        )}

        {confirmDelete && (
          <div className="studonium-calendar-delete-confirm">
            <p>¿Eliminar este plan? No se podrá recuperar.</p>

            <div className="studonium-calendar-actions">
              <button
                type="button"
                className="studonium-calendar-secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Conservar
              </button>

              <button
                type="button"
                className="studonium-calendar-danger"
                onClick={handleDelete}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        )}

        <div className="studonium-calendar-editor-footer">
          {event && (
            <button
              type="button"
              className="studonium-calendar-delete-link"
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar
            </button>
          )}

          <div className="studonium-calendar-actions">
            <button
              type="button"
              className="studonium-calendar-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button type="submit" className="studonium-calendar-primary">
              {event ? 'Guardar cambios' : 'Guardar plan'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}