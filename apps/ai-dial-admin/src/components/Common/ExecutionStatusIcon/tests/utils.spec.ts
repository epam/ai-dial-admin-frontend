import { describe, expect, test } from 'vitest';

import { formatExecutionStatusLabel, parseExecutionStatus } from '@/src/components/Common/ExecutionStatusIcon/utils';
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

describe('formatExecutionStatusLabel', () => {
  test('formats known statuses with only the first letter capitalized', () => {
    expect(formatExecutionStatusLabel('SUCCESS')).toBe('Success');
    expect(formatExecutionStatusLabel('FAILED')).toBe('Failed');
    expect(formatExecutionStatusLabel('TIMEOUT')).toBe('Timeout');
    expect(formatExecutionStatusLabel('ERROR')).toBe('Error');
  });

  test('returns em dash for null', () => {
    expect(formatExecutionStatusLabel(null)).toBe('—');
  });

  test('title-cases unknown status strings', () => {
    expect(formatExecutionStatusLabel('PENDING')).toBe('Pending');
  });
});
