'use client';

import { useState, useEffect } from 'react';
import { useTenantSettings, useUpdateTenantSettings } from '@/hooks/use-tenant-settings';
import { DEFAULT_RECORD_LABELS } from '@/hooks/use-record-labels';

const EDITABLE_KEYS = ['contacts', 'companies', 'deals', 'leads', 'pipelines'];

export default function GeneralSettingsPage() {
  const { data, isLoading } = useTenantSettings<Record<string, string>>('record-labels');
  const updateSettings = useUpdateTenantSettings();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      const merged: Record<string, string> = { ...DEFAULT_RECORD_LABELS };
      for (const [k, v] of Object.entries(data)) {
        if (v) merged[k] = v;
      }
      setLabels(merged);
    } else if (!isLoading) {
      setLabels({ ...DEFAULT_RECORD_LABELS });
    }
  }, [data, isLoading]);

  const handleChange = (key: string, value: string) => {
    setLabels((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    const payload: Record<string, string> = {};
    for (const key of EDITABLE_KEYS) {
      payload[key] = labels[key] || DEFAULT_RECORD_LABELS[key] || key;
    }
    updateSettings.mutate(
      { key: 'record-labels', value: payload },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  const handleReset = (key: string) => {
    setLabels((prev) => ({ ...prev, [key]: DEFAULT_RECORD_LABELS[key] || key }));
    setSaved(false);
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">General</h1>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">General</h1>
      <p className="mt-2 text-muted-foreground">
        Customize the display labels for record types across your CRM.
      </p>

      <div className="mt-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Record Type Labels</h2>
        <div className="space-y-4">
          {EDITABLE_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground capitalize">
                {key}
              </span>
              <input
                type="text"
                value={labels[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder={DEFAULT_RECORD_LABELS[key]}
              />
              {labels[key] !== DEFAULT_RECORD_LABELS[key] && (
                <button
                  onClick={() => handleReset(key)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Labels'}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Saved successfully</span>
          )}
        </div>
      </div>
    </div>
  );
}
