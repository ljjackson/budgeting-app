import { useQuery } from '@tanstack/react-query';
import { getTransactions, getCategoryAverage } from '@/api/client';
import { queryKeys } from './queryKeys';

export function useCategoryTransactions(categoryId: number | null, month: string) {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const dateFrom = `${month}-01`;
  const dateTo = `${month}-${String(lastDay).padStart(2, '0')}`;
  const filters = { category_id: String(categoryId ?? ''), date_from: dateFrom, date_to: dateTo, limit: '100' };

  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: ({ signal }) => getTransactions(filters, signal),
    enabled: categoryId !== null,
  });
}

export function useCategoryAverage(categoryId: number | null, month: string) {
  return useQuery({
    queryKey: queryKeys.budget.categoryAverage(categoryId ?? 0, month),
    queryFn: () => getCategoryAverage(categoryId!, month),
    enabled: categoryId !== null,
  });
}
