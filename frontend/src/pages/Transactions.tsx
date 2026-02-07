import { useState, useEffect } from 'react';
import type { Transaction, Account, Category } from '../api/client';
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getAccounts, getCategories,
} from '../api/client';
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';
import CsvImport from '../components/CsvImport';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Filters
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const loadTransactions = () => {
    const params: Record<string, string> = {};
    if (filterAccount) params.account_id = filterAccount;
    if (filterCategory) params.category_id = filterCategory;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    getTransactions(params).then(setTransactions);
  };

  const loadMeta = () => {
    getAccounts().then(setAccounts);
    getCategories().then(setCategories);
  };

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { loadTransactions(); }, [filterAccount, filterCategory, filterDateFrom, filterDateTo]);

  const handleSubmit = async (data: {
    account_id: number;
    category_id: number | null;
    amount: number;
    description: string;
    date: string;
    type: string;
  }) => {
    if (editing) {
      await updateTransaction(editing.id, data);
    } else {
      await createTransaction(data);
    }
    setShowForm(false);
    setEditing(null);
    loadTransactions();
  };

  const handleCategoryChange = async (txnId: number, categoryId: number | null) => {
    await updateTransaction(txnId, { category_id: categoryId } as Partial<Transaction>);
    loadTransactions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    await deleteTransaction(id);
    loadTransactions();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
          >
            {showImport ? 'Hide Import' : 'Import CSV'}
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            Add Transaction
          </button>
        </div>
      </div>

      {showImport && (
        <CsvImport accounts={accounts} onImported={loadTransactions} />
      )}

      {showForm && (
        <TransactionForm
          transaction={editing}
          accounts={accounts}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded shadow mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500">Account</label>
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">From</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">To</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        {(filterAccount || filterCategory || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterAccount(''); setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <TransactionTable
        transactions={transactions}
        categories={categories}
        onEdit={(txn) => { setEditing(txn); setShowForm(true); }}
        onDelete={handleDelete}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
