"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ContentCategory,
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentPage,
} from "@/hooks/use-content";

interface ContentFormProps {
  initialData?: ContentPage | null;
  categories?: ContentCategory[];
  onSubmit: (data: CreateContentPageInput | UpdateContentPageInput) => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ContentForm({
  initialData,
  categories = [],
  onSubmit,
  isLoading,
  mode = "create",
}: ContentFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(false);
  const [type, setType] = useState(initialData?.type ?? "page");
  const [bodyJson, setBodyJson] = useState(
    initialData?.bodyJson ? JSON.stringify(initialData.bodyJson, null, 2) : '{"content": ""}',
  );
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(", ") ?? "",
  );
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seoDescription ?? "",
  );
  const [ogImage, setOgImage] = useState(initialData?.ogImage ?? "");
  const [showSeo, setShowSeo] = useState(false);

  useEffect(() => {
    if (!slugManual && mode === "create") {
      setSlug(generateSlug(title));
    }
  }, [title, slugManual, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(bodyJson);
    } catch {
      alert("Body JSON is invalid");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data: CreateContentPageInput = {
      title,
      type,
      slug: slug || undefined,
      bodyJson: parsed,
      excerpt: excerpt || undefined,
      categoryId: categoryId || undefined,
      tags: tags.length > 0 ? tags : undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      ogImage: ogImage || undefined,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content area */}
        <div className="space-y-4 lg:col-span-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              className="mt-1 text-lg font-semibold"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManual(true);
              }}
              placeholder="url-slug"
              className="mt-1 font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="body">Body (JSON)</Label>
            <textarea
              id="body"
              value={bodyJson}
              onChange={(e) => setBodyJson(e.target.value)}
              className="mt-1 h-64 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder='{"content": "Write your content here..."}'
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-1 h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brief summary..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="page">Page</option>
              <option value="blog_post">Blog Post</option>
              <option value="landing_page">Landing Page</option>
            </select>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="ogImage">Featured Image URL</Label>
            <Input
              id="ogImage"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>

          {/* SEO section */}
          <div>
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {showSeo ? "Hide SEO fields" : "Show SEO fields"}
            </button>
            {showSeo && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Custom SEO title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <textarea
                    id="seoDescription"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="mt-1 h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Meta description for search engines..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : mode === "create"
              ? "Create Page"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
