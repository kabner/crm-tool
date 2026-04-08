'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUsers, type TenantUser } from '@/hooks/use-users';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
}: MentionInputProps) {
  const { data: users = [] } = useUsers();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter((user) => {
    if (!mentionQuery) return true;
    const q = mentionQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().startsWith(q) ||
      user.lastName.toLowerCase().startsWith(q) ||
      `${user.firstName}.${user.lastName}`.toLowerCase().startsWith(q) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().startsWith(q)
    );
  });

  const handleSelect = useCallback(
    (user: TenantUser) => {
      const mention = `@${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}`;
      const before = value.slice(0, mentionStart);
      const after = value.slice(
        mentionStart + 1 + mentionQuery.length, // +1 for the @ character
      );
      const newValue = `${before}${mention} ${after}`;
      onChange(newValue);
      setShowDropdown(false);
      setMentionQuery('');
      setMentionStart(-1);
      setSelectedIndex(0);

      // Focus back to textarea
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          const cursorPos = before.length + mention.length + 1;
          textarea.setSelectionRange(cursorPos, cursorPos);
        }
      });
    },
    [value, mentionStart, mentionQuery, onChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPos = e.target.selectionStart;
    // Look backwards from cursor for @
    let atIndex = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      const ch = newValue.charAt(i);
      if (ch === '@') {
        // Make sure it's preceded by a space, newline, or is at position 0
        if (i === 0 || /\s/.test(newValue.charAt(i - 1))) {
          atIndex = i;
        }
        break;
      }
      if (/\s/.test(ch)) break;
    }

    if (atIndex >= 0) {
      const query = newValue.slice(atIndex + 1, cursorPos);
      // Only show dropdown if query doesn't contain spaces (still typing mention)
      if (!/\s/.test(query)) {
        setMentionStart(atIndex);
        setMentionQuery(query);
        setShowDropdown(true);
        setSelectedIndex(0);
        return;
      }
    }

    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || filteredUsers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredUsers.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredUsers.length - 1,
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const user = filteredUsers[selectedIndex];
      if (user) handleSelect(user);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 z-50 w-72 max-h-52 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
          style={{ top: '100%', marginTop: '4px' }}
        >
          {filteredUsers.slice(0, 8).map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent',
                index === selectedIndex && 'bg-accent',
              )}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                handleSelect(user);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div>
                <span className="font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="ml-1 text-muted-foreground text-xs">
                  {user.email}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
