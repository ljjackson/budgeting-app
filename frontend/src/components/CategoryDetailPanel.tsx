import { useState, useRef, useEffect } from 'react';
import type { BudgetCategoryRow } from '@/api/client';
import { formatCurrency, centsToDecimal, resolveAssignedInput } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useAllocateBudget } from '@/hooks/useBudget';
import { useCategoryTransactions, useCategoryAverage } from '@/hooks/useCategoryTransactions';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: BudgetCategoryRow | null;
  month: string;
}

export default function CategoryDetailPanel({
  open,
  onOpenChange,
  category,
  month,
}: CategoryDetailPanelProps) {
  const { data: txData, isLoading: txLoading } = useCategoryTransactions(
    category?.category_id ?? null,
    month,
  );
  const { data: avgData } = useCategoryAverage(
    category?.category_id ?? null,
    month,
  );
  const allocateMutation = useAllocateBudget();

  const [editingAssigned, setEditingAssigned] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingAssigned) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingAssigned]);

  // Reset editing state when category changes
  useEffect(() => {
    setEditingAssigned(false);
  }, [category?.category_id]);

  const startEditing = () => {
    if (!category) return;
    setEditingAssigned(true);
    setEditValue(centsToDecimal(category.assigned));
  };

  const commitEdit = () => {
    if (!category || !editingAssigned) return;
    const amount = resolveAssignedInput(editValue, category.assigned);
    allocateMutation.mutate({
      month,
      category_id: category.category_id,
      amount,
    });
    setEditingAssigned(false);
  };

  const cancelEdit = () => {
    setEditingAssigned(false);
  };

  if (!category) return null;

  const activityAbs = Math.abs(category.activity);
  const progressRatio = category.assigned > 0 ? activityAbs / category.assigned : 0;
  const progressPercent = Math.min(progressRatio * 100, 100);
  const progressColor =
    progressRatio > 1 ? 'bg-red-500' :
    progressRatio >= 0.8 ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: category.colour }}
            />
            {category.category_name}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Budget details for {category.category_name}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 space-y-6">
          {/* Budget summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assigned</span>
              {editingAssigned ? (
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
                  className="h-7 w-24 text-sm text-right"
                />
              ) : (
                <button
                  type="button"
                  className="text-sm font-medium cursor-pointer hover:underline"
                  onClick={startEditing}
                >
                  {formatCurrency(category.assigned)}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Activity</span>
              <span className="text-sm font-medium">{formatCurrency(category.activity)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className={cn(
                'text-sm font-medium',
                category.available >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(category.available)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {category.assigned > 0 && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', progressColor)}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(activityAbs)} of {formatCurrency(category.assigned)} spent
                {progressRatio > 1 && (
                  <span className="text-red-600 font-medium"> (overspent)</span>
                )}
              </p>
            </div>
          )}

          {/* 3-month average */}
          {avgData && (
            <p className="text-xs text-muted-foreground">
              3-month average spending: {formatCurrency(Math.abs(avgData.average))}
            </p>
          )}

          {/* Transactions */}
          <div>
            <h3 className="text-sm font-medium mb-2">Transactions</h3>
            {txLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : txData && txData.data.length > 0 ? (
              <div className="space-y-1">
                {txData.data.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-sm truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                    <span className={cn(
                      'text-sm font-medium shrink-0',
                      tx.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    )}>
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transactions this month.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
