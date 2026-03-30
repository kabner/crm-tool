"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type CreateProductInput,
  type Product,
} from "@/hooks/use-products";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function ProductForm({
  onSubmit,
  isLoading,
  initial,
}: {
  onSubmit: (data: CreateProductInput) => void;
  isLoading: boolean;
  initial?: Product;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [priceName, setPriceName] = useState("");
  const [priceType, setPriceType] = useState("one_time");
  const [priceAmount, setPriceAmount] = useState("");
  const [priceInterval, setPriceInterval] = useState("month");
  const [prices, setPrices] = useState<
    { name: string; type: string; amount: number; interval?: string }[]
  >(
    initial?.prices?.map((p) => ({
      name: p.name,
      type: p.type,
      amount: p.amount,
      interval: p.interval ?? undefined,
    })) ?? [],
  );

  const addPrice = () => {
    if (!priceName || !priceAmount) return;
    setPrices([
      ...prices,
      {
        name: priceName,
        type: priceType,
        amount: Math.round(parseFloat(priceAmount) * 100),
        interval: priceType === "recurring" ? priceInterval : undefined,
      },
    ]);
    setPriceName("");
    setPriceAmount("");
  };

  const removePrice = (index: number) => {
    setPrices(prices.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      sku: sku || undefined,
      prices: prices.length > 0 ? prices : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Product name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">SKU</label>
          <Input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU-001"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description"
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Prices</h4>
        {prices.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{p.name}</Badge>
            <span className="text-sm">{formatMoney(p.amount)}</span>
            <span className="text-sm text-muted-foreground">
              {p.type === "recurring" ? `/ ${p.interval}` : "one-time"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removePrice(i)}
            >
              Remove
            </Button>
          </div>
        ))}
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Price Name</label>
            <Input
              value={priceName}
              onChange={(e) => setPriceName(e.target.value)}
              placeholder="Standard"
              className="w-32"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Type</label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="one_time">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Amount ($)</label>
            <Input
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="99.00"
              type="number"
              step="0.01"
              className="w-28"
            />
          </div>
          {priceType === "recurring" && (
            <div>
              <label className="text-xs text-muted-foreground">Interval</label>
              <select
                value={priceInterval}
                onChange={(e) => setPriceInterval(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
                <option value="week">Weekly</option>
              </select>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addPrice}>
            Add Price
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !name}>
        {isLoading ? "Saving..." : initial ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data, isLoading } = useProducts({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const debounceTimer = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer[0]) clearTimeout(debounceTimer[0]);
      debounceTimer[0] = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
    },
    [debounceTimer],
  );

  const handleCreate = async (formData: CreateProductInput) => {
    await createProduct.mutateAsync(formData);
    setShowCreateForm(false);
  };

  const handleUpdate = async (formData: CreateProductInput) => {
    if (!editingProduct) return;
    await updateProduct.mutateAsync({ id: editingProduct.id, data: formData });
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive this product?")) return;
    await deleteProduct.mutateAsync(id);
  };

  const products = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and pricing.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingProduct(null);
          }}
        >
          {showCreateForm ? "Cancel" : "Create Product"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              onSubmit={handleCreate}
              isLoading={createProduct.isPending}
            />
          </CardContent>
        </Card>
      )}

      {editingProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              onSubmit={handleUpdate}
              isLoading={updateProduct.isPending}
              initial={editingProduct}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Prices</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
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
              {!isLoading && products.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No products found
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {product.sku ?? "-"}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {product.prices?.map((price) => (
                        <Badge key={price.id} variant="secondary">
                          {price.name}: {formatMoney(price.amount)}
                          {price.type === "recurring"
                            ? `/${price.interval}`
                            : ""}
                        </Badge>
                      ))}
                      {(!product.prices || product.prices.length === 0) && (
                        <span className="text-sm text-muted-foreground">
                          No prices
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        product.status === "active" ? "default" : "secondary"
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product);
                          setShowCreateForm(false);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        Archive
                      </Button>
                    </div>
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
            products
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
