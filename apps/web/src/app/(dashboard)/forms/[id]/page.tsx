"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useForm,
  useUpdateForm,
  usePublishForm,
  useDeleteForm,
  useFormSubmissions,
  useFormEmbedCode,
} from "@/hooks/use-forms";
import { FormBuilder } from "../components/form-builder";
import { FormPreview } from "../components/form-preview";
import type { FormField } from "@/hooks/use-forms";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  published: "default",
  draft: "secondary",
  archived: "destructive",
};

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const { data: form, isLoading } = useForm(formId);
  const { data: submissionsData } = useFormSubmissions(formId, { limit: 10 });
  const updateForm = useUpdateForm();
  const publishForm = usePublishForm();
  const deleteForm = useDeleteForm();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFields, setEditFields] = useState<FormField[]>([]);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);

  const { data: embedData } = useFormEmbedCode(
    showEmbedDialog ? formId : "",
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Form not found</p>
      </div>
    );
  }

  const startEditing = () => {
    setEditName(form.name);
    setEditFields(form.fields);
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateForm.mutateAsync({
      id: formId,
      data: { name: editName, fields: editFields },
    });
    setIsEditing(false);
  };

  const handlePublish = async () => {
    await publishForm.mutateAsync(formId);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    await deleteForm.mutateAsync(formId);
    router.push("/forms");
  };

  const handleCopyEmbed = () => {
    if (embedData?.embedCode) {
      navigator.clipboard.writeText(embedData.embedCode);
    }
  };

  const submissions = submissionsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/forms")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Forms
          </button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-3xl font-bold h-auto py-0 border-0 border-b rounded-none focus-visible:ring-0"
              />
            ) : (
              form.name
            )}
          </h1>
          <Badge variant={statusVariant[form.status] || "secondary"}>
            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateForm.isPending}
              >
                {updateForm.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              {form.status === "draft" && (
                <Button
                  onClick={handlePublish}
                  disabled={publishForm.isPending}
                >
                  {publishForm.isPending ? "Publishing..." : "Publish"}
                </Button>
              )}
              {form.status === "published" && (
                <Button
                  variant="outline"
                  onClick={() => setShowEmbedDialog(!showEmbedDialog)}
                >
                  Embed Code
                </Button>
              )}
              <Button variant="outline" onClick={startEditing}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Embed code dialog */}
      {showEmbedDialog && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Embed Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Copy the code below and paste it into your website HTML where you
              want the form to appear.
            </p>
            <div className="relative">
              <pre className="max-h-48 overflow-auto rounded-md bg-muted p-4 text-xs">
                {embedData?.embedCode || "Loading..."}
              </pre>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmbedDialog(false)}
              >
                Close
              </Button>
              <Button size="sm" onClick={handleCopyEmbed}>
                Copy to Clipboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {isEditing ? (
        <FormBuilder
          initialFields={form.fields}
          onChange={(fields) => setEditFields(fields)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Form preview */}
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <FormPreview fields={form.fields} />
            </CardContent>
          </Card>

          {/* Right: Submissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Recent Submissions ({form.submissionCount})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    No submissions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                        {sub.contactId && (
                          <Badge variant="secondary" className="text-[10px]">
                            Contact linked
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {Object.entries(sub.data)
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium text-muted-foreground">
                                {key}:
                              </span>{" "}
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        {Object.keys(sub.data).length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{Object.keys(sub.data).length - 4} more fields
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
