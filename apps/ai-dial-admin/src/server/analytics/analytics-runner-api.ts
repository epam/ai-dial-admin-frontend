import { Token } from '@/src/models/auth';
import {
  PausedPipeline,
  PausedPipelinesResponse,
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

  // Both verbs answer 204 with no body, so neither sends one: a JSON object here would be a body the
  // endpoint does not read and a content type it did not ask for.
  pause(name: string, token: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(RUNNER_PAUSE_URL(name), 'POST', token);
  }

  resume(name: string, token: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(RUNNER_RESUME_URL(name), 'POST', token);
  }
}
