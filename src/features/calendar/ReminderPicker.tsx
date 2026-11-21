import { useState } from 'react';
import { formatReminder } from './calendar.reminders';

interface ReminderPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const units = [
  { label: 'Días', multiplier: 86400, max: 30 },
  { label: 'Horas', multiplier: 3600, max: 23 },
  { label: 'Minutos', multiplier: 60, max: 59 },
  { label: 'Segundos', multiplier: 1, max: 59 },
];

function getInitialMode(value: number | null): string {
  if (value === null) return 'none';
  if ([900, 1800, 3600].includes(value)) return String(value);
  return 'custom';
}

export default function ReminderPicker({
  value,
  onChange,
}: ReminderPickerProps) {
  const [mode, setMode] = useState(() => getInitialMode(value));

  const total = value ?? 0;
  const parts = [
    Math.floor(total / 86400),
    Math.floor((total % 86400) / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
  ];

  function changePart(index: number, next: number) {
    const nextParts = [...parts];
    nextParts[index] = next;

    const seconds = nextParts.reduce(
      (sum, part, unitIndex) =>
        sum + part * units[unitIndex].multiplier,
      0,
    );

    onChange(seconds);
  }

  return (
    <fieldset className="studonium-reminder-picker">
      <legend>Un recordatorio para ti</legend>

      <label className="studonium-calendar-field">
        <span className="studonium-reminder-label">
          ¿Cuándo quieres recibirlo?
        </span>

        <select
          value={mode}
          onChange={(event) => {
            const nextMode = event.target.value;
            setMode(nextMode);

            if (nextMode === 'none') {
              onChange(null);
            } else if (nextMode === 'custom') {
              onChange(value ?? 900);
            } else {
              onChange(Number(nextMode));
            }
          }}
        >
          <option value="none">Sin recordatorio</option>
          <option value="900">15 minutos antes</option>
          <option value="1800">30 minutos antes</option>
          <option value="3600">1 hora antes</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>

      {mode === 'custom' && (
        <div className="studonium-reminder-wheels">
          {units.map((unit, index) => (
            <label
              key={unit.label}
              className="studonium-reminder-wheel"
            >
              <span>{unit.label}</span>

              <select
                size={3}
                value={parts[index]}
                onChange={(event) =>
                  changePart(index, Number(event.target.value))
                }
              >
                {Array.from({ length: unit.max + 1 }, (_, number) => (
                  <option key={number} value={number}>
                    {String(number).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <p className="studonium-calendar-form-help" aria-live="polite">
        {formatReminder(value)}
        {mode === 'custom' && ' · Desplaza o usa las flechas del teclado.'}
      </p>
    </fieldset>
  );
}