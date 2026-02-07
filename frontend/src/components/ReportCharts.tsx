import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { CategoryReport, AccountReport } from '../api/client';
import { formatCurrency } from '../utils/currency';

const DEFAULT_COLOURS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const formatTooltip = (v: number | string | undefined) => {
  if (v === undefined) return '';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return formatCurrency(Math.round(n * 100));
};

interface CategoryChartProps {
  data: CategoryReport[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.category_name ?? 'Uncategorized',
    value: Math.abs(d.total) / 100,
    colour: d.colour ?? DEFAULT_COLOURS[i % DEFAULT_COLOURS.length],
  }));

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-medium text-gray-700 mb-4">Spending by Category</h3>
      {chartData.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No data</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatCurrency(Math.round(v * 100))} />
                <Tooltip formatter={formatTooltip} />
                <Bar dataKey="value">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.colour} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.colour} />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

interface AccountChartProps {
  data: AccountReport[];
}

export function AccountChart({ data }: AccountChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.account_name,
    value: Math.abs(d.total) / 100,
    colour: DEFAULT_COLOURS[i % DEFAULT_COLOURS.length],
  }));

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-medium text-gray-700 mb-4">Spending by Account</h3>
      {chartData.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No data</p>
      ) : (
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatCurrency(Math.round(v * 100))} />
              <Tooltip formatter={formatTooltip} />
              <Bar dataKey="value">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.colour} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
