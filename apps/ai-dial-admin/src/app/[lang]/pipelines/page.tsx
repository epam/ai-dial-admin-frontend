import PipelinesView from '@/src/components/Analytics/Pipelines/PipelinesView';
import Page403 from '@/src/components/Page403/Page403';
import { PipelineListItem } from '@/src/models/analytics/pipeline';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { ServerActionResponse } from '@/src/models/server-action';
import { toReadFailure } from '@/src/utils/notification';
import { getPipelines } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let result: ServerActionResponse<PipelineListItem[]> = { success: false };

  try {
    result = await getPipelines();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch pipelines view data');
  }

  if (result.status === 403) {
    return <Page403 />;
  }

  return (
    <PipelinesView
      initialPipelines={result.response ?? []}
      loadFailure={result.success ? null : toReadFailure(result)}
    />
  );
}
