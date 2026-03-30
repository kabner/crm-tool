"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntitySearch } from "@/components/entity-search";
import {
  useSequence,
  useUpdateSequence,
  useActivateSequence,
  usePauseSequence,
  useDeleteSequence,
  useEnrollContact,
  useSequenceEnrollments,
  useSequenceStats,
} from "@/hooks/use-sequences";
import type { SequenceStepInput } from "@/hooks/use-sequences";
import { SequenceStepEditor } from "../components/sequence-step-editor";

const stepTypeIcons: Record<string, string> = {
  email: "M",
  manual_email: "ME",
  task: "T",
  delay: "D",
};

const stepTypeLabels: Record<string, string> = {
  email: "Email",
  manual_email: "Manual Email",
  task: "Task",
  delay: "Delay",
};

export default function SequenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: sequence, isLoading } = useSequence(id);
  const { data: stats } = useSequenceStats(id);
  const { data: enrollmentsData } = useSequenceEnrollments(id);
  const updateSequence = useUpdateSequence();
  const activateSequence = useActivateSequence();
  const pauseSequence = usePauseSequence();
  const deleteSequence = useDeleteSequence();
  const enrollContact = useEnrollContact();

  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [addingAtPosition, setAddingAtPosition] = useState<number | null>(null);
  const [enrollContactId, setEnrollContactId] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading sequence...
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Sequence not found.
      </div>
    );
  }

  const steps: SequenceStepInput[] = (sequence.steps ?? []).map((s) => ({
    position: s.position,
    type: s.type,
    delayDays: s.delayDays,
    delayHours: s.delayHours,
    config: s.config,
  }));

  const handleSaveStep = (step: SequenceStepInput, replaceIndex?: number) => {
    let newSteps: SequenceStepInput[];

    if (replaceIndex !== null && replaceIndex !== undefined) {
      // Edit existing step
      newSteps = steps.map((s, i) => (i === replaceIndex ? step : s));
    } else {
      // Insert new step
      newSteps = [...steps, step];
    }

    // Re-number positions
    newSteps = newSteps
      .sort((a, b) => a.position - b.position)
      .map((s, i) => ({ ...s, position: i + 1 }));

    updateSequence.mutate({ id, data: { steps: newSteps } });
    setEditingStepIndex(null);
    setAddingAtPosition(null);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, position: i + 1 }));
    updateSequence.mutate({ id, data: { steps: newSteps } });
  };

  const handleActivate = () => activateSequence.mutate(id);
  const handlePause = () => pauseSequence.mutate(id);
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this sequence?")) {
      deleteSequence.mutate(id, {
        onSuccess: () => router.push("/sequences"),
      });
    }
  };

  const handleEnroll = () => {
    if (!enrollContactId.trim()) return;
    enrollContact.mutate(
      { sequenceId: id, contactId: enrollContactId.trim() },
      { onSuccess: () => setEnrollContactId("") },
    );
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

  const getStepSummary = (step: SequenceStepInput) => {
    switch (step.type) {
      case "email":
        return step.config.templateName ?? "Email step";
      case "manual_email":
        return step.config.templateName ?? "Manual email step";
      case "task":
        return step.config.title ?? "Task step";
      case "delay":
        return `Wait ${step.delayDays ?? 0}d ${step.delayHours ?? 0}h`;
      default:
        return step.type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/sequences")}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {sequence.name}
              </h1>
              {getStatusBadge(sequence.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Created {new Date(sequence.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sequence.status === "draft" && (
            <Button
              onClick={handleActivate}
              disabled={activateSequence.isPending}
            >
              {activateSequence.isPending ? "Activating..." : "Activate"}
            </Button>
          )}
          {sequence.status === "active" && (
            <Button
              variant="outline"
              onClick={handlePause}
              disabled={pauseSequence.isPending}
            >
              {pauseSequence.isPending ? "Pausing..." : "Pause"}
            </Button>
          )}
          {sequence.status === "paused" && (
            <Button
              onClick={handleActivate}
              disabled={activateSequence.isPending}
            >
              {activateSequence.isPending ? "Activating..." : "Resume"}
            </Button>
          )}
          {sequence.status === "draft" && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSequence.isPending}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps timeline (left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Steps</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setAddingAtPosition(steps.length + 1)
                  }
                >
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {steps.length === 0 && addingAtPosition === null && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No steps yet. Add your first step to build the sequence.
                </p>
              )}

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index}>
                    {/* Step card */}
                    <div className="flex items-start gap-3">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {stepTypeIcons[step.type] ?? "?"}
                        </div>
                        {index < steps.length - 1 && (
                          <div className="w-px h-8 bg-border" />
                        )}
                      </div>
                      {/* Step content */}
                      <div className="flex-1 rounded-md border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">
                              {stepTypeLabels[step.type] ?? step.type}
                            </span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {getStepSummary(step)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingStepIndex(index)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleRemoveStep(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Add step button between steps */}
                    {index < steps.length - 1 && (
                      <div className="flex justify-center py-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground"
                          onClick={() => setAddingAtPosition(index + 2)}
                        >
                          + Insert step
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Step editor */}
              {editingStepIndex !== null && (
                <div className="mt-4">
                  <SequenceStepEditor
                    step={steps[editingStepIndex] ?? null}
                    position={steps[editingStepIndex]!.position}
                    onSave={(s) => handleSaveStep(s, editingStepIndex)}
                    onCancel={() => setEditingStepIndex(null)}
                  />
                </div>
              )}

              {addingAtPosition !== null && (
                <div className="mt-4">
                  <SequenceStepEditor
                    step={null}
                    position={addingAtPosition}
                    onSave={(s) => handleSaveStep(s)}
                    onCancel={() => setAddingAtPosition(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel: Stats + Enrollments */}
        <div className="space-y-4">
          {/* Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border p-3 text-center">
                    <p className="text-2xl font-bold">{stats.totalEnrolled}</p>
                    <p className="text-xs text-muted-foreground">
                      Total Enrolled
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3 text-center">
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="rounded-md border border-border p-3 text-center">
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="rounded-md border border-border p-3 text-center">
                    <p className="text-2xl font-bold">{stats.replied}</p>
                    <p className="text-xs text-muted-foreground">Replied</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enroll contact */}
          {sequence.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enroll Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <EntitySearch
                    entityType="contact"
                    value={enrollContactId}
                    onChange={(id) => setEnrollContactId(id)}
                    placeholder="Search contacts..."
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleEnroll}
                    disabled={
                      enrollContact.isPending || !enrollContactId.trim()
                    }
                  >
                    {enrollContact.isPending ? "..." : "Enroll"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enrollments list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Enrollments ({enrollmentsData?.meta.total ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!enrollmentsData || enrollmentsData.data.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No enrollments yet.
                </p>
              )}
              <div className="space-y-2">
                {enrollmentsData?.data.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {enrollment.contactId.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Step {enrollment.currentStep} |{" "}
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        enrollment.status === "active" ? "default" : "secondary"
                      }
                    >
                      {enrollment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
