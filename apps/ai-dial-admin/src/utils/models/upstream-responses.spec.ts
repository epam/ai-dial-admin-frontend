import { DialModel } from '@/src/models/dial/model';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { describe, expect, test } from 'vitest';
import { clearUpstreamResponsesEndpoints, shouldClearUpstreamResponsesEndpoints } from './upstream-responses';

describe('shouldClearUpstreamResponsesEndpoints', () => {
  test('returns false while adapter responses are still loading', () => {
    const model: DialModel = {
      name: 'm1',
      source: { $type: SOURCE_TYPE.ADAPTER, adapterName: 'adapter-1' },
      upstreams: [{ endpoint: 'http://a', responsesEndpoint: 'http://a/responses' }],
    };

    expect(shouldClearUpstreamResponsesEndpoints(model, false, null)).toBe(false);
  });

  test('returns true when responses are hidden and upstreams have responsesEndpoint', () => {
    const model: DialModel = {
      name: 'm1',
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      upstreams: [{ endpoint: 'http://a', responsesEndpoint: 'http://a/responses' }],
    };

    expect(shouldClearUpstreamResponsesEndpoints(model, false, null)).toBe(true);
  });
});

describe('clearUpstreamResponsesEndpoints', () => {
  test('returns the same model when upstreams have no responsesEndpoint', () => {
    const model: DialModel = {
      name: 'm1',
      upstreams: [{ endpoint: 'http://a', key: 'k' }],
    };

    expect(clearUpstreamResponsesEndpoints(model)).toBe(model);
  });

  test('clears responsesEndpoint from all upstreams', () => {
    const model: DialModel = {
      name: 'm1',
      upstreams: [
        { endpoint: 'http://a', responsesEndpoint: 'http://a/responses' },
        { endpoint: 'http://b', responsesEndpoint: 'http://b/responses' },
      ],
    };

    expect(clearUpstreamResponsesEndpoints(model)).toEqual({
      name: 'm1',
      upstreams: [{ endpoint: 'http://a' }, { endpoint: 'http://b' }],
    });
  });
});
