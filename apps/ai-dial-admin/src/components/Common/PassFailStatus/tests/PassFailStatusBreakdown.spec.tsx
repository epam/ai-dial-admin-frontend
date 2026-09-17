import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import PassFailStatusBreakdown from '@/src/components/Common/PassFailStatus/PassFailStatusBreakdown';
import { PassFailErrorCounts } from '@/src/components/Common/PassFailStatus/models';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({ children, tooltip }: { children: ReactNode; tooltip?: ReactNode }) => (
      <span>
        {children}
        <div role="tooltip">{tooltip}</div>
      </span>
    ),
  };
});

const counts: PassFailErrorCounts = {
  passed: 10,
  failed: 2,
  error: 2,
  total: 14,
};

describe('PassFailStatusBreakdown', () => {
  test('renders counts without a tooltip when tooltipTitle is omitted', () => {
    render(<PassFailStatusBreakdown counts={counts} compact />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Runs.Pass')).toBeInTheDocument();
    expect(screen.getByText('Runs.Fail')).toBeInTheDocument();
    expect(screen.getByText('Runs.ExecError')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('omits the not-scored status when the prop is not passed', () => {
    render(<PassFailStatusBreakdown counts={counts} compact />);

    expect(screen.queryByText('Runs.NotScored')).not.toBeInTheDocument();
  });

  test('renders the not-scored status when the prop is passed', () => {
    render(<PassFailStatusBreakdown counts={counts} compact notScored={4} />);

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Runs.NotScored')).toBeInTheDocument();
  });

  test('adds a not-scored line to the tooltip when the prop is passed', () => {
    render(<PassFailStatusBreakdown counts={counts} compact tooltipTitle="Run #316" notScored={4} />);

    expect(screen.getByRole('tooltip')).toHaveTextContent('• 4 Runs.NotScored');
  });

  test('renders tooltip with run name and status lines when tooltipTitle is set', () => {
    render(<PassFailStatusBreakdown counts={counts} compact tooltipTitle="Run #316" />);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Run #316');
    expect(tooltip).toHaveTextContent('• 10 Runs.Pass');
    expect(tooltip).toHaveTextContent('• 2 Runs.Fail');
    expect(tooltip).toHaveTextContent('• 2 Runs.ExecError');
  });

  test('renders labeled counts when not compact', () => {
    render(<PassFailStatusBreakdown counts={counts} />);

    expect(screen.getByText('10 Runs.Pass')).toBeInTheDocument();
    expect(screen.getByText('2 Runs.Fail')).toBeInTheDocument();
    expect(screen.getByText('2 Runs.ExecError')).toBeInTheDocument();
  });
});
