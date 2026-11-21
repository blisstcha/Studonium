import { useEffect, useState } from 'react';
import { formatStudyMinutes, localDayKey, readStudySessions, saveSessionReview } from './activity.storage';
import type { StudySession } from './activity.storage';
import type { LocalProfile } from './profile.storage';

export default function ProfileActivity({ profile, onOpenFocus }: { profile: LocalProfile; onOpenFocus: () => void }) {
  const [activity, setActivity] = useState(readStudySessions);
  const [now, setNow] = useState(() => new Date());
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

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
  const sorted = [...activity.sessions].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  const published = sorted.filter((session) => session.published === true);
  const privateSessions = sorted.filter((session) => session.published !== true);
  const recent = published.slice(0, 20);

  function unpublish(session: StudySession) {
    try {
      saveSessionReview(session.id, session.comment ?? '', false);
      setActionMessage('Publicación retirada. Tu estudio y tu comentario se conservan en las sesiones sin publicar.');
      setActionError('');
    } catch {
      setActionError('No se ha podido retirar la publicación. Inténtalo de nuevo; no se ha cambiado tu sesión.');
    }
  }

  return (
    <div className="studonium-profile-activity">
      <div className="studonium-profile-stats" aria-label="Resumen de estudio">
        <article aria-label="Estudiado hoy"><span>✧</span><strong>{formatStudyMinutes(todayMinutes)}</strong><p>Estudiado hoy</p></article>
        <article aria-label="Tiempo acumulado"><span>◷</span><strong>{formatStudyMinutes(totalMinutes)}</strong><p>Tiempo acumulado</p></article>
        <article aria-label="Sesiones completadas"><span>✓</span><strong>{activity.sessions.length}</strong><p>Sesiones completadas</p></article>
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
          <p className="studonium-profile-muted">Las sesiones que eliges publicar, con tus propias palabras.</p>
          {actionMessage && <p className="studonium-profile-chart-note" role="status">{actionMessage}</p>}
          {actionError && <p className="studonium-profile-error" role="alert">{actionError}</p>}
          {recent.length === 0 ? (
            <div className="studonium-profile-empty"><span aria-hidden="true">✷</span><h3>{activity.sessions.length ? 'Aún no hay publicaciones' : 'Tu historia empieza aquí'}</h3><p>Al terminar Focus podrás publicar tu sesión. Si prefieres no hacerlo, tu estudio seguirá sumando igual.</p><button type="button" className="studonium-profile-primary" onClick={onOpenFocus}>Ir a concentración ↗</button></div>
          ) : (
            <ul className="studonium-profile-posts">
              {recent.map((session) => (
                <li key={session.id}>
                  <article className="studonium-profile-post" aria-label={`Sesión publicada de ${session.minutes} minutos`}>
                    <header><span className="studonium-profile-post-avatar">{profile.avatar ? <img src={profile.avatar} alt="" /> : profile.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{profile.displayName}</strong><span>@{profile.username}</span></div></header>
                    <div className="studonium-profile-post-achievement"><span aria-hidden="true">✧</span><p><strong>{formatStudyMinutes(session.minutes)}</strong> de concentración<small>Sesión completada</small></p><span aria-hidden="true">✓</span></div>
                    {session.comment && <p className="studonium-profile-post-comment">{session.comment}</p>}
                    <footer><time dateTime={session.completedAt}>{new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(session.completedAt))}</time><span>En mi actividad</span></footer>
                    <button type="button" className="studonium-profile-unpublish" onClick={() => unpublish(session)}>Retirar publicación</button>
                  </article>
                </li>
              ))}
            </ul>
          )}
          {recent.length > 0 && <p className="studonium-profile-chart-note">Últimas {recent.length} publicaciones · Solo visibles en este navegador por ahora.</p>}
          {privateSessions.length > 0 && (
            <details className="studonium-profile-private-history">
              <summary>Sesiones sin publicar ({privateSessions.length})</summary>
              <p>Estas sesiones y sus comentarios son privados. También cuentan en tus estadísticas.</p>
              <ul className="studonium-profile-history">
                {privateSessions.slice(0, 20).map((session) => <li key={session.id}><span className="studonium-profile-session-icon" aria-hidden="true">✓</span><div><strong>{formatStudyMinutes(session.minutes)} de concentración</strong><span>{new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(session.completedAt))}</span>{session.comment && <p className="studonium-profile-private-comment">{session.comment}</p>}</div></li>)}
              </ul>
              {privateSessions.length > 20 && <p>Se muestran las últimas 20. Tus totales incluyen todas.</p>}
            </details>
          )}
        </section>
      </div>
    </div>
  );
}
