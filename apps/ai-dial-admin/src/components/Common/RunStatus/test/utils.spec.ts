import { StatusBadgeLeading, StatusBadgeTone } from '@/src/components/Common/StatusBadge/models';
import {
  getRunErrorHint,
  getRunStatusPresentation,
  getStatusLabel,
  isIncompleteRunStatus,
  isTransitionalRunStatus,
} from '../utils';
import { describe, expect, test } from 'vitest';
import { RunStatus } from '@/src/models/evaluation/run';

describe('Run status :: getStatusLabel', () => {
  const mockT = (key: string) => key;
  test('correct label for PENDING status', () => {
    const result = getStatusLabel(RunStatus.PENDING, mockT);
    expect(result).toBe('Runs.Status.Pending');
  });

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

  test.each([RunStatus.PENDING, RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED])(
    'treats %s as settled',
    (status) => {
      expect(isTransitionalRunStatus(status)).toBe(false);
    },
  );

  test('treats an unknown status as settled', () => {
    expect(isTransitionalRunStatus('SOMETHING_NEW')).toBe(false);
  });
});

describe('Run status :: isIncompleteRunStatus', () => {
  test.each([RunStatus.PENDING, RunStatus.RUNNING, RunStatus.CANCELLING, RunStatus.CANCELLED, RunStatus.FAILED])(
    'treats %s as incomplete',
    (status) => {
      expect(isIncompleteRunStatus(status)).toBe(true);
    },
  );

  test('treats COMPLETED as complete', () => {
    expect(isIncompleteRunStatus(RunStatus.COMPLETED)).toBe(false);
  });

  test('treats an unknown or missing status as complete', () => {
    expect(isIncompleteRunStatus('SOMETHING_NEW')).toBe(false);
    expect(isIncompleteRunStatus(undefined)).toBe(false);
  });
});

describe('Run status :: getRunStatusPresentation', () => {
  test.each([
    [RunStatus.PENDING, StatusBadgeTone.Neutral, StatusBadgeLeading.Dot],
    [RunStatus.RUNNING, StatusBadgeTone.Info, StatusBadgeLeading.Spinner],
    [RunStatus.CANCELLING, StatusBadgeTone.Info, StatusBadgeLeading.Spinner],
    [RunStatus.COMPLETED, StatusBadgeTone.Success, StatusBadgeLeading.Dot],
    [RunStatus.CANCELLED, StatusBadgeTone.Neutral, StatusBadgeLeading.Dot],
    [RunStatus.FAILED, StatusBadgeTone.Error, StatusBadgeLeading.Dot],
  ])('maps %s to its tone and leading indicator', (status, tone, leading) => {
    expect(getRunStatusPresentation(status)).toEqual({ tone, leading });
  });

  test('falls back to a settled neutral presentation for an unknown status', () => {
    expect(getRunStatusPresentation('SOMETHING_NEW')).toEqual({
      tone: StatusBadgeTone.Neutral,
      leading: StatusBadgeLeading.Dot,
    });
  });

  test('marks a status as in progress exactly when it is transitional', () => {
    Object.values(RunStatus).forEach((status) => {
      expect(getRunStatusPresentation(status).leading === StatusBadgeLeading.Spinner).toBe(
        isTransitionalRunStatus(status),
      );
    });
  });
});

describe('Run status :: getRunErrorHint', () => {
  test('returns the error message of a failed run', () => {
    expect(getRunErrorHint({ status: RunStatus.FAILED, errorMessage: 'boom' })).toBe('boom');
  });

  test('falls back to the error details message', () => {
    expect(getRunErrorHint({ status: RunStatus.FAILED, errorDetails: { message: 'details' } })).toBe('details');
  });

  test('returns nothing for a failed run without any message', () => {
    expect(getRunErrorHint({ status: RunStatus.FAILED })).toBeUndefined();
    expect(getRunErrorHint({ status: RunStatus.FAILED, errorMessage: '' })).toBeUndefined();
  });

  test('returns nothing for a run that has not failed, even when it carries a message', () => {
    expect(getRunErrorHint({ status: RunStatus.COMPLETED, errorMessage: 'stale' })).toBeUndefined();
  });
});
