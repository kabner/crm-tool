'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterBar, type ActiveFilter, type FilterField } from '@/components/filter-bar/filter-bar';
import { RecordCount } from '@/components/record-count';
import { ColumnPicker, type ColumnDef } from '@/components/column-picker';
import { LeadsTable } from './components/leads-table';
import { LeadForm } from './components/lead-form';
import { useLeads, useCreateLead } from '@/hooks/use-leads';
import { ScanCardDialog } from '@/components/scan-card-dialog';

const LEAD_FILTER_FIELDS: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'New', value: 'new' },
      { label: 'Contacted', value: 'contacted' },
      { label: 'Qualified', value: 'qualified' },
      { label: 'Unqualified', value: 'unqualified' },
      { label: 'Converted', value: 'converted' },
    ],
  },
  { key: 'source', label: 'Source', type: 'text' },
  { key: 'ownerId', label: 'Owner ID', type: 'text' },
];

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'phone', label: 'Phone', defaultVisible: true },
  { key: 'company', label: 'Company', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'source', label: 'Source', defaultVisible: true },
  { key: 'score', label: 'Score', defaultVisible: true },
  { key: 'createdAt', label: 'Created At', defaultVisible: true },
];

const DEFAULT_VISIBLE = ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);

export default function LeadsPage() {
  const router = useRouter();

  // Scan card state
  const [scanOpen, setScanOpen] = useState(false);
  const [scannedData, setScannedData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    jobTitle?: string;
  } | null>(null);

  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE);

  // Build API filters from active filters
  const apiFilters = useMemo(() => {
    const result: Record<string, string> = {};
    for (const f of filters) {
      result[f.key] = f.value;
    }
    return result;
  }, [filters]);

  const { data, isLoading } = useLeads({
    page,
    limit: 20,
    search: search || undefined,
    sort,
    order,
    ...apiFilters,
  });

  const createLead = useCreateLead();

  const leads = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback((newFilters: ActiveFilter[]) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

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

  const handleRowClick = useCallback(
    (id: string) => {
      router.push(`/leads/${id}`);
    },
    [router],
  );

  const handleCreateSubmit = async (formData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    companyName?: string;
    jobTitle?: string;
    source?: string;
    status?: string;
    notes?: string;
  }) => {
    await createLead.mutateAsync(formData);
    setShowCreateForm(false);
    setScannedData(null);
  };

  const hasActiveFilters = filters.length > 0 || !!search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <RecordCount
            filtered={meta.total}
            total={meta.total}
            hasFilters={hasActiveFilters}
          />
        </div>
        <div className="flex items-center gap-2">
          <ColumnPicker
            columns={ALL_COLUMNS}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
          />

          <Button
            variant="outline"
            onClick={() => setScanOpen(true)}
          >
            <Camera className="mr-2 h-4 w-4" />
            Scan Card
          </Button>

          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Lead
              </>
            )}
          </Button>
        </div>
      </div>

      <ScanCardDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        onResult={(data) => {
          setScannedData(data);
          setShowCreateForm(true);
        }}
      />

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm
              initialData={scannedData ?? undefined}
              onSubmit={handleCreateSubmit}
              isLoading={createLead.isPending}
              onCancel={() => {
                setShowCreateForm(false);
                setScannedData(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Filter bar */}
      <FilterBar
        fields={LEAD_FILTER_FIELDS}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        searchPlaceholder="Search leads..."
        initialSearch={search}
        initialFilters={filters}
      />

      {/* Table */}
      <LeadsTable
        leads={leads}
        loading={isLoading}
        visibleColumns={visibleColumns}
        sort={sort}
        order={order}
        onSort={handleSort}
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} leads
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
