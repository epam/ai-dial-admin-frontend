import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import DonutFigure from '@/src/components/Analytics/Usage/Charts/DonutFigure';
import { DonutSliceView } from '@/src/components/Analytics/Usage/models';

const slices = (count: number): DonutSliceView[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `s${index}`,
    label: `s${index}`,
    value: count - index,
    isOther: false,
    valueLabel: String(count - index),
    shareLabel: '1%',
    color: '#888',
  }));

const renderDonut = (count: number, legendRowsPerColumn?: number) =>
  render(
    <DonutFigure
      slices={slices(count)}
      centerValue="10"
      centerCaption="calls"
      size={180}
      legendRowsPerColumn={legendRowsPerColumn}
    />,
  );

describe('DonutFigure', () => {
  test('lists every slice in one column by default', () => {
    renderDonut(8);
    const legend = screen.getByRole('list');
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(legend.style.gridTemplateRows).toBe('');
  });

  test('splits the legend into columns of the given number of rows', () => {
    renderDonut(16, 6);
    const legend = screen.getByRole('list');
    expect(legend.style.gridTemplateRows).toBe('repeat(6, auto)');
    expect(legend.style.gridAutoFlow).toBe('column');
    expect(legend.style.maxWidth).toBe('840px');
  });

  test('keeps one column when the slices fit the rows', () => {
    renderDonut(5, 6);
    const legend = screen.getByRole('list');
    expect(legend.style.gridTemplateRows).toBe('');
    expect(legend.style.maxWidth).toBe('280px');
  });
});
