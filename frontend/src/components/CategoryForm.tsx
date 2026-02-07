import { useState, useEffect } from 'react';
import type { Category } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  category?: Category | null;
  onSubmit: (data: { name: string; colour: string }) => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [colour, setColour] = useState('#3B82F6');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColour(category.colour);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, colour });
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
        <Label>Colour</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            className="h-10 w-14 rounded border border-input cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">{colour}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">
          {category ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
