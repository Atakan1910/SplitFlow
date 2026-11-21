import { useState, type FormEvent } from 'react';
import { Plus, Check, X } from 'lucide-react';
import type { Person, Expense, CategoryId } from '../types/expense';
import { CATEGORIES } from '../types/expense';
import { tlToKurus, kurusToTlDisplay } from '../utils/currency';

interface Props {
  people: Person[];
  onAdd: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  editingExpense?: Expense | null;
  onUpdate?: (expense: Expense) => void;
  onCancelEdit?: () => void;
}

type SplitMode = 'even' | 'custom';

export function ExpenseForm({
  people,
  onAdd,
  editingExpense,
  onUpdate,
  onCancelEdit,
}: Props) {
  const [description, setDescription] = useState(editingExpense?.description ?? '');
  const [amount, setAmount] = useState(
    editingExpense ? kurusToTlDisplay(editingExpense.amountInKurus) : ''
  );
  const [tip, setTip] = useState(
    editingExpense && editingExpense.tipInKurus > 0
      ? kurusToTlDisplay(editingExpense.tipInKurus)
      : ''
  );
  const [paidById, setPaidById] = useState(editingExpense?.paidById ?? '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(editingExpense?.participantIds ?? [])
  );
  const [category, setCategory] = useState<CategoryId>(editingExpense?.category ?? 'other');
  const [splitMode, setSplitMode] = useState<SplitMode>(
    editingExpense?.customSplits && Object.keys(editingExpense.customSplits).length > 0
      ? 'custom'
      : 'even'
  );
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (!editingExpense?.customSplits) return {};
    const ca: Record<string, string> = {};
    for (const [k, v] of Object.entries(editingExpense.customSplits)) {
      ca[k] = kurusToTlDisplay(v);
    }
    return ca;
  });

  // editingExpense id'si değiştiğinde formu senkronize et
  const [prevEditingId, setPrevEditingId] = useState(editingExpense?.id);
  if (editingExpense?.id !== prevEditingId) {
    setPrevEditingId(editingExpense?.id);
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmount(kurusToTlDisplay(editingExpense.amountInKurus));
      setTip(editingExpense.tipInKurus > 0 ? kurusToTlDisplay(editingExpense.tipInKurus) : '');
      setPaidById(editingExpense.paidById);
      setSelectedIds(new Set(editingExpense.participantIds));
      setCategory(editingExpense.category);
      if (editingExpense.customSplits && Object.keys(editingExpense.customSplits).length > 0) {
        setSplitMode('custom');
        const ca: Record<string, string> = {};
        for (const [k, v] of Object.entries(editingExpense.customSplits)) {
          ca[k] = kurusToTlDisplay(v);
        }
        setCustomAmounts(ca);
      } else {
        setSplitMode('even');
        setCustomAmounts({});
      }
    } else {
      setDescription('');
      setAmount('');
      setTip('');
      setPaidById('');
      setSelectedIds(new Set());
      setCategory('other');
      setSplitMode('even');
      setCustomAmounts({});
    }
  }

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCustomAmounts((ca) => {
          const copy = { ...ca };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(people.map((p) => p.id)));
  };

  const totalKurus = tlToKurus(amount) + tlToKurus(tip);
  const assignedKurus = Array.from(selectedIds).reduce(
    (sum, id) => sum + tlToKurus(customAmounts[id] ?? '0'),
    0
  );
  const remainingKurus = totalKurus - assignedKurus;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const amountKurus = tlToKurus(amount);
    const tipKurus = tlToKurus(tip);
    if (!description.trim() || amountKurus <= 0 || !paidById || selectedIds.size === 0) return;

    let customSplits: Record<string, number> | undefined;

    if (splitMode === 'custom') {
      const total = amountKurus + tipKurus;
      const assigned = Array.from(selectedIds).reduce(
        (sum, id) => sum + tlToKurus(customAmounts[id] ?? '0'),
        0
      );
      if (assigned !== total) return;

      customSplits = {};
      for (const id of selectedIds) {
        customSplits[id] = tlToKurus(customAmounts[id] ?? '0');
      }
    }

    if (editingExpense && onUpdate) {
      onUpdate({
        ...editingExpense,
        description: description.trim(),
        amountInKurus: amountKurus,
        tipInKurus: tipKurus,
        paidById,
        participantIds: Array.from(selectedIds),
        category,
        customSplits,
      });
      if (onCancelEdit) onCancelEdit();
    } else {
      onAdd({
        description: description.trim(),
        amountInKurus: amountKurus,
        tipInKurus: tipKurus,
        paidById,
        participantIds: Array.from(selectedIds),
        category,
        customSplits,
      });
    }

    setDescription('');
    setAmount('');
    setTip('');
    setPaidById('');
    setSelectedIds(new Set());
    setCategory('other');
    setSplitMode('even');
    setCustomAmounts({});
  };

  if (people.length < 2) {
    return (
      <section className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] shadow-sm transition-colors">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-2">Harcama Ekle</h2>
        <p className="text-[var(--text-muted)] text-xs py-2 text-center">
          Harcama eklemek için en az 2 katılımcı gerekli.
        </p>
      </section>
    );
  }

  const isCustomValid =
    splitMode === 'even' || (splitMode === 'custom' && remainingKurus === 0 && totalKurus > 0);
  const canSubmit =
    description.trim() !== '' &&
    tlToKurus(amount) > 0 &&
    paidById !== '' &&
    selectedIds.size > 0 &&
    isCustomValid;

  return (
    <section className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[var(--text-primary)]">
          {editingExpense ? 'Harcamayı Düzenle' : 'Harcama Ekle'}
        </h2>
        {editingExpense && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
          >
            <X size={12} strokeWidth={1.5} /> İptal
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Açıklama"
          className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
        />

        {/* Kategoriler */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                category === cat.id
                  ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
                  : 'bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tutar ve Bahşiş */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs font-mono">₺</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Tutar"
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md pl-6 pr-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-colors font-mono tabular-nums"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs font-mono">₺</span>
            <input
              type="text"
              inputMode="decimal"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              placeholder="Bahşiş (opsiyonel)"
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md pl-6 pr-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-colors font-mono tabular-nums"
            />
          </div>
        </div>

        {/* Ödeyen */}
        <div>
          <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Ödeyen</label>
          <div className="flex flex-wrap gap-1">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaidById(p.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  paidById === p.id
                    ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
                    : 'bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Katılımcılar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-[var(--text-secondary)]">Katılımcılar</label>
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Tümünü seç
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleParticipant(p.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  selectedIds.has(p.id)
                    ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
                    : 'bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bölüşüm Modu */}
        {selectedIds.size > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-2 bg-[var(--bg-subtle)] rounded-md p-0.5 border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setSplitMode('even')}
                className={`flex-1 text-xs py-1 rounded transition-colors ${
                  splitMode === 'even'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-medium shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Eşit Böl
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('custom')}
                className={`flex-1 text-xs py-1 rounded transition-colors ${
                  splitMode === 'custom'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-medium shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Özel Tutar
              </button>
            </div>

            {splitMode === 'custom' && (
              <div className="space-y-1.5 bg-[var(--bg-subtle)] rounded-md p-2.5 border border-[var(--border)]">
                {people
                  .filter((p) => selectedIds.has(p.id))
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-primary)] w-24 truncate">{p.name}</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs font-mono">₺</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customAmounts[p.id] ?? ''}
                          onChange={(e) =>
                            setCustomAmounts((prev) => ({
                              ...prev,
                              [p.id]: e.target.value,
                            }))
                          }
                          placeholder="0,00"
                          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded pl-5 pr-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] font-mono tabular-nums"
                        />
                      </div>
                    </div>
                  ))}

                <div
                  className={`flex items-center justify-between pt-1.5 border-t border-[var(--border)] text-xs font-mono tabular-nums ${
                    remainingKurus === 0
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : remainingKurus > 0
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-rose-500 dark:text-rose-400'
                  }`}
                >
                  <span>Kalan:</span>
                  <span>
                    {remainingKurus === 0
                      ? 'Denk'
                      : `₺${kurusToTlDisplay(remainingKurus)} ${remainingKurus > 0 ? 'eksik' : 'fazla'}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-md px-3 py-2 text-xs font-medium transition-opacity flex items-center justify-center gap-1.5"
        >
          {editingExpense ? (
            <>
              <Check size={14} strokeWidth={1.5} />
              Kaydet
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={1.5} />
              Harcama Ekle
            </>
          )}
        </button>
      </form>
    </section>
  );
}
