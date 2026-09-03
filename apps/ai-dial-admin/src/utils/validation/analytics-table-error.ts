import {
  ANALYTICS_ENUM_VALUE_MAX_LENGTH,
  ANALYTICS_ENUM_VALUES_MAX,
  ANALYTICS_ENUM_VALUES_MIN,
  ANALYTICS_IDENTIFIER_MAX_LENGTH,
  ANALYTICS_IDENTIFIER_PATTERN,
} from '@/src/constants/analytics/tables';
import { AnalyticsTablesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { ErrorType } from '@/src/types/error-type';

type Translate = (key: string, args?: Record<string, string | number>) => string;

/**
 * Validates a user-declared analytics identifier (a table or column name) against the backend grammar
 * (ADAS `Identifiers.requireUserIdentifier`): lowercase snake_case, at most
 * {@link ANALYTICS_IDENTIFIER_MAX_LENGTH} characters, no leading underscore — plus optional uniqueness
 * against `existingNames`. Returns a {@link FieldError} or null when valid. A blank value returns null:
 * emptiness is signalled by the required marker and a disabled submit, not an inline error.
 */
export const getAnalyticsIdentifierError = (
  value: string,
  existingNames: string[],
  t: Translate,
): FieldError | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > ANALYTICS_IDENTIFIER_MAX_LENGTH) {
    return { type: ErrorType.LENGTH, text: t(ErrorI18nKey.Length, { number: ANALYTICS_IDENTIFIER_MAX_LENGTH }) };
  }
  if (!ANALYTICS_IDENTIFIER_PATTERN.test(trimmed)) {
    return { type: ErrorType.FORBIDDEN_CHARS, text: t(ErrorI18nKey.SnakeCaseIdentifier) };
  }
  if (existingNames.includes(trimmed)) {
    return { type: ErrorType.EXISTING, text: t(ErrorI18nKey.KeyValueExists) };
  }
  return null;
};

/**
 * Validates an optional free-form catalog metadata field (tag / display name / description) against its
 * backend length cap. Blank is allowed (clears the attribute); returns a {@link FieldError} or null.
 */
export const getAnalyticsLengthError = (value: string, max: number, t: Translate): FieldError | null => {
  if (value.trim().length > max) {
    return { type: ErrorType.LENGTH, text: t(ErrorI18nKey.Length, { number: max }) };
  }
  return null;
};

/**
 * Validates an Enum column's declared value set against the backend rules (ADAS `TableColumnRules`):
 * {@link ANALYTICS_ENUM_VALUES_MIN}-{@link ANALYTICS_ENUM_VALUES_MAX} values, each non-blank and at most
 * {@link ANALYTICS_ENUM_VALUE_MAX_LENGTH} characters, and distinct **after trimming** — the service stores
 * them trimmed, so two entries differing only in surrounding whitespace collide there rather than here.
 *
 * Reports the first violation it finds; the list is one field with one message, and a list failing several
 * rules at once is fixed one edit at a time either way. Returns a {@link FieldError} or null.
 */
export const getAnalyticsEnumValuesError = (values: string[], t: Translate): FieldError | null => {
  if (values.length < ANALYTICS_ENUM_VALUES_MIN) {
    return { type: ErrorType.EMPTY, text: t(AnalyticsTablesI18nKey.EnumValuesRequired) };
  }
  if (values.length > ANALYTICS_ENUM_VALUES_MAX) {
    return {
      type: ErrorType.LENGTH,
      text: t(AnalyticsTablesI18nKey.EnumValuesMax, { number: ANALYTICS_ENUM_VALUES_MAX }),
    };
  }

  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      return { type: ErrorType.EMPTY, text: t(AnalyticsTablesI18nKey.EnumValueBlank) };
    }
    if (trimmed.length > ANALYTICS_ENUM_VALUE_MAX_LENGTH) {
      return { type: ErrorType.LENGTH, text: t(ErrorI18nKey.Length, { number: ANALYTICS_ENUM_VALUE_MAX_LENGTH }) };
    }
    if (seen.has(trimmed)) {
      return { type: ErrorType.EXISTING, text: t(AnalyticsTablesI18nKey.EnumValueDuplicate, { value: trimmed }) };
    }
    seen.add(trimmed);
  }

  return null;
};
