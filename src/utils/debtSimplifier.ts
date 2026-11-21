/**
 * Borç Sadeleştirme Algoritması (Greedy Min-Transfer).
 * 
 * 1. Her kişinin net bakiyesini hesapla.
 * 2. Pozitif bakiyeler (alacaklılar) ve negatif bakiyeler (borçlular) olarak ayır.
 * 3. En büyük borçlu ile en büyük alacaklıyı eşleştirerek minimum transfer listesi üret.
 *
 * Tüm hesaplamalar kuruş (integer) cinsindendir — floating-point hatası sıfırdır.
 */

import type { Expense, Balance, Transfer } from '../types/expense';
import { splitEvenly } from './currency';

/** Her kişinin net bakiyesini hesaplar (pozitif = alacaklı, negatif = borçlu). */
export function calculateBalances(
  personIds: string[],
  expenses: Expense[]
): Balance[] {
  const map = new Map<string, number>();
  for (const id of personIds) {
    map.set(id, 0);
  }

  for (const expense of expenses) {
    const totalKurus = expense.amountInKurus + expense.tipInKurus;
    const participants = expense.participantIds;

    // Ödeyenin bakiyesine toplam tutarı ekle (alacak)
    const payerBalance = map.get(expense.paidById) ?? 0;
    map.set(expense.paidById, payerBalance + totalKurus);

    // Her katılımcının payını düş (borç)
    if (expense.customSplits && Object.keys(expense.customSplits).length > 0) {
      // Özel paylaşım
      for (const pid of participants) {
        const share = expense.customSplits[pid] ?? 0;
        const current = map.get(pid) ?? 0;
        map.set(pid, current - share);
      }
    } else {
      // Eşit bölüşüm
      const shares = splitEvenly(totalKurus, participants.length);
      for (let i = 0; i < participants.length; i++) {
        const pid = participants[i];
        const current = map.get(pid) ?? 0;
        map.set(pid, current - shares[i]);
      }
    }
  }

  return personIds.map((id) => ({
    personId: id,
    amountInKurus: map.get(id) ?? 0,
  }));
}

/**
 * Greedy borç sadeleştirme: en büyük borçlu ↔ en büyük alacaklı eşleştirmesi.
 * Zaman karmaşıklığı: O(n²) — küçük gruplar için fazlasıyla yeterli.
 */
export function simplifyDebts(balances: Balance[]): Transfer[] {
  // Bakiyeleri kopyala ve sıfır olanları at
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.amountInKurus < 0) {
      debtors.push({ id: b.personId, amount: -b.amountInKurus }); // pozitife çevir
    } else if (b.amountInKurus > 0) {
      creditors.push({ id: b.personId, amount: b.amountInKurus });
    }
  }

  // Büyükten küçüğe sırala
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];
    const settled = Math.min(debtor.amount, creditor.amount);

    if (settled > 0) {
      transfers.push({
        fromId: debtor.id,
        toId: creditor.id,
        amountInKurus: settled,
      });
    }

    debtor.amount -= settled;
    creditor.amount -= settled;

    if (debtor.amount === 0) di++;
    if (creditor.amount === 0) ci++;
  }

  return transfers;
}
