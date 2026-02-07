const BASE_URL = 'http://localhost:8080/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

// Types

export interface Account {
  id: number;
  name: string;
  type: string;
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
  type: string;
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
  type: string;
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
  const res = await fetch(`${BASE_URL}/transactions${query}`, {
    headers: { 'Content-Type': 'application/json' },
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
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
