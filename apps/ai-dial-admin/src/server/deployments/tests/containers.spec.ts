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
} from '../containers';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('ContainersApi', () => {
  const instance = new ContainersApi({ host: TEST_URL });

  test('calls getInterceptorContainers with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(['container1']));
    await instance.getInterceptorContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=INTERCEPTOR`),
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
    await instance.createContainer({ id: 'c1' } as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(BASE_CONTAINERS_URL),
      expect.objectContaining({ method: 'POST' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.updateContainer({ id: 'c1' } as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(CONTAINER_URL('c1')),
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
