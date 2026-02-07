import { useState, useRef, useEffect, useCallback } from 'react';

export function useInlineEdit<T extends string | number>(options: {
  onCommit: (id: T, value: string) => void;
}) {
  const [editingId, setEditingId] = useState<T | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const onCommitRef = useRef(options.onCommit);
  useEffect(() => { onCommitRef.current = options.onCommit; }, [options.onCommit]);

  useEffect(() => {
    if (editingId !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  const startEditing = useCallback((id: T, currentValue: string) => {
    setEditingId(id);
    setEditValue(currentValue);
  }, []);

  const commitEdit = useCallback(() => {
    if (editingId === null) return;
    onCommitRef.current(editingId, editValue);
    setEditingId(null);
  }, [editingId, editValue]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  return {
    editingId,
    editValue,
    setEditValue,
    inputRef,
    startEditing,
    commitEdit,
    cancelEdit,
  };
}
