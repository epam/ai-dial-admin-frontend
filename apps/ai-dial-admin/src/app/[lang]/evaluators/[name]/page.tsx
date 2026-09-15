import { notFound } from 'next/navigation';

import { getPipelines } from '@/src/app/[lang]/pipelines/actions';
import EvaluatorDetailView from '@/src/components/Analytics/Evaluators/EvaluatorDetailView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Evaluator, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { PipelineKind, PipelineListItem } from '@/src/models/analytics/pipeline';
import { ServerActionResponse } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getReferencingPipelines } from '@/src/utils/analytics/evaluator-usage';
import { toReadFailure } from '@/src/utils/notification';
import { getEvaluator, getEvaluators, getEvaluatorVersion } from '../actions';

export const dynamic = 'force-dynamic';

const toVersion = (raw?: string): number | undefined => {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

interface PageProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ version?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  // Next already percent-decodes a dynamic param; decoding again throws on a name containing '%'.
  const name = (await params).name;
  const version = toVersion((await searchParams).version);

  let read: ServerActionResponse<Evaluator> = { success: false };
  let summaryRead: ServerActionResponse<EvaluatorSummary[]> = { success: false };
  let pipelinesRead: ServerActionResponse<PipelineListItem[]> = { success: false };
  let referencingPipelines: PipelineListItem[] | null = null;

  try {
    read = version ? await getEvaluatorVersion(name, version) : await getEvaluator(name);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the evaluator version');
  }

  try {
    summaryRead = await getEvaluators();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the evaluator version list');
  }

  try {
    pipelinesRead = await getPipelines({ kind: PipelineKind.Enrich });
    referencingPipelines = pipelinesRead.response ? getReferencingPipelines(pipelinesRead.response, name) : null;
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the pipelines referencing the evaluator');
  }

  if (read.response == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <EvaluatorDetailView
        evaluator={read.response}
        summary={summaryRead.response?.find((item) => item.name === name) ?? null}
        summaryFailure={summaryRead.success ? null : toReadFailure(summaryRead)}
        referencingPipelines={referencingPipelines}
        referencingFailure={pipelinesRead.success ? null : toReadFailure(pipelinesRead)}
      />
    </SaveValidationContextProvider>
  );
}
