import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBudget, allocateBudget } from '@/api/client';
import type { AllocateBudgetRequest, BudgetResponse } from '@/api/client';
import { queryKeys } from './queryKeys';

export function useBudget(month: string) {
  return useQuery({
    queryKey: queryKeys.budget.month(month),
    queryFn: () => getBudget(month),
  });
}

export function useAllocateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AllocateBudgetRequest) => allocateBudget(data),
    onSuccess: (response: BudgetResponse) => {
      queryClient.setQueryData(queryKeys.budget.month(response.month), response);
    },
  });
}
