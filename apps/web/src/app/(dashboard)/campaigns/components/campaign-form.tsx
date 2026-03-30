"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CAMPAIGN_TYPES = [
  { value: "email", label: "Email" },
  { value: "content", label: "Content" },
  { value: "paid", label: "Paid" },
  { value: "event", label: "Event" },
  { value: "abm", label: "ABM" },
];

interface CampaignFormProps {
  initialData?: {
    name?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    ownerId?: string;
  };
  onSubmit: (data: {
    name: string;
    type: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    ownerId?: string;
  }) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
}

export function CampaignForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel = "Create Campaign",
}: CampaignFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState(initialData?.type ?? "email");
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? initialData.startDate.slice(0, 10) : "",
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? initialData.endDate.slice(0, 10) : "",
  );
  const [budget, setBudget] = useState(
    initialData?.budget != null ? String(initialData.budget) : "",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      type,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      budget: budget ? parseFloat(budget) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campaign name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CAMPAIGN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">Budget</Label>
        <Input
          id="budget"
          type="number"
          step="0.01"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !name}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
