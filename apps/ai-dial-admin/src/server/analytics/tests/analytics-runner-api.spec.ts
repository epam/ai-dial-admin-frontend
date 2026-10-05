import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DlqLane, DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { PauseOrigin, PipelineLane, PipelineRuntimeState } from '@/src/models/analytics/pipeline-runtime';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { AnalyticsRunnerApi } from '../analytics-runner-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

describe('Server :: AnalyticsRunnerApi', () => {
  const instance = new AnalyticsRunnerApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('reports whether a host was configured', () => {
    expect(instance.isConfigured).toBe(true);
    expect(new AnalyticsRunnerApi({ host: undefined }).isConfigured).toBe(false);
  });

  test('getPaused issues GET /v1/pipelines/paused and unwraps the envelope', async () => {
    const paused = [{ pipeline_name: 'usage-live', origin: PauseOrigin.Operator, since: '2026-09-21T15:00:00Z' }];
    fetch.mockResponseOnce(JSON.stringify({ paused }), JSON_HEADERS);

    const res = await instance.getPaused(TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: paused }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/pipelines/paused'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  // The envelope exists so members can be added later; a body without it is not a listing of nothing.
  test('getPaused reports a body without the envelope as a failure', async () => {
    fetch.mockResponseOnce(JSON.stringify({ unexpected: true }), JSON_HEADERS);

    const res = await instance.getPaused(TOKEN_MOCK);

    expect(res.success).toBe(false);
  });

  test('getPaused carries the service refusal through', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 503, error: 'pipeline_cache_cold', message: 'Not loaded yet' }), {
      status: 503,
      ...JSON_HEADERS,
    });

    const res = await instance.getPaused(TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: false, errorHeader: 'pipeline_cache_cold', status: 503 }));
  });

  // 204 with no body: `Response` refuses a body at that status, so the mock resolves one directly.
  const noContent = () => Promise.resolve(new Response(null, { status: 204 }));

  test('getCache issues GET /v1/pipelines/cache and unwraps the envelope', async () => {
    const pipelines = [{ name: 'usage-live', enabled: true, generation: 7 }];
    fetch.mockResponseOnce(JSON.stringify({ pipelines }), JSON_HEADERS);

    const res = await instance.getCache(TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: pipelines }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/pipelines/cache'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getCache reports a body without the envelope as a failure', async () => {
    fetch.mockResponseOnce(JSON.stringify({ unexpected: true }), JSON_HEADERS);

    const res = await instance.getCache(TOKEN_MOCK);

    expect(res.success).toBe(false);
  });

  test('pause issues POST to the pipeline pause path with no body', async () => {
    fetch.mockResponseOnce(noContent);

    const res = await instance.pause('usage live', TOKEN_MOCK);

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/pipelines/usage%20live/pause'),
      expect.objectContaining({ method: 'POST', body: undefined }),
    );
  });

  test('resume issues POST to the pipeline resume path', async () => {
    fetch.mockResponseOnce(noContent);

    const res = await instance.resume('usage-live', TOKEN_MOCK);

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/pipelines/usage-live/resume'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
  // --- the dead-letter queue -------------------------------------------------------------------

  const DEAD_LETTER = {
    id: 48226,
    pipeline_name: 'usage-live',
    stage: DlqStage.DialCall,
    error: 'rate limit is exceeded',
    requeueable: true,
    created_at: '2026-10-02T10:00:00Z',
  };

  const PAGE = { items: [DEAD_LETTER], next_cursor: 'djE6MQ', has_more: true, total: 37, requeueable_total: 21 };

  test('getDlq issues GET /v1/dlq for one page and returns it whole', async () => {
    fetch.mockResponseOnce(JSON.stringify(PAGE), JSON_HEADERS);

    const res = await instance.getDlq('usage-live', {}, 20, undefined, TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: PAGE }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/dlq?pipeline_name=usage-live&limit=20'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getDlq carries the cursor of the page it is continuing', async () => {
    fetch.mockResponseOnce(JSON.stringify(PAGE), JSON_HEADERS);

    await instance.getDlq('usage-live', {}, 20, 'djE6MQ', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('cursor=djE6MQ'), expect.anything());
  });

  test('getDlq narrows by lane', async () => {
    fetch.mockResponseOnce(JSON.stringify(PAGE), JSON_HEADERS);

    await instance.getDlq('usage-live', { lane: DlqLane.Backfill }, 20, undefined, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lane=backfill'), expect.anything());
  });

  // The service answers 400 for the pair rather than the empty list it would select, so the two are
  // kept apart here rather than only in the UI.
  test('getDlq never sends a lane together with a run', async () => {
    fetch.mockResponseOnce(JSON.stringify(PAGE), JSON_HEADERS);

    await instance.getDlq('usage-live', { lane: DlqLane.Live, runId: 'run-7' }, 20, undefined, TOKEN_MOCK);

    const url = String(vi.mocked(fetch).mock.calls[0][0]);

    expect(url).toContain('run_id=run-7');
    expect(url).not.toContain('lane=');
  });

  test('getDlq reports a body that is not a page as a failure', async () => {
    fetch.mockResponseOnce(JSON.stringify({ unexpected: true }), JSON_HEADERS);

    const res = await instance.getDlq('usage-live', {}, 20, undefined, TOKEN_MOCK);

    expect(res.success).toBe(false);
  });

  test('getDlq carries the service refusal through', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 503, error: 'postgres_unavailable', message: 'down' }), {
      status: 503,
      ...JSON_HEADERS,
    });

    const res = await instance.getDlq('usage-live', {}, 20, undefined, TOKEN_MOCK);

    expect(res.success).toBe(false);
    expect(res.response).toBeUndefined();
  });

  test('requeueDlqItem issues POST to the item path and returns the count', async () => {
    fetch.mockResponseOnce(JSON.stringify({ requeued: 1 }), JSON_HEADERS);

    const res = await instance.requeueDlqItem(48226, TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: { requeued: 1 } }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/dlq/48226/requeue'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('requeueDlqItem carries a refusal of an item the service will not re-run', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 422, error: 'dlq_not_requeueable', message: 'pre-fold' }), {
      status: 422,
      ...JSON_HEADERS,
    });

    const res = await instance.requeueDlqItem(48226, TOKEN_MOCK);

    expect(res.success).toBe(false);
    expect(res.errorHeader).toBe('dlq_not_requeueable');
  });

  test('requeueDlq selects by pipeline alone when no run is named', async () => {
    fetch.mockResponseOnce(JSON.stringify({ requeued: 4 }), JSON_HEADERS);

    const res = await instance.requeueDlq('usage-live', undefined, TOKEN_MOCK);

    expect(res.response).toEqual({ requeued: 4 });

    const url = String(vi.mocked(fetch).mock.calls[0][0]);

    expect(url).toContain('pipeline_name=usage-live');
    expect(url).not.toContain('run_id=');
  });

  test('requeueDlq selects by pipeline and run together', async () => {
    fetch.mockResponseOnce(JSON.stringify({ requeued: 2 }), JSON_HEADERS);

    await instance.requeueDlq('usage-live', 'run-7', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('run_id=run-7'), expect.anything());
  });

  test("getRuntimeView issues GET on the pipeline's own runtime route", async () => {
    const view = {
      pipeline_name: 'usage-live',
      lane: PipelineLane.Row,
      generation: 7,
      status: { state: PipelineRuntimeState.Active },
      schedule: { last_scan_at: '2026-10-05T10:00:00Z' },
      progress: { lag_seconds: 38 },
    };
    fetch.mockResponseOnce(JSON.stringify(view), JSON_HEADERS);

    const res = await instance.getRuntimeView('usage-live', TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: view }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/pipelines/usage-live/runtime'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getRuntimeView escapes a pipeline name that is not URL-safe', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: { state: PipelineRuntimeState.Active } }), JSON_HEADERS);

    await instance.getRuntimeView('usage/live live', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('usage%2Flive%20live/runtime'), expect.anything());
  });

  // Every lane carries a status, so a 200 without one came from something other than this route.
  test('getRuntimeView reports a body carrying no status as a failure', async () => {
    fetch.mockResponseOnce(JSON.stringify({ pipeline_name: 'usage-live' }), JSON_HEADERS);

    const res = await instance.getRuntimeView('usage-live', TOKEN_MOCK);

    expect(res.success).toBe(false);
  });

  // The two codes the caller tells apart: a cold cache clears itself, a pipeline the runner does not
  // hold is the state the page states as nothing running it. Neither may reach it as a generic error.
  test('getRuntimeView carries a cold cache through by its own code', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 503, error: 'pipeline_cache_cold', message: 'Not loaded yet' }), {
      status: 503,
      ...JSON_HEADERS,
    });

    const res = await instance.getRuntimeView('usage-live', TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: false, errorHeader: 'pipeline_cache_cold', status: 503 }));
  });

  test('getRuntimeView carries a pipeline the runner does not hold through by its own code', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 404, error: 'not_found', message: 'No such pipeline' }), {
      status: 404,
      ...JSON_HEADERS,
    });

    const res = await instance.getRuntimeView('usage-live', TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: false, errorHeader: 'not_found', status: 404 }));
  });

  test("getGroups asks for the limit on the pipeline's own groups route and unwraps the envelope", async () => {
    const groups = [{ group_key: 'sess_A', dirty: true }];
    fetch.mockResponseOnce(JSON.stringify({ groups }), JSON_HEADERS);

    const res = await instance.getGroups('retrieval/quality', 500, TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: groups }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/pipelines/retrieval%2Fquality/groups?limit=500'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getGroups reports a body without the envelope as a failure', async () => {
    fetch.mockResponseOnce(JSON.stringify({ unexpected: true }), JSON_HEADERS);

    const res = await instance.getGroups('retrieval-quality', 1, TOKEN_MOCK);

    expect(res.success).toBe(false);
  });

  // 404 covers both a pipeline the runner does not hold and one that is not a group pipeline.
  test('getGroups carries a 404 through by its own code', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 404, error: 'not_found', message: 'No such pipeline' }), {
      status: 404,
      ...JSON_HEADERS,
    });

    const res = await instance.getGroups('retrieval-quality', 1, TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: false, errorHeader: 'not_found', status: 404 }));
  });

  test("requeueGroup posts to the group's requeue route with both segments escaped", async () => {
    fetch.mockResponseOnce(() => Promise.resolve(new Response(null, { status: 202 })));

    const res = await instance.requeueGroup('retrieval-quality', 'sess A/1', TOKEN_MOCK);

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/pipelines/retrieval-quality/groups/sess%20A%2F1/requeue'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
