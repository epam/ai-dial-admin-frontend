import { CoveredIds } from '@/src/components/EvalSystemHealth/models';
import { normalizeDeploymentId } from '@/src/components/EvalSystemHealth/utils/normalize-deployment-id';
import {
  DEPLOYMENT_REF_ID_FIELD,
  MCP_DEPLOYMENT_REF_ID_FIELD,
  ROUTES_REF_NAME_FIELD,
} from '@/src/components/ListView/Evaluation/utils/constants';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';
import { fromCanonicalRouteName } from '@/src/utils/evaluation/route-reference';

const addValue = (target: Set<string>, value: unknown, toKey: (raw: string) => string): void => {
  if (typeof value === 'string' && value !== '') {
    target.add(toKey(value));
  }
};

/**
 * Collects what the coverage query's rows targeted: deployment ids from both deployment refs and route names
 * from the route ref, each in its own set. A row carries one ref, the others are empty.
 */
export const parseCoverageRows = (result: StructuredQueryResult | null): CoveredIds => {
  const covered: CoveredIds = { deployments: new Set(), routes: new Set() };
  for (const row of result?.rows ?? []) {
    addValue(covered.deployments, row[DEPLOYMENT_REF_ID_FIELD], normalizeDeploymentId);
    addValue(covered.deployments, row[MCP_DEPLOYMENT_REF_ID_FIELD], normalizeDeploymentId);
    addValue(covered.routes, row[ROUTES_REF_NAME_FIELD], fromCanonicalRouteName);
  }
  return covered;
};
