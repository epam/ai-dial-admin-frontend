import { describe, expect, test } from 'vitest';

import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';
import {
  estimateFigureWidthCh,
  getFigureRulerVar,
  pickWidestFigures,
} from '@/src/components/Analytics/Usage/utils/figure-width';

const row = (calls: number): BreakdownRowModel => ({ calls }) as BreakdownRowModel;

const formats = { calls: (r: BreakdownRowModel) => r.calls.toLocaleString('en-US') };

describe('getFigureRulerVar', () => {
  test('names the property after the column, so each column publishes its own ruler', () => {
    expect(getFigureRulerVar('calls')).toBe('--breakdown-figure-ruler-calls');
  });
});

describe('estimateFigureWidthCh', () => {
  test('counts a digit as one and a separator as half of one', () => {
    expect(estimateFigureWidthCh('51,482')).toBe(5.5);
    expect(estimateFigureWidthCh('$26.41')).toBe(5.5);
  });

  test('counts a figure with no separators by its length', () => {
    expect(estimateFigureWidthCh('437ms')).toBe(5);
  });

  test('counts an empty string as nothing', () => {
    expect(estimateFigureWidthCh('')).toBe(0);
  });
});

describe('pickWidestFigures', () => {
  test('picks the widest figure of each column as the column formats it', () => {
    expect(pickWidestFigures([row(7), row(12345), row(88)], formats)).toEqual({ calls: '12,345' });
  });

  test('keeps the first of two figures of equal width', () => {
    expect(pickWidestFigures([row(12), row(34)], formats)).toEqual({ calls: '12' });
  });

  test('keeps a wider figure picked earlier, so a column never narrows as rows arrive', () => {
    expect(pickWidestFigures([row(7)], formats, { calls: '12,345' })).toEqual({ calls: '12,345' });
  });

  test('widens past a figure picked earlier when a wider one arrives', () => {
    expect(pickWidestFigures([row(1234567)], formats, { calls: '12,345' })).toEqual({ calls: '1,234,567' });
  });

  test('does not change the figures it was given', () => {
    const widest = { calls: '7' };

    pickWidestFigures([row(12345)], formats, widest);

    expect(widest).toEqual({ calls: '7' });
  });

  test('measures a row with no figure as the dash the cell renders', () => {
    expect(pickWidestFigures([row(1)], { calls: () => null })).toEqual({ calls: '—' });
  });

  test('picks nothing where there are no rows', () => {
    expect(pickWidestFigures([], formats)).toEqual({});
  });
});
