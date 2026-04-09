'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableTableHeader } from '@/components/sortable-table-header';
import { PhoneDisplay } from '@/components/ui/phone-display';
import type { Lead } from '@/hooks/use-leads';

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  new: 'default',
  contacted: 'secondary',
  qualified: 'default',
  unqualified: 'destructive',
  converted: 'outline',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  unqualified: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  visibleColumns: string[];
  sort: string;
  order: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  onRowClick: (id: string) => void;
}

const COLUMN_CONFIG: { key: string; label: string; sortField?: string }[] = [
  { key: 'name', label: 'Name', sortField: 'firstName' },
  { key: 'email', label: 'Email', sortField: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company', sortField: 'companyName' },
  { key: 'status', label: 'Status', sortField: 'status' },
  { key: 'source', label: 'Source', sortField: 'source' },
  { key: 'score', label: 'Score', sortField: 'score' },
  { key: 'createdAt', label: 'Created At', sortField: 'createdAt' },
];

export function LeadsTable({
  leads,
  loading,
  visibleColumns,
  sort,
  order,
  onSort,
  onRowClick,
}: LeadsTableProps) {
  const activeCols = COLUMN_CONFIG.filter((c) => visibleColumns.includes(c.key));

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-[800px] w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {activeCols.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {activeCols.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-border">
        <p className="text-sm text-muted-foreground">No leads found</p>
      </div>
    );
  }

  function renderCell(lead: Lead, colKey: string) {
    switch (colKey) {
      case 'name':
        return (
          <span className="font-medium">
            {lead.firstName} {lead.lastName}
          </span>
        );
      case 'email':
        return (
          <span className="text-muted-foreground">{lead.email ?? '-'}</span>
        );
      case 'phone':
        return <PhoneDisplay phone={lead.phone} className="text-muted-foreground" />;
      case 'company':
        return (
          <span className="text-muted-foreground">
            {lead.companyName ?? '-'}
          </span>
        );
      case 'status': {
        const colorClass = STATUS_COLORS[lead.status] ?? '';
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
            {lead.status}
          </span>
        );
      }
      case 'source':
        return (
          <span className="text-muted-foreground">{lead.source ?? '-'}</span>
        );
      case 'score':
        return (
          <span className="text-muted-foreground">{lead.score}</span>
        );
      case 'createdAt':
        return (
          <span className="text-muted-foreground">
            {new Date(lead.createdAt).toLocaleDateString()}
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-[800px] w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {activeCols.map((col) =>
              col.sortField ? (
                <SortableTableHeader
                  key={col.key}
                  label={col.label}
                  field={col.sortField}
                  currentSort={sort}
                  currentOrder={order}
                  onSort={onSort}
                />
              ) : (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onRowClick(lead.id)}
              className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
            >
              {activeCols.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {renderCell(lead, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
