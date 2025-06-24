import { ImportFileType } from '@/src/types/import';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { exportFiles, getFiles, importFiles, moveFiles, removeFile } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Files :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove file', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeFile('file').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call get files', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getFiles('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call move files', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    moveFiles(['path'], 'newPath').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call import files', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    importFiles(new FormData(), ImportFileType.ARCHIVE).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call export files', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    exportFiles([]).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});
