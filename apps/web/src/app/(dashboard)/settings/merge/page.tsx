'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useContactDuplicates,
  useMergeContacts,
  useCompanyDuplicates,
  useMergeCompanies,
} from '@/hooks/use-merge';

type ContactPair = {
  contact1: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    leadStatus?: string;
  };
  contact2: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    leadStatus?: string;
  };
  matchType: string;
};

type CompanyPair = {
  company1: {
    id: string;
    name: string;
    domain?: string;
    industry?: string;
    phone?: string;
    size?: string;
  };
  company2: {
    id: string;
    name: string;
    domain?: string;
    industry?: string;
    phone?: string;
    size?: string;
  };
  matchType: string;
};

export default function MergeDedupPage() {
  const [tab, setTab] = useState<'contacts' | 'companies'>('contacts');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Merge &amp; Dedup</h1>
        <p className="text-muted-foreground mt-1">
          Find and merge duplicate records to keep your data clean.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-0">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'contacts'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('contacts')}
        >
          Contacts
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'companies'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('companies')}
        >
          Companies
        </button>
      </div>

      {tab === 'contacts' ? <ContactDuplicates /> : <CompanyDuplicates />}
    </div>
  );
}

function ContactDuplicates() {
  const { data, refetch, isFetching, isSuccess } = useContactDuplicates();
  const mergeMutation = useMergeContacts();
  const pairs: ContactPair[] = (data as any)?.pairs ?? [];

  return (
    <div className="space-y-4">
      <Button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Scanning...' : 'Scan for Duplicates'}
      </Button>

      {isSuccess && pairs.length === 0 && (
        <p className="text-muted-foreground text-sm">No duplicates found.</p>
      )}

      {pairs.map((pair, i) => (
        <Card key={`${pair.contact1.id}-${pair.contact2.id}`} className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-md border">
              <p className="font-medium">
                {pair.contact1.firstName} {pair.contact1.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {pair.contact1.email || 'No email'}
              </p>
              <p className="text-sm text-muted-foreground">
                {pair.contact1.phone || 'No phone'}
              </p>
              {pair.contact1.jobTitle && (
                <p className="text-sm text-muted-foreground">
                  {pair.contact1.jobTitle}
                </p>
              )}
              <Button
                size="sm"
                className="mt-3"
                disabled={mergeMutation.isPending}
                onClick={() =>
                  mergeMutation.mutate({
                    keepId: pair.contact1.id,
                    mergeId: pair.contact2.id,
                  })
                }
              >
                Keep This
              </Button>
            </div>
            <div className="p-4 rounded-md border">
              <p className="font-medium">
                {pair.contact2.firstName} {pair.contact2.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {pair.contact2.email || 'No email'}
              </p>
              <p className="text-sm text-muted-foreground">
                {pair.contact2.phone || 'No phone'}
              </p>
              {pair.contact2.jobTitle && (
                <p className="text-sm text-muted-foreground">
                  {pair.contact2.jobTitle}
                </p>
              )}
              <Button
                size="sm"
                className="mt-3"
                disabled={mergeMutation.isPending}
                onClick={() =>
                  mergeMutation.mutate({
                    keepId: pair.contact2.id,
                    mergeId: pair.contact1.id,
                  })
                }
              >
                Keep This
              </Button>
            </div>
          </div>
          <Badge variant="secondary" className="mt-3">
            {pair.matchType} match
          </Badge>
        </Card>
      ))}
    </div>
  );
}

function CompanyDuplicates() {
  const { data, refetch, isFetching, isSuccess } = useCompanyDuplicates();
  const mergeMutation = useMergeCompanies();
  const pairs: CompanyPair[] = (data as any)?.pairs ?? [];

  return (
    <div className="space-y-4">
      <Button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Scanning...' : 'Scan for Duplicates'}
      </Button>

      {isSuccess && pairs.length === 0 && (
        <p className="text-muted-foreground text-sm">No duplicates found.</p>
      )}

      {pairs.map((pair, i) => (
        <Card key={`${pair.company1.id}-${pair.company2.id}`} className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-md border">
              <p className="font-medium">{pair.company1.name}</p>
              <p className="text-sm text-muted-foreground">
                {pair.company1.domain || 'No domain'}
              </p>
              <p className="text-sm text-muted-foreground">
                {pair.company1.industry || 'No industry'}
              </p>
              <p className="text-sm text-muted-foreground">
                {pair.company1.phone || 'No phone'}
              </p>
              <Button
                size="sm"
                className="mt-3"
                disabled={mergeMutation.isPending}
                onClick={() =>
                  mergeMutation.mutate({
                    keepId: pair.company1.id,
                    mergeId: pair.company2.id,
                  })
                }
              >
                Keep This
              </Button>
            </div>
            <div className="p-4 rounded-md border">
              <p className="font-medium">{pair.company2.name}</p>
              <p className="text-sm text-muted-foreground">
                {pair.company2.domain || 'No domain'}
              </p>
              <p className="text-sm text-muted-foreground">
                {pair.company2.industry || 'No industry'}
              </p>
              <p className="text-sm text-muted-foreground">
                {pair.company2.phone || 'No phone'}
              </p>
              <Button
                size="sm"
                className="mt-3"
                disabled={mergeMutation.isPending}
                onClick={() =>
                  mergeMutation.mutate({
                    keepId: pair.company2.id,
                    mergeId: pair.company1.id,
                  })
                }
              >
                Keep This
              </Button>
            </div>
          </div>
          <Badge variant="secondary" className="mt-3">
            {pair.matchType} match
          </Badge>
        </Card>
      ))}
    </div>
  );
}
