/**
 * WhatsApp metin üretici ve Canvas PNG kart çizici.
 */

import type { Person, Transfer, Balance } from '../types/expense';
import { formatTL } from './currency';

/** WhatsApp paylaşım metni üretir */
export function generateWhatsAppText(
  people: Person[],
  balances: Balance[],
  transfers: Transfer[],
  groupName?: string
): string {
  const nameMap = new Map(people.map((p) => [p.id, p.name]));
  const title = groupName ? `*SplitFlow — ${groupName}*` : '*SplitFlow — Hesap Özeti*';

  let text = `💰 ${title}\n\n`;

  // Bakiyeler
  text += '📊 *Net Bakiyeler:*\n';
  for (const b of balances) {
    const name = nameMap.get(b.personId) ?? '?';
    if (b.amountInKurus > 0) {
      text += `  ✅ ${name}: +${formatTL(b.amountInKurus)} alacaklı\n`;
    } else if (b.amountInKurus < 0) {
      text += `  🔴 ${name}: ${formatTL(b.amountInKurus)} borçlu\n`;
    } else {
      text += `  ⚪ ${name}: ${formatTL(0)} (denk)\n`;
    }
  }

  text += '\n';

  // Transferler
  if (transfers.length === 0) {
    text += '✨ Herkes denk — transfer gerekmiyor!';
  } else {
    text += `🔄 *Minimum Transferler (${transfers.length} işlem):*\n`;
    for (const t of transfers) {
      const from = nameMap.get(t.fromId) ?? '?';
      const to = nameMap.get(t.toId) ?? '?';
      text += `  💸 ${from} ➜ ${to}: ${formatTL(t.amountInKurus)}\n`;
    }
  }

  text += '\n_SplitFlow ile hesaplandı_ ✨';
  return text;
}

/** Clipboard'a kopyalar */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

/**
 * Canvas API ile şık bir PNG özet kartı üretir ve indirir.
 * Harici kütüphane kullanmaz — saf Canvas 2D.
 */
export function downloadPngCard(
  people: Person[],
  balances: Balance[],
  transfers: Transfer[],
  groupName?: string
): void {
  const nameMap = new Map(people.map((p) => [p.id, p.name]));

  const dpr = window.devicePixelRatio || 1;
  const W = 600;
  const lineH = 32;
  const paddingTop = 100;
  const sectionGap = 24;

  // Yükseklik hesapla
  const balanceLines = balances.length;
  const transferLines = Math.max(transfers.length, 1);
  const totalContentH =
    paddingTop +
    40 + // bakiye başlık
    balanceLines * lineH +
    sectionGap +
    40 + // transfer başlık
    transferLines * lineH +
    60; // alt boşluk

  const H = totalContentH;

  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);

  // Arka plan
  ctx.fillStyle = '#09090b';
  roundRect(ctx, 0, 0, W, H, 12);
  ctx.fill();

  // Kart kenarlık
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Üst çizgi
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(0, 0, W, 2);

  // Başlık
  ctx.fillStyle = '#f4f4f5';
  ctx.font = '600 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const displayTitle = groupName ? `SplitFlow · ${groupName}` : 'SplitFlow — Hesap Özeti';
  ctx.fillText(displayTitle, W / 2, 45);

  // Tarih
  ctx.fillStyle = '#71717a';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    W / 2,
    68
  );

  let y = paddingTop;

  // --- Bakiyeler ---
  ctx.textAlign = 'left';
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('NET BAKİYELER', 30, y);
  y += 26;

  ctx.font = '14px ui-monospace, Consolas, monospace';
  for (const b of balances) {
    const name = nameMap.get(b.personId) ?? '?';
    if (b.amountInKurus > 0) {
      ctx.fillStyle = '#34d399';
      ctx.fillText(`+${formatTL(b.amountInKurus).padEnd(12)}  ${name}`, 30, y);
    } else if (b.amountInKurus < 0) {
      ctx.fillStyle = '#fb7185';
      ctx.fillText(`${formatTL(b.amountInKurus).padEnd(12)}  ${name}`, 30, y);
    } else {
      ctx.fillStyle = '#71717a';
      ctx.fillText(`${formatTL(0).padEnd(12)}  ${name}`, 30, y);
    }
    y += lineH;
  }

  y += sectionGap;

  // --- Transferler ---
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('TRANSFER PLANI', 30, y);
  y += 26;

  ctx.font = '14px ui-monospace, Consolas, monospace';
  if (transfers.length === 0) {
    ctx.fillStyle = '#34d399';
    ctx.fillText('Hesaplar denk — transfer gerekmiyor.', 30, y);
  } else {
    for (const t of transfers) {
      const from = nameMap.get(t.fromId) ?? '?';
      const to = nameMap.get(t.toId) ?? '?';
      ctx.fillStyle = '#e4e4e7';
      ctx.fillText(`${from} → ${to}: ${formatTL(t.amountInKurus)}`, 30, y);
      y += lineH;
    }
  }

  // İndir
  const link = document.createElement('a');
  link.download = 'splitflow-ozet.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/** Canvas yardımcısı: yuvarlak köşeli dikdörtgen */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
