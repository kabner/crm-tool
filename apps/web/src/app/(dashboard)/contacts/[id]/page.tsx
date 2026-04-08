'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneDisplay } from '@/components/ui/phone-display';
import { FavoriteButton } from '@/components/favorite-button';
import {
  useContact,
  useUpdateContact,
  useDeleteContact,
} from '@/hooks/use-contacts';
import { useFavorites, useToggleFavorite } from '@/hooks/use-favorites';
import { ContactForm } from '../components/contact-form';

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

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: contact, isLoading } = useContact(id);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { data: favorites } = useFavorites('contact');
  const toggleFavorite = useToggleFavorite();

  const [isEditing, setIsEditing] = useState(false);

  const favoriteIds = useMemo(() => {
    if (!favorites) return new Set<string>();
    return new Set(favorites.map((f) => f.entityId));
  }, [favorites]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite.mutate({ entityType: 'contact', entityId: id });
  }, [toggleFavorite, id]);

  const handleUpdate = async (formData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    companyId: string;
    leadStatus?: string;
    tags?: string[];
    source?: string;
  }) => {
    await updateContact.mutateAsync({ id, data: formData });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this contact? This action cannot be undone.',
      )
    ) {
      await deleteContact.mutateAsync(id);
      router.push('/contacts');
    }
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

  if (!contact) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/contacts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
        <p className="text-muted-foreground">Contact not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/contacts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {contact.firstName} {contact.lastName}
          </h1>
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
            disabled={deleteContact.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm
              initialData={contact}
              onSubmit={handleUpdate}
              isLoading={updateContact.isPending}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Name
                    </dt>
                    <dd className="mt-1 text-sm">
                      {contact.firstName} {contact.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Email
                    </dt>
                    <dd className="mt-1 text-sm">{contact.email ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Phone
                    </dt>
                    <dd className="mt-1 text-sm">
                      <PhoneDisplay phone={contact.phone} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Job Title
                    </dt>
                    <dd className="mt-1 text-sm">
                      {contact.jobTitle ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Company
                    </dt>
                    <dd className="mt-1 text-sm">
                      {contact.company?.name ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Lifecycle Stage
                    </dt>
                    <dd className="mt-1">
                      {contact.company?.lifecycleStage ? (
                        <Badge
                          variant={
                            LIFECYCLE_STAGE_VARIANT[contact.company.lifecycleStage] ?? 'outline'
                          }
                        >
                          {contact.company.lifecycleStage}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </dd>
                  </div>
                  {contact.contactType && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Contact Type
                      </dt>
                      <dd className="mt-1">
                        <Badge variant="outline">{contact.contactType}</Badge>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Lead Status
                    </dt>
                    <dd className="mt-1 text-sm">
                      {contact.leadStatus ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Created By
                    </dt>
                    <dd className="mt-1 text-sm">
                      {contact.createdBy
                        ? `${contact.createdBy.firstName} ${contact.createdBy.lastName}`
                        : 'System'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Source
                    </dt>
                    <dd className="mt-1 text-sm">{contact.source ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Created
                    </dt>
                    <dd className="mt-1 text-sm">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-muted-foreground">
                        Tags
                      </dt>
                      <dd className="mt-1 flex flex-wrap gap-1">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No activities yet
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
