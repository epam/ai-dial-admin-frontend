import { DialModel } from '@/src/models/dial/model';
import { describe, expect, test } from 'vitest';
import { clearUpstreamResponsesEndpoints } from './upstream-responses';

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
