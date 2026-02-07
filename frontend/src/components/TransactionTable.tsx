import { useEffect, useRef } from 'react';
import type { Transaction, Category } from '@/api/client';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

const SKELETON_ROWS = 10;

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
}

export default function TransactionTable({ transactions, categories, loading, loadingMore, hasMore, onLoadMore, onEdit, onDelete, onCategoryChange }: Props) {
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

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm table-fixed">
        <colgroup>
          <col className="w-[100px]" />
          <col />
          <col className="w-[100px]" />
          <col className="w-[120px]" />
          <col className="w-[160px]" />
          <col className="w-[140px]" />
        </colgroup>
        <TableHeader>
          <TableRow>
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
                <TableRow key={txn.id}>
                  <TableCell>{formatDate(txn.date)}</TableCell>
                  <TableCell className="truncate">{txn.description}</TableCell>
                  <TableCell className={`font-medium ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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
              ))}
              {loadingMore && Array.from({ length: 3 }, (_, i) => (
                <TableRow key={`loading-${i}`}>
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions found</TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </table>
    </div>
  );
}
