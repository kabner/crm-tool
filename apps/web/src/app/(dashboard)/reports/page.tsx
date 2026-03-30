"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReports,
  useCreateReport,
  type CreateReportInput,
} from "@/hooks/use-reports";
import { apiClient } from "@/lib/api-client";
import {
  BarChart3,
  Plus,
  FileText,
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  Save,
  Table,
} from "lucide-react";

const DATA_SOURCES = [
  { value: "contacts", label: "Contacts" },
  { value: "companies", label: "Companies" },
  { value: "deals", label: "Deals" },
  { value: "tickets", label: "Tickets" },
  { value: "activities", label: "Activities" },
];

const FIELDS_BY_SOURCE: Record<string, { value: string; label: string }[]> = {
  contacts: [
    { value: "firstName", label: "First Name" },
    { value: "lastName", label: "Last Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "jobTitle", label: "Job Title" },
    { value: "lifecycleStage", label: "Lifecycle Stage" },
    { value: "leadStatus", label: "Lead Status" },
    { value: "source", label: "Source" },
    { value: "createdAt", label: "Created At" },
  ],
  companies: [
    { value: "name", label: "Name" },
    { value: "domain", label: "Domain" },
    { value: "industry", label: "Industry" },
    { value: "size", label: "Size" },
    { value: "phone", label: "Phone" },
    { value: "createdAt", label: "Created At" },
  ],
  deals: [
    { value: "name", label: "Deal Name" },
    { value: "amount", label: "Amount" },
    { value: "closeDate", label: "Close Date" },
    { value: "won", label: "Won" },
    { value: "lostReason", label: "Lost Reason" },
    { value: "createdAt", label: "Created At" },
  ],
  tickets: [
    { value: "number", label: "Ticket Number" },
    { value: "subject", label: "Subject" },
    { value: "status", label: "Status" },
    { value: "priority", label: "Priority" },
    { value: "channel", label: "Channel" },
    { value: "satisfaction", label: "Satisfaction" },
    { value: "createdAt", label: "Created At" },
  ],
  activities: [
    { value: "type", label: "Type" },
    { value: "subject", label: "Subject" },
    { value: "dueDate", label: "Due Date" },
    { value: "completedAt", label: "Completed At" },
    { value: "createdAt", label: "Created At" },
  ],
};

const FILTER_OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "starts_with", label: "starts with" },
  { value: "gt", label: "greater than" },
  { value: "lt", label: "less than" },
  { value: "is_null", label: "is empty" },
  { value: "is_not_null", label: "is not empty" },
];

const VISUALIZATION_TYPES = [
  { value: "table", label: "Table", icon: Table },
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: BarChart3 },
  { value: "pie", label: "Pie Chart", icon: BarChart3 },
];

interface PreviewResults {
  columns: string[];
  rows: any[];
  total: number;
}

