import { useState, useEffect } from 'react';
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

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Filters
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const loadTransactions = () => {
    const params: Record<string, string> = {};
    if (filterAccount) params.account_id = filterAccount;
    if (filterCategory) params.category_id = filterCategory;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    getTransactions(params).then(setTransactions);
  };

  const loadMeta = () => {
    getAccounts().then(setAccounts);
    getCategories().then(setCategories);
  };

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { loadTransactions(); }, [filterAccount, filterCategory, filterDateFrom, filterDateTo]);

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
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          {(filterAccount || filterCategory || filterDateFrom || filterDateTo) && (
            <Button
              variant="link"
              size="sm"
              onClick={() => { setFilterAccount(''); setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <TransactionTable
        transactions={transactions}
        categories={categories}
        onEdit={(txn) => { setEditing(txn); setShowForm(true); }}
        onDelete={handleDelete}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
