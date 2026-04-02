export interface Transaction {
  id: number;
  title: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  date: string;
  created_at?: string;
  updated_at?: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;

export interface Item {
  id: number;
  name: string;
}

export interface Category {
  name: string;
  type: 'income' | 'expense';
}

export const DEFAULT_CATEGORIES: Category[] = [
  // 支出
  { name: '食費', type: 'expense' },
  { name: '日用品', type: 'expense' },
  { name: '交通費', type: 'expense' },
  { name: '衣服', type: 'expense' },
  { name: '住居費', type: 'expense' },
  { name: '水道光熱費', type: 'expense' },
  { name: '通信費', type: 'expense' },
  { name: '医療費', type: 'expense' },
  { name: '娯楽', type: 'expense' },
  { name: '教育', type: 'expense' },
  { name: '美容', type: 'expense' },
  { name: '交際費', type: 'expense' },
  { name: 'その他（支出）', type: 'expense' },
  // 収入
  { name: '給与', type: 'income' },
  { name: '副業', type: 'income' },
  { name: '投資', type: 'income' },
  { name: 'ボーナス', type: 'income' },
  { name: 'その他（収入）', type: 'income' },
];
