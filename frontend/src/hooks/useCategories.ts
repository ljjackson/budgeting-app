import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/api/client';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/client';
import { queryKeys } from './queryKeys';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
