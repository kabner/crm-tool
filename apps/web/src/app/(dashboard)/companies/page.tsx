'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterBar, type ActiveFilter, type FilterField } from '@/components/filter-bar/filter-bar';
import { RecordCount } from '@/components/record-count';
import { ColumnPicker, type ColumnDef } from '@/components/column-picker';
import { CompaniesTable } from './components/companies-table';
import { CompanyForm, type CompanyFormValues } from './components/company-form';
import { useCompanies, useCreateCompany } from '@/hooks/use-companies';
import { useFavorites, useToggleFavorite } from '@/hooks/use-favorites';
import { useSavedViews, useCreateView } from '@/hooks/use-saved-views';

const COMPANY_FILTER_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'domain', label: 'Domain', type: 'text' },
  {
    key: 'industry',
    label: 'Industry',
    type: 'select',
    options: [
      { label: 'Technology', value: 'Technology' },
      { label: 'Healthcare', value: 'Healthcare' },
      { label: 'Finance', value: 'Finance' },
      { label: 'Manufacturing', value: 'Manufacturing' },
      { label: 'Retail', value: 'Retail' },
      { label: 'Education', value: 'Education' },
      { label: 'Energy', value: 'Energy' },
      { label: 'Real Estate', value: 'Real Estate' },
      { label: 'Media', value: 'Media' },
      { label: 'Consulting', value: 'Consulting' },
      { label: 'Other', value: 'Other' },
    ],
  },
  {
    key: 'size',
    label: 'Size',
    type: 'select',
    options: [
      { label: '1-10', value: '1-10' },
      { label: '11-50', value: '11-50' },
      { label: '51-200', value: '51-200' },
      { label: '201-500', value: '201-500' },
      { label: '501-1000', value: '501-1000' },
      { label: '1001-5000', value: '1001-5000' },
      { label: '5001-10000', value: '5001-10000' },
      { label: '10001+', value: '10001+' },
    ],
  },
  { key: 'phone', label: 'Phone', type: 'text' },
  {
    key: 'lifecycleStage',
    label: 'Lifecycle Stage',
    type: 'select',
    options: [
      { label: 'Subscriber', value: 'subscriber' },
      { label: 'Lead', value: 'lead' },
      { label: 'MQL', value: 'mql' },
      { label: 'SQL', value: 'sql' },
      { label: 'Opportunity', value: 'opportunity' },
      { label: 'Customer', value: 'customer' },
      { label: 'Evangelist', value: 'evangelist' },
    ],
  },
  { key: 'createdAfter', label: 'Created After', type: 'date' },
  { key: 'createdBefore', label: 'Created Before', type: 'date' },
  { key: 'favorite', label: 'Favorites Only', type: 'boolean' },
];

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'favorite', label: 'Favorite', defaultVisible: true },
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'domain', label: 'Domain', defaultVisible: true },
  { key: 'industry', label: 'Industry', defaultVisible: true },
  { key: 'size', label: 'Size', defaultVisible: true },
  { key: 'phone', label: 'Phone', defaultVisible: true },
  { key: 'lifecycleStage', label: 'Lifecycle Stage', defaultVisible: true },
  { key: 'createdBy', label: 'Created By', defaultVisible: true },
  { key: 'createdAt', label: 'Created At', defaultVisible: true },
];

const DEFAULT_VISIBLE = ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);

