import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import RunStatusBadge from '@/src/components/Common/RunStatus/RunStatusBadge';
import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import { RunStatus } from '@/src/models/evaluation/run';

describe('RunStatusBadge', () => {
  test.each([
    [RunStatus.PENDING, 'Runs.Status.Pending', 'text-secondary'],
    [RunStatus.COMPLETED, 'Runs.Status.Completed', 'text-success'],
    [RunStatus.CANCELLED, 'Runs.Status.Cancelled', 'text-secondary'],
    [RunStatus.FAILED, 'Runs.Status.Failed', 'text-error'],
  ])('renders %s as a settled badge with its tone and no spinner', (status, label, textClass) => {
    render(<RunStatusBadge run={{ status }} />);

    expect(screen.getByText(label).parentElement).toHaveClass(textClass);
    expect(screen.queryByRole('img', { name: 'Loading' })).toBeNull();
  });

  test.each([
    [RunStatus.RUNNING, 'Runs.Status.Running'],
    [RunStatus.CANCELLING, 'Runs.Status.Cancelling'],
  ])('renders %s as an info badge with a spinner', (status, label) => {
    render(<RunStatusBadge run={{ status }} />);

    expect(screen.getByText(label).parentElement).toHaveClass('text-info', 'bg-info');
    expect(screen.getByRole('img', { name: 'Loading', hidden: true })).toBeInTheDocument();
  });

  test('shows the error message of a failed run as a hint', async () => {
    render(<RunStatusBadge run={{ status: RunStatus.FAILED, errorMessage: 'Deployment unreachable' }} />);

    await userEvent.hover(screen.getByRole('button', { name: StatusBadgeI18nKey.Details }));

    expect(await screen.findByText('Deployment unreachable')).toBeInTheDocument();
  });

  test('renders no info icon for a failed run without a message', () => {
    render(<RunStatusBadge run={{ status: RunStatus.FAILED }} />);

    expect(screen.queryByRole('button', { name: StatusBadgeI18nKey.Details })).toBeNull();
  });

  test('renders the raw value for an unknown status', () => {
    render(<RunStatusBadge run={{ status: 'SOMETHING_NEW' as RunStatus }} />);

    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();
  });

  test('renders nothing for a run with no status', () => {
    const { container } = render(<RunStatusBadge run={{}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
