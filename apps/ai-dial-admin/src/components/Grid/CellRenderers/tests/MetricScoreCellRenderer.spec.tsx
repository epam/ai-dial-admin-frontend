import { ICellRendererParams } from 'ag-grid-community';
import { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { SCORE_INDICATOR_COMPARE_WIDTH } from '@/src/components/Common/ScoreBar/constants';

import MetricScoreCellRenderer from '../MetricScoreCellRenderer';

const renderCell = (
  params: Partial<ICellRendererParams> & { getMetricValue?: (p: ICellRendererParams) => unknown; width?: number },
) => render(MetricScoreCellRenderer(params as ICellRendererParams) as ReactElement);

describe('MetricScoreCellRenderer', () => {
  test('renders ScoreBar and formatted value for 0-1 scores', () => {
    const { container } = renderCell({ value: 0.102 });
    expect(screen.getByText('0.102')).toBeInTheDocument();
    expect(container.querySelector('.h-1.rounded-sm.bg-layer-1')).toBeInTheDocument();
    expect(container.querySelector('.h-full.rounded-sm')).toHaveStyle({ width: '10.2%' });
  });

  test('renders empty ScoreBar track for zero score', () => {
    const { container } = renderCell({ value: 0 });
    expect(screen.getByText('0.000')).toBeInTheDocument();
    expect(container.querySelector('.h-full.rounded-sm')).not.toBeInTheDocument();
  });

  test('uses getMetricValue when provided', () => {
    const { container } = renderCell({
      value: null,
      getMetricValue: () => 0.5,
      width: SCORE_INDICATOR_COMPARE_WIDTH,
    });
    expect(screen.getByText('0.500')).toBeInTheDocument();
    expect(container.firstChild?.firstChild).toHaveStyle({ width: `${SCORE_INDICATOR_COMPARE_WIDTH}px` });
  });

  test('renders missing display for null value', () => {
    renderCell({ value: null });
    expect(screen.getByText('—')).toHaveClass('text-secondary');
  });

  test('renders missing display for em dash string', () => {
    renderCell({ value: '—' });
    expect(screen.getByText('—')).toHaveClass('text-secondary');
  });

  test('renders non-score values as plain text', () => {
    renderCell({ value: '{"matched":true}' });
    expect(screen.getByText('{"matched":true}')).toHaveClass('text-primary');
  });

  test('renders numbers outside 0-1 as plain text', () => {
    renderCell({ value: 2 });
    expect(screen.getByText('2')).toHaveClass('text-primary');
  });
});
