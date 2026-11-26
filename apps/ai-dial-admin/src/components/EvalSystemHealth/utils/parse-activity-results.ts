import { normalizeDeploymentId } from '@/src/components/EvalSystemHealth/utils/normalize-deployment-id';
import {
  DEPLOYMENT_REF_ID_FIELD,
  MCP_DEPLOYMENT_REF_ID_FIELD,
  ROUTES_REF_NAME_FIELD,
} from '@/src/components/ListView/Evaluation/utils/constants';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';
import { fromCanonicalRouteName } from '@/src/utils/evaluation/route-reference';

/** The number of rows, which for a group-by query is the number of groups. */
export const countRows = (result: StructuredQueryResult): number => result.rows?.length ?? 0;

/** The backend's total for the query when it reports one, otherwise the rows that came back. */
export const readTotalCount = (result: StructuredQueryResult): number => result.totalCount ?? countRows(result);

/** The number of distinct deployments, toolsets and routes the rows target; a row that targets none adds none. */
export const countTargetedEvaluatees = (result: StructuredQueryResult): number => {
  const deployments = new Set<string>();
  const routes = new Set<string>();
  for (const row of result.rows ?? []) {
    for (const value of [row[DEPLOYMENT_REF_ID_FIELD], row[MCP_DEPLOYMENT_REF_ID_FIELD]]) {
      if (typeof value === 'string' && value !== '') {
        deployments.add(normalizeDeploymentId(value));
      }
    }
    const route = row[ROUTES_REF_NAME_FIELD];
    if (typeof route === 'string' && route !== '') {
      routes.add(fromCanonicalRouteName(route));
    }
  }
  return deployments.size + routes.size;
};
