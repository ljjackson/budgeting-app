import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateAccountRequest, Account } from '@/api/client';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '@/api/client';
import { queryKeys } from './queryKeys';

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: getAccounts,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountRequest) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Account> }) =>
      updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
