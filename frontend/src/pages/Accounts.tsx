import { useState } from 'react';
import type { Account, CreateAccountRequest } from '@/api/client';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts';
import AccountForm from '@/components/AccountForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

export default function Accounts() {
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const [editing, setEditing] = useState<Account | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data: CreateAccountRequest) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this account?')) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          Add Account
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Account' : 'New Account'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the account details below.' : 'Fill in the details to create a new account.'}
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            key={editing?.id ?? 'new'}
            account={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <div className="grid gap-3">
        {accounts.map((account) => (
          <Card key={account.id} className="py-3">
            <CardContent className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{account.name}</div>
                  <Badge variant="secondary" className="mt-1">{account.type}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditing(account); setShowForm(true); }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(account.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No accounts yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
