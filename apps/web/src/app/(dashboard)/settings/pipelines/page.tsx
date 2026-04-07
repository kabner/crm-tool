'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

export default function PipelineSettingsPage() {
  const { data: settings, isLoading } = useUserSettings<PipelineSettings>('pipelines');
  const updateSettings = useUpdateUserSettings();

  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
    </div>
  );
}
