export class ImportOptionsDto {
  fieldMapping: Record<string, string>; // csv_column -> crm_field
  duplicateHandling: 'skip' | 'update' | 'create';
  duplicateField: string; // field to check for duplicates, usually 'email'
}
