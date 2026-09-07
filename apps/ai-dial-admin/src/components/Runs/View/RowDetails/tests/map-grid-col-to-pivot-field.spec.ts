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

  test('maps compare secondary and delta column prefixes to the same pivot field', () => {
    expect(mapGridColToPivotField('cmp_status')).toBe('executionStatus');
    expect(mapGridColToPivotField('cmp_http')).toBe('httpStatusCode');
    expect(mapGridColToPivotField('cmp_duration')).toBe('execDurationMs');
    expect(mapGridColToPivotField('delta_Overall Accuracy_Precision')).toBe('Precision');
  });

  test('maps extracted and cmp_extracted columns to the field key', () => {
    expect(mapGridColToPivotField('answer')).toBe('answer');
    expect(mapGridColToPivotField('context_urls')).toBe('context_urls');
    expect(mapGridColToPivotField('extracted_answer')).toBe('answer');
    expect(mapGridColToPivotField('cmp_extracted_answer')).toBe('answer');
    expect(mapGridColToPivotField('extracted_context_urls')).toBe('context_urls');
  });
});
