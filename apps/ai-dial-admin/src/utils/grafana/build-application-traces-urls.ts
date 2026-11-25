import { encodeCorePath } from '@/src/server/publications/path';

import {
  DEPLOYMENT_SPAN_ATTRIBUTE,
  DEPLOYMENT_URL_SPAN_ATTRIBUTE,
  ERROR_SPAN_SELECTOR,
  GRAFANA_DATASOURCE_TYPE,
  GRAFANA_EXPLORE_PATH,
  GRAFANA_PANE_ID,
  GRAFANA_QUERY_REF_ID,
  GRAFANA_QUERY_TYPE,
  GRAFANA_RANGE_FROM,
  GRAFANA_RANGE_TO,
  GRAFANA_SCHEMA_VERSION,
  GRAFANA_TABLE_TYPE_TRACES,
} from './constants';
import { GrafanaConfig, GrafanaTraceLinks } from './models';

const escapeRegex = (value: string): string => value.replace(/[\\.*+?^${}()|[\]]/g, '\\$&');

const escapeTraceQlString = (value: string): string => value.replace(/[\\"]/g, '\\$&');

/**
 * Core reports the path percent-encoded per segment (`Code%20Apps%20ALS`), so it is encoded the same way before it
 * is matched. The path sits in a regex inside a TraceQL string, so the regex layer is escaped next and the string
 * layer last.
 */
const escapeDeploymentPath = (path: string): string => escapeTraceQlString(escapeRegex(encodeCorePath(path)));

export const buildExploreUrl = ({ baseUrl, datasourceUid, orgId }: GrafanaConfig, query: string): string => {
  const panes = {
    [GRAFANA_PANE_ID]: {
      datasource: datasourceUid,
      queries: [
        {
          refId: GRAFANA_QUERY_REF_ID,
          datasource: { type: GRAFANA_DATASOURCE_TYPE, uid: datasourceUid },
          queryType: GRAFANA_QUERY_TYPE,
          query,
          tableType: GRAFANA_TABLE_TYPE_TRACES,
        },
      ],
      range: { from: GRAFANA_RANGE_FROM, to: GRAFANA_RANGE_TO },
    },
  };

  // Encoded once and appended as-is: routing it through URLSearchParams would encode it a second time.
  return (
    `${baseUrl}${GRAFANA_EXPLORE_PATH}?schemaVersion=${GRAFANA_SCHEMA_VERSION}` +
    `&panes=${encodeURIComponent(JSON.stringify(panes))}&orgId=${orgId}`
  );
};

/**
 * Builds the Grafana Explore links to all traces of an application and to its error traces only.
 * `path` is the application's Core path (`public/<name>__<version>` or `platform/<name>`).
 */
export const buildApplicationTracesUrls = (config: GrafanaConfig, path: string): GrafanaTraceLinks => {
  const escapedPath = escapeDeploymentPath(path);
  const allTracesQuery =
    `{ ${DEPLOYMENT_SPAN_ATTRIBUTE} =~ ".*${escapedPath}"` +
    ` || ${DEPLOYMENT_URL_SPAN_ATTRIBUTE} =~ ".*/deployments/(applications/)?${escapedPath}/.*" }`;

  return {
    allTracesUrl: buildExploreUrl(config, allTracesQuery),
    errorTracesUrl: buildExploreUrl(config, `${allTracesQuery} >> ${ERROR_SPAN_SELECTOR}`),
  };
};
