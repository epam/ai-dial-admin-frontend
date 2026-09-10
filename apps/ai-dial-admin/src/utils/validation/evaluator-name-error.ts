import { EVALUATOR_NAME_PATTERN } from '@/src/constants/analytics/evaluators';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { ErrorType } from '@/src/types/error-type';

type Translate = (key: string, args?: Record<string, string | number>) => string;

/**
 * Validates an evaluator name entered in the create modal: format against
 * {@link EVALUATOR_NAME_PATTERN}, then uniqueness against `existingNames`. Modelled on
 * `getAnalyticsIdentifierError` in `src/utils/validation/analytics-table-error.ts` — same signature
 * shape, same `FieldError | null` return, same "blank returns null" rule. Returns a {@link FieldError}
 * or null when valid. A blank value returns null: emptiness is signalled by the required marker and a
 * disabled submit, not an inline error. Comparison and submission both use the trimmed value.
 */
export const getEvaluatorNameError = (value: string, existingNames: string[], t: Translate): FieldError | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!EVALUATOR_NAME_PATTERN.test(trimmed)) {
    return { type: ErrorType.FORBIDDEN_CHARS, text: t(AnalyticsEvaluatorsI18nKey.NameInvalid) };
  }
  if (existingNames.includes(trimmed)) {
    return { type: ErrorType.EXISTING, text: t(AnalyticsEvaluatorsI18nKey.NameTaken) };
  }
  return null;
};
