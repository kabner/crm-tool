'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableTableHeader } from '@/components/sortable-table-header';
import { FavoriteButton } from '@/components/favorite-button';
import { PhoneDisplay } from '@/components/ui/phone-display';
import type { Company } from '@/hooks/use-companies';

const LIFECYCLE_STAGE_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  subscriber: 'outline',
  lead: 'secondary',
  mql: 'secondary',
  sql: 'default',
  opportunity: 'default',
  customer: 'default',
  evangelist: 'default',
};

interface CompaniesTableProps {
  companies: Company[];
  loading: boolean;
  visibleColumns: string[];
  sort: string;
  order: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onRowClick: (id: string) => void;
}

const COLUMN_CONFIG: { key: string; label: string; sortField?: string }[] = [
  { key: 'favorite', label: '' },
  { key: 'name', label: 'Name', sortField: 'name' },
  { key: 'domain', label: 'Domain', sortField: 'domain' },
  { key: 'industry', label: 'Industry', sortField: 'industry' },
  { key: 'size', label: 'Size' },
  { key: 'phone', label: 'Phone' },
  { key: 'lifecycleStage', label: 'Lifecycle Stage' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdAt', label: 'Created At', sortField: 'createdAt' },
];

export function CompaniesTable({
  companies,
  loading,
  visibleColumns,
  sort,
  order,
  onSort,
  favoriteIds,
  onToggleFavorite,
  onRowClick,
}: CompaniesTableProps) {
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

  if (companies.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-border">
        <p className="text-sm text-muted-foreground">No companies found</p>
      </div>
    );
  }

  function renderCell(company: Company, colKey: string) {
    switch (colKey) {
      case 'favorite':
        return (
          <FavoriteButton
            isFavorite={favoriteIds.has(company.id)}
            onToggle={() => onToggleFavorite(company.id)}
          />
        );
      case 'name':
        return <span className="font-medium">{company.name}</span>;
      case 'domain':
        return (
          <span className="text-muted-foreground">{company.domain ?? '-'}</span>
        );
      case 'industry':
        return company.industry ? (
          <Badge variant="secondary">{company.industry}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      case 'size':
        return (
          <span className="text-muted-foreground">{company.size ?? '-'}</span>
        );
      case 'phone':
        return <PhoneDisplay phone={company.phone} className="text-muted-foreground" />;
      case 'lifecycleStage': {
        const stage = company.lifecycleStage;
        if (!stage) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant={LIFECYCLE_STAGE_VARIANT[stage] ?? 'outline'}>
            {stage}
          </Badge>
        );
      }
      case 'createdBy':
        return (
          <span className="text-muted-foreground">
            {company.createdBy
              ? `${company.createdBy.firstName} ${company.createdBy.lastName}`
              : 'System'}
          </span>
        );
      case 'createdAt':
        return (
          <span className="text-muted-foreground">
            {new Date(company.createdAt).toLocaleDateString()}
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
          {companies.map((company) => (
            <tr
              key={company.id}
              onClick={() => onRowClick(company.id)}
              className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
            >
              {activeCols.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {renderCell(company, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
