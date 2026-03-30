"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useContentPage,
  useCreatePage,
  useUpdatePage,
  usePublishPage,
  useUnpublishPage,
  useContentVersions,
  useRevertToVersion,
  useContentCategories,
  ContentVersion,
} from "@/hooks/use-content";
import { ContentForm } from "../components/content-form";

export default function ContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const { data: page, isLoading } = useContentPage(isNew ? "" : id);
  const { data: versions } = useContentVersions(isNew ? "" : id);
  const { data: categories } = useContentCategories();
  const updatePage = useUpdatePage();
  const publishPage = usePublishPage();
  const unpublishPage = useUnpublishPage();
  const revertToVersion = useRevertToVersion();

  const [showVersions, setShowVersions] = useState(false);
  const createPage = useCreatePage();

  const handleSubmit = async (data: any) => {
    if (isNew) {
      const created = await createPage.mutateAsync(data);
      router.push(`/content/${created.id}`);
    } else {
      await updatePage.mutateAsync({ id, data });
    }
  };

  const handlePublish = async () => {
    await publishPage.mutateAsync(id);
  };

  const handleUnpublish = async () => {
    await unpublishPage.mutateAsync(id);
  };

  const handleRevert = async (versionId: string) => {
    if (confirm("Revert to this version? Current changes will be saved as a version.")) {
      await revertToVersion.mutateAsync({ pageId: id, versionId });
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "Create Content" : "Edit Content"}
          </h1>
          {page && (
            <p className="text-sm text-muted-foreground">
              Version {page.version} &middot; {page.wordCount} words &middot;{" "}
              {page.readingTimeMin} min read
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && page && (
            <>
              {page.status === "published" ? (
                <Button
                  variant="outline"
                  onClick={handleUnpublish}
                  disabled={unpublishPage.isPending}
                >
                  {unpublishPage.isPending ? "Unpublishing..." : "Unpublish"}
                </Button>
              ) : (
                <Button
                  onClick={handlePublish}
                  disabled={publishPage.isPending}
                >
                  {publishPage.isPending ? "Publishing..." : "Publish"}
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={() => router.push("/content")}>
            Back to List
          </Button>
        </div>
      </div>

      {/* Status banner */}
      {page && (
        <div className="flex items-center gap-4 rounded-lg bg-muted px-4 py-2 text-sm">
          <span>
            Status:{" "}
            <span className="font-medium capitalize">{page.status}</span>
          </span>
          {page.publishedAt && (
            <span>
              Published:{" "}
              {new Date(page.publishedAt).toLocaleDateString()}
            </span>
          )}
          {page.scheduledAt && (
            <span>
              Scheduled:{" "}
              {new Date(page.scheduledAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Content Form */}
      <Card>
        <CardContent className="pt-6">
          <ContentForm
            initialData={page}
            categories={categories ?? []}
            onSubmit={handleSubmit}
            isLoading={isNew ? createPage.isPending : updatePage.isPending}
            mode={isNew ? "create" : "edit"}
          />
        </CardContent>
      </Card>

      {/* Version History */}
      {!isNew && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Version History</CardTitle>
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="text-sm text-primary hover:underline"
              >
                {showVersions ? "Hide" : "Show"}
              </button>
            </div>
          </CardHeader>
          {showVersions && (
            <CardContent>
              {!versions || versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No previous versions yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {versions.map((version: ContentVersion) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between rounded-md border border-border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Version {version.version}: {version.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleString()}
                          {version.changeSummary && ` - ${version.changeSummary}`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevert(version.id)}
                        disabled={revertToVersion.isPending}
                      >
                        Revert
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
