import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { importAnalyticsConfig } from '@/src/app/[lang]/import-config/actions';
import { ImportI18nKey } from '@/src/constants/i18n';
import { CatalogImportResult } from '@/src/models/analytics/catalog-import';
import { CatalogImportOutcome, CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { ExportComponentType } from '@/src/types/export';
import { getErrorNotification } from '@/src/utils/notification';
import ImportConfig from '../ImportConfig';

vi.mock('@/src/app/[lang]/import-config/actions', () => ({
  importAnalyticsConfig: vi.fn(),
  importDeploymentConfig: vi.fn(),
  importJsonConfigs: vi.fn(),
  importZipConfig: vi.fn(),
}));

vi.mock('@/src/utils/notification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/utils/notification')>()),
  getErrorNotification: vi.fn(),
}));

vi.mock('@/src/components/EntityListView/Import/utils', () => ({ isLargeFile: () => false }));

interface FilesMockProps {
  onChangeConfigScope: (scope: string) => void;
  onChangeFiles: (files: File[]) => void;
  onChangeAnalyticsPolicy: (policy: CatalogResolutionPolicy) => void;
  onNextStep: () => void;
}

// The steps' own behavior is covered by `Files.spec.tsx` and the ConfigurationPreview specs; here they only drive
// the page's state.
vi.mock('@/src/components/ImportConfig/Files/Files', () => ({
  default: ({ onChangeConfigScope, onChangeFiles, onChangeAnalyticsPolicy, onNextStep }: FilesMockProps) => (
    <>
      <button type="button" onClick={() => onChangeConfigScope(ExportComponentType.ANALYTICS)}>
        pick-analytics
      </button>
      <button type="button" onClick={() => onChangeFiles([new File(['{}'], 'bundle.json')])}>
        pick-file
      </button>
      <button type="button" onClick={() => onChangeAnalyticsPolicy(CatalogResolutionPolicy.SKIP_IF_EXISTS)}>
        pick-skip
      </button>
      <button type="button" onClick={onNextStep}>
        next
      </button>
    </>
  ),
}));

interface PreviewMockProps {
  analyticsResult?: CatalogImportResult;
  onChangeReusedNamesAcknowledged: (isAcknowledged: boolean) => void;
  onImportFile: () => void;
}

vi.mock('@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview', () => ({
  default: ({ analyticsResult, onChangeReusedNamesAcknowledged, onImportFile }: PreviewMockProps) => (
    <>
      <p>{analyticsResult ? `result-${analyticsResult.outcome}` : 'no-result'}</p>
      <button type="button" onClick={() => onChangeReusedNamesAcknowledged(true)}>
        acknowledge
      </button>
      <button type="button" onClick={onImportFile}>
        import
      </button>
    </>
  ),
}));

const RESULT: CatalogImportResult = {
  import_id: 'i-1',
  outcome: CatalogImportOutcome.COMPLETED,
  required_system_tables: [],
  tables: [],
  pipelines: [],
  env_specific: [],
};

describe('ImportConfig — Analytics import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const reachConfiguration = async () => {
    const user = userEvent.setup();
    render(<ImportConfig isAnalyticsEnabled />);
    await user.click(screen.getByRole('button', { name: 'pick-analytics' }));
    await user.click(screen.getByRole('button', { name: 'pick-file' }));
    await user.click(screen.getByRole('button', { name: 'pick-skip' }));
    await user.click(screen.getByRole('button', { name: 'next' }));
    return user;
  };

  test('sends the chosen policy and the confirmation, and keeps the result in place', async () => {
    vi.mocked(importAnalyticsConfig).mockResolvedValue({ success: true, response: RESULT });
    const user = await reachConfiguration();

    await user.click(screen.getByRole('button', { name: 'acknowledge' }));
    await user.click(screen.getByRole('button', { name: 'import' }));

    await waitFor(() => expect(screen.getByText('result-completed')).toBeInTheDocument());
    expect(importAnalyticsConfig).toHaveBeenCalledWith(
      expect.any(FormData),
      CatalogResolutionPolicy.SKIP_IF_EXISTS,
      true,
    );
  });

  test('clears the result and the confirmation when another file is chosen', async () => {
    vi.mocked(importAnalyticsConfig).mockResolvedValue({ success: true, response: RESULT });
    const user = await reachConfiguration();

    await user.click(screen.getByRole('button', { name: 'acknowledge' }));
    await user.click(screen.getByRole('button', { name: 'import' }));
    await waitFor(() => expect(screen.getByText('result-completed')).toBeInTheDocument());

    await user.click(screen.getByText(ImportI18nKey.Files));
    await user.click(screen.getByRole('button', { name: 'pick-file' }));
    await user.click(screen.getByRole('button', { name: 'next' }));
    expect(screen.getByText('no-result')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'import' }));
    await waitFor(() => expect(importAnalyticsConfig).toHaveBeenCalledTimes(2));
    expect(importAnalyticsConfig).toHaveBeenLastCalledWith(
      expect.any(FormData),
      CatalogResolutionPolicy.SKIP_IF_EXISTS,
      false,
    );
  });

  test('reports a refused import in the service words and shows no result', async () => {
    vi.mocked(importAnalyticsConfig).mockResolvedValue({
      success: false,
      status: 409,
      errorHeader: 'catalog_import_conflict',
      errorMessage: 'usage_sentiment exists',
      requestId: 'r-1',
    });
    const user = await reachConfiguration();

    await user.click(screen.getByRole('button', { name: 'import' }));

    await waitFor(() =>
      expect(getErrorNotification).toHaveBeenCalledWith('catalog_import_conflict', 'usage_sentiment exists', 'r-1'),
    );
    expect(screen.getByText('no-result')).toBeInTheDocument();
  });

  test('reports an unreachable service with its own message', async () => {
    vi.mocked(importAnalyticsConfig).mockRejectedValue(new Error('fetch failed'));
    const user = await reachConfiguration();

    await user.click(screen.getByRole('button', { name: 'import' }));

    await waitFor(() =>
      expect(getErrorNotification).toHaveBeenCalledWith(undefined, ImportI18nKey.AnalyticsImportFailed, undefined),
    );
  });
});
