import { useState, useEffect } from 'react';
import type { Account, Category, Transaction } from '../api/client';
import { parseCurrency, centsToDecimal } from '../utils/currency';

interface Props {
  transaction?: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: {
    account_id: number;
    category_id: number | null;
    amount: number;
    description: string;
    date: string;
    type: string;
  }) => void;
  onCancel: () => void;
}

export default function TransactionForm({ transaction, accounts, categories, onSubmit, onCancel }: Props) {
  const [accountId, setAccountId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('expense');

  useEffect(() => {
    if (transaction) {
      setAccountId(transaction.account_id);
      setCategoryId(transaction.category_id ?? '');
      setAmount(centsToDecimal(transaction.amount));
      setDescription(transaction.description);
      setDate(transaction.date);
      setType(transaction.type);
    } else if (accounts.length > 0 && accountId === 0) {
      setAccountId(accounts[0].id);
    }
  }, [transaction, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseCurrency(amount);
    onSubmit({
      account_id: accountId,
      category_id: categoryId === '' ? null : categoryId,
      amount: cents,
      description,
      date,
      type,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 text-sm"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(Number(e.target.value))}
            required
            className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 text-sm"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 text-sm"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          {transaction ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </form>
  );
}
