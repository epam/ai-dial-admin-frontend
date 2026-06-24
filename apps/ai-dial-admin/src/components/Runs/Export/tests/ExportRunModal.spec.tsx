import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ExportRunModal from '@/src/components/Runs/Export/ExportRunModal';
import { ButtonsI18nKey, ExportRunI18nKey } from '@/src/constants/i18n';

const mockExportRunPreview = vi.fn();
const mockShowNotification = vi.fn().mockReturnValue('notification-id');
const mockRemoveNotification = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  exportRunPreview: (...args: unknown[]) => mockExportRunPreview(...args),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification, removeNotification: mockRemoveNotification }),
}));

const PREVIEW_DATA: unknown[][] = [
  ['id', 'data::prompt', 'response::answer'],
  ['run-1', 'hello', 'world'],
];

describe('ExportRunModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.resetMocks();
    mockExportRunPreview.mockResolvedValue(PREVIEW_DATA);
    mockShowNotification.mockReturnValue('notification-id');
  });

  test('renders modal title with run id', async () => {
    render(<ExportRunModal runId="run-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(`${ExportRunI18nKey.ExportRunTitle} run-1`)).toBeInTheDocument();
    });
  });

  test('fetches preview on mount with the correct runId', async () => {
    render(<ExportRunModal runId="run-42" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(mockExportRunPreview).toHaveBeenCalledWith('run-42');
    });
  });

  test('fetches preview exactly once on mount', async () => {
    render(<ExportRunModal runId="run-1" onClose={vi.fn()} />);
    await waitFor(() => expect(mockExportRunPreview).toHaveBeenCalledTimes(1));
  });

  test('Export CSV button is enabled after preview loads', async () => {
    render(<ExportRunModal runId="run-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(ButtonsI18nKey.ExportCsv)).not.toBeDisabled();
    });
  });

  test('Export CSV button is disabled while exporting', async () => {
    fetchMock.mockResponseOnce(() => new Promise(() => {})); // never resolves
    render(<ExportRunModal runId="run-1" onClose={vi.fn()} />);

    await waitFor(() => expect(mockExportRunPreview).toHaveBeenCalled());

    const exportBtn = screen.getByText(ButtonsI18nKey.ExportCsv);
    // Use fireEvent (synchronous) to avoid waiting for the never-resolving fetch
    fireEvent.click(exportBtn);

    await waitFor(() => expect(exportBtn.closest('button')).toBeDisabled());
  });

  test('shows success notification after successful export', async () => {
    fetchMock.mockResponseOnce('id,prompt\nrun-1,hello', {
      status: 200,
      headers: { 'Content-Disposition': 'attachment; filename="export.csv"', 'Content-Type': 'text/csv' },
    });

    render(<ExportRunModal runId="run-1" onClose={vi.fn()} />);
    await waitFor(() => expect(mockExportRunPreview).toHaveBeenCalled());

    await userEvent.click(screen.getByText(ButtonsI18nKey.ExportCsv));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: ExportRunI18nKey.ExportSuccess }),
      );
    });
  });

  test('shows error notification when export fails', async () => {
    fetchMock.mockResponseOnce('Internal server error', { status: 500 });

    render(<ExportRunModal runId="run-1" onClose={vi.fn()} />);
    await waitFor(() => expect(mockExportRunPreview).toHaveBeenCalled());

    await userEvent.click(screen.getByText(ButtonsI18nKey.ExportCsv));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: ExportRunI18nKey.ExportError }),
      );
    });
  });

  test('shows no preview when preview data is unavailable', async () => {
    mockExportRunPreview.mockResolvedValue(null);

    render(<ExportRunModal runId="run-1" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(ExportRunI18nKey.NoPreview)).toBeInTheDocument();
    });
  });

  test('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    render(<ExportRunModal runId="run-1" onClose={onClose} />);
    await userEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });
});
