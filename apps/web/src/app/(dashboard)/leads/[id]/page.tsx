'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneDisplay } from '@/components/ui/phone-display';
import {
  useLead,
  useUpdateLead,
  useDeleteLead,
} from '@/hooks/use-leads';
import { LeadForm } from '../components/lead-form';
import { ConvertLeadDialog } from '../components/convert-lead-dialog';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  unqualified: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: lead, isLoading } = useLead(id);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [isEditing, setIsEditing] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  const handleUpdate = async (formData: {
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
    await updateLead.mutateAsync({ id, data: formData });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this lead? This action cannot be undone.',
      )
    ) {
      await deleteLead.mutateAsync(id);
      router.push('/leads');
    }
  };

  const handleConvertSuccess = (contactId: string) => {
    setShowConvertDialog(false);
    router.push(`/contacts/${contactId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
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
    );
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/leads')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>
        <p className="text-muted-foreground">Lead not found.</p>
      </div>
    );
  }

  const isConverted = !!lead.convertedAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {lead.firstName} {lead.lastName}
          </h1>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status] ?? ''}`}>
            {lead.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isConverted && (
            <Button
              size="sm"
              onClick={() => setShowConvertDialog(true)}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Convert Lead
            </Button>
          )}
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
            disabled={deleteLead.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm
              initialData={lead}
              onSubmit={handleUpdate}
              isLoading={updateLead.isPending}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Lead Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                    <dd className="mt-1 text-sm">
                      {lead.firstName} {lead.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                    <dd className="mt-1 text-sm">{lead.email ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                    <dd className="mt-1 text-sm">
                      <PhoneDisplay phone={lead.phone} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Company</dt>
                    <dd className="mt-1 text-sm">{lead.companyName ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Job Title</dt>
                    <dd className="mt-1 text-sm">{lead.jobTitle ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Source</dt>
                    <dd className="mt-1 text-sm">{lead.source ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Score</dt>
                    <dd className="mt-1 text-sm">{lead.score}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                    <dd className="mt-1 text-sm">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  {lead.notes && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                      <dd className="mt-1 text-sm whitespace-pre-wrap">{lead.notes}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                {isConverted ? (
                  <div className="space-y-3">
                    <p className="text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS.converted}`}>
                        Converted
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {lead.convertedAt
                          ? new Date(lead.convertedAt).toLocaleDateString()
                          : ''}
                      </span>
                    </p>
                    {lead.convertedContact && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Contact</dt>
                        <dd className="mt-1">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() =>
                              router.push(`/contacts/${lead.convertedContact!.id}`)
                            }
                          >
                            {lead.convertedContact.firstName} {lead.convertedContact.lastName}
                          </Button>
                        </dd>
                      </div>
                    )}
                    {lead.convertedDeal && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Deal</dt>
                        <dd className="mt-1">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() =>
                              router.push(`/deals/${lead.convertedDeal!.id}`)
                            }
                          >
                            {lead.convertedDeal.name}
                          </Button>
                        </dd>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Not yet converted. Use the &quot;Convert Lead&quot; button to create a Contact.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Convert Dialog */}
      <ConvertLeadDialog
        leadId={id}
        leadName={`${lead.firstName} ${lead.lastName}`}
        open={showConvertDialog}
        onClose={() => setShowConvertDialog(false)}
        onSuccess={handleConvertSuccess}
      />
    </div>
  );
}
