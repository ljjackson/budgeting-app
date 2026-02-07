import { useState, useCallback } from 'react';
import { useBudget, useAllocateBudget, useAllocateBulk } from '@/hooks/useBudget';
import { useMonthNavigator } from '@/hooks/useMonthNavigator';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import { formatCurrency, centsToDecimal, resolveAssignedInput } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AlertTriangle, Target, TrendingUp, PiggyBank, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import MonthNavigator from '@/components/MonthNavigator';
import CategoryDetailPanel from '@/components/CategoryDetailPanel';

export default function Budget() {
  const { currentYear, currentMonth, monthStr, prevMonth, nextMonth, canGoNext } = useMonthNavigator({ maxMonthsAhead: 1 });
  const { data: budget, isLoading, isError, error } = useBudget(monthStr);
  const allocateMutation = useAllocateBudget();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const closePanel = useCallback(() => setSelectedCategoryId(null), []);
  const selectedCategory = budget?.categories.find(c => c.category_id === selectedCategoryId) ?? null;

  const [fundingAll, setFundingAll] = useState(false);
  const canFundAll = budget != null && budget.total_underfunded > 0 && budget.ready_to_assign >= budget.total_underfunded;

  const bulkAllocateMutation = useAllocateBulk();

  const fundAllUnderfunded = async () => {
    if (!budget || fundingAll) return;
    setFundingAll(true);
    try {
      const allocations = budget.categories
        .filter(row => row.underfunded != null && row.underfunded > 0)
        .map(row => ({
          category_id: row.category_id,
          amount: row.assigned + row.underfunded!,
        }));
      await bulkAllocateMutation.mutateAsync({
        month: monthStr,
        allocations,
      });
    } finally {
      setFundingAll(false);
    }
  };

  const inlineEdit = useInlineEdit<number>({
    onCommit: (categoryId, value) => {
      const current = budget?.categories.find(c => c.category_id === categoryId)?.assigned ?? 0;
      const amount = resolveAssignedInput(value, current);
      allocateMutation.mutate({ month: monthStr, category_id: categoryId, amount });
    },
  });

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-4">Budget</h1>
        <p className="text-destructive">Failed to load budget: {error?.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Budget</h1>
        <MonthNavigator
          currentMonth={currentMonth}
          currentYear={currentYear}
          onPrev={prevMonth}
          onNext={nextMonth}
          canGoNext={canGoNext}
          className="mb-0"
        />
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="py-4"><Skeleton className="h-8 w-24" /></CardContent></Card>
          ))}
        </div>
      ) : budget ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Income</div>
                  <div className="text-xl font-semibold tabular-nums">{formatCurrency(budget.income)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <PiggyBank className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned</div>
                  <div className="text-xl font-semibold tabular-nums">{formatCurrency(budget.total_assigned)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <CircleDollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ready to Assign</div>
                  <div className={cn(
                    'text-xl font-semibold tabular-nums',
                    budget.ready_to_assign >= 0 ? 'text-positive' : 'text-negative'
                  )}>
                    {formatCurrency(budget.ready_to_assign)}
                  </div>
                  {budget.total_underfunded > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="link"
                          className={cn(
                            'p-0 h-auto text-xs mt-1',
                            canFundAll
                              ? 'text-warning underline decoration-dotted hover:decoration-solid cursor-pointer'
                              : 'text-warning/60 no-underline cursor-not-allowed'
                          )}
                          disabled={!canFundAll || fundingAll}
                          onClick={fundAllUnderfunded}
                        >
                          {fundingAll ? 'Assigning...' : `${formatCurrency(budget.total_underfunded)} underfunded`}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canFundAll
                          ? `Auto-assign ${formatCurrency(budget.total_underfunded)} across all underfunded categories`
                          : 'Not enough in Ready to Assign to cover all underfunded categories'}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Uncategorized expenses warning */}
      {!isLoading && budget && budget.uncategorized_expenses > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-700 bg-amber-950 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            You have{' '}
            <span className="font-medium">{budget.uncategorized_expenses}</span>{' '}
            uncategorised {budget.uncategorized_expenses === 1 ? 'expense' : 'expenses'} this month.{' '}
            <Link to="/transactions" className="underline hover:no-underline font-medium">
              Categorise them
            </Link>
          </span>
        </div>
      )}

      {/* Budget table */}
      <Card className="py-0 gap-0 overflow-hidden">
        <CardContent className="p-0">
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
                <TableRow
                  key={row.category_id}
                  className={cn(
                    selectedCategory?.category_id === row.category_id && 'bg-muted/50'
                  )}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full text-left cursor-pointer"
                      onClick={() => setSelectedCategoryId(row.category_id)}
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: row.colour }}
                      />
                      {row.category_name}
                      {row.underfunded != null && row.underfunded > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-900 px-2 py-0.5 text-xs font-medium text-amber-200 hover:bg-amber-800 cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                allocateMutation.mutate({
                                  month: monthStr,
                                  category_id: row.category_id,
                                  amount: row.assigned + row.underfunded!,
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  allocateMutation.mutate({
                                    month: monthStr,
                                    category_id: row.category_id,
                                    amount: row.assigned + row.underfunded!,
                                  });
                                }
                              }}
                            >
                              <Target className="h-3 w-3" />
                              {formatCurrency(row.underfunded)} needed
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Click to assign {formatCurrency(row.underfunded)} to meet target
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <button
                      type="button"
                      className="cursor-pointer w-full text-left"
                      onClick={() => inlineEdit.startEditing(row.category_id, centsToDecimal(row.assigned))}
                    >
                      {inlineEdit.editingId === row.category_id ? (
                        <Input
                          ref={inlineEdit.inputRef}
                          type="text"
                          value={inlineEdit.editValue}
                          onChange={(e) => inlineEdit.setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') inlineEdit.commitEdit();
                            if (e.key === 'Escape') inlineEdit.cancelEdit();
                          }}
                          onBlur={inlineEdit.commitEdit}
                          className="h-7 w-24 text-sm"
                        />
                      ) : (
                        formatCurrency(row.assigned)
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(row.activity)}</TableCell>
                  <TableCell className={cn(
                    'font-medium tabular-nums',
                    row.available >= 0 ? 'text-positive' : 'text-negative'
                  )}>
                    {row.available < 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-negative underline decoration-dotted hover:decoration-solid"
                            onClick={() => {
                              allocateMutation.mutate({
                                month: monthStr,
                                category_id: row.category_id,
                                amount: row.assigned + Math.abs(row.available),
                              });
                            }}
                          >
                            {formatCurrency(row.available)}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Click to assign {formatCurrency(Math.abs(row.available))} to cover shortfall
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      formatCurrency(row.available)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
      </Table>
        </CardContent>
      </Card>

      {selectedCategory && (
        <CategoryDetailPanel
          category={selectedCategory}
          month={monthStr}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
