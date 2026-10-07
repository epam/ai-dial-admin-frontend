import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { previewAnalyticsImportConfig } from '@/src/app/[lang]/import-config/actions';
import AnalyticsImportPreview from '@/src/components/ImportConfig/ConfigurationPreview/AnalyticsImportPreview';
import { ImportI18nKey } from '@/src/constants/i18n';
import { CatalogImportPreview, CatalogImportResult } from '@/src/models/analytics/catalog-import';
import { CatalogImportAction, CatalogImportOutcome, CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { getErrorNotification } from '@/src/utils/notification';

vi.mock('@/src/app/[lang]/import-config/actions', () => ({
  previewAnalyticsImportConfig: vi.fn(),
}));

vi.mock('@/src/utils/notification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/utils/notification')>()),
  getErrorNotification: vi.fn(),
}));

const PREVIEW: CatalogImportPreview = {
  required_system_tables: [],
  tables: [{ name: 'usage_sentiment', import_action: CatalogImportAction.CREATE }],
  pipelines: [],
  env_specific: [],
  validation_errors: [],
};

describe('AnalyticsImportPreview', () => {
  const onBlockedChange = vi.fn();
  const onChangeReusedNamesAcknowledged = vi.fn();

  const renderPreview = (props: { result?: CatalogImportResult; isReusedNamesAcknowledged?: boolean } = {}) =>
    render(
      <AnalyticsImportPreview
        importBody={new FormData()}
        policy={CatalogResolutionPolicy.FAIL_IF_EXISTS}
        result={props.result}
        isReusedNamesAcknowledged={props.isReusedNamesAcknowledged ?? false}
        onChangeReusedNamesAcknowledged={onChangeReusedNamesAcknowledged}
        onBlockedChange={onBlockedChange}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('requests the preview without the confirmation and unblocks a clean bundle', async () => {
    vi.mocked(previewAnalyticsImportConfig).mockResolvedValue({ success: true, response: PREVIEW });
    renderPreview();

    expect(await screen.findByText(ImportI18nKey.AnalyticsTables)).toBeInTheDocument();
    expect(screen.getByText(ImportI18nKey.AnalyticsPipelines)).toBeInTheDocument();
    expect(screen.getByText(ImportI18nKey.AnalyticsRequiredSystemTables)).toBeInTheDocument();
    expect(previewAnalyticsImportConfig).toHaveBeenCalledWith(
      expect.any(FormData),
      CatalogResolutionPolicy.FAIL_IF_EXISTS,
      false,
    );
    await waitFor(() => expect(onBlockedChange).toHaveBeenLastCalledWith(false));
  });

  test('lists validation errors and environment-specific values, and blocks the import', async () => {
    vi.mocked(previewAnalyticsImportConfig).mockResolvedValue({
      success: true,
      response: {
        ...PREVIEW,
        validation_errors: ['source table json_source is missing'],
        env_specific: [{ type: 'pipeline', name: 'p', field: 'transform.model', value: 'gpt-4o' }],
      },
    });
    renderPreview();

    expect(await screen.findByText('source table json_source is missing')).toBeInTheDocument();
    expect(screen.getByText(ImportI18nKey.AnalyticsEnvSpecificHeading)).toBeInTheDocument();
    expect(screen.getByText('pipeline p · transform.model: gpt-4o')).toBeInTheDocument();
    await waitFor(() => expect(onBlockedChange).toHaveBeenLastCalledWith(true));
  });

  test('suggests Skip if exists when a row fails', async () => {
    vi.mocked(previewAnalyticsImportConfig).mockResolvedValue({
      success: true,
      response: { ...PREVIEW, tables: [{ name: 'usage_sentiment', import_action: CatalogImportAction.FAIL }] },
    });
    renderPreview();

    expect(await screen.findByText(ImportI18nKey.AnalyticsSkipHint)).toBeInTheDocument();
    await waitFor(() => expect(onBlockedChange).toHaveBeenLastCalledWith(true));
  });

  test('asks to confirm re-used pipeline names', async () => {
    vi.mocked(previewAnalyticsImportConfig).mockResolvedValue({
      success: true,
      response: {
        ...PREVIEW,
        pipelines: [{ name: 'usage-enrich', import_action: CatalogImportAction.CREATE, reused_name: true }],
      },
    });
    const user = userEvent.setup();
    renderPreview();

    const checkbox = await screen.findByText(ImportI18nKey.AnalyticsReusedNamesConfirm);
    await waitFor(() => expect(onBlockedChange).toHaveBeenLastCalledWith(true));
    await user.click(checkbox);

    expect(onChangeReusedNamesAcknowledged).toHaveBeenCalledWith(true);
  });

  test('reports a failed preview in the service words', async () => {
    vi.mocked(previewAnalyticsImportConfig).mockResolvedValue({
      success: false,
      status: 422,
      errorHeader: 'catalog_bundle_version_unsupported',
      errorMessage: 'format_version 2 is not supported',
      requestId: 'r-3',
    });
    renderPreview();

    await waitFor(() =>
      expect(getErrorNotification).toHaveBeenCalledWith(
        'catalog_bundle_version_unsupported',
        'format_version 2 is not supported',
        'r-3',
      ),
    );
    expect(onBlockedChange).toHaveBeenLastCalledWith(true);
  });

  test('reports an unreachable service with its own message', async () => {
    vi.mocked(previewAnalyticsImportConfig).mockRejectedValue(new Error('fetch failed'));
    renderPreview();

    await waitFor(() =>
      expect(getErrorNotification).toHaveBeenCalledWith(undefined, ImportI18nKey.AnalyticsPreviewFailed, undefined),
    );
  });

  test.each([
    [CatalogImportOutcome.COMPLETED, ImportI18nKey.AnalyticsResultCompletedReminder],
    [CatalogImportOutcome.ROLLED_BACK, ImportI18nKey.AnalyticsResultRolledBack],
    [CatalogImportOutcome.ROLLBACK_FAILED, ImportI18nKey.AnalyticsResultRollbackFailed],
  ])('shows the %s outcome and keeps the import blocked', async (outcome, message) => {
    vi.mocked(previewAnalyticsImportConfig).mockResolvedValue({ success: true, response: PREVIEW });
    renderPreview({
      result: { import_id: 'i-1', outcome, required_system_tables: [], tables: [], pipelines: [], env_specific: [] },
    });

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(onBlockedChange).toHaveBeenLastCalledWith(true);
  });
});
