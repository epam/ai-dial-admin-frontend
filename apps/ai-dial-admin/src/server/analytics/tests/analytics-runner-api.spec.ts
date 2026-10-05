import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { PauseOrigin } from '@/src/models/analytics/pipeline-runtime';
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
    const paused = [{ pipelineName: 'usage-live', origin: PauseOrigin.Operator, since: '2026-09-21T15:00:00Z' }];
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
});
