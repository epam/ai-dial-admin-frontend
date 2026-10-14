export enum StatusBadgeVariant {
  Valid = 'valid',
  Invalid = 'invalid',
}

export interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label: string;
  hint?: string;
  className?: string;
}

export interface StatusBadgeVariantStyle {
  pillClassName: string;
}
