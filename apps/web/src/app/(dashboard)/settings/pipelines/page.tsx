'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useUserSettings,
  useUpdateUserSettings,
} from '@/hooks/use-user-settings';
import { usePipelines } from '@/hooks/use-deals';
import {
  usePipelineFields,
  useCreatePipelineField,
  useUpdatePipelineField,
  useDeletePipelineField,
} from '@/hooks/use-pipeline-fields';
import { Pencil, Trash2 } from 'lucide-react';

interface PipelineSettings {
  cardFields?: string[];
}

const AVAILABLE_FIELDS = [
  { key: 'name', label: 'Opportunity Name' },
  { key: 'amount', label: 'Value' },
  { key: 'lifecycleStage', label: 'Lifecycle Stage' },
  { key: 'company', label: 'Company Name' },
  { key: 'owner', label: 'Opportunity Owner' },
  { key: 'closeDate', label: 'Close Date' },
  { key: 'priority', label: 'Priority' },
  { key: 'stage', label: 'Stage' },
  { key: 'probability', label: 'Probability' },
];

const DEFAULT_FIELDS = ['name', 'amount', 'lifecycleStage', 'company', 'owner'];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'url', label: 'URL' },
];

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function PipelineSettingsPage() {
  const { data: settings, isLoading } = useUserSettings<PipelineSettings>('pipelines');
  const updateSettings = useUpdateUserSettings();

  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Pipeline custom fields state
  const { data: pipelines } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const { data: pipelineFields } = usePipelineFields(selectedPipelineId);
  const createField = useCreatePipelineField();
  const updateField = useUpdatePipelineField();
  const deleteField = useDeletePipelineField();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFieldType, setEditFieldType] = useState('text');
  const [editOptions, setEditOptions] = useState('');
  const [editRequired, setEditRequired] = useState(false);

  // Auto-select first pipeline
  useEffect(() => {
    if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0]!.id);
    }
  }, [pipelines, selectedPipelineId]);

  useEffect(() => {
    if (settings?.cardFields) {
      setSelectedFields(settings.cardFields);
    }
  }, [settings]);

  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setSaveMessage(null);
    try {
      await updateSettings.mutateAsync({
        section: 'pipelines',
        data: { cardFields: selectedFields },
      });
      setSaveMessage('Settings saved successfully.');
    } catch {
      setSaveMessage('Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Pipeline Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Customize which fields appear on pipeline deal cards.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Card Display Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Select the fields you want to display on deal cards in the
                pipeline Kanban board.
              </p>
              <div className="space-y-3">
                {AVAILABLE_FIELDS.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.key)}
                      onChange={() => toggleField(field.key)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label className="cursor-pointer font-normal">
                      {field.label}
                    </Label>
                  </label>
                ))}
              </div>
              {saveMessage && (
                <p
                  className={
                    saveMessage.includes('success')
                      ? 'text-sm text-green-600'
                      : 'text-sm text-destructive'
                  }
                >
                  {saveMessage}
                </p>
              )}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Custom Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Custom Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pipeline</Label>
            <select
              value={selectedPipelineId}
              onChange={(e) => {
                setSelectedPipelineId(e.target.value);
                setShowAddForm(false);
                setEditingFieldId(null);
              }}
              className={selectClassName}
            >
              <option value="">Select pipeline...</option>
              {pipelines?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPipelineId && (
            <>
              {/* Field list */}
              {pipelineFields && pipelineFields.length > 0 ? (
                <div className="space-y-2">
                  {pipelineFields.map((field) =>
                    editingFieldId === field.id ? (
                      <div
                        key={field.id}
                        className="rounded-md border p-3 space-y-2 bg-muted/30"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <select
                              value={editFieldType}
                              onChange={(e) => setEditFieldType(e.target.value)}
                              className={selectClassName}
                            >
                              {FIELD_TYPES.map((ft) => (
                                <option key={ft.value} value={ft.value}>
                                  {ft.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {editFieldType === 'select' && (
                          <div className="space-y-1">
                            <Label className="text-xs">
                              Options (comma-separated)
                            </Label>
                            <Input
                              value={editOptions}
                              onChange={(e) => setEditOptions(e.target.value)}
                              placeholder="Option A, Option B, Option C"
                            />
                          </div>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editRequired}
                            onChange={(e) => setEditRequired(e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                          />
                          <span className="text-sm">Required</span>
                        </label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              await updateField.mutateAsync({
                                pipelineId: selectedPipelineId,
                                id: field.id,
                                data: {
                                  name: editName,
                                  fieldType: editFieldType,
                                  options:
                                    editFieldType === 'select' && editOptions
                                      ? editOptions.split(',').map((o) => o.trim()).filter(Boolean)
                                      : null,
                                  required: editRequired,
                                },
                              });
                              setEditingFieldId(null);
                            }}
                            disabled={updateField.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFieldId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-sm font-medium">
                              {field.name}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({field.fieldType})
                            </span>
                          </div>
                          {field.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingFieldId(field.id);
                              setEditName(field.name);
                              setEditFieldType(field.fieldType);
                              setEditOptions(
                                field.options ? field.options.join(', ') : '',
                              );
                              setEditRequired(field.required);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  `Delete field "${field.name}"? This will not remove data already stored in deals.`,
                                )
                              ) {
                                await deleteField.mutateAsync({
                                  pipelineId: selectedPipelineId,
                                  id: field.id,
                                });
                              }
                            }}
                            disabled={deleteField.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No custom fields configured for this pipeline yet.
                </p>
              )}

              {/* Add field form */}
              {showAddForm ? (
                <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Field Name</Label>
                      <Input
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="e.g. Budget"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value)}
                        className={selectClassName}
                      >
                        {FIELD_TYPES.map((ft) => (
                          <option key={ft.value} value={ft.value}>
                            {ft.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {newFieldType === 'select' && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Options (comma-separated)
                      </Label>
                      <Input
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="Option A, Option B, Option C"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm">Required</span>
                  </label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!newFieldName.trim()) return;
                        await createField.mutateAsync({
                          pipelineId: selectedPipelineId,
                          data: {
                            name: newFieldName.trim(),
                            fieldType: newFieldType,
                            options:
                              newFieldType === 'select' && newFieldOptions
                                ? newFieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
                                : undefined,
                            required: newFieldRequired,
                          },
                        });
                        setNewFieldName('');
                        setNewFieldType('text');
                        setNewFieldOptions('');
                        setNewFieldRequired(false);
                        setShowAddForm(false);
                      }}
                      disabled={createField.isPending || !newFieldName.trim()}
                    >
                      {createField.isPending ? 'Creating...' : 'Create Field'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewFieldName('');
                        setNewFieldType('text');
                        setNewFieldOptions('');
                        setNewFieldRequired(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add Field
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
