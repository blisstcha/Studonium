import { findFrame, PREVIEW_FRAME_IDS, STARTER_FRAME_ID } from '../frames/frames.catalog';

export const WALLET_KEY = 'studonium.wallet.v1';

export interface WalletData {
  balance: number;
  ownedFrameIds: string[];
  equippedFrameId: string | null;
  grantedFrameIds: string[];
}

export interface WalletState {
  data: WalletData | null;
  needsSave: boolean;
  error: string;
}

export function readWallet(): WalletState {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw === null) return { data: { balance: 500, ownedFrameIds: [STARTER_FRAME_ID, ...PREVIEW_FRAME_IDS], equippedFrameId: null, grantedFrameIds: [...PREVIEW_FRAME_IDS] }, needsSave: true, error: '' };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid wallet');
    const value = parsed as Record<string, unknown>;
    if (typeof value.balance !== 'number' || !Number.isSafeInteger(value.balance) || value.balance < 0) throw new Error('Invalid balance');

    // Migrate the previous balance-only wallet. The first frame is a gift,
    // and the existing coin balance is preserved, including a zero balance.
    const owned = value.ownedFrameIds === undefined ? [STARTER_FRAME_ID] : value.ownedFrameIds;
    if (!Array.isArray(owned) || !owned.every((id) => typeof id === 'string' && id.length > 0) || new Set(owned).size !== owned.length) throw new Error('Invalid inventory');
    const equipped = value.equippedFrameId === undefined ? null : value.equippedFrameId;
    if (equipped !== null && (typeof equipped !== 'string' || !owned.includes(equipped))) throw new Error('Invalid equipped frame');

    const granted = value.grantedFrameIds === undefined ? [] : value.grantedFrameIds;
    if (!Array.isArray(granted) || !granted.every((id) => typeof id === 'string' && id.length > 0) || new Set(granted).size !== granted.length) throw new Error('Invalid frame grants');
    const newGifts = PREVIEW_FRAME_IDS.filter((id) => !granted.includes(id));
    const nextOwned = [...owned];
    for (const id of newGifts) {
      if (!nextOwned.includes(id)) nextOwned.push(id);
    }

    return { data: { balance: value.balance, ownedFrameIds: nextOwned, equippedFrameId: typeof equipped === 'string' ? equipped : null, grantedFrameIds: [...granted, ...newGifts] }, needsSave: value.ownedFrameIds === undefined || value.equippedFrameId === undefined || value.grantedFrameIds === undefined || newGifts.length > 0, error: '' };
  } catch {
    return { data: null, needsSave: false, error: 'No se ha podido recuperar el saldo o el inventario local. No se ha sobrescrito. Comprueba el almacenamiento del navegador y recarga.' };
  }
}

export function writeWallet(data: WalletData): void {
  try {
    localStorage.setItem(WALLET_KEY, JSON.stringify(data));
  } catch {
    throw new Error('No se ha podido guardar el cambio. Tu saldo, inventario y selección anteriores se conservan.');
  }
  window.dispatchEvent(new Event('studonium:wallet-changed'));
}

export function buyFrame(id: string): void {
  const frame = findFrame(id);
  if (!frame) throw new Error('Este marco no está disponible.');
  const stored = readWallet();
  if (!stored.data || stored.error) throw new Error(stored.error);
  if (stored.data.ownedFrameIds.includes(id)) return;
  if (stored.data.balance < frame.price) throw new Error('Todavía no tienes suficientes monedas para este marco.');
  // Balance and ownership are saved in one operation, with no partial debit.
  writeWallet({ ...stored.data, balance: stored.data.balance - frame.price, ownedFrameIds: [...stored.data.ownedFrameIds, id] });
}

export function equipFrame(id: string | null): void {
  const stored = readWallet();
  if (!stored.data || stored.error) throw new Error(stored.error);
  if (id !== null && (!findFrame(id) || !stored.data.ownedFrameIds.includes(id))) throw new Error('Este marco todavía no está en tu inventario.');
  writeWallet({ ...stored.data, equippedFrameId: id });
}
