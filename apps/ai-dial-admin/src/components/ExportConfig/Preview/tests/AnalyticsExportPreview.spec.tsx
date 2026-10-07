import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { previewAnalyticsExportConfig } from '@/src/app/[lang]/export-config/actions';
import AnalyticsExportPreview from '@/src/components/ExportConfig/Preview/AnalyticsExportPreview';
import { ExportI18nKey } from '@/src/constants/i18n';
import { CatalogComponentType } from '@/src/types/analytics/export';
import { getErrorNotification } from '@/src/utils/notification';

vi.mock('@/src/app/[lang]/export-config/actions', () => ({
  previewAnalyticsExportConfig: vi.fn(),
}));

vi.mock('@/src/utils/notification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/utils/notification')>()),
  getErrorNotification: vi.fn(),
}));

const REQUEST = { components: [{ type: CatalogComponentType.TABLE, name: 'usage_sentiment' }] };

describe('AnalyticsExportPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('requests the preview for the selection and shows its three sections', async () => {
    const onPreviewResult = vi.fn();
    vi.mocked(previewAnalyticsExportConfig).mockResolvedValue({
      success: true,
      response: { objects: [], required_system_tables: [], skipped: [] },
    });

    render(<AnalyticsExportPreview request={REQUEST} onPreviewResult={onPreviewResult} />);

    expect(await screen.findByText(ExportI18nKey.AnalyticsObjects)).toBeInTheDocument();
    expect(screen.getByText(ExportI18nKey.AnalyticsRequiredSystemTables)).toBeInTheDocument();
    expect(screen.getByText(ExportI18nKey.AnalyticsSkipped)).toBeInTheDocument();
    expect(previewAnalyticsExportConfig).toHaveBeenCalledWith(REQUEST);
    expect(onPreviewResult).toHaveBeenCalledWith(true);
  });

  test('reports a refused selection in the service words', async () => {
    const onPreviewResult = vi.fn();
    vi.mocked(previewAnalyticsExportConfig).mockResolvedValue({
      success: false,
      status: 422,
      errorHeader: 'catalog_export_invalid',
      errorMessage: 'otel_logs is an OTLP landing table',
      requestId: 'r-2',
    });

    render(<AnalyticsExportPreview request={REQUEST} onPreviewResult={onPreviewResult} />);

    await waitFor(() => expect(onPreviewResult).toHaveBeenCalledWith(false));
    expect(getErrorNotification).toHaveBeenCalledWith(
      'catalog_export_invalid',
      'otel_logs is an OTLP landing table',
      'r-2',
    );
  });

  test('reports an unreachable service and keeps the selection refused', async () => {
    const onPreviewResult = vi.fn();
    vi.mocked(previewAnalyticsExportConfig).mockRejectedValue(new Error('fetch failed'));

    render(<AnalyticsExportPreview request={REQUEST} onPreviewResult={onPreviewResult} />);

    await waitFor(() => expect(onPreviewResult).toHaveBeenCalledWith(false));
    expect(getErrorNotification).toHaveBeenCalledOnce();
  });
});
