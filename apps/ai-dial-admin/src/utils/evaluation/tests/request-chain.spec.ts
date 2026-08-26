import { describe, expect, test } from 'vitest';

import {
  MAX_ADDITIONAL_REQUESTS,
  addRequest,
  fromRequestView,
  getChainResponseColumns,
  getPreviousOutputVariables,
  getRequestCount,
  getRequestLabel,
  getRequestName,
  getTakenResponseColumnNames,
  findDuplicateResponseColumnName,
  removeRequestAt,
  toRequestView,
  uniqueResponseColumnName,
  uniquifyResponseColumns,
  updateRequestName,
} from '../request-chain';
import { TestSuite } from '@/src/models/evaluation/test-suite';

describe('MAX_ADDITIONAL_REQUESTS', () => {
  test('is 10', () => {
    expect(MAX_ADDITIONAL_REQUESTS).toBe(10);
  });
});

describe('getRequestCount', () => {
  test('returns 1 when additionalRequests is absent', () => {
    expect(getRequestCount({})).toBe(1);
  });

  test('returns 1 when additionalRequests is empty', () => {
    expect(getRequestCount({ additionalRequests: [] })).toBe(1);
  });

  test('returns 1 + additionalRequests length', () => {
    expect(getRequestCount({ additionalRequests: [{}, {}] })).toBe(3);
  });
});

describe('getRequestName', () => {
  test('index 0 returns requestName', () => {
    expect(getRequestName({ requestName: 'Main' }, 0)).toBe('Main');
  });

  test('index 0 returns undefined when requestName is not set', () => {
    expect(getRequestName({}, 0)).toBeUndefined();
  });

  test('index > 0 returns the matching additional request name', () => {
    const suite: TestSuite = { additionalRequests: [{ name: 'Second' }, { name: 'Third' }] };
    expect(getRequestName(suite, 1)).toBe('Second');
    expect(getRequestName(suite, 2)).toBe('Third');
  });

  test('index > 0 returns undefined when additionalRequests is missing or out of range', () => {
    expect(getRequestName({}, 1)).toBeUndefined();
    expect(getRequestName({ additionalRequests: [{ name: 'Second' }] }, 5)).toBeUndefined();
  });
});

describe('getRequestLabel', () => {
  test('returns the request name when it is set', () => {
    expect(getRequestLabel({ requestName: 'Main' }, 0, 'Request')).toBe('Main');
    expect(getRequestLabel({ additionalRequests: [{ name: 'Second' }] }, 1, 'Request')).toBe('Second');
  });

  test('falls back to a 1-based numbered label when the name is missing', () => {
    expect(getRequestLabel({}, 0, 'Request')).toBe('1. Request');
    expect(getRequestLabel({ additionalRequests: [{}] }, 1, 'Request')).toBe('2. Request');
  });

  test('falls back to a numbered label when the name is an empty string', () => {
    expect(getRequestLabel({ requestName: '' }, 0, 'Request')).toBe('1. Request');
  });
});

describe('updateRequestName', () => {
  test('index 0 sets requestName without mutating the input', () => {
    const suite: TestSuite = { requestName: 'Old' };
    const result = updateRequestName(suite, 0, 'New');

    expect(result.requestName).toBe('New');
    expect(suite.requestName).toBe('Old');
  });

  test('index > 0 sets the name of the matching additional request without mutating the input', () => {
    const suite: TestSuite = { additionalRequests: [{ name: 'Old' }] };
    const result = updateRequestName(suite, 1, 'New');

    expect(result.additionalRequests).toEqual([{ name: 'New' }]);
    expect(suite.additionalRequests).toEqual([{ name: 'Old' }]);
  });

  test('index > 0 creates the additionalRequests array when absent', () => {
    const result = updateRequestName({}, 1, 'First additional');

    expect(result.additionalRequests).toEqual([{ name: 'First additional' }]);
  });
});

