import { useState, useRef, useEffect } from 'react';
import { Folder, Plus, ChevronDown, Trash2, Pencil, Check, X } from 'lucide-react';
import type { Group } from '../types/expense';

interface Props {
  groups: Group[];
  activeGroup: Group;
  onSwitch: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function GroupSelector({
  groups,
  activeGroup,
  onSwitch,
  onAdd,
  onRemove,
  onRename,
}: Props) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
      setAdding(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border)] rounded-md px-2.5 py-1.5 transition-colors text-[var(--text-primary)]"
      >
        <Folder size={14} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
        <span className="max-w-[120px] truncate font-medium">{activeGroup.name}</span>
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-60 bg-[var(--bg-card)] border border-[var(--border)] rounded-md shadow-xl z-50 overflow-hidden">
          <div className="p-1 max-h-56 overflow-y-auto">
            {groups.map((g) => (
              <div key={g.id} className="group">
                {editingId === g.id ? (
                  <div className="flex items-center gap-1 px-1.5 py-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(g.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    />
                    <button onClick={() => handleRename(g.id)} className="text-emerald-500 p-0.5">
                      <Check size={12} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-[var(--text-muted)] p-0.5">
                      <X size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitch(g.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                      g.id === activeGroup.id
                        ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Folder size={13} strokeWidth={1.5} className="text-[var(--text-muted)] shrink-0" />
                    <span className="flex-1 text-left truncate">{g.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono tabular-nums">{g.expenses.length}</span>

                    <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-1">
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(g.id);
                          setEditName(g.name);
                        }}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <Pencil size={11} strokeWidth={1.5} />
                      </span>
                      {groups.length > 1 && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(g.id);
                          }}
                          className="text-[var(--text-muted)] hover:text-rose-500"
                        >
                          <Trash2 size={11} strokeWidth={1.5} />
                        </span>
                      )}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] p-1">
            {adding ? (
              <div className="flex items-center gap-1 px-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') setAdding(false);
                  }}
                  placeholder="Grup adı..."
                  autoFocus
                  className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
                />
                <button onClick={handleAdd} className="text-emerald-500 p-0.5">
                  <Check size={12} strokeWidth={1.5} />
                </button>
                <button onClick={() => setAdding(false)} className="text-[var(--text-muted)] p-0.5">
                  <X size={12} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAdding(true);
                  setNewName('');
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <Plus size={13} strokeWidth={1.5} />
                Yeni Grup
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
