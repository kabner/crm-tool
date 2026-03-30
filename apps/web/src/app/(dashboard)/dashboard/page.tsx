"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Handshake,
  Mail,
  Ticket,
  DollarSign,
  TrendingUp,
  Target,
  UserPlus,
  Clock,
  ThumbsUp,
  Activity,
  Building2,
} from "lucide-react";
import { useOverviewAnalytics } from "@/hooks/use-analytics";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  href,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  href?: string;
}) {
  const card = (
    <Card className={href ? "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function SectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useOverviewAnalytics();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business performance.
          </p>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Failed to load analytics data. Please try again later.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your business performance.
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : data ? (
          <>
            <StatCard
              title="Total Contacts"
              value={formatNumber(data.totalContacts)}
              subtitle={`${formatNumber(data.totalCompanies)} companies`}
              icon={Users}
              iconColor="#3b82f6"
              href="/contacts"
            />
            <StatCard
              title="Open Deals"
              value={formatNumber(data.openDeals)}
              subtitle={`${formatCurrency(data.openDealsValue)} pipeline value`}
              icon={Handshake}
              iconColor="#8b5cf6"
              href="/deals"
            />
            <StatCard
              title="Activities This Month"
              value={formatNumber(data.activitiesThisMonth)}
              subtitle="Emails, calls, meetings"
              icon={Activity}
              iconColor="#10b981"
            />
            <StatCard
              title="Open Tickets"
              value={formatNumber(data.openTickets)}
              subtitle={
                data.service.csatScore > 0
                  ? `${data.service.csatScore}% CSAT`
                  : "No CSAT data yet"
              }
              icon={Ticket}
              iconColor="#f59e0b"
              href="/tickets"
            />
          </>
        ) : null}
      </div>

      {/* Sales Summary */}
      {isLoading ? (
        <SectionSkeleton />
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-sm text-muted-foreground">Total Deals</p>
                <p className="text-2xl font-bold">
                  {formatNumber(data.sales.totalDeals)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deals Won</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(data.sales.wonDeals)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{data.sales.winRate}%</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.sales.totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.sales.avgDealSize)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Marketing Summary */}
        {isLoading ? (
          <SectionSkeleton />
        ) : data ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <UserPlus className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Leads</p>
                    <p className="text-xl font-bold">
                      {formatNumber(data.marketing.newLeads)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      New Contacts
                    </p>
                    <p className="text-xl font-bold">
                      {formatNumber(data.marketing.newContacts)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Mail className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                    <p className="text-xl font-bold">
                      {formatNumber(data.marketing.emailsSent)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <Target className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Form Submissions
                    </p>
                    <p className="text-xl font-bold">
                      {formatNumber(data.marketing.formSubmissions)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Service Summary */}
        {isLoading ? (
          <SectionSkeleton />
        ) : data ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-amber-500" />
                Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Ticket className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Open Tickets
                    </p>
                    <p className="text-xl font-bold">
                      {formatNumber(data.service.openTickets)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tickets Resolved
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      {formatNumber(data.service.ticketsResolved)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avg Response Time
                    </p>
                    <p className="text-xl font-bold">
                      {data.service.avgResponseTime > 0
                        ? formatHours(data.service.avgResponseTime)
                        : "--"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <ThumbsUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CSAT Score</p>
                    <p className="text-xl font-bold">
                      {data.service.csatScore > 0
                        ? `${data.service.csatScore}%`
                        : "--"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
