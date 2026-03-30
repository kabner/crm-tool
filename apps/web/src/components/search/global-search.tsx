"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Building2,
  Handshake,
  Loader2,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch, SearchResult } from "@/hooks/use-search";

const RECENT_SEARCHES_KEY = "crm_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT)),
  );
}

const typeIcons: Record<string, React.ElementType> = {
  contact: Users,
  company: Building2,
  deal: Handshake,
};

const typeLabels: Record<string, string> = {
  contact: "Contacts",
  company: "Companies",
  deal: "Deals",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data, isLoading } = useGlobalSearch(debouncedQuery);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Load recent searches when opening
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
    }
  }, [open]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setInputValue("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      addRecentSearch(result.title);
      setOpen(false);
      setInputValue("");
      router.push(result.url);
    },
    [router],
  );

  const handleRecentClick = useCallback((term: string) => {
    setInputValue(term);
  }, []);

  const handleFocus = () => {
    setOpen(true);
  };

  const handleClear = () => {
    setInputValue("");
    inputRef.current?.focus();
  };

  // Group results by type
  const grouped = data?.results.reduce(
    (acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type]!.push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>,
  );

  const showDropdown =
    open && (inputValue.length > 0 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search... (⌘K)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          className="h-9 w-full rounded-md border border-border bg-muted/50 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          <div className="max-h-80 overflow-y-auto">
            {/* Recent searches (when input is empty) */}
            {inputValue.length === 0 && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                  Recent Searches
                </div>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleRecentClick(term)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {term}
                  </button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {inputValue.length >= 2 && isLoading && (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}

            {/* Query too short */}
            {inputValue.length === 1 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {/* No results */}
            {inputValue.length >= 2 &&
              !isLoading &&
              data &&
              data.results.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No results found for &ldquo;{inputValue}&rdquo;
                </div>
              )}

            {/* Results grouped by type */}
            {grouped &&
              Object.entries(grouped).map(([type, results]) => {
                const Icon = typeIcons[type] || Search;
                return (
                  <div key={type} className="p-1">
                    <div className="mb-0.5 px-2 py-1 text-xs font-medium text-muted-foreground">
                      {typeLabels[type] || type}
                    </div>
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-muted"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="truncate font-medium text-foreground">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="truncate text-xs text-muted-foreground">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
