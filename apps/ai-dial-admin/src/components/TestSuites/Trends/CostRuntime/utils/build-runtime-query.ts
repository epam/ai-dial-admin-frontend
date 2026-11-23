import {
  EVAL_SUMMARIES_ENTITY,
  EXEC_DURATION_MS_FIELD,
  METRIC_EVAL_DURATION_MS_FIELD,
  RUN_ID_FIELD,
  TOTAL_DURATION_ALIAS,
  TOTAL_METRIC_EVAL_DURATION_ALIAS,
} from '@/src/components/Runs/Summary/constants';
import { StructuredQuery, ValueType } from '@/src/models/evaluation/structured-query';
import { aggregateQuery, col, field, fn, inValues, offsetPage } from '@/src/utils/structured-query/build';

export const buildTrendsRuntimeQuery = (runIds: string[]): StructuredQuery =>
  aggregateQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    filter: inValues(RUN_ID_FIELD, ValueType.Uuid, runIds),
    groupBy: [RUN_ID_FIELD],
    select: [
      col(field(RUN_ID_FIELD)),
      col(fn('sum', [field(EXEC_DURATION_MS_FIELD)]), TOTAL_DURATION_ALIAS),
      col(fn('sum', [field(METRIC_EVAL_DURATION_MS_FIELD)]), TOTAL_METRIC_EVAL_DURATION_ALIAS),
    ],
    page: offsetPage(0, Math.max(runIds.length, 10), false),
  });
