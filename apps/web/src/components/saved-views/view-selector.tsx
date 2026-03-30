"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSavedViews,
  useCreateView,
  useDeleteView,
  useSetDefaultView,
  type SavedView,
} from "@/hooks/use-saved-views";
import { cn } from "@/lib/utils";

export interface ViewConfig {
  filters?: Record<string, any>;
  columns?: string[];
  sort?: { field: string; order: "ASC" | "DESC" };
}

interface ViewSelectorProps {
  objectType: "contact" | "company" | "deal";
  currentFilters?: Record<string, any>;
  currentColumns?: string[];
  currentSort?: { field: string; order: "ASC" | "DESC" };
  onApplyView: (config: ViewConfig) => void;
}

const objectTypeLabels: Record<string, string> = {
  contact: "Contacts",
  company: "Companies",
  deal: "Deals",
};

export function ViewSelector({
  objectType,
  currentFilters,
  currentColumns,
  currentSort,
  onApplyView,
}: ViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: views = [], isLoading } = useSavedViews(objectType);
  const createView = useCreateView();
  const deleteView = useDeleteView();
  const setDefaultView = useSetDefaultView();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowSaveDialog(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeView = views.find((v) => v.id === activeViewId);
  const displayName = activeView?.name ?? `All ${objectTypeLabels[objectType]}`;

  function handleApplyView(view: SavedView) {
    setActiveViewId(view.id);
    onApplyView({
      filters: view.filters,
      columns: view.columns,
      sort:
        view.sort && "field" in view.sort
          ? (view.sort as { field: string; order: "ASC" | "DESC" })
          : undefined,
    });
    setIsOpen(false);
  }

  function handleClearView() {
    setActiveViewId(null);
    onApplyView({ filters: undefined, columns: undefined, sort: undefined });
    setIsOpen(false);
  }

  async function handleSaveView() {
    if (!newViewName.trim()) return;

    try {
      await createView.mutateAsync({
        objectType,
        name: newViewName.trim(),
        filters: currentFilters,
        columns: currentColumns,
        sort: currentSort,
      });
      setNewViewName("");
      setShowSaveDialog(false);
    } catch {
      // Error is handled by react-query
    }
  }

  async function handleSetDefault(
    e: React.MouseEvent,
    viewId: string,
  ) {
    e.stopPropagation();
    await setDefaultView.mutateAsync({ id: viewId, objectType });
  }

  async function handleDeleteView(
    e: React.MouseEvent,
    viewId: string,
  ) {
    e.stopPropagation();
    if (activeViewId === viewId) {
      setActiveViewId(null);
      onApplyView({
        filters: undefined,
        columns: undefined,
        sort: undefined,
      });
    }
    await deleteView.mutateAsync(viewId);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {displayName}
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
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border border-input bg-background shadow-lg">
          {/* All items header */}
          <div className="border-b border-input p-1">
            <button
              onClick={handleClearView}
              className={cn(
                "flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-muted",
                !activeViewId && "bg-muted font-medium",
              )}
            >
              All {objectTypeLabels[objectType]}
            </button>
          </div>

          {/* Saved views list */}
          <div className="max-h-64 overflow-y-auto p-1">
            {isLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
            )}

            {!isLoading && views.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No saved views
              </div>
            )}

            {views.map((view) => (
              <div
                key={view.id}
                onClick={() => handleApplyView(view)}
                className={cn(
                  "group flex w-full cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-muted",
                  activeViewId === view.id && "bg-muted font-medium",
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {view.isDefault && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-yellow-500"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                  <span className="truncate">{view.name}</span>
                  {!view.userId && (
                    <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                      Shared
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
                  {!view.isDefault && (
                    <button
                      onClick={(e) => handleSetDefault(e, view.id)}
                      className="rounded p-1 hover:bg-background"
                      title="Set as default"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteView(e, view.id)}
                    className="rounded p-1 text-destructive hover:bg-background"
                    title="Delete view"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Save current view */}
          <div className="border-t border-input p-1">
            {!showSaveDialog ? (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted"
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
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Save current view
              </button>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1">
                <Input
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="View name"
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveView();
                    if (e.key === "Escape") {
                      setShowSaveDialog(false);
                      setNewViewName("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={handleSaveView}
                  disabled={
                    !newViewName.trim() || createView.isPending
                  }
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
