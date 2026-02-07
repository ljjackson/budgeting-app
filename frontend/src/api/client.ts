const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

async function requestRaw(path: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await requestRaw(path, options);
  return res.json();
}

// Types

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';
export type TransactionType = 'income' | 'expense';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  has_transactions: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  colour: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  category_id: number | null;
  amount: number; // cents
  description: string;
  date: string;
  type: TransactionType;
  account?: Account;
  category?: Category | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryReport {
  category_id: number | null;
  category_name: string | null;
  colour: string | null;
  total: number;
  count: number;
}

export interface AccountReport {
  account_id: number;
  account_name: string;
  account_type: string;
  total: number;
  count: number;
}

// Accounts

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  starting_balance?: number;
}

export const getAccounts = () => request<Account[]>('/accounts');
export const createAccount = (data: CreateAccountRequest) =>
  request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) });
export const updateAccount = (id: number, data: Partial<Account>) =>
  request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAccount = (id: number) =>
  request<void>(`/accounts/${id}`, { method: 'DELETE' });

// Categories

export const getCategories = () => request<Category[]>('/categories');
export const createCategory = (data: Partial<Category>) =>
  request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id: number, data: Partial<Category>) =>
  request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id: number) =>
  request<void>(`/categories/${id}`, { method: 'DELETE' });

// Transactions

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
}

export const getTransactions = async (params?: Record<string, string>, signal?: AbortSignal): Promise<PaginatedTransactions> => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await requestRaw(`/transactions${query}`, { signal });
  const total = Number(res.headers.get('X-Total-Count') ?? '0');
  const data = await res.json();
  return { data, total };
};
export const createTransaction = (data: Partial<Transaction>) =>
  request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id: number, data: Partial<Transaction>) =>
  request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTransaction = (id: number) =>
  request<void>(`/transactions/${id}`, { method: 'DELETE' });

export const bulkUpdateCategory = (transactionIds: number[], categoryId: number | null) =>
  request<{ updated: number }>('/transactions/bulk-category', {
    method: 'PUT',
    body: JSON.stringify({ transaction_ids: transactionIds, category_id: categoryId }),
  });

export const importCSV = (file: File, accountId: number) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('account_id', accountId.toString());
  return fetch(`${BASE_URL}/transactions/import`, {
    method: 'POST',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || res.statusText);
    }
    return res.json();
  });
};

// Reports

export const getReportByCategory = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<CategoryReport[]>(`/reports/by-category${query}`);
};
export const getReportByAccount = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<AccountReport[]>(`/reports/by-account${query}`);
};

// Budget

export interface BudgetCategoryRow {
  category_id: number;
  category_name: string;
  colour: string;
  assigned: number; // cents
  activity: number; // cents
  available: number; // cents
  target_type: string | null;
  target_amount: number | null;
  target_date: string | null;
  underfunded: number | null;
}

export interface BudgetResponse {
  month: string;
  income: number; // cents
  total_assigned: number; // cents
  ready_to_assign: number; // cents
  total_underfunded: number;
  uncategorized_expenses: number;
  categories: BudgetCategoryRow[];
}

export type TargetType = 'monthly_savings' | 'savings_balance' | 'spending_by_date';

export interface CategoryTarget {
  id: number;
  category_id: number;
  target_type: TargetType;
  target_amount: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetCategoryTargetRequest {
  month: string;
  target_type: TargetType;
  target_amount: number;
  target_date?: string;
}

export interface AllocateBudgetRequest {
  month: string;
  category_id: number;
  amount: number; // cents
}

export const getBudget = (month: string) =>
  request<BudgetResponse>(`/budget?month=${month}`);

export const allocateBudget = (data: AllocateBudgetRequest) =>
  request<BudgetResponse>('/budget/allocate', { method: 'PUT', body: JSON.stringify(data) });

export interface BulkAllocateRequest {
  month: string;
  allocations: { category_id: number; amount: number }[];
}

export const allocateBulk = (data: BulkAllocateRequest) =>
  request<BudgetResponse>('/budget/allocate-bulk', { method: 'PUT', body: JSON.stringify(data) });

export interface CategoryAverageResponse {
  average: number; // cents
}

export const getCategoryAverage = (categoryId: number, month: string) =>
  request<CategoryAverageResponse>(`/budget/category-average?category_id=${categoryId}&month=${month}`);

export const setCategoryTarget = (categoryId: number, data: SetCategoryTargetRequest) =>
  request<CategoryTarget>(`/categories/${categoryId}/target`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCategoryTarget = (categoryId: number, month: string) =>
  request<void>(`/categories/${categoryId}/target?month=${month}`, { method: 'DELETE' });
