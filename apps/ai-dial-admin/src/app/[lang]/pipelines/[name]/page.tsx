import { notFound } from 'next/navigation';

import { getFunctions } from '@/src/app/[lang]/queries/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { ServerActionResponse } from '@/src/models/server-action';
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

  let read: ServerActionResponse<Pipeline> = { success: false };
  let functions: QueryFunction[] | null = null;
  let takenTargets: string[] = [];

  try {
    read = await getPipeline(pipelineName);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch pipeline');
  }

  if (read.status === 403) {
    return <Page403 />;
  }

  try {
    functions = await getFunctions();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the query function catalog for the pipeline view');
  }

  try {
    takenTargets = (await getPipelines()).response?.map((item) => item.target) ?? [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch bound pipeline targets');
  }

  if (read.response == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PipelineDetailView pipeline={read.response} takenTargets={takenTargets} functions={functions ?? []} />
    </SaveValidationContextProvider>
  );
}
