"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Mail, FileText, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCampaign,
  useCampaignStats,
  useUpdateCampaign,
  useDeleteCampaign,
} from "@/hooks/use-campaigns";
import { CampaignForm } from "../components/campaign-form";

const TYPE_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-800",
  content: "bg-green-100 text-green-800",
  paid: "bg-purple-100 text-purple-800",
  event: "bg-orange-100 text-orange-800",
  abm: "bg-pink-100 text-pink-800",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDate(date: string | null): string {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: campaign, isLoading } = useCampaign(id);
  const { data: stats, isLoading: statsLoading } = useCampaignStats(id);
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const handleUpdate = async (formData: {
    name: string;
    type: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
  }) => {
    await updateCampaign.mutateAsync({ id, data: formData });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteCampaign.mutateAsync(id);
    router.push("/campaigns");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/campaigns")}>
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/campaigns")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {campaign.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[campaign.type] || "bg-gray-100 text-gray-800"}`}
              >
                {campaign.type}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[campaign.status] || "bg-gray-100 text-gray-800"}`}
              >
                {campaign.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Confirm Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm
              initialData={{
                name: campaign.name,
                type: campaign.type,
                startDate: campaign.startDate ?? undefined,
                endDate: campaign.endDate ?? undefined,
                budget: campaign.budget ?? undefined,
              }}
              onSubmit={handleUpdate}
              isLoading={updateCampaign.isPending}
              submitLabel="Save Changes"
            />
          </CardContent>
        </Card>
      )}

      {/* Campaign Info */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Start Date
              </dt>
              <dd className="mt-1 text-sm">{formatDate(campaign.startDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                End Date
              </dt>
              <dd className="mt-1 text-sm">{formatDate(campaign.endDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Budget
              </dt>
              <dd className="mt-1 text-sm">
                {formatCurrency(campaign.budget)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created
              </dt>
              <dd className="mt-1 text-sm">
                {formatDate(campaign.createdAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats?.emailsSent ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Emails Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats?.contactsReached ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Contacts Reached</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats?.formsSubmitted ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Forms Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats?.linkedEmails ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Linked Emails</p>
          </CardContent>
        </Card>
      </div>

      {/* Linked Assets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Linked Assets</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Mail className="mr-2 h-4 w-4" />
                Link Email
              </Button>
              <Button variant="outline" size="sm" disabled>
                <FileText className="mr-2 h-4 w-4" />
                Link Form
              </Button>
              <Button variant="outline" size="sm" disabled>
                <ExternalLink className="mr-2 h-4 w-4" />
                Link Landing Page
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10">
            <Link2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No assets linked to this campaign yet
            </p>
            <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
              Link emails, forms, and landing pages to track campaign
              performance. Asset linking will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
