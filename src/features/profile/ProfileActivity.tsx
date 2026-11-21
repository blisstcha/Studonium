import { useEffect, useState } from 'react';
import { formatStudyMinutes, localDayKey, readStudySessions } from './activity.storage';

export default function ProfileActivity({ onOpenFocus }: { onOpenFocus: () => void }) {
  const [activity, setActivity] = useState(readStudySessions);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => { setActivity(readStudySessions()); setNow(new Date()); };
    window.addEventListener('studonium:activity-changed', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('studonium:activity-changed', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index, 12);
    const key = localDayKey(date);
    const minutes = activity.sessions.filter((session) => localDayKey(new Date(session.completedAt)) === key).reduce((sum, session) => sum + session.minutes, 0);
    return { date, key, minutes };
  });
  const weekMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const totalMinutes = activity.sessions.reduce((sum, session) => sum + session.minutes, 0);
  const todayMinutes = days[6].minutes;
  const maxMinutes = Math.max(60, ...days.map((day) => day.minutes));
  const recent = [...activity.sessions].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)).slice(0, 20);

  return (
    <div className="studonium-profile-activity">
      <div className="studonium-profile-stats" aria-label="Resumen de estudio">
        <article><span>✧</span><strong>{formatStudyMinutes(todayMinutes)}</strong><p>Estudiado hoy</p></article>
        <article><span>◷</span><strong>{formatStudyMinutes(totalMinutes)}</strong><p>Tiempo acumulado</p></article>
        <article><span>✓</span><strong>{activity.sessions.length}</strong><p>Sesiones completadas</p></article>
      </div>

      {activity.error && <p className="studonium-profile-error" role="alert">{activity.error}</p>}

      <div className="studonium-profile-activity-grid">
        <section className="studonium-profile-card" aria-labelledby="profile-week-title">
          <p className="studonium-profile-eyebrow">CADA RATITO CUENTA</p>
          <div className="studonium-profile-section-heading"><h2 id="profile-week-title">Tu semana en calma</h2><span>{formatStudyMinutes(weekMinutes)}</span></div>
          <p className="studonium-profile-muted">Tus últimos siete días de concentración.</p>
          <ul className="studonium-profile-week">
            {days.map((day) => (
              <li key={day.key} aria-label={`${new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(day.date)}: ${formatStudyMinutes(day.minutes)}`}>
                <span className="studonium-profile-bar-value">{day.minutes || '—'}</span>
                <div className="studonium-profile-bar-track" aria-hidden="true"><span style={{ height: `${Math.max(4, day.minutes / maxMinutes * 100)}%` }} className={day.key === localDayKey(now) ? 'is-today' : ''} /></div>
                <span className="studonium-profile-day-label">{new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(day.date)}</span>
              </li>
            ))}
          </ul>
          <p className="studonium-profile-chart-note">Tiempo en minutos · Solo sesiones completadas</p>
        </section>

        <section className="studonium-profile-card" aria-labelledby="profile-activity-title">
          <p className="studonium-profile-eyebrow">PEQUEÑOS PASOS, GRANDES LOGROS</p>
          <h2 id="profile-activity-title">Tu actividad de estudio</h2>
          {recent.length === 0 ? (
            <div className="studonium-profile-empty"><span aria-hidden="true">✷</span><h3>Tu historia empieza aquí</h3><p>Completa tu primera sesión de Focus y verás aquí tu progreso real.</p><button type="button" className="studonium-profile-primary" onClick={onOpenFocus}>Ir a concentración ↗</button></div>
          ) : (
            <ul className="studonium-profile-history">
              {recent.map((session) => (
                <li key={session.id}><span className="studonium-profile-session-icon" aria-hidden="true">✓</span><div><strong>Un ratito para tus metas</strong><span>{new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(session.completedAt))}</span></div><span className="studonium-profile-minutes">{formatStudyMinutes(session.minutes)}</span></li>
              ))}
            </ul>
          )}
          {recent.length > 0 && <p className="studonium-profile-chart-note">Últimas {recent.length} sesiones · Los totales incluyen todo tu historial.</p>}
        </section>
      </div>
    </div>
  );
}
