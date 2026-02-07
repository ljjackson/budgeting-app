import type { Transaction, Category } from '../api/client';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (txn: Transaction) => void;
  onDelete: (id: number) => void;
  onCategoryChange: (txnId: number, categoryId: number | null) => void;
}

export default function TransactionTable({ transactions, categories, onEdit, onDelete, onCategoryChange }: Props) {
  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100 text-left text-sm text-gray-600">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id} className="border-t border-gray-100 text-sm">
              <td className="px-4 py-3">{txn.date}</td>
              <td className="px-4 py-3">{txn.description}</td>
              <td className={`px-4 py-3 font-medium ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {txn.type === 'income' ? '+' : '-'}£{formatAmount(txn.amount)}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${txn.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {txn.type}
                </span>
              </td>
              <td className="px-4 py-3">{txn.account?.name ?? '-'}</td>
              <td className="px-4 py-3">
                <select
                  value={txn.category_id ?? ''}
                  onChange={(e) => onCategoryChange(txn.id, e.target.value === '' ? null : Number(e.target.value))}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => onEdit(txn)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button onClick={() => onDelete(txn.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No transactions found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
