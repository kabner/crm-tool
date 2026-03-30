"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Send,
  Archive,
  Eye,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useKBArticle,
  useKBCategories,
  useUpdateArticle,
  usePublishArticle,
  useDeleteArticle,
  type UpdateArticleInput,
} from "@/hooks/use-knowledge-base";

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const { data: article, isLoading } = useKBArticle(articleId);
  const { data: categories = [] } = useKBCategories();
  const updateArticle = useUpdateArticle();
  const publishArticle = usePublishArticle();
  const deleteArticle = useDeleteArticle();

  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load article data into form
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setBodyHtml(article.bodyHtml);
      setSectionId(article.sectionId);
      setVisibility(article.visibility);
      setSeoTitle(article.seoTitle ?? "");
      setSeoDescription(article.seoDescription ?? "");
    }
  }, [article]);

  // Track changes
  useEffect(() => {
    if (!article) return;
    const changed =
      title !== article.title ||
      bodyHtml !== article.bodyHtml ||
      sectionId !== article.sectionId ||
      visibility !== article.visibility ||
      seoTitle !== (article.seoTitle ?? "") ||
      seoDescription !== (article.seoDescription ?? "");
    setHasChanges(changed);
  }, [title, bodyHtml, sectionId, visibility, seoTitle, seoDescription, article]);

  const handleSave = async () => {
    const data: UpdateArticleInput = {
      title,
      bodyHtml,
      sectionId,
      visibility,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
    };
    await updateArticle.mutateAsync({ id: articleId, data });
    setHasChanges(false);
  };

  const handlePublish = async () => {
    // Save first if there are changes
    if (hasChanges) {
      await handleSave();
    }
    await publishArticle.mutateAsync(articleId);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article? This cannot be undone.")) {
      return;
    }
    await deleteArticle.mutateAsync(articleId);
    router.push("/knowledge-base");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">Article not found.</p>
        <Button variant="outline" onClick={() => router.push("/knowledge-base")}>
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  // Build flat list of sections grouped by category for the selector
  const sectionOptions: { label: string; value: string }[] = [];
  categories.forEach((cat) => {
    cat.sections?.forEach((sec) => {
      sectionOptions.push({
        label: `${cat.name} > ${sec.name}`,
        value: sec.id,
      });
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/knowledge-base")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <Badge
            variant={
              article.status === "published"
                ? "default"
                : article.status === "archived"
                  ? "destructive"
                  : "secondary"
            }
          >
            {article.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            v{article.version}
          </span>
          {hasChanges && (
            <span className="text-sm text-amber-500 font-medium">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-1 h-4 w-4" />
            {showPreview ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateArticle.isPending}
          >
            <Save className="mr-1 h-4 w-4" />
            {updateArticle.isPending ? "Saving..." : "Save"}
          </Button>
          {article.status !== "published" && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishArticle.isPending}
            >
              <Send className="mr-1 h-4 w-4" />
              {publishArticle.isPending ? "Publishing..." : "Publish"}
            </Button>
          )}
          {article.status === "published" && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await updateArticle.mutateAsync({
                  id: articleId,
                  data: { status: "archived" },
                });
              }}
            >
              <Archive className="mr-1 h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {showPreview ? (
        /* Preview mode */
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title || "Untitled"}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {article.publishedAt && (
                <span>
                  Published {new Date(article.publishedAt).toLocaleDateString()}
                </span>
              )}
              <span>{article.viewCount} views</span>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </CardContent>
        </Card>
      ) : (
        /* Edit mode */
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="text-xl font-bold h-12"
            />
          </div>

          {/* Section selector + visibility */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="section-select">Section</Label>
              <select
                id="section-select"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a section...</option>
                {sectionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Visibility</Label>
              <div className="flex items-center gap-1 mt-1">
                <Button
                  variant={visibility === "public" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibility("public")}
                >
                  <Globe className="mr-1 h-3.5 w-3.5" />
                  Public
                </Button>
                <Button
                  variant={visibility === "internal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibility("internal")}
                >
                  <Lock className="mr-1 h-3.5 w-3.5" />
                  Internal
                </Button>
              </div>
            </div>
          </div>

          {/* Rich text editor (textarea with HTML) */}
          <div>
            <Label htmlFor="body-editor">Content (HTML)</Label>
            <textarea
              id="body-editor"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="Write your article content here... HTML is supported."
              rows={20}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono resize-y"
            />
          </div>

          {/* SEO fields (collapsible) */}
          <div className="rounded-lg border border-border">
            <button
              onClick={() => setShowSeo(!showSeo)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span>SEO Settings</span>
              {showSeo ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showSeo && (
              <div className="space-y-3 border-t border-border px-4 py-3">
                <div>
                  <Label htmlFor="seo-title">SEO Title</Label>
                  <Input
                    id="seo-title"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Custom title for search engines"
                  />
                </div>
                <div>
                  <Label htmlFor="seo-desc">SEO Description</Label>
                  <textarea
                    id="seo-desc"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Brief description for search engine results"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Article stats and danger zone */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>{article.viewCount} views</span>
              <span>
                {article.helpfulCount} helpful / {article.notHelpfulCount} not
                helpful
              </span>
              <span>
                Created {new Date(article.createdAt).toLocaleDateString()}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteArticle.isPending}
            >
              {deleteArticle.isPending ? "Deleting..." : "Delete Article"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
