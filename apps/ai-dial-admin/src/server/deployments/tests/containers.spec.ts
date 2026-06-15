import { describe, test, expect, vi } from 'vitest';
import {
  ContainersApi,
  BASE_CONTAINERS_URL,
  SERVER_CONTAINERS_URL,
  CONTAINER_URL,
  RUN_CONTAINER_URL,
  STOP_CONTAINER_URL,
  CONTAINER_RESOURCES_URL,
  CONTAINER_LOGS_URL,
  CONTAINER_PODS_URL,
  CONTAINER_METRICS_URL,
  CONTAINER_PROMPTS_URL,
  CONTAINER_TOOLS_URL,
  DUPLICATE_CONTAINER_URL,
  CHANGE_IMAGE_ID,
  CONTAINER_EVENTS_URL,
  CONTAINER_CALL_TOOL_URL,
} from '../containers';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('ContainersApi', () => {
  const instance = new ContainersApi({ host: TEST_URL });

  test('calls CONTAINER_EVENTS_URL', async () => {
    expect(CONTAINER_EVENTS_URL()).toBe(`${BASE_CONTAINERS_URL}//events/stream`);
    expect(CONTAINER_EVENTS_URL('aaa')).toBe(`${BASE_CONTAINERS_URL}/aaa/events/stream`);
  });

  test('calls getContainers with correct URL and method for INTERCEPTOR', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getContainers('INTERCEPTOR', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=INTERCEPTOR`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getContainers with correct URL and method for ADAPTER', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getContainers('ADAPTER', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=ADAPTER`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getContainers without type and no type query param', async () => {
    fetch.mockClear();
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getContainers(undefined, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`${TEST_URL}${BASE_CONTAINERS_URL}`);
    expect(options).toEqual(expect.objectContaining({ method: 'GET' }));
  });

  test('calls getContainerPods with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getContainerPods('container1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_PODS_URL('container1')),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getContainerMetrics with correct URL, method and passes the token, returning the parsed snapshot', async () => {
    const snapshot = { engine: 'VLLM', resources: { replicas: { total: 1, ready: 1 }, pods: [] } };
    fetch.mockResponseOnce(JSON.stringify(snapshot), { headers: { 'content-type': 'application/json' } });
    const result = await instance.getContainerMetrics('container1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_METRICS_URL('container1')),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(snapshot);
  });

  test('getContainerMetrics returns null on a failed response', async () => {
    fetch.mockResponseOnce('', { status: 500 });
    const result = await instance.getContainerMetrics('container1', TOKEN_MOCK);
    expect(result).toBeNull();
  });

  test('calls getContainerPrompts with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getContainerPrompts('container1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_PROMPTS_URL('container1')),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getContainer with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getContainer('container1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_URL('container1')),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getContainerTools with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getContainerTools('container1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_TOOLS_URL('container1')),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getInterceptorContainers with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getInterceptorContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=INTERCEPTOR`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getApplicationContainers with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getApplicationContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=APPLICATION`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getModelContainers with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container2']));
    await instance.getModelContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=NIM`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls duplicateContainer with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container2']));
    await instance.duplicateContainer('id', 'new-id', 'new-name', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(DUPLICATE_CONTAINER_URL),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('calls updateContainersImageId with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container2']));
    await instance.updateContainersImageId(['d1', 'd2'], 'id', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CHANGE_IMAGE_ID),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('calls getMCPContainers with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container3']));
    await instance.getMCPContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=MCP`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('calls getImageContainers with image id', async () => {
    fetch.mockResponseOnce(JSON.stringify(['img-containers']));
    const imageId = 'img-123';
    await instance.getImageContainers(imageId, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(SERVER_CONTAINERS_URL(imageId)),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('create, update, delete and run/stop container calls correct endpoints', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.createContainer({ name: 'c1' } as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(BASE_CONTAINERS_URL),
      expect.objectContaining({ method: 'POST' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.updateContainer({ name: 'c1' } as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_URL('c1')),
      expect.objectContaining({ method: 'PUT' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.updateContainer({} as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_URL()),
      expect.objectContaining({ method: 'PUT' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.deleteContainer('c1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_URL('c1')),
      expect.objectContaining({ method: 'DELETE' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.runContainer('c1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(RUN_CONTAINER_URL('c1')),
      expect.objectContaining({ method: 'POST' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.stopContainer('c1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(STOP_CONTAINER_URL('c1')),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('calls callContainerTool with correct URL and method', async () => {
    const body = { name: 'my-tool', arguments: { input: 'test' } };
    fetch.mockResponseOnce(JSON.stringify({ content: [{ type: 'text', text: 'result' }] }));
    await instance.callContainerTool('container1', body, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_CALL_TOOL_URL('container1')),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('getContainerResources and getContainerLogs call correct urls', async () => {
    fetch.mockResponseOnce(JSON.stringify({ resources: [] }));
    await instance.getContainerResources('c1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_RESOURCES_URL('c1')),
      expect.objectContaining({ method: 'GET' }),
    );

    fetch.mockResponseOnce(JSON.stringify(['log1']));
    await instance.getContainerLogs('c1', 'pod1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_LOGS_URL('c1', 'pod1')),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
