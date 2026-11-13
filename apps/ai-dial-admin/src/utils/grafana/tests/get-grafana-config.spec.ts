import { describe, expect, test } from 'vitest';

import { getGrafanaConfig } from '../get-grafana-config';

describe('getGrafanaConfig', () => {
  test.each([undefined, '', '   '])('returns null when GRAFANA_TRACES_URL is %j', (url) => {
    expect(getGrafanaConfig({ GRAFANA_TRACES_URL: url })).toBeNull();
  });

  test('ignores GRAFANA_LINK, which belongs to the Dashboard page', () => {
    expect(getGrafanaConfig({ GRAFANA_LINK: 'https://grafana.example.com' })).toBeNull();
  });

  test('applies the datasource uid and organization id defaults', () => {
    expect(getGrafanaConfig({ GRAFANA_TRACES_URL: 'https://grafana.example.com' })).toEqual({
      baseUrl: 'https://grafana.example.com',
      datasourceUid: 'tempo',
      orgId: 1,
    });
  });

  test('strips trailing slashes and surrounding whitespace from the traces URL', () => {
    expect(getGrafanaConfig({ GRAFANA_TRACES_URL: ' https://grafana.example.com// ' })?.baseUrl).toBe(
      'https://grafana.example.com',
    );
  });

  test('reads a custom datasource uid and organization id', () => {
    expect(
      getGrafanaConfig({
        GRAFANA_TRACES_URL: 'https://grafana.example.com/',
        GRAFANA_TEMPO_DATASOURCE_UID: ' tempo-application-otel ',
        GRAFANA_ORG_ID: '3',
      }),
    ).toEqual({ baseUrl: 'https://grafana.example.com', datasourceUid: 'tempo-application-otel', orgId: 3 });
  });

  test('falls back to the defaults for empty variables', () => {
    const config = getGrafanaConfig({
      GRAFANA_TRACES_URL: 'https://grafana.example.com',
      GRAFANA_TEMPO_DATASOURCE_UID: '',
      GRAFANA_ORG_ID: '',
    });

    expect(config?.datasourceUid).toBe('tempo');
    expect(config?.orgId).toBe(1);
  });

  test.each(['abc', '0', '-2', '1.5'])('falls back to organization id 1 for %j', (orgId) => {
    expect(getGrafanaConfig({ GRAFANA_TRACES_URL: 'https://grafana.example.com', GRAFANA_ORG_ID: orgId })?.orgId).toBe(
      1,
    );
  });
});
