"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
} from "@/hooks/use-webhooks";
import { useApiKeys, useRevokeApiKey } from "@/hooks/use-api-keys";
import { WebhookForm } from "./components/webhook-form";
import { ApiKeyCreateDialog } from "./components/api-key-create-dialog";
import {
  Globe,
  Key,
  Plug,
  Trash2,
  ExternalLink,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function IntegrationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("webhooks");
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [slackUrl, setSlackUrl] = useState("");
  const [slackConfiguring, setSlackConfiguring] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<{
    ok: boolean;
    error?: string;
  } | null>(null);

  const { data: webhooks, isLoading: webhooksLoading } = useWebhooks();
  const { data: apiKeys, isLoading: apiKeysLoading } = useApiKeys();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const revokeApiKey = useRevokeApiKey();

  const handleCreateWebhook = async (data: {
    url: string;
    events: string[];
  }) => {
    await createWebhook.mutateAsync(data);
    setShowWebhookForm(false);
  };

  const handleConfigureSlack = async () => {
    if (!slackUrl) return;
    setSlackConfiguring(true);
    try {
      await apiClient.post("/api/v1/integrations/slack/configure", {
        webhookUrl: slackUrl,
      });
      setSlackUrl("");
    } finally {
      setSlackConfiguring(false);
    }
  };

  const handleTestSlack = async () => {
    setSlackTestResult(null);
    try {
      const result = await apiClient.post<{ ok: boolean; error?: string }>(
        "/api/v1/integrations/slack/test",
      );
      setSlackTestResult(result);
    } catch {
      setSlackTestResult({ ok: false, error: "Failed to send test message" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Manage webhooks, API keys, and third-party integrations.
        </p>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-border">
          <Tabs.Trigger
            value="webhooks"
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "webhooks"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Globe className="h-4 w-4" />
            Webhooks
          </Tabs.Trigger>
          <Tabs.Trigger
            value="api-keys"
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "api-keys"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Key className="h-4 w-4" />
            API Keys
          </Tabs.Trigger>
          <Tabs.Trigger
            value="integrations"
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "integrations"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Plug className="h-4 w-4" />
            Integrations
          </Tabs.Trigger>
        </Tabs.List>

        {/* Webhooks Tab */}
        <Tabs.Content value="webhooks" className="mt-6 space-y-4">
          {showWebhookForm ? (
            <WebhookForm
              onSubmit={handleCreateWebhook}
              onCancel={() => setShowWebhookForm(false)}
              isLoading={createWebhook.isPending}
            />
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={() => setShowWebhookForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Webhook
                </Button>
              </div>

              {webhooksLoading ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Loading webhooks...
                  </CardContent>
                </Card>
              ) : !webhooks?.length ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium">No webhooks yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create a webhook endpoint to receive real-time event
                      notifications.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((webhook) => (
                    <Card
                      key={webhook.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() =>
                        router.push(
                          `/settings/integrations/webhooks/${webhook.id}`,
                        )
                      }
                    >
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="truncate font-mono text-sm">
                              {webhook.url}
                            </span>
                            <Badge
                              variant={
                                webhook.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {webhook.status}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{webhook.events.length} events</span>
                            {webhook.successCount !== undefined && (
                              <span className="text-green-600">
                                {webhook.successCount} delivered
                              </span>
                            )}
                            {(webhook.failCount ?? 0) > 0 && (
                              <span className="text-destructive">
                                {webhook.failCount} failed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  "Are you sure you want to delete this webhook?",
                                )
                              ) {
                                deleteWebhook.mutate(webhook.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </Tabs.Content>

        {/* API Keys Tab */}
        <Tabs.Content value="api-keys" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowApiKeyDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>

          {apiKeysLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading API keys...
              </CardContent>
            </Card>
          ) : !apiKeys?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Key className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No API keys</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create an API key to access the CRM API programmatically.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border border-border">
              <div className="grid grid-cols-6 gap-4 border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                <span className="col-span-2">Name</span>
                <span>Key</span>
                <span>Scopes</span>
                <span>Last Used</span>
                <span className="text-right">Actions</span>
              </div>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={cn(
                    "grid grid-cols-6 items-center gap-4 border-b border-border last:border-0 px-4 py-3",
                    key.revokedAt && "opacity-50",
                  )}
                >
                  <span className="col-span-2 text-sm font-medium truncate">
                    {key.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {key.keyPrefix}***
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(key.scopes).map(([resource, level]) => (
                      <Badge key={resource} variant="secondary" className="text-[10px]">
                        {resource}:{level === "read_write" ? "rw" : "r"}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {key.lastUsedAt
                      ? format(new Date(key.lastUsedAt), "MMM d, yyyy")
                      : "Never"}
                  </span>
                  <div className="flex justify-end">
                    {key.revokedAt ? (
                      <Badge variant="destructive">Revoked</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to revoke this API key? This action cannot be undone.",
                            )
                          ) {
                            revokeApiKey.mutate(key.id);
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <ApiKeyCreateDialog
            open={showApiKeyDialog}
            onOpenChange={setShowApiKeyDialog}
          />
        </Tabs.Content>

        {/* Integrations Tab */}
        <Tabs.Content value="integrations" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Slack Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Slack</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Send notifications to Slack
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="Slack webhook URL"
                    value={slackUrl}
                    onChange={(e) => setSlackUrl(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleConfigureSlack}
                      disabled={!slackUrl || slackConfiguring}
                    >
                      {slackConfiguring ? "Saving..." : "Configure"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTestSlack}
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Test
                    </Button>
                  </div>
                </div>
                {slackTestResult && (
                  <p
                    className={cn(
                      "text-xs",
                      slackTestResult.ok
                        ? "text-green-600"
                        : "text-destructive",
                    )}
                  >
                    {slackTestResult.ok
                      ? "Test message sent successfully!"
                      : `Failed: ${slackTestResult.error}`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Placeholder cards */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Mailchimp</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Sync contacts with Mailchimp
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <Plug className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Zapier</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Connect with 5000+ apps
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function Mail(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
