"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWorkflow,
  usePublishWorkflow,
  usePauseWorkflow,
  useDeleteWorkflow,
  useUpdateWorkflow,
  type WorkflowNode,
} from "@/hooks/use-workflows";
import { WorkflowBuilder } from "../components/workflow-builder";
import { NodeConfigPanel } from "../components/node-config-panel";
import { useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
  Target,
} from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  archived: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: workflow, isLoading } = useWorkflow(id);
  const publishWorkflow = usePublishWorkflow();
  const pauseWorkflow = usePauseWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const updateWorkflow = useUpdateWorkflow();

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const handlePublish = async () => {
    await publishWorkflow.mutateAsync(id);
  };

  const handlePause = async () => {
    await pauseWorkflow.mutateAsync(id);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    await deleteWorkflow.mutateAsync(id);
    router.push("/automation");
  };

  const handleSaveNodes = async (
    nodes: WorkflowNode[],
    edges: { fromNodeId: string; toNodeId: string; conditionBranch?: string }[],
  ) => {
    await updateWorkflow.mutateAsync({
      id,
      data: {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          config: n.config,
          positionX: n.positionX,
          positionY: n.positionY,
        })),
        edges,
      },
    });
  };

  const handleNodeConfigSave = async (
    nodeId: string,
    config: Record<string, any>,
  ) => {
    if (!workflow?.nodes) return;
    const updatedNodes = workflow.nodes.map((n) =>
      n.id === nodeId ? { ...n, config } : n,
    );
    await updateWorkflow.mutateAsync({
      id,
      data: {
        nodes: updatedNodes.map((n) => ({
          id: n.id,
          type: n.type,
          config: n.config,
          positionX: n.positionX,
          positionY: n.positionY,
        })),
        edges: workflow.edges?.map((e) => ({
          id: e.id,
          fromNodeId: e.fromNodeId,
          toNodeId: e.toNodeId,
          conditionBranch: e.conditionBranch ?? undefined,
        })),
      },
    });
    setSelectedNode(
      updatedNodes.find((n) => n.id === nodeId) ?? null,
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Workflow not found.
      </div>
    );
  }

  const stats = workflow.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/automation")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {workflow.name}
              </h1>
              <Badge
                className={statusColors[workflow.status] ?? statusColors.draft}
                variant="secondary"
              >
                {workflow.status}
              </Badge>
            </div>
            {workflow.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {workflow.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workflow.status === "draft" && (
            <>
              <Button
                onClick={handlePublish}
                disabled={publishWorkflow.isPending}
              >
                <Play className="mr-1 h-4 w-4" />
                {publishWorkflow.isPending ? "Publishing..." : "Publish"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteWorkflow.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          {workflow.status === "active" && (
            <Button
              variant="outline"
              onClick={handlePause}
              disabled={pauseWorkflow.isPending}
            >
              <Pause className="mr-1 h-4 w-4" />
              {pauseWorkflow.isPending ? "Pausing..." : "Pause"}
            </Button>
          )}
          {workflow.status === "paused" && (
            <Button
              onClick={handlePublish}
              disabled={publishWorkflow.isPending}
            >
              <Play className="mr-1 h-4 w-4" />
              {publishWorkflow.isPending ? "Resuming..." : "Resume"}
            </Button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex gap-6">
        {/* Workflow canvas */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowBuilder
                nodes={workflow.nodes ?? []}
                edges={workflow.edges ?? []}
                triggerConfig={workflow.triggerConfig}
                selectedNodeId={selectedNode?.id ?? null}
                onSelectNode={(node) => setSelectedNode(node)}
                onSave={handleSaveNodes}
                isReadOnly={workflow.status === "active"}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right panel: node config */}
        {selectedNode && (
          <div className="w-80 shrink-0">
            <NodeConfigPanel
              node={selectedNode}
              onSave={(config) =>
                handleNodeConfigSave(selectedNode.id, config)
              }
              onClose={() => setSelectedNode(null)}
              isReadOnly={workflow.status === "active"}
            />
          </div>
        )}
      </div>

      {/* Enrollment stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalEnrolled}</p>
                <p className="text-xs text-muted-foreground">Total Enrolled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Play className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.goalMet}</p>
                <p className="text-xs text-muted-foreground">Goal Met</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
