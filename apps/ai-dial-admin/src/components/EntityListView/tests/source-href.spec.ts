import { describe, expect, test } from 'vitest';

import { getEntitySourceHref } from '@/src/components/EntityListView/source-href';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

describe('getEntitySourceHref', () => {
  test('links an adapter source to the adapter details page', () => {
    expect(getEntitySourceHref({ source: { $type: SOURCE_TYPE.ADAPTER, adapterName: 'openai' } })).toBe(
      '/adapters/openai',
    );
  });

  test('links a container source to the container details page', () => {
    expect(getEntitySourceHref({ source: { $type: SOURCE_TYPE.CONTAINER, containerId: 'mcp-1' } })).toBe(
      '/containers/mcp-1',
    );
  });

  test.each([
    ['an endpoints source', { $type: SOURCE_TYPE.ENDPOINTS }],
    ['a runner source', { $type: SOURCE_TYPE.RUNNER, runnerName: 'runner' }],
    ['a schema source', { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'schema' }],
    ['an MCP registry source', { $type: SOURCE_TYPE.MCP_REGISTRY, serverName: 'server' }],
    ['an adapter source without a name', { $type: SOURCE_TYPE.ADAPTER }],
  ])('gives no link for %s', (_label, source) => {
    expect(getEntitySourceHref({ source })).toBeUndefined();
  });

  test('gives no link when the row has no source', () => {
    expect(getEntitySourceHref(undefined)).toBeUndefined();
    expect(getEntitySourceHref({})).toBeUndefined();
  });
});
