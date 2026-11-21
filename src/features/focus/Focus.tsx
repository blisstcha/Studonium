import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { advanceTimer, createTimer, formatCountdown, pauseTimer, startTimer, validMinutes } from './focus.timer';
import './focus.css';

const labels = {
  ready: 'Tu momento de calma empieza aquí.',
  running: 'Un paso, una idea, un minuto a la vez.',
  paused: 'Respira. Tu tiempo de estudio está en pausa.',
  completed: '¡Sesión completada! Ahora, un descanso merecido.',
};

export default function Focus() {
  const [minutesInput, setMinutesInput] = useState('30');
  const [timer, setTimer] = useState(() => createTimer(30));
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const minutes = Number(minutesInput);
  const valid = validMinutes(minutes);
  const locked = timer.phase === 'running' || timer.phase === 'paused';
  const displayMs = timer.phase === 'ready' && valid ? minutes * 60_000 : timer.remainingMs;
  const progress = Math.min(100, Math.max(0, (1 - timer.remainingMs / timer.durationMs) * 100));
  const studiedMinutes = Math.floor((timer.durationMs - timer.remainingMs) / 60_000);
  const circumference = 2 * Math.PI * 120;

  useEffect(() => {
    if (timer.phase !== 'running') return;
    const update = () => setTimer((current) => advanceTimer(current, performance.now()));
    const interval = window.setInterval(update, 250);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [timer.phase]);

  function beginSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    if (!valid) {
      setError('Elige 30 minutos o más, en saltos de 10: 30, 40, 50…');
      return;
    }
    setError('');
    setConfirmReset(false);
    setTimer(startTimer(createTimer(minutes), performance.now()));
  }

  function resetSession() {
    setTimer(createTimer(timer.durationMs / 60_000));
    setMinutesInput(String(timer.durationMs / 60_000));
    setConfirmReset(false);
    setError('');
  }

  return (
    <section className="studonium-focus" aria-labelledby="focus-title">
      <header className="studonium-focus-heading">
        <div>
          <p className="studonium-focus-eyebrow">UN POQUITO DE CALMA, UN MONTÓN DE POSIBILIDADES</p>
          <h1 id="focus-title">Tu momento <span>focus.</span></h1>
          <p>El mundo puede esperar. Este ratito es para ti.</p>
        </div>
        <span className="studonium-focus-sticker">one thing at a time ♡</span>
      </header>

      <div className="studonium-focus-layout">
        <section className="studonium-focus-clock-card" aria-label="Temporizador de concentración">
          <div className="studonium-focus-clock-top">
            <span className="studonium-focus-mode">✧ ESPACIO DE CONCENTRACIÓN</span>
            <span className={`studonium-focus-status is-${timer.phase}`}>
              {timer.phase === 'ready' ? 'A tu ritmo' : timer.phase === 'running' ? 'En marcha' : timer.phase === 'paused' ? 'En pausa' : 'Lo conseguiste'}
            </span>
          </div>

          <div className="studonium-focus-dial">
            <span className="studonium-focus-spark spark-left" aria-hidden="true">✦</span>
            <svg viewBox="0 0 280 280" className="studonium-focus-ring" aria-hidden="true">
              <circle className="studonium-focus-ring-track" cx="140" cy="140" r="120" />
              <circle className="studonium-focus-ring-progress" cx="140" cy="140" r="120"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)} />
            </svg>
            <div className="studonium-focus-time-content">
              <span className="studonium-focus-flower" aria-hidden="true">✳</span>
              <span className="studonium-focus-time" role="timer" aria-label="Tiempo restante" aria-live="off">
                {formatCountdown(displayMs)}
              </span>
              <span className="studonium-focus-time-label">{timer.phase === 'completed' ? 'un pequeño gran logro' : 'minutos para tus metas'}</span>
            </div>
            <span className="studonium-focus-spark spark-right" aria-hidden="true">✧</span>
          </div>

          <p className="studonium-focus-encouragement" role="status">{labels[timer.phase]}</p>

          {locked && (
            <div className="studonium-focus-controls">
              <button type="button" className="studonium-focus-primary" onClick={() => {
                setConfirmReset(false);
                setTimer((current) => timer.phase === 'running'
                  ? pauseTimer(current, performance.now())
                  : startTimer(current, performance.now()));
              }}>
                {timer.phase === 'running' ? 'Ⅱ Pausar' : '▷ Continuar'}
              </button>
              <button type="button" className="studonium-focus-secondary" aria-expanded={confirmReset}
                aria-controls={confirmReset ? 'focus-reset-confirm' : undefined}
                onClick={() => setConfirmReset((current) => !current)}>
                ↺ Reiniciar
              </button>
            </div>
          )}

          {confirmReset && (
            <div id="focus-reset-confirm" className="studonium-focus-reset" role="group" aria-label="Confirmar reinicio">
              <p>¿Volver a empezar? Se perderá el avance de esta sesión. Si sigue en marcha, el tiempo continúa hasta que confirmes o pauses.</p>
              <button type="button" className="studonium-focus-secondary" onClick={() => setConfirmReset(false)}>Cancelar</button>
              <button type="button" className="studonium-focus-primary" onClick={resetSession}>Sí, reiniciar</button>
            </div>
          )}

          <div className="studonium-focus-session-summary">
            <span><strong>{timer.phase === 'ready' ? 0 : studiedMinutes}</strong> min de concentración</span>
            <span><strong>{Math.floor(progress)} %</strong> del objetivo</span>
          </div>
        </section>

        <aside className="studonium-focus-side">
          <form className="studonium-focus-settings" onSubmit={beginSession}>
            <p className="studonium-focus-eyebrow">DALE UN HUEQUITO A TU OBJETIVO</p>
            <h2>¿Cuánto tiempo para ti?</h2>
            <p>Elige una sesión desde 30 minutos, en saltos de 10.</p>
            <label className="studonium-focus-duration-label" htmlFor="focus-minutes">Duración en minutos</label>
            <div className="studonium-focus-duration-controls">
              <button type="button" aria-label="Restar diez minutos" disabled={locked || !valid || minutes <= 30}
                onClick={() => setMinutesInput(String(minutes - 10))}>−</button>
              <input id="focus-minutes" type="number" min="30" step="10" required inputMode="numeric"
                value={minutesInput} disabled={locked} aria-describedby="focus-duration-help"
                onChange={(event) => { setMinutesInput(event.target.value); setError(''); }} />
              <button type="button" aria-label="Añadir diez minutos" disabled={locked || !valid || !validMinutes(minutes + 10)}
                onClick={() => setMinutesInput(String(minutes + 10))}>＋</button>
            </div>
            <div className="studonium-focus-presets" aria-label="Duraciones habituales">
              {[30, 60, 90].map((preset) => (
                <button key={preset} type="button" disabled={locked} aria-pressed={minutes === preset}
                  onClick={() => { setMinutesInput(String(preset)); setError(''); }}>{preset} min</button>
              ))}
            </div>
            <p id="focus-duration-help" className="studonium-focus-help">{locked
              ? 'La duración se mantiene durante la sesión. Reinicia para cambiarla.'
              : 'Puedes escribir otra duración: 40, 50, 70 minutos…'}</p>
            {error && <p className="studonium-focus-error" role="alert">{error}</p>}
            {!locked && <button type="submit" className="studonium-focus-primary studonium-focus-start">
              {timer.phase === 'completed' ? '▷ Empezar otra sesión' : '▷ Empezar mi sesión'}
            </button>}
          </form>

          <section className="studonium-focus-rewards" aria-labelledby="focus-rewards-title">
            <span className="studonium-focus-coming">PRÓXIMAMENTE</span>
            <span className="studonium-focus-coin" aria-hidden="true">✦</span>
            <h2 id="focus-rewards-title">Tu constancia tendrá premio.</h2>
            <p>Las sesiones desde 30 minutos serán la base de los futuros puntos de estudio. Todavía no se conceden puntos.</p>
          </section>
        </aside>
      </div>

      <p className="studonium-focus-footnote">Las pausas no suman tiempo. Puedes visitar Inicio o Agenda sin perder la cuenta atrás. Al recargar o cerrar la página, esta primera versión reinicia la sesión.</p>
    </section>
  );
}
