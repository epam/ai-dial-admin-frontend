import fetch from 'jest-fetch-mock';
import { createAssistant, removeAssistant, updateAssistant } from './actions';

describe('Assistants :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove assistant', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeAssistant('assistant').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create assistant', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createAssistant({ name: 'assistant' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update assistant', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateAssistant({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});
