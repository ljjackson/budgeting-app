import type { Transaction, Category } from '@/api/client';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (txn: Transaction) => void;
  onDelete: (id: number) => void;
  onCategoryChange: (txnId: number, categoryId: number | null) => void;
}

export default function TransactionTable({ transactions, categories, onEdit, onDelete, onCategoryChange }: Props) {
  return (
    <Table>
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
        {transactions.map((txn) => (
          <TableRow key={txn.id}>
            <TableCell>{formatDate(txn.date)}</TableCell>
            <TableCell>{txn.description}</TableCell>
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
        {transactions.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions found</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
