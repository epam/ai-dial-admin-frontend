import { describe, expect, test } from 'vitest';

import { mapGridColToPivotField } from '../map-grid-col-to-pivot-field';

describe('mapGridColToPivotField', () => {
  test('maps known execution grid columns', () => {
    expect(mapGridColToPivotField('status')).toBe('executionStatus');
    expect(mapGridColToPivotField('runIndex')).toBe('runNumber');
    expect(mapGridColToPivotField('http')).toBe('httpStatusCode');
    expect(mapGridColToPivotField('duration')).toBe('execDurationMs');
  });

  test('returns null for grid-only columns', () => {
    expect(mapGridColToPivotField('testCaseName')).toBeNull();
    expect(mapGridColToPivotField('totalRequests')).toBeNull();
    expect(mapGridColToPivotField(null)).toBeNull();
    expect(mapGridColToPivotField(undefined)).toBeNull();
  });

  test('strips metric group prefix when group looks like a label or package', () => {
    expect(mapGridColToPivotField('Overall Accuracy_Precision')).toBe('Precision');
    expect(mapGridColToPivotField('aidial_rag_eval.retrieval_f1')).toBe('f1');
  });

  test('returns extracted column keys as-is including underscores', () => {
    expect(mapGridColToPivotField('answer')).toBe('answer');
    expect(mapGridColToPivotField('context_urls')).toBe('context_urls');
  });
});
