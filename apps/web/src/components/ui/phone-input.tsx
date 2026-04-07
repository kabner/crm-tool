'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const COUNTRY_CODES = [
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', name: 'US' },
  { code: '+1', flag: '\u{1F1E8}\u{1F1E6}', name: 'CA' },
  { code: '+44', flag: '\u{1F1EC}\u{1F1E7}', name: 'UK' },
  { code: '+61', flag: '\u{1F1E6}\u{1F1FA}', name: 'AU' },
  { code: '+33', flag: '\u{1F1EB}\u{1F1F7}', name: 'FR' },
  { code: '+49', flag: '\u{1F1E9}\u{1F1EA}', name: 'DE' },
  { code: '+81', flag: '\u{1F1EF}\u{1F1F5}', name: 'JP' },
  { code: '+86', flag: '\u{1F1E8}\u{1F1F3}', name: 'CN' },
  { code: '+91', flag: '\u{1F1EE}\u{1F1F3}', name: 'IN' },
  { code: '+55', flag: '\u{1F1E7}\u{1F1F7}', name: 'BR' },
  { code: '+52', flag: '\u{1F1F2}\u{1F1FD}', name: 'MX' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function parseE164(value: string): { countryCode: string; number: string } {
  if (!value || !value.startsWith('+')) {
    return { countryCode: '+1', number: value || '' };
  }

  // Try matching longer codes first (2-3 digit codes)
  for (const country of COUNTRY_CODES) {
    if (value.startsWith(country.code)) {
      return {
        countryCode: country.code,
        number: value.slice(country.code.length),
      };
    }
  }

  return { countryCode: '+1', number: value.replace(/^\+/, '') };
}

export function PhoneInput({ value, onChange, className }: PhoneInputProps) {
  const parsed = parseE164(value);
  const [countryCode, setCountryCode] = React.useState(parsed.countryCode);
  const [number, setNumber] = React.useState(parsed.number);

  // Sync from external value changes
  React.useEffect(() => {
    const p = parseE164(value);
    setCountryCode(p.countryCode);
    setNumber(p.number);
  }, [value]);

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCode = e.target.value;
    setCountryCode(newCode);
    onChange(number ? `${newCode}${number}` : '');
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setNumber(raw);
    onChange(raw ? `${countryCode}${raw}` : '');
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <select
        value={countryCode}
        onChange={handleCountryChange}
        className="flex h-10 w-[110px] shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={`${c.name}-${c.code}`} value={c.code}>
            {c.flag} {c.name} {c.code}
          </option>
        ))}
      </select>
      <Input
        type="tel"
        placeholder="Phone number"
        value={number}
        onChange={handleNumberChange}
        className="flex-1"
      />
    </div>
  );
}
