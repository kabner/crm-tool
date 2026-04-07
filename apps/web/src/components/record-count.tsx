interface RecordCountProps {
  filtered: number;
  total: number;
  hasFilters: boolean;
}

export function RecordCount({ filtered, total, hasFilters }: RecordCountProps) {
  return (
    <p className="text-sm text-muted-foreground">
      {hasFilters
        ? `${filtered.toLocaleString()} records of ${total.toLocaleString()} total`
        : `${total.toLocaleString()} records`}
    </p>
  );
}
