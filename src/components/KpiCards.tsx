import { Wallet, Users, GitBranch } from 'lucide-react';
import type { Person, Expense } from '../types/expense';
import { formatTL } from '../utils/currency';
import { calculateBalances, simplifyDebts } from '../utils/debtSimplifier';

interface Props {
  people: Person[];
  expenses: Expense[];
}

export function KpiCards({ people, expenses }: Props) {
  if (expenses.length === 0 || people.length === 0) return null;

  const totalKurus = expenses.reduce(
    (sum, e) => sum + e.amountInKurus + e.tipInKurus,
    0
  );
  const perPersonKurus = people.length > 0 ? Math.round(totalKurus / people.length) : 0;

  const personIds = people.map((p) => p.id);
  const balances = calculateBalances(personIds, expenses);
  const transfers = simplifyDebts(balances);

  const naiveTransfers = expenses.reduce(
    (sum, e) => sum + (e.participantIds.length - (e.participantIds.includes(e.paidById) ? 1 : 0)),
    0
  );
  const optimizedCount = transfers.length;
  const savingPercent =
    naiveTransfers > 0
      ? Math.round(((naiveTransfers - optimizedCount) / naiveTransfers) * 100)
      : 0;

  const cards = [
    {
      icon: <Wallet size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />,
      label: 'Toplam Harcama',
      value: formatTL(totalKurus),
      sub: `${expenses.length} harcama`,
    },
    {
      icon: <Users size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />,
      label: 'Kişi Başı Ortalama',
      value: formatTL(perPersonKurus),
      sub: `${people.length} kişi`,
    },
    {
      icon: <GitBranch size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />,
      label: 'Algoritma Kazancı',
      value: `${naiveTransfers} → ${optimizedCount}`,
      sub: savingPercent > 0 ? `%${savingPercent} tasarruf` : 'Optimal',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] shadow-sm flex flex-col gap-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center">
              {c.icon}
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{c.label}</span>
          </div>
          <div className="text-base font-semibold text-[var(--text-primary)] font-mono tabular-nums leading-none">
            {c.value}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
