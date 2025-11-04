import { createToolset, getCoreToolset, getTools, removeToolset, updateCoreToolset, updateToolset } from './actions';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();
describe('Toolsets :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call get tools', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getTools('tool').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call get core toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getCoreToolset('tool', 'etag').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call remove toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeToolset('toolset').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createToolset({ name: 'toolset', endpoint: 'http://example' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call create toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createToolset({ name: 'toolset', endpoint: 'https://example' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call create toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createToolset({ name: 'toolset', endpoint: 'sse://example' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateToolset({}, 'etag').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });

  test('Should call update core toolset', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateCoreToolset({}, 'etag').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});
