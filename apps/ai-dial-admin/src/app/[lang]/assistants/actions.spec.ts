import { createAssistant, removeAssistant, updateAssistant } from './actions';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Assistants :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove assistant', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeAssistant('assistant').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create assistant', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createAssistant({ name: 'assistant' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update assistant', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateAssistant({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});
