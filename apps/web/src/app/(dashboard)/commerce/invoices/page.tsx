"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoices, useCreateInvoice } from "@/hooks/use-invoices";
import { InvoiceBuilder } from "./components/invoice-builder";

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

export default function InvoicesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useInvoices({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  const createInvoice = useCreateInvoice();

  const handleCreate = async (formData: {
    contactId: string;
    dueDate: string;
    notes?: string;
    lineItems: {
      description: string;
      quantity: number;
      unitPrice: number;
      productId?: string;
      discountPct?: number;
      taxRateId?: string;
    }[];
  }) => {
    const result = await createInvoice.mutateAsync(formData);
    setShowCreate(false);
    router.push(`/commerce/invoices/${result.id}`);
  };

  const invoices = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  const statuses = ["", "draft", "sent", "paid", "void"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage invoices for your customers.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Invoice"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceBuilder
              onSubmit={handleCreate}
              isLoading={createInvoice.isPending}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        {statuses.map((s) => (
          <Button
            key={s || "all"}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Number</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium text-right">Total</th>
                <th className="p-4 font-medium text-right">Amount Due</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4" colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}
              {!isLoading && invoices.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No invoices found
                  </td>
                </tr>
              )}
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/commerce/invoices/${invoice.id}`)
                  }
                >
                  <td className="p-4 font-medium">{invoice.number}</td>
                  <td className="p-4">
                    <Badge variant={statusBadgeVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatMoney(invoice.total)}
                  </td>
                  <td className="p-4 text-right">
                    {invoice.amountDue > 0 ? (
                      <span className="text-destructive font-medium">
                        {formatMoney(invoice.amountDue)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {formatMoney(0)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            invoices
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
