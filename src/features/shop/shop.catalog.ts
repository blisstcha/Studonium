export type ShopCategory = 'coins' | 'frames';

// Proporción de 2,99 € / 1.000 monedas: truncar euros y terminar en ,99.
export const COIN_PACKAGES = [1000, 2500, 5000, 10000].map((coins) => ({
  coins,
  priceCents: Math.floor((299 * coins) / 100_000) * 100 + 99,
}));

export function formatCoins(coins: number): string {
  return new Intl.NumberFormat('es-ES').format(coins);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
