import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreFunctionName } from './models';

export const EVAL_SUMMARIES_ENTITY = 'eval_summaries';
export const RUN_ID_FIELD = 'test_suite_run_id';
export const COMPUTATION_ID_FIELD = 'computation_id';
export const RUN_ID_PARAM = 'runId';
export const COMPUTATION_ID_PARAM = 'computationId';
export const FUNCTION_RESULT_ALIAS = 'value';

export const TEST_CASE_FIELD_PREFIX = 'data';
export const RESPONSE_FIELD_PREFIX = 'response';
export const METRIC_FIELD_PREFIX = 'metric';
export const FIELD_NAME_SEPARATOR = '::';

export const OVERALL_SCORE_FUNCTION_NAME_TO_LABEL_KEY: Record<OverallScoreFunctionName, TestSuitesI18nKey> = {
  [OverallScoreFunctionName.RocAuc]: TestSuitesI18nKey.OverallScoreFunctionRocAuc,
};
