import { useState } from 'react';
import type { Account, CreateAccountRequest } from '@/api/client';
import { parseCurrency } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Props {
  account?: Account | null;
  onSubmit: (data: CreateAccountRequest) => void;
  onCancel: () => void;
}

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'cash'];

export default function AccountForm({ account, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState(account?.type ?? 'checking');
  const [startingBalance, setStartingBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateAccountRequest = { name, type };
    if (!account && startingBalance) {
      data.starting_balance = parseCurrency(startingBalance);
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            {ACCOUNT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!account && (
        <div className="space-y-1">
          <Label>Starting Balance (&pound;)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            placeholder="0.00"
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit">
          {account ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
