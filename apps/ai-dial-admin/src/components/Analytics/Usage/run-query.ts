import { executeQuery } from '@/src/app/[lang]/queries/actions';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';

export interface QueryOutcome {
  result: StructuredQueryResult | null;
  error?: string;
}

/**
 * Never rejects. A transport failure would otherwise become an unhandled rejection with no `.then`
 * to run, leaving the widget that asked for it on its skeleton for good.
 */
export const runUsageQuery = async (query: StructuredQuery): Promise<QueryOutcome> => {
  try {
    const response = await executeQuery(query);

    if (response?.success) {
      return { result: response.response ?? null };
    }

    return { result: null, error: response?.errorMessage ?? response?.errorHeader };
  } catch (error) {
    return { result: null, error: error instanceof Error ? error.message : void 0 };
  }
};
