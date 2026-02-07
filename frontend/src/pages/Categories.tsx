import { useState } from 'react';
import type { Category } from '@/api/client';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import CategoryForm from '@/components/CategoryForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

export default function Categories() {
  const { data: categories = [], isLoading, isError, error } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data: { name: string; colour: string }) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await deleteMutation.mutateAsync(id);
  };

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-4">Categories</h1>
        <p className="text-destructive">Failed to load categories: {error?.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="py-2 gap-0">
              <CardContent className="px-3">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="py-2 gap-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 border-l-[3px]"
              style={{ borderLeftColor: cat.colour }}
            >
              <CardContent className="px-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.colour }} />
                  <span className="font-medium text-sm">{cat.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => { setEditing(cat); setShowForm(true); }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive"
                    onClick={() => handleDelete(cat.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {categories.length === 0 && (
            <p className="text-muted-foreground text-center py-8 col-span-full">No categories yet. Create one to get started.</p>
          )}
        </div>
      )}
    </div>
  );
}
