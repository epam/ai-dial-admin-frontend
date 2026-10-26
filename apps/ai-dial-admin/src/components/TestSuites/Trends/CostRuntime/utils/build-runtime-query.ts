import {
  AVG_DURATION_ALIAS,
  AVG_METRIC_EVAL_DURATION_ALIAS,
  EVAL_SUMMARIES_ENTITY,
  EXEC_DURATION_MS_FIELD,
  METRIC_EVAL_DURATION_MS_FIELD,
  RUN_ID_FIELD,
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
      col(fn('avg', [field(EXEC_DURATION_MS_FIELD)]), AVG_DURATION_ALIAS),
      col(fn('avg', [field(METRIC_EVAL_DURATION_MS_FIELD)]), AVG_METRIC_EVAL_DURATION_ALIAS),
    ],
    page: offsetPage(0, Math.max(runIds.length, 10), false),
  });
