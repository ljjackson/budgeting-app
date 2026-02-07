import { useState, useEffect } from 'react';
import type { Category } from '../api/client';

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
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Colour</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
          />
          <span className="text-sm text-gray-500">{colour}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          {category ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </form>
  );
}
