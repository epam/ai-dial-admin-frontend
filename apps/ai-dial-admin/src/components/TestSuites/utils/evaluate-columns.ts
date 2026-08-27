import jsonata from 'jsonata';

import {
  normalizeResponseBodyForColumns,
  unwrapJsonRequestBody,
} from '@/src/components/TestSuites/utils/column-eval-context';
import { ResponseColumn, TestCaseSchema, TestSuite, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import { toRequestView } from '@/src/utils/evaluation/request-chain';
import {
  getRequestTurnCounts,
  getTryOutSectionShape,
  groupTryOutSections,
  shouldShowTurnLabels,
  TryOutSectionShape,
} from '@/src/utils/evaluation/tryout-sections';

export interface EvaluatedColumn {
  name: string;
  expression: string;
  type: string;
  result: string;
  valid: boolean;
}

export interface TryOutColumnTurnResult {
  turnIndex: number;
  columns: EvaluatedColumn[];
  responseBody?: unknown;
}

export interface TryOutColumnGroupResult {
  requestIndex: number;
  showTurnLabels: boolean;
  turns: TryOutColumnTurnResult[];
}

export interface TryOutColumnResults {
  shape: TryOutSectionShape;
  flatColumns?: EvaluatedColumn[];
  groups?: TryOutColumnGroupResult[];
}

const hasContent = (value?: Record<string, unknown>): boolean => !!value && Object.keys(value).length > 0;

const parseColumnBindingValue = (result: string): unknown => {
  if (result === 'true') {
    return true;
  }
  if (result === 'false') {
    return false;
  }
  if (result === '') {
    return '';
  }

  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
};

const mergeColumnBindings = (
  bindings: Record<string, unknown>,
  evaluated: EvaluatedColumn[],
): Record<string, unknown> => {
  const next = { ...bindings };

  for (const column of evaluated) {
    if (!column.name || !column.valid) {
      continue;
    }
    next[column.name] = parseColumnBindingValue(column.result);
  }

  return next;
};

const historyEntryDisplayBody = (entry: TryOutHistoryEntry): unknown => (entry.response as { body?: unknown })?.body;

const historyEntryResponse = (entry: TryOutHistoryEntry): Record<string, unknown> =>
  normalizeResponseBodyForColumns((entry.response as { body?: Record<string, unknown> })?.body) || {};

const historyEntryRequest = (entry: TryOutHistoryEntry): Record<string, unknown> | undefined =>
  unwrapJsonRequestBody(entry.resolvedRequest?.body as Record<string, unknown> | undefined);

export const evaluateColumns = async (
  columns: ResponseColumn[],
  response: Record<string, unknown>,
  request?: Record<string, unknown>,
  extraBindings?: Record<string, unknown>,
): Promise<EvaluatedColumn[]> => {
  return Promise.all(
    columns.map(async (column) => {
      let result: string = '';
      let valid = false;

      try {
        const expr = jsonata(column.expression);
        // Backend/eval column expressions use $_request / $_response; FE docs/examples use $request / $response.
        const bindings = {
          ...extraBindings,
          request,
          response,
          _request: request,
          _response: response,
        };
        const evaluated = await expr.evaluate(response, bindings);
        valid = evaluated != null;
        if (!valid) {
          result = '';
        } else {
          result = typeof evaluated === 'object' ? JSON.stringify(evaluated) : String(evaluated);
        }
      } catch {
        result = '';
        valid = false;
      }

      return {
        name: column.name,
        expression: column.expression,
        type: column.type,
        result,
        valid,
      };
    }),
  );
};

export const evaluateTryOutColumnSections = async ({
  testSuite,
  history,
  schema,
  multiTurnLength = 0,
  fallbackColumns = [],
  fallbackResponse = {},
  fallbackRequest,
}: {
  testSuite: TestSuite;
  history?: TryOutHistoryEntry[];
  schema?: TestCaseSchema[];
  multiTurnLength?: number;
  fallbackColumns?: ResponseColumn[];
  fallbackResponse?: Record<string, unknown>;
  fallbackRequest?: Record<string, unknown>;
}): Promise<TryOutColumnResults> => {
  const turnCounts = getRequestTurnCounts(testSuite, schema, multiTurnLength);
  const shape = getTryOutSectionShape(turnCounts);

  const useGroupedHistory =
    !!history?.length && (shape === 'requests' || shape === 'combined') && turnCounts.length > 1;

  if (!useGroupedHistory) {
    if (!hasContent(fallbackResponse) && !hasContent(fallbackRequest)) {
      return { shape, flatColumns: [] };
    }

    const flatColumns = await evaluateColumns(fallbackColumns, fallbackResponse, fallbackRequest);
    return { shape, flatColumns };
  }

  const groups = groupTryOutSections(history, turnCounts);
  let accumulatedBindings: Record<string, unknown> = {};
  const groupResults: TryOutColumnGroupResult[] = [];

  for (const group of groups) {
    const requestColumns = toRequestView(testSuite, group.requestIndex).responseColumns ?? [];
    const turns: TryOutColumnTurnResult[] = [];

    for (const { turnIndex, item } of group.turns) {
      const response = historyEntryResponse(item);
      const request = historyEntryRequest(item);
      const columns = await evaluateColumns(requestColumns, response, request, accumulatedBindings);
      accumulatedBindings = mergeColumnBindings(accumulatedBindings, columns);
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
