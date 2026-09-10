import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';

type Translate = (key: string, args?: Record<string, string | number>) => string;

/**
 * Tells apart the two outcomes `EvaluatorService.register` can report with the same `201`: `version`
 * `1` means a new evaluator was created; any other number means the request appended a version to an
 * evaluator that already existed. A missing `version` is reported as success without naming one rather
 * than guessed, per *Saving creates the next version after the latest*. Uses `== null` (not `=== 1` /
 * `undefined` checks) so a `0` — which the service cannot return but the type admits — falls into the
 * appended arm rather than the created one.
 */
export const getEvaluatorCreatedMessage = (version: number | undefined, t: Translate): string => {
  if (version === 1) return t(AnalyticsEvaluatorsI18nKey.EvaluatorCreated);
  if (version == null) return t(AnalyticsEvaluatorsI18nKey.EvaluatorCreatedVersionUnknown);
  return t(AnalyticsEvaluatorsI18nKey.EvaluatorCreatedAsVersion, { version });
};
