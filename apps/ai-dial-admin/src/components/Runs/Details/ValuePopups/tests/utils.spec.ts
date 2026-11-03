import { describe, expect, test } from 'vitest';

import { getCompareRuns } from '@/src/components/Runs/Compare/utils';
import { formatInfoText, getScoreChipClasses, getScoreRunData } from '@/src/components/Runs/Details/ValuePopups/utils';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

const [primaryRun, secondaryRun] = getCompareRuns({ id: 'run-1', name: 'Run A' }, { id: 'run-2', name: 'Run B' });

const makeField = (overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey: 'score',
  label: 'score',
  primaryRaw: '0',
  secondaryRaw: '1',
  diffKind: MetricDeltaKind.Changed,
  isNumeric: true,
  isScoreIndicator: true,
  isMetric: true,
  ...overrides,
});

describe('Runs/FieldCompare :: formatInfoText', () => {
  test('Should return null for null', () => {
    expect(formatInfoText(null)).toBeNull();
  });

  test('Should keep prose as plaintext', () => {
    expect(formatInfoText('The answer is wrong.')).toEqual({ text: 'The answer is wrong.', language: 'plaintext' });
  });

  test('Should pretty-print a JSON object', () => {
    expect(formatInfoText('{"a":1}')).toEqual({ text: '{\n  "a": 1\n}', language: 'json' });
  });

  test('Should pretty-print a JSON array', () => {
    expect(formatInfoText('[1,2]')).toEqual({ text: '[\n  1,\n  2\n]', language: 'json' });
  });

  test('Should fall back to plaintext for brace-led text that is not JSON', () => {
    expect(formatInfoText('{not json')).toEqual({ text: '{not json', language: 'plaintext' });
  });
});

describe('Runs/FieldCompare :: getScoreChipClasses', () => {
  test('Should resolve the absolute bucket of a score', () => {
    expect(getScoreChipClasses('0')).toEqual({ background: 'bg-score-abs-00', text: 'text-score-abs-00' });
    expect(getScoreChipClasses('1')).toEqual({ background: 'bg-score-abs-11', text: 'text-score-abs-11' });
    expect(getScoreChipClasses('0.303')).toEqual({ background: 'bg-score-abs-04', text: 'text-score-abs-04' });
  });

  test('Should return null for a missing, non-numeric or out-of-range value', () => {
    expect(getScoreChipClasses(null)).toBeNull();
    expect(getScoreChipClasses('pass')).toBeNull();
    expect(getScoreChipClasses('1.5')).toBeNull();
    expect(getScoreChipClasses('-0.1')).toBeNull();
  });
});

describe('Runs/FieldCompare :: getScoreRunData', () => {
  test('Should read each run from its own slot', () => {
    const field = makeField({
      primaryInfo: { reason: 'primary reason', logs: 'primary logs', error: null },
      secondaryInfo: { reason: 'secondary reason', logs: null, error: null },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);
    const secondary = getScoreRunData(field, secondaryRun, 'Run B', true);

    expect(primary).toMatchObject({ raw: '0', isFailed: false, label: 'Run A', isMissing: false });
    expect(primary.reason?.text).toBe('primary reason');
    expect(primary.logs?.text).toBe('primary logs');
    expect(secondary).toMatchObject({ raw: '1', isFailed: false, label: 'Run B', isMissing: false });
    expect(secondary.reason?.text).toBe('secondary reason');
    expect(secondary.logs).toBeNull();
  });

  test('Should use the group error as the reason of a failed metric without one', () => {
    const field = makeField({
      primaryRaw: null,
      primaryFailed: true,
      primaryInfo: { reason: null, logs: null, error: '422 Unprocessable Content' },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);

    expect(primary.isFailed).toBe(true);
    expect(primary.isReasonError).toBe(true);
    expect(primary.reason?.text).toBe('422 Unprocessable Content');
    expect(primary.logs).toBeNull();
  });

  test('Should prefer the reason of a failed metric over the group error', () => {
    const field = makeField({
      primaryRaw: null,
      primaryFailed: true,
      primaryInfo: { reason: 'own reason', logs: null, error: 'group error' },
    });

    const primary = getScoreRunData(field, primaryRun, 'Run A', true);

    expect(primary.reason?.text).toBe('own reason');
    expect(primary.isReasonError).toBe(false);
  });

  test('Should not show the group error for a metric that did not fail', () => {
    const field = makeField({ primaryInfo: { reason: null, logs: null, error: 'other leaf failed' } });

    expect(getScoreRunData(field, primaryRun, 'Run A', true).reason).toBeNull();
  });

  test('Should leave reason and logs empty without info', () => {
    const data = getScoreRunData(makeField(), primaryRun, 'Run A', true);

    expect(data.reason).toBeNull();
    expect(data.logs).toBeNull();
  });

  test('Should mark the compared run missing only when there is no match', () => {
    expect(getScoreRunData(makeField(), secondaryRun, 'Run B', false).isMissing).toBe(true);
    expect(getScoreRunData(makeField(), secondaryRun, 'Run B', true).isMissing).toBe(false);
    expect(getScoreRunData(makeField(), primaryRun, 'Run A', false).isMissing).toBe(false);
  });
});
