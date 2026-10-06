import { Token } from '@/src/models/auth';
import { DlqFilters, DlqPage, DlqRequeueResponse } from '@/src/models/analytics/pipeline-dlq';
import { GroupListOrder, PipelineGroupsPage } from '@/src/models/analytics/pipeline-groups';
import {
  PausedPipeline,
  PausedPipelinesResponse,
  PipelineRuntimeView,
  RunnerPipelineCacheResponse,
  RunnerPipelineEntry,
} from '@/src/models/analytics/pipeline-runtime';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApi } from '@/src/server/base-api';

export const RUNNER_PIPELINES_URL = 'v1/pipelines';
export const RUNNER_PAUSED_URL = `${RUNNER_PIPELINES_URL}/paused`;
export const RUNNER_CACHE_URL = `${RUNNER_PIPELINES_URL}/cache`;
export const RUNNER_PAUSE_URL = (name: string): string => `${RUNNER_PIPELINES_URL}/${encodeURIComponent(name)}/pause`;
export const RUNNER_RESUME_URL = (name: string): string => `${RUNNER_PIPELINES_URL}/${encodeURIComponent(name)}/resume`;
export const RUNNER_RUNTIME_URL = (name: string): string =>
  `${RUNNER_PIPELINES_URL}/${encodeURIComponent(name)}/runtime`;

/** One keyset page of a pipeline's groups. The cursor is the previous page's `next_cursor`, under the same order. */
export const RUNNER_GROUPS_URL = (name: string, limit: number, order?: GroupListOrder, cursor?: string): string => {
  const params = new URLSearchParams({ limit: String(limit) });

  if (order) params.set('order', order);
  if (cursor) params.set('cursor', cursor);

  return `${RUNNER_PIPELINES_URL}/${encodeURIComponent(name)}/groups?${params.toString()}`;
};
export const RUNNER_GROUP_REQUEUE_URL = (name: string, groupKey: string): string =>
  `${RUNNER_PIPELINES_URL}/${encodeURIComponent(name)}/groups/${encodeURIComponent(groupKey)}/requeue`;

export const RUNNER_DLQ_URL = 'v1/dlq';

/**
 * The listing's query, for one keyset page.
 *
 * `run_id` wins over `lane`: the service refuses `lane=live` together with a run, and a run's items are
 * backfill items anyway — so naming the run is the narrower of the two and the lane it would imply adds
 * nothing. Enforced here rather than only in the UI, because a 400 the console built for itself is a
 * report nobody can act on.
 *
 * The cursor is the previous page's `next_cursor`, passed back opaquely. It is not bound to the filters,
 * but a page walked under one filter and continued under another would read "older than that item" in a
 * set the reader never saw, so the caller starts a new walk whenever the filter changes.
 */
export const RUNNER_DLQ_LIST_URL = (
  pipelineName: string,
  filters: DlqFilters,
  limit: number,
  cursor?: string,
): string => {
  const params = new URLSearchParams({ pipeline_name: pipelineName, limit: String(limit) });

  if (filters.runId) params.set('run_id', filters.runId);
  else if (filters.lane) params.set('lane', filters.lane);

  if (cursor) params.set('cursor', cursor);

  return `${RUNNER_DLQ_URL}?${params.toString()}`;
};

export const RUNNER_DLQ_REQUEUE_ITEM_URL = (id: number): string => `${RUNNER_DLQ_URL}/${id}/requeue`;

/**
 * The bulk requeue selects by pipeline and, optionally, by run — and by nothing else. The service
 * re-runs every matching item it holds, so this URL carries no trace of whatever the grid is filtered to.
 */
export const RUNNER_DLQ_REQUEUE_URL = (pipelineName: string, runId?: string): string => {
  const params = new URLSearchParams({ pipeline_name: pipelineName });

  if (runId) params.set('run_id', runId);

  return `${RUNNER_DLQ_URL}/requeue?${params.toString()}`;
};

/**
 * The enrichment runner: a second analytics upstream, separate from the registry, serving the runtime
 * verbs the registry has none of. It authorizes every endpoint on full-admin rights, reads included, so
 * a caller without them has nothing to read here rather than a reduced view.
 *
 * Its error envelope is the registry's — `{status, error, message, path, method}` — so `parseErrorBody`
 * is inherited rather than overridden.
 */
export class AnalyticsRunnerApi extends BaseApi {
  /** Whether a host was configured. Without one the console presents no runtime rather than failing. */
  get isConfigured(): boolean {
    return Boolean(this.config.host);
  }

  /**
   * Every paused pipeline in one answer. The runner has no per-pipeline read, so asking about one
   * pipeline and asking about all of them is the same request.
   */
  async getPaused(token: Token): Promise<ServerActionResponse<PausedPipeline[]>> {
    const res = await this.getAction(RUNNER_PAUSED_URL, token);

    if (!res.success) return res;

    const paused = (res.response as PausedPipelinesResponse | null)?.paused;
    return Array.isArray(paused) ? { ...res, response: paused } : { ...res, success: false };
  }

