export interface GrafanaEnv {
  [key: string]: string | undefined;
  GRAFANA_TRACES_URL?: string;
  GRAFANA_TEMPO_DATASOURCE_UID?: string;
  GRAFANA_ORG_ID?: string;
}

export interface GrafanaConfig {
  /** The Grafana root with no trailing slash; `/explore` is appended to it. */
  baseUrl: string;
  datasourceUid: string;
  orgId: number;
}

export interface GrafanaTraceLinks {
  allTracesUrl: string;
  errorTracesUrl: string;
}
