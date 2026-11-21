import { useEffect, useState } from 'react';

const WALLET_KEY = 'studonium.wallet.v1';
const INITIAL_BALANCE = 500;

interface WalletState {
  balance: number | null;
  exists: boolean;
  error: string;
}

function readWallet(): WalletState {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw === null) return { balance: INITIAL_BALANCE, exists: false, error: '' };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('balance' in parsed) ||
      typeof parsed.balance !== 'number' || !Number.isSafeInteger(parsed.balance) || parsed.balance < 0) {
      throw new Error('Invalid wallet');
    }
    return { balance: parsed.balance, exists: true, error: '' };
  } catch {
    return { balance: null, exists: false, error: 'No se ha podido recuperar el saldo local. No se ha sobrescrito. Comprueba el almacenamiento del navegador y recarga.' };
  }
}

export function useWallet() {
  const [wallet, setWallet] = useState(readWallet);

  useEffect(() => {
    function refresh() {
      const current = readWallet();
      if (!current.error && !current.exists) {
        try {
          localStorage.setItem(WALLET_KEY, JSON.stringify({ balance: INITIAL_BALANCE }));
          setWallet({ balance: INITIAL_BALANCE, exists: true, error: '' });
        } catch {
          setWallet({ balance: null, exists: false, error: 'El navegador no permite guardar el saldo. No se han añadido monedas. Revisa sus ajustes de almacenamiento.' });
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
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return wallet;
}
