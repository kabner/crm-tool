'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const SETTINGS_NAV = [
  {
    section: 'General',
    items: [
      { label: 'General', href: '/settings/general' },
      { label: 'Account', href: '/settings/account' },
      { label: 'Users', href: '/settings/users' },
      { label: 'Merge & Dedup', href: '/settings/merge' },
    ],
  },
  {
    section: 'Sections',
    items: [
      { label: 'Contacts', href: '/settings/contacts' },
      { label: 'Companies', href: '/settings/companies' },
      { label: 'Pipelines', href: '/settings/pipelines' },
      { label: 'Marketing', href: '/settings/marketing' },
      { label: 'Service', href: '/settings/service' },
      { label: 'Content', href: '/settings/content' },
      { label: 'Commerce', href: '/settings/commerce' },
      { label: 'Data & Analytics', href: '/settings/data' },
    ],
  },
  {
    section: 'Developer',
    items: [
      { label: 'Integrations', href: '/settings/integrations' },
      { label: 'Lead Scoring', href: '/settings/lead-scoring' },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-0 -m-6 min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-card overflow-y-auto p-4">
        <h2 className="mb-4 text-lg font-semibold">Settings</h2>
        <nav className="space-y-6">
          {SETTINGS_NAV.map((group) => (
            <div key={group.section}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.section}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'block rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
