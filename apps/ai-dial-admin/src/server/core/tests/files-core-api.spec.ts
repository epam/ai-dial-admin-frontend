import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { FilesCoreApi } from '../files-core-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: FilesCoreApi', () => {
  const instance = new FilesCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getFileMetadata encodes the path and calls the metadata endpoint', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({ name: 'file.txt', nodeType: 'item', path: 'b/f/file.txt', folderId: 'b/f/' }),
    );

    await instance.getFileMetadata(TOKEN_MOCK, 'bucket/my folder/file.txt');

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/metadata/files/bucket/my%20folder/file.txt');
    expect(calledUrl).toContain('recursive=false');
    expect((init as RequestInit).method).toBe('GET');
  });

  test('uploadFile PUTs multipart form data with a "file" part', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));
    const file = new File(['data'], 'doc.txt', { type: 'text/plain' });

    await instance.uploadFile(TOKEN_MOCK, 'bucket/publications_updates/doc.txt', file);

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/files/bucket/publications_updates/doc.txt');
    expect((init as RequestInit).method).toBe('PUT');
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
  });
});
