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

  test.each([RunStatus.RUNNING, RunStatus.CANCELLING])('indicates %s as in progress', (status) => {
    render(<RunStatusComponent status={status} />);

    expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
  });

  test('renders the label for a cancelling run', () => {
    render(<RunStatusComponent status={RunStatus.CANCELLING} />);

    expect(screen.getByText('Runs.Status.Cancelling')).toBeInTheDocument();
  });

  test.each([RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED])(
    'indicates %s as settled, without an in-progress indicator',
    (status) => {
      const { container } = render(<RunStatusComponent status={status} />);

      expect(screen.queryByRole('img', { name: 'Loading' })).toBeNull();
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    },
  );

  test('renders the raw value for a status it does not recognize, rather than nothing', () => {
    render(<RunStatusComponent status="SOMETHING_NEW" />);

    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();
  });

  test('renders nothing for a run with no status', () => {
    const { container } = render(<RunStatusComponent status={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('RunStatusComponent — indicator only', () => {
  const renderIndicator = (status: RunStatus | string) => render(<RunStatusComponent status={status} isLabelHidden />);

  test.each([
    [RunStatus.RUNNING, 'Runs.Status.Running'],
    [RunStatus.COMPLETED, 'Runs.Status.Completed'],
  ])('exposes the %s label to assistive tech without showing it', (status, label) => {
    renderIndicator(status);

    // `sr-only` is the whole point of the variant: the label stays readable but takes no column width.
    expect(screen.getByText(label).className).toContain('sr-only');
  });

  test('keeps the in-progress indicator for a transitional status', () => {
    renderIndicator(RunStatus.CANCELLING);

    expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.getByText('Runs.Status.Cancelling').className).toContain('sr-only');
  });

  test('keeps the coloured dot for a settled status', () => {
    const { container } = renderIndicator(RunStatus.FAILED);

    expect(container.querySelector('.bg-error')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Loading' })).toBeNull();
  });

  test('renders nothing for a run with no status', () => {
    const { container } = renderIndicator('');

    expect(container).toBeEmptyDOMElement();
  });

  test('leaves the label visible when the variant is not requested', () => {
    render(<RunStatusComponent status={RunStatus.COMPLETED} />);

    expect(screen.getByText('Runs.Status.Completed').className).not.toContain('sr-only');
  });
});
