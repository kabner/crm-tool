"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useWebhookDeliveries,
  useTestWebhook,
  useRetryDelivery,
} from "@/hooks/use-webhooks";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function WebhookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: webhook, isLoading } = useWebhook(id);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const { data: deliveries } = useWebhookDeliveries(id, {
    page: deliveryPage,
    limit: 20,
  });
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();
  const retryDelivery = useRetryDelivery();

  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading webhook details...
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Webhook not found
      </div>
    );
  }

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(webhook.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      await deleteWebhook.mutateAsync(id);
      router.push("/settings/integrations");
    }
  };

  const handleToggleStatus = () => {
    updateWebhook.mutate({
      id,
      data: {
        status: webhook.status === "active" ? "paused" : "active",
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/settings/integrations")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Webhook Endpoint
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            {webhook.url}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => testWebhook.mutate(id)}
            disabled={testWebhook.isPending}
          >
            <Send className="mr-1 h-3 w-3" />
            {testWebhook.isPending ? "Sending..." : "Test"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={updateWebhook.isPending}
          >
            {webhook.status === "active" ? "Pause" : "Resume"}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>
        </div>
      </div>

      {/* Config */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground">Status</span>
              <div className="mt-1">
                <Badge
                  variant={
                    webhook.status === "active" ? "default" : "secondary"
                  }
                >
                  {webhook.status}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">URL</span>
              <p className="mt-1 break-all font-mono text-sm">{webhook.url}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Subscribed Events
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {webhook.events.map((event) => (
                  <Badge key={event} variant="secondary" className="text-xs">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">HMAC Secret</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Use this secret to verify webhook signatures. The signature is sent
              in the X-Webhook-Signature header as sha256=HMAC(timestamp.body).
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                type={showSecret ? "text" : "password"}
                value={webhook.secret}
                className="font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopySecret}
              >
                {copiedSecret ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Delivery Log</CardTitle>
        </CardHeader>
        <CardContent>
          {!deliveries?.data?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No deliveries yet. Click "Test" to send a test webhook.
            </p>
          ) : (
            <>
              <div className="rounded-md border border-border">
                <div className="grid grid-cols-6 gap-2 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Event</span>
                  <span>Status</span>
                  <span>Response</span>
                  <span>Duration</span>
                  <span>Timestamp</span>
                  <span className="text-right">Actions</span>
                </div>
                {deliveries.data.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="grid grid-cols-6 items-center gap-2 border-b border-border last:border-0 px-4 py-2.5 text-sm"
                  >
                    <span className="font-mono text-xs">
                      {delivery.eventType}
                    </span>
                    <div>
                      <Badge
                        variant={
                          delivery.status === "success"
                            ? "default"
                            : delivery.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {delivery.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {delivery.responseStatus ?? "-"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {delivery.durationMs ? `${delivery.durationMs}ms` : "-"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(delivery.createdAt), "MMM d, HH:mm:ss")}
                    </span>
                    <div className="flex justify-end">
                      {delivery.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => retryDelivery.mutate(delivery.id)}
                          disabled={retryDelivery.isPending}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {deliveries.meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {deliveries.meta.total} total deliveries
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deliveryPage <= 1}
                      onClick={() => setDeliveryPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deliveryPage >= deliveries.meta.totalPages}
                      onClick={() => setDeliveryPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
