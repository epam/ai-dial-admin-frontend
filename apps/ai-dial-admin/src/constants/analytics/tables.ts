import { SelectOption } from '@epam/ai-dial-ui-kit';

import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PartitionGranularity } from '@/src/models/analytics/table';

export const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// `enum` is deliberately absent: it is a type the entity schema *reports* for a field whose value set is
// closed, not one the table catalog accepts in a column declaration. Enumerating the whole type enum here
// would offer it, and the backend would reject the create — silently, since nothing type-checks a list.
const DECLARABLE_COLUMN_TYPES: AnalyticsFieldType[] = Object.values(AnalyticsFieldType).filter(
  (type) => type !== AnalyticsFieldType.Enum,
);

export const COLUMN_TYPE_OPTIONS: SelectOption[] = DECLARABLE_COLUMN_TYPES.map((value) => ({
  value,
  label: capitalize(value),
}));

// An Array column's element type: any scalar, excluding Array/Object (backend rejects nested arrays/objects).
export const ELEMENT_TYPE_OPTIONS: SelectOption[] = COLUMN_TYPE_OPTIONS.filter(
  (option) => option.value !== AnalyticsFieldType.Array && option.value !== AnalyticsFieldType.Object,
);

// Backend grammar for user-declared table/column identifiers (ADAS `Identifiers.requireUserIdentifier`):
// snake_case, must start with a lowercase letter, and must not start with `_` (reserved for system columns).
export const ANALYTICS_IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/;
export const ANALYTICS_IDENTIFIER_MAX_LENGTH = 64;

// Backend length caps for a column's free-form catalog metadata (ADAS `TableColumnRules`).
export const ANALYTICS_TAG_MAX_LENGTH = 64;
export const ANALYTICS_DISPLAY_NAME_MAX_LENGTH = 128;
export const ANALYTICS_DESCRIPTION_MAX_LENGTH = 1024;

export const PARTITION_NONE = '';
export const PARTITION_GRANULARITY_OPTIONS: SelectOption[] = [
  { value: PARTITION_NONE, label: 'None' },
  ...Object.values(PartitionGranularity).map((value) => ({ value, label: capitalize(value) })),
];
