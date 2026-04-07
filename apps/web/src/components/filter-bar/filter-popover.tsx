'use client';

import * as React from 'react';
import { SlidersHorizontal, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: { label: string; value: string }[];
}

interface FilterPopoverProps {
  fields: FilterField[];
  onApply: (key: string, value: string, label: string) => void;
}

export function FilterPopover({ fields, onApply }: FilterPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedField, setSelectedField] = React.useState<FilterField | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSelectedField(null);
        setInputValue('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  function handleApply() {
    if (!selectedField || !inputValue) return;

    let displayValue = inputValue;
    if (selectedField.type === 'select' || selectedField.type === 'boolean') {
      const opt = (selectedField.options || []).find((o) => o.value === inputValue);
      if (opt) displayValue = opt.label;
    }

    onApply(selectedField.key, inputValue, `${selectedField.label}: ${displayValue}`);
    setOpen(false);
    setSelectedField(null);
    setInputValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleApply();
    }
  }

  function goBack() {
    setSelectedField(null);
    setInputValue('');
  }

  const booleanOptions = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(!open);
          if (open) {
            setSelectedField(null);
            setInputValue('');
          }
        }}
        className="gap-1.5"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filter
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-3 shadow-md">
          {!selectedField ? (
            <div className="space-y-1">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Filter by</p>
              {fields.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => setSelectedField(field)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  {field.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded p-0.5 hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">{selectedField.label}</span>
              </div>

              {selectedField.type === 'text' && (
                <Input
                  autoFocus
                  placeholder={`Enter ${selectedField.label.toLowerCase()}...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              )}

              {selectedField.type === 'date' && (
                <Input
                  autoFocus
                  type="date"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              )}

              {selectedField.type === 'select' && selectedField.options && (
                <select
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select...</option>
                  {selectedField.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {selectedField.type === 'boolean' && (
                <select
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select...</option>
                  {booleanOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              <Button size="sm" className="w-full" onClick={handleApply} disabled={!inputValue}>
                Filter
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
