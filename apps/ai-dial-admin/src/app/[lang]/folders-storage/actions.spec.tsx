import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { changeFolder, getFolders, getRules, previewPromptZip, removeFolder, updateRules } from './actions';
import { ResourceType } from '@/src/types/resource-type';
const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Folders storage :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call get folders', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getFolders('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call get rules', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getRules('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call update rules', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateRules('folder', []).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call preview prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    previewPromptZip({} as FormData).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call remove folder', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeFolder('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call change folder', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    changeFolder('path', 'new', ResourceType.PROMPT).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});
