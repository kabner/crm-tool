import React from 'react';

export function renderMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+(?:\.\w+)?)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="font-semibold text-primary">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
