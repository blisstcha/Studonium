import { useEffect, useRef, useState } from 'react';
import { readEvents } from './calendar.storage';
import {
  getEventStart,
  getReminderTime,
} from './calendar.reminders';
import type { CalendarEvent } from './calendar.types';

const RECEIPTS_KEY = 'studonium.calendar.reminders.v1';

export interface ReminderNotice {
  id: string;
  title: string;
  date: string;
  schedule: string;
}

export type SystemNotificationState =
  | NotificationPermission
  | 'unsupported';

function getSystemState(): SystemNotificationState {
  if (
    typeof window === 'undefined' ||
    !window.isSecureContext ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }

  return Notification.permission;
}

function receiptKey(event: CalendarEvent, due: number): string {
  return JSON.stringify([
    event.id,
    getEventStart(event),
    due,
  ]);
}

export function useCalendarReminders() {
  const [notices, setNotices] = useState<ReminderNotice[]>([]);
  const [systemState, setSystemState] = useState(getSystemState);
  const [systemMessage, setSystemMessage] = useState('');
  const [storageMessage, setStorageMessage] = useState('');

  const deliveredRef = useRef(new Set<string>());

  useEffect(() => {
    let currentEvents: CalendarEvent[] = [];

    try {
      const saved = localStorage.getItem(RECEIPTS_KEY);

      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);

        if (
          !Array.isArray(parsed) ||
          !parsed.every((item) => typeof item === 'string')
        ) {
          throw new Error('Invalid reminder receipts');
        }

        parsed.forEach((key) => deliveredRef.current.add(key));
      }
    } catch {
      setStorageMessage(
        'No se pudo recuperar el historial de avisos. Alguno podría repetirse al volver a abrir la aplicación.',
      );
    }

    function rememberDelivery(key: string) {
      deliveredRef.current.add(key);

      try {
        localStorage.setItem(
          RECEIPTS_KEY,
          JSON.stringify([...deliveredRef.current]),
        );
      } catch {
        setStorageMessage(
          'Los avisos funcionan, pero no se puede guardar su historial. Podrían repetirse al recargar.',
        );
      }
    }

    function checkReminders() {
      const now = Date.now();
      const pending: ReminderNotice[] = [];

      for (const event of currentEvents) {
        if (event.type === 'task' && event.completed) continue;

        const due = getReminderTime(event);
        if (due === null || due > now) continue;

        const start = getEventStart(event);

        // Permite detectar el inicio aunque el intervalo llegue
        // unos segundos tarde. No genera avisos de planes antiguos.
        if (now > start + 60_000) continue;

        const key = receiptKey(event, due);
        if (deliveredRef.current.has(key)) continue;

        rememberDelivery(key);

        pending.push({
          id: key,
          title: event.title,
          date: event.date,
          schedule: event.allDay
            ? 'Todo el día'
            : `${event.startTime}–${event.endTime}`,
        });

        // Nunca solicita permiso automáticamente.
        if (getSystemState() === 'granted') {
          try {
            new Notification('Studonium · Un plan para ti', {
              body: `${event.title} · ${
                event.allDay ? 'Todo el día' : event.startTime
              }`,
              tag: key,
            });
          } catch {
            setSystemMessage(
              'El navegador no ha podido mostrar la notificación del sistema. Tu aviso sigue disponible aquí.',
            );
          }
        }
      }

      if (pending.length > 0) {
        setNotices((current) => [...pending, ...current]);
      }
    }

    function refreshEvents() {
      const loaded = readEvents();
      currentEvents = loaded.error ? [] : loaded.events;
      checkReminders();
    }

    function refreshOnFocus() {
      setSystemState(getSystemState());
      refreshEvents();
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key === RECEIPTS_KEY ||
        event.key === null
      ) {
        try {
          const saved = localStorage.getItem(RECEIPTS_KEY);
          const parsed: unknown = saved ? JSON.parse(saved) : [];

          if (
            Array.isArray(parsed) &&
            parsed.every((item) => typeof item === 'string')
          ) {
            parsed.forEach((key) => deliveredRef.current.add(key));
          }
        } catch {
          // Se mantiene el historial de esta sesión.
        }
      }

      refreshEvents();
    }

    refreshEvents();

    const interval = window.setInterval(checkReminders, 1000);

    window.addEventListener('studonium:calendar-changed', refreshEvents);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('studonium:calendar-changed', refreshEvents);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  async function enableSystemNotifications() {
    setSystemMessage('');

    if (getSystemState() === 'unsupported') {
      setSystemState('unsupported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setSystemState(permission);

      if (permission === 'default') {
        setSystemMessage(
          'No has autorizado las notificaciones. Los avisos dentro de Studonium siguen activos.',
        );
      }
    } catch {
      setSystemMessage(
        'No se pudo solicitar permiso. Prueba a abrir la vista previa en una pestaña independiente. Los avisos dentro de Studonium siguen activos.',
      );
    }
  }

  function dismissNotice(id: string) {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }

  return {
    notices,
    systemState,
    systemMessage,
    storageMessage,
    enableSystemNotifications,
    dismissNotice,
  };
}