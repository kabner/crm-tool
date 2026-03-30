import { useMutation } from "@tanstack/react-query";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ParseCSVResult {
  headers: string[];
  preview: Record<string, string>[];
  totalRows: number;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

export function useExportContacts() {
  return useMutation({
    mutationFn: async (params?: {
      filters?: Record<string, any>;
      columns?: string[];
    }) => {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/v1/import-export/contacts/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params ?? {}),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          message: "Export failed",
        }));
        throw new Error(err.message);
      }

      const blob = await response.blob();
      const timestamp = new Date().toISOString().split("T")[0];
      triggerDownload(blob, `contacts_${timestamp}.csv`);
    },
  });
}

export function useExportCompanies() {
  return useMutation({
    mutationFn: async (params?: {
      filters?: Record<string, any>;
      columns?: string[];
    }) => {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/v1/import-export/companies/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params ?? {}),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          message: "Export failed",
        }));
        throw new Error(err.message);
      }

      const blob = await response.blob();
      const timestamp = new Date().toISOString().split("T")[0];
      triggerDownload(blob, `companies_${timestamp}.csv`);
    },
  });
}

export function useParseCSV() {
  return useMutation({
    mutationFn: async (file: File): Promise<ParseCSVResult> => {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/v1/import-export/parse`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          message: "Failed to parse CSV",
        }));
        throw new Error(err.message);
      }

      return response.json();
    },
  });
}

export function useImportContacts() {
  return useMutation({
    mutationFn: async (params: {
      file: File;
      fieldMapping: Record<string, string>;
      duplicateHandling: "skip" | "update" | "create";
      duplicateField: string;
    }): Promise<ImportResult> => {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", params.file);
      formData.append("fieldMapping", JSON.stringify(params.fieldMapping));
      formData.append("duplicateHandling", params.duplicateHandling);
      formData.append("duplicateField", params.duplicateField);

      const response = await fetch(
        `${API_URL}/api/v1/import-export/contacts/import`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          message: "Import failed",
        }));
        throw new Error(err.message);
      }

      return response.json();
    },
  });
}
