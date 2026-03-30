"use client";

import { useState, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  Type,
  Heading1,
  MousePointerClick,
  Image,
  Minus,
  X,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { EmailSection } from "@/hooks/use-emails";

// --- Helpers ---

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const PERSONALIZATION_TOKENS = [
  { label: "First Name", value: "{{firstName}}" },
  { label: "Last Name", value: "{{lastName}}" },
  { label: "Email", value: "{{email}}" },
  { label: "Company", value: "{{company}}" },
];

const SECTION_TYPES = [
  { type: "header" as const, label: "Header", icon: Heading1 },
  { type: "text" as const, label: "Text", icon: Type },
  { type: "button" as const, label: "Button", icon: MousePointerClick },
  { type: "image" as const, label: "Image", icon: Image },
  { type: "divider" as const, label: "Divider", icon: Minus },
];

function defaultSectionContent(type: EmailSection["type"]): Partial<EmailSection> {
  switch (type) {
    case "header":
      return { content: "Your Headline Here" };
    case "text":
      return { content: "Write your email content here. Use personalization tokens to make it personal." };
    case "button":
      return { content: "Click Here", url: "https://example.com" };
    case "image":
      return { content: "", url: "https://via.placeholder.com/600x200", alt: "Image description" };
    case "divider":
      return { content: "" };
  }
}

// --- Section to HTML ---

function sectionToHtml(section: EmailSection): string {
  switch (section.type) {
    case "header":
      return `<h1 style="font-size:28px;font-weight:bold;color:#1a1a1a;margin:0 0 16px 0;font-family:Arial,sans-serif;">${escapeHtml(section.content)}</h1>`;
    case "text":
      return `<p style="font-size:16px;line-height:1.6;color:#333333;margin:0 0 16px 0;font-family:Arial,sans-serif;">${escapeHtml(section.content).replace(/\n/g, "<br/>")}</p>`;
    case "button":
      return `<table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;"><tr><td align="center" bgcolor="#2563eb" style="border-radius:6px;"><a href="${escapeHtml(section.url || "#")}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;">${escapeHtml(section.content)}</a></td></tr></table>`;
    case "image":
      return `<img src="${escapeHtml(section.url || "")}" alt="${escapeHtml(section.alt || "")}" style="max-width:100%;height:auto;display:block;margin:16px 0;border-radius:4px;" />`;
    case "divider":
      return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`;
    default:
      return "";
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionsToFullHtml(sections: EmailSection[]): string {
  const body = sections.map(sectionToHtml).join("\n");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="padding:32px;">
${body}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// --- Section editor ---

function SectionEditor({
  section,
  onUpdate,
  onClose,
}: {
  section: EmailSection;
  onUpdate: (updated: EmailSection) => void;
  onClose: () => void;
}) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const insertToken = (token: string) => {
    const el = textRef.current || inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const newValue = el.value.substring(0, start) + token + el.value.substring(end);
    onUpdate({ ...section, content: newValue });
    // Restore cursor after token
    setTimeout(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">{section.type} Section</span>
        <button onClick={onClose} className="rounded p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {section.type !== "divider" && (
        <>
          {section.type === "text" ? (
            <div>
              <Label>Content</Label>
              <textarea
                ref={textRef}
                value={section.content}
                onChange={(e) => onUpdate({ ...section, content: e.target.value })}
                rows={4}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          ) : (
            <div>
              <Label>{section.type === "image" ? "Image URL" : "Content"}</Label>
              <Input
                ref={section.type === "image" ? undefined : inputRef}
                value={section.type === "image" ? (section.url || "") : section.content}
                onChange={(e) =>
                  section.type === "image"
                    ? onUpdate({ ...section, url: e.target.value })
                    : onUpdate({ ...section, content: e.target.value })
                }
                className="mt-1"
              />
            </div>
          )}

          {section.type === "button" && (
            <div>
              <Label>Button URL</Label>
              <Input
                value={section.url || ""}
                onChange={(e) => onUpdate({ ...section, url: e.target.value })}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>
          )}

          {section.type === "image" && (
            <div>
              <Label>Alt Text</Label>
              <Input
                value={section.alt || ""}
                onChange={(e) => onUpdate({ ...section, alt: e.target.value })}
                className="mt-1"
              />
            </div>
          )}

          {/* Personalization tokens */}
          {(section.type === "header" || section.type === "text" || section.type === "button") && (
            <div>
              <Label className="text-xs text-muted-foreground">Insert Personalization</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {PERSONALIZATION_TOKENS.map((token) => (
                  <button
                    key={token.value}
                    onClick={() => insertToken(token.value)}
                    className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                  >
                    {token.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Section preview ---

function SectionPreview({ section }: { section: EmailSection }) {
  switch (section.type) {
    case "header":
      return <h1 className="text-2xl font-bold text-foreground">{section.content}</h1>;
    case "text":
      return (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {section.content}
        </p>
      );
    case "button":
      return (
        <div className="py-1">
          <span className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            {section.content}
          </span>
        </div>
      );
    case "image":
      return section.url ? (
        <img
          src={section.url}
          alt={section.alt || ""}
          className="max-h-48 rounded border border-border object-cover"
        />
      ) : (
        <div className="flex h-24 items-center justify-center rounded border border-dashed border-border bg-muted text-sm text-muted-foreground">
          Image placeholder
        </div>
      );
    case "divider":
      return <hr className="border-border" />;
    default:
      return null;
  }
}

// --- Main component ---

interface EmailEditorProps {
  sections: EmailSection[];
  onChange: (sections: EmailSection[], html: string) => void;
}

export function EmailEditor({ sections, onChange }: EmailEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const updateSections = useCallback(
    (newSections: EmailSection[]) => {
      const html = sectionsToFullHtml(newSections);
      onChange(newSections, html);
    },
    [onChange],
  );

  const addSection = (type: EmailSection["type"]) => {
    const defaults = defaultSectionContent(type);
    const newSection: EmailSection = {
      id: generateId(),
      type,
      content: defaults.content || "",
      url: defaults.url,
      alt: defaults.alt,
    };
    const newSections = [...sections, newSection];
    updateSections(newSections);
    setEditingId(newSection.id);
    setShowAddMenu(false);
  };

  const updateSection = (updated: EmailSection) => {
    const newSections = sections.map((s) => (s.id === updated.id ? updated : s));
    updateSections(newSections);
  };

  const deleteSection = (id: string) => {
    const newSections = sections.filter((s) => s.id !== id);
    updateSections(newSections);
    if (editingId === id) setEditingId(null);
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= sections.length) return;
    const newSections = [...sections];
    [newSections[idx], newSections[target]] = [newSections[target]!, newSections[idx]!];
    updateSections(newSections);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Editor panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Sections</h3>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Section
            </Button>
            {showAddMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
                {SECTION_TYPES.map((st) => (
                  <button
                    key={st.type}
                    onClick={() => addSection(st.type)}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted"
                  >
                    <st.icon className="h-4 w-4 text-muted-foreground" />
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {sections.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No sections yet. Click "Add Section" to start building your email.
            </p>
          </div>
        )}

        {sections.map((section, idx) => (
          <Card key={section.id} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {section.type}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveSection(section.id, "up")}
                  disabled={idx === 0}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveSection(section.id, "down")}
                  disabled={idx === sections.length - 1}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() =>
                    setEditingId(editingId === section.id ? null : section.id)
                  }
                  className="rounded p-1 hover:bg-muted"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="p-3">
              {editingId === section.id ? (
                <SectionEditor
                  section={section}
                  onUpdate={updateSection}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <SectionPreview section={section} />
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Live HTML preview panel */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Live Preview</h3>
        <Card className="overflow-hidden">
          <div className="bg-muted/20 p-4">
            <div
              className="mx-auto max-w-[600px] overflow-hidden rounded bg-white shadow-sm"
              dangerouslySetInnerHTML={{
                __html: sectionsToFullHtml(sections),
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export { sectionsToFullHtml };
