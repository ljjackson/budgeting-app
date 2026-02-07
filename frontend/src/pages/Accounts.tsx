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
  const { data: accounts = [], isError, error } = useAccounts();
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
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      if (err instanceof Error && err.message === 'Cannot delete account with transactions') {
        alert('Cannot delete this account because it has transactions. Delete the transactions first.');
      }
    }
  };

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Accounts</h1>
        <p className="text-destructive">Failed to load accounts: {error?.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((account) => (
          <Card key={account.id} className="py-3 gap-0">
            <CardContent className="px-4">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{account.name}</div>
                <Badge variant="secondary" className="text-xs">{account.type}</Badge>
              </div>
              {account.has_transactions && (
                <p className="text-xs text-muted-foreground mb-3">Has transactions</p>
              )}
              <div className="flex gap-1 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setEditing(account); setShowForm(true); }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive"
                  disabled={account.has_transactions}
                  title={account.has_transactions ? 'Delete transactions first' : undefined}
                  onClick={() => handleDelete(account.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <p className="text-muted-foreground text-center py-8 col-span-full">No accounts yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
