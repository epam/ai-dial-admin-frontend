import { ResponseColumn, TestSuite, TestSuiteAdditionalRequest } from '@/src/models/evaluation/test-suite';
import { JsonataVariable } from '@/src/models/jsonata';

export const MAX_ADDITIONAL_REQUESTS = 10;

export const getRequestCount = (suite: TestSuite): number => 1 + (suite.additionalRequests?.length ?? 0);

export const getRequestName = (suite: TestSuite, index: number): string | undefined =>
  index === 0 ? suite.requestName : suite.additionalRequests?.[index - 1]?.name;

/** `requestWord` is the localized word for a request, used when the request was left unnamed. */
export const getRequestLabel = (suite: TestSuite, index: number, requestWord: string): string =>
  getRequestName(suite, index) || `${index + 1}. ${requestWord}`;

export const updateRequestName = (suite: TestSuite, index: number, name: string): TestSuite => {
  if (index === 0) {
    return { ...suite, requestName: name };
  }

  const additionalRequests = [...(suite.additionalRequests ?? [])];
  additionalRequests[index - 1] = { ...additionalRequests[index - 1], name };

  return { ...suite, additionalRequests };
};

export const toRequestView = (suite: TestSuite, index: number): TestSuite => {
  if (index === 0) {
    return suite;
  }

  const request = suite.additionalRequests?.[index - 1];

  return {
    ...suite,
    endpointRef: request?.endpointRef,
    requestTemplate: request?.requestTemplate,
    responseColumns: request?.responseColumns,
    inputBindings: request?.inputBindings,
  };
};

export const fromRequestView = (suite: TestSuite, index: number, view: TestSuite): TestSuite => {
  if (index === 0) {
    return view;
  }

  const additionalRequests = [...(suite.additionalRequests ?? [])];
  const existing = additionalRequests[index - 1];

  additionalRequests[index - 1] = {
    ...existing,
    endpointRef: view.endpointRef,
    requestTemplate: view.requestTemplate,
    responseColumns: view.responseColumns,
    inputBindings: view.inputBindings,
  };

  return { ...suite, additionalRequests };
};

export const addRequest = (suite: TestSuite): TestSuite => {
  if ((suite.additionalRequests?.length ?? 0) >= MAX_ADDITIONAL_REQUESTS) {
    return suite;
  }

  return { ...suite, additionalRequests: [...(suite.additionalRequests ?? []), {}] };
};

export const removeRequestAt = (suite: TestSuite, index: number): TestSuite => {
  if (index < 1 || !suite.additionalRequests) {
    return suite;
  }

  const additionalRequests = suite.additionalRequests.filter((_, i) => i !== index - 1);

  return { ...suite, additionalRequests };
};

export const getChainResponseColumns = (suite: TestSuite): ResponseColumn[] => [
  ...(suite.responseColumns ?? []),
  ...(suite.additionalRequests ?? []).flatMap((request: TestSuiteAdditionalRequest) => request.responseColumns ?? []),
];

/** Column names already used by every chain request except `excludeIndex`. */
export const getTakenResponseColumnNames = (suite: TestSuite, excludeIndex: number): string[] => {
  const names: string[] = [];

  if (excludeIndex !== 0) {
    names.push(...(suite.responseColumns ?? []).map((column) => column.name).filter(Boolean));
  }

  (suite.additionalRequests ?? []).forEach((request, index) => {
    if (index + 1 === excludeIndex) {
      return;
    }
    names.push(...(request.responseColumns ?? []).map((column) => column.name).filter(Boolean));
  });

  return names;
};

export const uniqueResponseColumnName = (base: string, taken: Iterable<string>): string => {
  const takenSet = new Set(taken);
  if (!base || !takenSet.has(base)) {
    return base;
  }

  let suffix = 2;
  while (takenSet.has(`${base}${suffix}`)) {
    suffix += 1;
  }

  return `${base}${suffix}`;
};

export const uniquifyResponseColumns = (columns: ResponseColumn[], taken: Iterable<string>): ResponseColumn[] => {
  const takenSet = new Set(taken);

  return columns.map((column) => {
    const name = uniqueResponseColumnName(column.name, takenSet);
    takenSet.add(name);
    if (name === column.name) {
      return column;
    }

    return { ...column, name, displayName: name };
  });
};

export interface DuplicateResponseColumn {
  name: string;
  inPreviousRequest: boolean;
}

/**
 * First non-blank column name that collides with `taken` (another request) or a sibling
 * in `columns`. Prefer a previous-request collision when both apply for the same name.
 */
export const findDuplicateResponseColumnName = (
  columns: ResponseColumn[],
  taken: Iterable<string>,
): DuplicateResponseColumn | undefined => {
  const takenSet = new Set(taken);
  const seen = new Set<string>();

  for (const column of columns) {
    const name = column.name;
    if (!name) {
      continue;
    }

    if (takenSet.has(name)) {
      return { name, inPreviousRequest: true };
    }

    if (seen.has(name)) {
      return { name, inPreviousRequest: false };
    }

    seen.add(name);
  }

  return undefined;
};

/**
 * JSONata variables that request `index` inherits from the chain — one per named response column of
 * every preceding request, in chain order. `describeRequest` receives the producing request's index so
 * the caller can attach a localized origin label.
 */
export const getPreviousOutputVariables = (
  suite: TestSuite,
  index: number,
  describeRequest?: (requestIndex: number) => string,
): JsonataVariable[] => {
  const requests: (TestSuite | TestSuiteAdditionalRequest)[] = [suite, ...(suite.additionalRequests ?? [])];

  return requests
    .slice(0, Math.max(0, index))
    .flatMap((request, requestIndex) =>
      (request.responseColumns ?? [])
        .filter((column) => !!column.name)
        .map((column) => ({ name: column.name, description: describeRequest?.(requestIndex) })),
    );
};
