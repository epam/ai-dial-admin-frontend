import { describe, expect, test } from 'vitest';

import { SuiteType, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import {
  getRequestTurnCounts,
  getTryOutSectionShape,
  groupTryOutSections,
  shouldShowTurnLabels,
} from '@/src/utils/evaluation/tryout-sections';

const schema: TestCaseSchema[] = [
  { name: 'prompt', type: TestCaseItemType.STRING, required: false, description: '', perTurn: true },
  { name: 'shared', type: TestCaseItemType.STRING, required: false, description: '', perTurn: false },
];

const singleRequestSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }],
};

const multiRequestSingleTurnSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }],
  additionalRequests: [{ inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }] }],
};

const combinedSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }],
  additionalRequests: [{ inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }] }],
};

const mixedSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }],
  additionalRequests: [{ inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }] }],
};

describe('getRequestTurnCounts', () => {
  test('single multi-turn request', () => {
    expect(getRequestTurnCounts(singleRequestSuite, schema, 3)).toEqual([3]);
  });

  test('multi-request with no per-turn bindings stays single-turn', () => {
    expect(getRequestTurnCounts(multiRequestSingleTurnSuite, schema, 3)).toEqual([1, 1]);
  });

  test('combined: every request that binds per-turn fields gets multiTurnLength', () => {
    expect(getRequestTurnCounts(combinedSuite, schema, 2)).toEqual([2, 2]);
  });

  test('mixed: only requests that bind per-turn fields are multi-turn', () => {
    expect(getRequestTurnCounts(mixedSuite, schema, 3)).toEqual([1, 3]);
  });
});

describe('getTryOutSectionShape', () => {
  test('classifies shapes', () => {
    expect(getTryOutSectionShape([1])).toBe('single');
    expect(getTryOutSectionShape([3])).toBe('turns');
    expect(getTryOutSectionShape([1, 1])).toBe('requests');
    expect(getTryOutSectionShape([1, 3])).toBe('combined');
    expect(getTryOutSectionShape([])).toBe('single');
  });
});

describe('shouldShowTurnLabels', () => {
  test('true when group has multiple turns or planned count is multi-turn', () => {
    expect(
      shouldShowTurnLabels(
        {
          requestIndex: 0,
          turns: [
            { turnIndex: 0, item: {} },
            { turnIndex: 1, item: {} },
          ],
        },
        [2],
      ),
    ).toBe(true);
    expect(shouldShowTurnLabels({ requestIndex: 1, turns: [{ turnIndex: 0, item: {} }] }, [1, 3])).toBe(true);
  });

  test('false for single executed turn with planned single-turn', () => {
    expect(shouldShowTurnLabels({ requestIndex: 0, turns: [{ turnIndex: 0, item: {} }] }, [1, 3])).toBe(false);
  });
});

describe('groupTryOutSections', () => {
  test('multi-turn only slices under one request', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(groupTryOutSections(items, [3])).toEqual([
      {
        requestIndex: 0,
        turns: [
          { turnIndex: 0, item: items[0] },
          { turnIndex: 1, item: items[1] },
          { turnIndex: 2, item: items[2] },
        ],
      },
    ]);
  });

  test('multi-request only puts one turn per request', () => {
    const items = [{ id: 'r0' }, { id: 'r1' }];
    expect(groupTryOutSections(items, [1, 1])).toEqual([
      { requestIndex: 0, turns: [{ turnIndex: 0, item: items[0] }] },
      { requestIndex: 1, turns: [{ turnIndex: 0, item: items[1] }] },
    ]);
  });

  test('combined uses request-major order', () => {
    const items = [{ id: '0-0' }, { id: '0-1' }, { id: '1-0' }, { id: '1-1' }];
    expect(groupTryOutSections(items, [2, 2])).toEqual([
      {
        requestIndex: 0,
        turns: [
          { turnIndex: 0, item: items[0] },
          { turnIndex: 1, item: items[1] },
        ],
      },
      {
        requestIndex: 1,
        turns: [
          { turnIndex: 0, item: items[2] },
          { turnIndex: 1, item: items[3] },
        ],
      },
    ]);
  });

  test('mixed turn counts and short history stop early', () => {
    const items = [{ id: 'r0' }, { id: 'r1-t0' }];
    expect(groupTryOutSections(items, [1, 3])).toEqual([
      { requestIndex: 0, turns: [{ turnIndex: 0, item: items[0] }] },
      { requestIndex: 1, turns: [{ turnIndex: 0, item: items[1] }] },
    ]);
  });

  test('explicit requestIndex/turnIndex override positional slicing', () => {
    const items = [
      { id: 'late', requestIndex: 1, turnIndex: 1 },
      { id: 'early', requestIndex: 0, turnIndex: 0 },
      { id: 'mid', requestIndex: 1, turnIndex: 0 },
    ];
    expect(groupTryOutSections(items, [1, 2])).toEqual([
      { requestIndex: 0, turns: [{ turnIndex: 0, item: items[1] }] },
      {
        requestIndex: 1,
        turns: [
          { turnIndex: 1, item: items[0] },
          { turnIndex: 0, item: items[2] },
        ],
      },
    ]);
  });
});
