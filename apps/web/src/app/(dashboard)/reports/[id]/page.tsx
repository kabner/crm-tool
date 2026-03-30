"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  useReport,
  useExecuteReport,
  useUpdateReport,
  useDeleteReport,
} from "@/hooks/use-reports";
import {
  ArrowLeft,
  Play,
  Download,
  Trash2,
  Save,
  RefreshCw,
} from "lucide-react";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: report, isLoading: reportLoading } = useReport(id);
  const { data: results, isLoading: resultsLoading, refetch } = useExecuteReport(id);
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function startEditing() {
    if (!report) return;
    setEditName(report.name);
    setEditDescription(report.description || "");
    setEditing(true);
  }

  async function saveChanges() {
    if (!report) return;
    await updateReport.mutateAsync({
      id: report.id,
      data: { name: editName, description: editDescription || undefined },
    });
    setEditing(false);
  }

  async function handleDelete() {
    if (!report) return;
    if (!confirm("Are you sure you want to delete this report?")) return;
    await deleteReport.mutateAsync(report.id);
    router.push("/reports");
  }

  function exportCSV() {
    if (!results || !results.rows.length) return;

    const header = results.columns.join(",");
    const rows = results.rows.map((row) =>
      results.columns
        .map((col) => {
          const val = row[col];
          if (val == null) return "";
          const str = String(val);
          // Escape CSV values with commas or quotes
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report?.name || "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (reportLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/reports")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Report not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/reports")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Report Header */}
      <Card>
        <CardHeader>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label>Report Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional description"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={updateReport.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateReport.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{report.name}</CardTitle>
                {report.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="capitalize">
                    Source: {report.dataSource}
                  </span>
                  <span>{report.fields.length} fields</span>
                  <span>
                    Created {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startEditing}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCSV}
                  disabled={!results?.rows.length}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteReport.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Report Config */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Fields
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {report.fields.map((field) => (
                <span
                  key={field}
                  className="inline-flex rounded-md bg-muted px-2 py-1 text-xs"
                >
                  {field}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Filters
            </p>
            <div className="mt-2">
              {report.filters && report.filters.length > 0 ? (
                report.filters.map((f: any, i: number) => (
                  <div key={i} className="text-sm">
                    {f.field} {f.operator} {f.value}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No filters</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Visualization
            </p>
            <p className="mt-2 text-sm capitalize">
              {report.visualization?.type || "Table"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : results && results.rows.length > 0 ? (
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {results.columns.map((col) => (
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
                  {results.rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {results.columns.map((col) => (
                        <td key={col} className="px-4 py-2">
                          {row[col] != null ? String(row[col]) : "--"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                {results.total} total results
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              No results. Click Refresh to run the report.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
