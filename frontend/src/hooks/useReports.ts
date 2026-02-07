import { useQuery } from '@tanstack/react-query';
import { getReportByCategory, getReportByAccount } from '@/api/client';
import { queryKeys } from './queryKeys';

export function useReportByCategory(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.reports.byCategory(params),
    queryFn: () => getReportByCategory(params),
  });
}

export function useReportByAccount(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.reports.byAccount(params),
    queryFn: () => getReportByAccount(params),
  });
}
