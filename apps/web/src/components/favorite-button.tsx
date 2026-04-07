'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
}

export function FavoriteButton({ isFavorite, onToggle }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="rounded p-1 hover:bg-muted"
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={cn(
          'h-4 w-4',
          isFavorite
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-muted-foreground',
        )}
      />
    </button>
  );
}
