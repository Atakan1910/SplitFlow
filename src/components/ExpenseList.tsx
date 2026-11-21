import { Trash2, Receipt, Pencil } from 'lucide-react';
import type { Person, Expense } from '../types/expense';
import { CATEGORIES } from '../types/expense';
import { formatTL } from '../utils/currency';

interface Props {
  expenses: Expense[];
  people: Person[];
  onRemove: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

export function ExpenseList({ expenses, people, onRemove, onEdit }: Props) {
  const nameMap = new Map(people.map((p) => [p.id, p.name]));

  if (expenses.length === 0) {
    return (
      <section className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] shadow-sm transition-colors">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <Receipt size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
          Harcamalar
        </h2>
        <p className="text-[var(--text-muted)] text-xs py-2 text-center">
          Henüz harcama eklenmedi.
        </p>
      </section>
    );
  }

  const totalKurus = expenses.reduce(
    (sum, e) => sum + e.amountInKurus + e.tipInKurus,
    0
  );

  return (
    <section className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
          <Receipt size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
          Harcamalar
          <span className="text-xs font-mono text-[var(--text-muted)]">
            ({expenses.length})
          </span>
        </h2>
        <span className="text-xs text-[var(--text-secondary)] font-mono tabular-nums">
          Toplam: <span className="text-[var(--text-primary)] font-medium">{formatTL(totalKurus)}</span>
        </span>
      </div>

      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
        {expenses
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((exp) => {
            const payer = nameMap.get(exp.paidById) ?? '?';
            const participants = exp.participantIds
              .map((id) => nameMap.get(id) ?? '?')
              .join(', ');
            const total = exp.amountInKurus + exp.tipInKurus;
            const cat = CATEGORIES.find((c) => c.id === exp.category) ?? CATEGORIES[5];

            return (
              <div
                key={exp.id}
                onClick={() => onEdit?.(exp)}
                className="group flex items-start gap-2.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border)] rounded-md p-2.5 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                      {cat.label}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {exp.description}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)] font-mono tabular-nums ml-auto shrink-0">
                      {formatTL(total)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <span className="text-[var(--text-secondary)]">{payer}</span>
                    {exp.tipInKurus > 0 && (
                      <span>(bahşiş: {formatTL(exp.tipInKurus)})</span>
                    )}
                    {exp.customSplits && (
                      <span className="text-[var(--text-secondary)]">· özel</span>
                    )}
                    <span>·</span>
                    <span className="truncate">{participants}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(exp);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity p-1"
                    title="Düzenle"
                  >
                    <Pencil size={13} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(exp.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-500 transition-opacity p-1"
                    title="Sil"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
