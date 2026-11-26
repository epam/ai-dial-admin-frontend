import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AnalyticsImportNotices from '@/src/components/ImportConfig/ConfigurationPreview/AnalyticsImportNotices';
import { ImportI18nKey } from '@/src/constants/i18n';
import { CatalogImportPreview } from '@/src/models/analytics/catalog-import';
import { CatalogImportAction } from '@/src/types/analytics/import';

const EMPTY_PREVIEW: CatalogImportPreview = {
  required_system_tables: [],
  tables: [],
  pipelines: [],
  env_specific: [],
  validation_errors: [],
};

describe('AnalyticsImportNotices', () => {
  const renderNotices = (preview: CatalogImportPreview, isAccessIncluded: boolean) =>
    render(
      <AnalyticsImportNotices
        preview={preview}
        isAccessIncluded={isAccessIncluded}
        isReusedNamesAcknowledged={false}
        onChangeReusedNamesAcknowledged={vi.fn()}
      />,
    );

  test('suggests Include access when an import without access finds no tables or pipelines', () => {
    renderNotices(EMPTY_PREVIEW, false);

    expect(screen.getByText(ImportI18nKey.AnalyticsNoObjectsWithoutAccess)).toBeTruthy();
  });

  test('shows no suggestion while access is included', () => {
    renderNotices(EMPTY_PREVIEW, true);

    expect(screen.queryByText(ImportI18nKey.AnalyticsNoObjectsWithoutAccess)).toBeNull();
  });

  test('shows no suggestion when the file carries a table', () => {
    renderNotices(
      { ...EMPTY_PREVIEW, tables: [{ name: 'usage_base', import_action: CatalogImportAction.CREATE }] },
      false,
    );

    expect(screen.queryByText(ImportI18nKey.AnalyticsNoObjectsWithoutAccess)).toBeNull();
  });
});
