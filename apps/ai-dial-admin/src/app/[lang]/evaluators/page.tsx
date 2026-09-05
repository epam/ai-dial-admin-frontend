import { getPipelines } from '@/src/app/[lang]/pipelines/actions';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import EvaluatorsView from '@/src/components/Analytics/Evaluators/EvaluatorsView';
import Page403 from '@/src/components/Page403/Page403';
import { EvaluatorSummary, EvaluatorUsage } from '@/src/models/analytics/evaluator';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { toEvaluatorRows, toEvaluatorUsage } from '@/src/utils/analytics/evaluator-usage';
import { getEvaluators } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let evaluators: EvaluatorSummary[] | null = null;
  let usage: EvaluatorUsage | null = null;

  try {
    evaluators = await getEvaluators();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch evaluators');
  }

  // Left null rather than an empty map on failure: an empty one would report every evaluator as used by
  // no rule, which is the one thing this column must never invent.
  try {
    const pipelines = (await getPipelines({ kind: PipelineKind.Enrich })).data;
    usage = pipelines ? toEvaluatorUsage(pipelines) : null;
  } catch (e) {
    errorObjLog(e, 'Failed to fetch enrichment pipelines for evaluator usage');
  }

  return (
    <EvaluatorsView
      rows={toEvaluatorRows(evaluators ?? [], usage)}
      hasUsageError={usage == null}
      hasLoadError={evaluators == null}
    />
  );
}
