import { describe, expect, test } from 'vitest';

import { parseExecutionStatus } from '@/src/components/Common/ExecutionStatusIcon/utils';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

describe('parseExecutionStatus', () => {
  test('returns the matching status for a known value', () => {
    expect(parseExecutionStatus('SUCCESS')).toBe(ExtractionResultStatus.SUCCESS);
    expect(parseExecutionStatus('FAILED')).toBe(ExtractionResultStatus.FAILED);
  });

  test('returns null for an unknown string', () => {
    expect(parseExecutionStatus('PENDING')).toBeNull();
    expect(parseExecutionStatus('')).toBeNull();
  });

  test('returns null when raw is null', () => {
    expect(parseExecutionStatus(null)).toBeNull();
  });
});
