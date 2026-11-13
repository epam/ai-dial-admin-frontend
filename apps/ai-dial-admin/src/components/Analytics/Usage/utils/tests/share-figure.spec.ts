import { describe, expect, test } from 'vitest';

import { buildShareFigure } from '@/src/components/Analytics/Usage/utils/share-figure';
import { ChartColors } from '@/src/components/Common/MetricCard/models';

const COLORS: ChartColors = {
  success: '#0f0',
  warning: '#ff0',
  error: '#f00',
  accent: '#00f',
  neutral: '#888',
  value: '#fff',
  track: '#222',
};

const ranked = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ model: `m${index}`, calls: count - index }));

const labels = (sliceCount: number, rows = ranked(12)) =>
  buildShareFigure(COLORS, rows, 'model', 'calls', { otherLabel: 'Others', sliceCount }).slices.map(
    (slice) => slice.label,
  );

describe('buildShareFigure', () => {
  test('keeps the largest values up to the slice count, folds the rest into Others and labels each share', () => {
    const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name, index) => ({ model: name, calls: 10 - index }));
    const { slices, total } = buildShareFigure(COLORS, rows, 'model', 'calls', { otherLabel: 'Others', sliceCount: 5 });

    expect(total).toBe(49);
    expect(slices.map((slice) => slice.label)).toEqual(['a', 'b', 'c', 'd', 'e', 'Others']);
    expect(slices[5]).toEqual(expect.objectContaining({ value: 9, isOther: true, color: COLORS.neutral }));
    expect(slices[0]).toEqual(expect.objectContaining({ valueLabel: '10', shareLabel: '20%' }));
  });

  test('names as many categories as the slice count asks for', () => {
    expect(labels(5)).toHaveLength(6);
    expect(labels(7)).toHaveLength(8);
    expect(labels(10)).toHaveLength(11);
    expect(labels(10).at(-1)).toBe('Others');
  });

  test('adds no Others when the categories fit the slice count', () => {
    expect(labels(10, ranked(4))).toEqual(['m0', 'm1', 'm2', 'm3']);
  });

  test('leaves out zero values', () => {
    const rows = [
      { model: 'a', calls: 2 },
      { model: 'b', calls: 0 },
    ];
    expect(labels(5, rows)).toEqual(['a']);
  });

  test('names a share with no value instead of leaving its label blank', () => {
    const rows = [
      { model: '', calls: 2 },
      { model: null, calls: 1 },
    ];
    const { slices } = buildShareFigure(COLORS, rows, 'model', 'calls', {
      otherLabel: 'Others',
      sliceCount: 5,
      emptyLabel: '(no value)',
    });
    expect(slices.map((slice) => slice.label)).toEqual(['(no value)', '(no value)']);
  });

  test('writes each figure with the given formatter', () => {
    const { slices } = buildShareFigure(COLORS, [{ model: 'a', calls: 3 }], 'model', 'calls', {
      otherLabel: 'Others',
      sliceCount: 5,
      formatValue: (value) => `$${value}`,
    });
    expect(slices[0].valueLabel).toBe('$3');
  });
});
