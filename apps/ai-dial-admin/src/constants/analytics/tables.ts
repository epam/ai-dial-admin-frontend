import { SelectOption } from '@epam/ai-dial-ui-kit';

import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PartitionGranularity } from '@/src/models/analytics/table';

export const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Every type the table catalog accepts in a column declaration, `enum` included — it takes `enum_values`
// the way `array` takes `element_type` (see AnalyticsFieldType.Enum). `map` is the one type the catalog
// accepts that is absent, because AnalyticsFieldType does not model it.
export const COLUMN_TYPE_OPTIONS: SelectOption[] = Object.values(AnalyticsFieldType).map((value) => ({
  value,
  label: capitalize(value),
}));

// An Array column's element type: any scalar, excluding Array/Object/Enum — the backend rejects a nested
// array or object element, and an enum element outright. Enum is subtracted explicitly rather than left to
// fall out of the list above, so adding a type there cannot silently make it a legal element.
export const ELEMENT_TYPE_OPTIONS: SelectOption[] = COLUMN_TYPE_OPTIONS.filter(
  (option) =>
    option.value !== AnalyticsFieldType.Array &&
    option.value !== AnalyticsFieldType.Object &&
    option.value !== AnalyticsFieldType.Enum,
);

// Backend grammar for user-declared table/column identifiers (ADAS `Identifiers.requireUserIdentifier`):
// snake_case, must start with a lowercase letter, and must not start with `_` (reserved for system columns).
export const ANALYTICS_IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/;
export const ANALYTICS_IDENTIFIER_MAX_LENGTH = 64;

// Backend rules for an Enum column's declared value set (ADAS `TableColumnRules`): 1-512 values, each
// non-blank and at most 64 characters, distinct after trimming. Values are stored and materialized trimmed.
export const ANALYTICS_ENUM_VALUES_MIN = 1;
export const ANALYTICS_ENUM_VALUES_MAX = 512;
export const ANALYTICS_ENUM_VALUE_MAX_LENGTH = 64;

// Backend length caps for a column's free-form catalog metadata (ADAS `TableColumnRules`).
export const ANALYTICS_TAG_MAX_LENGTH = 64;
export const ANALYTICS_DISPLAY_NAME_MAX_LENGTH = 128;
export const ANALYTICS_DESCRIPTION_MAX_LENGTH = 1024;

export const PARTITION_NONE = '';
export const PARTITION_GRANULARITY_OPTIONS: SelectOption[] = [
  { value: PARTITION_NONE, label: 'None' },
  ...Object.values(PartitionGranularity).map((value) => ({ value, label: capitalize(value) })),
];
