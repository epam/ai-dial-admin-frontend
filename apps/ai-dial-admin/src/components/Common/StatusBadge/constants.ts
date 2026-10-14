import { StatusBadgeVariant, StatusBadgeVariantStyle } from './models';

export const STATUS_BADGE_VARIANTS: Record<StatusBadgeVariant, StatusBadgeVariantStyle> = {
  [StatusBadgeVariant.Valid]: {
    pillClassName: 'bg-success text-success',
  },
  [StatusBadgeVariant.Invalid]: {
    pillClassName: 'bg-error text-error',
  },
};
