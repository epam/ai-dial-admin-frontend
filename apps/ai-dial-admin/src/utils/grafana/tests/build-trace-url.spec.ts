import { describe, expect, test } from 'vitest';

import { buildTraceUrl } from '../build-trace-url';
import { GrafanaConfig } from '../models';

const CONFIG: GrafanaConfig = { baseUrl: 'https://grafana.example.com', datasourceUid: 'tempo-uid', orgId: 3 };
const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';

describe('buildTraceUrl', () => {
  test('targets Explore on the configured datasource and organization', () => {
    const url = new URL(buildTraceUrl(CONFIG, TRACE_ID));

    expect(url.origin + url.pathname).toBe('https://grafana.example.com/explore');
    expect(url.searchParams.get('orgId')).toBe('3');
    expect(url.searchParams.get('schemaVersion')).toBe('1');
  });

  test('queries the trace by its id on the Tempo datasource', () => {
    const panes = JSON.parse(new URL(buildTraceUrl(CONFIG, TRACE_ID)).searchParams.get('panes') ?? '{}');

    expect(panes.a.datasource).toBe('tempo-uid');
    expect(panes.a.queries).toHaveLength(1);
    expect(panes.a.queries[0].query).toBe(TRACE_ID);
    expect(panes.a.queries[0].datasource).toEqual({ type: 'tempo', uid: 'tempo-uid' });
  });
});
