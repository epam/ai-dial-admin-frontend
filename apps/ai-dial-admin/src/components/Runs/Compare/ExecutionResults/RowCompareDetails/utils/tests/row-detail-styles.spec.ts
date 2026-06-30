import { describe, expect, test } from 'vitest';

import {
  getCompareDiffCellClassName,
  getCompareDiffCellProps,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-styles';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

describe('getCompareDiffCellClassName', () => {
  test('returns undefined for empty diff kind', () => {
    expect(getCompareDiffCellClassName(MetricDeltaKind.Empty, 'field')).toBeUndefined();
  });

  test('closes the box left edge on the field column for changed rows', () => {
    const className = getCompareDiffCellClassName(MetricDeltaKind.Changed, 'field');

    expect(className).toContain('bg-info');
    expect(className).toContain('border-t');
    expect(className).toContain('border-b');
    expect(className).toContain('border-l');
    expect(className).toContain('border-r-0');
    expect(className).toContain('border-accent-primary');
  });

  test('uses only top and bottom edges on value columns', () => {
    const className = getCompareDiffCellClassName(MetricDeltaKind.Changed, 'value');

    expect(className).toContain('bg-info');
    expect(className).toContain('border-t');
    expect(className).toContain('border-b');
    expect(className).toContain('border-l-0');
    expect(className).toContain('border-r-0');
  });

  test('uses only top and bottom edges on the delta column', () => {
    const className = getCompareDiffCellClassName(MetricDeltaKind.Added, 'delta');

    expect(className).toContain('bg-success');
    expect(className).toContain('border-accent-secondary');
    expect(className).toContain('border-l-0');
    expect(className).toContain('border-r-0');
  });

  test('closes the box right edge on the action column', () => {
    const className = getCompareDiffCellClassName(MetricDeltaKind.Added, 'action');

    expect(className).toContain('bg-success');
    expect(className).toContain('border-accent-secondary');
    expect(className).toContain('border-r');
    expect(className).toContain('border-l-0');
  });

  test('maps removed diffs to error styling on field column', () => {
    const className = getCompareDiffCellClassName(MetricDeltaKind.Removed, 'field');

    expect(className).toContain('bg-error');
    expect(className).toContain('border-l');
    expect(className).toContain('border-error');
  });
});

describe('getCompareDiffCellProps', () => {
  test('returns data attribute for minimap markers', () => {
    const props = getCompareDiffCellProps(MetricDeltaKind.Changed, 'value');

    expect(props['data-compare-diff']).toBe('changed');
    expect(props.className).toBeDefined();
  });

  test('returns empty props when there is no diff', () => {
    expect(getCompareDiffCellProps(MetricDeltaKind.Empty, 'field')).toEqual({});
  });
});
