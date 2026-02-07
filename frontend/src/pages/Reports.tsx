import { useState, useMemo } from 'react';
import { useReportByCategory, useReportByAccount } from '@/hooks/useReports';
import { useMonthNavigator } from '@/hooks/useMonthNavigator';
import { CategoryChart, AccountChart } from '@/components/ReportCharts';
import MonthNavigator from '@/components/MonthNavigator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SENTINEL_ALL } from '@/constants';

export default function Reports() {
  const { currentYear, currentMonth, dateRange, prevMonth, nextMonth } = useMonthNavigator();

  const [customRange, setCustomRange] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [txnType, setTxnType] = useState('expense');

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (customRange) {
      if (customFrom) p.date_from = customFrom;
      if (customTo) p.date_to = customTo;
    } else {
      p.date_from = dateRange.dateFrom;
      p.date_to = dateRange.dateTo;
    }
    if (txnType) p.type = txnType;
    return p;
  }, [customRange, customFrom, customTo, dateRange, txnType]);

  const { data: categoryData = [], isError: catError, error: catErr } = useReportByCategory(params);
  const { data: accountData = [], isError: acctError, error: acctErr } = useReportByAccount(params);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        {!customRange && (
          <MonthNavigator
            currentMonth={currentMonth}
            currentYear={currentYear}
            onPrev={prevMonth}
            onNext={nextMonth}
            className="mb-0"
          />
        )}
      </div>

      <Card className="mb-4 py-3 gap-0">
        <CardContent className="px-4 flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={txnType || SENTINEL_ALL}
              onValueChange={(v) => setTxnType(v === SENTINEL_ALL ? '' : v)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value={SENTINEL_ALL}>All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {customRange && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomRange((v) => !v)}
          >
            {customRange ? 'Use month' : 'Custom range'}
          </Button>
        </CardContent>
      </Card>

      {(catError || acctError) && (
        <p className="text-destructive mb-4">
          Failed to load reports: {catErr?.message || acctErr?.message}
        </p>
      )}

      <div className="space-y-4">
        <CategoryChart data={categoryData} />
        <AccountChart data={accountData} />
      </div>
    </div>
  );
}
