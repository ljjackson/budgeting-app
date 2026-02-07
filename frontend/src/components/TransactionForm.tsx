import { useState, useEffect } from 'react';
import type { Account, Category, Transaction } from '@/api/client';
import { parseCurrency, centsToDecimal } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Props {
  transaction?: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: {
    account_id: number;
    category_id: number | null;
    amount: number;
    description: string;
    date: string;
    type: string;
  }) => void;
  onCancel: () => void;
}

export default function TransactionForm({ transaction, accounts, categories, onSubmit, onCancel }: Props) {
  const [accountId, setAccountId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('expense');

  useEffect(() => {
    if (transaction) {
      setAccountId(transaction.account_id);
      setCategoryId(transaction.category_id ?? '');
      setAmount(centsToDecimal(transaction.amount));
      setDescription(transaction.description);
      setDate(transaction.date);
      setType(transaction.type);
    } else if (accounts.length > 0 && accountId === 0) {
      setAccountId(accounts[0].id);
    }
  }, [transaction, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseCurrency(amount);
    onSubmit({
      account_id: accountId,
      category_id: categoryId === '' ? null : categoryId,
      amount: cents,
      description,
      date,
      type,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Description</Label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Account</Label>
          <Select
            value={accountId ? String(accountId) : undefined}
            onValueChange={(v) => setAccountId(Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Category</Label>
          <Select
            value={categoryId === '' ? '__none__' : String(categoryId)}
            onValueChange={(v) => setCategoryId(v === '__none__' ? '' : Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Uncategorized</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">
          {transaction ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
