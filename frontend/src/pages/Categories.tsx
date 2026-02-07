import { useState, useEffect } from 'react';
import type { Category } from '@/api/client';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/client';
import CategoryForm from '@/components/CategoryForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => getCategories().then(setCategories);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (data: { name: string; colour: string }) => {
    if (editing) {
      await updateCategory(editing.id, data);
    } else {
      await createCategory(data);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await deleteCategory(id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          Add Category
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the category details below.' : 'Fill in the details to create a new category.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            key={editing?.id ?? 'new'}
            category={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <div className="grid gap-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="py-3">
            <CardContent className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: cat.colour }} />
                <div>
                  <div className="font-medium">{cat.name}</div>
                  <div className="text-sm text-muted-foreground">{cat.colour}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditing(cat); setShowForm(true); }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(cat.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No categories yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
