"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SequenceStepInput } from "@/hooks/use-sequences";

interface SequenceStepEditorProps {
  step: SequenceStepInput | null;
  onSave: (step: SequenceStepInput) => void;
  onCancel: () => void;
  position: number;
}

const stepTypes = [
  { value: "email", label: "Email" },
  { value: "manual_email", label: "Manual Email" },
  { value: "task", label: "Task" },
  { value: "delay", label: "Delay" },
] as const;

export function SequenceStepEditor({
  step,
  onSave,
  onCancel,
  position,
}: SequenceStepEditorProps) {
  const [type, setType] = useState<SequenceStepInput["type"]>(
    step?.type ?? "email",
  );
  const [delayDays, setDelayDays] = useState(step?.delayDays ?? 0);
  const [delayHours, setDelayHours] = useState(step?.delayHours ?? 0);
  const [config, setConfig] = useState<Record<string, any>>(
    step?.config ?? {},
  );

  useEffect(() => {
    if (step) {
      setType(step.type);
      setDelayDays(step.delayDays ?? 0);
      setDelayHours(step.delayHours ?? 0);
      setConfig(step.config);
    }
  }, [step]);

  const handleSave = () => {
    onSave({
      position,
      type,
      delayDays: type === "delay" ? delayDays : 0,
      delayHours: type === "delay" ? delayHours : 0,
      config,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {step ? "Edit Step" : "Add Step"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type selector */}
        <div className="space-y-2">
          <Label>Step Type</Label>
          <div className="flex flex-wrap gap-2">
            {stepTypes.map((st) => (
              <Button
                key={st.value}
                variant={type === st.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setType(st.value);
                  setConfig({});
                }}
              >
                {st.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Type-specific fields */}
        {(type === "email" || type === "manual_email") && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Email Template Name</Label>
              <Input
                placeholder="e.g. Initial Outreach"
                value={config.templateName ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, templateName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                placeholder="Email subject..."
                value={config.subject ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, subject: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {type === "task" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                placeholder="e.g. Call prospect"
                value={config.title ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Task description..."
                value={config.description ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, description: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {type === "delay" && (
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Days</Label>
              <Input
                type="number"
                min={0}
                value={delayDays}
                onChange={(e) => setDelayDays(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={delayHours}
                onChange={(e) => setDelayHours(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" onClick={handleSave}>
            {step ? "Update Step" : "Add Step"}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
