import { ANALYTICS_IDENTIFIER_MAX_LENGTH, ANALYTICS_IDENTIFIER_PATTERN } from '@/src/constants/analytics/tables';
import { ErrorI18nKey } from '@/src/constants/i18n';
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
