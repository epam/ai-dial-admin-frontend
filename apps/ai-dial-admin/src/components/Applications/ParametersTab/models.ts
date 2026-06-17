export interface ApplicationPropertyRow {
  key: string;
  value: unknown;
  type: string;
  required: boolean;
  isFromScheme?: boolean;
}
