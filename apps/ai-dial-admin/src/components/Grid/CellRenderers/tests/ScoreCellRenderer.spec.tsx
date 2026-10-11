import { ICellRendererParams } from 'ag-grid-community';
import { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';
import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Common/HeatMap/constants';

import ScoreCellRenderer from '../ScoreCellRenderer';

interface RenderParamsOverrides {
  value?: unknown;
  mode?: ScoreColorMode;
  theme?: string;
  columnWidth?: number;
}

const NARROW_COLUMN_WIDTH = HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1;

const renderCell = ({ columnWidth, ...params }: RenderParamsOverrides) => {
  const column = columnWidth != null ? ({ getActualWidth: () => columnWidth } as never) : undefined;
  return render(ScoreCellRenderer({ ...params, column } as ICellRendererParams) as ReactElement);
};

describe('ScoreCellRenderer', () => {
  test('renders a right-aligned, colored number for an absolute score', () => {
    const { container } = renderCell({ value: 0.102 });

    expect(screen.getByText('0.102')).toBeInTheDocument();
    expect(container.querySelector('.justify-end')).toBeTruthy();
  });

  test('applies the bucket background and text Tailwind classes to the cell', () => {
    const bucketKey = getScoreCellBucketKey(0.102, ScoreColorMode.Absolute);
    renderCell({ value: 0.102 });

    const cell = screen.getByText('0.102').parentElement;
    expect(cell).toHaveClass(`bg-score-${bucketKey}`);
    expect(screen.getByText('0.102')).toHaveClass(`text-score-${bucketKey}`);
  });

  test('renders a signed delta', () => {
    renderCell({ value: 0.303, mode: ScoreColorMode.Delta });
    expect(screen.getByText('+0.303')).toBeInTheDocument();
  });

  test('renders a zero delta with no bucket color', () => {
    renderCell({ value: 0, mode: ScoreColorMode.Delta });

    const valueText = screen.getByText('0');
    const cell = valueText.parentElement as HTMLElement;
    expect(cell.className).not.toMatch(/bg-score-/);
    expect(valueText).toHaveClass('text-secondary');
  });

  test('renders missing values as a secondary-text dash', () => {
    renderCell({ value: null });
    expect(screen.getByText('—')).toHaveClass('text-secondary');
  });

  test('renders out-of-range numbers as plain primary text, not a score bucket', () => {
    renderCell({ value: 2 });
    expect(screen.getByText('2')).toHaveClass('text-primary');
  });

  test('draws no border on a visible score cell — adjacent cells read as one field', () => {
    const { container } = renderCell({ value: 0.5 });

    expect(container.firstChild).toHaveClass('border-none');
    expect(container.firstChild).not.toHaveClass('border-r', 'border-b');
  });

  test('a zero delta — no bucket — draws a neutral right border on a layer-2 background', () => {
    const { container } = renderCell({ value: 0, mode: ScoreColorMode.Delta });

    expect(container.firstChild).toHaveClass('bg-layer-2', 'border-r', 'border-tertiary');
    expect(container.firstChild).not.toHaveClass('border-b');
  });

  test('hides the value text while keeping the color when the column is too narrow', () => {
    const { container } = renderCell({ value: 0.5, columnWidth: NARROW_COLUMN_WIDTH });
    const bucketKey = getScoreCellBucketKey(0.5, ScoreColorMode.Absolute);

    expect(screen.queryByText('0.500')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass(`bg-score-${bucketKey}`);
  });

  test('shows a visible accent-colored right+bottom border once the value is hidden', () => {
    const { container } = renderCell({ value: 0.5, columnWidth: NARROW_COLUMN_WIDTH });
    const bucketKey = getScoreCellBucketKey(0.5, ScoreColorMode.Absolute);

    expect(container.firstChild).toHaveClass(`border-score-${bucketKey}`, 'border-r', 'border-b');
    expect(container.firstChild).not.toHaveClass(`border-score-${bucketKey}-bg`);
  });

  test('exposes the hidden value through an accessible name', () => {
    renderCell({ value: 0.5, columnWidth: NARROW_COLUMN_WIDTH });
    expect(screen.getByRole('group', { name: '0.500' })).toBeInTheDocument();
  });

  test('hides the dash for a missing value when values are hidden — an empty cell, not a dash', () => {
    renderCell({ value: null, columnWidth: NARROW_COLUMN_WIDTH });
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  test('a hidden missing-value cell still gets a neutral right border and an accessible name', () => {
    const { container } = renderCell({ value: null, columnWidth: NARROW_COLUMN_WIDTH });

    expect(container.firstChild).toHaveClass('border-tertiary', 'border-r');
    expect(screen.getByRole('group', { name: '—' })).toBeInTheDocument();
  });

  test('still shows the dash for a missing value when the column is wide enough', () => {
    renderCell({ value: null, columnWidth: HEAT_MAP_VALUE_TEXT_MIN_WIDTH });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('hides the value when the column is narrower than the automatic width threshold', () => {
    renderCell({ value: 0.5, columnWidth: NARROW_COLUMN_WIDTH });
    expect(screen.queryByText('0.500')).not.toBeInTheDocument();
  });

  test('shows the value when the column is wide enough under the automatic threshold', () => {
    renderCell({ value: 0.5, columnWidth: HEAT_MAP_VALUE_TEXT_MIN_WIDTH });
    expect(screen.getByText('0.500')).toBeInTheDocument();
  });
});