describe('toRequestView', () => {
  test('index 0 returns the suite unchanged (same reference)', () => {
    const suite: TestSuite = { endpointRef: { method: 'GET' } };
    expect(toRequestView(suite, 0)).toBe(suite);
  });

  test('index > 0 replaces request-scoped fields with the additional request fields', () => {
    const suite: TestSuite = {
      endpointRef: { method: 'GET' },
      requestTemplate: { urlTemplate: '/main' },
      responseColumns: [{ name: 'a', displayName: 'A', expression: 'a', type: 'string' }],
      inputBindings: [{ templateVariable: 'x' }],
      additionalRequests: [
        { name: 'Second', endpointRef: { method: 'POST' }, requestTemplate: { urlTemplate: '/second' } },
      ],
    };

    const view = toRequestView(suite, 1);

    expect(view.endpointRef).toEqual({ method: 'POST' });
    expect(view.requestTemplate).toEqual({ urlTemplate: '/second' });
    expect(view.responseColumns).toBeUndefined();
    expect(view.inputBindings).toBeUndefined();
  });

  test('index > 0 with a missing additional request overwrites fields with undefined', () => {
    const suite: TestSuite = {
      endpointRef: { method: 'GET' },
      requestTemplate: { urlTemplate: '/main' },
      additionalRequests: [{}],
    };

    const view = toRequestView(suite, 1);

    expect(view.endpointRef).toBeUndefined();
    expect(view.requestTemplate).toBeUndefined();
  });

  test('does not mutate the input suite', () => {
    const suite: TestSuite = {
      endpointRef: { method: 'GET' },
      additionalRequests: [{ endpointRef: { method: 'POST' } }],
    };

    toRequestView(suite, 1);

    expect(suite.endpointRef).toEqual({ method: 'GET' });
  });
});

describe('fromRequestView', () => {
  test('index 0 returns the view unchanged (same reference)', () => {
    const suite: TestSuite = { requestName: 'Main' };
    const view: TestSuite = { requestName: 'Main', endpointRef: { method: 'GET' } };

    expect(fromRequestView(suite, 0, view)).toBe(view);
  });

  test('index > 0 copies the 4 request-scoped fields from the view into the matching entry, preserving name', () => {
    const suite: TestSuite = { additionalRequests: [{ name: 'Second', endpointRef: { method: 'GET' } }] };
    const view: TestSuite = {
      endpointRef: { method: 'POST' },
      requestTemplate: { urlTemplate: '/second' },
      responseColumns: [{ name: 'a', displayName: 'A', expression: 'a', type: 'string' }],
      inputBindings: [{ templateVariable: 'x' }],
    };

    const result = fromRequestView(suite, 1, view);

    expect(result.additionalRequests).toEqual([
      {
        name: 'Second',
        endpointRef: { method: 'POST' },
        requestTemplate: { urlTemplate: '/second' },
        responseColumns: [{ name: 'a', displayName: 'A', expression: 'a', type: 'string' }],
        inputBindings: [{ templateVariable: 'x' }],
      },
    ]);
  });

  test('index > 0 overwrites with undefined when the view field is undefined', () => {
    const suite: TestSuite = {
      additionalRequests: [
        {
          name: 'Second',
          endpointRef: { method: 'GET' },
          requestTemplate: { urlTemplate: '/second' },
          responseColumns: [{ name: 'a', displayName: 'A', expression: 'a', type: 'string' }],
          inputBindings: [{ templateVariable: 'x' }],
        },
      ],
    };
    const view: TestSuite = {};

    const result = fromRequestView(suite, 1, view);

    expect(result.additionalRequests).toEqual([{ name: 'Second' }]);
  });

  test('uses the current suite as the base, not the view, when the view diverges', () => {
    const suite: TestSuite = { requestName: 'Main', additionalRequests: [{ name: 'Second' }] };
    const view: TestSuite = { requestName: 'Stale main value' };

    const result = fromRequestView(suite, 1, view);

    expect(result.requestName).toBe('Main');
  });

  test('does not mutate the input suite or view', () => {
    const suite: TestSuite = { additionalRequests: [{ name: 'Second', endpointRef: { method: 'GET' } }] };
    const view: TestSuite = { endpointRef: { method: 'POST' } };

    fromRequestView(suite, 1, view);

    expect(suite.additionalRequests).toEqual([{ name: 'Second', endpointRef: { method: 'GET' } }]);
    expect(view.endpointRef).toEqual({ method: 'POST' });
  });

  test('round-trips through toRequestView and back to an equivalent suite', () => {
    const suite: TestSuite = {
      requestName: 'Main',
      endpointRef: { method: 'GET' },
      additionalRequests: [
        { name: 'Second', endpointRef: { method: 'POST' }, requestTemplate: { urlTemplate: '/second' } },
      ],
    };

    const view = toRequestView(suite, 1);
    const result = fromRequestView(suite, 1, view);

    expect(result).toEqual(suite);
  });
});

