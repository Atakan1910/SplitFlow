export const CATEGORIES = [
  { id: 'food', label: 'Yemek' },
  { id: 'accommodation', label: 'Konaklama' },
  { id: 'transport', label: 'Ulaşım' },
  { id: 'grocery', label: 'Market' },
  { id: 'entertainment', label: 'Eğlence' },
  { id: 'other', label: 'Diğer' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export interface Person {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amountInKurus: number;
  tipInKurus: number;
  paidById: string;
  participantIds: string[];
  customSplits?: Record<string, number>;
  category: CategoryId;
  createdAt: number;
}

export interface Balance {
  personId: string;
  amountInKurus: number;
}

export interface Transfer {
  fromId: string;
  toId: string;
  amountInKurus: number;
}

export interface Group {
  id: string;
  name: string;
  people: Person[];
  expenses: Expense[];
  settledTransfers?: string[];
  createdAt: number;
}

export interface AppState {
  groups: Group[];
  activeGroupId: string;
}
