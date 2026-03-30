"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Dialog from "@radix-ui/react-dialog";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, Copy, AlertTriangle, X } from "lucide-react";
import {
  useCreateApiKey,
  type CreateApiKeyResponse,
} from "@/hooks/use-api-keys";

const SCOPE_RESOURCES = [
  "contacts",
  "companies",
  "deals",
  "tickets",
  "emails",
] as const;

const SCOPE_LEVELS = ["read", "read_write"] as const;

interface ApiKeyCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyCreateDialog({
  open,
  onOpenChange,
}: ApiKeyCreateDialogProps) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Record<string, "read" | "read_write">>(
    {},
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const createApiKey = useCreateApiKey();

  const toggleScope = (resource: string, level: "read" | "read_write") => {
    setScopes((prev) => {
      const current = prev[resource];
      if (current === level) {
        const next = { ...prev };
        delete next[resource];
        return next;
      }
      return { ...prev, [resource]: level };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || Object.keys(scopes).length === 0) return;

    const result = await createApiKey.mutateAsync({
      name,
      scopes,
      expiresAt: expiresAt || undefined,
    });

    setCreatedKey(result);
  };

  const handleCopy = async () => {
    if (!createdKey?.plainKey) return;
    await navigator.clipboard.writeText(createdKey.plainKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName("");
    setScopes({});
    setExpiresAt("");
    setCreatedKey(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-0 shadow-lg">
          {createdKey ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold">
                  API Key Created
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded-md p-1 hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      Copy your API key now
                    </p>
                    <p className="text-yellow-700 mt-1">
                      This key will not be shown again. Store it in a secure
                      location.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={createdKey.plainKey}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold">
                    Create API Key
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded-md p-1 hover:bg-muted">
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    placeholder="e.g. Production API Key"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Scopes</Label>
                  <div className="rounded-md border border-border">
                    <div className="grid grid-cols-3 gap-0 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                      <span>Resource</span>
                      <span className="text-center">Read</span>
                      <span className="text-center">Read & Write</span>
                    </div>
                    {SCOPE_RESOURCES.map((resource) => (
                      <div
                        key={resource}
                        className="grid grid-cols-3 items-center gap-0 border-b border-border last:border-0 px-4 py-2.5"
                      >
                        <span className="text-sm capitalize">{resource}</span>
                        {SCOPE_LEVELS.map((level) => (
                          <div key={level} className="flex justify-center">
                            <Checkbox.Root
                              className="flex h-4 w-4 items-center justify-center rounded border border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              checked={scopes[resource] === level}
                              onCheckedChange={() =>
                                toggleScope(resource, level)
                              }
                            >
                              <Checkbox.Indicator>
                                <Check className="h-3 w-3" />
                              </Checkbox.Indicator>
                            </Checkbox.Root>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {Object.keys(scopes).length === 0 && (
                    <p className="text-xs text-destructive">
                      Select at least one scope
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key-expires">Expiry Date (optional)</Label>
                  <Input
                    id="key-expires"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createApiKey.isPending ||
                      !name ||
                      Object.keys(scopes).length === 0
                    }
                  >
                    {createApiKey.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
