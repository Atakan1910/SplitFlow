/**
 * Kuruş ↔ TL dönüşüm ve formatlama yardımcıları.
 * Tüm aritmetik işlemler kuruş (integer) üzerinden yapılır.
 */

/** TL string → kuruş integer. "125.50" → 12550 */
export function tlToKurus(tl: string): number {
  const cleaned = tl.replace(/[^0-9.,]/g, '').replace(',', '.');
  if (cleaned === '' || isNaN(Number(cleaned))) return 0;
  return Math.round(Number(cleaned) * 100);
}

/** Kuruş integer → TL display string. 12550 → "125,50" */
export function kurusToTlDisplay(kurus: number): string {
  const abs = Math.abs(kurus);
  const lira = Math.floor(abs / 100);
  const remaining = abs % 100;
  const sign = kurus < 0 ? '-' : '';
  return `${sign}${lira.toLocaleString('tr-TR')},${remaining.toString().padStart(2, '0')}`;
}

/** Kuruş integer → TL display string with ₺ symbol. 12550 → "₺125,50" */
export function formatTL(kurus: number): string {
  return `₺${kurusToTlDisplay(kurus)}`;
}

/** Tutarı kuruş cinsinden eşit bölüştürür. Kalan kuruşlar ilk kişilere dağıtılır. */
export function splitEvenly(totalKurus: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(totalKurus / count);
  const remainder = totalKurus % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** UUID v4 benzeri basit id üreteci */
export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