export default function CompaniesPage() {
  const router = useRouter();

  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE);

  // Saved views
  const { data: savedViews } = useSavedViews('company');
  const createView = useCreateView();
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  // Favorites
  const { data: favorites } = useFavorites('company');
  const toggleFavorite = useToggleFavorite();

  const favoriteIds = useMemo(() => {
    if (!favorites) return new Set<string>();
    return new Set(favorites.map((f) => f.entityId));
  }, [favorites]);

  // Build API filters from active filters
  const apiFilters = useMemo(() => {
    const result: Record<string, string> = {};
    for (const f of filters) {
      result[f.key] = f.value;
    }
    return result;
  }, [filters]);

  const { data, isLoading } = useCompanies({
    page,
    limit: 20,
    search: search || undefined,
    sort,
    order,
    ...apiFilters,
  });

  const createCompany = useCreateCompany();

  const companies = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, totalCount: 0, page: 1, limit: 20, totalPages: 1 };

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [],
  );

  const handleFiltersChange = useCallback(
    (newFilters: ActiveFilter[]) => {
      setFilters(newFilters);
      setPage(1);
    },
    [],
  );

  const handleSort = useCallback(
    (field: string) => {
      if (sort === field) {
        setOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
      } else {
        setSort(field);
        setOrder('ASC');
      }
      setPage(1);
    },
    [sort],
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavorite.mutate({ entityType: 'company', entityId: id });
    },
    [toggleFavorite],
  );

  const handleRowClick = useCallback(
    (id: string) => {
      router.push(`/companies/${id}`);
    },
    [router],
  );

  const handleCreateSubmit = async (values: CompanyFormValues) => {
    await createCompany.mutateAsync(values);
    setShowCreateForm(false);
  };

  const handleSaveView = () => {
    const name = window.prompt('View name:');
    if (!name) return;

    const filterObj: Record<string, string> = {};
    for (const f of filters) {
      filterObj[f.key] = f.value;
    }

    createView.mutate({
      objectType: 'company',
      name,
      filters: { search, ...filterObj },
      columns: visibleColumns,
      sort: { field: sort, order },
    });
  };

  const handleApplyView = (view: { filters: Record<string, any>; columns: string[]; sort: { field: string; order: 'ASC' | 'DESC' } | Record<string, never> }) => {
    const { search: viewSearch, ...viewFilters } = view.filters;
    if (viewSearch) setSearch(viewSearch);
    else setSearch('');

    const newActiveFilters: ActiveFilter[] = Object.entries(viewFilters).map(([key, value]) => {
      const fieldDef = COMPANY_FILTER_FIELDS.find((f) => f.key === key);
      return { key, value: String(value), label: fieldDef ? `${fieldDef.label}: ${value}` : `${key}: ${value}` };
    });
    setFilters(newActiveFilters);

    if (view.columns && view.columns.length > 0) {
      setVisibleColumns(view.columns);
    }

    if (view.sort && 'field' in view.sort && view.sort.field) {
      setSort(view.sort.field);
      setOrder(view.sort.order);
    }

    setPage(1);
    setViewDropdownOpen(false);
  };

  const hasActiveFilters = filters.length > 0 || !!search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <RecordCount
            filtered={meta.total}
            total={meta.totalCount ?? meta.total}
            hasFilters={hasActiveFilters}
          />
        </div>
        <div className="flex items-center gap-2">
          <ColumnPicker
            columns={ALL_COLUMNS}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
          />

          {/* Saved Views dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
              className="gap-1.5"
            >
              Views
              <ChevronDown className="h-4 w-4" />
            </Button>
            {viewDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-2 shadow-md">
                <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                  Saved Views
                </p>
                {savedViews && savedViews.length > 0 ? (
                  savedViews.map((view) => (
                    <button
                      key={view.id}
                      type="button"
                      onClick={() => handleApplyView(view)}
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      {view.name}
                      {view.isDefault && (
                        <span className="ml-1 text-xs text-muted-foreground">(default)</span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">No saved views</p>
                )}
                <div className="mt-1 border-t pt-1">
                  <button
                    type="button"
                    onClick={handleSaveView}
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Current View
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Company
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Company</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyForm
              onSubmit={handleCreateSubmit}
              isSubmitting={createCompany.isPending}
              submitLabel="Create Company"
              onCancel={() => setShowCreateForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Filter bar */}
      <FilterBar
        fields={COMPANY_FILTER_FIELDS}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        searchPlaceholder="Search companies..."
        initialSearch={search}
        initialFilters={filters}
      />

      {/* Table */}
      <CompaniesTable
        companies={companies}
        loading={isLoading}
        visibleColumns={visibleColumns}
        sort={sort}
        order={order}
        onSort={handleSort}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} companies
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
