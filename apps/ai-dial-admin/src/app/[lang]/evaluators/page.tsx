import { getPipelines } from '@/src/app/[lang]/pipelines/actions';
import { PipelineKind, PipelineListItem } from '@/src/models/analytics/pipeline';
import EvaluatorsView from '@/src/components/Analytics/Evaluators/EvaluatorsView';
import Page403 from '@/src/components/Page403/Page403';
import { EvaluatorSummary, EvaluatorUsage } from '@/src/models/analytics/evaluator';
import { ServerActionResponse } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { toEvaluatorRows, toEvaluatorUsage } from '@/src/utils/analytics/evaluator-usage';
import { toReadFailure } from '@/src/utils/notification';
import { getEvaluators } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let read: ServerActionResponse<EvaluatorSummary[]> = { success: false };
  let usageRead: ServerActionResponse<PipelineListItem[]> = { success: false };
  let usage: EvaluatorUsage | null = null;

  try {
    read = await getEvaluators();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch evaluators');
  }

  // Left null rather than an empty map on failure: an empty one would report every evaluator as used by
  // no rule, which is the one thing this column must never invent.
  try {
    usageRead = await getPipelines({ kind: PipelineKind.Enrich });
    usage = usageRead.response ? toEvaluatorUsage(usageRead.response) : null;
  } catch (e) {
    errorObjLog(e, 'Failed to fetch enrichment pipelines for evaluator usage');
  }

  return (
    <EvaluatorsView
      rows={toEvaluatorRows(read.response ?? [], usage)}
      usageFailure={usageRead.success ? null : toReadFailure(usageRead)}
      loadFailure={read.success ? null : toReadFailure(read)}
    />
  );
}
