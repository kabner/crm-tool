'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableTableHeader } from '@/components/sortable-table-header';
import { FavoriteButton } from '@/components/favorite-button';
import { InlineEditCell } from '@/components/inline-edit-cell';
import type { Contact } from '@/hooks/use-contacts';
import { useUpdateContact } from '@/hooks/use-contacts';
import { useContactTypes } from '@/hooks/use-contact-types';

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

interface ContactsTableProps {
  contacts: Contact[];
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
  { key: 'name', label: 'Name', sortField: 'firstName' },
  { key: 'email', label: 'Email', sortField: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'lifecycleStage', label: 'Lifecycle Stage' },
  { key: 'leadStatus', label: 'Lead Status', sortField: 'leadStatus' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdAt', label: 'Created At', sortField: 'createdAt' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'tags', label: 'Tags' },
  { key: 'source', label: 'Source', sortField: 'source' },
  { key: 'contactType', label: 'Contact Type' },
];

const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'open_deal', label: 'Open Deal' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'attempted_to_contact', label: 'Attempted to Contact' },
  { value: 'connected', label: 'Connected' },
  { value: 'bad_timing', label: 'Bad Timing' },
];

export function ContactsTable({
  contacts,
  loading,
  visibleColumns,
  sort,
  order,
  onSort,
  favoriteIds,
  onToggleFavorite,
  onRowClick,
}: ContactsTableProps) {
  const { data: contactTypes } = useContactTypes();
  const updateContact = useUpdateContact();
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

  if (contacts.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-border">
        <p className="text-sm text-muted-foreground">No contacts found</p>
      </div>
    );
  }

  function renderCell(contact: Contact, colKey: string) {
    switch (colKey) {
      case 'favorite':
        return (
          <FavoriteButton
            isFavorite={favoriteIds.has(contact.id)}
            onToggle={() => onToggleFavorite(contact.id)}
          />
        );
      case 'name':
        return (
          <span className="font-medium">
            {contact.firstName} {contact.lastName}
          </span>
        );
      case 'email':
        return (
          <InlineEditCell
            value={contact.email ?? null}
            onSave={(v) => updateContact.mutate({ id: contact.id, data: { email: v } })}
          />
        );
      case 'phone':
        return (
          <InlineEditCell
            value={contact.phone ?? null}
            onSave={(v) => updateContact.mutate({ id: contact.id, data: { phone: v } })}
          />
        );
      case 'company':
        return (
          <span className="text-muted-foreground">
            {contact.company?.name ?? '-'}
          </span>
        );
      case 'lifecycleStage': {
        const stage = contact.company?.lifecycleStage;
        if (!stage) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant={LIFECYCLE_STAGE_VARIANT[stage] ?? 'outline'}>
            {stage}
          </Badge>
        );
      }
      case 'leadStatus':
        return (
          <InlineEditCell
            value={contact.leadStatus ?? null}
            onSave={(v) => updateContact.mutate({ id: contact.id, data: { leadStatus: v } })}
            type="select"
            options={LEAD_STATUSES}
          />
        );
      case 'createdBy':
        return (
          <span className="text-muted-foreground">
            {contact.createdBy
              ? `${contact.createdBy.firstName} ${contact.createdBy.lastName}`
              : 'System'}
          </span>
        );
      case 'createdAt':
        return (
          <span className="text-muted-foreground">
            {new Date(contact.createdAt).toLocaleDateString()}
          </span>
        );
      case 'jobTitle':
        return (
          <InlineEditCell
            value={contact.jobTitle ?? null}
            onSave={(v) => updateContact.mutate({ id: contact.id, data: { jobTitle: v } })}
          />
        );
      case 'tags':
        return contact.tags && contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      case 'source':
        return (
          <span className="text-muted-foreground">
            {contact.source ?? '-'}
          </span>
        );
      case 'contactType': {
        const ctOptions = (contactTypes ?? []).map((t) => ({ value: t.name, label: t.name }));
        return (
          <InlineEditCell
            value={contact.contactType ?? null}
            onSave={(v) => updateContact.mutate({ id: contact.id, data: { contactType: v } })}
            type="select"
            options={ctOptions}
          />
        );
      }
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
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              onClick={() => onRowClick(contact.id)}
              className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
            >
              {activeCols.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {renderCell(contact, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
