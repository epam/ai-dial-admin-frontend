import fetch from 'jest-fetch-mock';

import { getFiles, removeFile, moveFiles, importFiles, exportFiles } from './actions';
import { ImportFileTypes } from '@/src/types/import';

describe('Files :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove file', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeFile('file').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call get files', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getFiles('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call move files', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    moveFiles(['path'], 'newPath').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call import files', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    importFiles(new FormData(), ImportFileTypes.ARCHIVE).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call export files', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    exportFiles([]).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});
