"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLeadScoreModels,
  useLeadScoreModel,
  useCreateScoreModel,
  useUpdateScoreModel,
  useDeleteScoreModel,
  useCalculateScore,
  type LeadScoreRuleInput,
  type CalculateScoreResult,
} from "@/hooks/use-lead-scoring";
import { useContacts } from "@/hooks/use-contacts";

const RULE_TYPES = [
  { value: "demographic", label: "Demographic" },
  { value: "behavioral", label: "Behavioral" },
];

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "in", label: "In List" },
  { value: "is_set", label: "Is Set" },
  { value: "is_empty", label: "Is Empty" },
];

function RuleRow({
  rule,
  onChange,
  onRemove,
}: {
  rule: LeadScoreRuleInput;
  onChange: (rule: LeadScoreRuleInput) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <select
        value={rule.type}
        onChange={(e) =>
          onChange({ ...rule, type: e.target.value as "demographic" | "behavioral" })
        }
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        {RULE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <Input
        value={rule.attribute}
        onChange={(e) => onChange({ ...rule, attribute: e.target.value })}
        placeholder="Attribute"
        className="h-9 w-32"
      />
      <select
        value={rule.condition.operator || "equals"}
        onChange={(e) =>
          onChange({
            ...rule,
            condition: { ...rule.condition, operator: e.target.value },
          })
        }
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        {OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <Input
        value={rule.condition.operand ?? ""}
        onChange={(e) =>
          onChange({
            ...rule,
            condition: { ...rule.condition, operand: e.target.value },
          })
        }
        placeholder="Value"
        className="h-9 w-28"
      />
      <Input
        type="number"
        value={rule.points}
        onChange={(e) => onChange({ ...rule, points: Number(e.target.value) })}
        placeholder="Points"
        className="h-9 w-20"
      />
      {rule.type === "behavioral" && (
        <Input
          type="number"
          step="0.1"
          value={rule.decayPerDay ?? 0}
          onChange={(e) =>
            onChange({ ...rule, decayPerDay: Number(e.target.value) })
          }
          placeholder="Decay/day"
          className="h-9 w-24"
        />
      )}
      <Button variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function ModelCard({ modelId }: { modelId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: model, isLoading } = useLeadScoreModel(
    expanded ? modelId : "",
  );
  const updateModel = useUpdateScoreModel();
  const deleteModel = useDeleteScoreModel();
  const models = useLeadScoreModels();

  const [editingRules, setEditingRules] = useState(false);
  const [rules, setRules] = useState<LeadScoreRuleInput[]>([]);
  const [mqlThreshold, setMqlThreshold] = useState(50);
  const [sqlThreshold, setSqlThreshold] = useState(80);

  const summary = models.data?.find((m) => m.id === modelId);

  const startEditRules = () => {
    if (model?.rules) {
      setRules(
        model.rules.map((r) => ({
          type: r.type as "demographic" | "behavioral",
          attribute: r.attribute,
          condition: r.condition,
          points: r.points,
          decayPerDay: r.decayPerDay,
        })),
      );
      setMqlThreshold(model.mqlThreshold);
      setSqlThreshold(model.sqlThreshold);
    }
    setEditingRules(true);
  };

  const saveRules = async () => {
    await updateModel.mutateAsync({
      id: modelId,
      data: { rules, mqlThreshold, sqlThreshold },
    });
    setEditingRules(false);
  };

  const addRule = () => {
    setRules([
      ...rules,
      {
        type: "demographic",
        attribute: "",
        condition: { operator: "equals", operand: "" },
        points: 10,
      },
    ]);
  };

  const handleDelete = async () => {
    await deleteModel.mutateAsync(modelId);
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <CardTitle className="text-base">{summary?.name}</CardTitle>
            {summary?.isDefault && (
              <Badge variant="secondary">Default</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{summary?.ruleCount ?? 0} rules</span>
            <span>MQL: {summary?.mqlThreshold}</span>
            <span>SQL: {summary?.sqlThreshold}</span>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : editingRules ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>MQL Threshold</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={mqlThreshold}
                      onChange={(e) => setMqlThreshold(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-10 text-right text-sm font-medium">
                      {mqlThreshold}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>SQL Threshold</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sqlThreshold}
                      onChange={(e) => setSqlThreshold(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-10 text-right text-sm font-medium">
                      {sqlThreshold}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Rules</Label>
                  <Button variant="outline" size="sm" onClick={addRule}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Rule
                  </Button>
                </div>
                {rules.map((rule, i) => (
                  <RuleRow
                    key={i}
                    rule={rule}
                    onChange={(updated) => {
                      const next = [...rules];
                      next[i] = updated;
                      setRules(next);
                    }}
                    onRemove={() => setRules(rules.filter((_, j) => j !== i))}
                  />
                ))}
                {rules.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No rules yet. Add a rule to start scoring contacts.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRules(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveRules}
                  disabled={updateModel.isPending}
                >
                  {updateModel.isPending ? "Saving..." : "Save Rules"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {model?.rules && model.rules.length > 0 ? (
                <div className="space-y-2">
                  {model.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 rounded-md border p-3 text-sm"
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          rule.type === "demographic"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {rule.type}
                      </span>
                      <span className="font-medium">{rule.attribute}</span>
                      <span className="text-muted-foreground">
                        {rule.condition.operator} &quot;{rule.condition.operand}&quot;
                      </span>
                      <Badge variant="secondary">
                        {rule.points > 0 ? "+" : ""}
                        {rule.points} pts
                      </Badge>
                      {rule.decayPerDay > 0 && (
                        <span className="text-xs text-muted-foreground">
                          (-{rule.decayPerDay}/day)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No rules configured for this model.
                </p>
              )}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditRules}
                >
                  Edit Rules & Thresholds
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Model
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function TestScore() {
  const [contactId, setContactId] = useState("");
  const [modelId, setModelId] = useState("");
  const [result, setResult] = useState<CalculateScoreResult | null>(null);
  const calculateScore = useCalculateScore();
  const { data: contactsData } = useContacts({ limit: 50 });
  const { data: models } = useLeadScoreModels();
  const contacts = contactsData?.data ?? [];

  const handleTest = async () => {
    if (!contactId) return;
    const res = await calculateScore.mutateAsync({
      contactId,
      modelId: modelId || undefined,
    });
    setResult(res);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4" />
          Test Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Contact</Label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}{" "}
                  {c.email ? `(${c.email})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Model (optional)</Label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Default model</option>
              {models?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleTest}
              disabled={!contactId || calculateScore.isPending}
            >
              {calculateScore.isPending ? "Calculating..." : "Calculate"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-3 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold">{result.score}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  points
                </span>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  result.qualificationLevel === "sql"
                    ? "bg-emerald-100 text-emerald-800"
                    : result.qualificationLevel === "mql"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {result.qualificationLevel === "sql"
                  ? "Sales Qualified"
                  : result.qualificationLevel === "mql"
                    ? "Marketing Qualified"
                    : "Not Qualified"}
              </span>
            </div>
            {result.breakdown.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Score Breakdown
                </p>
                {result.breakdown.map((entry) => (
                  <div
                    key={entry.ruleId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          entry.matched ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      />
                      <span>{entry.attribute}</span>
                      <span className="text-xs text-muted-foreground">
                        ({entry.type})
                      </span>
                    </div>
                    <span
                      className={
                        entry.matched ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {entry.matched
                        ? `+${entry.finalPoints}`
                        : `0 / ${entry.basePoints}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LeadScoringPage() {
  const { data: models, isLoading } = useLeadScoreModels();
  const createModel = useCreateScoreModel();
  const [showCreate, setShowCreate] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelDefault, setNewModelDefault] = useState(false);

  const handleCreate = async () => {
    if (!newModelName) return;
    await createModel.mutateAsync({
      name: newModelName,
      isDefault: newModelDefault,
    });
    setNewModelName("");
    setNewModelDefault(false);
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Scoring</h1>
          <p className="text-muted-foreground">
            Configure scoring models to qualify leads automatically.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "New Model"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create Score Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="e.g., Default Scoring Model"
                />
              </div>
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={newModelDefault}
                  onChange={(e) => setNewModelDefault(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Set as default</span>
              </label>
              <Button
                onClick={handleCreate}
                disabled={!newModelName || createModel.isPending}
              >
                {createModel.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : models && models.length > 0 ? (
        <div className="space-y-4">
          {models.map((model) => (
            <ModelCard key={model.id} modelId={model.id} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No scoring models yet. Create your first model to start scoring
            leads.
          </CardContent>
        </Card>
      )}

      <TestScore />
    </div>
  );
}
