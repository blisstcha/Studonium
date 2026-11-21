import { useEffect, useState } from 'react';
import { buyFrame, equipFrame, readWallet, WALLET_KEY, writeWallet } from './wallet.storage';

export function useWallet() {
  const [wallet, setWallet] = useState(readWallet);

  useEffect(() => {
    function refresh() {
      const current = readWallet();
      if (current.data && current.needsSave) {
        try {
          writeWallet(current.data);
          setWallet({ ...current, needsSave: false });
        } catch {
          setWallet({ data: null, needsSave: false, error: 'El navegador no permite guardar el saldo y el inventario. Revisa sus ajustes de almacenamiento. No se han descontado monedas.' });
        }
      } else {
        setWallet(current);
      }
    }
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === WALLET_KEY || event.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('studonium:wallet-changed', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('studonium:wallet-changed', refresh);
    };
  }, []);

  return {
    balance: wallet.data?.balance ?? null,
    ownedFrameIds: wallet.data?.ownedFrameIds ?? [],
    equippedFrameId: wallet.data?.equippedFrameId ?? null,
    error: wallet.error,
    buyFrame,
    equipFrame,
  };
}

export type WalletController = ReturnType<typeof useWallet>;
