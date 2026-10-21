import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Files from '@/src/components/ImportConfig/Files/Files';
import { ImportI18nKey } from '@/src/constants/i18n';
import { CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { ExportComponentType } from '@/src/types/export';
import { ImportFileType } from '@/src/types/import';

vi.mock('@/src/components/EntityListView/Import/utils', () => ({ isLargeFile: () => false }));

describe('Files — Analytics scope', () => {
  const onChangeAnalyticsPolicy = vi.fn();
  const onChangeImportBody = vi.fn();

  const renderFiles = (files: File[] = []) =>
    render(
      <Files
        files={files}
        fileType={ImportFileType.ARCHIVE}
        configScope={ExportComponentType.ANALYTICS}
        isAnalyticsEnabled
        analyticsPolicy={CatalogResolutionPolicy.FAIL_IF_EXISTS}
        onChangeAnalyticsPolicy={onChangeAnalyticsPolicy}
        onChangeFiles={vi.fn()}
        onChangeFileType={vi.fn()}
        onChangeImportBody={onChangeImportBody}
        onChangeConfigScope={vi.fn()}
        onNextStep={vi.fn()}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('selects Fail if exists by default and hides the file type', () => {
    renderFiles();

    expect(screen.getByRole('radio', { name: ImportI18nKey.AnalyticsFailIfExists })).toBeChecked();
    expect(screen.getByRole('radio', { name: ImportI18nKey.AnalyticsSkipIfExists })).not.toBeChecked();
    expect(screen.queryByText(ImportI18nKey.FileType)).toBeNull();
  });

  test('accepts a single JSON bundle', () => {
    const { container } = renderFiles();

    // The accepted types are an attribute of the native input; no semantic query exposes them.
    const input = container.querySelector('input[type="file"]');
    expect(input?.getAttribute('accept')).toBe('.json, application/json');
    expect(input?.hasAttribute('multiple')).toBe(false);
  });

  test('reports a policy change', async () => {
    const user = userEvent.setup();
    renderFiles();

    await user.click(screen.getByRole('radio', { name: ImportI18nKey.AnalyticsSkipIfExists }));

    expect(onChangeAnalyticsPolicy).toHaveBeenCalledWith(CatalogResolutionPolicy.SKIP_IF_EXISTS);
  });

  test('keeps the policy out of the form body', () => {
    renderFiles([new File(['{}'], 'bundle.json')]);

    const body = onChangeImportBody.mock.lastCall?.[0] as FormData;
    expect(body.get('file')).toBeTruthy();
    expect(body.get('resolutionPolicy')).toBeNull();
  });
});