describe('addRequest', () => {
  test('appends an empty request when additionalRequests is absent', () => {
    const result = addRequest({});
    expect(result.additionalRequests).toEqual([{}]);
  });

  test('appends an empty request without mutating the input', () => {
    const suite: TestSuite = { additionalRequests: [{ name: 'First' }] };
    const result = addRequest(suite);

    expect(result.additionalRequests).toEqual([{ name: 'First' }, {}]);
    expect(suite.additionalRequests).toEqual([{ name: 'First' }]);
  });

  test('appends up to MAX_ADDITIONAL_REQUESTS entries', () => {
    const suite: TestSuite = { additionalRequests: Array(MAX_ADDITIONAL_REQUESTS - 1).fill({}) };
    const result = addRequest(suite);

    expect(result.additionalRequests).toHaveLength(MAX_ADDITIONAL_REQUESTS);
  });

  test('is a no-op once the chain has 11 requests (MAX_ADDITIONAL_REQUESTS reached)', () => {
    const suite: TestSuite = { additionalRequests: Array(MAX_ADDITIONAL_REQUESTS).fill({}) };
    const result = addRequest(suite);

    expect(result).toBe(suite);
    expect(result.additionalRequests).toHaveLength(MAX_ADDITIONAL_REQUESTS);
  });
});

describe('removeRequestAt', () => {
  test('removes the additional request at the matching index', () => {
    const suite: TestSuite = { additionalRequests: [{ name: 'First' }, { name: 'Second' }] };
    const result = removeRequestAt(suite, 1);

    expect(result.additionalRequests).toEqual([{ name: 'Second' }]);
  });

  test('does not mutate the input', () => {
    const suite: TestSuite = { additionalRequests: [{ name: 'First' }, { name: 'Second' }] };
    removeRequestAt(suite, 1);

    expect(suite.additionalRequests).toEqual([{ name: 'First' }, { name: 'Second' }]);
  });

  test('returns the suite unchanged when index is 0', () => {
    const suite: TestSuite = { additionalRequests: [{ name: 'First' }] };
    expect(removeRequestAt(suite, 0)).toBe(suite);
  });

  test('returns the suite unchanged when additionalRequests is absent', () => {
    const suite: TestSuite = {};
    expect(removeRequestAt(suite, 1)).toBe(suite);
  });
});

describe('getChainResponseColumns', () => {
  test('returns an empty array when nothing is defined', () => {
    expect(getChainResponseColumns({})).toEqual([]);
  });

  test('returns suite-level columns first, then each additional request in order, skipping undefined arrays', () => {
    const suite: TestSuite = {
      responseColumns: [{ name: 'a', displayName: 'A', expression: 'a', type: 'string' }],
      additionalRequests: [{}, { responseColumns: [{ name: 'b', displayName: 'B', expression: 'b', type: 'string' }] }],
    };

    expect(getChainResponseColumns(suite)).toEqual([
      { name: 'a', displayName: 'A', expression: 'a', type: 'string' },
      { name: 'b', displayName: 'B', expression: 'b', type: 'string' },
    ]);
  });
});

describe('getPreviousOutputVariables', () => {
  const columnA = { name: 'a', displayName: 'A', expression: 'a', type: 'string' };
  const columnB = { name: 'b', displayName: 'B', expression: 'b', type: 'string' };
  const columnC = { name: 'c', displayName: 'C', expression: 'c', type: 'string' };

  const suite: TestSuite = {
    responseColumns: [columnA],
    additionalRequests: [{ responseColumns: [columnB] }, { responseColumns: [columnC] }],
  };

  test('returns an empty array for the first request', () => {
    expect(getPreviousOutputVariables(suite, 0)).toEqual([]);
  });

  test('returns an empty array for a negative index', () => {
    expect(getPreviousOutputVariables(suite, -1)).toEqual([]);
  });

  test('returns only the columns of the requests before the index, in chain order', () => {
    expect(getPreviousOutputVariables(suite, 1)).toEqual([{ name: 'a', description: undefined }]);
    expect(getPreviousOutputVariables(suite, 2)).toEqual([
      { name: 'a', description: undefined },
      { name: 'b', description: undefined },
    ]);
  });

  test('describes each variable with the index of the request that produced it', () => {
    expect(getPreviousOutputVariables(suite, 3, (requestIndex) => `request ${requestIndex}`)).toEqual([
      { name: 'a', description: 'request 0' },
      { name: 'b', description: 'request 1' },
      { name: 'c', description: 'request 2' },
    ]);
  });

  test('skips requests without response columns and columns without a name', () => {
    const sparseSuite: TestSuite = {
      responseColumns: [{ name: '', displayName: '', expression: '', type: '' }],
      additionalRequests: [{}, { responseColumns: [columnB] }],
    };

    expect(getPreviousOutputVariables(sparseSuite, 2)).toEqual([]);
    expect(getPreviousOutputVariables(sparseSuite, 3)).toEqual([{ name: 'b', description: undefined }]);
  });
});

