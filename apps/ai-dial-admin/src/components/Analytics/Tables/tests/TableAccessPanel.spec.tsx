import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTableAccess, replaceTableAccess } from '@/src/app/[lang]/tables/actions';
import TableAccessPanel from '@/src/components/Analytics/Tables/TableAccessPanel';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/tables/actions');

beforeEach(() => {
  vi.clearAllMocks();
  (getTableAccess as any).mockResolvedValue({ write: ['analytics-writer'], modify: [] });
  (replaceTableAccess as any).mockResolvedValue({ success: true });
});

describe('TableAccessPanel', () => {
  test('loads and displays the existing role lists', async () => {
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);

    expect(await screen.findByText('analytics-writer')).toBeInTheDocument();
    expect(getTableAccess).toHaveBeenCalledWith('events');
  });

  test('saving full-replaces the loaded lists and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TableAccessPanel name="events" onClose={onClose} />);
    await screen.findByText('analytics-writer');

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() =>
      expect(replaceTableAccess).toHaveBeenCalledWith('events', { write: ['analytics-writer'], modify: [] }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('keeps Save disabled and does not replace when the initial load fails', async () => {
    (getTableAccess as any).mockResolvedValue(null);
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);

    await waitFor(() => expect(getTableAccess).toHaveBeenCalledWith('events'));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(replaceTableAccess).not.toHaveBeenCalled();
  });

  test('shows both role lists and round-trips them on save', async () => {
    (getTableAccess as any).mockResolvedValue({ write: ['analytics-writer'], modify: ['analytics-editor'] });
    const user = userEvent.setup();
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);

    expect(await screen.findByText('analytics-writer')).toBeInTheDocument();
    expect(screen.getByText('analytics-editor')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() =>
      expect(replaceTableAccess).toHaveBeenCalledWith('events', {
        write: ['analytics-writer'],
        modify: ['analytics-editor'],
      }),
    );
  });
});
