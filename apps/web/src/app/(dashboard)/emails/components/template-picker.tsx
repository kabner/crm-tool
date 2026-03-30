"use client";

import { FileText, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplates, type EmailTemplate, type EmailSection } from "@/hooks/use-emails";

interface TemplatePickerProps {
  onSelect: (sections: EmailSection[], html: string) => void;
  onClose: () => void;
}

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const { data, isLoading } = useTemplates();
  const templates = data?.data ?? [];

  const handleStartFromScratch = () => {
    onSelect([], "");
    onClose();
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    onSelect(template.contentJson, template.contentHtml);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Choose a Template</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            &times;
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {/* Start from scratch */}
            <button
              onClick={handleStartFromScratch}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">Start from Scratch</span>
            </button>

            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <Skeleton className="mb-3 h-24 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))
              : templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="flex flex-col items-start rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="mb-3 h-24 w-full rounded object-cover"
                      />
                    ) : (
                      <div className="mb-3 flex h-24 w-full items-center justify-center rounded bg-muted">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{template.name}</span>
                    {template.description && (
                      <span className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </span>
                    )}
                  </button>
                ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
