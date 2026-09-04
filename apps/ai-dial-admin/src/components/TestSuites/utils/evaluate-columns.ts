import jsonata from 'jsonata';

import { resolveInvocationColumns } from '@/src/components/TestSuites/utils/column-extraction';
import {
  normalizeResponseBodyForColumns,
  unwrapJsonRequestBody,
} from '@/src/components/TestSuites/utils/column-eval-context';
import {
  ColumnExtractionStatus,
  EvaluatedColumn,
  TryOutColumnGroupResult,
  TryOutColumnResults,
  TryOutColumnTurnResult,
  TryOutInvocation,
} from '@/src/components/TestSuites/utils/models';
import {
  ResponseColumn,
  SuiteType,
  TestCaseSchema,
  TestSuite,
  TryOutHistoryEntry,
} from '@/src/models/evaluation/test-suite';
import { toRequestView } from '@/src/utils/evaluation/request-chain';
import {
  getRequestTurnCounts,
  getTryOutSectionShape,
  groupTryOutSections,
  shouldShowTurnLabels,
} from '@/src/utils/evaluation/tryout-sections';

const hasContent = (value?: Record<string, unknown>): boolean => !!value && Object.keys(value).length > 0;

const historyEntryDisplayBody = (entry: TryOutHistoryEntry): unknown => entry.response?.body;

const historyEntryResponse = (entry: TryOutHistoryEntry): Record<string, unknown> =>
  normalizeResponseBodyForColumns(entry.response?.body as Record<string, unknown> | undefined) || {};

const historyEntryRequest = (entry: TryOutHistoryEntry): Record<string, unknown> | undefined =>
  unwrapJsonRequestBody(entry.resolvedRequest?.body as Record<string, unknown> | undefined);

const historyEntryInvocation = (entry: TryOutHistoryEntry): TryOutInvocation => ({
  response: entry.response,
  extractedColumns: entry.extractedColumns,
  extractionWarnings: entry.extractionWarnings,
});

/**
 * Client-side evaluation of column expressions. Reached only for MCP-tool suites, whose try-out
 * performs no extraction — for every other suite the backend's own extraction is what is displayed.
 */
export const evaluateColumns = async (
  columns: ResponseColumn[],
  response: Record<string, unknown>,
  request?: Record<string, unknown>,
): Promise<EvaluatedColumn[]> => {
  return Promise.all(
    columns.map(async (column) => {
      let result = '';
      let status = ColumnExtractionStatus.Failed;

      try {
        const expr = jsonata(column.expression);
        // Backend/eval column expressions use $_request / $_response; FE docs/examples use $request / $response.
        const bindings = {
          request,
          response,
          _request: request,
          _response: response,
        };
        const evaluated = await expr.evaluate(response, bindings);

        if (evaluated != null) {
          status = ColumnExtractionStatus.Extracted;
          result = typeof evaluated === 'object' ? JSON.stringify(evaluated) : String(evaluated);
        }
      } catch {
        result = '';
        status = ColumnExtractionStatus.Failed;
      }

      return {
        name: column.name,
        expression: column.expression,
        type: column.type,
        status,
        result,
      };
    }),
  );
};

interface EvaluateTryOutColumnSectionsParams {
  testSuite: TestSuite;
  history?: TryOutHistoryEntry[];
  schema?: TestCaseSchema[];
  multiTurnLength?: number;
  fallbackColumns?: ResponseColumn[];
  fallbackInvocation?: TryOutInvocation;
  fallbackResponse?: Record<string, unknown>;
  fallbackRequest?: Record<string, unknown>;
}

/**
 * Column results for every section the Try Out panel shows.
 *
 * Values come from the extraction each invocation reported — per invocation, never accumulated across
 * them: the backend reports each one already reconciled against the frame carried between requests, so
 * re-deriving a later request's values from an earlier one's would reimplement those chaining rules a
 * second time.
 */
export const evaluateTryOutColumnSections = async ({
  testSuite,
  history,
  schema,
  multiTurnLength = 0,
  fallbackColumns = [],
  fallbackInvocation = {},
  fallbackResponse = {},
  fallbackRequest,
}: EvaluateTryOutColumnSectionsParams): Promise<TryOutColumnResults> => {
  const turnCounts = getRequestTurnCounts(testSuite, schema, multiTurnLength);
  const shape = getTryOutSectionShape(turnCounts);
  const isMcp = testSuite.suiteType === SuiteType.McpTool;

  const useGroupedHistory =
    !!history?.length && (shape === 'requests' || shape === 'combined') && turnCounts.length > 1;

  if (!useGroupedHistory) {
    if (isMcp) {
      const flatColumns =
        hasContent(fallbackResponse) || hasContent(fallbackRequest)
          ? await evaluateColumns(fallbackColumns, fallbackResponse, fallbackRequest)
          : [];

      return { shape, flatColumns };
    }

    // No invocation at all is distinct from an invocation that reported no extraction: the first shows
    // nothing, the second shows why each column has no value.
    const hasInvocation = !!fallbackInvocation.response || !!fallbackInvocation.extractedColumns;

    return {
      shape,
      flatColumns: hasInvocation ? resolveInvocationColumns(fallbackColumns, fallbackInvocation) : [],
    };
  }

  const groups = groupTryOutSections(history, turnCounts);
  const groupResults: TryOutColumnGroupResult[] = [];

  for (const group of groups) {
    const requestColumns = toRequestView(testSuite, group.requestIndex).responseColumns ?? [];
    const turns: TryOutColumnTurnResult[] = [];

    for (const { turnIndex, item } of group.turns) {
      const columns = isMcp
        ? await evaluateColumns(requestColumns, historyEntryResponse(item), historyEntryRequest(item))
        : resolveInvocationColumns(requestColumns, historyEntryInvocation(item));

      turns.push({ turnIndex, columns, responseBody: historyEntryDisplayBody(item) });
    }

    groupResults.push({
      requestIndex: group.requestIndex,
      showTurnLabels: shouldShowTurnLabels(group, turnCounts),
      turns,
    });
  }

  return { shape, groups: groupResults };
};
