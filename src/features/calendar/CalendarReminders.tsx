import { useEffect, useState } from 'react';
import { useCalendarReminders } from './useCalendarReminders';
import './calendar.css';

export default function CalendarReminders() {
  const {
    notices,
    systemState,
    systemMessage,
    storageMessage,
    enableSystemNotifications,
    dismissNotice,
  } = useCalendarReminders();

  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (notices.length > 0) setOpen(true);
  }, [notices.length]);

  async function requestPermission() {
    setRequesting(true);

    try {
      await enableSystemNotifications();
    } finally {
      setRequesting(false);
    }
  }

  return (
    <details
      className="studonium-reminder-center"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>
          <span aria-hidden="true">♧</span> Tus recordatorios
        </span>
        <span className="studonium-reminder-counter">
          {notices.length > 0 ? `${notices.length} pendientes` : 'A tu ritmo'}
        </span>
      </summary>

      <div className="studonium-reminder-center-body">
        <p className="studonium-reminder-explanation">
          Los avisos aparecen mientras Studonium está abierta.
          Las pestañas en segundo plano pueden recibirlos con retraso.
          No funcionan con la aplicación cerrada.
        </p>

        {systemState === 'default' && (
          <button
            type="button"
            className="studonium-calendar-secondary"
            disabled={requesting}
            onClick={requestPermission}
          >
            {requesting
              ? 'Esperando autorización…'
              : 'Activar notificaciones del sistema'}
          </button>
        )}

        {systemState === 'granted' && (
          <p className="studonium-reminder-permission">
            Notificaciones del sistema autorizadas. Su visualización
            también depende del navegador y de los ajustes del dispositivo.
          </p>
        )}

        {systemState === 'denied' && (
          <p className="studonium-reminder-permission">
            El navegador tiene bloqueadas las notificaciones.
            Puedes cambiarlo en sus permisos del sitio.
            Los avisos dentro de Studonium siguen activos.
          </p>
        )}

        {systemState === 'unsupported' && (
          <p className="studonium-reminder-permission">
            Esta vista no admite notificaciones del sistema.
            Los avisos dentro de Studonium siguen activos.
          </p>
        )}

        {systemMessage && (
          <p className="studonium-reminder-permission" role="status">
            {systemMessage}
          </p>
        )}

        {storageMessage && (
          <p className="studonium-reminder-permission" role="status">
            {storageMessage}
          </p>
        )}

        <p className="studonium-reminder-live" role="status" aria-live="polite">
          {notices.length > 0
            ? `Tienes ${notices.length} recordatorios pendientes de leer.`
            : 'No tienes avisos pendientes de leer.'}
        </p>

        {notices.length > 0 && (
          <ul className="studonium-reminder-notices">
            {notices.map((notice) => (
              <li key={notice.id}>
                <div>
                  <strong>{notice.title}</strong>
                  <span>
                    {new Intl.DateTimeFormat('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    }).format(new Date(`${notice.date}T12:00:00`))}
                    {' · '}{notice.schedule}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => dismissNotice(notice.id)}
                  aria-label={`Marcar como leído el aviso de ${notice.title}`}
                >
                  Entendido
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}