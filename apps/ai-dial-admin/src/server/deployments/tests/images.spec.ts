import { describe, test, expect, vi } from 'vitest';
import {
  ImagesApi,
  IMAGES_URL,
  IMAGE_URL,
  IMAGE_VERSIONS_URL,
  IMAGES_WITH_VERSIONS,
  INSTALL_IMAGES_URL,
  IMAGE_LOGS_URL,
} from '../images';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('ImagesApi', () => {
  const instance = new ImagesApi({ host: TEST_URL });

  test('getMCPImages, getInterceptorImages, getModelImages call correct endpoints', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getImages(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${IMAGES_URL}`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getImage and getImageVersions call correct urls', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.getImage('img1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGE_URL('img1')),
      expect.objectContaining({ method: 'GET' }),
    );

    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getImageVersions('img1', 'INTERCEPTOR', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGE_VERSIONS_URL('img1', 'INTERCEPTOR')),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('create, update, delete and install image call correct endpoints', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.createImage({ id: 'i1' } as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGES_URL),
      expect.objectContaining({ method: 'POST' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.updateImage({ id: 'i1', name: 'n' } as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGE_URL('i1')),
      expect.objectContaining({ method: 'PUT' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.updateImage({ name: 'n' } as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGE_URL()),
      expect.objectContaining({ method: 'PUT' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.deleteImage('i1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGE_URL('i1')),
      expect.objectContaining({ method: 'DELETE' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.installImage('i1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(INSTALL_IMAGES_URL),
      expect.objectContaining({ method: 'POST' }),
    );

    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.getImageLogs('i1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGE_LOGS_URL('i1')),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getImagesWithVersions calls grouped endpoint', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getImagesWithVersions('MCP', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGES_WITH_VERSIONS('MCP')),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
