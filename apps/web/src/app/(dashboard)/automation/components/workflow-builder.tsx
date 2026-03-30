"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { WorkflowNode, WorkflowEdge } from "@/hooks/use-workflows";
import {
  Play,
  Mail,
  Edit,
  Clock,
  GitBranch,
  Target,
  Plus,
  Trash2,
  ArrowDown,
} from "lucide-react";

interface WorkflowBuilderProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggerConfig: {
    type: string;
    conditions: Record<string, any>;
  };
  selectedNodeId: string | null;
  onSelectNode: (node: WorkflowNode | null) => void;
  onSave: (
    nodes: WorkflowNode[],
    edges: { fromNodeId: string; toNodeId: string; conditionBranch?: string }[],
  ) => void;
  isReadOnly?: boolean;
}

const nodeTypeConfig: Record<
  string,
  { label: string; icon: typeof Play; color: string }
> = {
  trigger: {
    label: "Trigger",
    icon: Play,
    color: "border-green-500 bg-green-50 dark:bg-green-950",
  },
  send_email: {
    label: "Send Email",
    icon: Mail,
    color: "border-blue-500 bg-blue-50 dark:bg-blue-950",
  },
  set_property: {
    label: "Set Property",
    icon: Edit,
    color: "border-orange-500 bg-orange-50 dark:bg-orange-950",
  },
  wait: {
    label: "Wait",
    icon: Clock,
    color: "border-purple-500 bg-purple-50 dark:bg-purple-950",
  },
  if_then: {
    label: "If/Then Branch",
    icon: GitBranch,
    color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  },
  goal: {
    label: "Goal",
    icon: Target,
    color: "border-pink-500 bg-pink-50 dark:bg-pink-950",
  },
};

const triggerLabels: Record<string, string> = {
  form_submission: "Form Submission",
  list_membership: "List Membership",
  property_change: "Property Change",
  manual: "Manual Enrollment",
};

