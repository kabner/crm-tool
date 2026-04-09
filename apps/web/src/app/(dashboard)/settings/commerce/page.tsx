"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CURRENCIES } from "@/lib/currency";
import { useExchangeRates, useUpsertRate } from "@/hooks/use-currency";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function CommerceSettingsPage() {
  const { data: rates, isLoading } = useExchangeRates();
  const upsertRate = useUpsertRate();

  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [rate, setRate] = useState("");

  const handleAddRate = () => {
    if (!fromCurrency || !toCurrency || !rate || fromCurrency === toCurrency) return;
    upsertRate.mutate(
      { fromCurrency, toCurrency, rate: parseFloat(rate) },
      { onSuccess: () => setRate("") },
    );
  };

  const handleEditRate = (existing: { fromCurrency: string; toCurrency: string; rate: number }) => {
    setFromCurrency(existing.fromCurrency);
    setToCurrency(existing.toCurrency);
    setRate(String(existing.rate));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Currency & Exchange Rates</h1>
        <p className="mt-1 text-muted-foreground">
          Manage exchange rates for multi-currency deals, invoices, and products.
        </p>
      </div>

      {/* Add/Edit rate form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Exchange Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromCurrency">From</Label>
              <select
                id="fromCurrency"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className={selectClassName}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toCurrency">To</Label>
              <select
                id="toCurrency"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className={selectClassName}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.00000001"
                placeholder="1.00000000"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddRate}
              disabled={
                upsertRate.isPending ||
                !rate ||
                fromCurrency === toCurrency
              }
            >
              {upsertRate.isPending ? "Saving..." : "Save Rate"}
            </Button>
          </div>
          {fromCurrency === toCurrency && (
            <p className="mt-2 text-sm text-destructive">
              From and To currencies must be different.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Exchange rates table */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !rates || rates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exchange rates configured yet. Add one above.
            </p>
          ) : (
            <div className="rounded-md border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      From
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      To
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {r.fromCurrency}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {r.toCurrency}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {Number(r.rate).toFixed(8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleEditRate({
                              fromCurrency: r.fromCurrency,
                              toCurrency: r.toCurrency,
                              rate: Number(r.rate),
                            })
                          }
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
