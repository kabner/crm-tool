"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FolderOpen, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { KBCategory, KBSection } from "@/hooks/use-knowledge-base";

interface CategoryTreeProps {
  categories: KBCategory[];
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string | null, categoryId?: string) => void;
  onCreateCategory: () => void;
  onCreateSection: (categoryId: string) => void;
  onCreateArticle?: (sectionId: string) => void;
}

export function CategoryTree({
  categories,
  selectedSectionId,
  onSelectSection,
  onCreateCategory,
  onCreateSection,
  onCreateArticle,
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id)),
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onCreateCategory}
          title="Add category"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* All articles option */}
      <button
        onClick={() => onSelectSection(null)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          selectedSectionId === null
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <FileText className="h-4 w-4 shrink-0" />
        All Articles
      </button>

      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        return (
          <div key={category.id}>
            <div className="group flex items-center">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{category.name}</span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSection(category.id);
                }}
                title="Add section"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {isExpanded && category.sections && (
              <div className="ml-4 space-y-0.5 border-l border-border pl-2">
                {category.sections.map((section: KBSection) => (
                  <div key={section.id} className="group/section flex items-center">
                    <button
                      onClick={() => onSelectSection(section.id, category.id)}
                      className={cn(
                        "flex flex-1 items-center justify-between rounded-md px-2 py-1 text-sm transition-colors",
                        selectedSectionId === section.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{section.name}</span>
                      {section.articleCount !== undefined && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {section.articleCount}
                        </span>
                      )}
                    </button>
                    {onCreateArticle && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover/section:opacity-100 hover:opacity-100 focus:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateArticle(section.id);
                        }}
                        title="Add article to this section"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {category.sections.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground italic">
                    No sections yet
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {categories.length === 0 && (
        <p className="px-2 py-4 text-center text-sm text-muted-foreground">
          No categories yet. Create one to get started.
        </p>
      )}
    </div>
  );
}
