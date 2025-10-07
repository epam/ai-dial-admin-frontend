import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { bulkDeleteToolsets, getToolset, getToolsets, moveToolsets, removeToolset, updateToolset } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Assets toolsets server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call get toolsets', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getToolsets('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call get toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    await getToolset('path', 'app', '1.0.0');

    expect(fetch.mock.calls.length).toEqual(2);

    const call = fetch.mock.calls[0][1];
    const call2 = fetch.mock.calls[1][1];
    expect(call?.method).toBe('POST');
    expect(call2?.method).toBe('POST');
  });

  test('Should call update toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateToolset({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call remove toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeToolset('app').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call move toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    moveToolsets(['path'], 'newPath').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call bulk delete toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    bulkDeleteToolsets([{ path: 'path' }]).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});
