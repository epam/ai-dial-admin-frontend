import { ICellRendererParams } from 'ag-grid-community';
import { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';
import { HEAT_MAP_VALUE_TIERS } from '@/src/components/Common/HeatMap/constants';

import ScoreCellRenderer from '../ScoreCellRenderer';

interface RenderParamsOverrides {
  value?: unknown;
  mode?: ScoreColorMode;
  theme?: string;
  columnWidth?: number;
  context?: unknown;
}

const [DEFAULT_TIER, MEDIUM_TIER, SMALL_TIER] = HEAT_MAP_VALUE_TIERS;
const NARROW_COLUMN_WIDTH = SMALL_TIER.minWidthAbsolute - 1;

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
    renderCell({ value: null, columnWidth: SMALL_TIER.minWidthAbsolute });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('a visible dash cell draws a neutral right border so neighboring dash cells stay separated', () => {
    const { container } = renderCell({ value: null, columnWidth: DEFAULT_TIER.minWidthAbsolute });

    expect(container.firstChild).toHaveClass('border-r', 'border-tertiary');
  });

  test.each([
    { tier: DEFAULT_TIER, name: 'default' },
    { tier: MEDIUM_TIER, name: 'medium' },
    { tier: SMALL_TIER, name: 'small' },
  ])('renders the $name tier text size and padding at its minimum width', ({ tier }) => {
    const { container } = renderCell({ value: 0.5, columnWidth: tier.minWidthAbsolute });

    expect(screen.getByText('0.500')).toHaveClass(tier.textClassName);
    expect(container.firstChild).toHaveClass(tier.paddingClassName);
    expect(container.firstChild).not.toHaveClass('border-r');
  });

  test('steps down to the next tier one pixel below a tier minimum width', () => {
    renderCell({ value: 0.5, columnWidth: DEFAULT_TIER.minWidthAbsolute - 1 });
    expect(screen.getByText('0.500')).toHaveClass(MEDIUM_TIER.textClassName);
  });

  test('hides the value one pixel below the smallest tier', () => {
    renderCell({ value: 0.5, columnWidth: SMALL_TIER.minWidthAbsolute - 1 });
    expect(screen.queryByText('0.500')).not.toBeInTheDocument();
  });

  test('delta mode needs a wider column than absolute mode for the same tier', () => {
    renderCell({ value: 0.5, mode: ScoreColorMode.Delta, columnWidth: DEFAULT_TIER.minWidthDelta - 1 });
    expect(screen.getByText('+0.500')).toHaveClass(MEDIUM_TIER.textClassName);
  });

  test('hides a delta value below the smallest delta tier even where an absolute value would still show', () => {
    renderCell({ value: 0.5, mode: ScoreColorMode.Delta, columnWidth: SMALL_TIER.minWidthDelta - 1 });
    expect(screen.queryByText('+0.500')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: '+0.500' })).toBeInTheDocument();
  });

  test('renders the default tier when the column width is unknown', () => {
    renderCell({ value: 0.5 });
    expect(screen.getByText('0.500')).toHaveClass(DEFAULT_TIER.textClassName);
  });

  test('applies the tier text size to the missing-value dash', () => {
    renderCell({ value: null, columnWidth: MEDIUM_TIER.minWidthAbsolute });
    expect(screen.getByText('—')).toHaveClass(MEDIUM_TIER.textClassName);
  });
});

describe('ScoreCellRenderer — heat map layout width', () => {
  test('sizes the value from the grid layout width rather than the column own width', () => {
    renderCell({
      value: 0.5,
      columnWidth: DEFAULT_TIER.minWidthAbsolute,
      context: { valueColumnLayoutWidth: MEDIUM_TIER.minWidthAbsolute },
    });

    expect(screen.getByText('0.500')).toHaveClass(MEDIUM_TIER.textClassName);
  });

  test('falls back to the column width when the context carries no layout width', () => {
    renderCell({ value: 0.5, columnWidth: SMALL_TIER.minWidthAbsolute - 1, context: {} });

    expect(screen.queryByText('0.500')).not.toBeInTheDocument();
  });
});
