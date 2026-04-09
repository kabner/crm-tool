'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  phone: z.string().optional(),
  lifecycleStage: z.string().optional(),
  visibility: z.enum(['everyone', 'owner', 'private']).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Media',
  'Energy',
  'Consulting',
  'Transportation',
  'Agriculture',
  'Hospitality',
  'Telecommunications',
  'Other',
];

const SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10001+',
];

const LIFECYCLE_STAGES = [
  { value: '', label: 'Select stage...' },
  { value: 'subscriber', label: 'Subscriber' },
  { value: 'lead', label: 'Lead' },
  { value: 'mql', label: 'MQL' },
  { value: 'sql', label: 'SQL' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'customer', label: 'Customer' },
  { value: 'evangelist', label: 'Evangelist' },
];

interface CompanyFormProps {
  defaultValues?: Partial<CompanyFormValues>;
  onSubmit: (values: CompanyFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function CompanyForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save',
  onCancel,
}: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      domain: '',
      industry: '',
      size: '',
      phone: '',
      lifecycleStage: '',
      visibility: 'everyone',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      },
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Acme Inc."
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            placeholder="acme.com"
            {...register('domain')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <select
            id="industry"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register('industry')}
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Company Size</Label>
          <select
            id="size"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register('size')}
          >
            <option value="">Select size</option>
            {SIZES.map((size) => (
              <option key={size} value={size}>
                {size} employees
              </option>
            ))}
          </select>
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

        <div className="space-y-2">
          <Label htmlFor="lifecycleStage">Lifecycle Stage</Label>
          <select
            id="lifecycleStage"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register('lifecycleStage')}
          >
            {LIFECYCLE_STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register('visibility')}
          >
            <option value="everyone">Everyone</option>
            <option value="owner">Only Me &amp; Owner</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              placeholder="123 Main St"
              {...register('address.street')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="San Francisco"
              {...register('address.city')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="CA"
              {...register('address.state')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              placeholder="94102"
              {...register('address.zip')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="United States"
              {...register('address.country')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
