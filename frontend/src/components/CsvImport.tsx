import { useState } from 'react';
import type { Account } from '@/api/client';
import { useImportCSV } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Props {
  accounts: Account[];
  onImported: () => void;
}

export default function CsvImport({ accounts, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState<number>(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importMutation = useImportCSV();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !accountId) return;

    setResult(null);
    setError(null);

    try {
      const res = await importMutation.mutateAsync({ file, accountId });
      setResult(`Imported ${res.imported} transactions`);
      setFile(null);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-medium">Import CSV</h3>
      <p className="text-sm text-muted-foreground">CSV must have columns: date, description, amount. Optional: type (income/expense).</p>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label>Account</Label>
          <Select
            value={accountId ? String(accountId) : undefined}
            onValueChange={(v) => setAccountId(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>CSV File</Label>
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button
          type="submit"
          disabled={importMutation.isPending || !file || !accountId}
        >
          {importMutation.isPending ? 'Importing...' : 'Import'}
        </Button>
      </div>
      {result && <p className="text-sm text-positive">{result}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
