import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ResultScorecard from '@/src/components/Analytics/QueryBuilder/Result/ResultScorecard';

vi.mock('@/src/components/Analytics/Usage/Kpi/Sparkline', () => ({
  default: ({ points }: { points: number[] }) => <div>trend of {points.length}</div>,
}));

describe('ResultScorecard', () => {
  test('shows the label and the formatted value with its trend', () => {
    render(<ResultScorecard label="Cost" value="1754.5" points={[1, 2, 3]} />);

    expect(screen.getByText('Cost')).toBeInTheDocument();
    expect(screen.getByText('1,754.5')).toBeInTheDocument();
    expect(screen.getByText('trend of 3')).toBeInTheDocument();
  });

  test('shows the number alone without a trend', () => {
    render(<ResultScorecard label="Cost" value={10} points={[]} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText(/trend of/)).toBeNull();
  });

  test('shows a dash for a value that is not a number', () => {
    render(<ResultScorecard label="Cost" value={null} points={[]} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
