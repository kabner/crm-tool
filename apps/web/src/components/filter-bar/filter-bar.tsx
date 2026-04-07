'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FilterPopover, type FilterField } from './filter-popover';
import { FilterPill } from './filter-pill';

export type { FilterField } from './filter-popover';

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
}

interface FilterBarProps {
  fields: FilterField[];
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: ActiveFilter[]) => void;
  searchPlaceholder?: string;
  initialSearch?: string;
  initialFilters?: ActiveFilter[];
}

export function FilterBar({
  fields,
  onSearchChange,
  onFiltersChange,
  searchPlaceholder = 'Search...',
  initialSearch = '',
  initialFilters = [],
}: FilterBarProps) {
  const [search, setSearch] = React.useState(initialSearch);
  const [filters, setFilters] = React.useState<ActiveFilter[]>(initialFilters);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 300);
  }

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleApplyFilter(key: string, value: string, label: string) {
    const next = [...filters.filter((f) => f.key !== key), { key, value, label }];
    setFilters(next);
    onFiltersChange(next);
  }

  function handleRemoveFilter(key: string) {
    const next = filters.filter((f) => f.key !== key);
    setFilters(next);
    onFiltersChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <FilterPopover fields={fields} onApply={handleApplyFilter} />
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const parts = f.label.split(': ');
            const pillLabel = parts[0] || f.key;
            const pillValue = parts.length > 1 ? parts.slice(1).join(': ') : f.value;
            return (
              <FilterPill
                key={f.key}
                label={pillLabel}
                value={pillValue}
                onRemove={() => handleRemoveFilter(f.key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
