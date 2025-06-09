import fetch from 'jest-fetch-mock';

import { getFolders, getRules, updateRules } from './actions';

describe('Folders storage :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call get folders', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getFolders('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call get rules', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getRules('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  it('Should call update rules', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateRules('folder', []).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});
