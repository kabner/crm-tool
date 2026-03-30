"use client";

import { useExportContacts } from "@/hooks/use-import-export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  filters?: Record<string, any>;
  columns?: string[];
}

export function ExportButton({ filters, columns }: ExportButtonProps) {
  const exportMutation = useExportContacts();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportMutation.mutate({ filters, columns })}
      disabled={exportMutation.isPending}
    >
      <Download className="mr-2 h-4 w-4" />
      {exportMutation.isPending ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
