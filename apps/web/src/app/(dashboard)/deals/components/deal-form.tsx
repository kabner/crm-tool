"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePipelines, usePipeline } from "@/hooks/use-deals";
import { usePipelineFields } from "@/hooks/use-pipeline-fields";
import { EntitySearch } from "@/components/entity-search";
import { apiClient } from "@/lib/api-client";
import { CURRENCIES } from "@/lib/currency";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  amount: z.string().optional(),
  currency: z.string().optional(),
  pipelineId: z.string().min(1, "Pipeline is required"),
  stageId: z.string().min(1, "Stage is required"),
  closeDate: z.string().optional(),
  companyName: z.string().optional(),
  ownerId: z.string().optional(),
  visibility: z.enum(['everyone', 'owner', 'private']).optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  initialData?: {
    name?: string;
    amount?: number | null;
    currency?: string;
    pipelineId?: string;
    stageId?: string;
    closeDate?: string | null;
    companyName?: string;
    companyId?: string;
    ownerId?: string | null;
    visibility?: string;
    customProps?: Record<string, unknown>;
  };
  onSubmit: (data: {
    name: string;
    amount?: number;
    currency?: string;
    pipelineId: string;
    stageId: string;
    closeDate?: string;
    companyName?: string;
    ownerId?: string;
    visibility?: string;
    customProps?: Record<string, unknown>;
  }) => void;
  isLoading?: boolean;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function DealForm({ initialData, onSubmit, isLoading }: DealFormProps) {
  const { data: pipelines } = usePipelines();
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialData?.companyId ?? "");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>(
    initialData?.customProps ?? {},
  );
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [pendingCompanyName, setPendingCompanyName] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      amount: initialData?.amount != null ? String(initialData.amount) : "",
      currency: initialData?.currency ?? "USD",
      pipelineId: initialData?.pipelineId ?? "",
      stageId: initialData?.stageId ?? "",
      closeDate: initialData?.closeDate
        ? initialData.closeDate.split("T")[0]
        : "",
      companyName: initialData?.companyName ?? "",
      ownerId: initialData?.ownerId ?? "",
      visibility: (initialData?.visibility as 'everyone' | 'owner' | 'private') ?? "everyone",
    },
  });

  const selectedPipelineId = watch("pipelineId");
  const { data: selectedPipeline } = usePipeline(selectedPipelineId);
  const { data: pipelineFields } = usePipelineFields(selectedPipelineId);

  // Reset stage when pipeline changes (but not on initial load)
  useEffect(() => {
    if (selectedPipelineId && selectedPipelineId !== initialData?.pipelineId) {
      setValue("stageId", "");
    }
  }, [selectedPipelineId, initialData?.pipelineId, setValue]);

  // Auto-select pipeline if only one exists and no initial data
  useEffect(() => {
    if (pipelines && pipelines.length === 1 && !initialData?.pipelineId) {
      setValue("pipelineId", pipelines[0]!.id);
    }
  }, [pipelines, initialData?.pipelineId, setValue]);

  const stages = selectedPipeline?.stages ?? [];

  const handleCompanySelect = (id: string, entity?: any) => {
    setSelectedCompanyId(id);
    if (entity) {
      setValue("companyName", entity.label || entity.name || "");
    } else {
      setValue("companyName", "");
    }
  };

  const handleCreateNewCompany = (searchTerm: string) => {
    setPendingCompanyName(searchTerm);
    setShowCreateConfirm(true);
  };

  const confirmCreateCompany = async () => {
    try {
      const newCompany = await apiClient.post<any>("/api/v1/companies", {
        name: pendingCompanyName,
      });
      setSelectedCompanyId(newCompany.id);
      setValue("companyName", newCompany.name);
    } catch {
      // If creation fails, just use the name as-is
      setValue("companyName", pendingCompanyName);
    }
    setShowCreateConfirm(false);
    setPendingCompanyName("");
  };

  function handleFormSubmit(values: DealFormValues) {
    onSubmit({
      name: values.name,
      amount: values.amount ? parseFloat(values.amount) : undefined,
      currency: values.currency || "USD",
      pipelineId: values.pipelineId,
      stageId: values.stageId,
      closeDate: values.closeDate || undefined,
      companyName: values.companyName || undefined,
      ownerId: values.ownerId || undefined,
      visibility: values.visibility || undefined,
      customProps: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
    });
  }

  function setCustomField(key: string, value: unknown) {
    setCustomFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Deal Name *</Label>
          <Input
            id="name"
            placeholder="e.g. Acme Corp Enterprise License"
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              {...register("amount")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              {...register("currency")}
              className={selectClassName}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closeDate">Close Date</Label>
            <Input id="closeDate" type="date" {...register("closeDate")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pipelineId">Pipeline *</Label>
            <select
              id="pipelineId"
              {...register("pipelineId")}
              className={selectClassName}
            >
              <option value="">Select pipeline...</option>
              {pipelines?.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
            {errors.pipelineId && (
              <p className="text-sm text-destructive">
                {errors.pipelineId.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stageId">Stage *</Label>
            <select
              id="stageId"
              {...register("stageId")}
              className={selectClassName}
              disabled={!selectedPipelineId}
            >
              <option value="">
                {selectedPipelineId ? "Select stage..." : "Select a pipeline first"}
              </option>
              {stages
                .sort((a, b) => a.position - b.position)
                .map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}{" "}
                    {stage.probability != null ? `(${stage.probability}%)` : ""}
                  </option>
                ))}
            </select>
            {errors.stageId && (
              <p className="text-sm text-destructive">
                {errors.stageId.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company</Label>
            <EntitySearch
              entityType="company"
              value={selectedCompanyId}
              onChange={handleCompanySelect}
              placeholder="Search companies..."
              allowCreate
              onCreateNew={handleCreateNewCompany}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerId">Owner ID</Label>
            <Input
              id="ownerId"
              placeholder="Owner user ID"
              {...register("ownerId")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            {...register("visibility")}
            className={selectClassName}
          >
            <option value="everyone">Everyone</option>
            <option value="owner">Only Me &amp; Owner</option>
            <option value="private">Private</option>
          </select>
        </div>

        {/* Pipeline-specific custom fields */}
        {pipelineFields && pipelineFields.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold">Pipeline Fields</Label>
            <div className="grid grid-cols-2 gap-4">
              {pipelineFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.name}
                    {field.required && " *"}
                  </Label>
                  {field.fieldType === "text" && (
                    <Input
                      value={String(customFieldValues[field.fieldKey] ?? "")}
                      onChange={(e) => setCustomField(field.fieldKey, e.target.value)}
                      required={field.required}
                    />
                  )}
                  {field.fieldType === "number" && (
                    <Input
                      type="number"
                      value={String(customFieldValues[field.fieldKey] ?? "")}
                      onChange={(e) =>
                        setCustomField(field.fieldKey, e.target.value ? Number(e.target.value) : "")
                      }
                      required={field.required}
                    />
                  )}
                  {field.fieldType === "date" && (
                    <Input
                      type="date"
                      value={String(customFieldValues[field.fieldKey] ?? "")}
                      onChange={(e) => setCustomField(field.fieldKey, e.target.value)}
                      required={field.required}
                    />
                  )}
                  {field.fieldType === "boolean" && (
                    <div className="flex items-center pt-1">
                      <input
                        type="checkbox"
                        checked={!!customFieldValues[field.fieldKey]}
                        onChange={(e) => setCustomField(field.fieldKey, e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                    </div>
                  )}
                  {field.fieldType === "select" && (
                    <select
                      value={String(customFieldValues[field.fieldKey] ?? "")}
                      onChange={(e) => setCustomField(field.fieldKey, e.target.value)}
                      className={selectClassName}
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  {field.fieldType === "currency" && (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={String(customFieldValues[field.fieldKey] ?? "")}
                      onChange={(e) =>
                        setCustomField(field.fieldKey, e.target.value ? Number(e.target.value) : "")
                      }
                      required={field.required}
                    />
                  )}
                  {field.fieldType === "percentage" && (
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={String(customFieldValues[field.fieldKey] ?? "")}
                      onChange={(e) =>
                        setCustomField(field.fieldKey, e.target.value ? Number(e.target.value) : "")
                      }
                      required={field.required}
                    />
                  )}
                  {field.fieldType === "url" && (
                    <Input
                      type="url"
                      value={String(customFieldValues[field.fieldKey] ?? "")}
                      onChange={(e) => setCustomField(field.fieldKey, e.target.value)}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : initialData
                ? "Update Deal"
                : "Create Deal"}
          </Button>
        </div>
      </form>

      {/* Create company confirmation dialog */}
      {showCreateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Create New Company?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Company &quot;{pendingCompanyName}&quot; doesn&apos;t exist. Creating this deal
              will also create a new company record. Continue?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateConfirm(false);
                  setPendingCompanyName("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmCreateCompany}>
                Create Company
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
