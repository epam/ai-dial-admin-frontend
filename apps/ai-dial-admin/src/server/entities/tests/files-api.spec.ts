import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { FILES_URL, FilesApi } from '../files-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: FilesApi', () => {
  const instance = new FilesApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getFilesList and returns list of files', async () => {
    const mockFiles: DialFile[] = [{ name: 'file1' }, { name: 'file2' }] as DialFile[];

    fetchMock.mockResponseOnce(JSON.stringify({ items: mockFiles }));

    await instance.getFilesList(TOKEN_MOCK, '/mock-path');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(FILES_URL),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/mock-path' }),
      }),
    );
  });

  test('Should calls removeFile and sends DELETE request and returns ServerActionResponse', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeFile(TOKEN_MOCK, '/test-file.txt');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`${FILES_URL}?path=/test-file.txt`),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls moveFiles and sends POST requests and returns ServerActionResponses', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = ['/old/file1.txt', '/old/file2.txt'];
    await instance.moveFiles(TOKEN_MOCK, paths, '/new');

    expect(fetchMock).toHaveBeenCalledTimes(paths.length);
  });
});
