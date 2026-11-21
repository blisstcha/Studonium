import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { COIN_PACKAGES, formatCoins, formatPrice } from './shop.catalog';
import type { ShopCategory } from './shop.catalog';
import FrameStore from '../frames/FrameStore';
import type { LocalProfile } from '../profile/profile.storage';
import type { WalletController } from './useWallet';
import './shop.css';

interface ShopProps {
  category: ShopCategory;
  onCategoryChange: (category: ShopCategory) => void;
  wallet: WalletController;
  profile: LocalProfile;
  onOpenInventory: () => void;
}

function PackageNotice({ coins, onClose }: { coins: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  return (
    <dialog ref={ref} className="studonium-shop-notice" aria-labelledby="shop-notice-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <span className="studonium-shop-notice-star" aria-hidden="true">✧</span>
      <h2 id="shop-notice-title">Un poquito más adelante</h2>
      <p>El paquete de {formatCoins(coins)} monedas estará disponible cuando abramos las compras.</p>
      <p>Por ahora no se realizan cobros ni se añaden monedas a tu saldo.</p>
      <button type="button" className="studonium-shop-primary" onClick={onClose}>Entendido</button>
    </dialog>
  );
}

export default function Shop({ category, onCategoryChange, wallet, profile, onOpenInventory }: ShopProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    let next: ShopCategory;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = category === 'coins' ? 'frames' : 'coins';
    else if (event.key === 'Home') next = 'coins';
    else if (event.key === 'End') next = 'frames';
    else return;
    event.preventDefault();
    onCategoryChange(next);
    document.getElementById(`shop-tab-${next}`)?.focus();
  }

  return (
    <section className="studonium-shop" aria-labelledby="shop-title">
      <header className="studonium-shop-heading">
        <div><p className="studonium-shop-eyebrow">PEQUEÑOS DETALLES, MUCHO DE TI</p><h1 id="shop-title">Tu tienda<span> ✧</span></h1><p>Un universo que pronto podrás hacer todavía más tuyo.</p></div>
        <span className="studonium-shop-sticker">a little bit of magic ♡</span>
      </header>

      {wallet.error && <p className="studonium-shop-error" role="alert">{wallet.error}</p>}

      <div className="studonium-shop-tabs" role="tablist" aria-label="Categorías de la tienda">
        <button id="shop-tab-coins" type="button" role="tab" aria-selected={category === 'coins'} aria-controls="shop-panel" tabIndex={category === 'coins' ? 0 : -1} onClick={() => onCategoryChange('coins')} onKeyDown={handleTabKey}>Monedas</button>
        <button id="shop-tab-frames" type="button" role="tab" aria-selected={category === 'frames'} aria-controls="shop-panel" tabIndex={category === 'frames' ? 0 : -1} onClick={() => onCategoryChange('frames')} onKeyDown={handleTabKey}>Marcos</button>
      </div>

      <section id="shop-panel" role="tabpanel" aria-labelledby={`shop-tab-${category}`} tabIndex={0} className="studonium-shop-panel">
        {category === 'coins' ? (
          <>
            <div className="studonium-shop-section-heading"><div><h2>Un extra de posibilidades</h2><p>Elige tu paquete de monedas Studonium.</p></div><span>COMPRAS PRÓXIMAMENTE</span></div>
            <div className="studonium-shop-packages">
              {COIN_PACKAGES.map((pack, index) => (
                <article key={pack.coins} className={`studonium-shop-package package-${index}`}>
                  <div className="studonium-shop-coin-art" aria-hidden="true">
                    <span className="studonium-shop-package-spark">✧</span>
                    {Array.from({ length: index + 1 }, (_, coinIndex) => <i key={coinIndex} className={`studonium-shop-coin coin-${coinIndex}`}>✦</i>)}
                  </div>
                  <h3>{formatCoins(pack.coins)} <span>monedas</span></h3>
                  <p className="studonium-shop-price">{formatPrice(pack.priceCents)}</p>
                  <button type="button" className="studonium-shop-primary" aria-label={`Comprar ${pack.coins} monedas por ${formatPrice(pack.priceCents)}, próximamente`} onClick={() => setSelectedPackage(pack.coins)}>Comprar</button>
                </article>
              ))}
            </div>
            <p className="studonium-shop-footnote">Catálogo de muestra. Los 500 de saldo inicial son monedas de ejemplo, sin valor monetario. Las compras aún no están activadas.</p>
          </>
        ) : (
          <FrameStore wallet={wallet} profile={profile} onOpenInventory={onOpenInventory} />
        )}
      </section>

      {selectedPackage !== null && <PackageNotice coins={selectedPackage} onClose={() => setSelectedPackage(null)} />}
    </section>
  );
}
