import { useState, useEffect } from 'react';
import type { CategoryReport, AccountReport } from '../api/client';
import { getReportByCategory, getReportByAccount } from '../api/client';
import { CategoryChart, AccountChart } from '../components/ReportCharts';

export default function Reports() {
  const [categoryData, setCategoryData] = useState<CategoryReport[]>([]);
  const [accountData, setAccountData] = useState<AccountReport[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txnType, setTxnType] = useState('expense');

  const load = () => {
    const params: Record<string, string> = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (txnType) params.type = txnType;
    getReportByCategory(params).then(setCategoryData);
    getReportByAccount(params).then(setAccountData);
  };

  useEffect(() => { load(); }, [dateFrom, dateTo, txnType]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Reports</h1>

      <div className="bg-white p-3 rounded shadow mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500">Type</label>
          <select
            value={txnType}
            onChange={(e) => setTxnType(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
            <option value="">All</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        <CategoryChart data={categoryData} />
        <AccountChart data={accountData} />
      </div>
    </div>
  );
}
