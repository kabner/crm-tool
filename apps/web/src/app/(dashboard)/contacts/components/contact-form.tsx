"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  lifecycleStage: z.string().optional(),
  leadStatus: z.string().optional(),
  tags: z.string().optional(),
  source: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const LIFECYCLE_STAGES = [
  { value: "", label: "Select stage..." },
  { value: "subscriber", label: "Subscriber" },
  { value: "lead", label: "Lead" },
  { value: "mql", label: "Marketing Qualified Lead" },
  { value: "sql", label: "Sales Qualified Lead" },
  { value: "opportunity", label: "Opportunity" },
  { value: "customer", label: "Customer" },
  { value: "evangelist", label: "Evangelist" },
];

const LEAD_STATUSES = [
  { value: "", label: "Select status..." },
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "open_deal", label: "Open Deal" },
  { value: "unqualified", label: "Unqualified" },
  { value: "attempted_to_contact", label: "Attempted to Contact" },
  { value: "connected", label: "Connected" },
  { value: "bad_timing", label: "Bad Timing" },
];

interface ContactFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
    lifecycleStage?: string;
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
    lifecycleStage?: string;
    leadStatus?: string;
    tags?: string[];
    source?: string;
  }) => void;
  isLoading?: boolean;
}

export function ContactForm({
  initialData,
  onSubmit,
  isLoading,
}: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      jobTitle: initialData?.jobTitle ?? "",
      lifecycleStage: initialData?.lifecycleStage ?? "",
      leadStatus: initialData?.leadStatus ?? "",
      tags: initialData?.tags?.join(", ") ?? "",
      source: initialData?.source ?? "",
    },
  });

  function handleFormSubmit(values: ContactFormValues) {
    const tags = values.tags
      ? values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || undefined,
      phone: values.phone || undefined,
      jobTitle: values.jobTitle || undefined,
      lifecycleStage: values.lifecycleStage || undefined,
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
            {...register("firstName")}
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            aria-invalid={!!errors.lastName}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input id="jobTitle" {...register("jobTitle")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lifecycleStage">Lifecycle Stage</Label>
          <select
            id="lifecycleStage"
            {...register("lifecycleStage")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {LIFECYCLE_STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="leadStatus">Lead Status</Label>
          <select
            id="leadStatus"
            {...register("leadStatus")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" placeholder="e.g. vip, enterprise" {...register("tags")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Source</Label>
        <Input id="source" placeholder="e.g. website, referral" {...register("source")} />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Contact" : "Create Contact"}
        </Button>
      </div>
    </form>
  );
}
