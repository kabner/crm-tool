"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Type,
  Mail,
  Phone,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Circle,
  Calendar,
  EyeOff,
  ChevronUp,
  Trash2,
  Plus,
  GripVertical,
} from "lucide-react";
import { FormPreview } from "./form-preview";
import type { FormField } from "@/hooks/use-forms";

const FIELD_TYPES = [
  { type: "text", label: "Text", icon: Type },
  { type: "email", label: "Email", icon: Mail },
  { type: "phone", label: "Phone", icon: Phone },
  { type: "textarea", label: "Text Area", icon: AlignLeft },
  { type: "dropdown", label: "Dropdown", icon: ChevronDown },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "radio", label: "Radio", icon: Circle },
  { type: "date", label: "Date", icon: Calendar },
  { type: "hidden", label: "Hidden", icon: EyeOff },
] as const;

function getFieldIcon(type: string) {
  const found = FIELD_TYPES.find((ft) => ft.type === type);
  return found ? found.icon : Type;
}

interface FormBuilderProps {
  initialFields?: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function FormBuilder({ initialFields, onChange }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const updateFields = (newFields: FormField[]) => {
    setFields(newFields);
    onChange(newFields);
  };

  const addField = (type: FormField["type"]) => {
    const fieldName = `field_${Date.now()}`;
    const newField: FormField = {
      name: fieldName,
      label: `New ${FIELD_TYPES.find((ft) => ft.type === type)?.label || "Field"}`,
      type,
      required: false,
      placeholder: "",
      options: type === "dropdown" || type === "radio" ? ["Option 1", "Option 2"] : undefined,
    };
    const newFields = [...fields, newField];
    updateFields(newFields);
    setEditingIndex(newFields.length - 1);
    setShowTypeSelector(false);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    updateFields(newFields);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex]!, newFields[index]!];
    updateFields(newFields);
    if (editingIndex === index) {
      setEditingIndex(newIndex);
    } else if (editingIndex === newIndex) {
      setEditingIndex(index);
    }
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index]!, ...updates };
    updateFields(newFields);
  };

  const editingField = editingIndex !== null ? fields[editingIndex] : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Field list + editor */}
      <div className="space-y-4">
        <div className="space-y-2">
          {fields.map((field, index) => {
            const Icon = getFieldIcon(field.type);
            return (
              <div
                key={`${field.name}-${index}`}
                onClick={() => setEditingIndex(index)}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                  editingIndex === index
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {field.label}
                    </span>
                    {field.required && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        Required
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{field.type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveField(index, "up");
                    }}
                    disabled={index === 0}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveField(index, "down");
                    }}
                    disabled={index === fields.length - 1}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(index);
                    }}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add field */}
        {showTypeSelector ? (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Select Field Type</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-3 gap-2">
                {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addField(type as FormField["type"])}
                    className="flex flex-col items-center gap-1.5 rounded-md border border-border p-3 text-sm transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTypeSelector(false)}
                className="mt-2 w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTypeSelector(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        )}

        {/* Field editor */}
        {editingField && editingIndex !== null && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Edit Field</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
              <div className="space-y-1.5">
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={editingField.label}
                  onChange={(e) =>
                    updateField(editingIndex, { label: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="field-name">Field Name</Label>
                <Input
                  id="field-name"
                  value={editingField.name}
                  onChange={(e) =>
                    updateField(editingIndex, {
                      name: e.target.value.replace(/\s+/g, "_").toLowerCase(),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={editingField.placeholder || ""}
                  onChange={(e) =>
                    updateField(editingIndex, { placeholder: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="field-required"
                  type="checkbox"
                  checked={editingField.required}
                  onChange={(e) =>
                    updateField(editingIndex, { required: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="field-required">Required</Label>
              </div>
              {(editingField.type === "dropdown" ||
                editingField.type === "radio") && (
                <div className="space-y-1.5">
                  <Label>Options (one per line)</Label>
                  <textarea
                    value={(editingField.options || []).join("\n")}
                    onChange={(e) =>
                      updateField(editingIndex, {
                        options: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="field-default">Default Value</Label>
                <Input
                  id="field-default"
                  value={editingField.defaultValue || ""}
                  onChange={(e) =>
                    updateField(editingIndex, { defaultValue: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Preview */}
      <div>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Form Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <FormPreview fields={fields} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
