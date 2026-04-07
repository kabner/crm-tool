'use client';

import * as React from 'react';
import { Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnPickerProps {
  columns: ColumnDef[];
  visibleColumns: string[];
  onChange: (cols: string[]) => void;
}

export function ColumnPicker({ columns, visibleColumns, onChange }: ColumnPickerProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  function toggle(key: string) {
    if (visibleColumns.includes(key)) {
      onChange(visibleColumns.filter((k) => k !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-1.5">
        <Columns3 className="h-4 w-4" />
        Columns
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-md border bg-popover p-2 shadow-md">
          <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Toggle columns</p>
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => toggle(col.key)}
                className="rounded border-input"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
