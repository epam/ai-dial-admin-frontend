import { StatusBadgeProps, StatusBadgeVariant } from '@/src/components/Common/StatusBadge/models';
import { CoreResourceValidity, CoreValidationWarning, DialModelResourceStatus } from '@/src/models/dial/resource';

export const formatValidationWarnings = (warnings: CoreValidationWarning[] = []): string =>
  warnings
    .map((warning) => [warning.field, warning.message].filter(Boolean).join(': '))
    .filter(Boolean)
    .join('; ');

export const getOverallStatusBadgeProps = (
  metadata: CoreResourceValidity | undefined,
  labels: { valid: string; invalid: string },
): StatusBadgeProps | null => {
  switch (metadata?.status) {
    case DialModelResourceStatus.Valid:
      return { variant: StatusBadgeVariant.Valid, label: labels.valid };
    case DialModelResourceStatus.Invalid:
      return {
        variant: StatusBadgeVariant.Invalid,
        label: labels.invalid,
        hint: formatValidationWarnings(metadata.validationWarnings) || undefined,
      };
    default:
      return null;
  }
};
