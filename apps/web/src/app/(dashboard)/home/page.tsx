'use client';

import { useState, useCallback } from 'react';
import { useFeed, useToggleReaction } from '@/hooks/use-feed';
import type { FeedItem } from '@/hooks/use-feed';
import { FeedCard } from '@/components/feed/feed-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [mode, setMode] = useState<'all' | 'mine'>('all');
  const [pages, setPages] = useState(1);

  // Fetch all loaded pages
  const queries = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">Your activity feed</p>
        </div>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => { setMode('all'); setPages(1); }}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-l-lg transition-colors',
              mode === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            All
          </button>
          <button
            onClick={() => { setMode('mine'); setPages(1); }}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-r-lg transition-colors',
              mode === 'mine'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            My Updates
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {queries.map((page) => (
          <FeedPage
            key={`${mode}-${page}`}
            mode={mode}
            page={page}
            isLast={page === pages}
            onLoadMore={() => setPages((p) => p + 1)}
          />
        ))}
      </div>
    </div>
  );
}

function FeedPage({
  mode,
  page,
  isLast,
  onLoadMore,
}: {
  mode: 'all' | 'mine';
  page: number;
  isLast: boolean;
  onLoadMore: () => void;
}) {
  const { data, isLoading, isError } = useFeed(mode, page);
  const toggleReaction = useToggleReaction();

  const handleReaction = useCallback(
    (item: FeedItem, emoji: string) => {
      toggleReaction.mutate({
        entityType: item.feedType,
        entityId: item.id,
        emoji,
      });
    },
    [toggleReaction],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
        Failed to load feed. Please try again.
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    if (page === 1) {
      return (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No activity yet. Start by creating contacts, deals, or tasks.
        </div>
      );
    }
    return null;
  }

  const hasMore = data.meta.page < data.meta.totalPages;

  return (
    <>
      {data.data.map((item) => (
        <FeedCard
          key={`${item.feedType}-${item.id}`}
          item={item}
          onReaction={(emoji) => handleReaction(item, emoji)}
        />
      ))}

      {isLast && hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            className="rounded-lg border border-border bg-card px-6 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
