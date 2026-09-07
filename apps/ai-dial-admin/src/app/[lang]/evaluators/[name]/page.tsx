import { notFound } from 'next/navigation';

import { getPipelines } from '@/src/app/[lang]/pipelines/actions';
import EvaluatorDetailView from '@/src/components/Analytics/Evaluators/EvaluatorDetailView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Evaluator, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { PipelineKind, PipelineListItem } from '@/src/models/analytics/pipeline';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getReferencingPipelines } from '@/src/utils/analytics/evaluator-usage';
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

  let evaluator: Evaluator | null = null;
  let evaluators: EvaluatorSummary[] | null = null;
  let referencingPipelines: PipelineListItem[] | null = null;

  try {
    evaluator = version ? await getEvaluatorVersion(name, version) : await getEvaluator(name);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the evaluator version');
  }

  try {
    evaluators = await getEvaluators();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the evaluator version list');
  }

  try {
    const pipelines = (await getPipelines({ kind: PipelineKind.Enrich })).data;
    referencingPipelines = pipelines ? getReferencingPipelines(pipelines, name) : null;
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the pipelines referencing the evaluator');
  }

  if (evaluator == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <EvaluatorDetailView
        evaluator={evaluator}
        summary={evaluators?.find((item) => item.name === name) ?? null}
        hasSummaryError={evaluators == null}
        referencingPipelines={referencingPipelines}
      />
    </SaveValidationContextProvider>
  );
}
