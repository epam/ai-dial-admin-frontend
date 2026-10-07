import { describe, expect, test } from 'vitest';

import {
  buildCatalogExportRequest,
  getAnalyticsColDefs,
  getAnalyticsPreviewColDefs,
  getAnalyticsPreviewRows,
  getAnalyticsTabs,
} from '@/src/components/ExportConfig/analytics-utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { ExportType } from '@/src/types/export';
import {
  AnalyticsExportEntityType,
  AnalyticsExportPreviewTab,
  CatalogComponentType,
} from '@/src/types/analytics/export';

const t = (key: string) => key;

describe('buildCatalogExportRequest', () => {
  test('maps each Analytics tab to its component type and ignores other scopes', () => {
    const request = buildCatalogExportRequest(ExportType.Custom, {
      [AnalyticsExportEntityType.TABLE]: [{ name: 'usage_sentiment' }],
      [AnalyticsExportEntityType.PIPELINE]: [{ name: 'usage_enrich' }, { name: 'usage_daily' }],
      [DeploymentExportEntityType.IMAGE]: [{ name: 'image-1' }],
    });

    expect(request).toEqual({
      components: [
        { type: CatalogComponentType.TABLE, name: 'usage_sentiment' },
        { type: CatalogComponentType.PIPELINE, name: 'usage_enrich' },
        { type: CatalogComponentType.PIPELINE, name: 'usage_daily' },
      ],
    });
  });

  test('returns no components for an empty selection', () => {
    expect(buildCatalogExportRequest(ExportType.Custom, {})).toEqual({ components: [] });
  });

  test('sends an empty selection for a full export whatever was picked, which the service reads as everything', () => {
    expect(
      buildCatalogExportRequest(ExportType.Full, { [AnalyticsExportEntityType.TABLE]: [{ name: 'usage_sentiment' }] }),
    ).toEqual({ components: [] });
  });
});

describe('getAnalyticsTabs', () => {
  test('offers Tables then Pipelines', () => {
    expect(getAnalyticsTabs(t)).toEqual([
      { id: AnalyticsExportEntityType.TABLE, label: MenuI18nKey.Tables },
      { id: AnalyticsExportEntityType.PIPELINE, label: MenuI18nKey.Pipelines },
    ]);
  });
});

describe('getAnalyticsColDefs', () => {
  test('adds the action column only when a remove handler is given', () => {
    expect(getAnalyticsColDefs()).toHaveLength(2);
    expect(getAnalyticsColDefs(() => undefined)).toHaveLength(3);
  });
});

describe('getAnalyticsPreviewColDefs', () => {
  test.each([
    [AnalyticsExportPreviewTab.OBJECTS, ['type', 'name', 'description', 'reason']],
    [AnalyticsExportPreviewTab.REQUIRED_SYSTEM_TABLES, ['name']],
    [AnalyticsExportPreviewTab.SKIPPED, ['type', 'name', 'reason']],
  ])('shows the %s fields', (tab, fields) => {
    expect(getAnalyticsPreviewColDefs(t, tab).map(({ field }) => field)).toEqual(fields);
  });
});

describe('getAnalyticsPreviewRows', () => {
  test('keeps the service order and reasons as returned', () => {
    const objects = [
      { type: CatalogComponentType.TABLE, name: 'usage_source', reason: 'source_table of usage_sentiment' },
      { type: CatalogComponentType.TABLE, name: 'usage_sentiment', reason: 'selected' },
    ];
    const rows = getAnalyticsPreviewRows({ objects, required_system_tables: [], skipped: [] });

    expect(rows[AnalyticsExportPreviewTab.OBJECTS]).toEqual(objects);
    expect(rows[AnalyticsExportPreviewTab.SKIPPED]).toEqual([]);
  });
});
