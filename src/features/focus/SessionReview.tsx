import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { formatStudyMinutes, saveSessionReview } from '../profile/activity.storage';
import type { StudySession } from '../profile/activity.storage';
import './session-review.css';

interface SessionReviewProps {
  session: StudySession;
  onFinished: (published: boolean) => void;
}

export default function SessionReview({ session, onFinished }: SessionReviewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [comment, setComment] = useState(session.comment ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  function finish(published: boolean) {
    try {
      // The session is already counted and private before this dialog opens.
      if (published || comment.trim()) saveSessionReview(session.id, comment, published);
      onFinished(published);
    } catch {
      setError('Tu tiempo y la sesión ya están guardados. No se ha podido guardar el comentario ni publicar. Puedes reintentarlo o cerrar sin guardar el comentario; la sesión seguirá sin publicar.');
    }
  }

  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    finish(true);
  }

  return (
    <dialog ref={dialogRef} className="studonium-session-review" aria-labelledby="session-review-title" aria-describedby="session-review-description" onCancel={(event) => { event.preventDefault(); finish(false); }}>
      <button type="button" className="studonium-session-review-close" aria-label="No publicar y cerrar" onClick={() => finish(false)}>×</button>
      <span className="studonium-session-review-flower" aria-hidden="true">✷</span>
      <p className="studonium-session-review-eyebrow">OTRO PEQUEÑO GRAN PASO</p>
      <h2 id="session-review-title">¡Lo has conseguido!</h2>
      <p id="session-review-description">{formatStudyMinutes(session.minutes)} de concentración ya suman a tu perfil. Una sesión más para ti. ♡</p>

      <form onSubmit={publish}>
        <label htmlFor="session-review-comment">¿Cómo te ha ido esta sesión?</label>
        <textarea id="session-review-comment" autoFocus rows={4} maxLength={500} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Una idea que aprendiste, algo que te costó o un pequeño logro…" aria-describedby="session-review-help" />
        <div className="studonium-session-review-caption"><span>Comentario opcional</span><span>{comment.length}/500</span></div>
        <p id="session-review-help">Publicar crea un post en la actividad de tu perfil. Por ahora solo se ve en este navegador; todavía no se comparte con otras personas.</p>
        {error && <p className="studonium-session-review-error" role="alert">{error}</p>}
        <button type="submit" className="studonium-session-review-publish">Publicar en mi actividad ↗</button>
        <button type="button" className="studonium-session-review-private" onClick={() => finish(false)}>No publicar</button>
        {error && <button type="button" className="studonium-session-review-private" onClick={() => onFinished(false)}>Cerrar sin guardar comentario</button>}
      </form>
      <p className="studonium-session-review-note">Tu estudio cuenta igual, publiques o no.</p>
    </dialog>
  );
}
