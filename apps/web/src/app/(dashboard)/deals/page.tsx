"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useDeals,
  useDefaultPipeline,
  usePipelines,
  usePipelineSummary,
  useCreateDeal,
  type DealFilters,
} from "@/hooks/use-deals";
import { PipelineBoard } from "./components/pipeline-board";
import { DealsTable } from "./components/deals-table";
import { DealForm } from "./components/deal-form";

type ViewMode = "board" | "list";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DealsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters
  const [filterOwner, setFilterOwner] = useState<"mine" | "">("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [filterCloseDateFrom, setFilterCloseDateFrom] = useState("");
  const [filterCloseDateTo, setFilterCloseDateTo] = useState("");

  const { data: pipelines } = usePipelines();
  const { data: defaultPipeline } = useDefaultPipeline();
  const createDeal = useCreateDeal();

  // Set default pipeline on load
  useEffect(() => {
    if (!selectedPipelineId && defaultPipeline) {
      setSelectedPipelineId(defaultPipeline.id);
    } else if (!selectedPipelineId && pipelines && pipelines.length > 0) {
      const def = pipelines.find((p) => p.isDefault);
      setSelectedPipelineId(def?.id ?? pipelines[0]!.id);
    }
  }, [defaultPipeline, pipelines, selectedPipelineId]);

  const { data: summary, isLoading: summaryLoading } =
    usePipelineSummary(selectedPipelineId);

  const hasActiveFilters = !!(filterOwner || filterMinAmount || filterMaxAmount || filterCloseDateFrom || filterCloseDateTo);

  const clearFilters = () => {
    setFilterOwner("");
    setFilterMinAmount("");
    setFilterMaxAmount("");
    setFilterCloseDateFrom("");
    setFilterCloseDateTo("");
  };

  const { data: dealsData, isLoading: dealsLoading } = useDeals({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    pipelineId: selectedPipelineId || undefined,
    ownerId: filterOwner === "mine" ? "me" : undefined,
    minAmount: filterMinAmount ? Number(filterMinAmount) : undefined,
    maxAmount: filterMaxAmount ? Number(filterMaxAmount) : undefined,
    closeDateFrom: filterCloseDateFrom || undefined,
    closeDateTo: filterCloseDateTo || undefined,
  });

  // Debounce search
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

  const handleRowClick = (id: string) => {
    router.push(`/deals/${id}`);
  };

  const handleCreateSubmit = async (formData: {
    name: string;
    amount?: number;
    pipelineId: string;
    stageId: string;
    closeDate?: string;
    companyName?: string;
    ownerId?: string;
  }) => {
    await createDeal.mutateAsync(formData);
    setShowCreateForm(false);
  };

  const deals = dealsData?.data ?? [];
  const meta = dealsData?.meta ?? {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Track and manage your sales pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-md border border-border">
            <button
              onClick={() => setViewMode("board")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "board"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                "rounded-l-md",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                "rounded-r-md",
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "Create Deal"}
          </Button>
        </div>
      </div>

      {/* Pipeline selector (if multiple) */}
      {pipelines && pipelines.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Pipeline:
          </label>
          <select
            value={selectedPipelineId}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">
              !
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Owner
              </label>
              <select
                value={filterOwner}
                onChange={(e) => { setFilterOwner(e.target.value as "" | "mine"); setPage(1); }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All owners</option>
                <option value="mine">My Deals</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Min Amount
              </label>
              <Input
                type="number"
                placeholder="$0"
                value={filterMinAmount}
                onChange={(e) => { setFilterMinAmount(e.target.value); setPage(1); }}
                className="h-9 w-28"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Max Amount
              </label>
              <Input
                type="number"
                placeholder="No limit"
                value={filterMaxAmount}
                onChange={(e) => { setFilterMaxAmount(e.target.value); setPage(1); }}
                className="h-9 w-28"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Close Date From
              </label>
              <Input
                type="date"
                value={filterCloseDateFrom}
                onChange={(e) => { setFilterCloseDateFrom(e.target.value); setPage(1); }}
                className="h-9 w-36"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Close Date To
              </label>
              <Input
                type="date"
                value={filterCloseDateTo}
                onChange={(e) => { setFilterCloseDateTo(e.target.value); setPage(1); }}
                className="h-9 w-36"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline summary */}
      {selectedPipelineId && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Deals
              </p>
              {summaryLoading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {summary?.totalDeals ?? 0}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Value
              </p>
              {summaryLoading ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.totalValue ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Weighted Value
              </p>
              {summaryLoading ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.weightedValue ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <DealForm
              onSubmit={handleCreateSubmit}
              isLoading={createDeal.isPending}
              initialData={
                selectedPipelineId
                  ? { pipelineId: selectedPipelineId }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {viewMode === "board" ? (
        selectedPipelineId ? (
          <PipelineBoard pipelineId={selectedPipelineId} />
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-md border border-border">
            <p className="text-sm text-muted-foreground">
              No pipeline selected.
            </p>
          </div>
        )
      ) : (
        <>
          {/* Search for list view */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <DealsTable
            deals={deals}
            isLoading={dealsLoading}
            onRowClick={handleRowClick}
          />

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(meta.page - 1) * meta.limit + 1} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
                deals
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
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
