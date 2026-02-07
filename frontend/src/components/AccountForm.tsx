import { useState, useEffect } from 'react';
import type { Account } from '../api/client';
import { parseCurrency } from '../utils/currency';

interface Props {
  account?: Account | null;
  onSubmit: (data: { name: string; type: string; starting_balance?: number }) => void;
  onCancel: () => void;
}

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'cash'];

export default function AccountForm({ account, onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState('checking');
  const [startingBalance, setStartingBalance] = useState('');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: { name: string; type: string; starting_balance?: number } = { name, type };
    if (!account && startingBalance) {
      data.starting_balance = parseCurrency(startingBalance);
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>
      {!account && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Starting Balance (£)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            placeholder="0.00"
            className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 text-sm"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          {account ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </form>
  );
}
