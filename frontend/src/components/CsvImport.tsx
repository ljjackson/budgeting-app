import { useState } from 'react';
import type { Account } from '../api/client';
import { importCSV } from '../api/client';

interface Props {
  accounts: Account[];
  onImported: () => void;
}

export default function CsvImport({ accounts, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !accountId) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await importCSV(file, accountId);
      setResult(`Imported ${res.imported} transactions`);
      setFile(null);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4 space-y-3">
      <h3 className="font-medium text-gray-700">Import CSV</h3>
      <p className="text-sm text-gray-500">CSV must have columns: date, description, amount. Optional: type (income/expense).</p>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(Number(e.target.value))}
            required
            className="mt-1 block rounded border-gray-300 border px-3 py-2 text-sm"
          >
            <option value={0} disabled>Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !file || !accountId}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Importing...' : 'Import'}
        </button>
      </div>
      {result && <p className="text-sm text-green-600">{result}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
