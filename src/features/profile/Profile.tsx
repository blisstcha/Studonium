import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { LocalProfile } from './profile.storage';
import { prepareProfileImage } from './profile.images';
import ProfileActivity from './ProfileActivity';
import './profile.css';

interface ProfileProps {
  profile: LocalProfile;
  storageWarning: string;
  onSave: (profile: LocalProfile) => boolean;
  onOpenFocus: () => void;
}

function CameraIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3Z" /><circle cx="12" cy="13" r="4" /></svg>;
}

export default function Profile({ profile, storageWarning, onSave, onOpenFocus }: ProfileProps) {
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const disabled = Boolean(uploading) || Boolean(storageWarning);

  function save(next: LocalProfile, success: string): boolean {
    setError('');
    if (!onSave(next)) {
      setMessage('');
      setError('No se ha podido guardar. El almacenamiento puede estar lleno o bloqueado. Tu perfil anterior se conserva.');
      return false;
    }
    setMessage(success);
    return true;
  }

  async function chooseImage(event: ChangeEvent<HTMLInputElement>, kind: 'avatar' | 'banner') {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(kind);
    setError('');
    setMessage('');
    try {
      const image = await prepareProfileImage(file, kind);
      save({ ...profile, [kind]: image }, kind === 'avatar' ? 'Foto de perfil guardada.' : 'Banner guardado.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se ha podido preparar la imagen.');
    } finally {
      setUploading(null);
    }
  }

  function openEditor() {
    setDisplayName(profile.displayName);
    setUsername(profile.username);
    setBio(profile.bio);
    setEditing(true);
    setError('');
    setMessage('');
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const cleanName = displayName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanName) { setError('Escribe el nombre que quieres mostrar.'); return; }
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      setError('El usuario debe tener entre 3 y 24 caracteres: letras sin acentos, números o guion bajo.');
      return;
    }
    if (save({ ...profile, displayName: cleanName, username: cleanUsername, bio: bio.trim() }, 'Tu perfil ya tiene tu toque. Cambios guardados.')) setEditing(false);
  }

  return (
    <section className="studonium-profile" aria-labelledby="profile-title">
      <header className="studonium-profile-heading"><div><p className="studonium-profile-eyebrow">UN ESPACIO MUY TÚ</p><h1 id="profile-title">Tu pequeño universo<span> ✧</span></h1><p>Tu estilo, tus pasos y todo lo que vas consiguiendo.</p></div><span className="studonium-profile-local-badge">Mi perfil local ♡</span></header>

      <section className="studonium-profile-identity" aria-label="Tu perfil personalizado">
        <div className={`studonium-profile-banner ${profile.banner ? 'has-image' : ''}`}>
          {profile.banner ? <img src={profile.banner} alt="Tu banner personalizado" /> : <div className="studonium-profile-banner-art" aria-hidden="true"><span>✷</span><span>make room<br />for your dreams.</span><span>✧</span><i /><i /></div>}
          <button type="button" className="studonium-profile-banner-button" disabled={disabled} onClick={() => bannerInput.current?.click()}><CameraIcon />{uploading === 'banner' ? 'Preparando…' : profile.banner ? 'Cambiar banner' : 'Elegir banner'}</button>
        </div>

        <div className="studonium-profile-identity-body">
          <div className="studonium-profile-avatar-row">
            <div className="studonium-profile-avatar-wrap"><button type="button" className="studonium-profile-avatar" aria-label="Elegir foto de perfil" disabled={disabled} onClick={() => avatarInput.current?.click()}>{profile.avatar ? <img src={profile.avatar} alt={`Foto de ${profile.displayName}`} /> : <span aria-hidden="true">{profile.displayName.slice(0, 1).toUpperCase()}</span>}<span className="studonium-profile-avatar-camera"><CameraIcon /></span></button></div>
            <button type="button" className="studonium-profile-secondary" disabled={disabled} onClick={openEditor}>Editar perfil ↗</button>
          </div>

          <h2 className="studonium-profile-display-name">{profile.displayName}</h2>
          <p className="studonium-profile-username">@{profile.username}</p>
          {profile.bio && <p className="studonium-profile-bio">{profile.bio}</p>}
          <div className="studonium-profile-image-actions">
            <button type="button" disabled={disabled} onClick={() => avatarInput.current?.click()}>{uploading === 'avatar' ? 'Preparando foto…' : 'Elegir foto'}</button>
            {profile.avatar && <button type="button" disabled={disabled} onClick={() => save({ ...profile, avatar: null }, 'Foto retirada.')}>Quitar foto</button>}
            {profile.banner && <button type="button" disabled={disabled} onClick={() => save({ ...profile, banner: null }, 'Banner retirado.')}>Quitar banner</button>}
          </div>
          <p className="studonium-profile-image-help">Elige desde Fotos o Archivos. JPG, PNG o WebP, hasta 12 MB. Recorte centrado automático.</p>
        </div>
      </section>

      <input ref={avatarInput} className="studonium-profile-file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Archivo de foto de perfil" onChange={(event) => { void chooseImage(event, 'avatar'); }} />
      <input ref={bannerInput} className="studonium-profile-file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Archivo de banner" onChange={(event) => { void chooseImage(event, 'banner'); }} />

      {storageWarning && <p className="studonium-profile-error" role="alert">{storageWarning}</p>}
      {error && <p className="studonium-profile-error" role="alert">{error}</p>}
      <p className="studonium-profile-status" role="status">{uploading ? 'Preparando tu imagen en este dispositivo…' : message}</p>

      {editing && <form className="studonium-profile-card studonium-profile-edit-form" onSubmit={submitProfile} aria-labelledby="profile-edit-title"><h2 id="profile-edit-title">Dale tu toque</h2><fieldset disabled={disabled}><label>Nombre visible<input autoFocus required maxLength={40} value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="nickname" /></label><label>Usuario<input required minLength={3} maxLength={25} value={username} onChange={(event) => setUsername(event.target.value)} autoCapitalize="none" spellCheck={false} aria-describedby="profile-username-help" /></label><p id="profile-username-help">Entre 3 y 24 letras, números o guiones bajos. Es un nombre local, todavía no una cuenta ni un usuario reservado.</p><label>Un poquito sobre ti<textarea rows={3} maxLength={160} value={bio} onChange={(event) => setBio(event.target.value)} /></label><div className="studonium-profile-edit-actions"><button type="button" className="studonium-profile-secondary" onClick={() => { setEditing(false); setError(''); }}>Cancelar</button><button type="submit" className="studonium-profile-primary">Guardar perfil</button></div></fieldset></form>}

      <ProfileActivity profile={profile} onOpenFocus={onOpenFocus} />
      <p className="studonium-profile-footnote">Tus fotos, tu perfil y tu actividad se guardan solo en este navegador. No se publican en GitHub ni se sincronizan entre dispositivos. Borrar los datos del sitio elimina esta información.</p>
    </section>
  );
}
