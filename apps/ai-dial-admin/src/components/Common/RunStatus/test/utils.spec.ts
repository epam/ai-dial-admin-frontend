import { ValidityStatus } from '@/src/types/key';
import { getStatusLabel, isTransitionalRunStatus } from '../utils';
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

  test('correct label for CANCELLING status', () => {
    const result = getStatusLabel(RunStatus.CANCELLING, mockT);
    expect(result).toBe('Runs.Status.Cancelling');
  });

  test('correct label for CANCELLED status', () => {
    const result = getStatusLabel(RunStatus.CANCELLED, mockT);
    expect(result).toBe('Runs.Status.Cancelled');
  });

  test('returns the raw status for an unknown status', () => {
    const result = getStatusLabel('SOMETHING_NEW', mockT);
    expect(result).toBe('SOMETHING_NEW');
  });

  test('returns empty string for a missing status', () => {
    const result = getStatusLabel(undefined, mockT);
    expect(result).toBe('');
  });
});

describe('Run status :: isTransitionalRunStatus', () => {
  test.each([RunStatus.RUNNING, RunStatus.CANCELLING])('treats %s as transitional', (status) => {
    expect(isTransitionalRunStatus(status)).toBe(true);
  });

  test.each([RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED])('treats %s as settled', (status) => {
    expect(isTransitionalRunStatus(status)).toBe(false);
  });

  test('treats an unknown status as settled', () => {
    expect(isTransitionalRunStatus('SOMETHING_NEW')).toBe(false);
  });
});
