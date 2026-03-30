"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";

interface EntitySearchProps {
  entityType: "contact" | "company" | "deal";
  value: string; // selected entity ID
  onChange: (id: string, entity?: any) => void;
  placeholder?: string;
  allowCreate?: boolean; // show "Create new" option
  onCreateNew?: (searchTerm: string) => void;
  className?: string;
}

interface SearchResult {
  id: string;
  label: string;
  secondary?: string;
}

const API_PATHS: Record<EntitySearchProps["entityType"], string> = {
  contact: "/api/v1/contacts",
  company: "/api/v1/companies",
  deal: "/api/v1/deals",
};

function mapResult(
  entityType: EntitySearchProps["entityType"],
  item: any,
): SearchResult {
  switch (entityType) {
    case "contact":
      return {
        id: item.id,
        label: [item.firstName, item.lastName].filter(Boolean).join(" ") || item.email || "Unnamed",
        secondary: item.email || undefined,
      };
    case "company":
      return {
        id: item.id,
        label: item.name || "Unnamed",
        secondary: item.domain || undefined,
      };
    case "deal":
      return {
        id: item.id,
        label: item.name || "Unnamed",
        secondary: item.amount != null ? `$${Number(item.amount).toLocaleString()}` : undefined,
      };
  }
}

export function EntitySearch({
  entityType,
  value,
  onChange,
  placeholder,
  allowCreate = false,
  onCreateNew,
  className,
}: EntitySearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch entity name when value is set on mount (editing existing)
  useEffect(() => {
    if (!value || hasFetchedInitial) return;
    let cancelled = false;

    async function fetchEntity() {
      try {
        const entity = await apiClient.get<any>(`${API_PATHS[entityType]}/${value}`);
        if (cancelled) return;
        const mapped = mapResult(entityType, entity);
        setDisplayValue(mapped.label);
        setHasFetchedInitial(true);
      } catch {
        // If fetch fails, show the ID itself
        if (!cancelled) {
          setDisplayValue(value);
          setHasFetchedInitial(true);
        }
      }
    }

    fetchEntity();
    return () => {
      cancelled = true;
    };
  }, [value, entityType, hasFetchedInitial]);

  // Search as you type (debounced)
  const doSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get<any>(
          `${API_PATHS[entityType]}?search=${encodeURIComponent(term)}&limit=5`,
        );
        const items = response.data ?? response ?? [];
        const mapped = (Array.isArray(items) ? items : []).map((item: any) =>
          mapResult(entityType, item),
        );
        setResults(mapped);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [entityType],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setDisplayValue(term);
    setIsOpen(true);

    // If the user clears the input, also clear the selected value
    if (!term.trim()) {
      onChange("", undefined);
      setResults([]);
      return;
    }

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(term), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setDisplayValue(result.label);
    setSearchTerm("");
    setResults([]);
    setIsOpen(false);
    onChange(result.id, result);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew?.(searchTerm || displayValue);
  };

  const handleClear = () => {
    setDisplayValue("");
    setSearchTerm("");
    setResults([]);
    setIsOpen(false);
    onChange("", undefined);
    setHasFetchedInitial(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleFocus = () => {
    if (displayValue && !value) {
      setIsOpen(true);
    }
  };

  const showCreateOption =
    allowCreate &&
    onCreateNew &&
    results.length === 0 &&
    !isLoading &&
    (searchTerm || displayValue).trim().length > 0;

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <Input
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder ?? `Search ${entityType}s...`}
        />
        {(displayValue || value) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || isLoading || showCreateOption) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {!isLoading &&
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelect(result)}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="font-medium">{result.label}</span>
                {result.secondary && (
                  <span className="text-xs text-muted-foreground">
                    {result.secondary}
                  </span>
                )}
              </button>
            ))}

          {!isLoading && showCreateOption && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-primary hover:bg-muted"
            >
              <span>+</span>
              <span>
                Create new {entityType}: &quot;{(searchTerm || displayValue).trim()}&quot;
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