function getNodeSummary(node: WorkflowNode): string {
  const config = node.config;
  switch (node.type) {
    case "trigger":
      return triggerLabels[config.type] ?? config.type ?? "Trigger";
    case "send_email":
      return config.emailName ?? config.emailId ?? "Select an email";
    case "set_property":
      return config.field
        ? `Set ${config.field} = ${config.value ?? "..."}`
        : "Configure property";
    case "wait":
      return config.delay
        ? `Wait ${config.delay} ${config.unit ?? "hours"}`
        : "Set delay";
    case "if_then":
      return config.field
        ? `If ${config.field} ${config.operator ?? "="} ${config.value ?? "..."}`
        : "Set condition";
    case "goal":
      return config.description ?? "Define goal";
    default:
      return node.type;
  }
}

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function WorkflowBuilder({
  nodes,
  edges,
  triggerConfig,
  selectedNodeId,
  onSelectNode,
  onSave,
  isReadOnly = false,
}: WorkflowBuilderProps) {
  const [localNodes, setLocalNodes] = useState<WorkflowNode[]>(() => {
    if (nodes.length > 0) return nodes;
    // Create a default trigger node
    return [
      {
        id: generateTempId(),
        type: "trigger",
        config: { type: triggerConfig.type, ...triggerConfig.conditions },
        positionX: 0,
        positionY: 0,
      },
    ];
  });

  const [localEdges, setLocalEdges] = useState<
    { fromNodeId: string; toNodeId: string; conditionBranch?: string }[]
  >(() =>
    edges.map((e) => ({
      fromNodeId: e.fromNodeId,
      toNodeId: e.toNodeId,
      conditionBranch: e.conditionBranch ?? undefined,
    })),
  );

  const [hasChanges, setHasChanges] = useState(false);

  // Build the ordered chain from edges
  const getOrderedNodes = useCallback((): WorkflowNode[] => {
    if (localNodes.length <= 1) return localNodes;

    const triggerNode = localNodes.find((n) => n.type === "trigger");
    if (!triggerNode) return localNodes;

    const edgeMap = new Map<string, string>();
    for (const edge of localEdges) {
      edgeMap.set(edge.fromNodeId, edge.toNodeId);
    }

    const ordered: WorkflowNode[] = [triggerNode];
    let currentId = triggerNode.id;
    const visited = new Set<string>([currentId]);

    while (edgeMap.has(currentId)) {
      const nextId = edgeMap.get(currentId)!;
      if (visited.has(nextId)) break;
      visited.add(nextId);
      const nextNode = localNodes.find((n) => n.id === nextId);
      if (nextNode) ordered.push(nextNode);
      currentId = nextId;
    }

    // Add any remaining nodes not in the chain
    for (const node of localNodes) {
      if (!visited.has(node.id)) {
        ordered.push(node);
      }
    }

    return ordered;
  }, [localNodes, localEdges]);

  const orderedNodes = getOrderedNodes();

  const addNodeAfter = (afterIndex: number, type: string) => {
    const newNode: WorkflowNode = {
      id: generateTempId(),
      type,
      config: type === "trigger" ? { type: triggerConfig.type } : {},
      positionX: 0,
      positionY: (afterIndex + 1) * 120,
    };

    const updated = [...localNodes, newNode];

    // Update edges: insert new node into the chain
    const afterNode = orderedNodes[afterIndex]!;
    const newEdges = [...localEdges];

    // Find existing edge from afterNode
    const existingEdgeIndex = newEdges.findIndex(
      (e) => e.fromNodeId === afterNode.id,
    );

    if (existingEdgeIndex >= 0) {
      // Splice: afterNode -> newNode -> oldNext
      const oldNext = newEdges[existingEdgeIndex]!.toNodeId;
      newEdges[existingEdgeIndex] = {
        fromNodeId: afterNode.id,
        toNodeId: newNode.id,
      };
      newEdges.push({ fromNodeId: newNode.id, toNodeId: oldNext });
    } else {
      // Append: afterNode -> newNode
      newEdges.push({ fromNodeId: afterNode.id, toNodeId: newNode.id });
    }

    // Recalculate positionY
    const reordered = updated.map((n, _i) => {
      const idx = orderedNodes.findIndex((on) => on.id === n.id);
      return { ...n, positionY: (idx >= 0 ? idx : updated.length) * 120 };
    });

    setLocalNodes(reordered);
    setLocalEdges(newEdges);
    setHasChanges(true);
  };

  const removeNode = (nodeId: string) => {
    const node = localNodes.find((n) => n.id === nodeId);
    if (!node || node.type === "trigger") return;

    // Reconnect edges around the removed node
    const incomingEdge = localEdges.find((e) => e.toNodeId === nodeId);
    const outgoingEdge = localEdges.find((e) => e.fromNodeId === nodeId);

    let newEdges = localEdges.filter(
      (e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId,
    );

    if (incomingEdge && outgoingEdge) {
      newEdges.push({
        fromNodeId: incomingEdge.fromNodeId,
        toNodeId: outgoingEdge.toNodeId,
      });
    }

    setLocalNodes(localNodes.filter((n) => n.id !== nodeId));
    setLocalEdges(newEdges);
    setHasChanges(true);

    if (selectedNodeId === nodeId) {
      onSelectNode(null);
    }
  };

  const handleSave = () => {
    onSave(localNodes, localEdges);
    setHasChanges(false);
  };

  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);

  const nodeTypes = [
    { type: "send_email", label: "Send Email" },
    { type: "set_property", label: "Set Property" },
    { type: "wait", label: "Wait" },
    { type: "if_then", label: "If/Then Branch" },
    { type: "goal", label: "Goal" },
  ];

  return (
    <div className="relative min-h-[400px]">
      {/* Save button */}
      {hasChanges && !isReadOnly && (
        <div className="mb-4 flex justify-end">
          <Button onClick={handleSave} size="sm">
            Save Changes
          </Button>
        </div>
      )}

      {/* Vertical flow */}
      <div className="flex flex-col items-center gap-0">
        {orderedNodes.map((node, index) => {
          const typeConfig = nodeTypeConfig[node.type] ?? {
            label: node.type,
            icon: Play,
            color: "border-gray-500 bg-gray-50 dark:bg-gray-950",
          };
          const Icon = typeConfig.icon;
          const isSelected = selectedNodeId === node.id;

          return (
            <div key={node.id} className="flex flex-col items-center">
              {/* Edge arrow (except before first node) */}
              {index > 0 && (
                <div className="flex h-8 items-center justify-center">
                  <ArrowDown className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              {/* Node card */}
              <div
                className={`relative flex w-72 cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${typeConfig.color} ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:shadow-md"
                }`}
                onClick={() => onSelectNode(isSelected ? null : node)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-black/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{typeConfig.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getNodeSummary(node)}
                  </p>
                </div>
                {!isReadOnly && node.type !== "trigger" && (
                  <button
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNode(node.id);
                    }}
                    title="Remove node"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Add node button after each node (except in readonly) */}
              {!isReadOnly && (
                <div className="relative flex flex-col items-center">
                  <div className="flex h-8 items-center justify-center">
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      onClick={() =>
                        setShowAddMenu(
                          showAddMenu === index ? null : index,
                        )
                      }
                      title="Add step"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {showAddMenu === index && (
                    <div className="absolute top-10 z-10 w-48 rounded-md border bg-popover p-1 shadow-md">
                      {nodeTypes.map((nt) => (
                        <button
                          key={nt.type}
                          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            addNodeAfter(index, nt.type);
                            setShowAddMenu(null);
                          }}
                        >
                          {(() => {
                            const Ic =
                              nodeTypeConfig[nt.type]?.icon ?? Play;
                            return <Ic className="h-4 w-4" />;
                          })()}
                          {nt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {localNodes.length === 0 && (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          No nodes in this workflow. Add a trigger to get started.
        </div>
      )}
    </div>
  );
}
