import { memo, useCallback, useEffect, useRef, useTransition } from 'react';
import type { Transaction, Category } from '@/api/client';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

const SKELETON_ROWS = 10;

export interface SelectionState {
  mode: 'none' | 'some' | 'all';
  ids: Set<number>;  // used only in 'some' mode
}

interface RowProps {
  txn: Transaction;
  categories: Category[];
  selected: boolean;
  onToggle: (id: number) => void;
  onEdit: (txn: Transaction) => void;
  onDelete: (id: number) => void;
  onCategoryChange: (txnId: number, categoryId: number | null) => void;
}

const TransactionRow = memo(function TransactionRow({ txn, categories, selected, onToggle, onEdit, onDelete, onCategoryChange }: RowProps) {
  return (
    <TableRow
      className="cursor-pointer"
      data-state={selected ? 'selected' : undefined}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, [role="combobox"], [role="listbox"], [role="option"], [data-slot="checkbox"]')) return;
        onToggle(txn.id);
      }}
    >
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(txn.id)}
          aria-label={`Select transaction ${txn.description}`}
        />
      </TableCell>
      <TableCell>{formatDate(txn.date)}</TableCell>
      <TableCell className="truncate">{txn.description}</TableCell>
      <TableCell className={`font-medium tabular-nums ${txn.type === 'income' ? 'text-positive' : 'text-negative'}`}>
        {formatCurrency(txn.amount)}
      </TableCell>
      <TableCell>{txn.account?.name ?? '-'}</TableCell>
      <TableCell>
        <Select
          value={txn.category_id ? String(txn.category_id) : '__none__'}
          onValueChange={(v) => onCategoryChange(txn.id, v === '__none__' ? null : Number(v))}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Uncategorized</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(txn)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(txn.id)}>Delete</Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

interface Props {
  transactions: Transaction[];
  categories: Category[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onEdit: (txn: Transaction) => void;
  onDelete: (id: number) => void;
  onCategoryChange: (txnId: number, categoryId: number | null) => void;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
}

export default function TransactionTable({ transactions, categories, loading, loadingMore, hasMore, onLoadMore, onEdit, onDelete, onCategoryChange, selection, onSelectionChange }: Props) {
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
      if (scrollBottom < 1000) onLoadMoreRef.current?.();
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore]);

  const isSelected = (id: number) =>
    selection.mode === 'all' || (selection.mode === 'some' && selection.ids.has(id));

  const headerChecked = selection.mode === 'all'
    ? true
    : selection.mode === 'some'
      ? 'indeterminate'
      : false;

  const [, startTransition] = useTransition();

  // Stable refs for callbacks
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const toggleAll = useCallback(() => {
    const current = selectionRef.current;
    startTransition(() => {
      if (current.mode === 'all') {
        onSelectionChangeRef.current({ mode: 'none', ids: new Set() });
      } else {
        onSelectionChangeRef.current({ mode: 'all', ids: new Set() });
      }
    });
  }, []);

  const toggleOne = useCallback((id: number) => {
    const current = selectionRef.current;
    if (current.mode === 'all') {
      onSelectionChangeRef.current({ mode: 'none', ids: new Set() });
      return;
    }
    const next = new Set(current.ids);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChangeRef.current({ mode: next.size > 0 ? 'some' : 'none', ids: next });
  }, []);

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm table-fixed">
        <colgroup>
          <col className="w-[40px]" />
          <col className="w-[100px]" />
          <col />
          <col className="w-[100px]" />
          <col className="w-[120px]" />
          <col className="w-[160px]" />
          <col className="w-[140px]" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={headerChecked}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-14" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            </TableRow>
          )) : (
            <>
              {transactions.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  categories={categories}
                  selected={isSelected(txn.id)}
                  onToggle={toggleOne}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCategoryChange={onCategoryChange}
                />
              ))}
              {loadingMore && Array.from({ length: 3 }, (_, i) => (
                <TableRow key={`loading-${i}`}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No transactions found</TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </table>
    </div>
  );
}
