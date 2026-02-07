import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BudgetCategoryRow, TargetType } from '@/api/client';
import { formatCurrency, centsToDecimal, resolveAssignedInput } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useAllocateBudget, useSetCategoryTarget, useDeleteCategoryTarget } from '@/hooks/useBudget';
import { useCategoryTransactions, useCategoryAverage } from '@/hooks/useCategoryTransactions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  monthly_savings: 'Monthly Savings',
  savings_balance: 'Savings Balance',
  spending_by_date: 'Spending by Date',
};

interface CategoryDetailPanelProps {
  category: BudgetCategoryRow | null;
  month: string;
  onClose: () => void;
}

export default function CategoryDetailPanel({
  category,
  month,
  onClose,
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
  const setTargetMutation = useSetCategoryTarget();
  const deleteTargetMutation = useDeleteCategoryTarget(month);

  const [editingAssigned, setEditingAssigned] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Target form state
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetType, setTargetType] = useState<TargetType>('monthly_savings');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (editingAssigned) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingAssigned]);

  // Reset editing state when category changes
  useEffect(() => {
    setEditingAssigned(false);
    setEditingTarget(false);
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

  const startEditingTarget = () => {
    if (!category) return;
    if (category.target_type) {
      setTargetType(category.target_type as TargetType);
      setTargetAmount(centsToDecimal(category.target_amount ?? 0));
      setTargetDate(category.target_date ?? '');
    } else {
      setTargetType('monthly_savings');
      setTargetAmount('');
      setTargetDate('');
    }
    setEditingTarget(true);
  };

  const saveTarget = () => {
    if (!category) return;
    const amountCents = Math.round(parseFloat(targetAmount || '0') * 100);
    if (amountCents <= 0) return;
    setTargetMutation.mutate({
      categoryId: category.category_id,
      request: {
        month,
        target_type: targetType,
        target_amount: amountCents,
        ...(targetType !== 'monthly_savings' ? { target_date: targetDate } : {}),
      },
    });
    setEditingTarget(false);
  };

  const removeTarget = () => {
    if (!category) return;
    deleteTargetMutation.mutate(category.category_id);
  };

  const needsDate = targetType !== 'monthly_savings';

  const portalTarget = document.getElementById('app-shell');

  if (!category || !portalTarget) return null;

  const activityAbs = Math.abs(category.activity);
  const progressRatio = category.assigned > 0 ? activityAbs / category.assigned : 0;
  const progressPercent = Math.min(progressRatio * 100, 100);
  const progressColor =
    progressRatio > 1 ? 'bg-red-500 dark:bg-red-400' :
    progressRatio >= 0.8 ? 'bg-amber-500 dark:bg-amber-400' :
    'bg-emerald-500 dark:bg-emerald-400';

  return createPortal(
    <div
      ref={panelRef}
      tabIndex={-1}
      className="w-[380px] shrink-0 border-l bg-background overflow-y-auto"
      style={{ animation: 'slide-in-right 0.25s ease-out' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: category.colour }}
          />
          <h2 className="text-lg font-semibold truncate">{category.category_name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm opacity-70 hover:opacity-100 transition-opacity shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      <div className="p-4 space-y-6">
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
                className="text-sm font-medium tabular-nums cursor-pointer hover:underline"
                onClick={startEditing}
              >
                {formatCurrency(category.assigned)}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Activity</span>
            <span className="text-sm font-medium tabular-nums">{formatCurrency(category.activity)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available</span>
            <span className={cn(
              'text-sm font-medium tabular-nums',
              category.available >= 0 ? 'text-positive' : 'text-negative'
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
                className={cn('h-full rounded-full transition-all duration-700 ease-out', progressColor)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(activityAbs)} of {formatCurrency(category.assigned)} spent
              {progressRatio > 1 && (
                <span className="text-negative font-medium"> (overspent)</span>
              )}
            </p>
          </div>
        )}

        {/* Target section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Target</h3>
          {editingTarget ? (
            <div className="space-y-3 rounded-md border p-3">
              <div className="space-y-1">
                <label htmlFor="target-type" className="text-xs text-muted-foreground">Type</label>
                <Select value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_savings">Monthly Savings</SelectItem>
                    <SelectItem value="savings_balance">Savings Balance</SelectItem>
                    <SelectItem value="spending_by_date">Spending by Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="target-amount" className="text-xs text-muted-foreground">Amount</label>
                <Input
                  id="target-amount"
                  type="text"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-sm"
                />
              </div>
              {needsDate && (
                <div className="space-y-1">
                  <label htmlFor="target-date" className="text-xs text-muted-foreground">Target month</label>
                  <Input
                    id="target-date"
                    type="month"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveTarget}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTarget(false)}>Cancel</Button>
              </div>
            </div>
          ) : category.target_type ? (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {TARGET_TYPE_LABELS[category.target_type as TargetType] ?? category.target_type}
                </span>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(category.target_amount ?? 0)}</span>
              </div>
              {category.target_date && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Target date</span>
                  <span className="text-sm">{category.target_date}</span>
                </div>
              )}
              {category.underfunded != null && category.underfunded > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Underfunded</span>
                  <span className="text-sm font-medium text-warning tabular-nums">{formatCurrency(category.underfunded)}</span>
                </div>
              )}
              {category.underfunded != null && category.underfunded === 0 && (
                <p className="text-xs text-positive">Fully funded this month</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={startEditingTarget}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={removeTarget}>Remove</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startEditingTarget}>Set Target</Button>
          )}
        </div>

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
                    'text-sm font-medium shrink-0 tabular-nums',
                    tx.type === 'expense' ? 'text-negative' : 'text-positive'
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
    </div>,
    portalTarget,
  );
}
