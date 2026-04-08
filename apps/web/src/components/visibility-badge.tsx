'use client';

import { Globe, Lock, EyeOff } from 'lucide-react';

const VISIBILITY_CONFIG: Record<string, { icon: typeof Globe; label: string; className: string }> = {
  everyone: {
    icon: Globe,
    label: 'Visible to everyone',
    className: 'text-muted-foreground',
  },
  owner: {
    icon: Lock,
    label: 'Owner only',
    className: 'text-amber-500',
  },
  private: {
    icon: EyeOff,
    label: 'Private',
    className: 'text-red-500',
  },
};

interface VisibilityBadgeProps {
  visibility: string;
}

const DEFAULT_CONFIG = VISIBILITY_CONFIG.everyone!;

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const config = VISIBILITY_CONFIG[visibility] ?? DEFAULT_CONFIG;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-sm ${config.className}`} title={config.label}>
      <Icon className="h-4 w-4" />
      <span className="sr-only">{config.label}</span>
    </span>
  );
}
