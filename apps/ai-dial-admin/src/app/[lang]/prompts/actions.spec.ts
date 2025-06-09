import fetch from 'jest-fetch-mock';

import { ImportFileTypes } from '@/src/types/import';
import {
  createPrompt,
  getPrompt,
  getPrompts,
  importPrompts,
  movePrompts,
  removePrompt
} from './actions';

describe('Prompts :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removePrompt('prompt').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call create prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createPrompt({ name: 'prompt' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call get prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getPrompt('folderId', 'name', 'version').then(() => {
      expect(fetch.mock.calls.length).toEqual(2);

      const call = fetch.mock.calls[1][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call get prompts', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getPrompts('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call move prompts', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    movePrompts(['path'], 'newPath').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call import prompts', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    importPrompts({} as FormData, ImportFileTypes.ARCHIVE).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});
