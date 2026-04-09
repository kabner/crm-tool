'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePipelines, type Pipeline } from '@/hooks/use-deals';
import { useConvertLead, type ConvertLeadInput } from '@/hooks/use-leads';

const convertSchema = z.object({
  createDeal: z.boolean().default(false),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  dealName: z.string().optional(),
  dealAmount: z.string().optional(),
  companyId: z.string().optional(),
});

type ConvertFormValues = z.infer<typeof convertSchema>;

interface ConvertLeadDialogProps {
  leadId: string;
  leadName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (contactId: string) => void;
}

export function ConvertLeadDialog({
  leadId,
  leadName,
  open,
  onClose,
  onSuccess,
}: ConvertLeadDialogProps) {
  const convertLead = useConvertLead();
  const { data: pipelines } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<ConvertFormValues>({
    resolver: zodResolver(convertSchema),
    defaultValues: {
      createDeal: false,
      pipelineId: '',
      stageId: '',
      dealName: '',
      dealAmount: '',
      companyId: '',
    },
  });

  const createDeal = watch('createDeal');
  const pipelineId = watch('pipelineId');

  // Update selected pipeline when pipelineId changes
  useEffect(() => {
    if (pipelineId && pipelines) {
      const pipeline = pipelines.find((p) => p.id === pipelineId);
      setSelectedPipeline(pipeline ?? null);
      // Auto-select first stage
      if (pipeline?.stages && pipeline.stages.length > 0) {
        setValue('stageId', pipeline.stages[0]!.id);
      }
    } else {
      setSelectedPipeline(null);
    }
  }, [pipelineId, pipelines, setValue]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset();
      setSelectedPipeline(null);
    }
  }, [open, reset]);

  async function onSubmit(values: ConvertFormValues) {
    const data: ConvertLeadInput = {};

    if (values.createDeal) {
      data.createDeal = true;
      data.pipelineId = values.pipelineId;
      data.stageId = values.stageId;
      if (values.dealName) data.dealName = values.dealName;
      if (values.dealAmount) data.dealAmount = parseFloat(values.dealAmount);
    }

    if (values.companyId) {
      data.companyId = values.companyId;
    }

    const result = await convertLead.mutateAsync({ id: leadId, data });
    onSuccess(result.contact.id);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Convert Lead</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Convert &quot;{leadName}&quot; into a Contact. Optionally create a Deal.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Create Deal checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createDeal"
              {...register('createDeal')}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="createDeal">Also create a deal</Label>
          </div>

          {/* Deal fields (shown only if createDeal) */}
          {createDeal && (
            <div className="space-y-4 rounded-md border border-border p-4">
              <div className="space-y-2">
                <Label htmlFor="pipelineId">Pipeline *</Label>
                <select
                  id="pipelineId"
                  {...register('pipelineId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select pipeline...</option>
                  {pipelines?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPipeline?.stages && (
                <div className="space-y-2">
                  <Label htmlFor="stageId">Stage *</Label>
                  <select
                    id="stageId"
                    {...register('stageId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {selectedPipeline.stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dealName">Deal Name</Label>
                <Input
                  id="dealName"
                  placeholder="Leave empty for auto-generated name"
                  {...register('dealName')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dealAmount">Deal Amount</Label>
                <Input
                  id="dealAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('dealAmount')}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={convertLead.isPending}>
              {convertLead.isPending ? 'Converting...' : 'Convert'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
