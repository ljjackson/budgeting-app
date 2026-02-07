import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction, PaginatedTransactions } from '@/api/client';
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  importCSV,
} from '@/api/client';
import { queryKeys } from './queryKeys';

const PAGE_SIZE = 50;

export function useTransactionList(filters: Record<string, string>) {
  return useInfiniteQuery<PaginatedTransactions, Error>({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: ({ pageParam, signal }) => {
      const params: Record<string, string> = {
        ...filters,
        limit: String(PAGE_SIZE),
        offset: String(pageParam),
      };
      return getTransactions(params, signal);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Transaction>) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Transaction> }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useImportCSV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, accountId }: { file: File; accountId: number }) =>
      importCSV(file, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
