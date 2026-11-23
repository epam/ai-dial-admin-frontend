import { TabStatus } from '@epam/ai-dial-ui-kit';
import { describe, expect, test } from 'vitest';

import {
  buildCatalogExportRequest,
  getAnalyticsColDefs,
  getAnalyticsPreviewColDefs,
  getAnalyticsPreviewRows,
  getAnalyticsPreviewTabs,
  getAnalyticsTabs,
} from '@/src/components/ExportConfig/analytics-utils';
import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { TableGrantKey } from '@/src/models/analytics/table';
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

  test('adds include_access to a full export only when access is included', () => {
    expect(buildCatalogExportRequest(ExportType.Full, {}, true)).toEqual({ components: [], include_access: true });
    expect(buildCatalogExportRequest(ExportType.Full, {}, false)).not.toHaveProperty('include_access');
  });

  test('adds include_access to a custom export only when access is included', () => {
    const data = { [AnalyticsExportEntityType.TABLE]: [{ name: 'dial_usage_log' }] };

    expect(buildCatalogExportRequest(ExportType.Custom, data, true)).toEqual({
      components: [{ type: CatalogComponentType.TABLE, name: 'dial_usage_log' }],
      include_access: true,
    });
    expect(buildCatalogExportRequest(ExportType.Custom, data)).not.toHaveProperty('include_access');
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
    [AnalyticsExportPreviewTab.REQUIRED_SYSTEM_TABLES, ['name', 'reason']],
    [AnalyticsExportPreviewTab.ACCESS, ['table', 'role', 'outcome', 'detail']],
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
    const rows = getAnalyticsPreviewRows({ objects, required_system_tables: [], skipped: [] }, t);

    expect(rows[AnalyticsExportPreviewTab.OBJECTS]).toEqual(objects);
    expect(rows[AnalyticsExportPreviewTab.SKIPPED]).toEqual([]);
  });
});

describe('getAnalyticsPreviewRows — access', () => {
  const preview = {
    objects: [],
    required_system_tables: [],
    skipped: [],
    access: [
      {
        table: 'dial_usage_log',
        roles: ['analytics-viewers'],
        left_behind: [
          {
            role: 'writers',
            entry: { privileges: [TableGrantKey.Write], rows: null, columns: ['model'] },
            error: 'table_is_system',
          },
        ],
      },
    ],
  };

  test('flattens exported roles and left-behind entries into one row each', () => {
    expect(getAnalyticsPreviewRows(preview, t)[AnalyticsExportPreviewTab.ACCESS]).toEqual([
      {
        table: 'dial_usage_log',
        role: 'analytics-viewers',
        outcome: ExportI18nKey.AnalyticsAccessExported,
        isWarning: false,
      },
      {
        table: 'dial_usage_log',
        role: 'writers',
        outcome: ExportI18nKey.AnalyticsAccessLeftBehind,
        detail: `table_is_system: ${TableGrantKey.Write}, ${ExportI18nKey.AnalyticsColumnPolicy}`,
        isWarning: true,
      },
    ]);
  });

  test('leaves the access rows out when the preview carries no access', () => {
    expect(getAnalyticsPreviewRows({ ...preview, access: undefined }, t)).not.toHaveProperty(
      AnalyticsExportPreviewTab.ACCESS,
    );
  });
});

describe('getAnalyticsPreviewTabs', () => {
  test('hides the Access tab when there are no access rows', () => {
    expect(getAnalyticsPreviewTabs(t, {}).map(({ id }) => id)).not.toContain(AnalyticsExportPreviewTab.ACCESS);
  });

  test('counts the access rows and warns about a left-behind one', () => {
    const tabs = getAnalyticsPreviewTabs(t, {
      [AnalyticsExportPreviewTab.ACCESS]: [
        { table: 'a', role: 'r1', outcome: 'x', isWarning: false },
        { table: 'a', role: 'r2', outcome: 'y', isWarning: true },
      ],
    });
    const access = tabs.find(({ id }) => id === AnalyticsExportPreviewTab.ACCESS);

    expect(access?.label).toBe(`${ExportI18nKey.AnalyticsAccess} (2)`);
    expect(access?.status).toBe(TabStatus.Warning);
  });
});
