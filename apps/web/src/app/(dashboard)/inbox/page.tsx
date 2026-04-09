"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  ArrowUpRight,
  ArrowDownLeft,
  UserPlus,
  Building2,
  RefreshCw,
  Calendar,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/use-activities";
import type { Activity } from "@/hooks/use-activities";
import {
  useGoogleStatus,
  useGmailSync,
  useCalendarSync,
} from "@/hooks/use-google-integration";
import { useCreateContact } from "@/hooks/use-contacts";
import { useCreateCompany } from "@/hooks/use-companies";
import { cn } from "@/lib/utils";

type FilterType = "all" | "email" | "meeting";

function extractEmails(text: string): string[] {
  const regex = /[\w.+-]+@[\w.-]+\.\w{2,}/g;
  return text.match(regex) || [];
}

function extractDomain(email: string): string {
  return email.split("@")[1] || "";
}

function formatName(email: string): string {
  const local = email.split("@")[0] || "";
  return local
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Create Contact Dialog ────────────────────────────────────────────────────

function CreateContactFromEmail({
  email,
  onDone,
}: {
  email: string;
  onDone: () => void;
}) {
  const domain = extractDomain(email);
  const guessedName = formatName(email);
  const nameParts = guessedName.split(" ");

  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(
    nameParts.slice(1).join(" ") || "",
  );
  const [companyName, setCompanyName] = useState(
    domain.split(".")[0]?.replace(/\b\w/g, (c) => c.toUpperCase()) || "",
  );
  const [createCompany, setCreateCompany] = useState(true);

  const createContactMutation = useCreateContact();
  const createCompanyMutation = useCreateCompany();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let companyId = "";

      if (createCompany && companyName) {
        const company = await createCompanyMutation.mutateAsync({
          name: companyName,
          domain,
        });
        companyId = company.id;
      }

      await createContactMutation.mutateAsync({
        firstName,
        lastName,
        email,
        companyId,
      });

      onDone();
    } catch {
      // Error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UserPlus className="h-4 w-4 text-primary" />
        Create Contact from {email}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">First Name</label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Last Name</label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="create-company"
          checked={createCompany}
          onChange={(e) => setCreateCompany(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="create-company" className="text-sm">
          Also create company
        </label>
      </div>
      {createCompany && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Company Name</label>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
            />
            <span className="text-xs text-muted-foreground shrink-0">
              {domain}
            </span>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !firstName}>
          {saving ? "Creating..." : "Create Contact"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Email Row ────────────────────────────────────────────────────────────────

function EmailRow({
  activity,
  googleEmail,
}: {
  activity: Activity;
  googleEmail: string;
}) {
  const router = useRouter();
  const [showCreateContact, setShowCreateContact] = useState(false);
  const meta = activity.metadata as Record<string, string>;
  const isInbound = meta.direction === "inbound";
  const otherParty = isInbound ? meta.from : meta.to;
  const otherEmails = extractEmails(otherParty || "").filter(
    (e) => e.toLowerCase() !== googleEmail.toLowerCase(),
  );
  const primaryEmail = otherEmails[0] || otherParty || "";
  const hasContact = !!activity.contactId;

  return (
    <div className="border-b border-border last:border-0">
      <div
        className={cn(
          "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
          !hasContact && "bg-amber-50/50 dark:bg-amber-950/10",
        )}
      >
        {/* Direction icon */}
        <div
          className={cn(
            "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            activity.type === "meeting"
              ? "bg-orange-100 text-orange-600"
              : isInbound
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600",
          )}
        >
          {activity.type === "meeting" ? (
            <Calendar className="h-4 w-4" />
          ) : isInbound ? (
            <ArrowDownLeft className="h-4 w-4" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {activity.subject}
            </span>
            {!hasContact && (
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-600 text-[10px] shrink-0"
              >
                Unmatched
              </Badge>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn(isInbound ? "text-blue-600" : "text-green-600")}>
              {isInbound ? "From" : "To"}
            </span>
            <span className="truncate">{primaryEmail || otherParty}</span>
            <span>&middot;</span>
            <span>{formatTimestamp(activity.createdAt)}</span>
          </div>

          {activity.body && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {activity.body}
            </p>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-2">
            {hasContact ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => router.push(`/contacts/${activity.contactId}`)}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                View Contact
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowCreateContact(!showCreateContact)}
              >
                <UserPlus className="mr-1 h-3 w-3" />
                {showCreateContact ? "Cancel" : "Create Contact"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Inline create contact form */}
      {showCreateContact && primaryEmail && (
        <div className="px-4 pb-3">
          <CreateContactFromEmail
            email={primaryEmail}
            onDone={() => setShowCreateContact(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(false);

  const { data: googleStatus } = useGoogleStatus();
  const gmailSync = useGmailSync();
  const calendarSync = useCalendarSync();

  // Fetch email and meeting activities
  const { data: emailData, isLoading: emailsLoading } = useActivities({
    type: "email",
    limit: 100,
  });
  const { data: meetingData, isLoading: meetingsLoading } = useActivities({
    type: "meeting",
    limit: 100,
  });

  const isLoading = emailsLoading || meetingsLoading;

  // Combine and sort
  const allActivities = useMemo(() => {
    const emails = emailData?.data || [];
    const meetings = meetingData?.data || [];

    let combined: Activity[] = [];
    if (filterType === "email") combined = emails;
    else if (filterType === "meeting") combined = meetings;
    else combined = [...emails, ...meetings];

    // Sort by createdAt descending
    combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (a) =>
          a.subject.toLowerCase().includes(q) ||
          (a.body && a.body.toLowerCase().includes(q)) ||
          JSON.stringify(a.metadata).toLowerCase().includes(q),
      );
    }

    // Filter unmatched only
    if (showUnmatchedOnly) {
      combined = combined.filter((a) => !a.contactId);
    }

    return combined;
  }, [emailData, meetingData, filterType, searchQuery, showUnmatchedOnly]);

  const unmatchedCount = useMemo(() => {
    const emails = emailData?.data || [];
    const meetings = meetingData?.data || [];
    return [...emails, ...meetings].filter((a) => !a.contactId).length;
  }, [emailData, meetingData]);

  const handleSync = async () => {
    if (gmailSync.isPending || calendarSync.isPending) return;
    await Promise.all([gmailSync.mutateAsync(), calendarSync.mutateAsync()]);
  };

  const syncing = gmailSync.isPending || calendarSync.isPending;

  if (!googleStatus?.connected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">
              Connect Google Workspace
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your Google account in Settings &gt; Integrations to sync
              emails and calendar events.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = "/settings/integrations"}>
              Go to Integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Synced from {googleStatus.email}
            {unmatchedCount > 0 && (
              <span className="ml-2 text-amber-600">
                &middot; {unmatchedCount} unmatched
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", syncing && "animate-spin")}
          />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search emails and meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(["all", "email", "meeting"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                filterType === type
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {type === "all" ? "All" : type === "email" ? "Emails" : "Meetings"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowUnmatchedOnly(!showUnmatchedOnly)}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            showUnmatchedOnly
              ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/20"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <Filter className="h-3 w-3" />
          Unmatched only
        </button>
      </div>

      {/* Activity List */}
      <Card>
        {isLoading ? (
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        ) : allActivities.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No emails yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || showUnmatchedOnly
                ? "No results match your filters."
                : "Click Sync Now to pull in your latest emails and calendar events."}
            </p>
          </CardContent>
        ) : (
          <div>
            <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              {allActivities.length} {filterType === "all" ? "items" : filterType === "email" ? "emails" : "meetings"}
            </div>
            {allActivities.map((activity) => (
              <EmailRow
                key={activity.id}
                activity={activity}
                googleEmail={googleStatus.email || ""}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
