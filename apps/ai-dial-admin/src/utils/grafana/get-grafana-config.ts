import { normalizeUrl } from '@/src/utils/url';
import { DEFAULT_GRAFANA_ORG_ID, DEFAULT_GRAFANA_TEMPO_DATASOURCE_UID } from './constants';
import { GrafanaConfig, GrafanaEnv } from './models';

const readPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value?.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Reads the Grafana trace-link settings. `GRAFANA_TRACES_URL` is the Grafana root; `GRAFANA_LINK`, the Dashboard
 * page's own target, is deliberately not read. Returns `null` when it is unset or blank, which switches the links
 * off. An empty datasource uid or organization id (as left by `.env.template`) takes its default, and
 * an organization id that is not a positive integer falls back to the default instead of failing the page.
 */
export const getGrafanaConfig = (env: GrafanaEnv): GrafanaConfig | null => {
  const baseUrl = normalizeUrl(env.GRAFANA_TRACES_URL, false);

  if (!baseUrl) {
    return null;
  }

  return {
    baseUrl,
    datasourceUid: env.GRAFANA_TEMPO_DATASOURCE_UID?.trim() || DEFAULT_GRAFANA_TEMPO_DATASOURCE_UID,
    orgId: readPositiveInt(env.GRAFANA_ORG_ID, DEFAULT_GRAFANA_ORG_ID),
  };
};
