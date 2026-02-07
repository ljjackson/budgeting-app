import { useState, useRef, useEffect } from 'react';
import { useBudget, useAllocateBudget } from '@/hooks/useBudget';
import { formatCurrency, parseCurrency, centsToDecimal } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Budget() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const { data: budget, isLoading } = useBudget(monthStr);
  const allocateMutation = useAllocateBudget();

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCategoryId !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingCategoryId]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const startEditing = (categoryId: number, currentAssigned: number) => {
    setEditingCategoryId(categoryId);
    setEditValue(centsToDecimal(currentAssigned));
  };

  const commitEdit = () => {
    if (editingCategoryId === null) return;
    const amount = parseCurrency(editValue);
    allocateMutation.mutate({
      month: monthStr,
      category_id: editingCategoryId,
      amount,
    });
    setEditingCategoryId(null);
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Budget</h1>

      {/* Month navigator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button variant="outline" size="icon-sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="w-48 text-center font-medium">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <Button variant="outline" size="icon-sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary card */}
      <Card className="mb-4">
        <CardContent className="py-4">
          {isLoading ? (
            <div className="flex flex-wrap gap-6">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-44" />
            </div>
          ) : budget ? (
            <div className="flex flex-wrap gap-6 text-sm">
              <span>Income: <span className="font-medium">{formatCurrency(budget.income)}</span></span>
              <span>Assigned: <span className="font-medium">{formatCurrency(budget.total_assigned)}</span></span>
              <span>
                Ready to Assign:{' '}
                <span className={cn(
                  'font-medium',
                  budget.ready_to_assign >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(budget.ready_to_assign)}
                </span>
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Budget table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Available</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            </TableRow>
          ))}
          {!isLoading && budget?.categories.map((row) => (
            <TableRow key={row.category_id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: row.colour }}
                  />
                  {row.category_name}
                </div>
              </TableCell>
              <TableCell
                className="cursor-pointer"
                onClick={() => startEditing(row.category_id, row.assigned)}
              >
                {editingCategoryId === row.category_id ? (
                  <Input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    onBlur={commitEdit}
                    className="h-7 w-24 text-sm"
                  />
                ) : (
                  formatCurrency(row.assigned)
                )}
              </TableCell>
              <TableCell>{formatCurrency(row.activity)}</TableCell>
              <TableCell className={cn(
                'font-medium',
                row.available >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(row.available)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
