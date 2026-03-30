"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import {
  useParseCSV,
  useImportContacts,
  type ParseCSVResult,
  type ImportResult,
} from "@/hooks/use-import-export";

const CRM_FIELDS = [
  { value: "", label: "-- Skip --" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "jobTitle", label: "Job Title" },
  { value: "lifecycleStage", label: "Lifecycle Stage" },
  { value: "leadStatus", label: "Lead Status" },
  { value: "source", label: "Source" },
  { value: "tags", label: "Tags" },
];

const AUTO_MAP: Record<string, string> = {
  "first name": "firstName",
  "first_name": "firstName",
  firstname: "firstName",
  "last name": "lastName",
  "last_name": "lastName",
  lastname: "lastName",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  "job title": "jobTitle",
  "job_title": "jobTitle",
  jobtitle: "jobTitle",
  "lifecycle stage": "lifecycleStage",
  lifecycle_stage: "lifecycleStage",
  lifecyclestage: "lifecycleStage",
  "lead status": "leadStatus",
  lead_status: "leadStatus",
  leadstatus: "leadStatus",
  source: "source",
  tags: "tags",
};

type Step = "upload" | "mapping" | "options" | "review" | "importing" | "results";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseCSVResult | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [duplicateHandling, setDuplicateHandling] = useState<
    "skip" | "update" | "create"
  >("skip");
  const [duplicateField, setDuplicateField] = useState("email");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseMutation = useParseCSV();
  const importMutation = useImportContacts();

  const resetState = useCallback(() => {
    setStep("upload");
    setFile(null);
    setParseResult(null);
    setFieldMapping({});
    setDuplicateHandling("skip");
    setDuplicateField("email");
    setImportResult(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile.name.endsWith(".csv")) {
        return;
      }
      setFile(selectedFile);

      try {
        const result = await parseMutation.mutateAsync(selectedFile);
        setParseResult(result);

        // Auto-map fields
        const autoMapping: Record<string, string> = {};
        for (const header of result.headers) {
          const normalized = header.toLowerCase().trim();
          if (AUTO_MAP[normalized]) {
            autoMapping[header] = AUTO_MAP[normalized];
          }
        }
        setFieldMapping(autoMapping);
        setStep("mapping");
      } catch {
        // Error is handled by mutation state
      }
    },
    [parseMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect],
  );

  const handleImport = useCallback(async () => {
    if (!file) return;

    setStep("importing");

    try {
      const result = await importMutation.mutateAsync({
        file,
        fieldMapping,
        duplicateHandling,
        duplicateField,
      });
      setImportResult(result);
      setStep("results");
    } catch {
      setStep("review");
    }
  }, [file, fieldMapping, duplicateHandling, duplicateField, importMutation]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Import Contacts</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 border-b border-border px-6 py-3">
          {(
            [
              ["upload", "Upload"],
              ["mapping", "Map Fields"],
              ["options", "Options"],
              ["review", "Review"],
              ["results", "Results"],
            ] as const
          ).map(([key, label], i) => {
            const steps: Step[] = ["upload", "mapping", "options", "review", "results"];
            const currentIndex = steps.indexOf(
              step === "importing" ? "review" : step,
            );
            const stepIndex = i;
            const isActive = stepIndex === currentIndex;
            const isComplete = stepIndex < currentIndex;

            return (
              <div key={key} className="flex items-center gap-1">
                {i > 0 && (
                  <div
                    className={`mx-1 h-px w-6 ${isComplete ? "bg-primary" : "bg-border"}`}
                  />
                )}
                <span
                  className={`text-xs font-medium ${
                    isActive
                      ? "text-primary"
                      : isComplete
                        ? "text-primary/70"
                        : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">
                Drag and drop your CSV file here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse (.csv files only)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {parseMutation.isError && (
                <p className="mt-3 text-sm text-destructive">
                  {parseMutation.error?.message || "Failed to parse CSV"}
                </p>
              )}
              {parseMutation.isPending && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Parsing file...
                </p>
              )}
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {step === "mapping" && parseResult && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {parseResult.totalRows} rows. Map CSV columns to CRM
                fields:
              </p>
              <div className="space-y-3">
                {parseResult.headers.map((header) => (
                  <div
                    key={header}
                    className="flex items-center gap-4"
                  >
                    <div className="w-1/2">
                      <Label className="text-sm font-medium">{header}</Label>
                      {parseResult.preview[0]?.[header] && (
                        <p className="truncate text-xs text-muted-foreground">
                          e.g. {parseResult.preview[0][header]}
                        </p>
                      )}
                    </div>
                    <div className="w-1/2">
                      <select
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        value={fieldMapping[header] || ""}
                        onChange={(e) =>
                          setFieldMapping((prev) => ({
                            ...prev,
                            [header]: e.target.value,
                          }))
                        }
                      >
                        {CRM_FIELDS.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Duplicate handling options */}
          {step === "options" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Duplicate Handling
                </Label>
                <p className="text-xs text-muted-foreground">
                  What should happen when a contact already exists?
                </p>
                <div className="space-y-2">
                  {(
                    [
                      ["skip", "Skip", "Do not import duplicate records"],
                      [
                        "update",
                        "Update",
                        "Merge new data into existing records",
                      ],
                      [
                        "create",
                        "Create new",
                        "Always create a new record",
                      ],
                    ] as const
                  ).map(([value, label, desc]) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                        duplicateHandling === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="duplicateHandling"
                        value={value}
                        checked={duplicateHandling === value}
                        onChange={() => setDuplicateHandling(value)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Match duplicates by
                </Label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={duplicateField}
                  onChange={(e) => setDuplicateField(e.target.value)}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="firstName">First Name</option>
                  <option value="lastName">Last Name</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === "review" && parseResult && (
            <div className="space-y-4">
              <div className="rounded-md border border-border p-4">
                <h3 className="mb-2 text-sm font-semibold">Import Summary</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>File: {file?.name}</p>
                  <p>Total rows: {parseResult.totalRows}</p>
                  <p>
                    Mapped fields:{" "}
                    {
                      Object.values(fieldMapping).filter((v) => v !== "")
                        .length
                    }{" "}
                    of {parseResult.headers.length}
                  </p>
                  <p>
                    Duplicate handling:{" "}
                    {duplicateHandling === "skip"
                      ? "Skip duplicates"
                      : duplicateHandling === "update"
                        ? "Update existing"
                        : "Create new"}
                  </p>
                  <p>Match by: {duplicateField}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Preview (first 3 rows)
                </h3>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {Object.entries(fieldMapping)
                          .filter(([, v]) => v !== "")
                          .map(([csvCol, crmField]) => (
                            <th
                              key={csvCol}
                              className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                            >
                              {crmField}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.preview.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-border">
                          {Object.entries(fieldMapping)
                            .filter(([, v]) => v !== "")
                            .map(([csvCol]) => (
                              <td
                                key={csvCol}
                                className="max-w-[200px] truncate px-3 py-2 text-xs"
                              >
                                {row[csvCol] || "-"}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {importMutation.isError && (
                <p className="text-sm text-destructive">
                  {importMutation.error?.message || "Import failed"}
                </p>
              )}
            </div>
          )}

          {/* Importing state */}
          {step === "importing" && (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
              <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
                <div className="h-full animate-pulse rounded-full bg-primary" style={{ width: "60%" }} />
              </div>
              <p className="text-sm text-muted-foreground">
                Importing contacts...
              </p>
            </div>
          )}

          {/* Step 5: Results */}
          {step === "results" && importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold">Import Complete</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {importResult.created}
                  </p>
                  <p className="text-xs text-muted-foreground">Created</p>
                </div>
                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {importResult.updated}
                  </p>
                  <p className="text-xs text-muted-foreground">Updated</p>
                </div>
                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {importResult.skipped}
                  </p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium">
                      {importResult.errors.length} error(s)
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div>
            {step !== "upload" && step !== "results" && step !== "importing" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prev: Record<Step, Step> = {
                    upload: "upload",
                    mapping: "upload",
                    options: "mapping",
                    review: "options",
                    importing: "review",
                    results: "results",
                  };
                  setStep(prev[step]);
                }}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              {step === "results" ? "Close" : "Cancel"}
            </Button>

            {step === "mapping" && (
              <Button
                size="sm"
                onClick={() => setStep("options")}
                disabled={
                  Object.values(fieldMapping).filter((v) => v !== "")
                    .length === 0
                }
              >
                Next
              </Button>
            )}

            {step === "options" && (
              <Button size="sm" onClick={() => setStep("review")}>
                Next
              </Button>
            )}

            {step === "review" && (
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Start Import
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
