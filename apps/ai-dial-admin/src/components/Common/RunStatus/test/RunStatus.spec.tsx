import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import RunStatusComponent from '@/src/components/Common/RunStatus/RunStatus';
import { RunStatus } from '@/src/models/evaluation/run';

describe('RunStatusComponent', () => {
  test('renders the label for a completed run', () => {
    render(<RunStatusComponent status={RunStatus.COMPLETED} />);

    expect(screen.getByText('Runs.Status.Completed')).toBeInTheDocument();
  });

  test('renders the label for a running run', () => {
    render(<RunStatusComponent status={RunStatus.RUNNING} />);

    expect(screen.getByText('Runs.Status.Running')).toBeInTheDocument();
  });

  test('renders the label for a failed run', () => {
    render(<RunStatusComponent status={RunStatus.FAILED} />);

    expect(screen.getByText('Runs.Status.Failed')).toBeInTheDocument();
  });

  test('renders the label for a cancelled run', () => {
    const { container } = render(<RunStatusComponent status={RunStatus.CANCELLED} />);

    expect(screen.getByText('Runs.Status.Cancelled')).toBeInTheDocument();
    expect(container.querySelector('.bg-secondary')).toBeInTheDocument();
  });
});
