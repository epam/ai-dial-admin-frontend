import { describe, expect, test } from 'vitest';

import {
  DURATION_COLUMN_WIDTH,
  EXTRACTED_COLUMN_MIN_WIDTH,
  EXTRACTED_GROUP_HEADER,
  EXECUTION_GROUP_HEADER,
  HTTP_COLUMN_WIDTH,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
} from '../constants';
import { getCompareColumns } from '../utils';

describe('Runs Compare :: getCompareColumns', () => {
  test('builds flat status and test case columns with execution, metrics, and extracted groups', () => {
    const columns = getCompareColumns([
      {
        id: 'result-1',
        responseStatusCode: 200,
        runIndex: 0,
        executionStatus: 'SUCCESS',
        testCaseName: 'Test Case 1',
        metricValues: {
          'Overall Accuracy': {
            'Equality check': 1,
            Precision: 0.8,
            Recall: 0.7,
          },
          'Context Appropriateness': {
            'Equality Check': 1,
            Recall: 0.9,
          },
        },
        extractedColumns: {
          answer: 'yes',
          context: 'ctx',
          context_urls: 'http://example.com',
        },
      },
    ]);

    expect(columns).toHaveLength(6);
    expect(columns[0].colId).toBe('status');
    expect(columns[0].width).toBe(STATUS_COLUMN_WIDTH);
    expect(columns[0].filter).toBe(false);
    expect(columns[1].colId).toBe('testCaseName');
    expect(columns[1].filter).toBe('agTextColumnFilter');
    expect(columns[1].floatingFilter).toBe(true);

    const executionGroup = columns[2];
    expect(executionGroup.headerName).toBe(EXECUTION_GROUP_HEADER);
    expect(executionGroup.children?.map((column) => column.headerName)).toEqual([
      '# Run number',
      'HTTP',
      'Duration',
    ]);
    expect(executionGroup.children?.every((column) => column.filter === false)).toBe(true);
    expect(executionGroup.children?.[0]).toEqual(
      expect.objectContaining({
        width: RUN_INDEX_COLUMN_WIDTH,
        minWidth: RUN_INDEX_COLUMN_WIDTH,
        maxWidth: RUN_INDEX_COLUMN_WIDTH,
      }),
    );
    expect(executionGroup.children?.[1]).toEqual(
      expect.objectContaining({
        width: HTTP_COLUMN_WIDTH,
        minWidth: HTTP_COLUMN_WIDTH,
        maxWidth: HTTP_COLUMN_WIDTH,
      }),
    );
    expect(executionGroup.children?.[2]).toEqual(
      expect.objectContaining({
        width: DURATION_COLUMN_WIDTH,
        minWidth: DURATION_COLUMN_WIDTH,
        maxWidth: DURATION_COLUMN_WIDTH,
      }),
    );

    const overallAccuracyGroup = columns[3];
    expect(overallAccuracyGroup.headerName).toBe('Overall Accuracy');
    expect(overallAccuracyGroup.children?.map((column) => column.headerName)).toEqual([
      'Equality check',
      'Precision',
      'Recall',
    ]);
    expect(overallAccuracyGroup.children?.every((column) => column.filter === 'agNumberColumnFilter')).toBe(true);
    expect(overallAccuracyGroup.children?.every((column) => column.floatingFilter === true)).toBe(true);

    const contextGroup = columns[4];
    expect(contextGroup.headerName).toBe('Context Appropriateness');
    expect(contextGroup.children?.map((column) => column.headerName)).toEqual(['Equality Check', 'Recall']);

    const extractedGroup = columns[5];
    expect(extractedGroup.headerName).toBe(EXTRACTED_GROUP_HEADER);
    expect(extractedGroup.children?.map((column) => column.headerName)).toEqual([
      'answer',
      'context',
      'context_urls',
    ]);
    expect(extractedGroup.children?.every((column) => column.filter === false)).toBe(true);
    expect(extractedGroup.children?.every((column) => column.flex === 1)).toBe(true);
    expect(extractedGroup.children?.every((column) => column.minWidth === EXTRACTED_COLUMN_MIN_WIDTH)).toBe(true);
  });

  test('omits extracted group when there is no extracted schema', () => {
    const columns = getCompareColumns([
      {
        id: 'result-1',
        responseStatusCode: 200,
        runIndex: 0,
        testCaseName: 'Test Case 1',
        metricValues: {
          'Overall Accuracy': { Precision: 1 },
        },
      },
    ]);

    expect(columns).toHaveLength(4);
    expect(columns.at(-1)?.headerName).toBe('Overall Accuracy');
  });
});
