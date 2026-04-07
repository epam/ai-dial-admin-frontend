import { ValidityStatus } from '@/src/types/key';
import { getStatusLabel } from '../utils';
import { describe, expect, test } from 'vitest';
import { RunStatus } from '@/src/models/evaluation/run';

describe('Run status :: getStatusLabel', () => {
  const mockT = (key: string) => key;
  test('correct label for COMPLETED status', () => {
    const result = getStatusLabel(RunStatus.COMPLETED, mockT);
    expect(result).toBe('Runs.Status.Completed');
  });

  test('correct label for FAILED status', () => {
    const result = getStatusLabel(RunStatus.FAILED, mockT);
    expect(result).toBe('Runs.Status.Failed');
  });

  test('correct label for RUNNING status', () => {
    const result = getStatusLabel(RunStatus.RUNNING, mockT);
    expect(result).toBe('Runs.Status.Running');
  });

  test('returns empty string for unknown status', () => {
    const result = getStatusLabel('UNKNOWN' as RunStatus, mockT);
    expect(result).toBe('');
  });
});
