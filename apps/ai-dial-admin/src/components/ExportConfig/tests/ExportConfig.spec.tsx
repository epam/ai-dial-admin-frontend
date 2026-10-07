import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { exportAnalyticsConfig } from '@/src/app/[lang]/export-config/actions';
import { downloadFile } from '@/src/utils/download';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { ButtonsI18nKey, ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import ExportConfig from '../ExportConfig';

vi.mock('@/src/app/[lang]/export-config/actions', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    exportConfig: vi.fn(),
    exportConfigMap: vi.fn(),
    getEntities: vi.fn().mockResolvedValue([]),
    getDeploymentEntities: vi.fn().mockResolvedValue([]),
    exportAnalyticsConfig: vi.fn(),
  };
});

vi.mock('@/src/utils/download', () => ({ downloadFile: vi.fn() }));

vi.mock('@/src/utils/notification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/utils/notification')>()),
  getErrorNotification: vi.fn(),
  getSuccessNotification: vi.fn(),
}));

// The selection and the preview have their own specs; here they only hand the page a selection and a confirm.
vi.mock('@/src/components/ExportConfig/Content/AnalyticsConfigContent', () => ({
  default: ({ setCustomExportData, isFull }: { setCustomExportData: (data: object) => void; isFull: boolean }) =>
    isFull ? (
      <p>full-listing</p>
    ) : (
      <button type="button" onClick={() => setCustomExportData({ 'analytics-table': [{ name: 'usage_sentiment' }] })}>
        select-table
      </button>
    ),
}));

vi.mock('@/src/components/ExportConfig/Preview/PreviewModal', () => ({
  default: ({ onPrepare }: { onPrepare: (addSecrets: boolean) => void }) => (
    <button type="button" onClick={() => onPrepare(false)}>
      confirm-preview
    </button>
  ),
}));

describe('ExportConfig', () => {
  test('renders export config title and button', () => {
    render(<ExportConfig enableExportConfigMap={true} />);
    expect(screen.getByText(/ExportConfig/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeInTheDocument();
  });
});

describe('ExportConfig — Components selector', () => {
  test('is not rendered when neither Deployments nor Analytics is enabled', () => {
    render(<ExportConfig />);
    expect(screen.queryByText(ExportI18nKey.Components)).toBeNull();
  });

  test('offers Analytics without Deployments when only Analytics is enabled', () => {
    render(<ExportConfig isAnalyticsEnabled />);
    expect(screen.getByText(ExportI18nKey.Components)).toBeInTheDocument();
    expect(screen.getByText(MenuI18nKey.Analytics)).toBeInTheDocument();
    expect(screen.queryByText(ExportI18nKey.Deployments)).toBeNull();
  });

  test('offers Deployments without Analytics when only Deployments is enabled', () => {
    render(<ExportConfig deploymentsEnabled />);
    expect(screen.getByText(ExportI18nKey.Deployments)).toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.Analytics)).toBeNull();
  });
});

describe('ExportConfig — Analytics scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const selectAnalytics = async () => {
    const user = userEvent.setup();
    render(<ExportConfig deploymentsEnabled isAnalyticsEnabled />);
    await user.click(screen.getByText(MenuI18nKey.Analytics));
    return user;
  };

  const selectAnalyticsCustom = async () => {
    const user = await selectAnalytics();
    await user.click(screen.getByText(ExportI18nKey.Custom));
    return user;
  };

  test('starts in Full mode with Export enabled and the content listing everything', async () => {
    await selectAnalytics();

    expect(screen.getByText(ExportI18nKey.ExportType)).toBeInTheDocument();
    expect(screen.getByText('full-listing')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'select-table' })).toBeNull();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeEnabled();
  });

  test('exports everything in Full mode by sending an empty selection', async () => {
    vi.mocked(exportAnalyticsConfig).mockResolvedValue({
      success: true,
      response: { blob: new Blob(['{}']), fileName: 'adas-catalog.json' },
    });
    const user = await selectAnalytics();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Export }));
    await user.click(screen.getByRole('button', { name: 'confirm-preview' }));

    await waitFor(() => expect(exportAnalyticsConfig).toHaveBeenCalledWith({ components: [] }));
  });

  test('hides the admin format controls and disables a Custom export on an empty selection', async () => {
    await selectAnalyticsCustom();

    expect(screen.queryByText(ExportI18nKey.ExportFormat)).toBeNull();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeDisabled();
  });

  test('downloads the bundle the service named once the preview is confirmed', async () => {
    const blob = new Blob(['{}']);
    vi.mocked(exportAnalyticsConfig).mockResolvedValue({
      success: true,
      response: { blob, fileName: 'adas-catalog.json' },
    });
    const user = await selectAnalyticsCustom();

    await user.click(screen.getByRole('button', { name: 'select-table' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Export }));
    await user.click(screen.getByRole('button', { name: 'confirm-preview' }));

    await waitFor(() => expect(downloadFile).toHaveBeenCalledWith(blob, 'adas-catalog.json'));
    expect(exportAnalyticsConfig).toHaveBeenCalledWith({
      components: [{ type: 'table', name: 'usage_sentiment' }],
    });
    expect(getSuccessNotification).toHaveBeenCalledOnce();
  });

  test('downloads nothing and reports the service message when the export fails', async () => {
    vi.mocked(exportAnalyticsConfig).mockResolvedValue({
      success: false,
      status: 403,
      errorMessage: 'sensitive_column_not_entitled',
      requestId: 'r-9',
    });
    const user = await selectAnalyticsCustom();

    await user.click(screen.getByRole('button', { name: 'select-table' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Export }));
    await user.click(screen.getByRole('button', { name: 'confirm-preview' }));

    await waitFor(() =>
      expect(getErrorNotification).toHaveBeenCalledWith(
        ExportI18nKey.ErrorTitle,
        'sensitive_column_not_entitled',
        'r-9',
      ),
    );
    expect(downloadFile).not.toHaveBeenCalled();
  });

  test('clears the Analytics selection when the scope changes', async () => {
    const user = await selectAnalyticsCustom();

    await user.click(screen.getByRole('button', { name: 'select-table' }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeEnabled();

    await user.click(screen.getByText(ExportI18nKey.Deployments));
    await user.click(screen.getByText(MenuI18nKey.Analytics));
    await user.click(screen.getByText(ExportI18nKey.Custom));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeDisabled();
  });

  test('restores the admin structure controls when switching back', async () => {
    const user = await selectAnalytics();

    await user.click(screen.getByText(ExportI18nKey.EntitiesBuildersAccess));

    expect(screen.getByText(ExportI18nKey.ExportFormat)).toBeInTheDocument();
  });
});