export default function ReportsPage() {
  const { data: reports, isLoading } = useReports();
  const createReport = useCreateReport();
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderStep, setBuilderStep] = useState(1);

  // Builder state
  const [reportName, setReportName] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<
    { field: string; operator: string; value: string }[]
  >([]);
  const [visualization, setVisualization] = useState("table");
  const [previewResults, setPreviewResults] = useState<PreviewResults | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);

  function resetBuilder() {
    setShowBuilder(false);
    setBuilderStep(1);
    setReportName("");
    setDataSource("");
    setSelectedFields([]);
    setFilters([]);
    setVisualization("table");
    setPreviewResults(null);
  }

  function toggleField(field: string) {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  }

  function addFilter() {
    const availableFields = FIELDS_BY_SOURCE[dataSource] || [];
    if (availableFields.length === 0) return;
    setFilters((prev) => [
      ...prev,
      { field: availableFields[0]!.value, operator: "eq", value: "" },
    ]);
  }

  function removeFilter(index: number) {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFilter(
    index: number,
    key: "field" | "operator" | "value",
    val: string,
  ) {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [key]: val } : f)),
    );
  }

  async function runPreview() {
    if (!dataSource || selectedFields.length === 0) return;
    setPreviewLoading(true);
    try {
      const body: CreateReportInput = {
        name: reportName || "Preview",
        dataSource,
        fields: selectedFields,
        filters: filters.filter((f) => f.value || f.operator === "is_null" || f.operator === "is_not_null"),
        visualization: { type: visualization },
      };
      const results = await apiClient.post<PreviewResults>(
        "/api/v1/data/reports/preview",
        body,
      );
      setPreviewResults(results);
    } catch {
      // handle error silently
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveReport() {
    if (!reportName || !dataSource || selectedFields.length === 0) return;
    const body: CreateReportInput = {
      name: reportName,
      dataSource,
      fields: selectedFields,
      filters: filters.filter((f) => f.value || f.operator === "is_null" || f.operator === "is_not_null"),
      visualization: { type: visualization },
    };
    await createReport.mutateAsync(body);
    resetBuilder();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Create and manage custom reports across your CRM data.
          </p>
        </div>
        {!showBuilder && (
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        )}
      </div>

      {/* Report Builder */}
      {showBuilder && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {builderStep === 1 && "Step 1: Select Data Source"}
              {builderStep === 2 && "Step 2: Select Fields"}
              {builderStep === 3 && "Step 3: Add Filters"}
              {builderStep === 4 && "Step 4: Visualization & Run"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetBuilder}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Data Source */}
            {builderStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Report Name</Label>
                  <Input
                    placeholder="e.g. Monthly Lead Report"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Data Source</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {DATA_SOURCES.map((ds) => (
                      <button
                        key={ds.value}
                        onClick={() => {
                          setDataSource(ds.value);
                          setSelectedFields([]);
                          setFilters([]);
                        }}
                        className={`rounded-lg border p-3 text-left text-sm font-medium transition-colors ${
                          dataSource === ds.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {ds.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setBuilderStep(2)}
                    disabled={!dataSource || !reportName}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Fields */}
            {builderStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the fields to include in your report.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(FIELDS_BY_SOURCE[dataSource] || []).map((field) => (
                    <label
                      key={field.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                        selectedFields.includes(field.value)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.value)}
                        onChange={() => toggleField(field.value)}
                        className="h-4 w-4 rounded border-border"
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setBuilderStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setBuilderStep(3)}
                    disabled={selectedFields.length === 0}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Filters */}
            {builderStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add filters to narrow down your results (optional).
                </p>
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) =>
                        updateFilter(index, "field", e.target.value)
                      }
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {(FIELDS_BY_SOURCE[dataSource] || []).map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) =>
                        updateFilter(index, "operator", e.target.value)
                      }
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {FILTER_OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    {filter.operator !== "is_null" &&
                      filter.operator !== "is_not_null" && (
                        <Input
                          value={filter.value}
                          onChange={(e) =>
                            updateFilter(index, "value", e.target.value)
                          }
                          placeholder="Value"
                          className="h-9"
                        />
                      )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFilter}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Filter
                </Button>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setBuilderStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setBuilderStep(4)}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Visualization + Run */}
            {builderStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>Visualization Type</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    {VISUALIZATION_TYPES.map((viz) => (
                      <button
                        key={viz.value}
                        onClick={() => setVisualization(viz.value)}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                          visualization === viz.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <viz.icon className="h-4 w-4" />
                        {viz.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={runPreview}
                    disabled={previewLoading}
                    variant="outline"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {previewLoading ? "Running..." : "Preview"}
                  </Button>
                  <Button
                    onClick={saveReport}
                    disabled={createReport.isPending || !reportName}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createReport.isPending ? "Saving..." : "Save Report"}
                  </Button>
                </div>

                {/* Preview Results */}
                {previewResults && (
                  <div className="mt-4 overflow-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {previewResults.columns.map((col) => (
                            <th
                              key={col}
                              className="px-4 py-2 text-left font-medium text-muted-foreground"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewResults.rows.slice(0, 20).map((row, i) => (
                          <tr key={i} className="border-b last:border-0">
                            {previewResults.columns.map((col) => (
                              <td key={col} className="px-4 py-2">
                                {row[col] != null ? String(row[col]) : "--"}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {previewResults.rows.length === 0 && (
                          <tr>
                            <td
                              colSpan={previewResults.columns.length}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              No results found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {previewResults.total > 20 && (
                      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                        Showing 20 of {previewResults.total} results
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setBuilderStep(3)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Data Source
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Fields
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/reports/${report.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {report.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {report.dataSource}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {report.fields.length} fields
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/reports/${report.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No reports yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first report to start analyzing your CRM data.
              </p>
              {!showBuilder && (
                <Button
                  className="mt-4"
                  onClick={() => setShowBuilder(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
