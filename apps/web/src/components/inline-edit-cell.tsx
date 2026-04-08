'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface InlineEditCellProps {
  value: string | null;
  onSave: (newValue: string) => void;
  type?: 'text' | 'select';
  options?: { label: string; value: string }[];
  className?: string;
}

export function InlineEditCell({
  value,
  onSave,
  type = 'text',
  options,
  className = '',
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function handleSave() {
    setEditing(false);
    if (editValue !== (value ?? '')) onSave(editValue);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(value ?? '');
      setEditing(false);
    }
  }

  if (editing) {
    if (type === 'select' && options) {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-8 text-sm"
      />
    );
  }

  return (
    <span
      className={`${className} cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditValue(value ?? '');
        setEditing(true);
      }}
    >
      {value || '-'}
    </span>
  );
}
