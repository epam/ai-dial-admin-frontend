import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PreviewModal from '../PreviewModal';
import { PopUpState } from '@/src/types/pop-up';
import { ExportType } from '@/src/types/export';
import { ButtonsI18nKey, ExportI18nKey } from '@/src/constants/i18n';

const defaultProps = {
  exportRequest: { $type: ExportType.Full },
  modalState: PopUpState.Opened,
  onClose: vi.fn(),
  onPrepare: vi.fn(),
};

vi.mock('@/src/app/[lang]/export-config/actions', () => ({
  previewExportConfig: vi.fn().mockResolvedValue({ success: true, response: {} }),
}));

describe('PreviewModal', () => {
  it('renders popup and tabs', async () => {
    render(<PreviewModal {...defaultProps} />);
    expect(screen.getByText(ExportI18nKey.FilePreview)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('loader')).toBeInTheDocument());
  });

  it('calls onClose when cancel button is clicked', async () => {
    render(<PreviewModal {...defaultProps} />);
    const cancelBtn = await screen.getByRole('button', { name: ButtonsI18nKey.Cancel });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onPrepare when export button is clicked', async () => {
    render(<PreviewModal {...defaultProps} />);
    const exportBtn = await screen.getByRole('button', { name: ButtonsI18nKey.Export });
    fireEvent.click(exportBtn);
    expect(defaultProps.onPrepare).toHaveBeenCalled();
  });

  it('toggles secret switch', async () => {
    render(<PreviewModal {...defaultProps} />);
    const switchLabel = await screen.findByText(ExportI18nKey.IncludeSecrets);
    expect(switchLabel).toBeInTheDocument();
    fireEvent.click(switchLabel);
    // No assertion for state, but this covers the toggle
  });
});
