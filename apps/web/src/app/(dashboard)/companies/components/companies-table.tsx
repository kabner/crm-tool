'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { SortableTableHeader } from '@/components/sortable-table-header';
import { FavoriteButton } from '@/components/favorite-button';
import { InlineEditCell } from '@/components/inline-edit-cell';
import type { Company } from '@/hooks/use-companies';
import { useUpdateCompany } from '@/hooks/use-companies';

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

const INDUSTRIES = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Education', label: 'Education' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Media', label: 'Media' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Telecommunications', label: 'Telecommunications' },
  { value: 'Other', label: 'Other' },
];

const SIZES = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '501-1000', label: '501-1000' },
  { value: '1001-5000', label: '1001-5000' },
  { value: '5001-10000', label: '5001-10000' },
  { value: '10001+', label: '10001+' },
];

const LIFECYCLE_STAGES = [
  { value: 'subscriber', label: 'Subscriber' },
  { value: 'lead', label: 'Lead' },
  { value: 'mql', label: 'MQL' },
  { value: 'sql', label: 'SQL' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'customer', label: 'Customer' },
  { value: 'evangelist', label: 'Evangelist' },
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
  const updateCompany = useUpdateCompany();

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
          <InlineEditCell
            value={company.domain ?? null}
            onSave={(v) => updateCompany.mutate({ id: company.id, data: { domain: v } })}
          />
        );
      case 'industry':
        return (
          <InlineEditCell
            value={company.industry ?? null}
            onSave={(v) => updateCompany.mutate({ id: company.id, data: { industry: v } })}
            type="select"
            options={INDUSTRIES}
          />
        );
      case 'size':
        return (
          <InlineEditCell
            value={company.size ?? null}
            onSave={(v) => updateCompany.mutate({ id: company.id, data: { size: v } })}
            type="select"
            options={SIZES}
          />
        );
      case 'phone':
        return (
          <InlineEditCell
            value={company.phone ?? null}
            onSave={(v) => updateCompany.mutate({ id: company.id, data: { phone: v } })}
          />
        );
      case 'lifecycleStage':
        return (
          <InlineEditCell
            value={company.lifecycleStage ?? null}
            onSave={(v) => updateCompany.mutate({ id: company.id, data: { lifecycleStage: v } })}
            type="select"
            options={LIFECYCLE_STAGES}
          />
        );
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
