import { useState } from 'react';
import { AVATAR_FRAMES } from './frames.catalog';
import FramedAvatar from './FramedAvatar';
import type { LocalProfile } from '../profile/profile.storage';
import type { WalletController } from '../shop/useWallet';
import './frames.css';

interface FrameStoreProps {
  profile: LocalProfile;
  wallet: WalletController;
  onOpenInventory: () => void;
}

export default function FrameStore({ profile, wallet, onOpenInventory }: FrameStoreProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function purchase(id: string) {
    try {
      wallet.buyFrame(id);
      setConfirmId(null);
      setMessage('Marco adquirido. Ya está en tu inventario de Perfil.');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se ha podido guardar la compra. No se han descontado monedas.');
    }
  }

  return (
    <div className="studonium-frame-store">
      <div className="studonium-shop-section-heading"><div><h2>Un marco muy tú</h2><p>Un detalle para rodear tu foto de perfil.</p></div></div>
      <p className="studonium-frames-message" role="status">{message}</p>
      {error && <p className="studonium-frames-error" role="alert">{error}</p>}
      <div className="studonium-frame-store-grid">
        {AVATAR_FRAMES.map((frame) => {
          const owned = wallet.ownedFrameIds.includes(frame.id);
          const affordable = wallet.balance !== null && wallet.balance >= frame.price;
          return <article key={frame.id} className="studonium-frame-store-card">
            <div className="studonium-frame-store-art"><FramedAvatar src={profile.avatar} name={profile.displayName} frameId={frame.id} /></div>
            <span className="studonium-frame-owned-label">{owned ? 'ADQUIRIDO' : 'MARCO DE PERFIL'}</span>
            <h3>{frame.name}</h3><p>{frame.description}</p><strong className="studonium-frame-price">{frame.price} monedas</strong>
            {owned ? <button type="button" className="studonium-shop-primary" onClick={onOpenInventory}>Ver en mi inventario ↗</button> : <button type="button" className="studonium-shop-primary" disabled={!affordable || Boolean(wallet.error)} onClick={() => setConfirmId(frame.id)}>{affordable ? 'Comprar marco' : 'Monedas insuficientes'}</button>}
            {!owned && confirmId === frame.id && <div className="studonium-frame-buy-confirm" role="group" aria-label="Confirmar compra del marco"><p>¿Comprar por {frame.price} monedas? Se descontarán de tu saldo local.</p><button type="button" onClick={() => setConfirmId(null)}>Cancelar</button><button type="button" onClick={() => purchase(frame.id)}>Sí, comprar</button></div>}
          </article>;
        })}
      </div>
      <p className="studonium-shop-footnote">Este primer diseño ya está adquirido como regalo, sin descontarte monedas. Las compras de marcos usan únicamente las monedas locales de la app, sin pagos reales.</p>
    </div>
  );
}
