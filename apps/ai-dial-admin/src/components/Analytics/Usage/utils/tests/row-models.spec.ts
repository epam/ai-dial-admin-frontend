import { describe, expect, test } from 'vitest';

import { BreakdownRow, UsageMeasures } from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import {
  RowModelContext,
  readMissingPreviousEmpty,
  toPreviousMeasures,
  toRowModels,
} from '@/src/components/Analytics/Usage/utils/row-models';

const row = (id: string, calls: number, failed = 0, extra: Partial<UsageMeasures> = {}): BreakdownRow => ({
  id,
  label: id,
  isFallbackLabel: false,
  measures: { ...EMPTY_MEASURES, calls, failed, ...extra },
});

const fallback = (calls: number): BreakdownRow => ({
  id: 'column:missing',
  label: '',
  isFallbackLabel: true,
  measures: { ...EMPTY_MEASURES, calls },
});

const context = (overrides: Partial<RowModelContext> = {}): RowModelContext => ({
  windowTotal: 200,
  hasComparison: false,
  previousMeasures: new Map(),
  isMissingPreviousEmpty: false,
  isFallbackPinnedLast: false,
  ...overrides,
});

describe('readMissingPreviousEmpty', () => {
  test('reads an unmatched row as new when the previous response was the whole dimension', () => {
    expect(readMissingPreviousEmpty([row('a', 1)], 10)).toBe(true);
  });

  test('reads it as no comparison when that response was cut at the page size', () => {
    expect(readMissingPreviousEmpty([row('a', 1)], 1)).toBe(false);
  });

  test('reads it as no comparison when the previous window recorded nothing', () => {
    expect(readMissingPreviousEmpty([], 10)).toBe(false);
  });
});

describe('toRowModels', () => {
  test('divides a share by the window total rather than by the rows it was sent', () => {
    expect(toRowModels([row('a', 60)], context())[0].share).toBe(0.3);
  });

  test('states the error rate as a fraction of the row own calls', () => {
    expect(toRowModels([row('a', 50, 5)], context())[0].errorRate).toBe(0.1);
  });

  test('states no error rate for a row with no calls', () => {
    expect(toRowModels([row('a', 0)], context())[0].errorRate).toBeNull();
  });

  test('states a change for every measure the row carries', () => {
    const current = row('a', 30, 3, { avgLatencyMs: 200, spend: 4 });
    const previous = row('a', 15, 3, { avgLatencyMs: 100, spend: 2 });
    const models = toRowModels(
      [current],
      context({ hasComparison: true, previousMeasures: toPreviousMeasures([previous]) }),
    );

    expect(models[0].deltas).toEqual({ calls: 1, errorRate: -0.5, avgLatencyMs: 1, spend: 1 });
    expect(models[0].isNewRow).toBe(false);
  });

  test('states no change for a measure the previous window read as zero', () => {
    const previous = row('a', 15, 0, { avgLatencyMs: 100, spend: 0 });
    const models = toRowModels(
      [row('a', 30, 3, { avgLatencyMs: 200, spend: 4 })],
      context({ hasComparison: true, previousMeasures: toPreviousMeasures([previous]) }),
    );

    expect(models[0].deltas.errorRate).toBeNull();
    expect(models[0].deltas.spend).toBeNull();
    expect(models[0].deltas.calls).toBe(1);
  });

  test('calls a row new when the previous window is known to have missed it', () => {
    const models = toRowModels([row('a', 30)], context({ hasComparison: true, isMissingPreviousEmpty: true }));

    expect(models[0].isNewRow).toBe(true);
    expect(models[0].deltas.calls).toBeNull();
  });

  test('states no change while comparison is off', () => {
    const models = toRowModels([row('a', 30)], context({ previousMeasures: toPreviousMeasures([row('a', 15)]) }));

    expect(models[0].deltas.calls).toBeNull();
    expect(models[0].isNewRow).toBe(false);
  });

  test('shows a fallback row under the label it was given', () => {
    const models = toRowModels([fallback(9)], context({ fallbackLabel: 'Other methods', fallbackTooltip: 'why' }));

    expect(models[0].displayLabel).toBe('Other methods');
    expect(models[0].fallbackTooltip).toBe('why');
  });

  test('keeps a fallback row in its ranked place by default', () => {
    const models = toRowModels([fallback(90), row('a', 10)], context());

    expect(models.map((model) => model.id)).toEqual(['column:missing', 'a']);
  });

  test('moves it last where the tab pins it', () => {
    const models = toRowModels([fallback(90), row('a', 10)], context({ isFallbackPinnedLast: true }));

    expect(models.map((model) => model.id)).toEqual(['a', 'column:missing']);
  });
});

describe('toPreviousMeasures', () => {
  test('keys the previous window by row id', () => {
    expect(toPreviousMeasures([row('a', 5), row('b', 7)]).get('b')?.calls).toBe(7);
  });

  test('states what a row own name leaves out, where the tab aggregates deployments', () => {
    const toolRow = { ...row('get_me', 10), groupNames: ['a', 'b'], groupCount: 32 };
    const models = toRowModels(
      [toolRow],
      context({ readSubLabel: (names, count) => ({ text: `${count}`, tooltip: names.join('/') }) }),
    );

    expect(models[0].subLabel).toBe('32');
    expect(models[0].subLabelTooltip).toBe('a/b');
  });

  test('states none where the row carries no deployment names', () => {
    const models = toRowModels([row('gpt-4o', 10)], context({ readSubLabel: () => ({ text: 'never' }) }));

    expect(models[0].subLabel).toBeUndefined();
  });

  test('keeps the failure count beside the rate it was rounded into', () => {
    expect(toRowModels([row('a', 30000, 1)], context())[0].failed).toBe(1);
  });
});
