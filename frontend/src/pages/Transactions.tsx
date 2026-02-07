import { useState, useEffect, useRef, useCallback } from 'react';
import type { Transaction, Account, Category } from '@/api/client';
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getAccounts, getCategories,
} from '@/api/client';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PAGE_SIZE = 50;

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Month navigator
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Filters
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');

  const prevMonth = () => {
    setLoading(true);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    setLoading(true);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const buildDateParams = () => {
    const dateFrom = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dateTo = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { date_from: dateFrom, date_to: dateTo };
  };

  const loadTransactions = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params: Record<string, string> = {
      ...buildDateParams(),
      limit: String(PAGE_SIZE),
      offset: '0',
    };
    if (filterAccount) params.account_id = filterAccount;
    if (filterCategory) params.category_id = filterCategory;
    if (search) params.search = search;
    setLoading(true);
    getTransactions(params, controller.signal)
      .then(({ data, total }) => {
        setTransactions(data);
        setTotalCount(total);
      })
      .catch((e) => { if (e.name !== 'AbortError') throw e; })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  };

  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;

    const controller = new AbortController();
    const params: Record<string, string> = {
      ...buildDateParams(),
      limit: String(PAGE_SIZE),
      offset: String(transactions.length),
    };
    if (filterAccount) params.account_id = filterAccount;
    if (filterCategory) params.category_id = filterCategory;
    if (search) params.search = search;
    setLoadingMore(true);
    getTransactions(params, controller.signal)
      .then(({ data, total }) => {
        setTransactions((prev) => [...prev, ...data]);
        setTotalCount(total);
      })
      .catch((e) => { if (e.name !== 'AbortError') throw e; })
      .finally(() => setLoadingMore(false));
  }, [transactions.length, loadingMore, loading, currentYear, currentMonth, filterAccount, filterCategory, search]);

  const loadMeta = () => {
    getAccounts().then(setAccounts);
    getCategories().then(setCategories);
  };

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { loadTransactions(); }, [filterAccount, filterCategory, search, currentYear, currentMonth]);

  const hasMore = transactions.length < totalCount;

  const handleSubmit = async (data: {
    account_id: number;
    category_id: number | null;
    amount: number;
    description: string;
    date: string;
    type: string;
  }) => {
    if (editing) {
      await updateTransaction(editing.id, data);
    } else {
      await createTransaction(data);
    }
    setShowForm(false);
    setEditing(null);
    loadTransactions();
  };

  const handleCategoryChange = async (txnId: number, categoryId: number | null) => {
    await updateTransaction(txnId, { category_id: categoryId } as Partial<Transaction>);
    loadTransactions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    await deleteTransaction(id);
    loadTransactions();
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
          <CsvImport accounts={accounts} onImported={() => { loadTransactions(); setShowImport(false); }} />
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
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              placeholder="Search descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm w-48"
            />
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

      <TransactionTable
        transactions={transactions}
        categories={categories}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onEdit={(txn) => { setEditing(txn); setShowForm(true); }}
        onDelete={handleDelete}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
