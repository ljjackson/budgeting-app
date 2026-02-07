import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Transaction } from '@/api/client';
import type { SelectionState } from '@/components/TransactionTable';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import {
  useTransactionList, useCreateTransaction, useUpdateTransaction, useDeleteTransaction,
  useBulkUpdateCategory,
} from '@/hooks/useTransactions';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';
import CsvImport from '@/components/CsvImport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EMPTY_SELECTION: SelectionState = { mode: 'none', ids: new Set() };

export default function Transactions() {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Month navigator
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  // Filters
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');

  // Selection
  const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('__none__');

  // Clear selection when filters or month change
  useEffect(() => {
    setSelection(EMPTY_SELECTION);
  }, [currentYear, currentMonth, filterAccount, filterCategory, search]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const filters = useMemo(() => {
    const dateFrom = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dateTo = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const params: Record<string, string> = { date_from: dateFrom, date_to: dateTo };
    if (filterAccount) params.account_id = filterAccount;
    if (filterCategory) params.category_id = filterCategory;
    if (search) params.search = search;
    return params;
  }, [currentYear, currentMonth, filterAccount, filterCategory, search]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTransactionList(filters);

  const transactions = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const bulkMutation = useBulkUpdateCategory();

  const handleSubmit = async (txnData: {
    account_id: number;
    category_id: number | null;
    amount: number;
    description: string;
    date: string;
    type: string;
  }) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: txnData });
    } else {
      await createMutation.mutateAsync(txnData);
    }
    setShowForm(false);
    setEditing(null);
  };

  const updateMutationRef = useRef(updateMutation);
  updateMutationRef.current = updateMutation;
  const deleteMutationRef = useRef(deleteMutation);
  deleteMutationRef.current = deleteMutation;

  const handleCategoryChange = useCallback(async (txnId: number, categoryId: number | null) => {
    await updateMutationRef.current.mutateAsync({ id: txnId, data: { category_id: categoryId } as Partial<Transaction> });
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    await deleteMutationRef.current.mutateAsync(id);
  }, []);

  const handleEdit = useCallback((txn: Transaction) => {
    setEditing(txn);
    setShowForm(true);
  }, []);

  // Compute selected count and IDs for bulk action
  const selectedCount = selection.mode === 'all' ? transactions.length
    : selection.mode === 'some' ? selection.ids.size
    : 0;

  const handleBulkAssign = async () => {
    const categoryId = bulkCategoryId === '__none__' ? null : Number(bulkCategoryId);
    const ids = selection.mode === 'all'
      ? transactions.map((t) => t.id)
      : Array.from(selection.ids);
    await bulkMutation.mutateAsync({ transactionIds: ids, categoryId });
    setSelection(EMPTY_SELECTION);
    setBulkCategoryId('__none__');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            Import CSV
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            Add Transaction
          </Button>
        </div>
      </div>

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

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to import transactions.</DialogDescription>
          </DialogHeader>
          <CsvImport accounts={accounts} onImported={() => setShowImport(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the transaction details below.' : 'Fill in the details to create a new transaction.'}
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            key={editing?.id ?? 'new'}
            transaction={editing}
            accounts={accounts}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="mb-4 py-3">
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Account</Label>
            <Select
              value={filterAccount || '__all__'}
              onValueChange={(v) => setFilterAccount(v === '__all__' ? '' : v)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select
              value={filterCategory || '__all__'}
              onValueChange={(v) => setFilterCategory(v === '__all__' ? '' : v)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <div className="relative">
              <Input
                placeholder="Search descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm w-48 pr-7"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          {(filterAccount || filterCategory || search) && (
            <Button
              variant="link"
              size="sm"
              onClick={() => { setFilterAccount(''); setFilterCategory(''); setSearch(''); }}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bulk category bar */}
      {selectedCount > 0 && (
        <Card className="mb-4 py-2">
          <CardContent className="flex items-center gap-3">
            <span className="text-sm font-medium">{selectedCount} selected</span>
            <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Uncategorized</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkAssign} disabled={bulkMutation.isPending}>
              {bulkMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelection(EMPTY_SELECTION)}>
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <TransactionTable
        transactions={transactions}
        categories={categories}
        loading={isLoading}
        loadingMore={isFetchingNextPage}
        hasMore={!!hasNextPage}
        onLoadMore={() => fetchNextPage()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCategoryChange={handleCategoryChange}
        selection={selection}
        onSelectionChange={setSelection}
      />
    </div>
  );
}
