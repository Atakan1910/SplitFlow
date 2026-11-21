import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trash2, Split, Sun, Moon } from 'lucide-react';
import { useSplitStore } from './hooks/useSplitStore';
import { ParticipantManager } from './components/ParticipantManager';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { SettlementPanel } from './components/SettlementPanel';
import { GroupSelector } from './components/GroupSelector';
import { KpiCards } from './components/KpiCards';
import { urlHashToState } from './utils/urlState';
import type { Expense, AppState } from './types/expense';

export default function App() {
  const {
    groups,
    activeGroup,
    addGroup,
    removeGroup,
    switchGroup,
    renameGroup,
    people,
    expenses,
    settledTransfers,
    addPerson,
    removePerson,
    addExpense,
    updateExpense,
    removeExpense,
    toggleTransferSettled,
    loadDemo,
    clearAll,
    fullState,
    setState,
  } = useSplitStore();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('splitflow-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('splitflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [undoToast, setUndoToast] = useState<{ message: string; snapshot: AppState } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // URL hash dinleyici
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#data=')) {
        const imported = urlHashToState(hash);
        if (imported) {
          setState(imported);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setState]);

  const triggerUndoableAction = (message: string, action: () => void) => {
    const snapshot = JSON.parse(JSON.stringify(fullState)) as AppState;
    action();
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setUndoToast({ message, snapshot });
    toastTimeoutRef.current = window.setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (undoToast) {
      setState(undoToast.snapshot);
      setUndoToast(null);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    }
  };

  const handleRemovePerson = (id: string) => {
    const p = people.find((x) => x.id === id);
    triggerUndoableAction(`"${p?.name ?? 'Kişi'}" silindi`, () => removePerson(id));
  };

  const handleRemoveExpense = (id: string) => {
    const e = expenses.find((x) => x.id === id);
    if (editingExpense?.id === id) setEditingExpense(null);
    triggerUndoableAction(`"${e?.description ?? 'Harcama'}" silindi`, () => removeExpense(id));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center">
              <Split size={15} strokeWidth={1.5} className="text-[var(--text-primary)]" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] leading-none">
                SplitFlow
              </h1>
              <p className="text-[10px] text-[var(--text-muted)] font-mono leading-none mt-0.5">
                Ortak Harcama Bölücü
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GroupSelector
              groups={groups}
              activeGroup={activeGroup}
              onSwitch={switchGroup}
              onAdd={addGroup}
              onRemove={removeGroup}
              onRename={renameGroup}
            />
            <button
              type="button"
              onClick={loadDemo}
              className="text-xs bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] rounded-md px-2.5 py-1.5 transition-colors font-medium"
              title="Bozcaada Hafta Sonu senaryosunu yükle"
            >
              Demo Yükle
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border)] p-1.5 rounded-md transition-colors"
              title={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
            >
              {theme === 'dark' ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
            </button>
            {(people.length > 0 || expenses.length > 0) && (
              <button
                type="button"
                onClick={() => triggerUndoableAction('Tüm veriler temizlendi', clearAll)}
                className="text-[var(--text-muted)] hover:text-rose-500 p-1.5 transition-colors"
                title="Tüm veriyi temizle"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <KpiCards people={people} expenses={expenses} />

        <ParticipantManager
          people={people}
          onAdd={addPerson}
          onRemove={handleRemovePerson}
        />

        <ExpenseForm
          people={people}
          onAdd={addExpense}
          editingExpense={editingExpense}
          onUpdate={updateExpense}
          onCancelEdit={() => setEditingExpense(null)}
        />

        <ExpenseList
          expenses={expenses}
          people={people}
          onRemove={handleRemoveExpense}
          onEdit={(exp) => setEditingExpense(exp)}
        />

        <SettlementPanel
          people={people}
          expenses={expenses}
          fullState={fullState}
          groupName={activeGroup.name}
          settledTransfers={settledTransfers}
          onToggleSettled={toggleTransferSettled}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-10">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center text-xs text-[var(--text-muted)] font-mono">
          SplitFlow · %100 İstemci Taraflı Hesaplama
        </div>
      </footer>

      {/* Undo Toast */}
      {undoToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3.5 py-2.5 shadow-lg text-xs"
        >
          <span className="text-[var(--text-primary)]">{undoToast.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1 font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] bg-[var(--bg-subtle)] border border-[var(--border)] px-2 py-1 rounded transition-colors"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            Geri Al
          </button>
        </aside>
      )}
    </div>
  );
}
