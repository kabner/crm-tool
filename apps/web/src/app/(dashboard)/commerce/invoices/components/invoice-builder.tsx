"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntitySearch } from "@/components/entity-search";

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
  discountPct?: number;
  taxRateId?: string;
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function InvoiceBuilder({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: {
    contactId: string;
    dueDate: string;
    notes?: string;
    lineItems: LineItemInput[];
  }) => void;
  isLoading: boolean;
}) {
  const [contactId, setContactId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemInput[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItemInput,
    value: string | number,
  ) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitPrice,
    0,
  );

  const discountTotal = lineItems.reduce((sum, li) => {
    if (!li.discountPct) return sum;
    return sum + Math.round(li.quantity * li.unitPrice * (li.discountPct / 100));
  }, 0);

  const total = subtotal - discountTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = lineItems.filter(
      (li) => li.description && li.unitPrice > 0,
    );
    if (!contactId || !dueDate || validItems.length === 0) return;

    onSubmit({
      contactId,
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
      lineItems: validItems,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Contact *</label>
          <EntitySearch
            entityType="contact"
            value={contactId}
            onChange={(id) => setContactId(id)}
            placeholder="Search contacts..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Due Date *</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Invoice notes"
        />
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Line Items</h4>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium w-24">Qty</th>
              <th className="pb-2 font-medium w-32">Unit Price ($)</th>
              <th className="pb-2 font-medium w-24">Disc. %</th>
              <th className="pb-2 font-medium w-28">Line Total</th>
              <th className="pb-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => {
              const lineTotal =
                item.quantity * item.unitPrice -
                (item.discountPct
                  ? Math.round(
                      item.quantity *
                        item.unitPrice *
                        (item.discountPct / 100),
                    )
                  : 0);
              return (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-2">
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(i, "description", e.target.value)
                      }
                      placeholder="Item description"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(i, "quantity", parseInt(e.target.value) || 1)
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.unitPrice ? (item.unitPrice / 100).toFixed(2) : ""}
                      onChange={(e) =>
                        updateLineItem(
                          i,
                          "unitPrice",
                          Math.round(parseFloat(e.target.value || "0") * 100),
                        )
                      }
                      placeholder="0.00"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discountPct ?? ""}
                      onChange={(e) =>
                        updateLineItem(
                          i,
                          "discountPct",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 pr-2 text-sm font-medium">
                    {formatMoney(lineTotal)}
                  </td>
                  <td className="py-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLineItem(i)}
                      disabled={lineItems.length <= 1}
                    >
                      X
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLineItem}
          className="mt-2"
        >
          + Add Line Item
        </Button>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatMoney(discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-medium text-base">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
