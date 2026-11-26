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
import { ActionMenuOperationI18nKey, ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
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

  test('sends dependencies false only for a pipeline exported alone', () => {
    const request = buildCatalogExportRequest(ExportType.Custom, {
      [AnalyticsExportEntityType.PIPELINE]: [{ name: 'usage_enrich', isExportedAlone: true }, { name: 'usage_daily' }],
      [AnalyticsExportEntityType.TABLE]: [{ name: 'usage_base', isExportedAlone: true }],
    });

    expect(request.components).toEqual([
      { type: CatalogComponentType.PIPELINE, name: 'usage_enrich', dependencies: false },
      { type: CatalogComponentType.PIPELINE, name: 'usage_daily' },
      { type: CatalogComponentType.TABLE, name: 'usage_base' },
    ]);
  });

  test('sends access_only and roles only on table rows', () => {
    const request = buildCatalogExportRequest(
      ExportType.Custom,
      {
        [AnalyticsExportEntityType.TABLE]: [{ name: 'usage_base', isAccessOnly: true, accessRoles: ['analysts'] }],
        [AnalyticsExportEntityType.PIPELINE]: [{ name: 'usage_enrich', isAccessOnly: true, accessRoles: ['analysts'] }],
      },
      true,
    );

    expect(request.components).toEqual([
      { type: CatalogComponentType.TABLE, name: 'usage_base', access_only: true, roles: ['analysts'] },
      { type: CatalogComponentType.PIPELINE, name: 'usage_enrich' },
    ]);
  });

  test('sends no roles for a table left on all roles', () => {
    const request = buildCatalogExportRequest(
      ExportType.Custom,
      { [AnalyticsExportEntityType.TABLE]: [{ name: 'usage_base', isAccessOnly: true, accessRoles: [] }] },
      true,
    );

    expect(request.components).toEqual([{ type: CatalogComponentType.TABLE, name: 'usage_base', access_only: true }]);
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
  const noop = () => undefined;
  const colIds = (columns: ReturnType<typeof getAnalyticsColDefs>) => columns.map(({ colId }) => colId);
  const actionIds = (columns: ReturnType<typeof getAnalyticsColDefs>) =>
    (columns.at(-1)?.cellRendererParams?.items ?? []).map(({ id }: { id: string }) => id);

  test('adds the action column only when a remove handler is given', () => {
    expect(getAnalyticsColDefs(t, AnalyticsExportEntityType.TABLE, false)).toHaveLength(2);
    expect(getAnalyticsColDefs(t, AnalyticsExportEntityType.TABLE, false, noop)).toHaveLength(3);
  });

  test('adds the Dependencies column and Edit to pipeline rows with or without access', () => {
    const columns = getAnalyticsColDefs(t, AnalyticsExportEntityType.PIPELINE, false, noop, noop);

    expect(colIds(columns)).toContain('dependencies');
    expect(actionIds(columns)).toEqual([ActionMenuOperationI18nKey.Edit, ActionMenuOperationI18nKey.Remove]);
  });

  test('adds the Export and Roles columns and Edit to table rows only with access', () => {
    const withAccess = getAnalyticsColDefs(t, AnalyticsExportEntityType.TABLE, true, noop, noop);
    const withoutAccess = getAnalyticsColDefs(t, AnalyticsExportEntityType.TABLE, false, noop, noop);

    expect(colIds(withAccess)).toEqual(expect.arrayContaining(['export', 'roles']));
    expect(actionIds(withAccess)).toContain(ActionMenuOperationI18nKey.Edit);
    expect(colIds(withoutAccess)).not.toContain('export');
    expect(actionIds(withoutAccess)).toEqual([ActionMenuOperationI18nKey.Remove]);
  });

  test('shows no option columns in the Add modal, which passes no remove handler', () => {
    expect(colIds(getAnalyticsColDefs(t, AnalyticsExportEntityType.PIPELINE, true))).not.toContain('dependencies');
  });

  test('reads the row options as cell values', () => {
    const [dependencies] = getAnalyticsColDefs(t, AnalyticsExportEntityType.PIPELINE, true, noop, noop).filter(
      ({ colId }) => colId === 'dependencies',
    );
    const tableColumns = getAnalyticsColDefs(t, AnalyticsExportEntityType.TABLE, true, noop, noop);
    const value = (colId: string, data: object) =>
      (tableColumns.find((column) => column.colId === colId)?.valueGetter as (p: { data: object }) => string)({ data });

    expect((dependencies.valueGetter as (p: { data: object }) => string)({ data: { isExportedAlone: true } })).toBe(
      ExportI18nKey.AnalyticsPipelineOnly,
    );
    expect(value('export', { isAccessOnly: true })).toBe(ExportI18nKey.AnalyticsAccessOnly);
    expect(value('export', {})).toBe(ExportI18nKey.AnalyticsTableAndAccess);
    expect(value('roles', { accessRoles: ['a', 'b'] })).toBe('a, b');
    expect(value('roles', {})).toBe(ExportI18nKey.AnalyticsAllRolesValue);
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
