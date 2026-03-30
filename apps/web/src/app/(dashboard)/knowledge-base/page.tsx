"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  useKBCategories,
  useKBArticles,
  useCreateCategory,
  useCreateSection,
  useCreateArticle,
  type KBArticleFilters,
} from "@/hooks/use-knowledge-base";
import { CategoryTree } from "./components/category-tree";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  draft: "secondary",
  review: "outline",
  archived: "destructive",
};

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Create forms
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionCategoryId, setNewSectionCategoryId] = useState("");
  const [newArticleTitle, setNewArticleTitle] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useKBCategories();

  const filters: KBArticleFilters = {
    page,
    limit: 20,
    sectionId: selectedSectionId || undefined,
    search: debouncedSearch || undefined,
  };
  const { data: articlesData, isLoading: articlesLoading } = useKBArticles(filters);

  const createCategory = useCreateCategory();
  const createSection = useCreateSection();
  const createArticle = useCreateArticle();

  // Debounce search
  const [debounceTimer] = useState<{ current: ReturnType<typeof setTimeout> | null }>({
    current: null,
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
    },
    [debounceTimer],
  );

  const handleSelectSection = (sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setPage(1);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory.mutateAsync({ name: newCategoryName.trim() });
    setNewCategoryName("");
    setShowCreateCategory(false);
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim() || !newSectionCategoryId) return;
    await createSection.mutateAsync({
      name: newSectionName.trim(),
      categoryId: newSectionCategoryId,
    });
    setNewSectionName("");
    setShowCreateSection(false);
  };

  const handleCreateArticle = async () => {
    if (!newArticleTitle.trim() || !selectedSectionId) return;
    const article = await createArticle.mutateAsync({
      title: newArticleTitle.trim(),
      sectionId: selectedSectionId,
      bodyHtml: "",
    });
    setNewArticleTitle("");
    setShowCreateArticle(false);
    router.push(`/knowledge-base/articles/${article.id}`);
  };

  const articles = articlesData?.data ?? [];
  const meta = articlesData?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  const helpfulPercent = (helpful: number, notHelpful: number) => {
    const total = helpful + notHelpful;
    if (total === 0) return "--";
    return `${Math.round((helpful / total) * 100)}%`;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Left sidebar: category/section tree */}
      <div className="w-full lg:w-64 shrink-0 overflow-y-auto rounded-lg border border-border bg-card p-3">
        {categoriesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <CategoryTree
            categories={categories}
            selectedSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
            onCreateCategory={() => setShowCreateCategory(true)}
            onCreateSection={(categoryId) => {
              setNewSectionCategoryId(categoryId);
              setShowCreateSection(true);
            }}
            onCreateArticle={(sectionId) => {
              setSelectedSectionId(sectionId);
              setShowCreateArticle(true);
            }}
          />
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Manage help articles, categories, and sections.
            </p>
          </div>
          <Button
            onClick={() => {
              if (selectedSectionId) {
                setShowCreateArticle(true);
              } else {
                setShowCreateCategory(true);
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {selectedSectionId ? "New Article" : "New Category"}
          </Button>
        </div>

        {/* Create category inline form */}
        {showCreateCategory && (
          <Card>
            <CardHeader>
              <CardTitle>New Category</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. Getting Started"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                />
              </div>
              <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
                {createCategory.isPending ? "Creating..." : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create section inline form */}
        {showCreateSection && (
          <Card>
            <CardHeader>
              <CardTitle>New Section</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="sec-name">Name</Label>
                <Input
                  id="sec-name"
                  placeholder="e.g. Installation"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateSection()}
                />
              </div>
              <Button onClick={handleCreateSection} disabled={createSection.isPending}>
                {createSection.isPending ? "Creating..." : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateSection(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create article inline form */}
        {showCreateArticle && selectedSectionId && (
          <Card>
            <CardHeader>
              <CardTitle>New Article</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="article-title">Title</Label>
                <Input
                  id="article-title"
                  placeholder="e.g. How to set up your account"
                  value={newArticleTitle}
                  onChange={(e) => setNewArticleTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateArticle()}
                />
              </div>
              <Button onClick={handleCreateArticle} disabled={createArticle.isPending}>
                {createArticle.isPending ? "Creating..." : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateArticle(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Articles table */}
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Views</th>
                <th className="px-4 py-3 font-medium text-right">Helpful</th>
                <th className="px-4 py-3 font-medium">Published</th>
              </tr>
            </thead>
            <tbody>
              {articlesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="ml-auto h-4 w-8 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="ml-auto h-4 w-8 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {selectedSectionId
                      ? "No articles in this section yet."
                      : "No articles found. Select a section and create your first article."}
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr
                    key={article.id}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/knowledge-base/articles/${article.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{article.title}</div>
                      {article.section && (
                        <div className="text-xs text-muted-foreground">
                          {article.section.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[article.status] ?? "secondary"}>
                        {article.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {article.viewCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {helpfulPercent(article.helpfulCount, article.notHelpfulCount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString()
                        : "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1} to{" "}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} articles
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
