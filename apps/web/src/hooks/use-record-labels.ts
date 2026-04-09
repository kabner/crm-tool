'use client';

import { useTenantSettings } from './use-tenant-settings';

const DEFAULTS: Record<string, string> = {
  contacts: 'Contacts',
  companies: 'Companies',
  deals: 'Deals',
  leads: 'Leads',
  pipelines: 'Pipelines',
  home: 'Home',
  dashboard: 'Dashboard',
};

export function useRecordLabels() {
  const { data } = useTenantSettings<Record<string, string>>('record-labels');

  return {
    label: (key: string) => data?.[key] || DEFAULTS[key] || key,
    labels: { ...DEFAULTS, ...(data || {}) },
  };
}

export { DEFAULTS as DEFAULT_RECORD_LABELS };
