import { SelectOption } from '@epam/ai-dial-ui-kit';

import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PartitionGranularity } from '@/src/models/analytics/table';

const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const COLUMN_TYPE_OPTIONS: SelectOption[] = Object.values(AnalyticsFieldType).map((value) => ({
  value,
  label: capitalize(value),
}));

export const PARTITION_NONE = '';
export const PARTITION_GRANULARITY_OPTIONS: SelectOption[] = [
  { value: PARTITION_NONE, label: 'None' },
  ...Object.values(PartitionGranularity).map((value) => ({ value, label: capitalize(value) })),
];
