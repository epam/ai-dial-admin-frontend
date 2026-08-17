import { ResponseColumn, TestSuite, TestSuiteAdditionalRequest } from '@/src/models/evaluation/test-suite';

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

export const addRequest = (suite: TestSuite): TestSuite => ({
  ...suite,
  additionalRequests: [...(suite.additionalRequests ?? []), {}],
});

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
