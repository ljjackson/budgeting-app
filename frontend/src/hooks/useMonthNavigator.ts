import { useState, useCallback, useMemo } from 'react';

export function useMonthNavigator(options?: { maxMonthsAhead?: number }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const dateRange = useMemo(() => {
    const dateFrom = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dateTo = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { dateFrom, dateTo };
  }, [currentYear, currentMonth]);

  const maxMonthsAhead = options?.maxMonthsAhead;
  const canGoNext = useMemo(() => {
    if (maxMonthsAhead == null) return true;
    const today = new Date();
    const maxDate = new Date(today.getFullYear(), today.getMonth() + maxMonthsAhead, 1);
    const current = new Date(currentYear, currentMonth, 1);
    return current < maxDate;
  }, [currentYear, currentMonth, maxMonthsAhead]);

  const prevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }, [currentMonth, setCurrentMonth, setCurrentYear]);

  const nextMonth = useCallback(() => {
    if (!canGoNext) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }, [currentMonth, canGoNext, setCurrentMonth, setCurrentYear]);

  return { currentYear, currentMonth, monthStr, dateRange, prevMonth, nextMonth, canGoNext };
}
