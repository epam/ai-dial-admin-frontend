import { CoveredIds } from '@/src/components/EvalSystemHealth/models';
import { normalizeDeploymentId } from '@/src/components/EvalSystemHealth/utils/normalize-deployment-id';
import {
  DEPLOYMENT_REF_ID_FIELD,
  MCP_DEPLOYMENT_REF_ID_FIELD,
} from '@/src/components/ListView/Evaluation/utils/constants';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

const addId = (target: CoveredIds, value: unknown): void => {
  if (typeof value === 'string' && value !== '') {
    target.add(normalizeDeploymentId(value));
  }
};

/** Collects the evaluatee ids of the coverage query's rows from both refs; a row carries one, the other is empty. */
export const parseCoverageRows = (result: StructuredQueryResult | null): CoveredIds => {
  const covered: CoveredIds = new Set();
  for (const row of result?.rows ?? []) {
    addId(covered, row[DEPLOYMENT_REF_ID_FIELD]);
    addId(covered, row[MCP_DEPLOYMENT_REF_ID_FIELD]);
  }
  return covered;
};
