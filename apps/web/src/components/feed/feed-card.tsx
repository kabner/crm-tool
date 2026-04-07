'use client';

import Link from 'next/link';
import {
  CheckSquare,
  StickyNote,
  Phone,
  Mail,
  Calendar,
  Bell,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmojiReactions } from '@/components/feed/emoji-reactions';
import type { FeedItem } from '@/hooks/use-feed';

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  task: {
    label: 'Task',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    icon: CheckSquare,
  },
  note: {
    label: 'Note',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300',
    icon: StickyNote,
  },
  call: {
    label: 'Call',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    icon: Phone,
  },
  email: {
    label: 'Email',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    icon: Mail,
  },
  meeting: {
    label: 'Meeting',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    icon: Calendar,
  },
  notification: {
    label: 'Notification',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    icon: Bell,
  },
};

interface FeedCardProps {
  item: FeedItem;
  onReaction: (emoji: string) => void;
}

export function FeedCard({ item, onReaction }: FeedCardProps) {
  const defaultConfig = { label: 'Notification', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', icon: Bell };
  const config = TYPE_CONFIG[item.type] ?? defaultConfig;
  const IconComponent = config.icon;

  const relatedLinks: { label: string; href: string }[] = [];
  if (item.contactId) {
    relatedLinks.push({ label: 'Contact', href: `/contacts/${item.contactId}` });
  }
  if (item.companyId) {
    relatedLinks.push({ label: 'Company', href: `/companies/${item.companyId}` });
  }
  if (item.dealId) {
    relatedLinks.push({ label: 'Deal', href: `/deals/${item.dealId}` });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: badge + content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={cn('gap-1', config.color)}
              >
                <IconComponent className="h-3 w-3" />
                {config.label}
              </Badge>

              {item.type === 'task' && item.completedAt && (
                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                  <Check className="h-3 w-3" />
                  Done
                </Badge>
              )}

              {item.type === 'task' && item.dueDate && !item.completedAt && (
                <Badge variant="outline" className="text-xs font-normal">
                  Due {new Date(item.dueDate).toLocaleDateString()}
                </Badge>
              )}
            </div>

            <h3 className="text-sm font-semibold leading-tight">
              {item.feedType === 'notification' && item.actionUrl ? (
                <Link href={item.actionUrl} className="hover:underline">
                  {item.title}
                </Link>
              ) : (
                item.title
              )}
            </h3>

            {item.body && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.body}
              </p>
            )}

            {relatedLinks.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: user + time */}
          <div className="shrink-0 text-right">
            {item.user && (
              <p className="text-xs font-medium text-foreground">
                {item.user.firstName} {item.user.lastName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {timeAgo(item.createdAt)}
            </p>
          </div>
        </div>

        {/* Reactions */}
        <div className="mt-3 border-t border-border pt-3">
          <EmojiReactions reactions={item.reactions} onToggle={onReaction} />
        </div>
      </CardContent>
    </Card>
  );
}