  /**
   * The pipelines the runner has taken on. It admits one only when the pipeline is enabled and it can
   * execute it, then schedules the recurring work from that set — so membership is the difference
   * between a pipeline something is driving and one that only looks healthy in the registry.
   */
  async getCache(token: Token): Promise<ServerActionResponse<RunnerPipelineEntry[]>> {
    const res = await this.getAction(RUNNER_CACHE_URL, token);

    if (!res.success) return res;

    const pipelines = (res.response as RunnerPipelineCacheResponse | null)?.pipelines;
    return Array.isArray(pipelines) ? { ...res, response: pipelines } : { ...res, success: false };
  }

  /**
   * What the runner is doing with one pipeline right now.
   *
   * The body is the view itself rather than a wrapper, so the only shape check worth making is that a
   * status came back: every lane carries one, and a 200 without it is an answer from something other
   * than this route. A failure is returned untouched — its `errorHeader` carries the machine code the
   * caller tells a cold cache, a pipeline the runner does not hold, and a genuine refusal apart by.
   */
  async getRuntimeView(pipelineName: string, token: Token): Promise<ServerActionResponse<PipelineRuntimeView>> {
    const res = await this.getAction(RUNNER_RUNTIME_URL(pipelineName), token);

    if (!res.success) return res;

    const view = res.response as PipelineRuntimeView | null;
    return view?.status?.state ? { ...res, response: view } : { ...res, success: false };
  }

  // Both verbs answer 204 with no body, so neither sends one: a JSON object here would be a body the
  // endpoint does not read and a content type it did not ask for.
  pause(name: string, token: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(RUNNER_PAUSE_URL(name), 'POST', token);
  }

  resume(name: string, token: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(RUNNER_RESUME_URL(name), 'POST', token);
  }

  /**
   * One page of a pipeline's dead letters, newest first, with the counts of everything the filter
   * matches. The counts come back with the page, read in the same snapshot, so the summary a caller
   * states and the rows it lists can never disagree.
   */
  async getDlq(
    pipelineName: string,
    filters: DlqFilters,
    limit: number,
    cursor: string | undefined,
    token: Token,
  ): Promise<ServerActionResponse<DlqPage>> {
    const res = await this.getAction(RUNNER_DLQ_LIST_URL(pipelineName, filters, limit, cursor), token);

    if (!res.success) return res;

    const page = res.response as Partial<DlqPage> | null;
    if (!Array.isArray(page?.items)) return { ...res, success: false };

    // Normalised here rather than trusted. A deployment still running the build before the listing
    // was paged answers `{items}` alone, and an absent counter would reach the card as `undefined`,
    // which compares false against zero and renders a heading over nothing. Falling back to the page
    // itself states a floor rather than a lie, and `has_more` false ends the walk after one page.
    return {
      ...res,
      response: {
        items: page.items,
        next_cursor: page.next_cursor ?? null,
        has_more: page.has_more ?? false,
        total: typeof page.total === 'number' ? page.total : page.items.length,
        requeueable_total:
          typeof page.requeueable_total === 'number'
            ? page.requeueable_total
            : page.items.filter((item) => item.requeueable).length,
      },
    };
  }

  // Both requeues answer `{requeued}` and read no body, so neither sends one.
  requeueDlqItem(id: number, token: Token): Promise<ServerActionResponse<DlqRequeueResponse>> {
    return this.sendActionRequest(RUNNER_DLQ_REQUEUE_ITEM_URL(id), 'POST', token);
  }

  requeueDlq(
    pipelineName: string,
    runId: string | undefined,
    token: Token,
  ): Promise<ServerActionResponse<DlqRequeueResponse>> {
    return this.sendActionRequest(RUNNER_DLQ_REQUEUE_URL(pipelineName, runId), 'POST', token);
  }

  /**
   * One page of the groups the runner tracks for a group pipeline. A 404 means either that the runner does not hold
   * the pipeline or that it is not a group pipeline; the two are indistinguishable here, and both mean there are no
   * groups to show.
   */
  async getGroups(
    pipelineName: string,
    limit: number,
    order: GroupListOrder | undefined,
    cursor: string | undefined,
    token: Token,
  ): Promise<ServerActionResponse<PipelineGroupsPage>> {
    const res = await this.getAction(RUNNER_GROUPS_URL(pipelineName, limit, order, cursor), token);

    if (!res.success) return res;

    const page = res.response as Partial<PipelineGroupsPage> | null;
    if (!Array.isArray(page?.groups)) return { ...res, success: false };

    // Normalised rather than trusted, as the failures listing is: a runner predating paging answers `{groups}` alone,
    // and `has_more` false then ends the walk after the one page it served.
    return {
      ...res,
      response: {
        groups: page.groups,
        next_cursor: page.next_cursor ?? null,
        has_more: page.has_more ?? false,
        total: typeof page.total === 'number' ? page.total : page.groups.length,
      },
    };
  }

  // Answers 202 with no body: the evaluation is queued, and its result is never reported here.
  requeueGroup(pipelineName: string, groupKey: string, token: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(RUNNER_GROUP_REQUEUE_URL(pipelineName, groupKey), 'POST', token);
  }
}
