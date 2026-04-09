'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Pencil,
  Trash2,
  Users,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneDisplay } from '@/components/ui/phone-display';
import { FavoriteButton } from '@/components/favorite-button';
import {
  useCompany,
  useCompanyContacts,
  useUpdateCompany,
  useDeleteCompany,
  useAddContactToCompany,
  useRemoveContactFromCompany,
} from '@/hooks/use-companies';
import { useContacts } from '@/hooks/use-contacts';
import { useFavorites, useToggleFavorite } from '@/hooks/use-favorites';
import { CompanyForm, type CompanyFormValues } from '../components/company-form';
import { AttachmentsPanel } from '@/components/attachments-panel';
import { VisibilityBadge } from '@/components/visibility-badge';

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

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [debouncedContactSearch, setDebouncedContactSearch] = useState('');

  const { data: company, isLoading } = useCompany(id);
  const { data: contacts, isLoading: contactsLoading } =
    useCompanyContacts(id);
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const addContact = useAddContactToCompany();
  const removeContact = useRemoveContactFromCompany();
  const { data: favorites } = useFavorites('company');
  const toggleFavorite = useToggleFavorite();

  const { data: searchResults } = useContacts({
    search: debouncedContactSearch || undefined,
    limit: 10,
  });

  const [debounceTimer] = useState<{ current: ReturnType<typeof setTimeout> | null }>({ current: null });

  const favoriteIds = useMemo(() => {
    if (!favorites) return new Set<string>();
    return new Set(favorites.map((f) => f.entityId));
  }, [favorites]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite.mutate({ entityType: 'company', entityId: id });
  }, [toggleFavorite, id]);

  const handleContactSearchChange = useCallback(
    (value: string) => {
      setContactSearch(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setDebouncedContactSearch(value);
      }, 300);
    },
    [debounceTimer],
  );

  const handleAddContact = async (contactId: string) => {
    await addContact.mutateAsync({ companyId: id, contactId });
    setShowAddContact(false);
    setContactSearch('');
    setDebouncedContactSearch('');
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!confirm('Remove this contact from the company?')) return;
    await removeContact.mutateAsync({ companyId: id, contactId });
  };

  const existingContactIds = new Set(contacts?.map((c) => c.id) ?? []);

  const handleUpdate = async (values: CompanyFormValues) => {
    await updateCompany.mutateAsync({ id, data: values });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    await deleteCompany.mutateAsync(id);
    router.push('/companies');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/companies')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>
        <p className="text-muted-foreground">Company not found.</p>
      </div>
    );
  }

  const address = company.address;
  const formattedAddress = address
    ? [address.street, address.city, address.state, address.zip, address.country]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/companies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          {company.visibility && company.visibility !== 'everyone' && (
            <VisibilityBadge visibility={company.visibility} />
          )}
          <FavoriteButton
            isFavorite={favoriteIds.has(id)}
            onToggle={handleToggleFavorite}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteCompany.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Company</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyForm
              defaultValues={{
                name: company.name,
                domain: company.domain ?? '',
                industry: company.industry ?? '',
                size: company.size ?? '',
                phone: company.phone ?? '',
                lifecycleStage: company.lifecycleStage ?? '',
                address: company.address ?? undefined,
              }}
              onSubmit={handleUpdate}
              isSubmitting={updateCompany.isPending}
              submitLabel="Update Company"
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Company Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{company.name}</CardTitle>
                  {company.industry && (
                    <Badge variant="secondary" className="mt-1">
                      {company.industry}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {company.domain && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Domain
                    </dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {company.domain}
                      </a>
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm">
                    <PhoneDisplay phone={company.phone} />
                  </dd>
                </div>

                {formattedAddress && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Address
                    </dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{formattedAddress}</span>
                    </dd>
                  </div>
                )}

                {company.size && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Size
                    </dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{company.size} employees</span>
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Lifecycle Stage
                  </dt>
                  <dd className="mt-1">
                    {company.lifecycleStage ? (
                      <Badge
                        variant={
                          LIFECYCLE_STAGE_VARIANT[company.lifecycleStage] ?? 'outline'
                        }
                      >
                        {company.lifecycleStage}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Created By
                  </dt>
                  <dd className="mt-1 text-sm">
                    {company.createdBy
                      ? `${company.createdBy.firstName} ${company.createdBy.lastName}`
                      : 'System'}
                  </dd>
                </div>

                {company.parent && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Parent Company
                    </dt>
                    <dd className="mt-1 text-sm">
                      <Link
                        href={`/companies/${company.parent.id}`}
                        className="text-primary hover:underline"
                      >
                        {company.parent.name}
                      </Link>
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Created
                  </dt>
                  <dd className="mt-1 text-sm">
                    {format(new Date(company.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Updated
                  </dt>
                  <dd className="mt-1 text-sm">
                    {format(new Date(company.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Associated Contacts */}
          <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Contacts
                  {company.contactsCount !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {company.contactsCount}
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddContact(!showAddContact)}
                >
                  {showAddContact ? (
                    <>
                      <X className="mr-1 h-3 w-3" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Contact
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Add contact search */}
              {showAddContact && (
                <div className="mb-4 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts by name or email..."
                      value={contactSearch}
                      onChange={(e) => handleContactSearchChange(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  {debouncedContactSearch && searchResults?.data && (
                    <ul className="max-h-40 overflow-y-auto rounded-md border border-border">
                      {searchResults.data
                        .filter((c) => !existingContactIds.has(c.id))
                        .map((contact) => (
                          <li key={contact.id}>
                            <button
                              className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                              onClick={() => handleAddContact(contact.id)}
                              disabled={addContact.isPending}
                            >
                              <span className="font-medium">
                                {contact.firstName} {contact.lastName}
                              </span>
                              {contact.email && (
                                <span className="text-xs text-muted-foreground">
                                  {contact.email}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      {searchResults.data.filter((c) => !existingContactIds.has(c.id)).length === 0 && (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                          No matching contacts found.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              {contactsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : contacts && contacts.length > 0 ? (
                <ul className="space-y-3">
                  {contacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex items-start justify-between rounded-md border border-border p-3 text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </span>
                        {contact.email && (
                          <span className="text-muted-foreground">
                            {contact.email}
                          </span>
                        )}
                        {contact.jobTitle && (
                          <span className="text-xs text-muted-foreground">
                            {contact.jobTitle}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveContact(contact.id)}
                        className="ml-2 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove from company"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No contacts associated with this company.
                </p>
              )}
            </CardContent>
          </Card>
          <AttachmentsPanel entityType="company" entityId={company.id} />
          </div>
        </div>
      )}
    </div>
  );
}
