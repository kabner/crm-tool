'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_EMOJIS = ['\u{1F44D}', '\u2764\uFE0F', '\u{1F389}', '\u{1F602}', '\u{1F62E}', '\u{1F525}'];
const ALL_EMOJIS = [
  '\u{1F44D}', '\u2764\uFE0F', '\u{1F389}', '\u{1F602}', '\u{1F62E}', '\u{1F525}',
  '\u{1F44F}', '\u{1F64C}', '\u{1F4AF}', '\u2705', '\u{1F680}', '\u{1F4A1}',
  '\u{1F914}', '\u{1F440}', '\u{1F3AF}', '\u2B50',
];

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface EmojiReactionsProps {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
}

export function EmojiReactions({ reactions, onToggle }: EmojiReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  const activeReactions = reactions.filter((r) => r.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activeReactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggle(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-muted',
            reaction.reacted
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground',
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}

      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Add reaction"
        >
          <Plus className="h-3 w-3" />
        </button>

        {showPicker && (
          <div className="absolute bottom-8 left-0 z-50 grid w-[280px] grid-cols-6 gap-1 rounded-lg border border-border bg-popover p-3 shadow-lg">
            {ALL_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onToggle(emoji);
                  setShowPicker(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
