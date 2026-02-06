import { useState, useEffect } from 'react';
import type { Category } from '../api/client';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/client';
import CategoryForm from '../components/CategoryForm';

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
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Add Category
        </button>
      </div>

      {showForm && (
        <CategoryForm
          category={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="grid gap-3">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: cat.colour }} />
              <div>
                <div className="font-medium text-gray-800">{cat.name}</div>
                <div className="text-sm text-gray-500">{cat.colour}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(cat); setShowForm(true); }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-gray-400 text-center py-8">No categories yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