describe('getTakenResponseColumnNames', () => {
  const suite: TestSuite = {
    responseColumns: [{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }],
    additionalRequests: [
      { responseColumns: [{ name: 'verification', displayName: 'verification', expression: 'v', type: 'string' }] },
      { responseColumns: [{ name: 'answer2', displayName: 'answer2', expression: 'a', type: 'string' }] },
    ],
  };

  test('excludes request 0 columns when excludeIndex is 0', () => {
    expect(getTakenResponseColumnNames(suite, 0)).toEqual(['verification', 'answer2']);
  });

  test('includes request 0 columns and skips the excluded additional request', () => {
    expect(getTakenResponseColumnNames(suite, 2)).toEqual(['answer', 'verification']);
  });

  test('returns an empty array when the suite has no columns', () => {
    expect(getTakenResponseColumnNames({}, 0)).toEqual([]);
  });

  test('skips blank column names', () => {
    expect(
      getTakenResponseColumnNames({ responseColumns: [{ name: '', displayName: '', expression: '', type: '' }] }, 1),
    ).toEqual([]);
  });
});

describe('uniqueResponseColumnName', () => {
  test('returns the base name when it is not taken', () => {
    expect(uniqueResponseColumnName('answer', [])).toBe('answer');
    expect(uniqueResponseColumnName('answer', ['history'])).toBe('answer');
  });

  test('appends 2 when the base name is taken', () => {
    expect(uniqueResponseColumnName('answer', ['answer'])).toBe('answer2');
  });

  test('increments the suffix until the name is free', () => {
    expect(uniqueResponseColumnName('answer', ['answer', 'answer2', 'answer3'])).toBe('answer4');
  });

  test('returns an empty string unchanged', () => {
    expect(uniqueResponseColumnName('', ['answer'])).toBe('');
  });
});

describe('uniquifyResponseColumns', () => {
  test('leaves columns unchanged when their names are free', () => {
    const columns = [{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }];

    expect(uniquifyResponseColumns(columns, [])).toEqual(columns);
  });

  test('renames name and displayName together when the name is taken', () => {
    const columns = [{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }];

    expect(uniquifyResponseColumns(columns, ['answer'])).toEqual([
      { name: 'answer2', displayName: 'answer2', expression: 'a', type: 'string' },
    ]);
  });

  test('does not mutate the input columns', () => {
    const columns = [{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }];

    uniquifyResponseColumns(columns, ['answer']);

    expect(columns[0].name).toBe('answer');
  });
});

describe('findDuplicateResponseColumnName', () => {
  test('returns undefined when all names are unique', () => {
    expect(
      findDuplicateResponseColumnName([{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }], []),
    ).toBeUndefined();
  });

  test('flags a name already used in a previous request', () => {
    expect(
      findDuplicateResponseColumnName(
        [{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }],
        ['answer'],
      ),
    ).toEqual({ name: 'answer', inPreviousRequest: true });
  });

  test('flags a sibling duplicate within the same request', () => {
    expect(
      findDuplicateResponseColumnName(
        [
          { name: 'answer', displayName: 'answer', expression: 'a', type: 'string' },
          { name: 'answer', displayName: 'answer', expression: 'b', type: 'string' },
        ],
        [],
      ),
    ).toEqual({ name: 'answer', inPreviousRequest: false });
  });

  test('prefers a previous-request collision when both apply for the same name', () => {
    expect(
      findDuplicateResponseColumnName(
        [
          { name: 'answer', displayName: 'answer', expression: 'a', type: 'string' },
          { name: 'answer', displayName: 'answer', expression: 'b', type: 'string' },
        ],
        ['answer'],
      ),
    ).toEqual({ name: 'answer', inPreviousRequest: true });
  });

  test('skips blank column names', () => {
    expect(
      findDuplicateResponseColumnName(
        [
          { name: '', displayName: '', expression: '', type: '' },
          { name: 'answer', displayName: 'answer', expression: 'a', type: 'string' },
        ],
        [''],
      ),
    ).toBeUndefined();
  });
});
