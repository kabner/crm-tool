'use client';

import * as React from 'react';

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';

  // Strip all non-digit characters except leading +
  const digits = phone.replace(/[^\d]/g, '');

  // US number: 10 digits (no country code) or 11 digits starting with 1
  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);
    return `+1-(${area})-${prefix}-${line}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);
    return `+1-(${area})-${prefix}-${line}`;
  }

  // Unrecognizable format — return raw
  return phone;
}

export interface PhoneDisplayProps {
  phone: string | null | undefined;
  className?: string;
}

export function PhoneDisplay({ phone, className }: PhoneDisplayProps) {
  return <span className={className}>{formatPhoneNumber(phone)}</span>;
}
