'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { useCompanies } from '@/hooks/use-companies';
import { useContactTypes } from '@/hooks/use-contact-types';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  contactType: z.string().optional(),
  leadStatus: z.string().optional(),
  tags: z.string().optional(),
  source: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const LEAD_STATUSES = [
  { value: '', label: 'Select status...' },
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'open_deal', label: 'Open Deal' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'attempted_to_contact', label: 'Attempted to Contact' },
  { value: 'connected', label: 'Connected' },
  { value: 'bad_timing', label: 'Bad Timing' },
];

interface ContactFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
    companyId?: string | null;
    company?: { id: string; name: string } | null;
    contactType?: string | null;
    leadStatus?: string | null;
    tags?: string[];
    source?: string | null;
  };
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    companyId: string;
    contactType?: string;
    leadStatus?: string;
    tags?: string[];
    source?: string;
  }) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ContactForm({
  initialData,
  onSubmit,
  isLoading,
  onCancel,
}: ContactFormProps) {
  const { data: contactTypes } = useContactTypes();
  const [companySearch, setCompanySearch] = useState(initialData?.company?.name ?? '');

  const { data: companiesData } = useCompanies({
    search: companySearch || undefined,
    limit: 10,
  });

  const companies = companiesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: initialData?.firstName ?? '',
      lastName: initialData?.lastName ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      jobTitle: initialData?.jobTitle ?? '',
      companyId: initialData?.companyId ?? initialData?.company?.id ?? '',
      contactType: initialData?.contactType ?? '',
      leadStatus: initialData?.leadStatus ?? '',
      tags: initialData?.tags?.join(', ') ?? '',
      source: initialData?.source ?? '',
    },
  });

  function handleFormSubmit(values: ContactFormValues) {
    const tags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || undefined,
      phone: values.phone || undefined,
      jobTitle: values.jobTitle || undefined,
      companyId: values.companyId,
      contactType: values.contactType || undefined,
      leadStatus: values.leadStatus || undefined,
      tags,
      source: values.source || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            aria-invalid={!!errors.lastName}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput value={field.value ?? ''} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input id="jobTitle" {...register('jobTitle')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyId">Company *</Label>
          <div className="relative">
            <Input
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              aria-invalid={!!errors.companyId}
            />
            {companySearch && companies.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-md">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setValue('companyId', company.id);
                      setCompanySearch(company.name);
                    }}
                  >
                    {company.name}
                    {company.domain && (
                      <span className="ml-2 text-muted-foreground">{company.domain}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input type="hidden" {...register('companyId')} />
          {errors.companyId && (
            <p className="text-sm text-destructive">{errors.companyId.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactType">Contact Type</Label>
        <select
          id="contactType"
          {...register('contactType')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select type...</option>
          {(contactTypes ?? []).map((ct) => (
            <option key={ct.id} value={ct.name}>
              {ct.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leadStatus">Lead Status</Label>
        <select
          id="leadStatus"
          {...register('leadStatus')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" placeholder="e.g. vip, enterprise" {...register('tags')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Source</Label>
        <Input id="source" placeholder="e.g. website, referral" {...register('source')} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
}
