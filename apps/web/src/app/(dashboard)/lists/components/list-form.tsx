"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterBuilder } from "./filter-builder";
import type {
  SmartListFilters,
  CreateListInput,
  UpdateListInput,
} from "@/hooks/use-lists";

const listSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["smart", "static"]),
});

type ListFormValues = z.infer<typeof listSchema>;

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ListFormProps {
  initialData?: {
    name?: string;
    type?: "smart" | "static";
    filters?: SmartListFilters | null;
  };
  onSubmit: (data: CreateListInput | UpdateListInput) => void;
  isLoading?: boolean;
}

export function ListForm({ initialData, onSubmit, isLoading }: ListFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ListFormValues>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      type: initialData?.type ?? "static",
    },
  });

  const listType = watch("type");

  const [filters, setFilters] = useState<SmartListFilters>(
    initialData?.filters ?? { operator: "AND", conditions: [] },
  );

  function handleFormSubmit(values: ListFormValues) {
    if (isEditing) {
      const updateData: UpdateListInput = {
        name: values.name,
      };
      if (values.type === "smart") {
        updateData.filters = filters;
      }
      onSubmit(updateData);
    } else {
      const createData: CreateListInput = {
        name: values.name,
        type: values.type,
      };
      if (values.type === "smart") {
        createData.filters = filters;
      }
      onSubmit(createData);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g. Enterprise Customers"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          {...register("type")}
          className={selectClassName}
          disabled={isEditing}
        >
          <option value="static">Static</option>
          <option value="smart">Smart</option>
        </select>
        {isEditing && (
          <p className="text-xs text-muted-foreground">
            List type cannot be changed after creation.
          </p>
        )}
      </div>

      {listType === "smart" && (
        <div className="rounded-md border border-border p-4">
          <FilterBuilder value={filters} onChange={setFilters} />
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : isEditing
              ? "Update List"
              : "Create List"}
        </Button>
      </div>
    </form>
  );
}
