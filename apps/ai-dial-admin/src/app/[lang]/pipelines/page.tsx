import PipelinesView from '@/src/components/Analytics/Pipelines/PipelinesView';
import Page403 from '@/src/components/Page403/Page403';
import { PipelineListItem, PipelineReadResult } from '@/src/models/analytics/pipeline';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getFunctions } from '@/src/app/[lang]/queries/actions';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { getPipelines } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let result: PipelineReadResult<PipelineListItem[]> = { data: null, isForbidden: false };
  let functions: QueryFunction[] | null = null;

  try {
    result = await getPipelines();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch pipelines view data');
  }

  try {
    functions = await getFunctions();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the query function catalog for the pipelines view');
  }

  if (result.isForbidden) {
    return <Page403 />;
  }

  return (
    <PipelinesView
      initialPipelines={result.data ?? []}
      functions={functions ?? []}
      hasLoadError={result.data == null}
    />
  );
}
