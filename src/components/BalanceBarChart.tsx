import type { Person, Balance } from '../types/expense';
import { formatTL } from '../utils/currency';

interface Props {
  people: Person[];
  balances: Balance[];
}

export function BalanceBarChart({ people, balances }: Props) {
  const nameMap = new Map(people.map((p) => [p.id, p.name]));
  const sorted = balances.slice().sort((a, b) => b.amountInKurus - a.amountInKurus);
  const maxAbs = Math.max(...balances.map((b) => Math.abs(b.amountInKurus)), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
        <span>Bakiye Dağılımı</span>
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-rose-500" /> Borç
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Alacak
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {sorted.map((b) => {
          const name = nameMap.get(b.personId) ?? '?';
          const pct = Math.abs(b.amountInKurus) / maxAbs;
          const widthPct = Math.max(pct * 100, 2);
          const isPositive = b.amountInKurus >= 0;

          return (
            <div key={b.personId} className="flex items-center gap-2">
              <span className="w-20 text-xs text-[var(--text-secondary)] text-right truncate shrink-0">
                {name}
              </span>
              <div className="flex-1 flex items-center h-4 bg-[var(--bg-subtle)] rounded overflow-hidden border border-[var(--border)]">
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  )}
                </div>
                <div className="w-px h-full bg-[var(--border)] shrink-0" />
                <div className="w-1/2 flex justify-start">
                  {isPositive && b.amountInKurus > 0 && (
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  )}
                </div>
              </div>
              <span
                className={`w-24 text-xs font-mono tabular-nums text-right shrink-0 ${
                  b.amountInKurus > 0
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : b.amountInKurus < 0
                    ? 'text-rose-600 dark:text-rose-400 font-medium'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {b.amountInKurus > 0 ? '+' : ''}{formatTL(b.amountInKurus)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
