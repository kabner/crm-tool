"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSequences, useCreateSequence } from "@/hooks/use-sequences";

export default function SequencesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const { data, isLoading } = useSequences({ page, limit: 20 });
  const createSequence = useCreateSequence();

  const sequences = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const seq = await createSequence.mutateAsync({ name: newName.trim() });
    setNewName("");
    setShowCreate(false);
    router.push(`/sequences/${seq.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "paused":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            Paused
          </Badge>
        );
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sequences</h1>
          <p className="text-muted-foreground">
            Automate outreach with multi-step sales sequences.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Sequence"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New Sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Sequence name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                className="max-w-md"
              />
              <Button
                onClick={handleCreate}
                disabled={createSequence.isPending || !newName.trim()}
              >
                {createSequence.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sequences table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Steps
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Enrolled
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Loading sequences...
                    </td>
                  </tr>
                )}
                {!isLoading && sequences.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No sequences yet. Create your first sequence to get
                      started.
                    </td>
                  </tr>
                )}
                {sequences.map((seq) => (
                  <tr
                    key={seq.id}
                    onClick={() => router.push(`/sequences/${seq.id}`)}
                    className="border-b border-border cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {seq.name}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(seq.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {seq.stepsCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {seq.enrolledCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(seq.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            sequences
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
