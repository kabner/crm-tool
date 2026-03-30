"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import {
  usePreviewSmartList,
  type SmartListFilters,
  type FilterCondition,
} from "@/hooks/use-lists";

const FIELD_OPTIONS = [
  { value: "lifecycleStage", label: "Lifecycle Stage", type: "string" },
  { value: "leadStatus", label: "Lead Status", type: "string" },
  { value: "email", label: "Email", type: "string" },
  { value: "firstName", label: "First Name", type: "string" },
  { value: "lastName", label: "Last Name", type: "string" },
  { value: "jobTitle", label: "Job Title", type: "string" },
  { value: "tags", label: "Tags", type: "array" },
  { value: "source", label: "Source", type: "string" },
  { value: "createdAt", label: "Created At", type: "date" },
  { value: "updatedAt", label: "Updated At", type: "date" },
  { value: "lastActivityAt", label: "Last Activity At", type: "date" },
  { value: "ownerId", label: "Owner ID", type: "string" },
  { value: "phone", label: "Phone", type: "string" },
];

const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  string: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "starts_with", label: "starts with" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  array: [
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  date: [
    { value: "after", label: "is after" },
    { value: "before", label: "is before" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
};

function getFieldType(fieldValue: string): string {
  const field = FIELD_OPTIONS.find((f) => f.value === fieldValue);
  return field?.type ?? "string";
}

function getOperators(fieldValue: string) {
  const type = getFieldType(fieldValue);
  return OPERATORS_BY_TYPE[type] ?? OPERATORS_BY_TYPE["string"]!;
}

function needsValue(operator: string): boolean {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

const FIELD_VALUE_SUGGESTIONS: Record<string, string[]> = {
  lifecycleStage: ['subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist'],
  leadStatus: ['new', 'attempting_contact', 'connected', 'qualified', 'unqualified'],
  source: ['Google Ads', 'LinkedIn', 'Referral', 'Cold Outreach', 'Trade Show', 'Website', 'Partner', 'Webinar'],
  industry: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Energy', 'Real Estate', 'Media', 'Consulting'],
  size: ['sole_proprietor', '2_10', '11_50', '51_200', '201_500', '501_1000', '1001_5000', '5001_10000', '10001_plus'],
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface FilterBuilderProps {
  value: SmartListFilters;
  onChange: (value: SmartListFilters) => void;
}

export function FilterBuilder({ value, onChange }: FilterBuilderProps) {
  const previewMutation = usePreviewSmartList();

  const conditions = value.conditions ?? [];
  const logicalOperator = value.operator ?? "AND";

  const updateCondition = (
    index: number,
    updates: Partial<FilterCondition>,
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index]!, ...updates };

    // Reset value when operator is is_empty/is_not_empty
    if (
      updates.operator &&
      !needsValue(updates.operator)
    ) {
      delete newConditions[index]!.value;
    }

    // Reset operator and value when field changes
    if (updates.field) {
      const operators = getOperators(updates.field);
      newConditions[index]!.operator = operators?.[0]?.value ?? "equals";
      newConditions[index]!.value = "";
    }

    onChange({ ...value, conditions: newConditions });
  };

  const addCondition = () => {
    const newCondition: FilterCondition = {
      field: "lifecycleStage",
      operator: "equals",
      value: "",
    };
    onChange({ ...value, conditions: [...conditions, newCondition] });
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange({ ...value, conditions: newConditions });
  };

  const toggleOperator = () => {
    onChange({
      ...value,
      operator: logicalOperator === "AND" ? "OR" : "AND",
    });
  };

  const handlePreview = () => {
    previewMutation.mutate(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Filter Conditions</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Match</span>
          <button
            type="button"
            onClick={toggleOperator}
            className="rounded-md border border-input px-3 py-1 text-sm font-medium hover:bg-muted"
          >
            {logicalOperator}
          </button>
          <span className="text-sm text-muted-foreground">of the following</span>
        </div>
      </div>

      {conditions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No conditions added yet. Add a condition to define your smart list
          criteria.
        </p>
      )}

      <div className="space-y-3">
        {conditions.map((condition, index) => {
          const operators = getOperators(condition.field);
          const showValue = needsValue(condition.operator);

          return (
            <div key={index} className="flex items-start gap-2">
              {/* Field selector */}
              <select
                value={condition.field}
                onChange={(e) =>
                  updateCondition(index, { field: e.target.value })
                }
                className={selectClassName}
                style={{ minWidth: "160px" }}
              >
                {FIELD_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Operator selector */}
              <select
                value={condition.operator}
                onChange={(e) =>
                  updateCondition(index, { operator: e.target.value })
                }
                className={selectClassName}
                style={{ minWidth: "150px" }}
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              {/* Value input */}
              {showValue && (() => {
                const fieldType = getFieldType(condition.field);
                const suggestions = FIELD_VALUE_SUGGESTIONS[condition.field];

                if (fieldType === "date") {
                  return (
                    <Input
                      value={condition.value ?? ""}
                      onChange={(e) =>
                        updateCondition(index, { value: e.target.value })
                      }
                      placeholder="YYYY-MM-DD"
                      type="date"
                      className="min-w-[160px]"
                    />
                  );
                }

                if (suggestions) {
                  const datalistId = `filter-suggestions-${index}`;
                  return (
                    <>
                      <Input
                        value={condition.value ?? ""}
                        onChange={(e) =>
                          updateCondition(index, { value: e.target.value })
                        }
                        placeholder="Type or select..."
                        list={datalistId}
                        className="min-w-[160px]"
                      />
                      <datalist id={datalistId}>
                        {suggestions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </>
                  );
                }

                return (
                  <Input
                    value={condition.value ?? ""}
                    onChange={(e) =>
                      updateCondition(index, { value: e.target.value })
                    }
                    placeholder="Value..."
                    type="text"
                    className="min-w-[160px]"
                  />
                );
              })()}

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(index)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={addCondition}>
          <Plus className="mr-2 h-4 w-4" />
          Add Condition
        </Button>

        {conditions.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePreview}
            disabled={previewMutation.isPending}
          >
            {previewMutation.isPending
              ? "Counting..."
              : previewMutation.data
                ? `${previewMutation.data.count} contacts match`
                : "Preview Count"}
          </Button>
        )}
      </div>
    </div>
  );
}
