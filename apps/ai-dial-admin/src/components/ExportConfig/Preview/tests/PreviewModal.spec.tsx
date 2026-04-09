import { ButtonsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { ExportType } from '@/src/types/export';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PreviewModal from '../PreviewModal';

const defaultProps = {
  exportRequest: { $type: ExportType.Full },
  isModalOpen: true,
  onClose: vi.fn(),
  onPrepare: vi.fn(),
};

vi.mock('@/src/app/[lang]/export-config/actions', () => ({
  previewExportConfig: vi.fn().mockResolvedValue({ success: true, response: {} }),
  previewDeploymentExportConfig: vi.fn().mockResolvedValue({
    success: true,
    response: { deployments: [], imageDefinitions: [], globalImageBuildDomainWhitelist: [] },
  }),
}));

describe('PreviewModal', () => {
  test('renders popup and tabs', async () => {
    render(<PreviewModal {...defaultProps} />);
    expect(screen.getByText(ExportI18nKey.FilePreview)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
  });

  test('calls onClose when cancel button is clicked', async () => {
    render(<PreviewModal {...defaultProps} />);
    const cancelBtn = await screen.getByRole('button', { name: ButtonsI18nKey.Cancel });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('calls onPrepare when export button is clicked', async () => {
    render(<PreviewModal {...defaultProps} />);
    const exportBtn = await screen.getByRole('button', { name: ButtonsI18nKey.Export });
    fireEvent.click(exportBtn);
    expect(defaultProps.onPrepare).toHaveBeenCalled();
  });

  test('toggles secret switch', async () => {
    render(<PreviewModal {...defaultProps} />);
    const switchLabel = await screen.findByText(ExportI18nKey.IncludeSecrets);
    expect(switchLabel).toBeInTheDocument();
    fireEvent.click(switchLabel);
    // No assertion for state, but this covers the toggle
  });

  test('renders "Prepare file" button for deployment export', async () => {
    render(
      <PreviewModal
        {...defaultProps}
        exportRequest={undefined}
        deploymentExportRequest={{ $type: ExportType.Custom, components: [] }}
        isDeploymentExport={true}
      />,
    );
    expect(screen.getByText(ExportI18nKey.FilePreview)).toBeInTheDocument();
    const prepareBtn = await screen.findByRole('button', { name: ButtonsI18nKey.PrepareFile });
    expect(prepareBtn).toBeInTheDocument();
  });

  test('shows include global firewall checkbox for deployment export', async () => {
    render(
      <PreviewModal
        {...defaultProps}
        exportRequest={undefined}
        deploymentExportRequest={{ $type: ExportType.Custom, components: [] }}
        isDeploymentExport={true}
      />,
    );
    const firewallLabel = await screen.findByText(ExportI18nKey.IncludeGlobalFirewall);
    expect(firewallLabel).toBeInTheDocument();
  });
});
