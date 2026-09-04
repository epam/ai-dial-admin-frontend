import { notFound } from 'next/navigation';

import { getEvaluators } from '@/src/app/[lang]/evaluators/actions';
import { getFunctions } from '@/src/app/[lang]/queries/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { Pipeline, PipelineReadResult } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getPipeline, getPipelines } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  const { name } = await params;
  const pipelineName = decodeURIComponent(name);

  let read: PipelineReadResult<Pipeline> = { data: null, isForbidden: false };
  let evaluators: EvaluatorSummary[] | null = null;
  let functions: QueryFunction[] | null = null;
  let takenTargets: string[] = [];

  try {
    read = await getPipeline(pipelineName);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch pipeline');
  }

  if (read.isForbidden) {
    return <Page403 />;
  }

  try {
    evaluators = await getEvaluators();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch evaluators for the pipeline view');
  }

  try {
    functions = await getFunctions();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the query function catalog for the pipeline view');
  }

  try {
    takenTargets = (await getPipelines()).data?.map((item) => item.target) ?? [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch bound pipeline targets');
  }

  if (read.data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PipelineDetailView
        pipeline={read.data}
        evaluators={evaluators ?? []}
        hasEvaluatorsError={evaluators == null}
        takenTargets={takenTargets}
        functions={functions ?? []}
      />
    </SaveValidationContextProvider>
  );
}
