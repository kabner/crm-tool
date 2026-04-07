'use client';

import * as React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableTableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  className?: string;
}

export function SortableTableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className,
}: SortableTableHeaderProps) {
  const isActive = currentSort === field;

  return (
    <th
      className={cn(
        'cursor-pointer select-none px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground',
        className,
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentOrder === 'ASC' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </th>
  );
}
