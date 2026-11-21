export interface LocalProfile {
  displayName: string;
  username: string;
  bio: string;
  avatar: string | null;
  banner: string | null;
}

const PROFILE_KEY = 'studonium.profile.v1';

export const DEFAULT_PROFILE: LocalProfile = {
  displayName: 'Alex',
  username: 'alex',
  bio: 'Pequeños pasos, grandes sueños. A mi ritmo, siempre. ✧',
  avatar: null,
  banner: null,
};

function validImage(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= 1_500_000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value));
}

function validProfile(value: unknown): value is LocalProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.displayName === 'string' && profile.displayName.trim().length > 0 && profile.displayName.length <= 40 &&
    typeof profile.username === 'string' && /^[a-z0-9_]{3,24}$/.test(profile.username) &&
    typeof profile.bio === 'string' && profile.bio.length <= 160 && validImage(profile.avatar) && validImage(profile.banner);
}

export function readProfile(): { profile: LocalProfile; error: string } {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw === null) return { profile: { ...DEFAULT_PROFILE }, error: '' };
    const parsed: unknown = JSON.parse(raw);
    if (!validProfile(parsed)) throw new Error('Invalid profile');
    return { profile: parsed, error: '' };
  } catch {
    return { profile: { ...DEFAULT_PROFILE }, error: 'No hemos podido recuperar tu perfil. No se ha sobrescrito. Comprueba el almacenamiento del navegador y recarga antes de guardar cambios.' };
  }
}

export function writeProfile(profile: LocalProfile): void {
  if (!validProfile(profile)) throw new Error('Invalid profile');
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
