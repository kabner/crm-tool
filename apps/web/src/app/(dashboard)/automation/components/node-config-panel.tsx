"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowNode } from "@/hooks/use-workflows";
import { X } from "lucide-react";

interface NodeConfigPanelProps {
  node: WorkflowNode;
  onSave: (config: Record<string, any>) => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

function TriggerConfig({
  config,
  onChange,
  isReadOnly,
}: {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  isReadOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Trigger Type</Label>
        <select
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={config.type ?? "manual"}
          onChange={(e) => onChange({ ...config, type: e.target.value })}
          disabled={isReadOnly}
        >
          <option value="manual">Manual Enrollment</option>
          <option value="form_submission">Form Submission</option>
          <option value="list_membership">List Membership</option>
          <option value="property_change">Property Change</option>
        </select>
      </div>

      {config.type === "form_submission" && (
        <div>
          <Label>Form Name or ID</Label>
          <Input
            className="mt-1"
            placeholder="e.g. Contact Us form"
            value={config.formId ?? ""}
            onChange={(e) => onChange({ ...config, formId: e.target.value })}
            disabled={isReadOnly}
          />
        </div>
      )}

      {config.type === "list_membership" && (
        <div>
          <Label>List Name or ID</Label>
          <Input
            className="mt-1"
            placeholder="e.g. Newsletter subscribers"
            value={config.listId ?? ""}
            onChange={(e) => onChange({ ...config, listId: e.target.value })}
            disabled={isReadOnly}
          />
        </div>
      )}

      {config.type === "property_change" && (
        <>
          <div>
            <Label>Property Field</Label>
            <Input
              className="mt-1"
              placeholder="e.g. lifecycleStage"
              value={config.field ?? ""}
              onChange={(e) => onChange({ ...config, field: e.target.value })}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label>New Value</Label>
            <Input
              className="mt-1"
              placeholder="e.g. customer"
              value={config.value ?? ""}
              onChange={(e) => onChange({ ...config, value: e.target.value })}
              disabled={isReadOnly}
            />
          </div>
        </>
      )}
    </div>
  );
}

function SendEmailConfig({
  config,
  onChange,
  isReadOnly,
}: {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  isReadOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Email Name</Label>
        <Input
          className="mt-1"
          placeholder="Search or type email name..."
          value={config.emailName ?? ""}
          onChange={(e) => onChange({ ...config, emailName: e.target.value })}
          disabled={isReadOnly}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Enter the name of an existing marketing email to send.
        </p>
      </div>
      {config.emailId && (
        <div>
          <Label>Email ID</Label>
          <Input
            className="mt-1"
            value={config.emailId}
            disabled
          />
        </div>
      )}
    </div>
  );
}

function SetPropertyConfig({
  config,
  onChange,
  isReadOnly,
}: {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  isReadOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Property Field</Label>
        <Input
          className="mt-1"
          placeholder="e.g. lifecycleStage"
          value={config.field ?? ""}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          disabled={isReadOnly}
        />
      </div>
      <div>
        <Label>Value</Label>
        <Input
          className="mt-1"
          placeholder="e.g. customer"
          value={config.value ?? ""}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
          disabled={isReadOnly}
        />
      </div>
    </div>
  );
}

function WaitConfig({
  config,
  onChange,
  isReadOnly,
}: {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  isReadOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Delay Amount</Label>
        <Input
          className="mt-1"
          type="number"
          min={1}
          placeholder="e.g. 3"
          value={config.delay ?? ""}
          onChange={(e) =>
            onChange({ ...config, delay: parseInt(e.target.value) || "" })
          }
          disabled={isReadOnly}
        />
      </div>
      <div>
        <Label>Unit</Label>
        <select
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={config.unit ?? "hours"}
          onChange={(e) => onChange({ ...config, unit: e.target.value })}
          disabled={isReadOnly}
        >
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
      </div>
    </div>
  );
}

function IfThenConfig({
  config,
  onChange,
  isReadOnly,
}: {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  isReadOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Condition Field</Label>
        <Input
          className="mt-1"
          placeholder="e.g. email"
          value={config.field ?? ""}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          disabled={isReadOnly}
        />
      </div>
      <div>
        <Label>Operator</Label>
        <select
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={config.operator ?? "equals"}
          onChange={(e) => onChange({ ...config, operator: e.target.value })}
          disabled={isReadOnly}
        >
          <option value="equals">Equals</option>
          <option value="not_equals">Not Equals</option>
          <option value="contains">Contains</option>
          <option value="not_contains">Not Contains</option>
          <option value="is_set">Is Set</option>
          <option value="is_not_set">Is Not Set</option>
          <option value="greater_than">Greater Than</option>
          <option value="less_than">Less Than</option>
        </select>
      </div>
      {!["is_set", "is_not_set"].includes(config.operator ?? "") && (
        <div>
          <Label>Value</Label>
          <Input
            className="mt-1"
            placeholder="e.g. example.com"
            value={config.value ?? ""}
            onChange={(e) => onChange({ ...config, value: e.target.value })}
            disabled={isReadOnly}
          />
        </div>
      )}
    </div>
  );
}

function GoalConfig({
  config,
  onChange,
  isReadOnly,
}: {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  isReadOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Goal Description</Label>
        <Input
          className="mt-1"
          placeholder="e.g. Contact becomes a customer"
          value={config.description ?? ""}
          onChange={(e) =>
            onChange({ ...config, description: e.target.value })
          }
          disabled={isReadOnly}
        />
      </div>
      <div>
        <Label>Goal Condition Field</Label>
        <Input
          className="mt-1"
          placeholder="e.g. lifecycleStage"
          value={config.field ?? ""}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          disabled={isReadOnly}
        />
      </div>
      <div>
        <Label>Goal Value</Label>
        <Input
          className="mt-1"
          placeholder="e.g. customer"
          value={config.value ?? ""}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
          disabled={isReadOnly}
        />
      </div>
    </div>
  );
}

const nodeTypeLabels: Record<string, string> = {
  trigger: "Trigger Configuration",
  send_email: "Send Email Configuration",
  set_property: "Set Property Configuration",
  wait: "Wait Configuration",
  if_then: "If/Then Branch Configuration",
  goal: "Goal Configuration",
};

export function NodeConfigPanel({
  node,
  onSave,
  onClose,
  isReadOnly = false,
}: NodeConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, any>>(node.config);

  useEffect(() => {
    setConfig(node.config);
  }, [node.id, node.config]);

  const handleSave = () => {
    onSave(config);
  };

  const renderConfigForm = () => {
    switch (node.type) {
      case "trigger":
        return (
          <TriggerConfig
            config={config}
            onChange={setConfig}
            isReadOnly={isReadOnly}
          />
        );
      case "send_email":
        return (
          <SendEmailConfig
            config={config}
            onChange={setConfig}
            isReadOnly={isReadOnly}
          />
        );
      case "set_property":
        return (
          <SetPropertyConfig
            config={config}
            onChange={setConfig}
            isReadOnly={isReadOnly}
          />
        );
      case "wait":
        return (
          <WaitConfig
            config={config}
            onChange={setConfig}
            isReadOnly={isReadOnly}
          />
        );
      case "if_then":
        return (
          <IfThenConfig
            config={config}
            onChange={setConfig}
            isReadOnly={isReadOnly}
          />
        );
      case "goal":
        return (
          <GoalConfig
            config={config}
            onChange={setConfig}
            isReadOnly={isReadOnly}
          />
        );
      default:
        return (
          <p className="text-sm text-muted-foreground">
            No configuration available for this node type.
          </p>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">
          {nodeTypeLabels[node.type] ?? "Node Configuration"}
        </CardTitle>
        <button
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderConfigForm()}

        {!isReadOnly && (
          <Button className="w-full" onClick={handleSave}>
            Save Configuration
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
