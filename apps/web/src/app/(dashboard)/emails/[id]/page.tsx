"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Save,
  Monitor,
  Smartphone,
  Pencil,
  LayoutTemplate,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEmail,
  useUpdateEmail,
  useDeleteEmail,
  useEmailStats,
  type EmailSection,
} from "@/hooks/use-emails";
import { EmailEditor, sectionsToFullHtml } from "../components/email-editor";
import { SendDialog } from "../components/send-dialog";
import { TemplatePicker } from "../components/template-picker";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  sending: "bg-yellow-100 text-yellow-800",
  sent: "bg-green-100 text-green-800",
};

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

// --- Analytics view for sent emails ---

function EmailAnalytics({ emailId }: { emailId: string }) {
  const { data: stats, isLoading } = useEmailStats(emailId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground">No stats available yet.</p>
    );
  }

  const statCards = [
    { label: "Sent", value: formatNumber(stats.sent), sub: null },
    { label: "Delivered", value: formatNumber(stats.delivered), sub: null },
    {
      label: "Opened",
      value: formatNumber(stats.opened),
      sub: formatPercent(stats.openRate),
    },
    {
      label: "Clicked",
      value: formatNumber(stats.clicked),
      sub: formatPercent(stats.clickRate),
    },
    {
      label: "Bounced",
      value: formatNumber(stats.bounced),
      sub: formatPercent(stats.bounceRate),
    },
    {
      label: "Unsubscribed",
      value: formatNumber(stats.unsubscribed),
      sub: formatPercent(stats.unsubscribeRate),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              {stat.sub && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {stat.sub}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Open Rate", pct: stats.openRate },
              { label: "Click Rate", pct: stats.clickRate },
              { label: "Bounce Rate", pct: stats.bounceRate },
              { label: "Unsubscribe Rate", pct: stats.unsubscribeRate },
            ].map((bar) => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="w-32 text-sm text-muted-foreground">
                  {bar.label}
                </span>
                <div className="flex-1 rounded-full bg-muted">
                  <div
                    className="h-6 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(bar.pct, 100)}%` }}
                  />
                </div>
                <span className="w-14 text-right text-sm font-medium">
                  {formatPercent(bar.pct)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recipients placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Recipient list with individual open/click status will be available
            here. Total sent: {formatNumber(stats.sent)}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main page ---

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const emailId = params.id as string;

  const { data: email, isLoading } = useEmail(emailId);
  const updateEmail = useUpdateEmail();
  const deleteEmail = useDeleteEmail();

  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Local form state — initialized from fetched email
  const [name, setName] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [fromName, setFromName] = useState<string | null>(null);
  const [fromEmail, setFromEmail] = useState<string | null>(null);
  const [sections, setSections] = useState<EmailSection[] | null>(null);
  const [contentHtml, setContentHtml] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);

  // Resolve local state vs server state
  const currentName = name ?? email?.name ?? "";
  const currentSubject = subject ?? email?.subject ?? "";
  const currentFromName = fromName ?? email?.fromName ?? "";
  const currentFromEmail = fromEmail ?? email?.fromEmail ?? "";
  const currentSections = sections ?? email?.contentJson ?? [];
  const currentHtml = contentHtml ?? email?.contentHtml ?? "";

  const isDraft = email?.status === "draft";
  const isSent = email?.status === "sent" || email?.status === "sending";

  const handleEditorChange = useCallback(
    (newSections: EmailSection[], html: string) => {
      setSections(newSections);
      setContentHtml(html);
    },
    [],
  );

  const handleSaveDraft = async () => {
    await updateEmail.mutateAsync({
      id: emailId,
      data: {
        name: currentName,
        subject: currentSubject,
        fromName: currentFromName,
        fromEmail: currentFromEmail,
        contentJson: currentSections,
        contentHtml: currentHtml,
      },
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this email?")) return;
    await deleteEmail.mutateAsync(emailId);
    router.push("/emails");
  };

  const handleTemplateSelect = (
    templateSections: EmailSection[],
    templateHtml: string,
  ) => {
    setSections(templateSections);
    setContentHtml(templateHtml);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/emails")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Emails
        </Button>
        <p className="text-muted-foreground">Email not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/emails")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            {editingName ? (
              <Input
                value={currentName}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                autoFocus
                className="text-2xl font-bold"
              />
            ) : (
              <button
                onClick={() => isDraft && setEditingName(true)}
                className="flex items-center gap-2 text-left"
              >
                <h1 className="text-2xl font-bold tracking-tight">
                  {currentName || "Untitled Email"}
                </h1>
                {isDraft && (
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
            <div className="mt-1 flex items-center gap-2">
              <Badge
                className={
                  STATUS_STYLES[email.status] || "bg-gray-100 text-gray-800"
                }
              >
                {email.status}
              </Badge>
              {email.sentAt && (
                <span className="text-sm text-muted-foreground">
                  Sent{" "}
                  {new Date(email.sentAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowTemplatePicker(true)}
              >
                <LayoutTemplate className="mr-2 h-4 w-4" />
                Templates
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={updateEmail.isPending}
              >
                {updateEmail.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button onClick={() => setShowSendDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Draft: Editor mode */}
      {isDraft && (
        <div className="space-y-6">
          {/* Email fields */}
          <Card>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
              <div>
                <Label>Subject Line</Label>
                <Input
                  value={currentSubject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Name</Label>
                  <Input
                    value={currentFromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Your Name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>From Email</Label>
                  <Input
                    value={currentFromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Preview:
            </span>
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`rounded-md p-1.5 ${previewMode === "desktop" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Desktop preview"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`rounded-md p-1.5 ${previewMode === "mobile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Mobile preview"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Email editor */}
          <div
            style={
              previewMode === "mobile"
                ? { maxWidth: "375px", margin: "0 auto" }
                : undefined
            }
          >
            <EmailEditor
              sections={currentSections}
              onChange={handleEditorChange}
            />
          </div>
        </div>
      )}

      {/* Sent: Analytics mode */}
      {isSent && <EmailAnalytics emailId={emailId} />}

      {/* Scheduled: show info */}
      {email.status === "scheduled" && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              This email is scheduled to be sent on{" "}
              <span className="font-medium text-foreground">
                {email.scheduledAt
                  ? new Date(email.scheduledAt).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "a future date"}
              </span>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {showSendDialog && (
        <SendDialog
          emailId={emailId}
          onClose={() => setShowSendDialog(false)}
          onSent={() => {
            setShowSendDialog(false);
            router.refresh();
          }}
        />
      )}

      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
    </div>
  );
}
