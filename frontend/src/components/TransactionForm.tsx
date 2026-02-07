import { useState } from 'react';
import type { Account, Category, Transaction, TransactionType } from '@/api/client';
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
    type: TransactionType;
  }) => void;
  onCancel: () => void;
}

export default function TransactionForm({ transaction, accounts, categories, onSubmit, onCancel }: Props) {
  const [accountId, setAccountId] = useState<number>(transaction?.account_id ?? accounts[0]?.id ?? 0);
  const [categoryId, setCategoryId] = useState<number | ''>(transaction?.category_id ?? '');
  const [amount, setAmount] = useState(transaction ? centsToDecimal(transaction.amount) : '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [date, setDate] = useState(transaction?.date ?? new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');

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
          <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
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
