import { useState, useEffect } from 'react';
import type { CategoryReport, AccountReport } from '@/api/client';
import { getReportByCategory, getReportByAccount } from '@/api/client';
import { CategoryChart, AccountChart } from '@/components/ReportCharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function Reports() {
  const [categoryData, setCategoryData] = useState<CategoryReport[]>([]);
  const [accountData, setAccountData] = useState<AccountReport[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txnType, setTxnType] = useState('expense');

  const load = () => {
    const params: Record<string, string> = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (txnType) params.type = txnType;
    getReportByCategory(params).then(setCategoryData);
    getReportByAccount(params).then(setAccountData);
  };

  useEffect(() => { load(); }, [dateFrom, dateTo, txnType]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      <Card className="mb-4 py-3">
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={txnType || '__all__'}
              onValueChange={(v) => setTxnType(v === '__all__' ? '' : v)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="__all__">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <CategoryChart data={categoryData} />
        <AccountChart data={accountData} />
      </div>
    </div>
  );
}
