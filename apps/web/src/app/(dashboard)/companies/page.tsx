"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompanies, useCreateCompany } from "@/hooks/use-companies";
import { CompaniesTable } from "./components/companies-table";
import { CompanyForm, type CompanyFormValues } from "./components/company-form";

const INDUSTRIES = [
  "All",
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Energy",
  "Real Estate",
  "Media",
  "Consulting",
  "Other",
] as const;

const COMPANY_SIZES = [
  "All",
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10001+",
] as const;

export default function CompaniesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filters
  const [industry, setIndustry] = useState("All");
  const [size, setSize] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("");

  const { data, isLoading } = useCompanies({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    sort: "createdAt",
    order: "DESC",
    industry: industry !== "All" ? industry : undefined,
    size: size !== "All" ? size : undefined,
    ownerId: ownerFilter || undefined,
  });

  const createCompany = useCreateCompany();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);
      setPage(1);
      // Simple debounce using setTimeout
      const timer = setTimeout(() => {
        setDebouncedSearch(value);
      }, 300);
      return () => clearTimeout(timer);
    },
    [],
  );

  const handleCreate = async (values: CompanyFormValues) => {
    const company = await createCompany.mutateAsync(values);
    setShowCreateForm(false);
    router.push(`/companies/${company.id}`);
  };

  const companies = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Manage your company records and associations.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Company
        </Button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">New Company</h2>
          <CompanyForm
            onSubmit={handleCreate}
            isSubmitting={createCompany.isPending}
            submitLabel="Create Company"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies by name or domain..."
            value={search}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind === "All" ? "All Industries" : ind}
              </option>
            ))}
          </select>

          <select
            value={size}
            onChange={(e) => { setSize(e.target.value); setPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Sizes" : s}
              </option>
            ))}
          </select>

          <Input
            placeholder="Owner ID..."
            value={ownerFilter}
            onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
            className="w-40"
          />

          {(industry !== "All" || size !== "All" || ownerFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIndustry("All");
                setSize("All");
                setOwnerFilter("");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <CompaniesTable companies={companies} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {companies.length} of {meta.total} companies
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
