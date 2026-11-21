export interface StudySession {
  id: string;
  minutes: number;
  completedAt: string;
  comment?: string;
  published?: boolean;
}

const ACTIVITY_KEY = 'studonium.study-activity.v1';

function validSession(value: unknown): value is StudySession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Record<string, unknown>;
  return typeof session.id === 'string' && session.id.length > 0 &&
    typeof session.minutes === 'number' && Number.isInteger(session.minutes) && session.minutes >= 30 && session.minutes <= 120 && session.minutes % 10 === 0 &&
    typeof session.completedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(session.completedAt) && Number.isFinite(Date.parse(session.completedAt)) &&
    (session.comment === undefined || (typeof session.comment === 'string' && session.comment.length <= 500)) &&
    (session.published === undefined || typeof session.published === 'boolean');
}

export function readStudySessions(): { sessions: StudySession[]; error: string } {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw === null) return { sessions: [], error: '' };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(validSession) || new Set(parsed.map((session) => session.id)).size !== parsed.length) {
      throw new Error('Invalid history');
    }
    return { sessions: parsed, error: '' };
  } catch {
    return { sessions: [], error: 'No se ha podido leer tu actividad guardada. Los datos anteriores no se han sobrescrito.' };
  }
}

export function saveStudySession(session: StudySession): void {
  if (!validSession(session)) throw new Error('Invalid session');
  const stored = readStudySessions();
  if (stored.error) throw new Error(stored.error);
  if (stored.sessions.some((item) => item.id === session.id)) return;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify([...stored.sessions, session]));
  window.dispatchEvent(new Event('studonium:activity-changed'));
}

export function saveSessionReview(id: string, comment: string, published: boolean): void {
  if (typeof comment !== 'string' || comment.length > 500 || typeof published !== 'boolean') throw new Error('Invalid review');
  const stored = readStudySessions();
  if (stored.error) throw new Error(stored.error);
  if (!stored.sessions.some((session) => session.id === id)) throw new Error('Session not found');
  const sessions = stored.sessions.map((session) => session.id === id
    ? { ...session, comment: comment.trim(), published }
    : session);
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event('studonium:activity-changed'));
}

export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatStudyMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
}
