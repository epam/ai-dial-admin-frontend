import fetch from 'jest-fetch-mock';
import {
  createModel,
  getModelsAdapters,
  getModelsTokenizers,
  getModelsTopics,
  removeModel,
  updateModel,
} from './actions';

describe('Models :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call get models topics', async () => {
    fetch.mockResponseOnce(JSON.stringify({ data: 'response' }));
    getModelsTopics().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  it('Should call get models tokenizers', async () => {
    fetch.mockResponseOnce(JSON.stringify({ data: 'response' }));
    getModelsTokenizers().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  it('Should call get models adapters', async () => {
    fetch.mockResponseOnce(JSON.stringify({ data: 'response' }));
    getModelsAdapters().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  it('Should call remove model', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeModel('model').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create model', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createModel({ name: 'model' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update model', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateModel({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});
