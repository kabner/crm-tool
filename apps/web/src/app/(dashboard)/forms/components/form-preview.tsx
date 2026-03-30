"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormField } from "@/hooks/use-forms";

interface FormPreviewProps {
  fields: FormField[];
  onSubmit?: (data: Record<string, any>) => void;
}

export function FormPreview({ fields, onSubmit }: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const renderField = (field: FormField) => {
    if (field.type === "hidden") {
      return (
        <input
          key={field.name}
          type="hidden"
          name={field.name}
          value={field.defaultValue || ""}
        />
      );
    }

    return (
      <div key={field.name} className="space-y-1.5">
        <Label htmlFor={`preview-${field.name}`}>
          {field.label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </Label>

        {field.type === "textarea" ? (
          <textarea
            id={`preview-${field.name}`}
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            defaultValue={field.defaultValue}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        ) : field.type === "dropdown" ? (
          <select
            id={`preview-${field.name}`}
            name={field.name}
            required={field.required}
            defaultValue={field.defaultValue || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">
              {field.placeholder || "Select an option..."}
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : field.type === "checkbox" ? (
          <div className="flex items-center gap-2">
            <input
              id={`preview-${field.name}`}
              type="checkbox"
              name={field.name}
              defaultChecked={field.defaultValue === "true"}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm text-muted-foreground">
              {field.placeholder || field.label}
            </span>
          </div>
        ) : field.type === "radio" ? (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.name}
                  value={opt}
                  defaultChecked={field.defaultValue === opt}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="h-4 w-4 border-input"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        ) : (
          <Input
            id={`preview-${field.name}`}
            type={
              field.type === "email"
                ? "email"
                : field.type === "phone"
                  ? "tel"
                  : field.type === "date"
                    ? "date"
                    : "text"
            }
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            defaultValue={field.defaultValue}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        )}
      </div>
    );
  };

  if (fields.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          Add fields to see a preview
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(renderField)}
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </form>
  );
}
