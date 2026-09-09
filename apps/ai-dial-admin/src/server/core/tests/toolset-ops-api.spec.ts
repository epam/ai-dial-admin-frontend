import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { ResourceType } from '@/src/types/resource-type';
import { ToolsetOpsApi } from '../toolset-ops-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: ToolsetOpsApi', () => {
  const instance = new ToolsetOpsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('discoveredTools calls GET v1/toolset/{prefixed-path}/tools', async () => {
    fetch.mockResponseOnce(JSON.stringify({ tools: [] }), { headers: { 'content-type': 'application/json' } });

    const result = await instance.discoveredTools(TOKEN_MOCK, 'public/name__1.0');

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/toolset/toolsets/public/name__1.0/tools');
    expect(options?.method).toBe('GET');
    expect(result.success).toBe(true);
    expect(result.response).toEqual({ tools: [] });
  });

  // Regression (Issue #4445): Core's `DeploymentService.findDeployment` resolves a platform-bucket
  // toolset by bare name via the merged config store — the resource-type prefix and `platform/`
  // bucket segment must be stripped, not sent, or Core can't find (or is forbidden from) the
  // deployment.
  test('discoveredTools calls GET v1/toolset/{name}/tools for a platform-bucket toolset (bare name, no prefix)', async () => {
    fetch.mockResponseOnce(JSON.stringify({ tools: [] }), { headers: { 'content-type': 'application/json' } });

    const result = await instance.discoveredTools(TOKEN_MOCK, 'platform/my-toolset');

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/toolset/my-toolset/tools');
    expect(calledUrl).not.toContain('toolsets');
    expect(result.success).toBe(true);
  });

  test('discoveredTools calls GET v1/toolset/{prefixed-path}/tools for an application', async () => {
    fetch.mockResponseOnce(JSON.stringify({ tools: [] }), { headers: { 'content-type': 'application/json' } });

    const result = await instance.discoveredTools(TOKEN_MOCK, 'public/name__1.0', ResourceType.APPLICATION);

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/toolset/applications/public/name__1.0/tools');
    expect(options?.method).toBe('GET');
    expect(result.success).toBe(true);
    expect(result.response).toEqual({ tools: [] });
  });

  test('discoveredTools calls GET v1/toolset/{name}/tools for a platform-bucket application (bare name, no prefix)', async () => {
    fetch.mockResponseOnce(JSON.stringify({ tools: [] }), { headers: { 'content-type': 'application/json' } });

    const result = await instance.discoveredTools(TOKEN_MOCK, 'platform/my-app', ResourceType.APPLICATION);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/toolset/my-app/tools');
    expect(calledUrl).not.toContain('applications');
    expect(result.success).toBe(true);
  });

  test('signIn calls POST v1/ops/toolset/signin with the given body', async () => {
    fetch.mockResponseOnce(JSON.stringify({}), { headers: { 'content-type': 'application/json' } });

    const body = { url: 'toolsets/public/name__1.0', credentialsLevel: 'user', authenticationType: 'oauth' };
    await instance.signIn(TOKEN_MOCK, body);

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/ops/toolset/signin');
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body as string)).toEqual(body);
  });

  test('signOut calls POST v1/ops/toolset/signout with the given body', async () => {
    fetch.mockResponseOnce(JSON.stringify({}), { headers: { 'content-type': 'application/json' } });

    const body = { url: 'toolsets/public/name__1.0', credentialsLevel: 'global' };
    await instance.signOut(TOKEN_MOCK, body);

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/ops/toolset/signout');
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body as string)).toEqual(body);
  });
});
