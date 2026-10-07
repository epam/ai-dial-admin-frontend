import { ButtonsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { ExportComponentType, ExportType } from '@/src/types/export';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { previewAnalyticsExportConfig } from '@/src/app/[lang]/export-config/actions';
import { CatalogComponentType } from '@/src/types/analytics/export';
import PreviewModal from '../PreviewModal';

const defaultProps = {
  exportRequest: { $type: ExportType.Full },
  scope: ExportComponentType.ADMIN,
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
  previewAnalyticsExportConfig: vi.fn(),
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
        scope={ExportComponentType.DEPLOYMENTS}
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
        scope={ExportComponentType.DEPLOYMENTS}
      />,
    );
    const firewallLabel = await screen.findByText(ExportI18nKey.IncludeGlobalFirewall);
    expect(firewallLabel).toBeInTheDocument();
  });
});

describe('PreviewModal — Analytics scope', () => {
  const analyticsProps = {
    ...defaultProps,
    exportRequest: undefined,
    scope: ExportComponentType.ANALYTICS,
    analyticsExportRequest: { components: [{ type: CatalogComponentType.TABLE, name: 'usage_sentiment' }] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('enables Export once the service accepts the selection and shows no checkboxes', async () => {
    vi.mocked(previewAnalyticsExportConfig).mockResolvedValue({
      success: true,
      response: { objects: [], required_system_tables: [], skipped: [] },
    });

    render(<PreviewModal {...analyticsProps} />);

    await waitFor(() => expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeEnabled());
    expect(screen.queryByText(ExportI18nKey.IncludeSecrets)).toBeNull();
    expect(screen.queryByText(ExportI18nKey.IncludeGlobalFirewall)).toBeNull();
  });

  test('keeps Export disabled when the service refuses the selection', async () => {
    vi.mocked(previewAnalyticsExportConfig).mockResolvedValue({ success: false, status: 422, errorMessage: 'refused' });

    render(<PreviewModal {...analyticsProps} />);

    await waitFor(() => expect(previewAnalyticsExportConfig).toHaveBeenCalledOnce());
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeDisabled();
  });
});
