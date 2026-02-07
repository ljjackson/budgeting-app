import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBudget, allocateBudget, setCategoryTarget, deleteCategoryTarget } from '@/api/client';
import type { AllocateBudgetRequest, BudgetResponse, SetCategoryTargetRequest } from '@/api/client';
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

export function useSetCategoryTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { categoryId: number; request: SetCategoryTargetRequest }) =>
      setCategoryTarget(data.categoryId, data.request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
    },
  });
}

export function useDeleteCategoryTarget(month: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: number) => deleteCategoryTarget(categoryId, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
    },
  });
}
