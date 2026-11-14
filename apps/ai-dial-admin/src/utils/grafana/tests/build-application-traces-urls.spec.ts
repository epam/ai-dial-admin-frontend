import { describe, expect, test } from 'vitest';

import { buildApplicationTracesUrls } from '../build-application-traces-urls';
import { GrafanaConfig } from '../models';

const CONFIG: GrafanaConfig = { baseUrl: 'https://grafana.example.com', datasourceUid: 'tempo', orgId: 1 };

interface DecodedPanes {
  a: {
    datasource: string;
    queries: {
      refId: string;
      datasource: { type: string; uid: string };
      queryType: string;
      query: string;
      tableType: string;
    }[];
    range: { from: string; to: string };
  };
}

const decodePanes = (url: string): DecodedPanes => {
  const encoded = new URL(url).search.match(/panes=([^&]*)/)?.[1] ?? '';
  return JSON.parse(decodeURIComponent(encoded)) as DecodedPanes;
};

const getQuery = (url: string): string => decodePanes(url).a.queries[0].query;

describe('buildApplicationTracesUrls', () => {
  test('builds the all-traces Explore URL for a versioned public path', () => {
    const { allTracesUrl } = buildApplicationTracesUrls(CONFIG, 'public/ahQuickApp__1.0.0');

    expect(allTracesUrl.startsWith('https://grafana.example.com/explore?schemaVersion=1&panes=')).toBe(true);
    expect(allTracesUrl.endsWith('&orgId=1')).toBe(true);
    expect(decodePanes(allTracesUrl)).toEqual({
      a: {
        datasource: 'tempo',
        queries: [
          {
            refId: 'A',
            datasource: { type: 'tempo', uid: 'tempo' },
            queryType: 'traceql',
            query: '{ span.dial.deployment =~ ".*public/ahQuickApp__1\\\\.0\\\\.0" }',
            tableType: 'traces',
          },
        ],
        range: { from: 'now-24h', to: 'now' },
      },
    });
  });

  test('differs for errors only just by the descendant error clause', () => {
    const { allTracesUrl, errorTracesUrl } = buildApplicationTracesUrls(CONFIG, 'public/ahQuickApp__1.0.0');

    expect(getQuery(errorTracesUrl)).toBe(`${getQuery(allTracesUrl)} >> { status = error }`);
    expect(errorTracesUrl.replace(/panes=[^&]*/, '')).toBe(allTracesUrl.replace(/panes=[^&]*/, ''));
  });

  test('matches a platform application by its platform path', () => {
    expect(getQuery(buildApplicationTracesUrls(CONFIG, 'platform/chat-hub').allTracesUrl)).toBe(
      '{ span.dial.deployment =~ ".*platform/chat-hub" }',
    );
  });

  test('uses the configured datasource uid in both places and the organization id', () => {
    const { allTracesUrl } = buildApplicationTracesUrls(
      { ...CONFIG, datasourceUid: 'tempo-application-otel', orgId: 3 },
      'platform/chat-hub',
    );
    const { a } = decodePanes(allTracesUrl);

    expect(a.datasource).toBe('tempo-application-otel');
    expect(a.queries[0].datasource.uid).toBe('tempo-application-otel');
    expect(allTracesUrl.endsWith('&orgId=3')).toBe(true);
  });

  test('encodes the panes exactly once', () => {
    const { allTracesUrl } = buildApplicationTracesUrls(CONFIG, 'public/ahQuickApp__1.0.0');
    const encoded = new URL(allTracesUrl).search.match(/panes=([^&]*)/)?.[1] ?? '';

    expect(encoded).not.toContain('%25');
    expect(() => JSON.parse(decodeURIComponent(encoded))).not.toThrow();
  });

  test('escapes regular-expression metacharacters so the path matches literally', () => {
    const query = getQuery(buildApplicationTracesUrls(CONFIG, 'public/a(b)+[c]__1.0').allTracesUrl);

    expect(query).toBe('{ span.dial.deployment =~ ".*public/a\\\\(b\\\\)\\\\+\\\\[c\\\\]__1\\\\.0" }');
  });

  test('escapes a double quote for the TraceQL string and keeps the JSON valid', () => {
    const { allTracesUrl } = buildApplicationTracesUrls(CONFIG, 'public/we"ird__1.0.0');

    expect(getQuery(allTracesUrl)).toBe('{ span.dial.deployment =~ ".*public/we\\"ird__1\\\\.0\\\\.0" }');
  });

  test('escapes a backslash for both the regular expression and the string literal', () => {
    const { allTracesUrl } = buildApplicationTracesUrls(CONFIG, 'public/a\\b');

    expect(getQuery(allTracesUrl)).toBe('{ span.dial.deployment =~ ".*public/a\\\\\\\\b" }');
  });
});
