import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Person, Expense, AppState, Group, CategoryId } from '../types/expense';
import { generateId } from '../utils/currency';

const STORAGE_KEY = 'splitflow-data';

function createEmptyGroup(name: string): Group {
  return {
    id: generateId(),
    name,
    people: [],
    expenses: [],
    settledTransfers: [],
    createdAt: Date.now(),
  };
}

function migrateOldState(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.groups && parsed.activeGroupId) return parsed as AppState;
    if (parsed.people && parsed.expenses) {
      const group: Group = {
        id: generateId(),
        name: 'Genel',
        people: parsed.people,
        expenses: parsed.expenses.map((e: Expense & { category?: CategoryId }) => ({
          ...e,
          category: e.category ?? 'other',
        })),
        settledTransfers: [],
        createdAt: Date.now(),
      };
      return { groups: [group], activeGroupId: group.id };
    }
  } catch {
    //
  }
  return null;
}

function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const migrated = migrateOldState(raw);
    if (migrated) return migrated;
  }
  const defaultGroup = createEmptyGroup('Genel');
  return { groups: [defaultGroup], activeGroupId: defaultGroup.id };
}

function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDemoData(): AppState {
  const people: Person[] = [
    { id: 'p-can', name: 'Can' },
    { id: 'p-selin', name: 'Selin' },
    { id: 'p-mert', name: 'Mert' },
    { id: 'p-elif', name: 'Elif' },
  ];

  const allIds = people.map((p) => p.id);

  const expenses: Expense[] = [
    {
      id: generateId(),
      description: 'Otoyol & Feribot',
      amountInKurus: 185000,
      tipInKurus: 0,
      paidById: 'p-can',
      participantIds: allIds,
      category: 'transport',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: generateId(),
      description: 'Akşam Yemeği',
      amountInKurus: 360000,
      tipInKurus: 40000,
      paidById: 'p-selin',
      participantIds: allIds,
      category: 'food',
      createdAt: Date.now() - 86400000,
    },
    {
      id: generateId(),
      description: 'Market',
      amountInKurus: 112000,
      tipInKurus: 0,
      paidById: 'p-mert',
      participantIds: allIds,
      category: 'grocery',
      createdAt: Date.now() - 43200000,
    },
    {
      id: generateId(),
      description: 'Yakıt',
      amountInKurus: 140000,
      tipInKurus: 0,
      paidById: 'p-elif',
      participantIds: allIds,
      category: 'transport',
      createdAt: Date.now() - 21600000,
    },
  ];

  const demoGroup: Group = {
    id: 'demo-bozcaada',
    name: 'Bozcaada Hafta Sonu',
    people,
    expenses,
    settledTransfers: [],
    createdAt: Date.now(),
  };

  return { groups: [demoGroup], activeGroupId: demoGroup.id };
}

export function useSplitStore() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeGroup = useMemo(
    () => state.groups.find((g) => g.id === state.activeGroupId) ?? state.groups[0],
    [state]
  );

  const addGroup = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const g = createEmptyGroup(trimmed);
    setState((prev) => ({
      groups: [...prev.groups, g],
      activeGroupId: g.id,
    }));
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setState((prev) => {
      const remaining = prev.groups.filter((g) => g.id !== groupId);
      if (remaining.length === 0) {
        const fallback = createEmptyGroup('Genel');
        return { groups: [fallback], activeGroupId: fallback.id };
      }
      return {
        groups: remaining,
        activeGroupId:
          prev.activeGroupId === groupId ? remaining[0].id : prev.activeGroupId,
      };
    });
  }, []);

  const switchGroup = useCallback((groupId: string) => {
    setState((prev) => ({ ...prev, activeGroupId: groupId }));
  }, []);

  const renameGroup = useCallback((groupId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, name: trimmed } : g
      ),
    }));
  }, []);

  const updateActiveGroup = useCallback(
    (updater: (group: Group) => Group) => {
      setState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === prev.activeGroupId ? updater(g) : g
        ),
      }));
    },
    []
  );

  const addPerson = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateActiveGroup((g) => ({
        ...g,
        people: [...g.people, { id: generateId(), name: trimmed }],
      }));
    },
    [updateActiveGroup]
  );

  const removePerson = useCallback(
    (personId: string) => {
      updateActiveGroup((g) => ({
        ...g,
        people: g.people.filter((p) => p.id !== personId),
        expenses: g.expenses
          .filter(
            (e) =>
              e.paidById !== personId &&
              !e.participantIds.every((pid) => pid === personId)
          )
          .map((e) => ({
            ...e,
            participantIds: e.participantIds.filter((pid) => pid !== personId),
          }))
          .filter((e) => e.participantIds.length > 0),
      }));
    },
    [updateActiveGroup]
  );

  const addExpense = useCallback(
    (expense: Omit<Expense, 'id' | 'createdAt'>) => {
      updateActiveGroup((g) => ({
        ...g,
        expenses: [
          ...g.expenses,
          { ...expense, id: generateId(), createdAt: Date.now() },
        ],
      }));
    },
    [updateActiveGroup]
  );

  const updateExpense = useCallback(
    (expense: Expense) => {
      updateActiveGroup((g) => ({
        ...g,
        expenses: g.expenses.map((e) => (e.id === expense.id ? expense : e)),
      }));
    },
    [updateActiveGroup]
  );

  const removeExpense = useCallback(
    (expenseId: string) => {
      updateActiveGroup((g) => ({
        ...g,
        expenses: g.expenses.filter((e) => e.id !== expenseId),
      }));
    },
    [updateActiveGroup]
  );

  const toggleTransferSettled = useCallback(
    (transferKey: string) => {
      updateActiveGroup((g) => {
        const settled = g.settledTransfers ?? [];
        const exists = settled.includes(transferKey);
        return {
          ...g,
          settledTransfers: exists
            ? settled.filter((k) => k !== transferKey)
            : [...settled, transferKey],
        };
      });
    },
    [updateActiveGroup]
  );

  const loadDemo = useCallback(() => {
    setState(getDemoData());
  }, []);

  const clearAll = useCallback(() => {
    const fresh = createEmptyGroup('Genel');
    setState({ groups: [fresh], activeGroupId: fresh.id });
  }, []);

  return {
    groups: state.groups,
    activeGroup,
    addGroup,
    removeGroup,
    switchGroup,
    renameGroup,
    people: activeGroup.people,
    expenses: activeGroup.expenses,
    settledTransfers: activeGroup.settledTransfers ?? [],
    addPerson,
    removePerson,
    addExpense,
    updateExpense,
    removeExpense,
    toggleTransferSettled,
    loadDemo,
    clearAll,
    fullState: state,
    setState,
  };
}
