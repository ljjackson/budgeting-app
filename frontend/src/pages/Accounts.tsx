import { useState, useEffect } from 'react';
import type { Account } from '../api/client';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/client';
import AccountForm from '../components/AccountForm';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editing, setEditing] = useState<Account | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => getAccounts().then(setAccounts);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (data: { name: string; type: string; starting_balance?: number }) => {
    if (editing) {
      await updateAccount(editing.id, data);
    } else {
      await createAccount(data);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this account?')) return;
    await deleteAccount(id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Accounts</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Add Account
        </button>
      </div>

      {showForm && (
        <AccountForm
          account={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="grid gap-3">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-800">{account.name}</div>
              <div className="text-sm text-gray-500 capitalize">{account.type}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(account); setShowForm(true); }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-gray-400 text-center py-8">No accounts yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
