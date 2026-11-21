import { useState } from 'react';
import { AVATAR_FRAMES } from './frames.catalog';
import FramedAvatar from './FramedAvatar';
import type { LocalProfile } from '../profile/profile.storage';
import type { WalletController } from '../shop/useWallet';
import './frames.css';

export default function FramesInventory({ profile, wallet }: { profile: LocalProfile; wallet: WalletController }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const owned = AVATAR_FRAMES.filter((frame) => wallet.ownedFrameIds.includes(frame.id));

  function toggleFrame(id: string) {
    try {
      const removing = wallet.equippedFrameId === id;
      wallet.equipFrame(removing ? null : id);
      setMessage(removing ? 'Marco quitado. Sigue guardado en tu inventario.' : 'Marco en uso. Ya acompaña a tu foto de perfil.');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se ha podido guardar el cambio. Tu selección anterior se conserva.');
    }
  }

  return (
    <section id="profile-frames-inventory" className="studonium-frames-inventory" tabIndex={-1} aria-labelledby="profile-frames-title">
      <div className="studonium-frames-heading"><div><p>PEQUEÑOS DETALLES, MUCHO DE TI</p><h2 id="profile-frames-title">Inventario de marcos</h2></div><span>{owned.length} {owned.length === 1 ? 'adquirido' : 'adquiridos'}</span></div>
      {wallet.error && <p className="studonium-frames-error" role="alert">{wallet.error}</p>}
      {error && <p className="studonium-frames-error" role="alert">{error}</p>}
      <p className="studonium-frames-message" role="status">{message}</p>
      <div className="studonium-frames-inventory-grid">
        {owned.map((frame) => <article key={frame.id} className={`studonium-frame-inventory-card ${wallet.equippedFrameId === frame.id ? 'is-equipped' : ''}`}>
          <div className="studonium-frame-preview"><FramedAvatar src={profile.avatar} name={profile.displayName} frameId={frame.id} /></div>
          <div><span className="studonium-frame-owned-label">{wallet.equippedFrameId === frame.id ? 'EN USO' : 'ADQUIRIDO'}</span><h3>{frame.name}</h3><p>Disponible para personalizar tu foto de perfil.</p><button type="button" aria-pressed={wallet.equippedFrameId === frame.id} onClick={() => toggleFrame(frame.id)}>{wallet.equippedFrameId === frame.id ? 'Quitar marco' : 'Usar marco'}</button></div>
        </article>)}
      </div>
      {!wallet.error && owned.length === 0 && <p className="studonium-frames-message">Los marcos que adquieras en la tienda aparecerán aquí.</p>}
    </section>
  );
}
