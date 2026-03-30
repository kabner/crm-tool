"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  useContentPages,
  useDeletePage,
  ContentPage,
} from "@/hooks/use-content";

const TYPE_TABS = [
  { label: "All", value: "" },
  { label: "Pages", value: "page" },
  { label: "Blog Posts", value: "blog_post" },
  { label: "Landing Pages", value: "landing_page" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-800",
};

const TYPE_LABELS: Record<string, string> = {
  page: "Page",
  blog_post: "Blog Post",
  landing_page: "Landing Page",
};

export default function ContentListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeType, setActiveType] = useState("");
  const deletePage = useDeletePage();

  const { data, isLoading } = useContentPages({
    page,
    limit: 20,
    type: activeType || undefined,
    search: debouncedSearch || undefined,
  });

  const debounceTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer[0]) clearTimeout(debounceTimer[0]);
      debounceTimer[0] = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
    },
    [debounceTimer],
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this page?")) {
      await deletePage.mutateAsync(id);
    }
  };

  const pages = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Manage pages, blog posts, and landing pages.
          </p>
        </div>
        <Button onClick={() => router.push("/content/new")}>
          Create Content
        </Button>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveType(tab.value);
              setPage(1);
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeType === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search content..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Content Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Published</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No content found. Create your first page.
                    </td>
                  </tr>
                ) : (
                  pages.map((item: ContentPage) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/content/${item.id}`)}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            /{item.slug}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-800"}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.viewCount}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            items
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
  );
}
