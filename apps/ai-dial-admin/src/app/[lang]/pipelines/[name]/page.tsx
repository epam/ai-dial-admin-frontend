import { notFound } from 'next/navigation';

import { getFunctions } from '@/src/app/[lang]/queries/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { GROUPS_PROBE_LIMIT } from '@/src/constants/analytics/pipeline-groups';
import { Pipeline, TriggerKind } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { ServerActionResponse } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { isFullAdminCaller } from '@/src/server/user-access';
import { getIsAnalyticsEnabled } from '@/src/utils/env/get-analytics-toggle';
import { getPipeline, getPipelineGroups, getPipelines } from '../actions';

export const dynamic = 'force-dynamic';

/**
 * Whether the runner tracks any group for this pipeline, decided here so the Groups tab is in the strip from
 * its first render. Asked only where the tab could be offered at all, and folded to `false` on any failure:
 * the tab is an addition to the page, and the page reads in full without it.
 */
const hasPipelineGroups = async (pipeline: Pipeline): Promise<boolean> => {
  if (!getIsAnalyticsEnabled() || pipeline.trigger?.kind !== TriggerKind.Group) return false;

  try {
    if (!(await isFullAdminCaller())) return false;

    const read = await getPipelineGroups(pipeline.name, GROUPS_PROBE_LIMIT);
    return read.success && !!read.response?.groups.length;
  } catch (e) {
    errorObjLog(e, 'Failed to probe the pipeline groups');
    return false;
  }
};

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

  // Started now and awaited last, so the runner read overlaps the two registry reads below instead of following them.
  const groupsProbe = read.response ? hasPipelineGroups(read.response) : Promise.resolve(false);

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

  const hasGroups = await groupsProbe;

  return (
    <SaveValidationContextProvider>
      <PipelineDetailView
        pipeline={read.response}
        takenTargets={takenTargets}
        functions={functions ?? []}
        hasGroups={hasGroups}
      />
    </SaveValidationContextProvider>
  );
}
