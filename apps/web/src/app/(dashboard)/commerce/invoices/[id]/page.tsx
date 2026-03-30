"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInvoice,
  useSendInvoice,
  useMarkPaid,
  useVoidInvoice,
} from "@/hooks/use-invoices";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "sent":
      return "outline";
    case "void":
      return "destructive";
    case "draft":
    default:
      return "secondary";
  }
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: invoice, isLoading } = useInvoice(id);
  const sendInvoice = useSendInvoice();
  const markPaid = useMarkPaid();
  const voidInvoice = useVoidInvoice();

  const handleSend = async () => {
    if (!confirm("Send this invoice?")) return;
    await sendInvoice.mutateAsync(id);
  };

  const handleMarkPaid = async () => {
    if (!confirm("Mark this invoice as paid?")) return;
    await markPaid.mutateAsync(id);
  };

  const handleVoid = async () => {
    if (!confirm("Void this invoice? This cannot be undone.")) return;
    await voidInvoice.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/commerce/invoices")}
        >
          Back to Invoices
        </Button>
      </div>
    );
  }

  const lineItems = invoice.lineItems ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/commerce/invoices")}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {invoice.number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusBadgeVariant(invoice.status)}>
                {invoice.status}
              </Badge>
              {invoice.sentAt && (
                <span className="text-sm text-muted-foreground">
                  Sent {new Date(invoice.sentAt).toLocaleDateString()}
                </span>
              )}
              {invoice.paidAt && (
                <span className="text-sm text-muted-foreground">
                  Paid {new Date(invoice.paidAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button
              onClick={handleSend}
              disabled={sendInvoice.isPending}
            >
              {sendInvoice.isPending ? "Sending..." : "Send Invoice"}
            </Button>
          )}
          {invoice.status !== "paid" && invoice.status !== "void" && (
            <Button
              variant="outline"
              onClick={handleMarkPaid}
              disabled={markPaid.isPending}
            >
              {markPaid.isPending ? "Processing..." : "Mark as Paid"}
            </Button>
          )}
          {invoice.status !== "paid" && invoice.status !== "void" && (
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={voidInvoice.isPending}
            >
              {voidInvoice.isPending ? "Voiding..." : "Void"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Issue Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {new Date(invoice.issueDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Due Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Amount Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {formatMoney(invoice.amountDue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">#</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium text-right">Qty</th>
                <th className="p-4 font-medium text-right">Unit Price</th>
                <th className="p-4 font-medium text-right">Discount</th>
                <th className="p-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={item.id} className="border-b">
                  <td className="p-4 text-sm text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="p-4">{item.description}</td>
                  <td className="p-4 text-right">{item.quantity}</td>
                  <td className="p-4 text-right">
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td className="p-4 text-right text-muted-foreground">
                    {item.discountPct ? `${item.discountPct}%` : "-"}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatMoney(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Card className="w-80">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(invoice.subtotal)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatMoney(invoice.discountTotal)}</span>
              </div>
            )}
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(invoice.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-base border-t pt-2">
              <span>Total</span>
              <span>{formatMoney(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span>{formatMoney(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-medium text-base border-t pt-2">
              <span>Amount Due</span>
              <span
                className={invoice.amountDue > 0 ? "text-destructive" : ""}
              >
                {formatMoney(invoice.amountDue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
