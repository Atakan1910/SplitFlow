import { useState, type FormEvent } from 'react';
import { UserPlus, X, Users } from 'lucide-react';
import type { Person } from '../types/expense';

interface Props {
  people: Person[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function ParticipantManager({ people, onAdd, onRemove }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
  };

  return (
    <section className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
          <Users size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
          Katılımcılar
        </h2>
        {people.length > 0 && (
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {people.length} kişi
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="İsim..."
          className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-md px-3 py-1.5 transition-opacity flex items-center gap-1.5 text-xs font-medium"
        >
          <UserPlus size={14} strokeWidth={1.5} />
          Ekle
        </button>
      </form>

      {people.length === 0 ? (
        <p className="text-[var(--text-muted)] text-xs py-2 text-center">
          Henüz katılımcı eklenmedi.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {people.map((p) => (
            <div
              key={p.id}
              className="group flex items-center gap-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md px-2.5 py-1 text-xs text-[var(--text-secondary)]"
            >
              <span>{p.name}</span>
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                className="text-[var(--text-muted)] hover:text-rose-500 transition-colors ml-0.5"
                title="Kaldır"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
