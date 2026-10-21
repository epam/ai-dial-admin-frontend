import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import ScoreCellValue from '@/src/components/Common/ScoreCell/ScoreCellValue';

describe('ScoreCellValue', () => {
  test('shows the score with three decimals on its bucket colors, without a progress bar', () => {
    render(<ScoreCellValue value={0.8} />);

    const value = screen.getByText('0.800');
    expect(value).toHaveClass('bg-score-abs-09', 'text-score-abs-09');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  test('keeps the number at the top-right of a tall cell', () => {
    render(<ScoreCellValue value={0.8} />);

    expect(screen.getByText('0.800')).toHaveClass('items-start', 'justify-end', 'self-stretch');
  });

  test('uses the dedicated edge buckets for exact 0 and exact 1', () => {
    const { rerender } = render(<ScoreCellValue value={0} />);
    expect(screen.getByText('0.000')).toHaveClass('bg-score-abs-00');

    rerender(<ScoreCellValue value={1} />);
    expect(screen.getByText('1.000')).toHaveClass('bg-score-abs-11');
  });

  test('formats a delta with its sign on the delta buckets', () => {
    render(<ScoreCellValue value={0.3} mode={ScoreColorMode.Delta} />);

    expect(screen.getByText('+0.300')).toHaveClass('bg-score-delta-p2');
  });

  test('leaves a zero delta neutral', () => {
    render(<ScoreCellValue value={0} mode={ScoreColorMode.Delta} />);

    const value = screen.getByText('0');
    expect(value).toHaveClass('text-primary');
    expect(value.className).not.toMatch(/bg-score/);
  });
});
