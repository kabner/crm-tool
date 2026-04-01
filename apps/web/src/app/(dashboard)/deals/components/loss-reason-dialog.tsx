"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COMMON_REASONS = [
  "Price too high",
  "Chose competitor",
  "No budget",
  "Bad timing",
  "No decision made",
  "Product missing features",
  "Lost contact",
];

interface LossReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void | Promise<void>;
  dealName?: string;
}

export function LossReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  dealName,
}: LossReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setCustomReason("");
    }
  }, [open]);

  const handleConfirm = () => {
    const finalReason = reason === "__custom" ? customReason : reason;
    onConfirm(finalReason || "No reason provided");
    setReason("");
    setCustomReason("");
  };

  const handleCancel = () => {
    setReason("");
    setCustomReason("");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <Dialog.Title className="text-lg font-semibold">
            Mark Deal as Lost
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            {dealName
              ? `Why was "${dealName}" lost?`
              : "Why was this deal lost?"}
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {COMMON_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReason(r); setCustomReason(""); }}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    reason === r
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setReason("__custom")}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  reason === "__custom"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                Other...
              </button>
            </div>

            {reason === "__custom" && (
              <input
                type="text"
                placeholder="Enter reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && customReason && handleConfirm()}
              />
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!reason || (reason === "__custom" && !customReason.trim())}
            >
              Mark as Lost
            </Button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
